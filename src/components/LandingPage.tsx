import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gauge,
  Activity,
  Calendar,
  BookOpen,
  Music4,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  Sparkles,
  Check,
  Star,
  Zap,
  Play,
  Pause,
  Crown
} from 'lucide-react';
import { triggerClickAtTime, getAudioContext } from '../lib/audio';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [bpm, setBpm] = useState(120);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState(-1);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const demoIntervalRef = useRef<any>(null);
  const frameRef = useRef<number>(0);

  // Stop metronome demo on unmount
  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, []);

  const handleToggleDemo = () => {
    if (isDemoPlaying) {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      setIsDemoPlaying(false);
      setActiveBeat(-1);
    } else {
      try {
        const ctx = getAudioContext();
        audioCtxRef.current = ctx;
      } catch (e) {
        console.warn('Audio blocked:', e);
      }
      
      setIsDemoPlaying(true);
      frameRef.current = 0;
      
      const clickInterval = (60 / bpm) * 1000;
      demoIntervalRef.current = setInterval(() => {
        const beatNum = frameRef.current % 4;
        setActiveBeat(beatNum);
        
        if (audioCtxRef.current) {
          const oscFreq = beatNum === 0 ? 1000 : 700;
          triggerClickAtTime(audioCtxRef.current, audioCtxRef.current.currentTime, oscFreq, 'woodblock', 0.8);
        }
        
        frameRef.current++;
      }, clickInterval);
    }
  };

  // Rebuild intervals when BPM changes while playing
  useEffect(() => {
    if (isDemoPlaying) {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      const clickInterval = (60 / bpm) * 1000;
      demoIntervalRef.current = setInterval(() => {
        const beatNum = frameRef.current % 4;
        setActiveBeat(beatNum);
        
        if (audioCtxRef.current) {
          const oscFreq = beatNum === 0 ? 1000 : 700;
          triggerClickAtTime(audioCtxRef.current, audioCtxRef.current.currentTime, oscFreq, 'woodblock', 0.8);
        }
        
        frameRef.current++;
      }, clickInterval);
    }
  }, [bpm]);

  const tools = [
    {
      icon: Gauge,
      title: 'Smart Metronome',
      desc: 'Accurate timing engine with speed-ramping, custom subdivisions, polyrhythms, and full accent tailoring.',
    },
    {
      icon: Activity,
      title: 'Rhythm Lab',
      desc: 'Verify timing drift mechanically. Drill multi-meter sync rhythms with our interactive Accuracy Test.',
    },
    {
      icon: Calendar,
      title: 'Practice Hub',
      desc: 'Plan daily blocks, log accomplishments in a clean practice journal, and track growth charts seamlessly.',
    },
    {
      icon: BookOpen,
      title: 'Theory Toolkit',
      desc: 'Generate interactive key scales, chord voicings, scale paths, and click notes on our resonant Circle of Fifths.',
    },
    {
      icon: Music4,
      title: 'Ear Training Room',
      desc: 'Expand absolute and relative pitch hearing with modular interval listening challenges and chord recognition.',
    },
    {
      icon: SlidersHorizontal,
      title: 'Producer Utilities',
      desc: 'Convert tempo rate to clean hardware millisecond offsets and trace delay and LFO rhythms flawlessly.',
    },
  ];

  const valueOfferings = [
    'Unlock pristine audio synthesis filters',
    'Keep streaks locked with persistent localized accounts',
    'Master advanced subdivisions: Quintuplets and Septuplets',
    'Review speed-ramping logs and progress histories'
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-blue-500/20 selection:text-blue-900 relative overflow-x-hidden">
      
      {/* Decorative Light Mesh Backdrops */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[35rem] rounded-full bg-blue-100/40 blur-[130px] -z-10 pointer-events-none" />
      <div className="absolute top-[40rem] right-1/4 w-[35rem] h-[35rem] rounded-full bg-indigo-100/30 blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[20rem] left-1/3 w-[45rem] h-[45rem] rounded-full bg-blue-50/50 blur-[180px] -z-10 pointer-events-none" />

      {/* Modern High-End Top Logo Header */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/10">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-display font-bold text-lg leading-tight tracking-tight text-slate-900">
            Resonance<span className="text-blue-600">Lab</span>
          </span>
        </div>
        
        <button
          onClick={onEnter}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
        >
          Launch Station
        </button>
      </header>

      {/* Hero Core Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-28 pb-16 flex flex-col md:flex-row items-center gap-12 relative">
        <div className="flex-1 space-y-6 md:text-left text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span className="text-[10px] text-blue-700 font-bold font-mono tracking-widest uppercase">High Performance Practice Station</span>
          </div>
          
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-7xl tracking-tighter text-slate-900 leading-[1.05]">
            Practice Smarter. <br />
            <span className="text-blue-600">Play Better.</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-500 max-w-lg md:mx-0 mx-auto font-medium leading-relaxed">
            The complete high-end musician practice platform with advanced metronomes, rhythm labs, theory guides, and analytics.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <button
              onClick={onEnter}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-sm font-bold text-white shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Start Practicing <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="px-8 py-3.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold text-slate-600 transition-all cursor-pointer shadow-sm"
            >
              Explore Tools
            </a>
          </div>
        </div>

        {/* Hero Preview: Interactive Live Metronome Swing */}
        <div className="flex-1 w-full max-w-md mx-auto">
          <div className="glass-panel-heavy p-8 rounded-[2.5rem] border-white shadow-2xl relative">
            <div className="absolute top-4 right-6 text-[9px] font-bold font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              STATION PREVIEW
            </div>

            <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight mb-3">AUDIO DRIVER</h3>
            
            <div className="flex items-center justify-between mb-8">
              <span className="text-3xl font-mono font-bold text-slate-900">{bpm} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">BPM</span></span>
              <input
                type="range"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-1/2 accent-blue-600 cursor-pointer h-1 rounded-full bg-slate-100"
              />
            </div>

            {/* Pendulum graphics simulator */}
            <div className="h-32 bg-slate-50 rounded-3xl relative flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner">
              <div className="absolute top-2 w-1.5 h-1.5 bg-slate-300 rounded-full" />
              
              {/* Swing arm */}
              <motion.div
                animate={isDemoPlaying ? { rotate: [-24, 24] } : { rotate: 0 }}
                transition={isDemoPlaying ? {
                  repeat: Infinity,
                  repeatType: 'reverse',
                  duration: 60 / bpm,
                  ease: 'easeInOut'
                } : {}}
                className="w-1 h-24 bg-gradient-to-b from-slate-300 to-blue-500 origin-top rounded absolute top-2"
                style={{ originX: 0.5, originY: 0 }}
              >
                <div className="w-6 h-6 rounded-full bg-white border-4 border-blue-500 absolute -bottom-1 -left-2.5 shadow-lg shadow-blue-500/20" />
              </motion.div>

              {/* Beat nodes */}
              <div className="absolute bottom-4 left-6 right-6 flex justify-between px-6 z-10">
                {[0, 1, 2, 3].map((b) => (
                  <div
                    key={b}
                    className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-150 ${
                      activeBeat === b
                        ? 'bg-blue-600 border-blue-200 scale-125 shadow-md shadow-blue-500/20'
                        : 'bg-white border-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Starter control button */}
            <div className="mt-8">
              <button
                onClick={handleToggleDemo}
                className={`w-full py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  isDemoPlaying
                    ? 'bg-red-500 text-white shadow-red-500/20'
                    : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'
                }`}
              >
                {isDemoPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" /> Stop Audio Loop
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" /> Test Engine Beat
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature showcase lists */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24 border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <p className="text-[10px] text-blue-600 font-bold font-mono tracking-widest uppercase">Advanced Modules</p>
          <h2 className="font-display font-bold text-4xl text-slate-900 tracking-tight">
            Engineered for professionals.
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-medium">
            Resonance Lab unifies high-performance accuracy tests, real-time analytics, and harmonic architectures into one elite creative tool.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((t, idx) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -5, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)' }}
                className="bg-white p-8 rounded-3xl border border-slate-100 flex flex-col justify-between shadow-sm transition-all group"
              >
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-slate-900 tracking-tight">{t.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">{t.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Elegant Audio & Practice Quote Banner */}
      <section className="bg-white border-y border-slate-100 relative py-20 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          <div className="flex justify-center gap-1 text-orange-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-5 h-5 fill-orange-400" />
            ))}
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-slate-900 leading-snug tracking-tight">
            "Resonance Lab feels less like a simple app and more like a high-performance audio workstation. It has completely reshaped my daily fusion practice cycles."
          </p>
          <div className="flex flex-col items-center">
            <span className="font-bold text-sm text-blue-600">Elena Rostova</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Concert Violinist & Guildhall Alumna</span>
          </div>
        </div>
      </section>

      {/* Pricing Models */}
      <section className="max-w-5xl mx-auto px-6 py-28">
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-3">
          <p className="text-[10px] text-blue-600 font-bold font-mono tracking-widest uppercase">Simple Transparent Pricing</p>
          <h2 className="font-display font-bold text-4xl text-slate-900 tracking-tight">Accelerate Your Musical Craft</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white p-10 rounded-[2.5rem] flex flex-col justify-between border border-slate-200 shadow-sm">
            <div className="space-y-8">
              <div>
                <h3 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Resonance Standard</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Foundational tools for growth.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-mono font-bold text-slate-900">$0</span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">/ Month</span>
              </div>
              <ul className="space-y-4 pt-6 border-t border-slate-50">
                {['Accurate Smart Metronome', 'Rhythm Lab tests', 'Basic Scale generation', 'Persistent Daily Streaks'].map((item, id) => (
                  <li key={id} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                    <Check className="w-5 h-5 text-emerald-500 bg-emerald-50 rounded-full p-1 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={onEnter}
              className="w-full mt-10 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-sm font-bold text-slate-900 transition-all cursor-pointer border border-slate-200 shadow-sm"
            >
              Get Started
            </button>
          </div>

          {/* Premium Pro Tier */}
          <div className="bg-slate-900 p-10 rounded-[2.5rem] flex flex-col justify-between border-blue-500 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold font-mono px-5 py-2 rounded-bl-2xl tracking-widest uppercase">
              Most Popular
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="font-display font-bold text-2xl text-white tracking-tight">Resonance Studio</h3>
                <p className="text-sm text-blue-200 mt-2 font-medium">For serious masters and session players.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-mono font-bold text-white">$8.99</span>
                <span className="text-xs text-blue-300 font-bold uppercase tracking-widest">/ Month</span>
              </div>
              <ul className="space-y-4 pt-6 border-t border-slate-800">
                {valueOfferings.map((item, id) => (
                  <li key={id} className="flex items-center gap-3 text-sm text-slate-100 font-semibold">
                    <Zap className="w-5 h-5 text-amber-400 fill-amber-400 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={onEnter}
              className="w-full mt-10 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              Unlock Studio Pro
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-16 text-slate-400 text-xs text-center font-sans font-bold">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-left">
            <span className="text-slate-900 font-display font-bold text-lg tracking-tight">Resonance<span className="text-blue-600">Lab</span></span>
            <p className="mt-1 text-[10px] uppercase tracking-widest">© 2026 Resonance Lab. Designed for auditory craft.</p>
          </div>
          <div className="flex gap-8 uppercase tracking-widest text-[10px]">
            <a href="#" className="hover:text-blue-600 transition-colors">Docs</a>
            <a href="#" className="hover:text-blue-600 transition-colors">API</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
