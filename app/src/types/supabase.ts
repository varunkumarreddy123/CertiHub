export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'user' | 'admin' | 'superadmin';
export type CertificateStatus = 'active' | 'revoked' | 'expired';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type ActivityLogType = 'certificate' | 'institution' | 'verification' | 'system';
export type ConversationCategory = 'general' | 'certificate_issue' | 'verification_help' | 'account_help' | 'technical_support' | 'other';
export type ConversationStatus = 'open' | 'closed';
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          is_verified: boolean;
          institution_name: string | null;
          institution_address: string | null;
          wallet_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          is_verified?: boolean;
          institution_name?: string | null;
          institution_address?: string | null;
          wallet_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      certificates: {
        Row: {
          id: string;
          unique_id: string;
          student_name: string;
          student_email: string;
          course_name: string;
          institution_name: string;
          institution_id: string;
          issue_date: string;
          expiry_date: string | null;
          grade: string | null;
          description: string | null;
          ipfs_hash: string | null;
          blockchain_tx_hash: string | null;
          status: CertificateStatus;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          unique_id: string;
          student_name: string;
          student_email: string;
          course_name: string;
          institution_name: string;
          institution_id: string;
          issue_date: string;
          expiry_date?: string | null;
          grade?: string | null;
          description?: string | null;
          ipfs_hash?: string | null;
          blockchain_tx_hash?: string | null;
          status?: CertificateStatus;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['certificates']['Insert']>;
      };
      institution_applications: {
        Row: {
          id: string;
          user_id: string;
          institution_name: string;
          institution_address: string;
          registration_number: string;
          website: string | null;
          contact_email: string;
          contact_phone: string;
          documents: string[] | null;
          status: ApplicationStatus;
          applied_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          institution_name: string;
          institution_address: string;
          registration_number: string;
          website?: string | null;
          contact_email: string;
          contact_phone: string;
          documents?: string[] | null;
          status?: ApplicationStatus;
          applied_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
        };
        Update: Partial<Database['public']['Tables']['institution_applications']['Insert']>;
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          user_name: string;
          action: string;
          details: string;
          type: ActivityLogType;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_name: string;
          action: string;
          details: string;
          type: ActivityLogType;
          timestamp?: string;
        };
        Update: Partial<Database['public']['Tables']['activity_logs']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          is_read: boolean;
          link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          is_read?: boolean;
          link?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      conversations: {
        Row: {
          id: string;
          subject: string;
          category: ConversationCategory;
          participant_ids: string[];
          status: ConversationStatus;
          unread_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subject: string;
          category: ConversationCategory;
          participant_ids: string[];
          status?: ConversationStatus;
          unread_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          sender_name: string;
          sender_role: UserRole;
          recipient_id: string;
          recipient_name: string;
          content: string;
          timestamp: string;
          is_read: boolean;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          sender_name: string;
          sender_role: UserRole;
          recipient_id: string;
          recipient_name: string;
          content: string;
          timestamp?: string;
          is_read?: boolean;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      blockchain_anchors: {
        Row: {
          id: string;
          certificate_id: string;
          unique_id: string;
          hash: string;
          block_number: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          certificate_id: string;
          unique_id: string;
          hash: string;
          block_number?: number | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['blockchain_anchors']['Insert']>;
      };
    };
  };
}
