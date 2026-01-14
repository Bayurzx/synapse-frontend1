'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

// Animated background particles
function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-96 h-96 -top-48 -left-48 bg-gradient-to-br from-synapse-primary/20 to-synapse-secondary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-gradient-to-br from-synapse-secondary/20 to-synapse-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute w-64 h-64 top-1/2 left-1/4 bg-gradient-to-br from-synapse-primary/10 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  );
}

// Feature card component
function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: string }) {
  return (
    <div 
      className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-synapse-border/50"
      style={{ animationDelay: delay }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-synapse-primary/5 to-synapse-secondary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-synapse-primary to-synapse-secondary rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-synapse-dark mb-2">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// Stats counter with animation
function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <div className="text-center">
      <div className="text-4xl font-bold bg-gradient-to-r from-synapse-primary to-synapse-secondary bg-clip-text text-transparent">
        {count}{suffix}
      </div>
      <div className="text-gray-600 text-sm mt-1">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-synapse-light via-white to-synapse-light relative overflow-hidden">
      <ParticleBackground />
      
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-synapse-primary to-synapse-secondary rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-synapse-dark">Synapse</span>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://credit-ai-tigerdb.netlify.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-synapse-primary transition-colors text-sm font-medium"
            >
              Credit AI →
            </a>
            <Link 
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-synapse-primary hover:bg-synapse-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`relative z-10 px-6 pt-16 pb-24 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-synapse-primary/10 text-synapse-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-synapse-success rounded-full animate-pulse" />
            Powered by TigerData TimescaleDB
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-synapse-dark mb-6 leading-tight">
            Intelligent Lending
            <br />
            <span className="bg-gradient-to-r from-synapse-primary to-synapse-secondary bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time covenant monitoring, AI-powered risk assessment, and automated document generation — all in one platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gradient-to-r from-synapse-primary to-synapse-secondary hover:from-synapse-primary/90 hover:to-synapse-secondary/90 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
            >
              Launch Dashboard
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a 
              href="https://credit-ai-tigerdb.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white hover:bg-gray-50 text-synapse-dark px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-synapse-border flex items-center gap-2"
            >
              <svg className="w-5 h-5 text-synapse-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Credit AI
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`relative z-10 px-6 py-12 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-synapse-border/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCounter value={40} label="Faster Documentation" suffix="%" />
              <StatCounter value={99} label="Uptime SLA" suffix="%" />
              <StatCounter value={500} label="Response Time" suffix="ms" />
              <StatCounter value={24} label="Real-time Monitoring" suffix="/7" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`relative z-10 px-6 py-16 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-synapse-dark mb-4">Everything You Need</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              A complete lending management platform built for modern financial institutions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              delay="0ms"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="Credit Risk Dashboard"
              description="Real-time borrower risk scores with traffic light indicators and trend analysis powered by Credit AI."
            />
            
            <FeatureCard
              delay="100ms"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="Document Generation"
              description="Auto-generate loan agreements, amendments, and compliance certificates with risk-adaptive clauses."
            />
            
            <FeatureCard
              delay="200ms"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              }
              title="Covenant Monitoring"
              description="Proactive breach detection with configurable alerts and automated notification workflows."
            />
            
            <FeatureCard
              delay="300ms"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              }
              title="Scenario Analysis"
              description="What-if simulations to project covenant impacts and generate proactive amendment proposals."
            />
            
            <FeatureCard
              delay="400ms"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              }
              title="DocuSign Integration"
              description="Seamless e-signature workflows with real-time status tracking and audit trails."
            />
            
            <FeatureCard
              delay="500ms"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              title="Real-time Updates"
              description="WebSocket-powered live updates for covenant status, alerts, and risk score changes."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`relative z-10 px-6 py-20 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-synapse-primary to-synapse-secondary rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Lending Operations?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Experience the power of AI-driven lending management with real-time insights and automated workflows.
              </p>
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-white text-synapse-primary px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg"
              >
                Get Started Now
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-synapse-border/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-synapse-primary to-synapse-secondary rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm text-gray-600">
              Synapse Lending Platform • Built for TigerData Hackathon 2026
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a 
              href="https://credit-ai-tigerdb.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-synapse-primary transition-colors"
            >
              Credit AI
            </a>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-synapse-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/documents" className="text-sm text-gray-600 hover:text-synapse-primary transition-colors">
              Documents
            </Link>
            <Link href="/monitoring" className="text-sm text-gray-600 hover:text-synapse-primary transition-colors">
              Monitoring
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
