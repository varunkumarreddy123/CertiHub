import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Navigation from '@/components/Navigation';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import VerifyCertificate from '@/pages/VerifyCertificate';
import UserDashboard from '@/pages/UserDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import CertificateView from '@/pages/CertificateView';
import HelpSupport from '@/components/HelpSupport';
import './App.css';

type Route = 
  | 'landing' 
  | 'login' 
  | 'signup' 
  | 'verify' 
  | 'dashboard' 
  | 'admin' 
  | 'superadmin' 
  | 'certificate'
  | 'help';

interface NavigateFunction {
  (route: string, params?: Record<string, string>): void;
}

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<Route>('landing');
  const [routeParams, setRouteParams] = useState<Record<string, string>>({});
  const { user, isAuthenticated, isLoading } = useAuth();

  // Handle URL hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'landing';
      const [route, ...params] = hash.split('/');
      
      if (route === 'verify' && params[0]) {
        setRouteParams({ uniqueId: params[0] });
        setCurrentRoute('verify');
      } else if (route === 'certificate' && params[0]) {
        setRouteParams({ id: params[0] });
        setCurrentRoute('certificate');
      } else if (isValidRoute(route)) {
        setCurrentRoute(route as Route);
      } else {
        setCurrentRoute('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isValidRoute = (route: string): boolean => {
    const validRoutes: Route[] = ['landing', 'login', 'signup', 'verify', 'dashboard', 'admin', 'superadmin', 'certificate', 'help'];
    return validRoutes.includes(route as Route);
  };

  const navigate: NavigateFunction = (route, params) => {
    if (params) {
      const paramString = Object.values(params).join('/');
      window.location.hash = `#${route}/${paramString}`;
    } else {
      window.location.hash = `#${route}`;
    }
  };

  // Protected route helper
  const renderProtectedRoute = (component: React.ReactNode, allowedRoles?: string[]) => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <LoginPage onNavigate={navigate} />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A]">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-400 mb-6">You don't have permission to access this page.</p>
            <button
              onClick={() => navigate('landing')}
              className="px-6 py-3 bg-[#D4AF37] text-black rounded-lg hover:bg-[#C4A030] transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return component;
  };

  const renderRoute = () => {
    switch (currentRoute) {
      case 'landing':
        return <LandingPage onNavigate={navigate} />;
      case 'login':
        return isAuthenticated ? <UserDashboard onNavigate={navigate} /> : <LoginPage onNavigate={navigate} />;
      case 'signup':
        return isAuthenticated ? <UserDashboard onNavigate={navigate} /> : <SignupPage onNavigate={navigate} />;
      case 'verify':
        return <VerifyCertificate uniqueId={routeParams.uniqueId} onNavigate={navigate} />;
      case 'dashboard':
        return renderProtectedRoute(<UserDashboard onNavigate={navigate} />, ['user', 'admin', 'superadmin']);
      case 'admin':
        return renderProtectedRoute(<AdminDashboard onNavigate={navigate} />, ['admin', 'superadmin']);
      case 'superadmin':
        return renderProtectedRoute(<SuperAdminDashboard onNavigate={navigate} />, ['superadmin']);
      case 'certificate':
        return <CertificateView certificateId={routeParams.id} onNavigate={navigate} />;
      case 'help':
        return renderProtectedRoute(<HelpSupport />, ['user', 'admin', 'superadmin']);
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#F5F5F5]">
      <Navigation onNavigate={navigate} currentRoute={currentRoute} />
      <main>
        {renderRoute()}
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
