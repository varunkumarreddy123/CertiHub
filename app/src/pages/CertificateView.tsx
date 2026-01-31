import { useState, useEffect } from 'react';
import { certificateService } from '@/services/certificate';
import type { Certificate } from '@/types';
import { Award, Calendar, Building2, Hash, CheckCircle, Shield, Download, QrCode, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface CertificateViewProps {
  certificateId?: string;
  onNavigate: (route: string, params?: Record<string, string>) => void;
}

export default function CertificateView({ certificateId, onNavigate }: CertificateViewProps) {
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (certificateId) {
      loadCertificate();
    }
  }, [certificateId]);

  const loadCertificate = async () => {
    if (!certificateId) return;
    setIsLoading(true);
    try {
      const cert = await certificateService.getCertificateByIdAsync(certificateId);
      setCertificate(cert);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center pt-16">
        <Loader2 className="h-8 w-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center pt-16 px-4">
        <div className="text-center">
          <Award className="h-16 w-16 text-[#4A4A4A] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#F5F5F5] mb-2">Certificate Not Found</h1>
          <p className="text-[#F5F5F5]/60 mb-6">The certificate you're looking for doesn't exist.</p>
          <button
            onClick={() => onNavigate('verify')}
            className="px-6 py-3 bg-[#D4AF37] text-[#1A1A1A] rounded-lg font-semibold hover:bg-[#C4A030] transition-colors"
          >
            Verify a Certificate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="mb-6 text-[#F5F5F5]/60 hover:text-[#F5F5F5] transition-colors flex items-center space-x-2"
        >
          <span>← Back to Dashboard</span>
        </button>

        {/* Certificate Card */}
        <div className="bg-gradient-to-br from-[#4A4A4A]/30 to-[#4A4A4A]/10 border border-[#D4AF37]/30 rounded-2xl overflow-hidden">
          {/* Certificate Header */}
          <div className="bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/10 to-[#D4AF37]/20 p-8 text-center border-b border-[#D4AF37]/30">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#D4AF37]/20 rounded-full mb-4">
              <Award className="h-10 w-10 text-[#D4AF37]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#F5F5F5] mb-2">Certificate of Completion</h1>
            <p className="text-[#F5F5F5]/60">Blockchain Verified Credential</p>
          </div>

          {/* Certificate Body */}
          <div className="p-8">
            {/* Status Badge */}
            <div className="flex justify-center mb-8">
              <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
                certificate.status === 'active'
                  ? 'bg-[#28A745]/20 text-[#28A745]'
                  : certificate.status === 'revoked'
                  ? 'bg-[#DC3545]/20 text-[#DC3545]'
                  : 'bg-[#F5F5F5]/20 text-[#F5F5F5]'
              }`}>
                {certificate.status === 'active' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Shield className="h-5 w-5" />
                )}
                <span className="font-medium uppercase">{certificate.status}</span>
              </span>
            </div>

            {/* Recipient */}
            <div className="text-center mb-8">
              <p className="text-[#F5F5F5]/60 mb-2">This certifies that</p>
              <h2 className="text-3xl font-bold text-[#D4AF37] mb-2">{certificate.studentName}</h2>
              <p className="text-[#F5F5F5]/60">{certificate.studentEmail}</p>
            </div>

            {/* Course Details */}
            <div className="text-center mb-8">
              <p className="text-[#F5F5F5]/60 mb-2">has successfully completed</p>
              <h3 className="text-2xl font-semibold text-[#F5F5F5]">{certificate.courseName}</h3>
              {certificate.description && (
                <p className="text-[#F5F5F5]/60 mt-2 max-w-xl mx-auto">{certificate.description}</p>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-[#1A1A1A] rounded-lg">
                <Building2 className="h-6 w-6 text-[#D4AF37] mx-auto mb-2" />
                <p className="text-sm text-[#F5F5F5]/50 mb-1">Issued By</p>
                <p className="text-[#F5F5F5] font-medium">{certificate.institutionName}</p>
              </div>
              <div className="text-center p-4 bg-[#1A1A1A] rounded-lg">
                <Calendar className="h-6 w-6 text-[#D4AF37] mx-auto mb-2" />
                <p className="text-sm text-[#F5F5F5]/50 mb-1">Issue Date</p>
                <p className="text-[#F5F5F5] font-medium">{formatDate(certificate.issueDate)}</p>
              </div>
              {certificate.grade && (
                <div className="text-center p-4 bg-[#1A1A1A] rounded-lg">
                  <Award className="h-6 w-6 text-[#D4AF37] mx-auto mb-2" />
                  <p className="text-sm text-[#F5F5F5]/50 mb-1">Grade/Score</p>
                  <p className="text-[#F5F5F5] font-medium">{certificate.grade}</p>
                </div>
              )}
            </div>

            {/* Certificate ID */}
            <div className="p-4 bg-[#1A1A1A] rounded-lg mb-8">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Hash className="h-5 w-5 text-[#D4AF37]" />
                <span className="text-sm text-[#F5F5F5]/50">Unique Certificate ID</span>
              </div>
              <p className="text-center font-mono text-lg text-[#D4AF37]">{certificate.uniqueId}</p>
            </div>

            {/* Blockchain Verification */}
            {certificate.blockchainTxHash && (
              <div className="p-4 bg-[#28A745]/10 border border-[#28A745]/30 rounded-lg mb-8">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-[#28A745]" />
                  <span className="text-sm text-[#28A745] font-medium">Blockchain Verified</span>
                </div>
                <p className="text-center text-xs text-[#F5F5F5]/60 mb-2">
                  This certificate has been verified on the blockchain
                </p>
                <p className="text-center font-mono text-xs text-[#28A745] break-all">
                  {certificate.blockchainTxHash}
                </p>
              </div>
            )}

            {/* QR Code */}
            {showQR && (
              <div className="flex justify-center mb-8">
                <div className="p-6 bg-white rounded-xl">
                  <QRCodeSVG
                    value={window.location.origin + '/#/verify/' + certificate.uniqueId}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                  <p className="text-center text-[#1A1A1A] text-sm mt-4">
                    Scan to verify this certificate
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setShowQR(!showQR)}
                className="px-6 py-3 bg-[#4A4A4A]/50 text-[#F5F5F5] rounded-lg hover:bg-[#4A4A4A] transition-colors flex items-center space-x-2"
              >
                <QrCode className="h-5 w-5" />
                <span>{showQR ? 'Hide QR Code' : 'Show QR Code'}</span>
              </button>
              <button
                onClick={() => onNavigate('verify', { uniqueId: certificate.uniqueId })}
                className="px-6 py-3 bg-[#D4AF37] text-[#1A1A1A] rounded-lg hover:bg-[#C4A030] transition-colors flex items-center space-x-2"
              >
                <Shield className="h-5 w-5" />
                <span>Verify on Blockchain</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 border border-[#4A4A4A] text-[#F5F5F5] rounded-lg hover:bg-[#4A4A4A]/50 transition-colors flex items-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-[#F5F5F5]/40 text-sm">
            This certificate is secured by CertiChain blockchain technology.
            <br />
            Verify authenticity at {window.location.origin}/#/verify/{certificate.uniqueId}
          </p>
        </div>
      </div>
    </div>
  );
}
