import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      await login({ email, password });
      
      // Redirect based on role
      const user = JSON.parse(localStorage.getItem('certichain_current_user') || '{}');
      if (user.role === 'superadmin') {
        onNavigate('superadmin');
      } else if (user.role === 'admin') {
        onNavigate('admin');
      } else {
        onNavigate('dashboard');
      }
    } catch (error) {
      // Error is handled in auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D4AF37]/10 rounded-xl mb-4">
            <Shield className="h-8 w-8 text-[#D4AF37]" />
          </div>
          <h2 className="text-3xl font-bold text-[#F5F5F5]">Welcome Back</h2>
          <p className="text-[#F5F5F5]/60 mt-2">Sign in to your CertiChain account</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#F5F5F5] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5F5F5]/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-[#1A1A1A] border border-[#4A4A4A] rounded-lg text-[#F5F5F5] placeholder-[#F5F5F5]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#F5F5F5] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5F5F5]/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-[#1A1A1A] border border-[#4A4A4A] rounded-lg text-[#F5F5F5] placeholder-[#F5F5F5]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#D4AF37] text-[#1A1A1A] rounded-lg font-semibold hover:bg-[#C4A030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#1A1A1A] border-t-transparent" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#4A4A4A]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#4A4A4A]/20 text-[#F5F5F5]/50">Demo Credentials</span>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#4A4A4A]/50">
              <p className="text-[#F5F5F5]/60">Super Admin:</p>
              <p className="text-[#D4AF37] font-mono">superadmin@certichain.com / admin123</p>
            </div>
          </div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-[#F5F5F5]/60">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('signup')}
            className="text-[#D4AF37] hover:text-[#C4A030] font-medium transition-colors"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
