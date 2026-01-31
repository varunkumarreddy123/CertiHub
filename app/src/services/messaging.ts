import type { Message, Conversation, User } from '@/types';
import { authService } from './auth';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

const CONVERSATIONS_KEY = 'certichain_conversations';
const MESSAGES_KEY = 'certichain_messages';

async function getParticipantProfiles(ids: string[]): Promise<{ id: string; name: string; role: User['role']; institutionName?: string }[]> {
  if (!supabase || ids.length === 0) return [];
  const { data } = await supabase.from('profiles').select('id, name, role, institution_name').in('id', ids);
  return (data ?? []).map((p: { id: string; name: string; role: string; institution_name: string | null }) => ({
    id: p.id,
    name: p.name,
    role: p.role as User['role'],
    institutionName: p.institution_name ?? undefined,
  }));
}

export const messagingService = {
  startConversation: (
    recipientId: string,
    subject: string,
    category: Conversation['category'] = 'general'
  ): Conversation => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    const recipient = authService.getUserById(recipientId);
    if (!recipient) throw new Error('Recipient not found');
    const conversations: Conversation[] = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]');
    const existingConv = conversations.find(c =>
      c.participantIds.includes(currentUser.id) && c.participantIds.includes(recipientId) && c.subject === subject
    );
    if (existingConv) return existingConv;
    const conversation: Conversation = {
      id: `conv-${Date.now()}`,
      participantIds: [currentUser.id, recipientId],
      participants: [
        { id: currentUser.id, name: currentUser.name, role: currentUser.role, institutionName: currentUser.institutionName },
        { id: recipient.id, name: recipient.name, role: recipient.role, institutionName: recipient.institutionName },
      ],
      subject,
      category,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'open',
    };
    conversations.push(conversation);
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    return conversation;
  },

  async startConversationAsync(
    recipientId: string,
    subject: string,
    category: Conversation['category'] = 'general'
  ): Promise<Conversation> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    const recipient = await authService.getUserByIdAsync(recipientId);
    if (!recipient) throw new Error('Recipient not found');

    if (isSupabaseEnabled() && supabase) {
      const participantIds = [currentUser.id, recipientId].sort();
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', participantIds)
        .eq('subject', subject)
        .limit(1)
        .maybeSingle();
      if (existing) {
        const participants = await getParticipantProfiles(existing.participant_ids);
        return {
          id: existing.id,
          participantIds: existing.participant_ids,
          participants,
          subject: existing.subject,
          category: existing.category as Conversation['category'],
          unreadCount: existing.unread_count,
          createdAt: existing.created_at,
          updatedAt: existing.updated_at,
          status: existing.status as 'open' | 'closed',
        };
      }
      const now = new Date().toISOString();
      const { data: inserted, error } = await supabase
        .from('conversations')
        .insert({
          subject,
          category,
          participant_ids: participantIds,
          status: 'open',
          unread_count: 0,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      const participants = await getParticipantProfiles(inserted.participant_ids);
      return {
        id: inserted.id,
        participantIds: inserted.participant_ids,
        participants,
        subject: inserted.subject,
        category: inserted.category as Conversation['category'],
        unreadCount: inserted.unread_count,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
        status: inserted.status as 'open' | 'closed',
      };
    }
    return this.startConversation(recipientId, subject, category);
  },

  sendMessage: (conversationId: string, content: string): Message => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    const conversations: Conversation[] = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]');
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) throw new Error('Conversation not found');
    const recipient = conversation.participants.find(p => p.id !== currentUser.id);
    if (!recipient) throw new Error('Recipient not found');
    const message: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      recipientId: recipient.id,
      recipientName: recipient.name,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    const messages: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    messages.push(message);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    const convIndex = conversations.findIndex(c => c.id === conversationId);
    conversations[convIndex].lastMessage = message;
    conversations[convIndex].updatedAt = message.timestamp;
    if (recipient.id !== currentUser.id) conversations[convIndex].unreadCount += 1;
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    return message;
  },

  async sendMessageAsync(conversationId: string, content: string): Promise<Message> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    if (isSupabaseEnabled() && supabase) {
      const { data: conv } = await supabase.from('conversations').select('participant_ids').eq('id', conversationId).single();
      if (!conv) throw new Error('Conversation not found');
      const recipientId = conv.participant_ids.find((id: string) => id !== currentUser.id);
      if (!recipientId) throw new Error('Recipient not found');
      const { data: recipient } = await supabase.from('profiles').select('id, name').eq('id', recipientId).single();
      const now = new Date().toISOString();
      const { data: msg, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          sender_name: currentUser.name,
          sender_role: currentUser.role,
          recipient_id: recipientId,
          recipient_name: recipient?.name ?? 'User',
          content,
          timestamp: now,
          is_read: false,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      const { data: convRow } = await supabase.from('conversations').select('unread_count').eq('id', conversationId).single();
      const newUnread = (convRow?.unread_count ?? 0) + 1;
      await supabase.from('conversations').update({ updated_at: now, unread_count: newUnread }).eq('id', conversationId);
      return {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        senderRole: msg.sender_role as User['role'],
        recipientId: msg.recipient_id,
        recipientName: msg.recipient_name,
        content: msg.content,
        timestamp: msg.timestamp,
        isRead: msg.is_read,
      };
    }
    return this.sendMessage(conversationId, content);
  },

  getConversations: (): Conversation[] => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return [];
    if (isSupabaseEnabled()) return [];
    const conversations: Conversation[] = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]');
    return conversations
      .filter(c => c.participantIds.includes(currentUser.id))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getConversationsAsync(): Promise<Conversation[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return [];

    if (isSupabaseEnabled() && supabase) {
      const { data: rows } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [currentUser.id])
        .order('updated_at', { ascending: false });
      if (!rows?.length) return [];
      const convs: Conversation[] = [];
      for (const r of rows) {
        const participants = await getParticipantProfiles(r.participant_ids);
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', r.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();
        convs.push({
          id: r.id,
          participantIds: r.participant_ids,
          participants,
          subject: r.subject,
          category: r.category as Conversation['category'],
          unreadCount: r.unread_count,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          status: r.status as 'open' | 'closed',
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                conversationId: lastMsg.conversation_id,
                senderId: lastMsg.sender_id,
                senderName: lastMsg.sender_name,
                senderRole: lastMsg.sender_role as User['role'],
                recipientId: lastMsg.recipient_id,
                recipientName: lastMsg.recipient_name,
                content: lastMsg.content,
                timestamp: lastMsg.timestamp,
                isRead: lastMsg.is_read,
              }
            : undefined,
        });
      }
      return convs;
    }
    return this.getConversations();
  },

  getMessages: (conversationId: string): Message[] => {
    if (isSupabaseEnabled()) return [];
    const messages: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    return messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  async getMessagesAsync(conversationId: string): Promise<Message[]> {
    if (isSupabaseEnabled() && supabase) {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });
      return (data ?? []).map((m: { id: string; conversation_id: string; sender_id: string; sender_name: string; sender_role: string; recipient_id: string; recipient_name: string; content: string; timestamp: string; is_read: boolean }) => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderRole: m.sender_role as User['role'],
        recipientId: m.recipient_id,
        recipientName: m.recipient_name,
        content: m.content,
        timestamp: m.timestamp,
        isRead: m.is_read,
      }));
    }
    return this.getMessages(conversationId);
  },

  markAsRead: (conversationId: string): void => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;
    if (isSupabaseEnabled() && supabase) {
      supabase.from('conversations').update({ unread_count: 0 }).eq('id', conversationId);
      supabase.from('messages').update({ is_read: true }).eq('conversation_id', conversationId).eq('recipient_id', currentUser.id);
      return;
    }
    const conversations: Conversation[] = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]');
    const convIndex = conversations.findIndex(c => c.id === conversationId);
    if (convIndex === -1) return;
    conversations[convIndex].unreadCount = 0;
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    const messages: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    messages.forEach(m => {
      if (m.conversationId === conversationId && m.recipientId === currentUser.id) m.isRead = true;
    });
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  },

  getUnreadCount: (): number => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return 0;
    if (isSupabaseEnabled()) return 0;
    const conversations: Conversation[] = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]');
    return conversations.filter(c => c.participantIds.includes(currentUser.id)).reduce((total, c) => total + c.unreadCount, 0);
  },

  async getUnreadCountAsync(): Promise<number> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return 0;
    if (isSupabaseEnabled() && supabase) {
      const { data } = await supabase.from('conversations').select('unread_count').contains('participant_ids', [currentUser.id]);
      return (data ?? []).reduce((sum: number, c: { unread_count?: number }) => sum + (c.unread_count ?? 0), 0);
    }
    return this.getUnreadCount();
  },

  closeConversation: (conversationId: string): void => {
    if (isSupabaseEnabled() && supabase) {
      supabase.from('conversations').update({ status: 'closed' }).eq('id', conversationId);
      return;
    }
    const conversations: Conversation[] = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]');
    const convIndex = conversations.findIndex(c => c.id === conversationId);
    if (convIndex === -1) return;
    conversations[convIndex].status = 'closed';
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  },

  getAvailableRecipients: (): User[] => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return [];
    if (isSupabaseEnabled()) return [];
    const allUsers = authService.getAllUsers();
    switch (currentUser.role) {
      case 'user':
        return allUsers.filter(u => (u.role === 'admin' && u.isVerified) || u.role === 'superadmin');
      case 'admin':
        return allUsers.filter(u => u.role === 'superadmin' || u.role === 'user');
      case 'superadmin':
        return allUsers.filter(u => u.id !== currentUser.id);
      default:
        return [];
    }
  },

  async getAvailableRecipientsAsync(): Promise<User[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return [];
    const allUsers = await authService.getAllUsersAsync();
    switch (currentUser.role) {
      case 'user':
        return allUsers.filter(u => (u.role === 'admin' && u.isVerified) || u.role === 'superadmin');
      case 'admin':
        return allUsers.filter(u => u.role === 'superadmin' || u.role === 'user');
      case 'superadmin':
        return allUsers.filter(u => u.id !== currentUser.id);
      default:
        return [];
    }
  },

  getCategoryLabel: (category: Conversation['category']): string => {
    const labels: Record<string, string> = {
      general: 'General Inquiry',
      certificate_issue: 'Certificate Issue',
      verification_help: 'Verification Help',
      account_help: 'Account Help',
      technical_support: 'Technical Support',
      other: 'Other',
    };
    return labels[category] || 'General';
  },

  deleteConversation: (conversationId: string): void => {
    if (isSupabaseEnabled() && supabase) {
      supabase.from('messages').delete().eq('conversation_id', conversationId);
      supabase.from('conversations').delete().eq('id', conversationId);
      return;
    }
    const conversations: Conversation[] = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]');
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations.filter(c => c.id !== conversationId)));
    const messages: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages.filter(m => m.conversationId !== conversationId)));
  },
};
