import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  TrendingUp,
  Award,
  ListTodo,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PracticeBlock, PracticeJournalEntry } from '../types';
import { getAudioContext, triggerClickAtTime } from '../lib/audio';

interface PracticeHubToolProps {
  onGainXp: (xp: number) => void;
  onLogCompletedBlock: (minutes: number) => void;
}

export default function PracticeHubTool({ onGainXp, onLogCompletedBlock }: PracticeHubToolProps) {
  const [activeDashboardSection, setActiveDashboardSection] = useState<'timer' | 'trainer' | 'journal' | 'analytics'>('timer');

  // ==========================================
  // MODULE 1: PRACTICE TIMER & BLOCKS STATE
  // ==========================================
  const [blocks, setBlocks] = useState<PracticeBlock[]>([
    { id: '1', name: 'Major Scale Arpeggios', durationMinutes: 10, category: 'scales' },
    { id: '2', name: 'Sweeping Hand Warmups', durationMinutes: 5, category: 'exercises' },
    { id: '3', name: 'Technical Song Section', durationMinutes: 20, category: 'songs' },
  ]);

  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockDuration, setNewBlockDuration] = useState(15);
  const [newBlockCategory, setNewBlockCategory] = useState<'scales' | 'songs' | 'exercises' | 'technique'>('scales');

  const [selectedBlock, setSelectedBlock] = useState<PracticeBlock | null>(blocks[0] || null);
  const [timeLeft, setTimeLeft] = useState(0); // seconds remaining
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIdRef = useRef<any>(null);

  // Initialize block timers
  useEffect(() => {
    if (selectedBlock) {
      setTimeLeft(selectedBlock.durationMinutes * 60);
      setIsTimerRunning(false);
      if (timerIdRef.current) clearInterval(timerIdRef.current);
    }
  }, [selectedBlock]);

  const handleStartTimer = () => {
    if (isTimerRunning) {
      clearInterval(timerIdRef.current);
      setIsTimerRunning(false);
    } else {
      setIsTimerRunning(true);
      timerIdRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIdRef.current);
            setIsTimerRunning(false);
            handleAlarmFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleAlarmFinish = () => {
    if (selectedBlock) {
      // Trigger success audio synth bell chimes
      try {
        const ctx = getAudioContext();
        triggerClickAtTime(ctx, ctx.currentTime, 1100, 'beep', 0.8);
        setTimeout(() => triggerClickAtTime(ctx, ctx.currentTime, 1400, 'beep', 0.8), 150);
      } catch (err) {
        console.warn(err);
      }

      onGainXp(selectedBlock.durationMinutes * 10);
      onLogCompletedBlock(selectedBlock.durationMinutes);

      // Save automatic journal logs
      const autoEntry: PracticeJournalEntry = {
        id: Math.random().toString(),
        date: new Date().toLocaleDateString(),
        category: selectedBlock.category,
        sessionNotes: `Completed practice session block: "${selectedBlock.name}".`,
        bpmReached: 0,
        durationMinutes: selectedBlock.durationMinutes,
        observations: 'Satisfactory technical block completion.'
      };
      setJournal([autoEntry, ...journal]);
      localStorage.setItem('resonance_journal', JSON.stringify([autoEntry, ...journal]));

      alert(`Practice block "${selectedBlock.name}" completed! XP rewarded.`);
      setTimeLeft(selectedBlock.durationMinutes * 60);
    }
  };

  const handleResetTimer = () => {
    if (timerIdRef.current) clearInterval(timerIdRef.current);
    setIsTimerRunning(false);
    if (selectedBlock) {
      setTimeLeft(selectedBlock.durationMinutes * 60);
    }
  };

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockName.trim()) return;

    const added: PracticeBlock = {
      id: Math.random().toString(),
      name: newBlockName,
      durationMinutes: Number(newBlockDuration),
      category: newBlockCategory
    };

    const updated = [...blocks, added];
    setBlocks(updated);
    setSelectedBlock(added);
    setNewBlockName('');
  };

  const handleDeleteBlock = (id: string) => {
    const filt = blocks.filter((b) => b.id !== id);
    setBlocks(filt);
    if (selectedBlock?.id === id) {
      setSelectedBlock(filt[0] || null);
    }
  };

  const formatTimerString = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // MODULE 2: AUTOMATIC TEMPO TRAINER STATES
  // ==========================================
  const [startBpm, setStartBpm] = useState(80);
  const [incAmount, setIncAmount] = useState(4);
  const [incTimerSeconds, setIncTimerSeconds] = useState(15);

  const [trainerActiveBpm, setTrainerActiveBpm] = useState(80);
  const [isTrainerPlaying, setIsTrainerPlaying] = useState(false);
  const [trainerElapsedSeconds, setTrainerElapsedSeconds] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const trainerBpmRef = useRef(80);
  const intervalIdRef = useRef<any>(null);
  const secondsCountIdRef = useRef<any>(null);

  useEffect(() => {
    trainerBpmRef.current = trainerActiveBpm;
  }, [trainerActiveBpm]);

  const handleToggleTrainer = () => {
    if (isTrainerPlaying) {
      clearInterval(intervalIdRef.current);
      clearInterval(secondsCountIdRef.current);
      setIsTrainerPlaying(false);
    } else {
      try {
        audioContextRef.current = getAudioContext();
      } catch (err) {
        console.warn(err);
      }

      setIsTrainerPlaying(true);
      setTrainerActiveBpm(startBpm);
      setTrainerElapsedSeconds(0);

      // Start tick clock interval
      let nextClickTime = performance.now();
      const rebootMetronome = (currentBpm: number) => {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        const gapMs = (60 / currentBpm) * 1000;
        
        intervalIdRef.current = setInterval(() => {
          if (audioContextRef.current) {
            triggerClickAtTime(audioContextRef.current, audioContextRef.current.currentTime, 760, 'woodblock', 0.8);
          }
        }, gapMs);
      };

      rebootMetronome(startBpm);

      // Start elapsed clock seconds tracker
      let localElapsed = 0;
      let localBpm = startBpm;
      secondsCountIdRef.current = setInterval(() => {
        localElapsed++;
        setTrainerElapsedSeconds(localElapsed);

        if (localElapsed % incTimerSeconds === 0) {
          localBpm += incAmount;
          setTrainerActiveBpm(localBpm);
          rebootMetronome(localBpm);
          onGainXp(10);
        }
      }, 1000);
    }
  };

  // ==========================================
  // MODULE 3: PERSISTENT PRACTICE JOURNAL
  // ==========================================
  const [journal, setJournal] = useState<PracticeJournalEntry[]>([]);
  const [jotNote, setJotNote] = useState('');
  const [jotBpm, setJotBpm] = useState(140);
  const [observations, setObservations] = useState('');
  const [jotCategory, setJotCategory] = useState<'scales' | 'songs' | 'exercises' | 'technique'>('scales');

  useEffect(() => {
    const raw = localStorage.getItem('resonance_journal');
    if (raw) {
      setJournal(JSON.parse(raw));
    } else {
      // populate with pristine sample logs
      const standardLogs: PracticeJournalEntry[] = [
        {
          id: 's1',
          date: '2026-06-01',
          category: 'scales',
          bpmReached: 124,
          durationMinutes: 15,
          observations: 'Struggled on minor triads. Cleaned up alternate-picking offsets.',
          sessionNotes: 'G-flat Natural Minor Speed Practice'
        },
        {
          id: 's2',
          date: '2026-05-30',
          category: 'songs',
          bpmReached: 110,
          durationMinutes: 25,
          observations: 'Fluid performance under speed. Hand strain minimal.',
          sessionNotes: 'Completed third movement bar guides.'
        }
      ];
      setJournal(standardLogs);
      localStorage.setItem('resonance_journal', JSON.stringify(standardLogs));
    }
  }, []);

  const handleSaveJournalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jotNote.trim()) return;

    const fresh: PracticeJournalEntry = {
      id: Math.random().toString(),
      date: new Date().toISOString().split('T')[0],
      category: jotCategory,
      bpmReached: Number(jotBpm),
      durationMinutes: 15,
      observations: observations || 'Good progress made in this interval.',
      sessionNotes: jotNote
    };

    const updated = [fresh, ...journal];
    setJournal(updated);
    localStorage.setItem('resonance_journal', JSON.stringify(updated));

    setJotNote('');
    setObservations('');
    onGainXp(25);
  };

  const handleDeleteJournal = (id: string) => {
    const filtered = journal.filter((j) => j.id !== id);
    setJournal(filtered);
    localStorage.setItem('resonance_journal', JSON.stringify(filtered));
  };

  // ==========================================
  // MODULE 4: RECHARTS ANALYTICS PRESETS
  // ==========================================
  const analyticsData = [
    { day: 'Mon', minutes: 15, maxBpm: 120 },
    { day: 'Tue', minutes: 30, maxBpm: 122 },
    { day: 'Wed', minutes: 20, maxBpm: 124 },
    { day: 'Thu', minutes: 45, maxBpm: 130 },
    { day: 'Fri', minutes: 10, maxBpm: 132 },
    { day: 'Sat', minutes: 60, maxBpm: 138 },
    { day: 'Sun', minutes: 40, maxBpm: 142 },
  ];

  useEffect(() => {
    return () => {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      if (secondsCountIdRef.current) clearInterval(secondsCountIdRef.current);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 space-y-8 select-none"
    >
      {/* Station Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h1 className="font-display font-semibold text-2xl text-white tracking-tight">Practice Hub Workstation</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Manage custom block schedules, track speed tempo gains, and write session journals.</p>
        </div>

        {/* Action picker */}
        <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800">
          {[
            { id: 'timer', label: 'Workout Timer' },
            { id: 'trainer', label: 'Tempo Trainer' },
            { id: 'journal', label: 'Practice Journal' },
            { id: 'analytics', label: 'Analytics Insights' }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => {
                setActiveDashboardSection(sec.id as any);
                if (isTrainerPlaying) handleToggleTrainer();
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium font-sans cursor-pointer transition-all ${
                activeDashboardSection === sec.id
                  ? 'bg-emerald-600 text-white shadow shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* TIMER ZONE */}
        {activeDashboardSection === 'timer' && (
          <motion.div
            key="timer"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid lg:grid-cols-12 gap-8"
          >
            {/* Task list left */}
            <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h3 className="font-display font-medium text-slate-200 text-sm tracking-wide flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-emerald-400" /> WORKOUT SCHEDULES
                </h3>
              </div>

              {/* Added blocks queue */}
              <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlock(block)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedBlock?.id === block.id
                        ? 'bg-emerald-950/20 border-emerald-500/35'
                        : 'bg-slate-900/30 border-slate-900 hover:border-slate-800'
                    }`}
                  >
                    <div>
                      <h4 className="font-sans font-semibold text-xs text-slate-200">{block.name}</h4>
                      <span className="text-[9px] text-emerald-400 font-mono tracking-wider uppercase mt-1 inline-block">{block.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">{block.durationMinutes}m</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                        className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form to add quick blocks */}
              <form onSubmit={handleAddBlock} className="border-t border-slate-900 pt-5 space-y-4">
                <div>
                  <label className="text-[10px] text-slate-400">SESSION BLOCK NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="Chopin Ballade, Legato, Scales..."
                    value={newBlockName}
                    onChange={(e) => setNewBlockName(e.target.value)}
                    className="w-full premium-input font-sans text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400">DURATION (MINUTES)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={newBlockDuration}
                      onChange={(e) => setNewBlockDuration(Number(e.target.value) || 10)}
                      className="w-full premium-input font-mono mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">CATEGORY</label>
                    <select
                      value={newBlockCategory}
                      onChange={(e: any) => setNewBlockCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs p-2 text-slate-300 mt-1 h-9"
                    >
                      <option value="scales">Scales</option>
                      <option value="exercises">Exercises</option>
                      <option value="songs">Songs</option>
                      <option value="technique">Technique</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-slate-300 hover:text-white border border-slate-850 rounded-lg transition-colors cursor-pointer"
                >
                  Quick Enqueue Task
                </button>
              </form>
            </div>

            {/* Glowing clock right */}
            <div className="lg:col-span-8 flex flex-col justify-center items-center space-y-6 min-h-[350px]">
              {selectedBlock ? (
                <div className="text-center space-y-6">
                  
                  {/* Digital glowing readout */}
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 tracking-wider font-mono">ACTIVE BLOCK COUNTDOWN</span>
                    <h2 className="text-3xl md:text-4xl text-emerald-400 font-display font-medium">{selectedBlock.name}</h2>
                  </div>

                  {/* Glassmorphic counting ring */}
                  <div className="relative w-56 h-56 rounded-full border-4 border-emerald-950/40 flex items-center justify-center shadow-2xl">
                    <div className="text-center">
                      <span className="text-5xl font-mono font-bold text-white tracking-tight">{formatTimerString(timeLeft)}</span>
                      <p className="text-[10px] text-slate-500 font-mono mt-1 text-center">MM:SS LEFT</p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleStartTimer}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/15"
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5" /> Pause Clock
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" /> Start Countdown
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleResetTimer}
                      className="p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-lg border border-slate-850 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <Clock className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">Enqueue blocks in schedule planner to begin countdown sequences.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TEMPO TRAINER TAB */}
        {activeDashboardSection === 'trainer' && (
          <motion.div
            key="trainer"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="max-w-xl mx-auto glass-panel p-8 rounded-2xl border-slate-800 space-y-6"
          >
            <div className="text-center space-y-1.5">
              <h3 className="font-display font-medium text-slate-200 text-sm tracking-wide">AUTO-STEP TEMPO TRAINING</h3>
              <p className="text-xs text-slate-400">Allows hands-free speed build-ups, increasing metronome pace gradually.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 border-y border-slate-900 py-5">
              <div>
                <label className="text-[9px] text-slate-500 font-mono">START BPM</label>
                <input
                  type="number"
                  min="20"
                  max="350"
                  value={startBpm}
                  onChange={(e) => setStartBpm(Number(e.target.value) || 80)}
                  disabled={isTrainerPlaying}
                  className="w-full premium-input mt-1 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-500 font-mono">BPM INCREMENTS</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={incAmount}
                  onChange={(e) => setIncAmount(Number(e.target.value) || 4)}
                  disabled={isTrainerPlaying}
                  className="w-full premium-input mt-1 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-500 font-mono">EACH (SECONDS)</label>
                <input
                  type="number"
                  min="3"
                  max="300"
                  value={incTimerSeconds}
                  onChange={(e) => setIncTimerSeconds(Number(e.target.value) || 15)}
                  disabled={isTrainerPlaying}
                  className="w-full premium-input mt-1 text-sm font-mono"
                />
              </div>
            </div>

            {/* Large active trainer panel */}
            <div className="h-32 bg-slate-950/60 rounded-xl relative border border-slate-900 flex flex-col justify-center items-center">
              {isTrainerPlaying ? (
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase animate-pulse">TRAINING MOTOR SPEED...</span>
                  <div className="text-4xl font-mono font-bold text-white mt-1">
                    {trainerActiveBpm} <span className="text-xs text-slate-400">BPM</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">Ramping in {incTimerSeconds - (trainerElapsedSeconds % incTimerSeconds)}s</p>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-mono">TRAINER INACTIVE</span>
              )}
            </div>

            <button
              onClick={handleToggleTrainer}
              className={`w-full py-3.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                isTrainerPlaying
                  ? 'bg-slate-800 text-red-400 hover:bg-slate-755'
                  : 'bg-emerald-600 hover:bg-emerald-550 text-white'
              }`}
            >
              {isTrainerPlaying ? (
                <>
                  <Pause className="w-4 h-4" /> Hard Stop Trainer
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" /> Run Auto Ramps Session
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* PRACTICE JOURNAL TAB */}
        {activeDashboardSection === 'journal' && (
          <motion.div
            key="journal"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid lg:grid-cols-12 gap-8"
          >
            {/* Quick entry form */}
            <form onSubmit={handleSaveJournalEntry} className="lg:col-span-5 glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
              <h3 className="font-display font-medium text-slate-200 text-sm tracking-wide">WRITE JOURNAL ENTRY</h3>
              
              <div>
                <label className="text-[10px] text-slate-400">PRACTICED SEGMENT / OBSERVATION</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mendelssohn Violin Concerto"
                  value={jotNote}
                  onChange={(e) => setJotNote(e.target.value)}
                  className="w-full premium-input mt-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">MAX BPM ACHIEVED</label>
                  <input
                    type="number"
                    min="20"
                    max="400"
                    value={jotBpm}
                    onChange={(e) => setJotBpm(Number(e.target.value) || 120)}
                    className="w-full premium-input font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">CATEGORY</label>
                  <select
                    value={jotCategory}
                    onChange={(e: any) => setJotCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs p-2 text-slate-300 mt-1 h-9"
                  >
                    <option value="scales">Scales</option>
                    <option value="exercises">Exercises</option>
                    <option value="songs">Songs</option>
                    <option value="technique">Technique</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400">OBSERVATIONS & STRUGGLE AREAS</label>
                <textarea
                  rows={3}
                  placeholder="Need to relax my pinky during shifts. Metronome sync flawless."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full premium-input mt-1 text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-550 text-xs font-semibold text-white cursor-pointer transition-colors"
              >
                Log Session & Unlock XP
              </button>
            </form>

            {/* List entries */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-display font-medium text-slate-300">HISTORIC JOURNAL BOOK</h3>
              
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {journal.map((j) => (
                  <div key={j.id} className="p-4 rounded-xl border border-slate-900 bg-slate-900/30 space-y-2 relative group">
                    <button
                      onClick={() => handleDeleteJournal(j.id)}
                      className="absolute top-3 right-3 text-slate-600 hover:text-red-400 cursor-pointer p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-slate-800 text-slate-400 font-mono tracking-wider font-semibold px-2 py-0.5 rounded uppercase">{j.category}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{j.date}</span>
                    </div>

                    <h4 className="font-semibold text-xs text-slate-200 pr-8">{j.sessionNotes}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">{j.observations}</p>

                    {j.bpmReached > 0 && (
                      <div className="font-mono text-[9px] text-emerald-400 font-bold mt-1">
                        MAX TEMPO: {j.bpmReached} BPM
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ANALYTICS INSIGHTS */}
        {activeDashboardSection === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid lg:grid-cols-12 gap-8"
          >
            {/* Recharts graph left */}
            <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
              <div>
                <h3 className="text-xs font-display font-medium text-slate-200">TRAINING CONSISTENCY TIMELINE</h3>
                <p className="text-[10px] text-slate-500">Practice duration (Minutes) mapped dynamically across the standard week.</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={10} fontClassName="font-mono" />
                    <YAxis stroke="#64748b" fontSize={10} fontClassName="font-mono" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: 11 }} />
                    <Area type="monotone" dataKey="minutes" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMinutes)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legend right */}
            <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border-slate-800 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-display font-medium text-slate-200 text-sm tracking-wide flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" /> MILESTONE REWARDS
                </h3>

                <div className="space-y-3.5">
                  <div className="flex gap-3 text-xs">
                    <div className="w-8.5 h-8.5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold">142</div>
                    <div>
                      <h4 className="font-semibold text-slate-200">Max BPM Achievements</h4>
                      <p className="text-[10px] text-slate-400">Peak pace registered on scale work logs.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 text-xs">
                    <div className="w-8.5 h-8.5 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center font-mono font-bold">2.5h</div>
                    <div>
                      <h4 className="font-semibold text-slate-200">Total Hours Practice</h4>
                      <p className="text-[10px] text-slate-400">Summary accrued across blocks.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                <p className="text-[10px] text-slate-400 leading-normal">
                  Musicians logging 30m+ daily see average rhythm consistency gains of up to 18% in the first fortnight. Keep practicing!
                </p>
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
