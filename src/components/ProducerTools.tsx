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
  const [bpmInput, setBpmInput] = useState(120);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            <h1 className="font-display font-semibold text-2xl text-white tracking-tight">Producer Utilities</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Determine precise hardware delays and LFO sweep rates matching active project tempos.</p>
        </div>
      </div>

      {/* Main Core grid: Tap block and list converters */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* BPM Tap Deck & Hz Converter Left */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
            <h3 className="font-display font-medium text-slate-200 text-sm tracking-wide">TEMPO INPUT DECK</h3>

            {/* Numeric controls */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-mono">BPM METRIC RATE:</label>
              <input
                type="number"
                min="20"
                max="400"
                value={bpmInput}
                onChange={(e) => setBpmInput(Math.max(20, Math.min(400, Number(e.target.value) || 120)))}
                className="w-full premium-input font-mono font-bold text-lg text-indigo-400"
              />
            </div>

            {/* Slider bar */}
            <div className="space-y-1">
              <input
                type="range"
                min="40"
                max="240"
                value={bpmInput}
                onChange={(e) => setBpmInput(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Big Tap Deck Pad */}
            <div className="space-y-2">
              <button
                onClick={handleTapBpm}
                className="w-full h-28 bg-gradient-to-br from-indigo-950/45 to-slate-900/60 hover:from-indigo-900/40 border border-slate-800 hover:border-indigo-500/20 active:scale-98 text-slate-300 font-sans font-bold py-4 px-6 rounded-xl transition-all flex flex-col justify-center items-center cursor-pointer select-none"
              >
                <span className="text-sm font-mono text-indigo-400 tracking-wider">TAP TEMPO DETECTOR</span>
                <span className="text-[10px] text-slate-500 font-sans mt-1.5">Tap steady in space (Click or space)</span>
              </button>

              {lastTapBpm && (
                <div className="text-center font-mono text-[10px] text-emerald-400">
                  Last Registered Average: <span className="font-bold">{lastTapBpm} BPM</span>
                </div>
              )}
            </div>

            {/* General Conversions readout */}
            <div className="pt-4 border-t border-slate-900 flex justify-between text-xs">
              <span className="text-slate-400">Quarter Note Size:</span>
              <span className="font-mono font-bold text-white">{calcMs(1)} ms</span>
            </div>

            <div className="flex justify-between text-xs pb-1">
              <span className="text-slate-400">LFO Rate (1/4 Note):</span>
              <span className="font-mono font-bold text-white">{calcHz(1)} Hz</span>
            </div>
          </div>
        </div>

        {/* Delay Time Grid Display Right */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
          <div>
            <h3 className="text-xs font-display font-medium text-slate-300">DAW MILLISECOND & LFO FREQUENCY GRID</h3>
            <p className="text-[10px] text-slate-500">Grid lookup used to synchronize effects loops, echoes, pre-delays, and compressor releases.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500">
                  <th className="pb-3 font-medium">SUBDIVISION</th>
                  <th className="pb-3 font-medium">DELAY DURATION</th>
                  <th className="pb-3 font-medium">LFO FREQUENCY</th>
                  <th className="pb-3 font-medium text-right">TYPE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {delayRows.map((row, i) => (
                  <tr key={i} className="text-slate-300 hover:bg-slate-900/20">
                    <td className="py-3 font-sans font-medium text-slate-200">{row.note}</td>
                    <td className="py-3 font-bold text-indigo-400">{calcMs(row.multiplier)} ms</td>
                    <td className="py-3 text-slate-400">{calcHz(row.multiplier)} Hz</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        row.type === 'triplet'
                          ? 'bg-purple-500/10 text-purple-400'
                          : row.type === 'dotted'
                          ? 'bg-pink-500/10 text-pink-400'
                          : 'bg-indigo-500/10 text-indigo-400'
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

      </div>
    </motion.div>
  );
}
