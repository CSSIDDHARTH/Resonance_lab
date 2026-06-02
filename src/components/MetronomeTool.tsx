import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Square,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Volume2,
  Activity,
  Zap,
  TrendingDown,
  ChevronRight,
  TrendingUp,
  Sliders,
  Sparkles
} from 'lucide-react';
import { getAudioContext, triggerClickAtTime, BeatSoundType } from '../lib/audio';

const AVAILABLE_SOUNDS: { id: BeatSoundType; name: string; desc: string; category: 'Acoustic' | 'Digital' | 'Metallic' | 'Percussion'; frequency: number }[] = [
  { id: 'woodblock', name: 'Acoustic Woodblock', desc: 'Organic hollow wooden strike with fast pitch drop', category: 'Acoustic', frequency: 800 },
  { id: 'beep', name: 'Classic Beep', desc: 'Snappy retro digital square-wave synthesizer', category: 'Digital', frequency: 900 },
  { id: 'drum', name: 'Analog Kick Drum', desc: 'Sub-bass pitch sweep mimicking 808-style hardware', category: 'Percussion', frequency: 100 },
  { id: 'cowbell', name: 'Retro 808 Cowbell', desc: 'Indie metallic dual-square ring-modulated punch', category: 'Metallic', frequency: 540 },
  { id: 'hihat', name: 'Crisp Noise Hi-Hat', desc: 'High-passed noise simulation of a tight closed cymbal', category: 'Percussion', frequency: 1000 },
  { id: 'bell', name: 'Crystal Chime Bell', desc: 'Pure sine frequency coupled with an overtoned shimmer', category: 'Metallic', frequency: 1100 },
  { id: 'shaker', name: 'Friction Shaker', desc: 'Filtered noise transients representing a real shaker swipe', category: 'Acoustic', frequency: 800 },
  { id: 'clap', name: 'Retro Handclap', desc: 'Vintage triple-impulse overlapping layered clap', category: 'Percussion', frequency: 1000 },
  { id: 'marimba', name: 'Marimba Mallet', desc: 'Warm wooden marimba key with rapid third overtones', category: 'Acoustic', frequency: 440 },
  { id: 'rimshot', name: 'Snappy Rimshot', desc: 'High triangle sweep blended into a wooden side strike', category: 'Acoustic', frequency: 900 }
];

interface MetronomeToolProps {
  onGainXp: (xp: number) => void;
}

export default function MetronomeTool({ onGainXp }: MetronomeToolProps) {
  // Main settings
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSignature, setTimeSignature] = useState(4); // Beats per bar
  const [volume, setVolume] = useState(0.7);
  const [soundSelection, setSoundSelection] = useState<BeatSoundType>('woodblock');
  const [swing, setSwing] = useState(0); // 0% to 100% swing
  
  // Accents config: 0=muted, 1=standard, 2=accent
  const [beatAccents, setBeatAccents] = useState<number[]>([2, 1, 1, 1]);

  // Tempo ramping features
  const [isRamping, setIsRamping] = useState(false);
  const [rampBpmAdd, setRampBpmAdd] = useState(5);
  const [rampIntervalBars, setRampIntervalBars] = useState(4);
  const [barsCompleted, setBarsCompleted] = useState(0);

  // Fullscreen practice Mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Scheduler variables (lookahead scheduler)
  const isPlayingRef = useRef(false);
  const bpmRef = useRef(120);
  const soundSelectionRef = useRef(soundSelection);
  const volumeRef = useRef(volume);
  const beatAccentsRef = useRef(beatAccents);
  const timeSignatureRef = useRef(timeSignature);
  const swingRef = useRef(swing);
  
  // Ramping reference track
  const isRampingRef = useRef(isRamping);
  const rampBpmAddRef = useRef(rampBpmAdd);
  const rampIntervalBarsRef = useRef(rampIntervalBars);
  const barsCompletedRef = useRef(0);

  // Audio thread trackers
  const schedulerTimerRef = useRef<any>(null);
  const nextNoteTimeRef = useRef(0.0);
  const currentBeatInBarRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Tap tempo tracking
  const tapTimesRef = useRef<number[]>([]);

  // Track beat visual rendering in React thread
  const [currentVisualBeat, setCurrentVisualBeat] = useState(-1);

  // Bind Ref values dynamically to bypass closures inside schedule intervals
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { soundSelectionRef.current = soundSelection; }, [soundSelection]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { beatAccentsRef.current = beatAccents; }, [beatAccents]);
  useEffect(() => { timeSignatureRef.current = timeSignature; }, [timeSignature]);
  useEffect(() => { swingRef.current = swing; }, [swing]);
  useEffect(() => { isRampingRef.current = isRamping; }, [isRamping]);
  useEffect(() => { rampBpmAddRef.current = rampBpmAdd; }, [rampBpmAdd]);
  useEffect(() => { rampIntervalBarsRef.current = rampIntervalBars; }, [rampIntervalBars]);

  // Adjust beat accent array when time signature changes
  useEffect(() => {
    const defaultAccents = Array.from({ length: timeSignature }, (_, i) => i === 0 ? 2 : 1);
    setBeatAccents(defaultAccents);
    currentBeatInBarRef.current = 0;
  }, [timeSignature]);

  // Stop metronome audio on dismantling
  useEffect(() => {
    return () => {
      stopScheduler();
    };
  }, []);

  const handleTapTempo = () => {
    const now = performance.now();
    const tapTimes = tapTimesRef.current;
    tapTimes.push(now);

    // Keep only the last 4 taps
    if (tapTimes.length > 4) {
      tapTimes.shift();
    }

    if (tapTimes.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimes.length; i++) {
        intervals.push(tapTimes[i] - tapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const detectedBpm = Math.round(60000 / avgInterval);

      if (detectedBpm >= 20 && detectedBpm <= 400) {
        setBpm(detectedBpm);
      }
    }
  };

  const auditionSound = (soundId: BeatSoundType, frequency: number) => {
    try {
      const ctx = getAudioContext();
      triggerClickAtTime(ctx, ctx.currentTime, frequency, soundId, volume);
    } catch (err) {
      console.warn('Audition block:', err);
    }
  };

  const cycleAccent = (index: number) => {
    const updated = [...beatAccents];
    // Cycle: 2 (Accent) -> 1 (Standard) -> 0 (Muted)
    updated[index] = (updated[index] === 2) ? 1 : (updated[index] === 1) ? 0 : 2;
    setBeatAccents(updated);
  };

  const handleBpmChange = (amount: number) => {
    setBpm(prev => Math.max(20, Math.min(400, prev + amount)));
  };

  // High precision scheduler loop
  const scheduleInterval = 45.0; // run checking loop every 45ms
  const scheduleAheadTime = 0.12; // look ahead 120ms to prevent glitches

  const scheduleNextClick = (beatIndex: number, time: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const accentVal = beatAccentsRef.current[beatIndex] ?? 1;
    if (accentVal === 0) return; // Muted beat

    let pitch = accentVal === 2 ? 1000 : 700; // Accent tone vs standard tick tone
    if (soundSelectionRef.current === 'drum') {
      pitch = accentVal === 2 ? 120 : 78;
    } else if (soundSelectionRef.current === 'woodblock') {
      pitch = accentVal === 2 ? 1040 : 740;
    } else if (soundSelectionRef.current === 'cowbell') {
      pitch = accentVal === 2 ? 600 : 490;
    } else if (soundSelectionRef.current === 'bell') {
      pitch = accentVal === 2 ? 1400 : 1000;
    } else if (soundSelectionRef.current === 'marimba') {
      pitch = accentVal === 2 ? 587.33 : 440.00; // Musical interval
    } else if (soundSelectionRef.current === 'hihat') {
      pitch = accentVal === 2 ? 1200 : 900;
    } else if (soundSelectionRef.current === 'shaker') {
      pitch = accentVal === 2 ? 1100 : 800;
    } else if (soundSelectionRef.current === 'clap') {
      pitch = accentVal === 2 ? 1200 : 900;
    } else if (soundSelectionRef.current === 'rimshot') {
      pitch = accentVal === 2 ? 1100 : 800;
    }

    // Dynamic accent volume multiplication
    const volMultiplier = accentVal === 2 ? 1.0 : 0.6;
    triggerClickAtTime(ctx, time, pitch, soundSelectionRef.current, volumeRef.current * volMultiplier);
  };

  const runScheduler = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const beatIndex = currentBeatInBarRef.current;
      
      // Schedule the current beat click
      scheduleNextClick(beatIndex, nextNoteTimeRef.current);

      // Trigger structural visually synchronized hooks inside React thread safely
      const visualTime = nextNoteTimeRef.current;
      const beatAssigned = beatIndex;
      setTimeout(() => {
        if (isPlayingRef.current) {
          setCurrentVisualBeat(beatAssigned);
        }
      }, Math.max(0, (visualTime - ctx.currentTime) * 1000));

      // Calculate step duration in seconds for progress
      const secondsPerBeat = 60.0 / bpmRef.current;
      
      // Swing shift: Delay even beats subtly
      let delayAdjustment = 0;
      if (swingRef.current > 0 && beatIndex % 2 === 1) {
        delayAdjustment = (swingRef.current / 100) * (secondsPerBeat * 0.35);
      }

      nextNoteTimeRef.current += secondsPerBeat + delayAdjustment;

      // Increment beat indices
      currentBeatInBarRef.current = (beatIndex + 1) % timeSignatureRef.current;

      // Handle Ramping calculations at start of bar
      if (currentBeatInBarRef.current === 0) {
        barsCompletedRef.current += 1;
        
        // Sync React state
        const comp = barsCompletedRef.current;
        setTimeout(() => setBarsCompleted(comp), 0);

        if (isRampingRef.current && (barsCompletedRef.current % rampIntervalBarsRef.current === 0)) {
          const nextBpm = Math.min(400, bpmRef.current + rampBpmAddRef.current);
          setTimeout(() => setBpm(nextBpm), 0);
        }
      }
    }
    
    schedulerTimerRef.current = setTimeout(runScheduler, scheduleInterval);
  };

  const startScheduler = () => {
    try {
      const ctx = getAudioContext();
      audioContextRef.current = ctx;
      isPlayingRef.current = true;
      setIsPlaying(true);
      
      // XP reward loop when practice begins
      onGainXp(15);

      // Initialize nextNoteTime directly
      nextNoteTimeRef.current = ctx.currentTime + 0.05;
      currentBeatInBarRef.current = 0;
      barsCompletedRef.current = 0;
      setBarsCompleted(0);

      runScheduler();
    } catch (err) {
      console.warn('Audio Context resume failed:', err);
    }
  };

  const stopScheduler = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentVisualBeat(-1);
    if (schedulerTimerRef.current) {
      clearTimeout(schedulerTimerRef.current);
    }
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      stopScheduler();
    } else {
      startScheduler();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative select-none ${isFullscreen ? 'fixed inset-0 bg-slate-950 z-50 p-8 flex flex-col justify-between' : 'p-6 md:p-8 space-y-8'}`}
    >
      {/* Tool Header */}
      {!isFullscreen && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400 fill-purple-400/20" />
              <h1 className="font-display font-semibold text-2xl text-white tracking-tight">Smart Metronome</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Highly reliable scheduling driver with micro swing and tempo ramping generators.</p>
          </div>
          
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-xs font-mono font-medium text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-purple-400" /> Fullscreen View
          </button>
        </div>
      )}

      {/* Fullscreen top exit */}
      {isFullscreen && (
        <div className="flex justify-between items-center border-b border-slate-900 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="font-display font-semibold text-lg text-white">RESONANCE FULLSCREEN MODE</span>
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-slate-300 rounded-lg hover:text-white hover:bg-slate-850 border border-slate-800 text-xs cursor-pointer font-mono"
          >
            <Minimize2 className="w-4 h-4" /> Normal View
          </button>
        </div>
      )}

      {/* Centerpiece Grid: Large BPM view & Accents matrix */}
      <div className={`grid ${isFullscreen ? 'lg:grid-cols-5 h-full' : 'lg:grid-cols-12'} gap-8 items-center`}>
        
        {/* Left main dial element */}
        <div className={`${isFullscreen ? 'lg:col-span-3' : 'lg:col-span-8'} flex flex-col items-center justify-center space-y-8`}>
          
          {/* Main Visual Flasher Shield */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            {/* Ambient pulsed halos */}
            <AnimatePresence>
              {currentVisualBeat === 0 && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0.7 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 blur-xl pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Symmetrical glowing circular outline */}
            <div className={`absolute inset-0 rounded-full border-2 transition-colors duration-150 flex items-center justify-center ${
              currentVisualBeat !== -1 ? 'border-purple-500/30' : 'border-slate-900'
            }`}>
              {/* Inner ring */}
              <div className="w-[90%] h-[90%] rounded-full border border-dashed border-slate-800 flex items-center justify-center">
                {/* Dial Center */}
                <div className="glass-panel w-[85%] h-[85%] rounded-full flex flex-col items-center justify-center border-slate-800/80 p-6 shadow-2xl relative">
                  
                  <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">TEMPO METRIC</span>
                  
                  {/* Dynamic BPM text editable input or display */}
                  <div className="flex items-baseline gap-1 mt-1">
                    <input
                      type="number"
                      value={bpm}
                      min="20"
                      max="400"
                      onChange={(e) => setBpm(Math.max(20, Math.min(400, Number(e.target.value) || 120)))}
                      className="text-5xl md:text-6xl font-mono font-bold text-center bg-transparent text-white outline-none focus:text-purple-400 w-36"
                    />
                  </div>
                  
                  <span className="text-xs text-slate-400 font-medium tracking-wide">Beats Per Minute</span>

                  {/* Manual +/- Quick adjustments */}
                  <div className="flex gap-2.5 mt-5">
                    <button
                      onClick={() => handleBpmChange(-5)}
                      className="w-10 h-8 rounded bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-slate-850 flex items-center justify-center cursor-pointer"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleBpmChange(-1)}
                      className="w-8 h-8 rounded bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-slate-850 flex items-center justify-center cursor-pointer"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleBpmChange(1)}
                      className="w-8 h-8 rounded bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-slate-850 flex items-center justify-center cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleBpmChange(5)}
                      className="w-10 h-8 rounded bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-slate-850 flex items-center justify-center cursor-pointer"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sched Controls row */}
          <div className="flex items-center gap-4 w-full max-w-sm">
            <button
              onClick={handlePlayToggle}
              className={`flex-1 py-4.5 rounded-xl font-display font-semibold flex items-center justify-center gap-3 shadow-lg transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-red-500 hover:bg-red-650 text-white shadow-red-500/10'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-550 hover:to-indigo-550 text-white shadow-purple-500/20'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-5 h-5 fill-white text-white" /> Stop Metronome
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white text-white" /> Start Practice
                </>
              )}
            </button>

            <button
              onClick={handleTapTempo}
              className="w-16 py-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:text-white text-slate-300 font-mono text-xs font-bold transition-all text-center flex flex-col justify-center items-center cursor-pointer"
            >
              <Activity className="w-4.5 h-4.5 mb-1 text-purple-400 animate-pulse" />
              TAP
            </button>
          </div>
        </div>

        {/* Right accents & structural dashboard controls menu */}
        <div className={`${isFullscreen ? 'lg:col-span-2' : 'lg:col-span-4'} space-y-6 w-full`}>
          
          {/* Accent Matrix Block */}
          <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
              <span className="text-xs font-display font-medium text-slate-300">ACCENTS MATRIX</span>
              <span className="text-[10px] text-purple-400 font-mono">CYCLE ON TAP</span>
            </div>

            {/* Time signature picker */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-slate-400">Beats Per Measure:</span>
              <div className="flex gap-1.5">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setTimeSignature(num)}
                    className={`w-6.5 h-6.5 rounded flex items-center justify-center text-xs font-mono font-medium transition-all cursor-pointer ${
                      timeSignature === num
                        ? 'bg-purple-500 text-white font-bold'
                        : 'bg-slate-900 text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Clicking node sequence */}
            <div className="grid grid-cols-6 gap-2 pt-2">
              {beatAccents.map((accent, index) => {
                const isActive = currentVisualBeat === index;
                return (
                  <button
                    key={index}
                    onClick={() => cycleAccent(index)}
                    className={`h-11 rounded-lg flex flex-col items-center justify-between p-1.5 border transition-all cursor-pointer ${
                      isActive
                        ? 'border-purple-400 bg-purple-950/20'
                        : 'border-slate-850 bg-slate-900/40 hover:bg-slate-850'
                    }`}
                  >
                    <span className="text-[9px] text-slate-500 font-mono">B{index + 1}</span>
                    <div className={`w-3.5 h-3.5 rounded-full ${
                      accent === 2
                        ? 'bg-purple-500 shadow shadow-purple-500/80' // Accent ring
                        : accent === 1
                        ? 'bg-indigo-400/40' // Standard light beat
                        : 'bg-slate-800' // Silent node
                    }`} />
                  </button>
                );
              })}
            </div>
            
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Accent</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400/40" /> Normal</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-800" /> Mute</span>
            </div>
          </div>

          {/* Swing and Volume config controls */}
          <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-4">
            <span className="text-xs font-display font-medium text-slate-300 block border-b border-slate-900 pb-2.5">MIXER OUTPUT</span>
            
            <div className="space-y-4">
              {/* Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Volume2 className="w-3.5 h-3.5 text-slate-500" /> Main Volume</span>
                  <span className="font-mono">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={(e) => setVolume(Number(e.target.value) / 100)}
                  className="w-full accent-purple-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Swing Dial Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Sliders className="w-3.5 h-3.5 text-slate-500" /> Micro Swing</span>
                  <span className="font-mono text-indigo-400">{swing}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="75"
                  value={swing}
                  onChange={(e) => setSwing(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Custom interactive beat sound selection widget */}
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Customizable Beat Sounds
                </span>
                <div className="grid grid-cols-2 gap-2 max-h-[178px] overflow-y-auto pr-1 customized-scrollbar">
                  {AVAILABLE_SOUNDS.map((sound) => {
                    const isSelected = soundSelection === sound.id;
                    return (
                      <button
                        key={sound.id}
                        onClick={() => {
                          setSoundSelection(sound.id);
                          auditionSound(sound.id, sound.frequency);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer select-none group h-[68px] ${
                          isSelected
                            ? 'bg-gradient-to-br from-purple-950/40 to-slate-900 border-purple-500/75 shadow-md shadow-purple-500/5'
                            : 'bg-slate-950/60 border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/40'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className={`text-[10px] font-semibold font-sans leading-tight transition-colors ${
                            isSelected ? 'text-purple-300' : 'text-slate-300 group-hover:text-white'
                          }`}>
                            {sound.name}
                          </span>
                          
                          {/* Mini play audition button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              auditionSound(sound.id, sound.frequency);
                            }}
                            className={`p-0.5 rounded transition-all flex items-center justify-center ${
                              isSelected 
                                ? 'bg-purple-950/80 text-purple-300 hover:bg-purple-900' 
                                : 'bg-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                            title="Audition sound"
                          >
                            <Play className="w-2 h-2 fill-current" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1 w-full gap-1">
                          <span className="text-[8.5px] text-slate-500 line-clamp-1 flex-1 leading-none">{sound.desc}</span>
                          <span className={`text-[7.5px] px-1 py-0.5 rounded font-mono scale-90 origin-right whitespace-nowrap leading-none ${
                            sound.category === 'Acoustic' 
                              ? 'bg-purple-950/30 text-purple-400 border border-purple-900/30' 
                              : sound.category === 'Digital' 
                              ? 'bg-cyan-950/30 text-cyan-400 border border-cyan-900/30' 
                              : sound.category === 'Metallic' 
                              ? 'bg-amber-950/30 text-amber-400 border border-amber-900/30' 
                              : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                          }`}>
                            {sound.category}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Progressive Tempo Ramping */}
          <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-display font-medium text-slate-300 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> SPEED RAMPING (ACCELERATOR)
              </span>
              <input
                type="checkbox"
                checked={isRamping}
                onChange={(e) => setIsRamping(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-slate-900 border-slate-800 rounded focus:ring-purple-500 focus:ring-2"
              />
            </div>
            
            <p className="text-[10px] text-slate-400">Automatically increases the general beat frequency sequentially over measures.</p>

            {isRamping && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-2 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400">ADD BPM:</label>
                    <input
                      type="number"
                      value={rampBpmAdd}
                      min="1"
                      max="40"
                      onChange={(e) => setRampBpmAdd(Number(e.target.value) || 5)}
                      className="w-full premium-input font-mono mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">EVERY (BARS):</label>
                    <input
                      type="number"
                      value={rampIntervalBars}
                      min="1"
                      max="32"
                      onChange={(e) => setRampIntervalBars(Number(e.target.value) || 4)}
                      className="w-full premium-input font-mono mt-1"
                    />
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850 flex items-center justify-between font-mono text-[9px]">
                  <span className="text-slate-400 uppercase">Bars Played:</span>
                  <span className="text-purple-400 font-bold">{barsCompleted} / {rampIntervalBars}</span>
                </div>
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}
