/**
 * CORE Quick Start Guide Component
 * Provides an interactive intro to the CORE platform
 */

import { useState } from 'react';
import COREButton from './COREButton';
import CORELogo from './CORELogo';

export default function COREQuickStart({ onDismiss }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to CORE Careers',
      subtitle: 'Your HR-Tech Hub',
      description: 'Discover powerful micro-apps designed to streamline your HR operations. Each app is a focused tool built to solve specific HR challenges.',
      icon: '👋',
    },
    {
      title: '🎯 Explore Micro-Apps',
      subtitle: 'Choose from 10+ tools',
      description: 'From resume screening to exit interview analysis, all tools are accessible from one dashboard. Filter by Live or Coming Soon status.',
      icon: '📱',
    },
    {
      title: '⭐ Join Pro Members',
      subtitle: 'Unlimited access awaits',
      description: 'Remove ads and unlock unlimited access to all CORE micro-apps. Upgrade to Pro for the full experience.',
      icon: '✨',
    },
    {
      title: '🚀 Let\'s Get Started',
      subtitle: 'Explore your first app',
      description: 'Head to the dashboard to discover which micro-app can help you today.',
      icon: '🎉',
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-8 bg-[#F5F5F5] border-b-2 border-[#E0E0E0] text-center">
          <CORELogo size="lg" showText={false} />
          <h2 className="text-2xl font-bold text-[#4A4A4A] mt-4">{current.title}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          <div className="text-6xl mb-4">{current.icon}</div>
          <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2">{current.subtitle}</h3>
          <p className="text-[#9E9E9E] text-sm leading-relaxed">{current.description}</p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 py-4">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-[#E53935] w-6' : 'bg-[#E0E0E0] hover:bg-[#9E9E9E]'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-6 border-t-2 border-[#E0E0E0] bg-[#FFEBEE] space-y-3">
          <div className="flex gap-3">
            {step > 0 && (
              <COREButton
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setStep(step - 1)}
              >
                Back
              </COREButton>
            )}
            {!isLast ? (
              <COREButton
                variant="primary"
                size="md"
                fullWidth
                onClick={() => setStep(step + 1)}
              >
                Next
              </COREButton>
            ) : (
              <COREButton
                variant="primary"
                size="md"
                fullWidth
                onClick={onDismiss}
              >
                Let's Go! 🚀
              </COREButton>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="w-full text-sm text-[#9E9E9E] hover:text-[#E53935] transition-colors py-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
