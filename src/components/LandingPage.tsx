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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500/30 selection:text-white relative overflow-x-hidden">
      
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[35rem] rounded-full bg-indigo-900/10 blur-[130px] -z-10 pointer-events-none" />
      <div className="absolute top-[40rem] right-1/4 w-[35rem] h-[35rem] rounded-full bg-purple-900/15 blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[20rem] left-1/3 w-[45rem] h-[45rem] rounded-full bg-purple-950/10 blur-[180px] -z-10 pointer-events-none" />

      {/* Modern High-End Top Logo Header */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/10">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-display font-medium text-lg leading-tight tracking-wide text-white">
            Resonance<span className="text-purple-400">Lab</span>
          </span>
        </div>
        
        <button
          onClick={onEnter}
          className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-xs font-semibold text-white rounded-lg group bg-gradient-to-br from-purple-500 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-purple-800 transition-all cursor-pointer"
        >
          <span className="relative px-4 py-2 transition-all ease-in duration-700 bg-slate-950 rounded-md group-hover:bg-opacity-0">
            Launch Station
          </span>
        </button>
      </header>

      {/* Hero Core Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-28 pb-16 flex flex-col md:flex-row items-center gap-12 relative">
        <div className="flex-1 space-y-6 md:text-left text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/40 border border-purple-500/20 rounded-full">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span className="text-xs text-purple-200 font-mono font-medium tracking-wide">METRONOME. THEORIES. EAR TRAINING. ALL IN ONE.</span>
          </div>
          
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.1]">
            Practice Smarter. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400">
              Play Better.
            </span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-400 max-w-lg md:mx-0 mx-auto font-sans leading-relaxed">
            The complete musician practice platform with advanced metronomes, rhythm training, theory tools, ear training, and progress tracking.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <button
              onClick={onEnter}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/45 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Start Practicing <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="px-6 py-3 rounded-lg border border-slate-800 hover:bg-slate-900 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Explore Tools
            </a>
          </div>
        </div>

        {/* Hero Preview: Interactive Live Metronome Swing */}
        <div className="flex-1 w-full max-w-md mx-auto">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-2xl relative">
            <div className="absolute top-3 right-3 text-[10px] font-mono text-purple-400/80 bg-purple-950/30 px-2.5 py-1 rounded border border-purple-950">
              LIVE METRONOME PREVIEW
            </div>

            <h3 className="font-display font-medium text-slate-200 text-sm tracking-wide mb-2">TRY AUDIO DRIVER</h3>
            
            <div className="flex items-center justify-between mb-6">
              <span className="text-2xl font-mono font-bold text-purple-400">{bpm} <span className="text-xs text-slate-400">BPM</span></span>
              <input
                type="range"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-1/2 accent-purple-500 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {/* Pendulum graphics simulator */}
            <div className="h-28 bg-slate-950/60 rounded-xl relative flex items-center justify-center overflow-hidden border border-slate-900">
              <div className="absolute top-2 w-1.5 h-1.5 bg-slate-500 rounded-full" />
              
              {/* Swing arm */}
              <motion.div
                animate={isDemoPlaying ? { rotate: [-24, 24] } : { rotate: 0 }}
                transition={isDemoPlaying ? {
                  repeat: Infinity,
                  repeatType: 'reverse',
                  duration: 60 / bpm,
                  ease: 'easeInOut'
                } : {}}
                className="w-1 h-20 bg-gradient-to-b from-slate-400 to-purple-500 origin-top rounded absolute top-2"
                style={{ originX: 0.5, originY: 0 }}
              >
                <div className="w-5 h-5 rounded-full bg-purple-400 border border-white absolute -bottom-1 -left-2 shadow-lg shadow-purple-500/40" />
              </motion.div>

              {/* Beat nodes */}
              <div className="absolute bottom-3 left-4 right-4 flex justify-between px-6 z-10">
                {[0, 1, 2, 3].map((b) => (
                  <div
                    key={b}
                    className={`w-3.5 h-3.5 rounded-full border transition-all duration-100 ${
                      activeBeat === b
                        ? 'bg-purple-500 border-purple-400 scale-125 shadow-md shadow-purple-500'
                        : 'bg-slate-900 border-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Starter control button */}
            <div className="mt-6">
              <button
                onClick={handleToggleDemo}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isDemoPlaying
                    ? 'bg-slate-800 text-red-400 hover:bg-slate-700 border border-red-500/10'
                    : 'bg-purple-950/40 hover:bg-purple-900/30 text-purple-300 border border-purple-500/25'
                }`}
              >
                {isDemoPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-red-400" /> Stop Demo Loop
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-purple-300" /> Play Active Beat
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature showcase lists */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-900/80">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <p className="text-xs text-purple-400 font-mono tracking-widest font-semibold uppercase">PRO AUDIO MODULES</p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
            Designed for professional musicians.
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Resonance Lab unifies advanced rhythmic accuracy challenges, real-time feedback meters, and harmonic guides into one beautiful instrument.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((t, idx) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="glass-card p-6 rounded-2xl flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-950/30 border border-purple-500/15 flex items-center justify-center text-purple-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-white">{t.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{t.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Elegant Audio & Practice Quote Banner */}
      <section className="bg-slate-950/50 relative py-16 border-y border-slate-900 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
          <div className="flex justify-center gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 fill-amber-500" />
            ))}
          </div>
          <p className="text-lg sm:text-xl md:text-2xl font-display font-light text-slate-200 italic leading-relaxed">
            "Resonance Lab feels less like a metronome webpage and more like a high-performance audio engine. The Speed Ramping and Polyrhythm grids completely reshaped my daily fusion practice cycles."
          </p>
          <div className="flex flex-col items-center">
            <span className="font-semibold text-xs text-purple-300">Elena Rostova</span>
            <span className="text-[10px] text-slate-400 tracking-wider">Concert Violinist & Guildhall Alumna</span>
          </div>
        </div>
      </section>

      {/* Pricing Models */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <p className="text-xs text-purple-400 font-mono tracking-widest font-semibold uppercase">SIMPLE FAIR PRICING</p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">Accelerate Your Musical Craft</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Tier */}
          <div className="glass-panel p-8 rounded-2xl flex flex-col justify-between border-slate-800">
            <div className="space-y-6">
              <div>
                <h3 className="font-display font-semibold text-xl text-slate-300">Resonance Standard</h3>
                <p className="text-xs text-slate-400 mt-1">Get started with foundational practice tools.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-mono font-bold text-white">$0</span>
                <span className="text-xs text-slate-400">/ forever</span>
              </div>
              <ul className="space-y-3 pt-4 border-t border-slate-900">
                {['Accurate Smart Metronome & Swings', 'Rhythm Lab accuracy tests', 'Basic Scale generation keys', 'Persistent Daily Streaks tracking'].map((item, id) => (
                  <li key={id} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={onEnter}
              className="w-full mt-8 py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Start For Free
            </button>
          </div>

          {/* Premium Pro Tier */}
          <div className="glass-panel p-8 rounded-2xl flex flex-col justify-between border-purple-500/35 relative overflow-hidden bg-slate-900/40">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500 to-indigo-500 text-white text-[10px] font-bold font-mono px-4 py-1.5 rounded-bl-xl tracking-wider flex items-center gap-1 uppercase">
              <Crown className="w-3 h-3 fill-white" /> Popular
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-display font-semibold text-xl text-white">Resonance Studio</h3>
                <p className="text-xs text-purple-300 mt-1">For serious masters and session creators.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">$8.99</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="space-y-3 pt-4 border-t border-slate-900">
                {valueOfferings.map((item, id) => (
                  <li key={id} className="flex items-center gap-2.5 text-xs text-slate-200 font-medium">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={onEnter}
              className="w-full mt-8 py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-semibold text-white shadow-md shadow-purple-500/20 hover:shadow-purple-500/40 transition-all cursor-pointer"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900/60 py-12 text-slate-500 text-xs text-center font-mono">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-slate-400 font-display font-medium text-sm">Resonance<span className="text-purple-400">Lab</span></span>
            <p className="mt-1 text-[10px]">© 2026 Resonance Lab. Designed for auditory craft.</p>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-purple-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-purple-400 transition-colors">API Keys</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Terms of Sound</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
