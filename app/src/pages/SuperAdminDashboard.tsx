import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { certificateService } from '@/services/certificate';
import { authService } from '@/services/auth';
import { blockchainService } from '@/services/blockchain';
import type { User, Certificate, DashboardStats, ActivityLog, BlockchainRecord } from '@/types';
import { Users, FileCheck, Building2, CheckCircle, XCircle, Activity, Blocks, LogOut, Hash, Search } from 'lucide-react';
import { toast } from 'sonner';

interface SuperAdminDashboardProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
}

export default function SuperAdminDashboard({ onNavigate }: SuperAdminDashboardProps) {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'institutions' | 'certificates' | 'blockchain' | 'activity'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [blockchainRecords, setBlockchainRecords] = useState<BlockchainRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [blockchainSearch, setBlockchainSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allUsers, allCerts, dashboardStats, allActivity, records] = await Promise.all([
        authService.getAllUsersAsync(),
        certificateService.getAllCertificatesAsync(),
        certificateService.getDashboardStatsAsync(),
        certificateService.getAllActivityAsync(),
        blockchainService.getAllRecordsAsync(),
      ]);
      setUsers(allUsers);
      setCertificates(allCerts);
      setStats(dashboardStats);
      setActivity(allActivity);
      setBlockchainRecords(records);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyInstitution = async (userId: string) => {
    setIsLoading(true);
    try {
      await authService.verifyAdmin(userId);
      toast.success('Institution verified successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to verify institution');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectInstitution = async (userId: string) => {
    setIsLoading(true);
    try {
      await authService.rejectAdmin(userId);
      toast.success('Institution rejected');
      loadData();
    } catch (error) {
      toast.error('Failed to reject institution');
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

  const pendingInstitutions = users.filter(u => u.role === 'admin' && !u.isVerified);
  const verifiedInstitutions = users.filter(u => u.role === 'admin' && u.isVerified);

  const statCards = [
    { label: 'Total Certificates', value: stats?.totalCertificates || 0, icon: FileCheck, color: 'text-[#D4AF37]', bgColor: 'bg-[#D4AF37]/10' },
    { label: 'Institutions', value: verifiedInstitutions.length, icon: Building2, color: 'text-[#28A745]', bgColor: 'bg-[#28A745]/10' },
    { label: 'Pending Verification', value: pendingInstitutions.length, icon: Users, color: 'text-[#F5F5F5]', bgColor: 'bg-[#F5F5F5]/10' },
    { label: 'Blockchain Blocks', value: blockchainRecords.length, icon: Blocks, color: 'text-[#D4AF37]', bgColor: 'bg-[#D4AF37]/10' },
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
            <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-[#F5F5F5]">{stat.value}</div>
            <div className="text-sm text-[#F5F5F5]/50">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pending Verifications */}
      {pendingInstitutions.length > 0 && (
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-[#D4AF37]" />
              <h3 className="text-lg font-semibold text-[#F5F5F5]">Pending Verifications</h3>
            </div>
            <span className="px-3 py-1 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full text-sm font-medium">
              {pendingInstitutions.length} pending
            </span>
          </div>
          <div className="space-y-3">
            {pendingInstitutions.slice(0, 3).map((inst) => (
              <div key={inst.id} className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-lg">
                <div>
                  <p className="text-[#F5F5F5] font-medium">{inst.institutionName}</p>
                  <p className="text-sm text-[#F5F5F5]/50">{inst.email}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVerifyInstitution(inst.id)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-[#28A745] text-white rounded-lg hover:bg-[#28A745]/80 transition-colors flex items-center space-x-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleRejectInstitution(inst.id)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-[#DC3545] text-white rounded-lg hover:bg-[#DC3545]/80 transition-colors flex items-center space-x-1"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
    </div>
  );

  const renderInstitutions = () => (
    <div className="space-y-6">
      {/* Pending Institutions */}
      <div>
        <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Pending Verification</h3>
        {pendingInstitutions.length > 0 ? (
          <div className="space-y-3">
            {pendingInstitutions.map((inst) => (
              <div key={inst.id} className="flex items-center justify-between p-4 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-[#F5F5F5] font-medium">{inst.institutionName}</p>
                    <p className="text-sm text-[#F5F5F5]/50">{inst.email}</p>
                    <p className="text-xs text-[#F5F5F5]/40">Applied: {formatDate(inst.createdAt)}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVerifyInstitution(inst.id)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-[#28A745] text-white rounded-lg hover:bg-[#28A745]/80 transition-colors flex items-center space-x-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleRejectInstitution(inst.id)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-[#DC3545] text-white rounded-lg hover:bg-[#DC3545]/80 transition-colors flex items-center space-x-1"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-[#4A4A4A]/10 border border-[#4A4A4A]/30 rounded-lg">
            <CheckCircle className="h-12 w-12 text-[#28A745] mx-auto mb-2" />
            <p className="text-[#F5F5F5]/60">No pending verifications</p>
          </div>
        )}
      </div>

      {/* Verified Institutions */}
      <div>
        <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Verified Institutions</h3>
        {verifiedInstitutions.length > 0 ? (
          <div className="bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#4A4A4A]/30">
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#F5F5F5]/70">Institution</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#F5F5F5]/70">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#F5F5F5]/70">Certificates</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#F5F5F5]/70">Joined</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#F5F5F5]/70">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4A4A4A]/30">
                {verifiedInstitutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-[#4A4A4A]/10">
                    <td className="px-4 py-3">
                      <p className="text-[#F5F5F5] font-medium">{inst.institutionName}</p>
                    </td>
                    <td className="px-4 py-3 text-[#F5F5F5]/70">{inst.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full text-sm font-medium">
                        {certificates.filter((c) => c.institutionId === inst.id).length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#F5F5F5]/70">{formatDate(inst.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-[#28A745]/20 text-[#28A745] rounded-full text-xs font-medium">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-[#F5F5F5]/50 py-8">No verified institutions yet</p>
        )}
      </div>
    </div>
  );

  const renderCertificates = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#F5F5F5]">All Certificates</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#F5F5F5]/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, course, institution, or ID..."
            className="pl-9 pr-4 py-2 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-sm text-[#F5F5F5] placeholder-[#F5F5F5]/40 focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#4A4A4A]/30">
                <th className="px-4 py-3 text-left text-sm font-medium text-[#F5F5F5]/70">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#F5F5F5]/70">Student</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#F5F5F5]/70">Course</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#F5F5F5]/70">Institution</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#F5F5F5]/70">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4A4A4A]/30">
              {certificates
                .filter(c => 
                  !searchQuery ||
                  c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (c.institutionName && c.institutionName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  c.uniqueId.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((cert) => (
                <tr key={cert.id} className="hover:bg-[#4A4A4A]/10">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[#D4AF37]">{cert.uniqueId}</span>
                  </td>
                  <td className="px-4 py-3 text-[#F5F5F5]">{cert.studentName}</td>
                  <td className="px-4 py-3 text-[#F5F5F5]">{cert.courseName}</td>
                  <td className="px-4 py-3 text-[#F5F5F5]/70">{cert.institutionName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cert.status === 'active' ? 'bg-[#28A745]/20 text-[#28A745]' :
                      cert.status === 'revoked' ? 'bg-[#DC3545]/20 text-[#DC3545]' :
                      'bg-[#F5F5F5]/20 text-[#F5F5F5]'
                    }`}>
                      {cert.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const filteredBlockchainRecords = blockchainRecords.filter(
    (r) =>
      !blockchainSearch ||
      r.uniqueId.toLowerCase().includes(blockchainSearch.toLowerCase()) ||
      r.studentName.toLowerCase().includes(blockchainSearch.toLowerCase()) ||
      r.institutionName.toLowerCase().includes(blockchainSearch.toLowerCase()) ||
      r.courseName.toLowerCase().includes(blockchainSearch.toLowerCase()) ||
      r.hash.toLowerCase().includes(blockchainSearch.toLowerCase())
  );

  const renderBlockchain = () => (
    <div className="space-y-6">
      {/* Stats & Header */}
      <div className="bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center">
              <Blocks className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#F5F5F5]">Blockchain Anchors</h3>
              <p className="text-[#F5F5F5]/60">Keccak256-hashed certificate records for tamper verification</p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-4 py-2 bg-[#D4AF37]/20 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/30 transition-colors text-sm font-medium"
          >
            Refresh
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[#1A1A1A] rounded-lg border border-[#4A4A4A]/30">
            <p className="text-sm text-[#F5F5F5]/50">Total Anchors</p>
            <p className="text-2xl font-bold text-[#D4AF37]">{blockchainRecords.length}</p>
          </div>
          <div className="p-4 bg-[#1A1A1A] rounded-lg border border-[#4A4A4A]/30">
            <p className="text-sm text-[#F5F5F5]/50">Certificates Anchored</p>
            <p className="text-2xl font-bold text-[#28A745]">{blockchainRecords.length}</p>
          </div>
          <div className="p-4 bg-[#1A1A1A] rounded-lg border border-[#4A4A4A]/30">
            <p className="text-sm text-[#F5F5F5]/50">Hash Algorithm</p>
            <p className="text-lg font-bold text-[#F5F5F5]">Keccak256</p>
          </div>
          <div className="p-4 bg-[#1A1A1A] rounded-lg border border-[#4A4A4A]/30">
            <p className="text-sm text-[#F5F5F5]/50">Status</p>
            <p className="text-lg font-bold text-[#28A745]">Operational</p>
          </div>
        </div>
      </div>

      {/* Block List */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-[#F5F5F5]">All Anchored Blocks</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#F5F5F5]/40" />
            <input
              type="text"
              value={blockchainSearch}
              onChange={(e) => setBlockchainSearch(e.target.value)}
              placeholder="Search by ID, student, institution..."
              className="pl-9 pr-4 py-2 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-sm text-[#F5F5F5] placeholder-[#F5F5F5]/40 focus:outline-none focus:border-[#D4AF37] transition-colors w-full sm:w-64"
            />
          </div>
        </div>
        <div className="space-y-3">
          {(blockchainSearch ? filteredBlockchainRecords : blockchainRecords)
            .slice()
            .reverse()
            .map((record) => (
              <div
                key={record.certificateId}
                className="p-4 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg hover:border-[#D4AF37]/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-[#D4AF37] flex-shrink-0" />
                    <span className="text-sm text-[#F5F5F5]/50">Block #{record.blockNumber ?? '—'}</span>
                    <button
                      onClick={() => onNavigate('verify', { uniqueId: record.uniqueId })}
                      className="ml-2 px-2 py-1 bg-[#D4AF37]/20 text-[#D4AF37] rounded text-xs hover:bg-[#D4AF37]/30 transition-colors"
                    >
                      Verify
                    </button>
                  </div>
                  <span className="text-xs text-[#F5F5F5]/40">
                    {record.timestamp ? new Date(record.timestamp).toLocaleString() : '—'}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-[#F5F5F5]/50">Certificate: </span>
                    <span className="text-[#F5F5F5] font-mono text-xs">{record.uniqueId}</span>
                  </div>
                  <div>
                    <span className="text-[#F5F5F5]/50">Student: </span>
                    <span className="text-[#F5F5F5]">{record.studentName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#F5F5F5]/50">Course: </span>
                    <span className="text-[#F5F5F5]">{record.courseName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#F5F5F5]/50">Institution: </span>
                    <span className="text-[#F5F5F5] truncate" title={record.institutionName}>
                      {record.institutionName || '—'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 p-2 bg-[#1A1A1A] rounded flex items-start gap-2">
                  <span className="text-xs text-[#F5F5F5]/50 flex-shrink-0">Hash:</span>
                  <span className="text-xs font-mono text-[#D4AF37] break-all">{record.hash}</span>
                </div>
              </div>
            ))}
          {(blockchainSearch ? filteredBlockchainRecords : blockchainRecords).length === 0 && (
            <div className="text-center py-12 bg-[#4A4A4A]/10 border border-[#4A4A4A]/30 rounded-lg">
              <Blocks className="h-12 w-12 text-[#F5F5F5]/30 mx-auto mb-3" />
              <p className="text-[#F5F5F5]/60">
                {blockchainSearch ? 'No matching blocks found' : 'No blocks recorded yet'}
              </p>
              <p className="text-[#F5F5F5]/40 text-sm mt-1">
                Certificates will appear here once issued by institutions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#F5F5F5]">System Activity Log</h3>
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

  return (
    <div className="min-h-screen bg-[#1A1A1A] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F5F5F5]">
              Super <span className="text-[#D4AF37]">Admin</span>
            </h1>
            <p className="text-[#F5F5F5]/60">System management dashboard</p>
          </div>
          <button
            onClick={() => {
              logout();
              onNavigate('landing');
            }}
            className="px-4 py-2 bg-[#4A4A4A]/50 text-[#F5F5F5] rounded-lg hover:bg-[#4A4A4A] transition-colors flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg p-1 mb-8">
          {(['overview', 'institutions', 'certificates', 'blockchain', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[100px] px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
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
          {activeTab === 'institutions' && renderInstitutions()}
          {activeTab === 'certificates' && renderCertificates()}
          {activeTab === 'blockchain' && renderBlockchain()}
          {activeTab === 'activity' && renderActivity()}
        </div>
      </div>
    </div>
  );
}
