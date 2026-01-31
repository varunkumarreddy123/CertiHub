import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { messagingService } from '@/services/messaging';
import { Shield, Menu, X, User, LogOut, MessageSquare } from 'lucide-react';

interface NavigationProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
  currentRoute: string;
}

export default function Navigation({ onNavigate, currentRoute }: NavigationProps) {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      messagingService.getUnreadCountAsync().then(setUnreadCount);
      const interval = setInterval(() => {
        messagingService.getUnreadCountAsync().then(setUnreadCount);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    onNavigate('landing');
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Home', route: 'landing', show: true },
    { label: 'Verify', route: 'verify', show: true },
    { label: 'Dashboard', route: 'dashboard', show: isAuthenticated },
    { label: 'Admin', route: 'admin', show: isAuthenticated && hasRole(['admin', 'superadmin']) },
    { label: 'Super Admin', route: 'superadmin', show: isAuthenticated && hasRole(['superadmin']) },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A]/90 backdrop-blur-md border-b border-[#4A4A4A]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center space-x-2 group"
          >
            <div className="relative">
              <Shield className="h-8 w-8 text-[#D4AF37] transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-[#F5F5F5]">Certi</span>
              <span className="text-[#D4AF37]">Chain</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.filter(link => link.show).map((link) => (
              <button
                key={link.route}
                onClick={() => onNavigate(link.route)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentRoute === link.route
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                    : 'text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#4A4A4A]/50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onNavigate('help')}
                  className={`relative p-2 rounded-lg transition-all ${
                    currentRoute === 'help'
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                      : 'text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#4A4A4A]/50'
                  }`}
                  title="Help & Support"
                >
                  <MessageSquare className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#DC3545] text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#4A4A4A]/50 rounded-lg">
                  <User className="h-4 w-4 text-[#D4AF37]" />
                  <span className="text-sm text-[#F5F5F5]">{user?.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full capitalize">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-[#F5F5F5]/70 hover:text-[#DC3545] hover:bg-[#DC3545]/10 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 text-sm font-medium text-[#F5F5F5]/70 hover:text-[#F5F5F5] transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-4 py-2 text-sm font-medium bg-[#D4AF37] text-[#1A1A1A] rounded-lg hover:bg-[#C4A030] transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#F5F5F5] hover:bg-[#4A4A4A]/50 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#4A4A4A]/30">
            <div className="flex flex-col space-y-2">
              {navLinks.filter(link => link.show).map((link) => (
                <button
                  key={link.route}
                  onClick={() => {
                    onNavigate(link.route);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg text-left font-medium transition-all ${
                    currentRoute === link.route
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                      : 'text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#4A4A4A]/50'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              
              {isAuthenticated ? (
                <div className="pt-4 border-t border-[#4A4A4A]/30">
                  <div className="px-4 py-3 mb-2 bg-[#4A4A4A]/30 rounded-lg">
                    <p className="text-[#F5F5F5] font-medium">{user?.name}</p>
                    <p className="text-sm text-[#F5F5F5]/50">{user?.email}</p>
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full capitalize">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-[#DC3545] hover:bg-[#DC3545]/10 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-[#4A4A4A]/30 flex flex-col space-y-2">
                  <button
                    onClick={() => {
                      onNavigate('login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-4 py-3 text-left text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#4A4A4A]/50 rounded-lg transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('signup');
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-4 py-3 text-left bg-[#D4AF37] text-[#1A1A1A] rounded-lg hover:bg-[#C4A030] transition-colors font-medium"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
