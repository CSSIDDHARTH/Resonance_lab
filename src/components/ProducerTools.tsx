import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SlidersHorizontal,
  Flame,
  Clock,
  Zap,
  Activity,
  Award,
  Maximize,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { getAudioContext, triggerClickAtTime } from '../lib/audio';

interface ProducerToolsProps {
  onGainXp: (xp: number) => void;
}

export default function ProducerTools({ onGainXp }: ProducerToolsProps) {
  const [activeTab, setActiveTab] = useState<'delays' | 'trainer'>('delays');
  const [bpmInput, setBpmInput] = useState(120);

  // ==========================================
  // MODULE: FREQUENCY TRAINER (Ear Training)
  // ==========================================
  const [targetFreq, setTargetFreq] = useState<number | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [selectedFreq, setSelectedFreq] = useState<number | null>(null);

  const FREQ_LEVELS = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  const generateFreqQuestion = () => {
    const randomFreq = FREQ_LEVELS[Math.floor(Math.random() * FREQ_LEVELS.length)];
    setTargetFreq(randomFreq);
    setSelectedFreq(null);
    setAnswerState('idle');

    const opts = [...FREQ_LEVELS].sort(() => Math.random() - 0.5).slice(0, 4);
    if (!opts.includes(randomFreq)) {
      opts[Math.floor(Math.random() * 4)] = randomFreq;
    }
    setOptions(opts.sort((a, b) => a - b));

    // Play the target tone automatically
    setTimeout(() => playFreqTone(randomFreq), 300);
  };

  const playFreqTone = (f: number) => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = f;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1);
    } catch (e) { console.warn(e); }
  };

  const handleVerifyFreq = (f: number) => {
    if (answerState !== 'idle') return;
    setSelectedFreq(f);
    if (f === targetFreq) {
      setAnswerState('correct');
      onGainXp(40);
      playFreqTone(2000); // feedback
    } else {
      setAnswerState('incorrect');
      onGainXp(5);
    }
  };

  useEffect(() => {
    if (activeTab === 'trainer') generateFreqQuestion();
  }, [activeTab]);

  // Tap bpm states
  const [lastTapBpm, setLastTapBpm] = useState<number | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  // Calculate Delay Times Spacing (BPM in milliseconds)
  const calcMs = (beats: number) => {
    return Math.round((60000 / bpmInput) * beats);
  };

  // Convert BPM to Hertz (frequency)
  const calcHz = (beats: number) => {
    const rate = (bpmInput / 60) * beats;
    return rate.toFixed(2);
  };

  const handleTapBpm = () => {
    const now = performance.now();
    const tapTimes = tapTimesRef.current;
    tapTimes.push(now);

    // Track up to 6 trailing beats for accurate average
    if (tapTimes.length > 6) {
      tapTimes.shift();
    }

    if (tapTimes.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimes.length; i++) {
        intervals.push(tapTimes[i] - tapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);

      if (calculatedBpm >= 25 && calculatedBpm <= 350) {
        setBpmInput(calculatedBpm);
        setLastTapBpm(calculatedBpm);
        onGainXp(3);
      }
    }

    // Play quick physical mock synth woodblock click on tap
    try {
      const ctx = getAudioContext();
      triggerClickAtTime(ctx, ctx.currentTime, 1100, 'woodblock', 0.5);
    } catch (e) {
      console.warn(e);
    }
  };

  const delayRows = [
    { note: 'Quarter Note', multiplier: 1, type: 'straight' },
    { note: 'Dotted Quarter Note', multiplier: 1.5, type: 'dotted' },
    { note: 'Quarter Triplet Note', multiplier: 2/3, type: 'triplet' },
    { note: 'Eighth Note', multiplier: 0.5, type: 'straight' },
    { note: 'Dotted Eighth Note', multiplier: 0.75, type: 'dotted' },
    { note: 'Eighth Triplet Note', multiplier: 1/3, type: 'triplet' },
    { note: 'Sixteenth Note', multiplier: 0.25, type: 'straight' },
    { note: 'Dotted Sixteenth Note', multiplier: 0.375, type: 'dotted' },
    { note: 'Sixteenth Triplet Note', multiplier: 1/6, type: 'triplet' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 space-y-8 select-none"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Producer Utilities</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Precise delay calculators and frequency ear training for engineers.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('delays')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all ${
              activeTab === 'delays'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Delay Calculator
          </button>
          <button
            onClick={() => setActiveTab('trainer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all ${
              activeTab === 'trainer'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Frequency Trainer
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'delays' ? (
          <motion.div
            key="delays"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid lg:grid-cols-12 gap-8 items-start"
          >
            {/* BPM Tap Deck */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel p-8 rounded-3xl border-slate-200 space-y-8 shadow-sm">
                <h3 className="font-display font-bold text-slate-800 text-sm tracking-wide uppercase">TEMPO INPUT DECK</h3>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold font-mono tracking-widest uppercase">BPM METRIC RATE</label>
                  <input
                    type="number"
                    min="20"
                    max="400"
                    value={bpmInput}
                    onChange={(e) => setBpmInput(Math.max(20, Math.min(400, Number(e.target.value) || 120)))}
                    className="w-full premium-input font-mono font-bold text-2xl text-indigo-600 bg-slate-50 border-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <input
                    type="range"
                    min="40"
                    max="240"
                    value={bpmInput}
                    onChange={(e) => setBpmInput(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer bg-slate-100 h-1.5 rounded-full"
                  />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleTapBpm}
                    className="w-full h-32 bg-white hover:bg-slate-50 border-2 border-slate-100 hover:border-indigo-200 active:scale-98 text-slate-400 font-sans font-bold py-4 px-6 rounded-2xl transition-all flex flex-col justify-center items-center cursor-pointer select-none shadow-sm"
                  >
                    <span className="text-sm font-mono text-indigo-600 tracking-widest">TAP TEMPO DETECTOR</span>
                    <span className="text-[10px] text-slate-400 font-bold font-sans mt-2 uppercase">Steady Pulses</span>
                  </button>
                  {lastTapBpm && (
                    <div className="text-center font-mono text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-lg border border-emerald-100 shadow-sm">
                      LATEST AVERAGE: {lastTapBpm} BPM
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-tighter">Quarter Note:</span>
                    <span className="font-mono text-slate-900">{calcMs(1)} ms</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-tighter">LFO Rate (1/4):</span>
                    <span className="font-mono text-slate-900">{calcHz(1)} Hz</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Table */}
            <div className="lg:col-span-8 glass-panel p-8 rounded-3xl border-slate-200 space-y-6 shadow-sm">
              <div>
                <h3 className="text-xs font-display font-bold text-slate-800 uppercase tracking-widest">DAW SYNC GRID</h3>
                <p className="text-[10px] text-slate-500 font-medium mt-1">Grid lookup used to synchronize effects loops, echoes, and release times.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-tighter">
                      <th className="pb-4">SUBDIVISION</th>
                      <th className="pb-4">DURATION</th>
                      <th className="pb-4">FREQUENCY</th>
                      <th className="pb-4 text-right">TYPE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {delayRows.map((row, i) => (
                      <tr key={i} className="text-slate-600 hover:bg-slate-50 transition-colors group">
                        <td className="py-4 font-sans font-bold text-slate-800 group-hover:text-indigo-600">{row.note}</td>
                        <td className="py-4 font-bold text-indigo-500">{calcMs(row.multiplier)} ms</td>
                        <td className="py-4 text-slate-400 font-bold">{calcHz(row.multiplier)} Hz</td>
                        <td className="py-4 text-right">
                          <span className={`px-2 py-1 rounded-md text-[9px] font-bold tracking-tighter ${
                            row.type === 'triplet'
                              ? 'bg-purple-50 text-purple-600'
                              : row.type === 'dotted'
                              ? 'bg-pink-50 text-pink-600'
                              : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            {row.type.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="trainer"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="max-w-2xl mx-auto glass-panel p-12 rounded-3xl border-slate-200 space-y-10 shadow-sm"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-bold text-slate-900">Mixing Ear Trainer (EQ)</h2>
              <p className="text-xs text-slate-500 font-medium">Identify the fundamental frequency being played. Critical for EQing and sound design.</p>
            </div>

            <div className="flex justify-center py-6">
              <button
                onClick={() => targetFreq && playFreqTone(targetFreq)}
                className="w-28 h-28 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/30 transition-all active:scale-95 cursor-pointer group"
              >
                <Activity className="w-12 h-12 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {options.map((freq) => {
                const isSelected = selectedFreq === freq;
                const isCorrect = freq === targetFreq;

                let style = "bg-white border-slate-100 text-slate-500 hover:border-indigo-300 shadow-sm";

                if (answerState !== 'idle') {
                  if (isCorrect) style = "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold shadow-md ring-2 ring-emerald-500/10";
                  else if (isSelected) style = "bg-red-50 border-red-500 text-red-700 font-bold shadow-md";
                  else style = "opacity-30 bg-slate-50 border-slate-50 text-slate-300 pointer-events-none";
                }

                return (
                  <button
                    key={freq}
                    onClick={() => handleVerifyFreq(freq)}
                    className={`py-5 rounded-2xl border-2 text-sm font-bold font-mono transition-all cursor-pointer ${style}`}
                  >
                    {freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`}
                  </button>
                );
              })}
            </div>

            {answerState !== 'idle' && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={generateFreqQuestion}
                  className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold cursor-pointer shadow-lg shadow-indigo-500/20 transition-all active:translate-y-0.5"
                >
                  Next Frequency Challenge
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
