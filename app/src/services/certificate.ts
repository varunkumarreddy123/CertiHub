import type { Certificate, User, ActivityLog, DashboardStats } from '@/types';
import { blockchainService } from './blockchain';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const CERTIFICATES_KEY = 'certichain_certificates';
const ACTIVITY_LOG_KEY = 'certichain_activity_log';

function mapRowToCertificate(row: {
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
  status: 'active' | 'revoked' | 'expired';
  created_at: string;
  updated_at: string | null;
}): Certificate {
  return {
    id: row.id,
    uniqueId: row.unique_id,
    studentName: row.student_name,
    studentEmail: row.student_email,
    courseName: row.course_name,
    institutionName: row.institution_name,
    institutionId: row.institution_id,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date ?? undefined,
    grade: row.grade ?? undefined,
    description: row.description ?? undefined,
    ipfsHash: row.ipfs_hash ?? undefined,
    blockchainTxHash: row.blockchain_tx_hash ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

class CertificateService {
  private certificates: Certificate[] = [];
  private activityLog: ActivityLog[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    const storedCerts = localStorage.getItem(CERTIFICATES_KEY);
    if (storedCerts) this.certificates = JSON.parse(storedCerts);
    const storedLogs = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (storedLogs) this.activityLog = JSON.parse(storedLogs);
  }

  private saveCertificates() {
    localStorage.setItem(CERTIFICATES_KEY, JSON.stringify(this.certificates));
  }

  private saveActivityLog() {
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(this.activityLog));
  }

  private addActivityLog(user: User, action: string, details: string, type: ActivityLog['type']) {
    const log: ActivityLog = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      action,
      details,
      timestamp: new Date().toISOString(),
      type,
    };
    if (isSupabaseEnabled() && supabase) {
      void supabase.from('activity_logs').insert({
        id: log.id,
        user_id: user.id,
        user_name: user.name,
        action,
        details,
        type,
        timestamp: log.timestamp,
      });
    } else {
      this.activityLog.unshift(log);
      this.saveActivityLog();
    }
  }

  async createCertificate(
    certificateData: Omit<Certificate, 'id' | 'uniqueId' | 'createdAt' | 'status' | 'blockchainTxHash'>,
    admin: User
  ): Promise<Certificate> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const uniqueId = blockchainService.generateUniqueId();
    const id = uuidv4();
    const now = new Date().toISOString();

    if (isSupabaseEnabled() && supabase) {
      const { hash } = await blockchainService.storeCertificate({
        id,
        uniqueId,
        ...certificateData,
        status: 'active',
        createdAt: now,
      });
      const { data, error } = await supabase
        .from('certificates')
        .insert({
          id,
          unique_id: uniqueId,
          student_name: certificateData.studentName,
          student_email: certificateData.studentEmail,
          course_name: certificateData.courseName,
          institution_name: certificateData.institutionName,
          institution_id: certificateData.institutionId,
          issue_date: certificateData.issueDate,
          expiry_date: certificateData.expiryDate ?? null,
          grade: certificateData.grade ?? null,
          description: certificateData.description ?? null,
          ipfs_hash: certificateData.ipfsHash ?? null,
          blockchain_tx_hash: hash,
          status: 'active',
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      await supabase.from('blockchain_anchors').insert({
        certificate_id: id,
        unique_id: uniqueId,
        hash,
        block_number: null,
      });
      this.addActivityLog(
        admin,
        'Certificate Issued',
        `Issued certificate ${uniqueId} to ${certificateData.studentName} for ${certificateData.courseName}`,
        'certificate'
      );
      return mapRowToCertificate(data);
    }

    const certificate: Certificate = {
      id,
      uniqueId,
      ...certificateData,
      status: 'active',
      createdAt: now,
    };
    const { hash } = await blockchainService.storeCertificate(certificate);
    certificate.blockchainTxHash = hash;
    this.certificates.push(certificate);
    this.saveCertificates();
    this.addActivityLog(
      admin,
      'Certificate Issued',
      `Issued certificate ${uniqueId} to ${certificateData.studentName} for ${certificateData.courseName}`,
      'certificate'
    );
    return certificate;
  }

  getCertificateByUniqueId(uniqueId: string): Certificate | null {
    if (isSupabaseEnabled()) return null;
    return this.certificates.find(c => c.uniqueId === uniqueId) ?? null;
  }

  async getCertificateByUniqueIdAsync(uniqueId: string): Promise<Certificate | null> {
    if (isSupabaseEnabled() && supabase) {
      const { data } = await supabase.from('certificates').select('*').eq('unique_id', uniqueId).single();
      return data ? mapRowToCertificate(data) : null;
    }
    return this.certificates.find(c => c.uniqueId === uniqueId) ?? null;
  }

  getCertificateById(id: string): Certificate | null {
    if (isSupabaseEnabled()) return null;
    return this.certificates.find(c => c.id === id) ?? null;
  }

  async getCertificateByIdAsync(id: string): Promise<Certificate | null> {
    if (isSupabaseEnabled() && supabase) {
      const { data } = await supabase.from('certificates').select('*').eq('id', id).single();
      return data ? mapRowToCertificate(data) : null;
    }
    return this.certificates.find(c => c.id === id) ?? null;
  }

  getAllCertificates(): Certificate[] {
    if (isSupabaseEnabled()) return [];
    return [...this.certificates];
  }

  async getAllCertificatesAsync(): Promise<Certificate[]> {
    if (isSupabaseEnabled() && supabase) {
      const { data } = await supabase.from('certificates').select('*').order('created_at', { ascending: false });
      return (data ?? []).map(mapRowToCertificate);
    }
    return [...this.certificates];
  }

  getCertificatesByInstitution(institutionId: string): Certificate[] {
    if (isSupabaseEnabled()) return [];
    return this.certificates.filter(c => c.institutionId === institutionId);
  }

  async getCertificatesByInstitutionAsync(institutionId: string): Promise<Certificate[]> {
    if (isSupabaseEnabled() && supabase) {
      const { data } = await supabase.from('certificates').select('*').eq('institution_id', institutionId);
      return (data ?? []).map(mapRowToCertificate);
    }
    return this.certificates.filter(c => c.institutionId === institutionId);
  }

  getCertificatesByStudentEmail(email: string): Certificate[] {
    if (isSupabaseEnabled()) return [];
    return this.certificates.filter(c => c.studentEmail.toLowerCase() === email.toLowerCase());
  }

  async getCertificatesByStudentEmailAsync(email: string): Promise<Certificate[]> {
    if (isSupabaseEnabled() && supabase) {
      const { data } = await supabase.from('certificates').select('*').ilike('student_email', email);
      return (data ?? []).map(mapRowToCertificate);
    }
    return this.certificates.filter(c => c.studentEmail.toLowerCase() === email.toLowerCase());
  }

  async verifyCertificate(uniqueId: string, verifiedBy?: User): Promise<{ isValid: boolean; certificate?: Certificate; message: string }> {
    const certificate = await this.getCertificateByUniqueIdAsync(uniqueId);
    if (!certificate) {
      return { isValid: false, message: 'Certificate not found in our records.' };
    }
    if (certificate.status === 'revoked') {
      return { isValid: false, certificate, message: 'This certificate has been revoked by the issuing institution.' };
    }
    if (certificate.status === 'expired') {
      return { isValid: false, certificate, message: 'This certificate has expired.' };
    }
    const blockchainResult = await blockchainService.verifyCertificate(uniqueId, certificate);
    if (verifiedBy) {
      this.addActivityLog(verifiedBy, 'Certificate Verified', `Verified certificate ${uniqueId} for ${certificate.studentName}`, 'verification');
    } else {
      this.addActivityLog(
        { id: 'public', name: 'Public User', email: '', role: 'user', createdAt: '' },
        'Public Certificate Verification',
        `Public verification of certificate ${uniqueId}`,
        'verification'
      );
    }
    return {
      isValid: blockchainResult.isValid,
      certificate,
      message: blockchainResult.message,
    };
  }

  async revokeCertificate(certificateId: string, reason: string, admin: User): Promise<Certificate> {
    if (isSupabaseEnabled() && supabase) {
      const { data, error } = await supabase
        .from('certificates')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('id', certificateId)
        .select()
        .single();
      if (error) throw new Error('Certificate not found');
      this.addActivityLog(admin, 'Certificate Revoked', `Revoked certificate ${data.unique_id}. Reason: ${reason}`, 'certificate');
      return mapRowToCertificate(data);
    }
    const certificate = this.getCertificateById(certificateId);
    if (!certificate) throw new Error('Certificate not found');
    certificate.status = 'revoked';
    certificate.updatedAt = new Date().toISOString();
    this.saveCertificates();
    this.addActivityLog(admin, 'Certificate Revoked', `Revoked certificate ${certificate.uniqueId}. Reason: ${reason}`, 'certificate');
    return certificate;
  }

  async updateCertificate(certificateId: string, updates: Partial<Certificate>, admin: User): Promise<Certificate> {
    if (isSupabaseEnabled() && supabase) {
      const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.studentName !== undefined) row.student_name = updates.studentName;
      if (updates.studentEmail !== undefined) row.student_email = updates.studentEmail;
      if (updates.courseName !== undefined) row.course_name = updates.courseName;
      if (updates.institutionName !== undefined) row.institution_name = updates.institutionName;
      if (updates.issueDate !== undefined) row.issue_date = updates.issueDate;
      if (updates.expiryDate !== undefined) row.expiry_date = updates.expiryDate;
      if (updates.grade !== undefined) row.grade = updates.grade;
      if (updates.description !== undefined) row.description = updates.description;
      if (updates.status !== undefined) row.status = updates.status;
      const { data, error } = await supabase.from('certificates').update(row).eq('id', certificateId).select().single();
      if (error) throw new Error('Certificate not found');
      this.addActivityLog(admin, 'Certificate Updated', `Updated certificate ${data.unique_id}`, 'certificate');
      return mapRowToCertificate(data);
    }
    const certificate = this.getCertificateById(certificateId);
    if (!certificate) throw new Error('Certificate not found');
    Object.assign(certificate, updates, { updatedAt: new Date().toISOString() });
    this.saveCertificates();
    this.addActivityLog(admin, 'Certificate Updated', `Updated certificate ${certificate.uniqueId}`, 'certificate');
    return certificate;
  }

  getDashboardStats(): DashboardStats {
    if (isSupabaseEnabled()) {
      return {
        totalCertificates: 0,
        totalInstitutions: 0,
        totalUsers: 0,
        pendingApplications: 0,
        verifiedThisMonth: 0,
      };
    }
    const now = new Date();
    const verifiedThisMonth = this.certificates.filter(c => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return {
      totalCertificates: this.certificates.length,
      totalInstitutions: new Set(this.certificates.map(c => c.institutionId)).size,
      totalUsers: this.certificates.length,
      pendingApplications: 0,
      verifiedThisMonth,
    };
  }

  async getDashboardStatsAsync(): Promise<DashboardStats> {
    if (isSupabaseEnabled() && supabase) {
      const { count: totalCertificates } = await supabase.from('certificates').select('*', { count: 'exact', head: true });
      const { data: certs } = await supabase.from('certificates').select('institution_id, created_at');
      const institutions = new Set((certs ?? []).map(c => c.institution_id));
      const now = new Date();
      const verifiedThisMonth = (certs ?? []).filter(c => {
        const d = new Date(c.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;
      const { count: pendingApplications } = await supabase.from('institution_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      return {
        totalCertificates: totalCertificates ?? 0,
        totalInstitutions: institutions.size,
        totalUsers: totalCertificates ?? 0,
        pendingApplications: pendingApplications ?? 0,
        verifiedThisMonth,
      };
    }
    return this.getDashboardStats();
  }

  getRecentActivity(limit: number = 10): ActivityLog[] {
    if (isSupabaseEnabled()) return [];
    return this.activityLog.slice(0, limit);
  }

  async getRecentActivityAsync(limit: number = 10): Promise<ActivityLog[]> {
    if (isSupabaseEnabled() && supabase) {
      const { data } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(limit);
      return (data ?? []).map(row => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        action: row.action,
        details: row.details,
        timestamp: row.timestamp,
        type: row.type,
      }));
    }
    return this.activityLog.slice(0, limit);
  }

  getActivityByUser(userId: string): ActivityLog[] {
    if (isSupabaseEnabled()) return [];
    return this.activityLog.filter(log => log.userId === userId);
  }

  searchCertificates(query: string): Certificate[] {
    if (isSupabaseEnabled()) return [];
    const q = query.toLowerCase();
    return this.certificates.filter(c =>
      c.studentName.toLowerCase().includes(q) ||
      c.studentEmail.toLowerCase().includes(q) ||
      c.courseName.toLowerCase().includes(q) ||
      c.uniqueId.toLowerCase().includes(q) ||
      c.institutionName.toLowerCase().includes(q)
    );
  }

  async searchCertificatesAsync(query: string): Promise<Certificate[]> {
    if (isSupabaseEnabled() && supabase) {
      const { data } = await supabase.from('certificates').select('*').order('created_at', { ascending: false });
      const q = query.toLowerCase();
      return (data ?? [])
        .filter(
          c =>
            c.student_name?.toLowerCase().includes(q) ||
            c.student_email?.toLowerCase().includes(q) ||
            c.course_name?.toLowerCase().includes(q) ||
            c.unique_id?.toLowerCase().includes(q) ||
            c.institution_name?.toLowerCase().includes(q)
        )
        .map(mapRowToCertificate);
    }
    return this.searchCertificates(query);
  }

  getCertificateStatsByInstitution(institutionId: string): { total: number; active: number; revoked: number; expired: number } {
    if (isSupabaseEnabled()) return { total: 0, active: 0, revoked: 0, expired: 0 };
    const certs = this.certificates.filter(c => c.institutionId === institutionId);
    return {
      total: certs.length,
      active: certs.filter(c => c.status === 'active').length,
      revoked: certs.filter(c => c.status === 'revoked').length,
      expired: certs.filter(c => c.status === 'expired').length,
    };
  }

  async getCertificateStatsByInstitutionAsync(institutionId: string): Promise<{ total: number; active: number; revoked: number; expired: number }> {
    if (isSupabaseEnabled() && supabase) {
      const { data } = await supabase.from('certificates').select('status').eq('institution_id', institutionId);
      const certs = data ?? [];
      return {
        total: certs.length,
        active: certs.filter(c => c.status === 'active').length,
        revoked: certs.filter(c => c.status === 'revoked').length,
        expired: certs.filter(c => c.status === 'expired').length,
      };
    }
    return this.getCertificateStatsByInstitution(institutionId);
  }
}

export const certificateService = new CertificateService();
export default certificateService;
