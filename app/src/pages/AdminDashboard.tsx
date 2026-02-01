import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { certificateService } from '@/services/certificate';
import type { Certificate, DashboardStats, ActivityLog } from '@/types';
import { Award, Plus, Users, FileCheck, TrendingUp, Activity, Loader2, X, Search } from 'lucide-react';
import { toast } from 'sonner';

interface AdminDashboardProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'certificates' | 'activity'>('overview');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [certSearchQuery, setCertSearchQuery] = useState('');

  // Issue form state
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    courseName: '',
    description: '',
    grade: '',
    expiryDate: '',
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [allCerts, dashboardStats, recentActivity] = await Promise.all([
        certificateService.getCertificatesByInstitutionAsync(user.id),
        certificateService.getDashboardStatsAsync(),
        certificateService.getRecentActivityAsync(10),
      ]);
      setCertificates(allCerts);
      setStats(dashboardStats);
      setActivity(recentActivity);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const newCert = await certificateService.createCertificate(
        {
          studentName: formData.studentName,
          studentEmail: formData.studentEmail,
          courseName: formData.courseName,
          institutionName: user.institutionName || 'Unknown Institution',
          institutionId: user.id,
          issueDate: new Date().toISOString(),
          expiryDate: formData.expiryDate || undefined,
          grade: formData.grade || undefined,
          description: formData.description || undefined,
        },
        user
      );

      toast.success(`Certificate issued successfully! ID: ${newCert.uniqueId}`);
      setShowIssueModal(false);
      setFormData({
        studentName: '',
        studentEmail: '',
        courseName: '',
        description: '',
        grade: '',
        expiryDate: '',
      });
      loadData();
      setActiveTab('certificates');
    } catch (error) {
      toast.error('Failed to issue certificate');
    } finally {
      setIsLoading(false);
    }
  };

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

  const statCards = [
    { label: 'Total Certificates', value: stats?.totalCertificates || 0, icon: FileCheck, color: 'text-[#D4AF37]' },
    { label: 'This Month', value: stats?.verifiedThisMonth || 0, icon: TrendingUp, color: 'text-[#28A745]' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-[#F5F5F5]' },
    { label: 'Institutions', value: stats?.totalInstitutions || 0, icon: Award, color: 'text-[#D4AF37]' },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-[#F5F5F5]">{stat.value}</div>
            <div className="text-sm text-[#F5F5F5]/50">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#F5F5F5]">Recent Activity</h3>
          <button
            onClick={() => setActiveTab('activity')}
            className="text-sm text-[#D4AF37] hover:text-[#C4A030] transition-colors"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {activity.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-center space-x-3 p-3 bg-[#1A1A1A] rounded-lg">
              <Activity className="h-5 w-5 text-[#D4AF37]" />
              <div className="flex-1">
                <p className="text-[#F5F5F5] text-sm">{log.action}</p>
                <p className="text-[#F5F5F5]/50 text-xs">{log.details}</p>
              </div>
              <span className="text-xs text-[#F5F5F5]/40">{formatDate(log.timestamp)}</span>
            </div>
          ))}
          {activity.length === 0 && (
            <p className="text-center text-[#F5F5F5]/50 py-4">No recent activity</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={() => setShowIssueModal(true)}
          className="p-6 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl hover:bg-[#D4AF37]/20 transition-colors text-left"
        >
          <Plus className="h-8 w-8 text-[#D4AF37] mb-2" />
          <h3 className="text-lg font-semibold text-[#F5F5F5]">Issue Certificate</h3>
          <p className="text-sm text-[#F5F5F5]/60">Create a new blockchain-verified certificate</p>
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className="p-6 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl hover:bg-[#4A4A4A]/30 transition-colors text-left"
        >
          <FileCheck className="h-8 w-8 text-[#28A745] mb-2" />
          <h3 className="text-lg font-semibold text-[#F5F5F5]">View Certificates</h3>
          <p className="text-sm text-[#F5F5F5]/60">Manage issued certificates</p>
        </button>
      </div>
    </div>
  );

  const filteredCertificates = certificates.filter(cert =>
    !certSearchQuery ||
    cert.studentName.toLowerCase().includes(certSearchQuery.toLowerCase()) ||
    cert.courseName.toLowerCase().includes(certSearchQuery.toLowerCase()) ||
    (cert.institutionName && cert.institutionName.toLowerCase().includes(certSearchQuery.toLowerCase())) ||
    cert.uniqueId.toLowerCase().includes(certSearchQuery.toLowerCase())
  );

  const renderCertificates = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-[#F5F5F5]">All Certificates</h3>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#F5F5F5]/40" />
          <input
            type="text"
            value={certSearchQuery}
            onChange={(e) => setCertSearchQuery(e.target.value)}
            placeholder="Search by student, course, institution, or ID..."
            className="w-full pl-9 pr-4 py-2 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-sm text-[#F5F5F5] placeholder-[#F5F5F5]/40 focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>
        <button
          onClick={() => setShowIssueModal(true)}
          className="px-4 py-2 bg-[#D4AF37] text-[#1A1A1A] rounded-lg hover:bg-[#C4A030] transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Issue New</span>
        </button>
      </div>

      <div className="bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#4A4A4A]/30">
                <th className="px-4 py-3 text-left text-sm font-medium text-[#F5F5F5]/70">Student</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#F5F5F5]/70">Course</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#F5F5F5]/70">Issue Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#F5F5F5]/70">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4A4A4A]/30">
              {filteredCertificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-[#4A4A4A]/10">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-[#F5F5F5] font-medium">{cert.studentName}</p>
                      <p className="text-xs text-[#F5F5F5]/50">{cert.studentEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#F5F5F5]">{cert.courseName}</td>
                  <td className="px-4 py-3 text-[#F5F5F5]/70">{formatDate(cert.issueDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}>
                      {cert.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCertificates.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#F5F5F5]/50">No certificates issued yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#F5F5F5]">Activity Log</h3>
      <div className="space-y-3">
        {activity.map((log) => (
          <div key={log.id} className="flex items-center space-x-3 p-4 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg">
            <Activity className="h-5 w-5 text-[#D4AF37]" />
            <div className="flex-1">
              <p className="text-[#F5F5F5]">{log.action}</p>
              <p className="text-[#F5F5F5]/50 text-sm">{log.details}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#F5F5F5]">{log.userName}</p>
              <p className="text-xs text-[#F5F5F5]/40">{formatDate(log.timestamp)}</p>
            </div>
          </div>
        ))}
        {activity.length === 0 && (
          <p className="text-center text-[#F5F5F5]/50 py-8">No activity recorded</p>
        )}
      </div>
    </div>
  );

  // Check if admin is verified
  if (user && user.role === 'admin' && !user.isVerified) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-4 pt-16">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="h-10 w-10 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] mb-4">Account Pending Verification</h1>
          <p className="text-[#F5F5F5]/60 mb-6">
            Your institution account is currently under review by our Super Admin team. 
            You will be able to issue certificates once your account is verified.
          </p>
          <div className="p-4 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg mb-6">
            <p className="text-sm text-[#F5F5F5]/50">Institution</p>
            <p className="text-[#F5F5F5] font-medium">{user.institutionName}</p>
          </div>
          <button
            onClick={() => {
              logout();
              onNavigate('landing');
            }}
            className="px-6 py-3 bg-[#D4AF37] text-[#1A1A1A] rounded-lg font-semibold hover:bg-[#C4A030] transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F5F5F5]">
              Institution <span className="text-[#D4AF37]">Dashboard</span>
            </h1>
            <p className="text-[#F5F5F5]/60">{user?.institutionName}</p>
          </div>
          <button
            onClick={() => setShowIssueModal(true)}
            className="px-6 py-3 bg-[#D4AF37] text-[#1A1A1A] rounded-lg font-semibold hover:bg-[#C4A030] transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Issue Certificate</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg p-1 mb-8">
          {(['overview', 'certificates', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-[#D4AF37] text-[#1A1A1A]'
                  : 'text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#4A4A4A]/30'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'certificates' && renderCertificates()}
          {activeTab === 'activity' && renderActivity()}
        </div>

        {/* Issue Certificate Modal */}
        {showIssueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1A1A1A] border border-[#4A4A4A]/50 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#F5F5F5]">Issue New Certificate</h2>
                  <button
                    onClick={() => setShowIssueModal(false)}
                    className="p-2 text-[#F5F5F5]/60 hover:text-[#F5F5F5] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleIssueCertificate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Student Name *</label>
                    <input
                      type="text"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                      placeholder="Enter student's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Student Email *</label>
                    <input
                      type="email"
                      value={formData.studentEmail}
                      onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                      placeholder="Enter student's email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Course/Program Name *</label>
                    <input
                      type="text"
                      value={formData.courseName}
                      onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                      placeholder="Enter course or program name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors resize-none"
                      placeholder="Optional description or notes"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Grade/Score</label>
                      <input
                        type="text"
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="w-full px-4 py-3 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                        placeholder="e.g., A+, 95%"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Expiry Date (Optional)</label>
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="w-full px-4 py-3 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-[#D4AF37] text-[#1A1A1A] rounded-lg font-semibold hover:bg-[#C4A030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Issuing...</span>
                        </>
                      ) : (
                        <>
                          <Award className="h-5 w-5" />
                          <span>Issue Certificate</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
