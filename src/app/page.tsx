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

// Pitch Deck Slide Component
type SlideVariant = 'blue' | 'orange' | 'red' | 'teal';

function PitchSlide({ 
  variant, 
  icon, 
  label, 
  title, 
  description, 
  statValue, 
  statLabel,
  quote
}: { 
  variant: SlideVariant;
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
  statValue: string;
  statLabel: string;
  quote?: string;
}) {
  const gradients: Record<SlideVariant, string> = {
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    teal: 'from-teal-500 to-teal-600'
  };
  
  const iconBgs: Record<SlideVariant, string> = {
    blue: 'bg-blue-400/30',
    orange: 'bg-orange-400/30',
    red: 'bg-red-400/30',
    teal: 'bg-teal-400/30'
  };
  
  const statColors: Record<SlideVariant, string> = {
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    teal: 'text-teal-600'
  };

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300">
      {/* Top colored section */}
      <div className={`bg-gradient-to-br ${gradients[variant]} p-10 text-white`}>
        <div className="flex items-start gap-6">
          <div className={`w-20 h-20 ${iconBgs[variant]} rounded-2xl flex items-center justify-center flex-shrink-0`}>
            <div className="scale-150">{icon}</div>
          </div>
          <div>
            <p className="text-white/80 text-base font-medium uppercase tracking-wide mb-2">{label}</p>
            <h3 className="text-3xl font-bold mb-3">{title}</h3>
            <p className="text-white/90 text-lg leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
      
      {/* Bottom white section */}
      <div className="bg-white p-10">
        <div className="text-center">
          <div className={`text-6xl font-bold ${statColors[variant]} mb-2`}>{statValue}</div>
          <div className="text-gray-500 text-lg">{statLabel}</div>
        </div>
        {quote && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-gray-600 text-lg italic border-l-4 border-red-200 pl-4 bg-red-50/50 py-3 rounded-r">
              {quote}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Pitch Deck Section with navigation
function PitchDeckSection({ mounted }: { mounted: boolean }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    // Credit AI Story Slides (Questions)
    {
      variant: 'blue' as SlideVariant,
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'The Question',
      title: '"Who has a risky debt ratio?"',
      description: 'What if your C-suite could ask your database questions in plain English and get instant answers—like speaking with a senior credit analyst?',
      statValue: '1,000',
      statLabel: 'Customer Profiles Queryable'
    },
    {
      variant: 'teal' as SlideVariant,
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: 'Credit AI Answer',
      title: 'Instant Risk Intelligence',
      description: 'Credit AI turns complex portfolio data into executive insights. Ask about borrower health, payment patterns, or exposure risk—get board-ready answers in seconds.',
      statValue: '<500ms',
      statLabel: 'Query Response Time'
    },
    // Problem Slides (Synapse)
    {
      variant: 'orange' as SlideVariant,
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Wasted Productivity',
      title: '60% Time on Manual Tasks',
      description: 'LMAs spend most of their time on spreadsheet tracking instead of strategic work',
      statValue: '60%',
      statLabel: 'Time Wasted on Admin'
    },
    {
      variant: 'orange' as SlideVariant,
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: 'Slow Response Times',
      title: '3-5 Days to Draft Amendments',
      description: 'Critical amendments take days to prepare—when every hour counts',
      statValue: '3-5 Days',
      statLabel: 'Amendment Turnaround'
    },
    {
      variant: 'red' as SlideVariant,
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'The Hidden Burden',
      title: '$2M Annual LMA Costs',
      description: 'Mid-sized banks spend millions on Loan Management Agents tracking covenants manually',
      statValue: '$2,000,000',
      statLabel: 'Annual Operating Cost'
    },
    {
      variant: 'red' as SlideVariant,
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      ),
      label: 'The Real Cost',
      title: 'Unknown Losses from Late Detection',
      description: 'By the time covenant breaches are discovered, significant losses may have already occurred',
      statValue: 'Unknown',
      statLabel: 'Preventable Losses',
      quote: "This isn't just inefficient—it's expensive and risky."
    },
    // Solution Slide
    {
      variant: 'teal' as SlideVariant,
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: 'The Solution',
      title: 'Synapse: Proactive Loan Management',
      description: 'Built on Credit AI, Synapse monitors 388 covenants across $237M in real-time—catching 59 warnings and 58 breaches before they become losses',
      statValue: '$1.6M',
      statLabel: 'Annual Savings Potential'
    }
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className={`relative z-10 px-6 py-16 transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-synapse-primary/10 text-synapse-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            Investor Pitch
          </div>
          <h2 className="text-3xl font-bold text-synapse-dark mb-4">The Story Behind Synapse</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From conversational credit intelligence to proactive loan management
          </p>
        </div>

        {/* Slide Navigation */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button 
            onClick={prevSlide}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide 
                    ? 'bg-synapse-primary w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
          
          <button 
            onClick={nextSlide}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Current Slide */}
        <div className="max-w-2xl mx-auto">
          <PitchSlide {...slides[currentSlide]} />
        </div>

        {/* Slide Counter */}
        <div className="text-center mt-6 text-sm text-gray-500">
          {currentSlide + 1} / {slides.length}
        </div>
      </div>
    </section>
  );
}

// Credit AI Analytics Showcase Section
function CreditAIShowcaseSection({ mounted }: { mounted: boolean }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      title: 'Choose Your Path',
      description: 'Two powerful ways to interact with your credit data',
      content: (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-indigo-200 transition-colors">
            <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Analytics Dashboard</h4>
            <p className="text-gray-600 mb-4">Explore conversational analytics with natural language queries. Ask questions about credit data and get instant insights.</p>
            <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Try Analytics
            </div>
          </div>
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 hover:border-indigo-300 transition-colors">
            <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C10.34 2 9 3.34 9 5C9 6.66 10.34 8 12 8C13.66 8 15 6.66 15 5C15 3.34 13.66 2 12 2ZM12 10C9.33 10 4 11.34 4 14V16H20V14C20 11.34 14.67 10 12 10Z"/>
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">API Playground</h4>
            <p className="text-gray-600 mb-4">Test the Credit AI API endpoints directly. Make credit decisions, extract features, and explore the full API capabilities.</p>
            <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              API Playground
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Key Features',
      description: 'Enterprise-grade credit intelligence powered by TimescaleDB',
      content: (
        <div className="bg-gray-50 rounded-2xl p-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="font-bold text-gray-900">Smart Feature Extraction</h4>
                <p className="text-gray-600 text-sm">20+ financial metrics calculated in real-time using TimescaleDB continuous aggregates</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">🎯</span>
              <div>
                <h4 className="font-bold text-gray-900">Dynamic Rule Engine</h4>
                <p className="text-gray-600 text-sm">Adaptive credit rules that adjust based on customer type (salaried, freelancer, business)</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">🧠</span>
              <div>
                <h4 className="font-bold text-gray-900">ML Risk Scoring</h4>
                <p className="text-gray-600 text-sm">LightGBM model with SHAP explanations for transparent risk assessment</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">💬</span>
              <div>
                <h4 className="font-bold text-gray-900">Conversational Analytics</h4>
                <p className="text-gray-600 text-sm">Natural language queries powered by Tiger MCP and template matching</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">📈</span>
              <div>
                <h4 className="font-bold text-gray-900">Time-Series Intelligence</h4>
                <p className="text-gray-600 text-sm">Behavioral pattern analysis over time, not just point-in-time snapshots</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">🔍</span>
              <div>
                <h4 className="font-bold text-gray-900">Full Explainability</h4>
                <p className="text-gray-600 text-sm">Every decision comes with detailed reasons and confidence scores</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Ask in Plain English',
      description: 'Query your credit data like you\'re talking to a senior analyst',
      content: (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-amber-50 p-4 border-b border-amber-100">
            <p className="text-amber-800 text-sm font-medium">API Configuration</p>
            <code className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded mt-1 inline-block">
              https://docker-credit-ai-api-dev.europe-west4.run.app
            </code>
          </div>
          <div className="p-6">
            <div className="flex gap-3 mb-6">
              <input 
                type="text" 
                value="Show me approved loans with high risk scores"
                readOnly
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-gray-700 bg-gray-50"
              />
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium">
                Execute Query
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4">Example Queries - Click to Try:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Recent Credit Decisions', 'High-Risk Approvals', 'Declined Applications', 'Loan Purpose Distribution', 'Decision Performance', 'Customer Risk Distribution'].map((query) => (
                <div key={query} className="bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-lg p-3 cursor-pointer transition-colors">
                  <p className="font-medium text-gray-900 text-sm">{query}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Instant SQL Generation',
      description: 'Your question becomes a database query automatically',
      content: (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900">Query Results</h4>
              <span className="text-sm text-gray-500">15 rows • 0ms</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-indigo-600">15</div>
                <div className="text-sm text-gray-500">Rows Returned</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-indigo-600">0ms</div>
                <div className="text-sm text-gray-500">Execution Time</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-teal-600">Template Match</div>
                <div className="text-sm text-gray-500">Query Method</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 p-4">
            <p className="text-slate-400 text-xs mb-2">Generated SQL Query</p>
            <code className="text-green-400 text-xs font-mono leading-relaxed block">
              SELECT cd.customer_id, c.customer_type, cd.risk_score, cd.decision, cd.decision_timestamp 
              FROM credit_decisions cd JOIN customers c ON cd.customer_id = c.customer_id 
              WHERE cd.risk_score &gt;= 0.3 ORDER BY cd.risk_score DESC LIMIT 50
            </code>
          </div>
        </div>
      )
    },
    {
      title: 'Board-Ready Results',
      description: 'Data returned in seconds, ready for executive decisions',
      content: (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Customer Id</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Customer Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Risk Score</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Decision</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Decision Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">1</td>
                  <td className="px-4 py-3 text-sm text-gray-600">individual</td>
                  <td className="px-4 py-3 text-sm text-gray-900">0.664</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">REFER</span></td>
                  <td className="px-4 py-3 text-sm text-gray-500">11/7/2025, 7:09:08 AM</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">950</td>
                  <td className="px-4 py-3 text-sm text-gray-600">individual</td>
                  <td className="px-4 py-3 text-sm text-gray-900">0.548</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">REFER</span></td>
                  <td className="px-4 py-3 text-sm text-gray-500">11/7/2025, 7:10:44 AM</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">803</td>
                  <td className="px-4 py-3 text-sm text-gray-600">individual</td>
                  <td className="px-4 py-3 text-sm text-gray-900">0.44</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">DECLINE</span></td>
                  <td className="px-4 py-3 text-sm text-gray-500">11/7/2025, 10:04:04 PM</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">947</td>
                  <td className="px-4 py-3 text-sm text-gray-600">individual</td>
                  <td className="px-4 py-3 text-sm text-gray-900">0.395</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">DECLINE</span></td>
                  <td className="px-4 py-3 text-sm text-gray-500">11/10/2025, 5:54:25 AM</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">Showing 4 of 15 results • Query completed in &lt;500ms</p>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className={`relative z-10 px-6 py-16 bg-gradient-to-b from-white to-gray-50 transition-all duration-1000 delay-450 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            See Credit AI in Action
          </div>
          <h2 className="text-3xl font-bold text-synapse-dark mb-4">{slides[currentSlide].title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {slides[currentSlide].description}
          </p>
        </div>

        {/* Slide Navigation */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button 
            onClick={prevSlide}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide 
                    ? 'bg-indigo-600 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
          
          <button 
            onClick={nextSlide}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Current Slide Content */}
        <div className="transition-all duration-300">
          {slides[currentSlide].content}
        </div>

        {/* Slide Counter */}
        <div className="text-center mt-6 text-sm text-gray-500">
          {currentSlide + 1} / {slides.length}
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <a 
            href="https://credit-ai-tigerdb.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Try Credit AI Now
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </section>
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

      {/* Pitch Deck Section */}
      <PitchDeckSection mounted={mounted} />

      {/* Credit AI Analytics Showcase Section */}
      <CreditAIShowcaseSection mounted={mounted} />

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
