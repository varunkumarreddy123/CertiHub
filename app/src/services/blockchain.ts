import { ethers } from 'ethers';
import type { Certificate, BlockchainRecord } from '@/types';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

// Blockchain service: mandatory anchoring and verification.
// Uses simulated chain (localStorage) and optionally Supabase blockchain_anchors for verification.

class BlockchainService {
  private localStorageKey = 'certichain_blockchain';
  private simulatedBlocks: BlockchainRecord[] = [];

  constructor() {
    this.initializeBlockchain();
  }

  private initializeBlockchain() {
    const stored = localStorage.getItem(this.localStorageKey);
    if (stored) this.simulatedBlocks = JSON.parse(stored);
  }

  private saveToStorage() {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.simulatedBlocks));
  }

  generateUniqueId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CERT-${timestamp}-${random}`;
  }

  private normalizeIssueDate(date: string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
  }

  async createCertificateHash(certificate: Partial<Certificate>): Promise<string> {
    const data = JSON.stringify({
      studentName: certificate.studentName,
      courseName: certificate.courseName,
      institutionName: certificate.institutionName,
      issueDate: this.normalizeIssueDate(certificate.issueDate),
      uniqueId: certificate.uniqueId,
    });
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  async storeCertificate(certificate: Certificate): Promise<{ hash: string; blockNumber: number }> {
    const hash = await this.createCertificateHash(certificate);
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
    await new Promise(resolve => setTimeout(resolve, 300));
    return { hash, blockNumber };
  }

  async verifyCertificate(
    uniqueId: string,
    certificate?: Certificate | null
  ): Promise<{ isValid: boolean; record?: BlockchainRecord; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (isSupabaseEnabled() && supabase && certificate) {
      const { data: anchor, error } = await supabase
        .from('blockchain_anchors')
        .select('hash')
        .eq('unique_id', uniqueId)
        .single();
      if (!error && anchor) {
        const expectedHash = await this.createCertificateHash({
          studentName: certificate.studentName,
          courseName: certificate.courseName,
          institutionName: certificate.institutionName,
          issueDate: certificate.issueDate,
          uniqueId: certificate.uniqueId,
        });
        if (expectedHash === anchor.hash) {
          return {
            isValid: true,
            record: {
              certificateId: certificate.id,
              uniqueId: certificate.uniqueId,
              studentName: certificate.studentName,
              courseName: certificate.courseName,
              institutionName: certificate.institutionName,
              issueDate: certificate.issueDate,
              hash: anchor.hash,
              timestamp: 0,
            },
            message: 'Certificate verified successfully on blockchain.',
          };
        }
        return {
          isValid: false,
          message: 'Certificate hash mismatch. This certificate may have been tampered with.',
        };
      }
    }

    const record = this.simulatedBlocks.find(b => b.uniqueId === uniqueId);
    if (!record) {
      return {
        isValid: false,
        message: 'Certificate not found on blockchain. This certificate may be invalid or has been revoked.',
      };
    }
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

  // Get all blockchain records
  getAllRecords(): BlockchainRecord[] {
    return [...this.simulatedBlocks];
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
