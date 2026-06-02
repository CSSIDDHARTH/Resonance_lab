import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Flame,
  Clock,
  Play,
  Square,
  Sparkles,
  Award,
  BookOpen,
  Infinity,
  HelpCircle,
  Plus,
  Minus
} from 'lucide-react';
import { getAudioContext, triggerClickAtTime } from '../lib/audio';

interface RhythmLabToolProps {
  onEarnBadge: (badgeId: string) => void;
  onGainXp: (xp: number) => void;
}

export default function RhythmLabTool({ onEarnBadge, onGainXp }: RhythmLabToolProps) {
  const [activeTab, setActiveTab] = useState<'accuracy' | 'internal' | 'polyrhythm'>('accuracy');

  // Audio Driver references
  const audioContextRef = useRef<AudioContext | null>(null);

  // ==========================================
  // MODULE 1: RHYTHM ACCURACY TEST STATES
  // ==========================================
  const [accBpm, setAccBpm] = useState(100);
  const [isAccPlaying, setIsAccPlaying] = useState(false);
  const [userTaps, setUserTaps] = useState<{ offsetMs: number; tapTime: number }[]>([]);
  const [accScore, setAccScore] = useState<number | null>(null);
  const [consistencyScore, setConsistencyScore] = useState<number | null>(null);

  const accPlayingRef = useRef(false);
  const accBpmRef = useRef(100);
  const accIntervalIdRef = useRef<any>(null);
  const accExpectedsRef = useRef<number[]>([]); // Timestamps of clicks

  useEffect(() => {
    accBpmRef.current = accBpm;
  }, [accBpm]);

  const handleToggleAccuracyTest = () => {
    if (isAccPlaying) {
      clearInterval(accIntervalIdRef.current);
      accPlayingRef.current = false;
      setIsAccPlaying(false);
      calculateAccuracyResults();
    } else {
      setUserTaps([]);
      setAccScore(null);
      setConsistencyScore(null);
      
      try {
        audioContextRef.current = getAudioContext();
      } catch (e) {
        console.warn(e);
      }

      accPlayingRef.current = true;
      setIsAccPlaying(true);
      accExpectedsRef.current = [];

      const intervalMs = (60 / accBpm) * 1000;
      let nextClickTime = performance.now();

      accIntervalIdRef.current = setInterval(() => {
        const now = performance.now();
        accExpectedsRef.current.push(now);

        // Limit the expected click list size
        if (accExpectedsRef.current.length > 50) {
          accExpectedsRef.current.shift();
        }

        // Program Audio click
        if (audioContextRef.current) {
          triggerClickAtTime(audioContextRef.current, audioContextRef.current.currentTime, 800, 'woodblock', 0.8);
        }
      }, intervalMs);

      onGainXp(10);
    }
  };

  const registerAccuracyTap = () => {
    if (!isAccPlaying) return;
    const now = performance.now();
    const expecteds = accExpectedsRef.current;
    if (expecteds.length === 0) return;

    // Find closest expected click time
    let closest = expecteds[0];
    let minDiff = Math.abs(now - closest);

    expecteds.forEach((time) => {
      const d = Math.abs(now - time);
      if (d < minDiff) {
        minDiff = d;
        closest = time;
      }
    });

    const offsetMs = now - closest; // positive is late, negative is early
    setUserTaps((prev) => [...prev, { offsetMs, tapTime: now }]);
  };

  const calculateAccuracyResults = () => {
    if (userTaps.length < 4) return;

    const absoluteOffsets = userTaps.map((t) => Math.abs(t.offsetMs));
    const averageOffset = absoluteOffsets.reduce((a, b) => a + b, 0) / absoluteOffsets.length;

    // Accuracy Score mapping: < 15ms => 100%, 150ms => 0%
    const calculatedAcc = Math.round(Math.max(0, 100 - (averageOffset / 1.5)));

    // Consistency score (standard deviation of offsets: lower variance is better)
    const averageRaw = userTaps.map((t) => t.offsetMs).reduce((a, b) => a + b, 0) / userTaps.length;
    const variance = userTaps.map((t) => Math.pow(t.offsetMs - averageRaw, 2)).reduce((a, b) => a + b, 0) / userTaps.length;
    const stdDev = Math.sqrt(variance);
    const calculatedCons = Math.round(Math.max(0, 100 - (stdDev / 1.1)));

    setAccScore(calculatedAcc);
    setConsistencyScore(calculatedCons);

    // Reward performance levels
    if (calculatedAcc >= 92) {
      onEarnBadge('rhythm_expert');
      onGainXp(120);
    } else if (calculatedAcc >= 80) {
      onGainXp(40);
    }
  };

  // Listen to spacebar press for rhythm actions
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        registerAccuracyTap();
        registerChallengeTap();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAccPlaying, activeTab]);

  // ==========================================
  // MODULE 2: INTERNAL CLOCK CHALLENGE STATES
  // ==========================================
  const [challBpm, setChallBpm] = useState(110);
  const [challState, setChallState] = useState<'idle' | 'audible' | 'silent' | 'finished'>('idle');
  const [challTaps, setChallTaps] = useState<number[]>([]); // user tap elapsed gaps
  const [driftMs, setDriftMs] = useState<number | null>(null);

  const challBpmRef = useRef(110);
  const challStateRef = useRef<'idle' | 'audible' | 'silent' | 'finished'>('idle');
  const challTimerIdRef = useRef<any>(null);
  const beatCountRef = useRef(0);

  useEffect(() => {
    challBpmRef.current = challBpm;
    challStateRef.current = challState;
  }, [challBpm, challState]);

  const handleStartInternalChallenge = () => {
    setChallState('audible');
    setChallTaps([]);
    setDriftMs(null);
    beatCountRef.current = 0;

    const clickInterval = (60 / challBpm) * 1000;
    let expectedClickTime = performance.now();

    try {
      audioContextRef.current = getAudioContext();
    } catch (e) {
      console.warn(e);
    }

    const runChallengeLoop = () => {
      beatCountRef.current++;

      if (beatCountRef.current <= 8) {
        // Audible Phase: Play physical sound clicks
        if (audioContextRef.current) {
          triggerClickAtTime(audioContextRef.current, audioContextRef.current.currentTime, 900, 'beep', 0.9);
        }
      } else if (beatCountRef.current === 9) {
        // Transitional Alert
        setChallState('silent');
      } else if (beatCountRef.current > 16) {
        // End Challenge phase
        clearInterval(challTimerIdRef.current);
        setChallState('finished');
        calculateChallengeScores();
        return;
      }

      expectedClickTime += clickInterval;
    };

    challTimerIdRef.current = setInterval(runChallengeLoop, clickInterval);
  };

  const registerChallengeTap = () => {
    if (challState !== 'silent') return;
    setChallTaps((prev) => [...prev, performance.now()]);
  };

  const calculateChallengeScores = () => {
    if (challTaps.length === 0) {
      setDriftMs(999);
      return;
    }

    // Determine expected times for quiet taps (beats 9 to 16)
    const beatInterval = (60 / challBpm) * 1000;
    const startQuietTime = performance.now() - (16 - beatCountRef.current) * beatInterval; 
    
    // We judge the average distance between adjacent user click intervals compared to true beatInterval
    const tapGaps: number[] = [];
    for (let i = 1; i < challTaps.length; i++) {
      tapGaps.push(challTaps[i] - challTaps[i - 1]);
    }

    if (tapGaps.length === 0) {
      setDriftMs(250);
      return;
    }

    const averageGap = tapGaps.reduce((a, b) => a + b, 0) / tapGaps.length;
    const errorMs = Math.abs(averageGap - beatInterval);

    setDriftMs(Math.round(errorMs));
    onGainXp(30);
  };

  const getDriftVerdict = (drift: number) => {
    if (drift < 12) return 'Atomic Accuracy! Absolute wizardry.';
    if (drift < 30) return 'Elite Timing. Outstanding internal clock feel.';
    if (drift < 65) return 'Very Solid. Great command of rhythm grids.';
    return 'Drift detected on quiet beats. Practice speed-sweeping.';
  };

  // ==========================================
  // MODULE 3: POLYRHYTHM TRAINER STATES
  // ==========================================
  const [leftPol, setLeftPol] = useState(3);
  const [rightPol, setRightPol] = useState(4);
  const [polyBpm, setPolyBpm] = useState(90);
  const [isPolyPlaying, setIsPolyPlaying] = useState(false);

  const polyIntervalIdRef = useRef<any>(null);
  const polyTickCountRef = useRef(0);

  // Rotation angles for poly visual
  const [leftRot, setLeftRot] = useState(0);
  const [rightRot, setRightRot] = useState(0);

  const handleStartPolyrhythm = () => {
    if (isPolyPlaying) {
      clearInterval(polyIntervalIdRef.current);
      setIsPolyPlaying(false);
      setLeftRot(0);
      setRightRot(0);
    } else {
      try {
        audioContextRef.current = getAudioContext();
      } catch (e) {
        console.warn(e);
      }

      setIsPolyPlaying(true);
      polyTickCountRef.current = 0;

      // Base bar cycle duration at nominated polyBpm: representing 1 complete circular rotation
      const barDurationMs = (240 / polyBpm) * 1000; 
      const stepIntervalMs = 20; // 50 updates a second for smooth spinning

      let nextLeftBeat = 0;
      let nextRightBeat = 0;

      polyIntervalIdRef.current = setInterval(() => {
        const elapsedInLoop = (polyTickCountRef.current * stepIntervalMs) % barDurationMs;
        const currentRotationProgress = (elapsedInLoop / barDurationMs);

        // Spin rates
        setLeftRot(currentRotationProgress * 360);
        setRightRot(currentRotationProgress * 360);

        // Audio trigger checkpoints
        const leftSpacing = barDurationMs / leftPol;
        const rightSpacing = barDurationMs / rightPol;

        if (Math.abs(elapsedInLoop - nextLeftBeat) < stepIntervalMs) {
          if (audioContextRef.current) {
            triggerClickAtTime(audioContextRef.current, audioContextRef.current.currentTime, 1000, 'beep', 0.85); // High beep left
          }
          nextLeftBeat = (nextLeftBeat + leftSpacing) % barDurationMs;
        }

        if (Math.abs(elapsedInLoop - nextRightBeat) < stepIntervalMs) {
          if (audioContextRef.current) {
            triggerClickAtTime(audioContextRef.current, audioContextRef.current.currentTime, 500, 'woodblock', 0.7); // Low wooden click right
          }
          nextRightBeat = (nextRightBeat + rightSpacing) % barDurationMs;
        }

        polyTickCountRef.current++;
      }, stepIntervalMs);

      onGainXp(12);
    }
  };

  useEffect(() => {
    return () => {
      if (accIntervalIdRef.current) clearInterval(accIntervalIdRef.current);
      if (challTimerIdRef.current) clearInterval(challTimerIdRef.current);
      if (polyIntervalIdRef.current) clearInterval(polyIntervalIdRef.current);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 space-y-8 select-none"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h1 className="font-display font-semibold text-2xl text-white tracking-tight">Rhythm Lab Station</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Physical groove diagnostic chambers assessing timing deviations and polyrhythms.</p>
        </div>

        {/* Tab Selection Row */}
        <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800">
          {[
            { id: 'accuracy', name: 'Accuracy Test' },
            { id: 'internal', name: 'Internal Clock' },
            { id: 'polyrhythm', name: 'Polyrhythm Trainer' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as any);
                // Mute playing modes
                if (isAccPlaying) handleToggleAccuracyTest();
                if (isPolyPlaying) handleStartPolyrhythm();
                if (challState !== 'idle') setChallState('idle');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium font-sans cursor-pointer transition-all ${
                activeTab === t.id
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* TAB 1: ACCURACY TEST */}
        {activeTab === 'accuracy' && (
          <motion.div
            key="accuracy"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid lg:grid-cols-12 gap-8"
          >
            {/* Play controls left */}
            <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
              <h3 className="font-display font-medium text-slate-200 text-sm tracking-wide">ACCURACY TEST MODULE</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect with the underlying pulse. Click the spacebar or tap the pad on the screen exactly on the metronome click. We will score your timing down to the millisecond!
              </p>

              <div>
                <label className="text-[10px] text-slate-400 font-mono tracking-wider block">TARGET FREQUENCY (BPM)</label>
                <div className="flex gap-4 items-center mt-2 justify-between">
                  <span className="text-xl font-mono font-bold text-indigo-400">{accBpm} BPM</span>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    value={accBpm}
                    onChange={(e) => setAccBpm(Number(e.target.value))}
                    disabled={isAccPlaying}
                    className="w-1/2 accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Tap Pad Trigger */}
              <button
                onClick={registerAccuracyTap}
                disabled={!isAccPlaying}
                className="w-full h-24 bg-gradient-to-br from-indigo-950/40 to-slate-900/80 active:from-indigo-900/30 active:scale-98 transition-all hover:border-indigo-500/25 border border-slate-800 rounded-xl flex flex-col justify-center items-center text-slate-400 text-xs font-mono select-none cursor-pointer disabled:opacity-40"
              >
                <span className="font-bold text-indigo-400 text-sm">TAP GRID ZONE</span>
                <span className="text-[10px] mt-1 text-slate-500 font-sans">Click here or hit [SPACE]</span>
              </button>

              <button
                onClick={handleToggleAccuracyTest}
                className={`w-full py-3 rounded-lg font-sans text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                  isAccPlaying
                    ? 'bg-slate-800 text-red-400 hover:bg-slate-755'
                    : 'bg-indigo-600 hover:bg-indigo-550 text-white'
                }`}
              >
                {isAccPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-red-400 text-red-500" /> End Diagnostic Taps
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" /> Start Clicks Session
                  </>
                )}
              </button>
            </div>

            {/* Results display right */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
              
              {/* Timing scatter display line */}
              <div className="glass-panel p-6 rounded-2xl border-slate-800 h-64 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-display font-medium text-slate-300">REAL-TIME BEAT SCATTER LINE</h3>
                  <p className="text-[10px] text-slate-500">Node placements show timing offsets relative to actual tick meridian.</p>
                </div>

                {/* Grid scatter board */}
                <div className="relative h-20 w-full bg-slate-950/50 rounded-xl border border-slate-900 flex items-center justify-center overflow-hidden">
                  {/* Meridian centered mark */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-indigo-500/80 z-10" />
                  <span className="absolute left-2.5 text-[9px] font-mono text-slate-500">EARLY (-150ms)</span>
                  <span className="absolute right-2.5 text-[9px] font-mono text-slate-500">LATE (+150ms)</span>

                  {/* Placing dots for last 15 taps */}
                  {userTaps.slice(-15).map((tap, idx) => {
                    const normOffset = Math.max(-150, Math.min(150, tap.offsetMs));
                    const percentage = 50 + (normOffset / 3); // 50% is center
                    return (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`absolute w-3.5 h-3.5 rounded-full z-20 ${
                          Math.abs(tap.offsetMs) < 25
                            ? 'bg-emerald-500 shadow shadow-emerald-500/60'
                            : Math.abs(tap.offsetMs) < 70
                            ? 'bg-indigo-400'
                            : 'bg-red-400'
                        }`}
                        style={{ left: `${percentage}%` }}
                      />
                    );
                  })}
                </div>

                <div className="flex justify-between font-mono text-[9px] text-slate-500 px-1">
                  <span>Elite Zone: &lt; 25ms offset</span>
                  <span>Registered: {userTaps.length} clicks</span>
                </div>
              </div>

              {/* Performance Cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="glass-panel p-5 rounded-xl border-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold text-lg">
                    {accScore !== null ? `${accScore}%` : '--'}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">ACCURACY RATING</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Average alignment with structural meridian ticks.</p>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-xl border-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold text-lg">
                    {consistencyScore !== null ? `${consistencyScore}%` : '--'}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">CONSISTENCY (STABILITY)</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Reflects pacing consistency (lower standard jitter variance).</p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 2: INTERNAL CLOCK CHALLENGE */}
        {activeTab === 'internal' && (
          <motion.div
            key="internal"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="max-w-2xl mx-auto glass-panel p-8 rounded-2xl border-slate-800 space-y-8"
          >
            <div className="text-center space-y-2">
              <h3 className="font-display font-medium text-slate-200 text-sm tracking-wide">INTERNAL SILENCE DRIFT</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                We trigger metronome ticks for 8 beats, then the audio goes dead quiet. Keep tapping coordinates on the spacebar exactly where the beats are meant to land.
              </p>
            </div>

            {/* Display challenge indicators */}
            <div className="h-32 bg-slate-950/60 rounded-xl border border-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
              {challState === 'idle' && (
                <span className="text-xs text-slate-500 font-mono">READY TO ENGAGE ENGINE</span>
              )}

              {challState === 'audible' && (
                <div className="text-center space-y-2">
                  <span className="text-xs text-purple-400 font-mono animate-pulse uppercase">AUDIBLE GUIDE PULSE ACTIVED...</span>
                  <p className="text-[10px] text-slate-500">Listen and trace the grid pace.</p>
                </div>
              )}

              {challState === 'silent' && (
                <div className="text-center space-y-2">
                  <span className="text-xs text-red-400 font-mono animate-pulse uppercase font-semibold">SILENT CHALLENGE MODE ACTIVE!</span>
                  <p className="text-[10px] text-slate-300 font-mono px-3.5 py-1 bg-red-950/30 rounded inline-block mt-1">TAP NOW: {challTaps.length} Registered</p>
                </div>
              )}

              {challState === 'finished' && (
                <div className="text-center space-y-1">
                  <span className="text-xs text-emerald-400 font-mono font-semibold uppercase">ANALYZING PULSES COMPLETE</span>
                  <p className="text-[10px] text-slate-500">Drafting feedback analytics below...</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleStartInternalChallenge}
                disabled={challState === 'audible' || challState === 'silent'}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40"
              >
                Launch Challenge Loop
              </button>
              
              <button
                onClick={registerChallengeTap}
                disabled={challState !== 'silent'}
                className="w-24 py-3 bg-slate-900 hover:bg-slate-850 text-indigo-400 rounded-lg text-xs font-mono font-bold border border-slate-800 cursor-pointer disabled:opacity-40"
              >
                TAP UNIT
              </button>
            </div>

            {/* Detailed results */}
            {driftMs !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/40 p-5 rounded-lg border border-slate-850 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">AVERAGE DRIFT:</span>
                  <span className="font-mono font-bold text-indigo-400 text-sm">{driftMs} ms</span>
                </div>
                <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500" 
                    style={{ width: `${Math.min(100, Math.max(10, 100 - (driftMs * 0.4)))}%` }} 
                  />
                </div>
                <p className="text-xs font-medium text-slate-200 mt-1">{getDriftVerdict(driftMs)}</p>
              </motion.div>
            )}

          </motion.div>
        )}

        {/* TAB 3: POLYRHYTHM TRAINER */}
        {activeTab === 'polyrhythm' && (
          <motion.div
            key="polyrhythm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid lg:grid-cols-12 gap-8 items-center"
          >
            {/* Control panel */}
            <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
              <h3 className="font-display font-medium text-slate-200 text-sm tracking-wide">COAXIAL POLYRHYTHMS</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A polyrhythm refers to two distinct accent divisions overlaying harmoniously. Align standard grids or customized ratios to hear cross-beats directly.
              </p>

              {/* Subdivision inputs */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Left Rhythm (High Bell):</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLeftPol(prev => Math.max(1, prev - 1))}
                      className="w-6.5 h-6.5 rounded bg-slate-900 text-slate-400 flex items-center justify-center cursor-pointer border border-slate-850 hover:bg-slate-850"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold text-purple-400 text-sm w-4 text-center">{leftPol}</span>
                    <button
                      onClick={() => setLeftPol(prev => Math.min(8, prev + 1))}
                      className="w-6.5 h-6.5 rounded bg-slate-900 text-slate-400 flex items-center justify-center cursor-pointer border border-slate-850 hover:bg-slate-850"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Right Rhythm (Low Click):</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRightPol(prev => Math.max(1, prev - 1))}
                      className="w-6.5 h-6.5 rounded bg-slate-900 text-slate-400 flex items-center justify-center cursor-pointer border border-slate-850 hover:bg-slate-850"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold text-indigo-400 text-sm w-4 text-center">{rightPol}</span>
                    <button
                      onClick={() => setRightPol(prev => Math.min(8, prev + 1))}
                      className="w-6.5 h-6.5 rounded bg-slate-900 text-slate-400 flex items-center justify-center cursor-pointer border border-slate-850 hover:bg-slate-850"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-mono tracking-wide">CYCLE SPEED (BPM)</label>
                  <div className="flex items-center justify-between gap-4 mt-1">
                    <span className="text-xs font-mono font-semibold text-slate-300">{polyBpm} BPM</span>
                    <input
                      type="range"
                      min="40"
                      max="150"
                      value={polyBpm}
                      onChange={(e) => setPolyBpm(Number(e.target.value))}
                      disabled={isPolyPlaying}
                      className="w-1/2 accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartPolyrhythm}
                className={`w-full py-3 rounded-lg font-sans text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                  isPolyPlaying
                    ? 'bg-slate-800 text-red-400 hover:bg-slate-755'
                    : 'bg-indigo-600 hover:bg-indigo-550 text-white'
                }`}
              >
                {isPolyPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-red-400 text-red-500" /> Stop Polyrhythm
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" /> Start Audio Overlay
                  </>
                )}
              </button>
            </div>

            {/* Circular representation right */}
            <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 h-full min-h-[300px]">
              <div className="relative w-64 h-64 md:w-72 md:h-72">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  {/* Coaxial track Outer (Left pol) */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="4"
                  />
                  {/* Coaxial track Inner (Right pol) */}
                  <circle
                    cx="100"
                    cy="100"
                    r="55"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="4"
                  />

                  {/* Top Meridian checkpoint marker */}
                  <line
                    x1="100" y1="10"
                    x2="100" y2="30"
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeOpacity="0.7"
                  />

                  {/* Left indicator nodes (Purple) */}
                  {Array.from({ length: leftPol }).map((_, id) => {
                    const angle = (360 / leftPol) * id;
                    const r = 80;
                    const x = 100 + r * Math.cos((angle * Math.PI) / 180);
                    const y = 100 + r * Math.sin((angle * Math.PI) / 180);
                    return (
                      <circle
                        key={`l-${id}`}
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#a855f7"
                        filter="drop-shadow(0 0 4px rgba(168,85,247,0.5))"
                      />
                    );
                  })}

                  {/* Right indicator nodes (Blue) */}
                  {Array.from({ length: rightPol }).map((_, id) => {
                    const angle = (360 / rightPol) * id;
                    const r = 55;
                    const x = 100 + r * Math.cos((angle * Math.PI) / 180);
                    const y = 100 + r * Math.sin((angle * Math.PI) / 180);
                    return (
                      <circle
                        key={`r-${id}`}
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#3b82f6"
                        filter="drop-shadow(0 0 4px rgba(59,130,246,0.5))"
                      />
                    );
                  })}

                  {/* Sweep pointer Left */}
                  {isPolyPlaying && (
                    <line
                      x1="100"
                      y1="100"
                      x2={100 + 80 * Math.cos((leftRot * Math.PI) / 180)}
                      y2={100 + 80 * Math.sin((leftRot * Math.PI) / 180)}
                      stroke="#a855f7"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Sweep pointer Right */}
                  {isPolyPlaying && (
                    <line
                      x1="100"
                      y1="100"
                      x2={100 + 55 * Math.cos((rightRot * Math.PI) / 180)}
                      y2={100 + 55 * Math.sin((rightRot * Math.PI) / 180)}
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                    />
                  )}

                </svg>

                {/* Concentric overlay center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-mono font-bold text-white leading-none">{leftPol}:{rightPol}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-mono mt-1 tracking-wider">RATIO</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
