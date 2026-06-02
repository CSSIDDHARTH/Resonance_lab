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
import PitchTuner from './PitchTuner';

interface RhythmLabToolProps {
  onEarnBadge: (badgeId: string) => void;
  onGainXp: (xp: number) => void;
}

export default function RhythmLabTool({ onEarnBadge, onGainXp }: RhythmLabToolProps) {
  const [activeTab, setActiveTab] = useState<'accuracy' | 'internal' | 'polyrhythm' | 'tuner'>('accuracy');

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
            <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Rhythm Lab Station</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Physical groove diagnostic chambers assessing timing deviations and polyrhythms.</p>
        </div>

        {/* Tab Selection Row */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[
            { id: 'accuracy', name: 'Accuracy Test' },
            { id: 'internal', name: 'Internal Clock' },
            { id: 'polyrhythm', name: 'Polyrhythm Trainer' },
            { id: 'tuner', name: 'Chromatic Tuner' }
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all ${
                activeTab === t.id
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* TAB: PITCH TUNER */}
        {activeTab === 'tuner' && (
          <motion.div
            key="tuner"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-md mx-auto"
          >
            <PitchTuner />
          </motion.div>
        )}

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
            <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border-slate-200 space-y-6 shadow-sm">
              <h3 className="font-display font-bold text-slate-800 text-sm tracking-wide uppercase">ACCURACY TEST MODULE</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Connect with the underlying pulse. Click the spacebar or tap the pad on the screen exactly on the metronome click. We will score your timing down to the millisecond!
              </p>

              <div>
                <label className="text-[10px] text-slate-400 font-bold font-mono tracking-wider block">TARGET FREQUENCY (BPM)</label>
                <div className="flex gap-4 items-center mt-2 justify-between">
                  <span className="text-xl font-mono font-bold text-blue-600">{accBpm} BPM</span>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    value={accBpm}
                    onChange={(e) => setAccBpm(Number(e.target.value))}
                    disabled={isAccPlaying}
                    className="w-1/2 accent-blue-600 cursor-pointer bg-slate-100 h-1 rounded-full"
                  />
                </div>
              </div>

              {/* Tap Pad Trigger */}
              <button
                onClick={registerAccuracyTap}
                disabled={!isAccPlaying}
                className="w-full h-24 bg-white active:bg-slate-50 active:scale-98 transition-all hover:border-blue-400 border border-slate-200 rounded-2xl flex flex-col justify-center items-center text-slate-400 text-xs font-mono select-none cursor-pointer disabled:opacity-40 shadow-sm"
              >
                <span className="font-bold text-blue-600 text-sm">TAP GRID ZONE</span>
                <span className="text-[10px] mt-1 text-slate-400 font-sans font-bold">Click here or hit [SPACE]</span>
              </button>

              <button
                onClick={handleToggleAccuracyTest}
                className={`w-full py-3 rounded-xl font-sans text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all ${
                  isAccPlaying
                    ? 'bg-slate-100 text-red-600 hover:bg-slate-200 border border-slate-200'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                {isAccPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-red-600 text-red-600" /> End Diagnostic Taps
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
              <div className="glass-panel p-6 rounded-2xl border-slate-200 h-64 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="text-xs font-display font-bold text-slate-800">REAL-TIME BEAT SCATTER LINE</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Node placements show timing offsets relative to actual tick meridian.</p>
                </div>

                {/* Grid scatter board */}
                <div className="relative h-20 w-full bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner">
                  {/* Meridian centered mark */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-blue-500/30 z-10" />
                  <span className="absolute left-4 text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest">EARLY</span>
                  <span className="absolute right-4 text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest">LATE</span>

                  {/* Placing dots for last 15 taps */}
                  {userTaps.slice(-15).map((tap, idx) => {
                    const normOffset = Math.max(-150, Math.min(150, tap.offsetMs));
                    const percentage = 50 + (normOffset / 3); // 50% is center
                    return (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`absolute w-3.5 h-3.5 rounded-full z-20 shadow-sm ${
                          Math.abs(tap.offsetMs) < 25
                            ? 'bg-emerald-500 shadow shadow-emerald-500/40'
                            : Math.abs(tap.offsetMs) < 70
                            ? 'bg-blue-400'
                            : 'bg-red-400'
                        }`}
                        style={{ left: `${percentage}%` }}
                      />
                    );
                  })}
                </div>

                <div className="flex justify-between font-mono text-[9px] text-slate-400 px-1 font-bold">
                  <span>Elite Zone: &lt; 25ms offset</span>
                  <span>Registered: {userTaps.length} clicks</span>
                </div>
              </div>

              {/* Performance Cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="glass-panel p-5 rounded-2xl border-slate-200 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-lg shadow-inner">
                    {accScore !== null ? `${accScore}%` : '--'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">ACCURACY RATING</h4>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">Average alignment with structural meridian ticks.</p>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-slate-200 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-mono font-bold text-lg shadow-inner">
                    {consistencyScore !== null ? `${consistencyScore}%` : '--'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">STABILITY (JITTER)</h4>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">Reflects pacing consistency (lower standard jitter variance).</p>
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
            className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl border-slate-200 space-y-8 shadow-sm"
          >
            <div className="text-center space-y-2">
              <h3 className="font-display font-bold text-slate-900 text-sm tracking-wide uppercase">INTERNAL SILENCE DRIFT</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                We trigger metronome ticks for 8 beats, then the audio goes dead quiet. Keep tapping coordinates on the spacebar exactly where the beats are meant to land.
              </p>
            </div>

            {/* Display challenge indicators */}
            <div className="h-32 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              {challState === 'idle' && (
                <span className="text-xs text-slate-400 font-bold font-mono">READY TO ENGAGE ENGINE</span>
              )}

              {challState === 'audible' && (
                <div className="text-center space-y-2">
                  <span className="text-xs text-blue-600 font-bold font-mono animate-pulse uppercase tracking-wider">AUDIBLE GUIDE PULSE ACTIVED...</span>
                  <p className="text-[10px] text-slate-400 font-medium">Listen and trace the grid pace.</p>
                </div>
              )}

              {challState === 'silent' && (
                <div className="text-center space-y-2">
                  <span className="text-xs text-red-500 font-bold font-mono animate-pulse uppercase font-bold tracking-wider">SILENT CHALLENGE MODE ACTIVE!</span>
                  <p className="text-[10px] text-white font-bold font-mono px-3.5 py-1 bg-red-500 rounded-full inline-block mt-1">TAP NOW: {challTaps.length} Registered</p>
                </div>
              )}

              {challState === 'finished' && (
                <div className="text-center space-y-1">
                  <span className="text-xs text-emerald-600 font-bold font-mono uppercase">ANALYZING PULSES COMPLETE</span>
                  <p className="text-[10px] text-slate-400 font-medium">Drafting feedback analytics below...</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleStartInternalChallenge}
                disabled={challState === 'audible' || challState === 'silent'}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40 transition-all shadow-sm shadow-blue-500/10"
              >
                Launch Challenge Loop
              </button>
              
              <button
                onClick={registerChallengeTap}
                disabled={challState !== 'silent'}
                className="w-24 py-3 bg-white hover:bg-slate-50 text-blue-600 rounded-xl text-xs font-bold font-mono border border-slate-200 cursor-pointer disabled:opacity-40 shadow-sm"
              >
                TAP UNIT
              </button>
            </div>

            {/* Detailed results */}
            {driftMs !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">AVERAGE DRIFT:</span>
                  <span className="font-mono font-bold text-blue-600 text-sm">{driftMs} ms</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, Math.max(10, 100 - (driftMs * 0.4)))}%` }} 
                  />
                </div>
                <p className="text-xs font-bold text-slate-800 mt-1">{getDriftVerdict(driftMs)}</p>
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
            <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border-slate-200 space-y-6 shadow-sm">
              <h3 className="font-display font-bold text-slate-900 text-sm tracking-wide uppercase">COAXIAL POLYRHYTHMS</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                A polyrhythm refers to two distinct accent divisions overlaying harmoniously. Align standard grids or customized ratios to hear cross-beats directly.
              </p>

              {/* Subdivision inputs */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600 font-bold">Left Rhythm (High Bell):</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLeftPol(prev => Math.max(1, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer border border-slate-200 hover:bg-slate-200 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold text-blue-600 text-sm w-4 text-center">{leftPol}</span>
                    <button
                      onClick={() => setLeftPol(prev => Math.min(8, prev + 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer border border-slate-200 hover:bg-slate-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600 font-bold">Right Rhythm (Low Click):</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRightPol(prev => Math.max(1, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer border border-slate-200 hover:bg-slate-200 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold text-indigo-600 text-sm w-4 text-center">{rightPol}</span>
                    <button
                      onClick={() => setRightPol(prev => Math.min(8, prev + 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer border border-slate-200 hover:bg-slate-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold font-mono tracking-wide">CYCLE SPEED (BPM)</label>
                  <div className="flex items-center justify-between gap-4 mt-1">
                    <span className="text-xs font-mono font-bold text-slate-700">{polyBpm} BPM</span>
                    <input
                      type="range"
                      min="40"
                      max="150"
                      value={polyBpm}
                      onChange={(e) => setPolyBpm(Number(e.target.value))}
                      disabled={isPolyPlaying}
                      className="w-1/2 accent-blue-600 cursor-pointer bg-slate-100 h-1 rounded-full"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartPolyrhythm}
                className={`w-full py-3 rounded-xl font-sans text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all ${
                  isPolyPlaying
                    ? 'bg-slate-100 text-red-600 hover:bg-slate-200 border border-slate-200'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                {isPolyPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-red-600 text-red-600" /> Stop Polyrhythm
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
              <div className="relative w-64 h-64 md:w-80 md:h-80 bg-white rounded-full p-4 shadow-xl border border-slate-100">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  {/* Coaxial track Outer (Left pol) */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="8"
                  />
                  {/* Coaxial track Inner (Right pol) */}
                  <circle
                    cx="100"
                    cy="100"
                    r="55"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="8"
                  />

                  {/* Top Meridian checkpoint marker */}
                  <line
                    x1="100" y1="5"
                    x2="100" y2="25"
                    stroke="#94A3B8"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Left indicator nodes (Blue) */}
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
                        r="6"
                        fill="#3B82F6"
                        className="shadow-sm"
                      />
                    );
                  })}

                  {/* Right indicator nodes (Indigo) */}
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
                        r="6"
                        fill="#6366F1"
                        className="shadow-sm"
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
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Sweep pointer Right */}
                  {isPolyPlaying && (
                    <line
                      x1="100"
                      y1="100"
                      x2={100 + 55 * Math.cos((rightRot * Math.PI) / 180)}
                      y2={100 + 55 * Math.sin((rightRot * Math.PI) / 180)}
                      stroke="#6366F1"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  )}

                </svg>

                {/* Concentric overlay center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-mono font-bold text-slate-900 leading-none">{leftPol}:{rightPol}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase font-mono mt-1 tracking-widest">POLY RATIO</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
