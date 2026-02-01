import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { certificateService } from '@/services/certificate';
import type { Certificate } from '@/types';
import { Award, Calendar, Search, ExternalLink, QrCode, User, Mail, Hash, Loader2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface UserDashboardProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
}

export default function UserDashboard({ onNavigate }: UserDashboardProps) {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, [user]);

  const loadCertificates = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const certs = user.email
        ? await certificateService.getCertificatesByStudentEmailAsync(user.email)
        : await certificateService.getAllCertificatesAsync();
      setCertificates(certs);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCertificates = certificates.filter(cert =>
    !searchQuery ||
    cert.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cert.institutionName && cert.institutionName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    cert.uniqueId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: Certificate['status']) => {
    switch (status) {
      case 'active':
        return 'bg-[#28A745]/20 text-[#28A745]';
      case 'revoked':
        return 'bg-[#DC3545]/20 text-[#DC3545]';
      case 'expired':
        return 'bg-[#F5F5F5]/20 text-[#F5F5F5]';
      default:
        return 'bg-[#4A4A4A]/20 text-[#F5F5F5]';
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#F5F5F5] mb-2">
            My <span className="text-[#D4AF37]">Certificates</span>
          </h1>
          <p className="text-[#F5F5F5]/60">
            View and manage your blockchain-verified credentials
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-[#D4AF37]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#F5F5F5]">{user?.name}</h2>
                <div className="flex items-center space-x-2 text-[#F5F5F5]/60">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#D4AF37]">{certificates.length}</div>
                <div className="text-sm text-[#F5F5F5]/50">Certificates</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5F5F5]/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, course, institution, or ID..."
            className="w-full pl-12 pr-4 py-3 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-[#F5F5F5] placeholder-[#F5F5F5]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
          />
        </div>

        {/* Certificates Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-[#D4AF37] animate-spin" />
          </div>
        ) : filteredCertificates.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl overflow-hidden hover:border-[#D4AF37]/30 transition-colors group"
              >
                {/* Certificate Header */}
                <div className="p-4 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border-b border-[#4A4A4A]/50">
                  <div className="flex items-center justify-between">
                    <Award className="h-8 w-8 text-[#D4AF37]" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}>
                      {cert.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Certificate Body */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-[#F5F5F5] mb-1 truncate">{cert.courseName}</h3>
                  <p className="text-[#F5F5F5]/60 text-sm mb-4">{cert.institutionName}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-[#F5F5F5]/70">
                      <Calendar className="h-4 w-4" />
                      <span>Issued: {formatDate(cert.issueDate)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#F5F5F5]/70">
                      <Hash className="h-4 w-4" />
                      <span className="font-mono text-xs">{cert.uniqueId}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-[#4A4A4A]/50 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedCert(cert);
                        setShowQR(false);
                      }}
                      className="flex-1 px-3 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/20 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onNavigate('verify', { uniqueId: cert.uniqueId })}
                      className="px-3 py-2 bg-[#4A4A4A]/50 text-[#F5F5F5] rounded-lg hover:bg-[#4A4A4A] transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Award className="h-16 w-16 text-[#4A4A4A] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">No Certificates Found</h3>
            <p className="text-[#F5F5F5]/60 mb-6">
              {searchQuery
                ? 'No certificates match your search criteria.'
                : 'You don\'t have any certificates yet.'}
            </p>
            <button
              onClick={() => onNavigate('verify')}
              className="px-6 py-3 bg-[#D4AF37] text-[#1A1A1A] rounded-lg font-semibold hover:bg-[#C4A030] transition-colors"
            >
              Verify a Certificate
            </button>
          </div>
        )}

        {/* Certificate Detail Modal */}
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1A1A1A] border border-[#4A4A4A]/50 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#F5F5F5]">Certificate Details</h2>
                  <button
                    onClick={() => setSelectedCert(null)}
                    className="p-2 text-[#F5F5F5]/60 hover:text-[#F5F5F5] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-center">
                    <Award className="h-12 w-12 text-[#D4AF37] mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-[#F5F5F5]">{selectedCert.courseName}</h3>
                    <p className="text-[#F5F5F5]/60">{selectedCert.institutionName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#F5F5F5]/50">Student</p>
                      <p className="text-[#F5F5F5]">{selectedCert.studentName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#F5F5F5]/50">Status</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCert.status)}`}>
                        {selectedCert.status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-[#F5F5F5]/50">Issue Date</p>
                      <p className="text-[#F5F5F5]">{formatDate(selectedCert.issueDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#F5F5F5]/50">Certificate ID</p>
                      <p className="text-[#F5F5F5] font-mono text-xs">{selectedCert.uniqueId}</p>
                    </div>
                  </div>

                  {selectedCert.grade && (
                    <div>
                      <p className="text-sm text-[#F5F5F5]/50">Grade/Score</p>
                      <p className="text-[#F5F5F5]">{selectedCert.grade}</p>
                    </div>
                  )}

                  {selectedCert.description && (
                    <div>
                      <p className="text-sm text-[#F5F5F5]/50">Description</p>
                      <p className="text-[#F5F5F5]">{selectedCert.description}</p>
                    </div>
                  )}

                  {/* QR Code */}
                  {showQR && (
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <QRCodeSVG
                        value={window.location.origin + '/#/verify/' + selectedCert.uniqueId}
                        size={180}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowQR(!showQR)}
                      className="flex-1 px-4 py-2 bg-[#4A4A4A]/50 text-[#F5F5F5] rounded-lg hover:bg-[#4A4A4A] transition-colors flex items-center justify-center space-x-2"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>{showQR ? 'Hide QR' : 'Show QR'}</span>
                    </button>
                    <button
                      onClick={() => onNavigate('verify', { uniqueId: selectedCert.uniqueId })}
                      className="flex-1 px-4 py-2 bg-[#D4AF37] text-[#1A1A1A] rounded-lg hover:bg-[#C4A030] transition-colors flex items-center justify-center space-x-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Verify</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
