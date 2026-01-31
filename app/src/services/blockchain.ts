import { ethers } from 'ethers';
import type { Certificate, BlockchainRecord } from '@/types';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

// Simulated Blockchain Service
// In production, this would connect to actual Ethereum/Polygon network

class BlockchainService {
  private localStorageKey = 'certichain_blockchain';
  private simulatedBlocks: BlockchainRecord[] = [];

  constructor() {
    this.initializeBlockchain();
  }

  private initializeBlockchain() {
    // Load existing blockchain data from localStorage
    const stored = localStorage.getItem(this.localStorageKey);
    if (stored) {
      this.simulatedBlocks = JSON.parse(stored);
    }
  }

  private saveToStorage() {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.simulatedBlocks));
  }

  // Generate a unique certificate ID
  generateUniqueId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CERT-${timestamp}-${random}`;
  }

  // Create hash of certificate data (simulating blockchain storage)
  async createCertificateHash(certificate: Partial<Certificate>): Promise<string> {
    const data = JSON.stringify({
      studentName: certificate.studentName,
      courseName: certificate.courseName,
      institutionName: certificate.institutionName,
      issueDate: certificate.issueDate,
      uniqueId: certificate.uniqueId,
    });

    // Create keccak256 hash
    const hash = ethers.keccak256(ethers.toUtf8Bytes(data));
    return hash;
  }

  // Store certificate on blockchain (simulated)
  async storeCertificate(certificate: Certificate): Promise<{ hash: string; blockNumber: number }> {
    const hash = await this.createCertificateHash(certificate);
    
    // Simulate blockchain transaction
    const blockNumber = this.simulatedBlocks.length + 1;
    const timestamp = Date.now();

    const record: BlockchainRecord = {
      certificateId: certificate.id,
      uniqueId: certificate.uniqueId,
      studentName: certificate.studentName,
      courseName: certificate.courseName,
      institutionName: certificate.institutionName,
      issueDate: certificate.issueDate,
      hash,
      timestamp,
      blockNumber,
    };

    this.simulatedBlocks.push(record);
    this.saveToStorage();

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return { hash, blockNumber };
  }

  // Verify certificate on blockchain
  async verifyCertificate(uniqueId: string): Promise<{ isValid: boolean; record?: BlockchainRecord; message: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const record = this.simulatedBlocks.find(b => b.uniqueId === uniqueId);

    if (!record) {
      return {
        isValid: false,
        message: 'Certificate not found on blockchain. This certificate may be invalid or has been revoked.',
      };
    }

    // Verify hash integrity
    const currentHash = await this.createCertificateHash({
      studentName: record.studentName,
      courseName: record.courseName,
      institutionName: record.institutionName,
      issueDate: record.issueDate,
      uniqueId: record.uniqueId,
    });

    if (currentHash !== record.hash) {
      return {
        isValid: false,
        message: 'Certificate hash mismatch. This certificate may have been tampered with.',
      };
    }

    return {
      isValid: true,
      record,
      message: 'Certificate verified successfully on blockchain.',
    };
  }

  // Get all blockchain records (sync - localStorage only)
  getAllRecords(): BlockchainRecord[] {
    return [...this.simulatedBlocks];
  }

  // Get all blockchain records (async - fetches from Supabase when enabled)
  async getAllRecordsAsync(): Promise<BlockchainRecord[]> {
    if (isSupabaseEnabled() && supabase) {
      const { data: anchors, error } = await supabase
        .from('blockchain_anchors')
        .select('certificate_id, unique_id, hash, block_number')
        .order('certificate_id', { ascending: true });
      if (error) {
        console.warn('Failed to fetch blockchain anchors:', error);
        return [];
      }
      if (!anchors || anchors.length === 0) return [];

      const certIds = anchors.map((a: { certificate_id: string }) => a.certificate_id);
      const { data: certs } = await supabase
        .from('certificates')
        .select('id, student_name, course_name, institution_name, issue_date, created_at')
        .in('id', certIds);
      const certMap = new Map((certs ?? []).map((c: { id: string; student_name: string; course_name: string; institution_name: string; issue_date: string; created_at: string }) => [c.id, c]));

      return anchors.map((row: { certificate_id: string; unique_id: string; hash: string; block_number: number | null }, index: number) => {
        const cert = certMap.get(row.certificate_id);
        return {
          certificateId: row.certificate_id,
          uniqueId: row.unique_id,
          studentName: cert?.student_name ?? '',
          courseName: cert?.course_name ?? '',
          institutionName: cert?.institution_name ?? '',
          issueDate: cert?.issue_date ?? '',
          hash: row.hash,
          timestamp: cert?.created_at ? new Date(cert.created_at).getTime() : Date.now(),
          blockNumber: row.block_number ?? index + 1,
        };
      });
    }
    return this.getAllRecords();
  }

  // Get records by institution
  getRecordsByInstitution(institutionName: string): BlockchainRecord[] {
    return this.simulatedBlocks.filter(r => r.institutionName === institutionName);
  }

  // Get total block count
  getBlockCount(): number {
    return this.simulatedBlocks.length;
  }

  // Generate verification URL
  getVerificationUrl(uniqueId: string): string {
    return `${window.location.origin}/#/verify/${uniqueId}`;
  }

  // Format wallet address for display
  formatAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Simulate getting transaction receipt
  async getTransactionReceipt(txHash: string): Promise<{ status: number; blockNumber: number; timestamp: number } | null> {
    const record = this.simulatedBlocks.find(r => r.hash === txHash);
    if (!record) return null;

    return {
      status: 1, // Success
      blockNumber: record.blockNumber || 0,
      timestamp: record.timestamp,
    };
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService;
