/**
 * ORE Quick Start Guide Component
 * Provides an interactive intro to the ORE platform
 */

import { useState } from 'react';
import OREButton from './OREButton';
import OReLogo from './OReLogo';

export default function OREQuickStart({ onDismiss }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to ORE Careers',
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
      description: 'Remove ads and unlock unlimited access to all ORE micro-apps. Upgrade to Pro for the full experience.',
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
        <div className="px-6 py-8 bg-gradient-to-r from-red-50 to-white border-b-2 border-red-100 text-center">
          <OReLogo size="lg" showText={false} />
          <h2 className="text-2xl font-bold text-gray-900 mt-4">{current.title}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          <div className="text-6xl mb-4">{current.icon}</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{current.subtitle}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{current.description}</p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 py-4">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-red-500 w-6' : 'bg-red-200 hover:bg-red-300'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-6 border-t-2 border-red-100 bg-red-50 space-y-3">
          <div className="flex gap-3">
            {step > 0 && (
              <OREButton
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setStep(step - 1)}
              >
                Back
              </OREButton>
            )}
            {!isLast ? (
              <OREButton
                variant="primary"
                size="md"
                fullWidth
                onClick={() => setStep(step + 1)}
              >
                Next
              </OREButton>
            ) : (
              <OREButton
                variant="primary"
                size="md"
                fullWidth
                onClick={onDismiss}
              >
                Let's Go! 🚀
              </OREButton>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="w-full text-sm text-gray-600 hover:text-red-600 transition-colors py-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
