import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Gauge, Calendar, Zap, ArrowRight, X } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: "Welcome to Resonance Lab",
    description: "Your new high-performance auditory workstation. We've built this to help you practice smarter and play better.",
    icon: Sparkles,
    accent: "text-purple-400",
    bg: "bg-purple-500/10"
  },
  {
    title: "The Smart Metronome",
    description: "Experience absolute precision with our custom audio engine. Features advanced speed ramping and polyrhythm support.",
    icon: Gauge,
    accent: "text-indigo-400",
    bg: "bg-indigo-500/10"
  },
  {
    title: "The Practice Hub",
    description: "Track your growth with automated session logs, XP rewards, and AI-powered practice insights.",
    icon: Calendar,
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10"
  },
  {
    title: "The Daily Habit",
    description: "Consistency is key. Practice for just 5 minutes today to start your first streak and unlock your first badge.",
    icon: Zap,
    accent: "text-amber-400",
    bg: "bg-amber-500/10"
  }
];

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white max-w-lg w-full p-10 rounded-[2.5rem] border border-slate-200 relative overflow-hidden shadow-2xl"
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-50">
          <motion.div
            className="h-full bg-blue-600 shadow-sm shadow-blue-500/20"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <button
          onClick={onComplete}
          className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-8 mt-4 text-center">
          <div className={`w-20 h-20 rounded-3xl ${step.bg.replace('500/10', '50')} flex items-center justify-center ${step.accent.replace('text-purple-400', 'text-blue-600').replace('text-indigo-400', 'text-indigo-600').replace('text-emerald-400', 'text-emerald-600').replace('text-amber-400', 'text-orange-600')} border border-slate-100 mx-auto shadow-sm`}>
            <Icon className="w-10 h-10" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
              {step.title}
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed px-4">
              {step.description}
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 pt-4">
            <div className="flex gap-2">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === currentStep ? "bg-blue-600 w-6" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {currentStep === STEPS.length - 1 ? "Start Your Journey" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
