import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { messagingService } from '@/services/messaging';
import type { Conversation, Message, User } from '@/types';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  User as UserIcon, 
  Building2, 
  Shield,
  Check,
  CheckCheck,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface HelpSupportProps {
  compact?: boolean;
}

export default function HelpSupport({ compact = false }: HelpSupportProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [recipients, setRecipients] = useState<User[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<Conversation['category']>('general');
  const [initialMessage, setInitialMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      (async () => {
        const [convs, availableRecipients, unread] = await Promise.all([
          messagingService.getConversationsAsync(),
          messagingService.getAvailableRecipientsAsync(),
          messagingService.getUnreadCountAsync(),
        ]);
        setConversations(convs);
        setRecipients(availableRecipients);
        setUnreadCount(unread);
      })();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      messagingService.markAsRead(selectedConversation.id);
      loadMessages(selectedConversation.id);
      messagingService.getUnreadCountAsync().then(setUnreadCount);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    const convs = await messagingService.getConversationsAsync();
    setConversations(convs);
    const unread = await messagingService.getUnreadCountAsync();
    setUnreadCount(unread);
  };

  const loadMessages = async (conversationId: string) => {
    const msgs = await messagingService.getMessagesAsync(conversationId);
    setMessages(msgs);
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;
    await messagingService.sendMessageAsync(selectedConversation.id, newMessage);
    setNewMessage('');
    await loadMessages(selectedConversation.id);
    await loadConversations();
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedConversation) return;
    try {
      await messagingService.deleteMessageAsync(messageId);
      await loadMessages(selectedConversation.id);
      await loadConversations();
      toast.success('Message deleted');
    } catch (e) {
      toast.error('Failed to delete message');
    }
  };

  const handleStartConversation = async () => {
    if (!selectedRecipient || !subject.trim() || !initialMessage.trim()) return;
    const conversation = await messagingService.startConversationAsync(selectedRecipient, subject, category);
    await messagingService.sendMessageAsync(conversation.id, initialMessage);
    setIsNewConversationOpen(false);
    setSelectedRecipient('');
    setSubject('');
    setInitialMessage('');
    setCategory('general');
    await loadConversations();
    setSelectedConversation(conversation);
  };

  const getCategoryColor = (cat: Conversation['category']) => {
    const colors: Record<string, string> = {
      general: 'bg-gray-500/20 text-gray-400',
      certificate_issue: 'bg-red-500/20 text-red-400',
      verification_help: 'bg-blue-500/20 text-blue-400',
      account_help: 'bg-green-500/20 text-green-400',
      technical_support: 'bg-purple-500/20 text-purple-400',
      other: 'bg-orange-500/20 text-orange-400',
    };
    return colors[cat] || colors.general;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Building2 className="h-4 w-4" />;
      case 'superadmin':
        return <Shield className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Institution';
      case 'superadmin':
        return 'Support';
      default:
        return 'Student';
    }
  };

  if (compact) {
    return (
      <div className="bg-[#1A1A1A] rounded-xl border border-[#4A4A4A]/50 h-[500px] flex">
        {/* Conversations List */}
        <div className="w-64 border-r border-[#4A4A4A]/50 flex flex-col">
          <div className="p-4 border-b border-[#4A4A4A]/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#F5F5F5]">Messages</h3>
              {unreadCount > 0 && (
                <Badge className="bg-[#D4AF37] text-black">{unreadCount}</Badge>
              )}
            </div>
          </div>
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-[#F5F5F5]/50">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const otherParticipant = conv.participants.find(p => p.id !== user?.id);
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-3 text-left border-b border-[#4A4A4A]/30 hover:bg-[#4A4A4A]/20 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-[#D4AF37]/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37] text-xs">
                          {otherParticipant?.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-[#F5F5F5]">{otherParticipant?.name}</p>
                        <p className="text-xs text-[#F5F5F5]/50 truncate">{conv.subject}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-[#D4AF37] text-black text-xs">{conv.unreadCount}</Badge>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </ScrollArea>
          <div className="p-3 border-t border-[#4A4A4A]/50">
            <Button 
              onClick={() => setIsNewConversationOpen(true)} 
              className="w-full bg-[#D4AF37] text-black hover:bg-[#C4A030]"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-3 border-b border-[#4A4A4A]/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37]">
                      {selectedConversation.participants.find(p => p.id !== user?.id)?.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-[#F5F5F5]">
                      {selectedConversation.participants.find(p => p.id !== user?.id)?.name}
                    </p>
                    <p className="text-xs text-[#F5F5F5]/50">{selectedConversation.subject}</p>
                  </div>
                </div>
                <Badge className={getCategoryColor(selectedConversation.category)}>
                  {messagingService.getCategoryLabel(selectedConversation.category)}
                </Badge>
              </div>

              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMine = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
                        <div className={`relative max-w-[80%] rounded-lg p-2 text-sm ${
                          isMine ? 'bg-[#D4AF37] text-black' : 'bg-[#4A4A4A]/50 text-[#F5F5F5]'
                        }`}>
                          <p>{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-1 text-xs ${isMine ? 'text-black/60' : 'text-[#F5F5F5]/50'}`}>
                            <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            {isMine && (msg.isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                            {isMine && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="ml-2 p-0.5 rounded hover:bg-black/20 text-black/70 hover:text-black"
                                title="Delete message"
                                type="button"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="p-3 border-t border-[#4A4A4A]/50">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type message..."
                    className="flex-1 bg-[#4A4A4A]/20 border-[#4A4A4A] text-[#F5F5F5] placeholder:text-[#F5F5F5]/30"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="bg-[#D4AF37] text-black hover:bg-[#C4A030]">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#F5F5F5]/50">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Select a conversation</p>
              </div>
            </div>
          )}
        </div>

        {/* New Conversation Dialog */}
        <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
          <DialogContent className="bg-[#1A1A1A] border-[#4A4A4A] text-[#F5F5F5]">
            <DialogHeader>
              <DialogTitle>New Conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#F5F5F5]/70 mb-1 block">Recipient</label>
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger className="bg-[#4A4A4A]/20 border-[#4A4A4A] text-[#F5F5F5]">
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#4A4A4A]">
                    {recipients.map((recipient) => (
                      <SelectItem key={recipient.id} value={recipient.id} className="text-[#F5F5F5]">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(recipient.role)}
                          <span>{recipient.name}</span>
                          <span className="text-xs text-[#F5F5F5]/50">({getRoleLabel(recipient.role)})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-[#F5F5F5]/70 mb-1 block">Category</label>
                <Select value={category} onValueChange={(v) => setCategory(v as Conversation['category'])}>
                  <SelectTrigger className="bg-[#4A4A4A]/20 border-[#4A4A4A] text-[#F5F5F5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#4A4A4A]">
                    <SelectItem value="general" className="text-[#F5F5F5]">General Inquiry</SelectItem>
                    <SelectItem value="certificate_issue" className="text-[#F5F5F5]">Certificate Issue</SelectItem>
                    <SelectItem value="verification_help" className="text-[#F5F5F5]">Verification Help</SelectItem>
                    <SelectItem value="account_help" className="text-[#F5F5F5]">Account Help</SelectItem>
                    <SelectItem value="technical_support" className="text-[#F5F5F5]">Technical Support</SelectItem>
                    <SelectItem value="other" className="text-[#F5F5F5]">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-[#F5F5F5]/70 mb-1 block">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject"
                  className="bg-[#4A4A4A]/20 border-[#4A4A4A] text-[#F5F5F5] placeholder:text-[#F5F5F5]/30"
                />
              </div>
              <div>
                <label className="text-sm text-[#F5F5F5]/70 mb-1 block">Message</label>
                <Textarea
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className="bg-[#4A4A4A]/20 border-[#4A4A4A] text-[#F5F5F5] placeholder:text-[#F5F5F5]/30"
                />
              </div>
              <Button
                onClick={handleStartConversation}
                disabled={!selectedRecipient || !subject.trim() || !initialMessage.trim()}
                className="w-full bg-[#D4AF37] text-black hover:bg-[#C4A030]"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full page version
  return (
    <div className="min-h-screen bg-[#1A1A1A] pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#F5F5F5]">Help & Support</h1>
          <p className="text-[#F5F5F5]/70 mt-1">Get help or contact institutions and support</p>
        </div>

        <div className="bg-[#1A1A1A] rounded-xl border border-[#4A4A4A]/50 h-[600px] flex">
          {/* Conversations List */}
          <div className="w-80 border-r border-[#4A4A4A]/50 flex flex-col">
            <div className="p-4 border-b border-[#4A4A4A]/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#F5F5F5]">Conversations</h3>
                <Button 
                  onClick={() => setIsNewConversationOpen(true)} 
                  className="bg-[#D4AF37] text-black hover:bg-[#C4A030]"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-[#F5F5F5]/50">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Start a new conversation</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherParticipant = conv.participants.find(p => p.id !== user?.id);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left border-b border-[#4A4A4A]/30 hover:bg-[#4A4A4A]/20 transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-[#D4AF37]/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37]">
                            {otherParticipant?.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate text-[#F5F5F5]">{otherParticipant?.name}</span>
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-[#D4AF37] text-black">{conv.unreadCount}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-[#F5F5F5]/50 truncate">{conv.subject}</p>
                          {conv.lastMessage && (
                            <p className="text-xs text-[#F5F5F5]/40 truncate mt-1">
                              {conv.lastMessage.content.substring(0, 40)}...
                            </p>
                          )}
                          <Badge className={`mt-2 text-xs ${getCategoryColor(conv.category)}`}>
                            {messagingService.getCategoryLabel(conv.category)}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-[#4A4A4A]/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37]">
                        {selectedConversation.participants.find(p => p.id !== user?.id)?.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-[#F5F5F5]">
                        {selectedConversation.participants.find(p => p.id !== user?.id)?.name}
                      </h4>
                      <p className="text-sm text-[#F5F5F5]/50">{selectedConversation.subject}</p>
                    </div>
                  </div>
                  <Badge className={getCategoryColor(selectedConversation.category)}>
                    {messagingService.getCategoryLabel(selectedConversation.category)}
                  </Badge>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-lg p-3 ${
                            isMine ? 'bg-[#D4AF37] text-black' : 'bg-[#4A4A4A]/50 text-[#F5F5F5]'
                          }`}>
                            <p>{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 text-xs ${isMine ? 'text-black/60' : 'text-[#F5F5F5]/50'}`}>
                              <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                              {isMine && (msg.isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                              {isMine && (
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="ml-2 p-0.5 rounded hover:bg-black/20 text-black/70 hover:text-black"
                                  title="Delete message"
                                  type="button"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-[#4A4A4A]/50">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-[#4A4A4A]/20 border-[#4A4A4A] text-[#F5F5F5] placeholder:text-[#F5F5F5]/30"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="bg-[#D4AF37] text-black hover:bg-[#C4A030]">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#F5F5F5]/50">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Select a conversation</p>
                  <p className="text-sm mt-1">Choose a conversation to view messages</p>
                  <Button
                    variant="outline"
                    className="mt-4 border-[#4A4A4A] text-[#F5F5F5] hover:bg-[#4A4A4A]/50"
                    onClick={() => setIsNewConversationOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Start New Conversation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Conversation Dialog */}
        <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
          <DialogContent className="bg-[#1A1A1A] border-[#4A4A4A] text-[#F5F5F5]">
            <DialogHeader>
              <DialogTitle>Start New Conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#F5F5F5]/70 mb-1 block">Recipient</label>
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger className="bg-[#4A4A4A]/20 border-[#4A4A4A] text-[#F5F5F5]">
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#4A4A4A]">
                    {recipients.map((recipient) => (
                      <SelectItem key={recipient.id} value={recipient.id} className="text-[#F5F5F5]">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(recipient.role)}
                          <span>{recipient.name}</span>
                          <span className="text-xs text-[#F5F5F5]/50">({getRoleLabel(recipient.role)})</span>
                          {recipient.institutionName && (
                            <span className="text-xs text-[#F5F5F5]/40">- {recipient.institutionName}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-[#F5F5F5]/70 mb-1 block">Category</label>
                <Select value={category} onValueChange={(v) => setCategory(v as Conversation['category'])}>
                  <SelectTrigger className="bg-[#4A4A4A]/20 border-[#4A4A4A] text-[#F5F5F5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#4A4A4A]">
                    <SelectItem value="general" className="text-[#F5F5F5]">General Inquiry</SelectItem>
                    <SelectItem value="certificate_issue" className="text-[#F5F5F5]">Certificate Issue</SelectItem>
                    <SelectItem value="verification_help" className="text-[#F5F5F5]">Verification Help</SelectItem>
                    <SelectItem value="account_help" className="text-[#F5F5F5]">Account Help</SelectItem>
                    <SelectItem value="technical_support" className="text-[#F5F5F5]">Technical Support</SelectItem>
                    <SelectItem value="other" className="text-[#F5F5F5]">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-[#F5F5F5]/70 mb-1 block">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject"
                  className="bg-[#4A4A4A]/20 border-[#4A4A4A] text-[#F5F5F5] placeholder:text-[#F5F5F5]/30"
                />
              </div>
              <div>
                <label className="text-sm text-[#F5F5F5]/70 mb-1 block">Message</label>
                <Textarea
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={4}
                  className="bg-[#4A4A4A]/20 border-[#4A4A4A] text-[#F5F5F5] placeholder:text-[#F5F5F5]/30"
                />
              </div>
              <Button
                onClick={handleStartConversation}
                disabled={!selectedRecipient || !subject.trim() || !initialMessage.trim()}
                className="w-full bg-[#D4AF37] text-black hover:bg-[#C4A030]"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export { HelpSupport };
