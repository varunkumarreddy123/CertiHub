// User Types
export type UserRole = 'user' | 'admin' | 'superadmin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  isVerified?: boolean;
  institutionName?: string;
  institutionAddress?: string;
  walletAddress?: string;
}

// Certificate Types
export interface Certificate {
  id: string;
  uniqueId: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  institutionName: string;
  institutionId: string;
  issueDate: string;
  expiryDate?: string;
  grade?: string;
  description?: string;
  ipfsHash?: string;
  blockchainTxHash?: string;
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  updatedAt?: string;
}

// Blockchain Types
export interface BlockchainRecord {
  certificateId: string;
  uniqueId: string;
  studentName: string;
  courseName: string;
  institutionName: string;
  issueDate: string;
  hash: string;
  timestamp: number;
  blockNumber?: number;
}

// Verification Result
export interface VerificationResult {
  isValid: boolean;
  certificate?: Certificate;
  blockchainRecord?: BlockchainRecord;
  message: string;
  verifiedAt: string;
}

// Institution Application
export interface InstitutionApplication {
  id: string;
  userId: string;
  institutionName: string;
  institutionAddress: string;
  registrationNumber: string;
  website?: string;
  contactEmail: string;
  contactPhone: string;
  documents?: string[];
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  institutionName?: string;
  institutionAddress?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalCertificates: number;
  totalInstitutions: number;
  totalUsers: number;
  pendingApplications: number;
  verifiedThisMonth: number;
}

// Activity Log
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  type: 'certificate' | 'institution' | 'verification' | 'system';
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants: {
    id: string;
    name: string;
    role: UserRole;
    institutionName?: string;
  }[];
  subject: string;
  category: 'general' | 'certificate_issue' | 'verification_help' | 'account_help' | 'technical_support' | 'other';
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'open' | 'closed';
}
