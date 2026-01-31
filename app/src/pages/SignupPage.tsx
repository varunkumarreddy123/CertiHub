import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Building2, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { UserRole } from '@/types';

interface SignupPageProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
}

export default function SignupPage({ onNavigate }: SignupPageProps) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>('user');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    institutionName: '',
    institutionAddress: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role,
        institutionName: role === 'admin' ? formData.institutionName : undefined,
        institutionAddress: role === 'admin' ? formData.institutionAddress : undefined,
      });

      // Redirect based on role
      if (role === 'superadmin') {
        onNavigate('superadmin');
      } else if (role === 'admin') {
        onNavigate('admin');
      } else {
        onNavigate('dashboard');
      }
    } catch (error) {
      // Error handled in auth context
    } finally {
      setIsLoading(false);
    }
  };

  const renderRoleSelection = () => (
    <div className="space-y-4">
      <button
        onClick={() => handleRoleSelect('user')}
        className="w-full p-6 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all group text-left"
      >
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors">
            <User className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F5F5F5] mb-1">Student / Individual</h3>
            <p className="text-[#F5F5F5]/60 text-sm">
              View and manage your certificates. Verify credentials instantly.
            </p>
          </div>
        </div>
      </button>

      <button
        onClick={() => handleRoleSelect('admin')}
        className="w-full p-6 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all group text-left"
      >
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors">
            <Building2 className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F5F5F5] mb-1">Institution / Admin</h3>
            <p className="text-[#F5F5F5]/60 text-sm">
              Issue certificates for your students. Requires verification by Super Admin.
            </p>
          </div>
        </div>
      </button>

      <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg">
        <p className="text-sm text-[#D4AF37]">
          <strong>Note:</strong> Institution accounts require verification by our Super Admin team 
          before you can start issuing certificates.
        </p>
      </div>
    </div>
  );

  const renderSignupForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Full Name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5F5F5]/40" />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
            className="w-full pl-10 pr-4 py-3 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
            />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5F5F5]/40" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            className="w-full pl-10 pr-4 py-3 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
          />
        </div>
      </div>

      {role === 'admin' && (
        <>
          <div>
            <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Institution Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5F5F5]/40" />
              <input
                type="text"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleChange}
                placeholder="Enter institution name"
                required
                className="w-full pl-10 pr-4 py-3 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Institution Address</label>
            <input
              type="text"
              name="institutionAddress"
              value={formData.institutionAddress}
              onChange={handleChange}
              placeholder="Enter institution address"
              required
              className="w-full px-4 py-3 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5F5F5]/40" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
            minLength={6}
            className="w-full pl-10 pr-12 py-3 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F5F5F5]/40 hover:text-[#F5F5F5] transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5F5F5]/40" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            required
            className="w-full pl-10 pr-4 py-3 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-lg text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-[#D4AF37] text-[#1A1A1A] rounded-lg font-semibold hover:bg-[#C4A030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#1A1A1A] border-t-transparent" />
        ) : (
          <>
            <span>Create Account</span>
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => setStep(1)}
        className="w-full py-3 text-[#F5F5F5]/60 hover:text-[#F5F5F5] transition-colors"
      >
        Back to role selection
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 pb-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D4AF37]/10 rounded-xl mb-4">
            <Shield className="h-8 w-8 text-[#D4AF37]" />
          </div>
          <h2 className="text-3xl font-bold text-[#F5F5F5]">Create Account</h2>
          <p className="text-[#F5F5F5]/60 mt-2">
            {step === 1 ? 'Choose your account type' : 'Complete your registration'}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl p-8">
          {step === 1 ? renderRoleSelection() : renderSignupForm()}
        </div>

        {/* Login Link */}
        <p className="text-center mt-6 text-[#F5F5F5]/60">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-[#D4AF37] hover:text-[#C4A030] font-medium transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
