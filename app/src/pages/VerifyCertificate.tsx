import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Loader2, Shield, Award, Calendar, Building2, User, Hash, ExternalLink, QrCode } from 'lucide-react';
import { certificateService } from '@/services/certificate';
import type { Certificate } from '@/types';
import { QRCodeSVG } from 'qrcode.react';

interface VerifyCertificateProps {
  uniqueId?: string;
  onNavigate: (route: string, params?: Record<string, string>) => void;
}

export default function VerifyCertificate({ uniqueId, onNavigate }: VerifyCertificateProps) {
  const [searchId, setSearchId] = useState(uniqueId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    certificate?: Certificate;
    message: string;
    blockchainVerified?: boolean;
  } | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (uniqueId) {
      handleVerify(uniqueId);
    }
  }, [uniqueId]);

  const handleVerify = async (id: string = searchId) => {
    if (!id.trim()) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const verification = await certificateService.verifyCertificate(id.trim());
      setResult({
        isValid: verification.isValid,
        certificate: verification.certificate,
        message: verification.message,
        blockchainVerified: verification.isValid,
      });
    } catch (error) {
      setResult({
        isValid: false,
        message: 'An error occurred during verification. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D4AF37]/10 rounded-xl mb-4">
            <Shield className="h-8 w-8 text-[#D4AF37]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#F5F5F5] mb-2">
            Verify <span className="text-[#D4AF37]">Certificate</span>
          </h1>
          <p className="text-[#F5F5F5]/60">
            Enter the unique certificate ID to verify its authenticity on the blockchain.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl p-6 mb-8">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5F5F5]/40" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                  placeholder="Enter Certificate ID (e.g., CERT-ABC123)"
                  className="w-full pl-12 pr-4 py-4 bg-[#1A1A1A] border border-[#4A4A4A] rounded-lg text-[#F5F5F5] placeholder-[#F5F5F5]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !searchId.trim()}
                className="px-6 py-4 bg-[#D4AF37] text-[#1A1A1A] rounded-lg font-semibold hover:bg-[#C4A030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    <span className="hidden sm:inline">Verify</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Verification Result */}
        {result && (
          <div className={`rounded-xl overflow-hidden border ${
            result.isValid
              ? 'bg-[#28A745]/10 border-[#28A745]/30'
              : 'bg-[#DC3545]/10 border-[#DC3545]/30'
          }`}>
            {/* Result Header */}
            <div className={`p-6 ${result.isValid ? 'bg-[#28A745]/20' : 'bg-[#DC3545]/20'}`}>
              <div className="flex items-center space-x-3">
                {result.isValid ? (
                  <CheckCircle className="h-8 w-8 text-[#28A745]" />
                ) : (
                  <XCircle className="h-8 w-8 text-[#DC3545]" />
                )}
                <div>
                  <h2 className={`text-xl font-bold ${result.isValid ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
                    {result.isValid ? 'Certificate Verified' : 'Verification Failed'}
                  </h2>
                  <p className="text-[#F5F5F5]/70">{result.message}</p>
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            {result.certificate && (
              <div className="p-6 space-y-6">
                {/* Certificate Card */}
                <div className="bg-[#1A1A1A] border border-[#4A4A4A]/50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Award className="h-6 w-6 text-[#D4AF37]" />
                      <span className="text-lg font-semibold text-[#F5F5F5]">Certificate Details</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      result.certificate.status === 'active'
                        ? 'bg-[#28A745]/20 text-[#28A745]'
                        : result.certificate.status === 'revoked'
                        ? 'bg-[#DC3545]/20 text-[#DC3545]'
                        : 'bg-[#F5F5F5]/20 text-[#F5F5F5]'
                    }`}>
                      {result.certificate.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-[#D4AF37] mt-0.5" />
                      <div>
                        <p className="text-sm text-[#F5F5F5]/50">Student Name</p>
                        <p className="text-[#F5F5F5] font-medium">{result.certificate.studentName}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Building2 className="h-5 w-5 text-[#D4AF37] mt-0.5" />
                      <div>
                        <p className="text-sm text-[#F5F5F5]/50">Institution</p>
                        <p className="text-[#F5F5F5] font-medium">{result.certificate.institutionName}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Award className="h-5 w-5 text-[#D4AF37] mt-0.5" />
                      <div>
                        <p className="text-sm text-[#F5F5F5]/50">Course/Program</p>
                        <p className="text-[#F5F5F5] font-medium">{result.certificate.courseName}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-[#D4AF37] mt-0.5" />
                      <div>
                        <p className="text-sm text-[#F5F5F5]/50">Issue Date</p>
                        <p className="text-[#F5F5F5] font-medium">{formatDate(result.certificate.issueDate)}</p>
                      </div>
                    </div>

                    {result.certificate.grade && (
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-[#D4AF37] mt-0.5" />
                        <div>
                          <p className="text-sm text-[#F5F5F5]/50">Grade/Score</p>
                          <p className="text-[#F5F5F5] font-medium">{result.certificate.grade}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start space-x-3">
                      <Hash className="h-5 w-5 text-[#D4AF37] mt-0.5" />
                      <div>
                        <p className="text-sm text-[#F5F5F5]/50">Certificate ID</p>
                        <p className="text-[#F5F5F5] font-mono text-sm">{result.certificate.uniqueId}</p>
                      </div>
                    </div>
                  </div>

                  {result.certificate.description && (
                    <div className="mt-4 pt-4 border-t border-[#4A4A4A]/50">
                      <p className="text-sm text-[#F5F5F5]/50 mb-1">Description</p>
                      <p className="text-[#F5F5F5]">{result.certificate.description}</p>
                    </div>
                  )}
                </div>

                {/* Blockchain Info */}
                {result.blockchainVerified && (
                  <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-5 w-5 text-[#D4AF37]" />
                      <span className="font-medium text-[#D4AF37]">Blockchain Verified</span>
                    </div>
                    <p className="text-sm text-[#F5F5F5]/70">
                      This certificate has been verified on the blockchain. The hash matches 
                      the original record, confirming its authenticity.
                    </p>
                    {result.certificate.blockchainTxHash && (
                      <div className="mt-3 p-3 bg-[#1A1A1A] rounded-lg">
                        <p className="text-xs text-[#F5F5F5]/50 mb-1">Transaction Hash</p>
                        <p className="text-xs font-mono text-[#D4AF37] break-all">
                          {result.certificate.blockchainTxHash}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#4A4A4A]/50 text-[#F5F5F5] rounded-lg hover:bg-[#4A4A4A] transition-colors"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>{showQR ? 'Hide QR Code' : 'Show QR Code'}</span>
                  </button>
                  <button
                    onClick={() => onNavigate('certificate', { id: result.certificate!.id })}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#D4AF37] text-[#1A1A1A] rounded-lg hover:bg-[#C4A030] transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View Full Certificate</span>
                  </button>
                </div>

                {/* QR Code */}
                {showQR && (
                  <div className="flex justify-center p-6 bg-white rounded-lg">
                    <QRCodeSVG
                      value={window.location.origin + '/#/verify/' + result.certificate.uniqueId}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info Cards */}
        {!result && !isLoading && (
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-[#4A4A4A]/10 border border-[#4A4A4A]/30 rounded-lg p-4 text-center">
              <Shield className="h-8 w-8 text-[#D4AF37] mx-auto mb-2" />
              <h3 className="text-[#F5F5F5] font-medium mb-1">Secure</h3>
              <p className="text-sm text-[#F5F5F5]/50">Blockchain-verified credentials</p>
            </div>
            <div className="bg-[#4A4A4A]/10 border border-[#4A4A4A]/30 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-[#28A745] mx-auto mb-2" />
              <h3 className="text-[#F5F5F5] font-medium mb-1">Instant</h3>
              <p className="text-sm text-[#F5F5F5]/50">Real-time verification</p>
            </div>
            <div className="bg-[#4A4A4A]/10 border border-[#4A4A4A]/30 rounded-lg p-4 text-center">
              <Award className="h-8 w-8 text-[#D4AF37] mx-auto mb-2" />
              <h3 className="text-[#F5F5F5] font-medium mb-1">Trusted</h3>
              <p className="text-sm text-[#F5F5F5]/50">Verified institutions only</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
