import { Shield, Search, Award, Lock, Zap, Database, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {

  const features = [
    {
      icon: Lock,
      title: 'Immutable Ledger',
      description: 'Once recorded on the blockchain, certificates cannot be altered or tampered with, ensuring permanent authenticity.',
    },
    {
      icon: Database,
      title: 'Decentralized Trust',
      description: 'No single point of failure. Distributed verification across the blockchain network ensures reliability.',
    },
    {
      icon: Zap,
      title: 'Instant Verification',
      description: 'Verify credentials in seconds, not days. Real-time blockchain confirmation provides immediate results.',
    },
    {
      icon: Shield,
      title: 'Fraud Prevention',
      description: 'Cryptographic security ensures that fake certificates are immediately detected and flagged.',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Institution Registration',
      description: 'Educational institutions register and get verified by our Super Admin team.',
    },
    {
      step: '02',
      title: 'Certificate Issuance',
      description: 'Verified institutions issue digital certificates with unique blockchain IDs.',
    },
    {
      step: '03',
      title: 'Blockchain Storage',
      description: 'Certificate hashes are stored on the blockchain, creating an immutable record.',
    },
    {
      step: '04',
      title: 'Instant Verification',
      description: 'Anyone can verify certificates instantly using the unique ID or QR code.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl animate-pulse delay-1000" />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }} />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full mb-8">
              <Database className="h-4 w-4 text-[#D4AF37]" />
              <span className="text-sm text-[#D4AF37]">Powered by Blockchain Technology</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-[#F5F5F5]">The Future of</span>
              <br />
              <span className="text-[#D4AF37]">Credential Verification</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl text-[#F5F5F5]/70 max-w-2xl mx-auto mb-10">
              Immutable. Instant. Secure. CertiChain revolutionizes how educational 
              credentials are issued, stored, and verified using blockchain technology.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('verify')}
                className="group px-8 py-4 bg-[#D4AF37] text-[#1A1A1A] rounded-lg font-semibold hover:bg-[#C4A030] transition-all duration-300 flex items-center space-x-2"
              >
                <Search className="h-5 w-5" />
                <span>Verify Certificate</span>
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="px-8 py-4 border border-[#4A4A4A] text-[#F5F5F5] rounded-lg font-semibold hover:bg-[#4A4A4A]/50 transition-all duration-300 flex items-center space-x-2"
              >
                <Award className="h-5 w-5" />
                <span>Issue Certificates</span>
              </button>
            </div>

          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-[#4A4A4A] rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F5F5] mb-4">
              Why <span className="text-[#D4AF37]">Blockchain?</span>
            </h2>
            <p className="text-[#F5F5F5]/70 max-w-2xl mx-auto">
              Blockchain technology provides unprecedented security and transparency 
              for credential verification.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 bg-[#4A4A4A]/20 border border-[#4A4A4A]/50 rounded-xl hover:border-[#D4AF37]/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#D4AF37]/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">{feature.title}</h3>
                <p className="text-[#F5F5F5]/60 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-[#1A1A1A] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 via-transparent to-[#D4AF37]/5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F5F5] mb-4">
              How It <span className="text-[#D4AF37]">Works</span>
            </h2>
            <p className="text-[#F5F5F5]/70 max-w-2xl mx-auto">
              A simple four-step process to issue and verify blockchain-secured certificates.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, idx) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-bold text-[#D4AF37]/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">{item.title}</h3>
                <p className="text-[#F5F5F5]/60">{item.description}</p>
                {idx < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 right-0 w-full h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#4A4A4A]/50 to-[#4A4A4A]/20 border border-[#D4AF37]/30 rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F5F5] mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-[#F5F5F5]/70 mb-8 max-w-xl mx-auto">
              Join hundreds of institutions already using CertiChain to issue 
              secure, verifiable credentials.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('signup')}
                className="px-8 py-4 bg-[#D4AF37] text-[#1A1A1A] rounded-lg font-semibold hover:bg-[#C4A030] transition-colors"
              >
                Create Account
              </button>
              <button
                onClick={() => onNavigate('verify')}
                className="px-8 py-4 border border-[#4A4A4A] text-[#F5F5F5] rounded-lg font-semibold hover:bg-[#4A4A4A]/50 transition-colors"
              >
                Verify a Certificate
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#1A1A1A] border-t border-[#4A4A4A]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-[#D4AF37]" />
              <span className="text-lg font-bold">
                <span className="text-[#F5F5F5]">Certi</span>
                <span className="text-[#D4AF37]">Chain</span>
              </span>
            </div>
            <div className="text-[#F5F5F5]/50 text-sm">
              © 2024 CertiChain. All rights reserved. Built for Final Year Project.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
