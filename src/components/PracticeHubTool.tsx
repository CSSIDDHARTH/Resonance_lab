import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Play,
  Pause,
  Square,
  RotateCcw,
  BookOpen,
  TrendingUp,
  Award,
  ListTodo,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PracticeBlock, PracticeJournalEntry, UserProgress, RepertoireSong } from '../types';
import { getAudioContext, triggerClickAtTime } from '../lib/audio';

interface PracticeHubToolProps {
  onGainXp: (xp: number) => void;
  onLogCompletedBlock: (minutes: number) => void;
  userProgress: UserProgress;
  onUpdateRepertoire: (repertoire: RepertoireSong[]) => void;
}

export default function PracticeHubTool({ 
  onGainXp, 
  onLogCompletedBlock, 
  userProgress,
  onUpdateRepertoire
}: PracticeHubToolProps) {
  const [activeDashboardSection, setActiveDashboardSection] = useState<'timer' | 'trainer' | 'journal' | 'repertoire' | 'analytics'>('timer');

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

  // ==========================================
  // MODULE 4: AI COACHING INSIGHTS
  // ==========================================
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleGetAiInsights = async () => {
    if (journal.length === 0) {
      alert('Log some practice sessions first to get AI insights!');
      return;
    }
    
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/analyze-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journalEntries: journal.slice(0, 5) }) // Send last 5 entries
      });
      const data = await response.json();
      setAiInsights(data);
    } catch (err) {
      console.error('AI Insight Error:', err);
      alert('Failed to connect to AI Coach. Make sure the server is running with a valid API key.');
    } finally {
      setIsAiLoading(false);
    }
  };

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

  // ==========================================
  // MODULE: REPERTOIRE GUARD (Predictive Maintenance)
  // ==========================================
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongTitle.trim()) return;

    const fresh: RepertoireSong = {
      id: Math.random().toString(),
      title: newSongTitle,
      artist: newSongArtist || 'Unknown Artist',
      learnedDate: new Date().toISOString().split('T')[0],
      lastReviewedDate: new Date().toISOString().split('T')[0],
      difficulty: 2,
      retentionScore: 100
    };

    onUpdateRepertoire([fresh, ...userProgress.repertoire]);
    setNewSongTitle('');
    setNewSongArtist('');
  };

  const handleReviewSong = (id: string) => {
    const updated = userProgress.repertoire.map(s => {
      if (s.id === id) {
        return { 
          ...s, 
          lastReviewedDate: new Date().toISOString().split('T')[0],
          retentionScore: 100 
        };
      }
      return s;
    });
    onUpdateRepertoire(updated);
    onGainXp(50);
  };

  const getRetentionColor = (score: number) => {
    if (score > 80) return 'text-emerald-400';
    if (score > 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 space-y-8 select-none"
    >
      {/* Station Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Practice Hub Workstation</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage custom block schedules, track speed tempo gains, and write session journals.</p>
        </div>

        {/* Action picker */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
          {[
            { id: 'timer', label: 'Workout Timer' },
            { id: 'trainer', label: 'Tempo Trainer' },
            { id: 'journal', label: 'Practice Journal' },
            { id: 'repertoire', label: 'Repertoire Guard' },
            { id: 'analytics', label: 'Analytics Insights' }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => {
                setActiveDashboardSection(sec.id as any);
                if (isTrainerPlaying) handleToggleTrainer();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all whitespace-nowrap ${
                activeDashboardSection === sec.id
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* REPERTOIRE GUARD ZONE */}
        {activeDashboardSection === 'repertoire' && (
          <motion.div
            key="repertoire"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid lg:grid-cols-12 gap-8"
          >
            {/* Add song form left */}
            <div className="lg:col-span-4 glass-panel p-6 rounded-3xl border-slate-200 space-y-6 shadow-sm">
              <h3 className="font-display font-bold text-slate-900 text-sm tracking-wide flex items-center gap-2 uppercase">
                <BookOpen className="w-4 h-4 text-blue-600" /> REPERTOIRE INTAKE
              </h3>
              <form onSubmit={handleAddSong} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SONG TITLE</label>
                  <input
                    type="text"
                    required
                    placeholder="Clair de Lune, Master of Puppets..."
                    value={newSongTitle}
                    onChange={(e) => setNewSongTitle(e.target.value)}
                    className="w-full premium-input font-sans text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ARTIST / COMPOSER</label>
                  <input
                    type="text"
                    placeholder="Debussy, Metallica..."
                    value={newSongArtist}
                    onChange={(e) => setNewSongArtist(e.target.value)}
                    className="w-full premium-input font-sans text-xs mt-1"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-500/20"
                >
                  Add to Mastered Library
                </button>
              </form>
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-600 font-bold leading-relaxed italic">
                  "The Repertoire Guard uses a music-specific Spaced Repetition System. Learned pieces decay over time if not reviewed."
                </p>
              </div>
            </div>

            {/* Repertoire List Right */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-display font-bold text-slate-900 uppercase">INTELLIGENT MAINTENANCE SCHEDULE</h3>
                <span className="text-[10px] text-slate-400 font-bold font-mono">Total Pieces: {userProgress.repertoire.length}</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2 customized-scrollbar">
                {userProgress.repertoire.length > 0 ? userProgress.repertoire.map((song) => (
                  <div key={song.id} className="glass-panel p-4 rounded-2xl border-slate-100 bg-white flex flex-col justify-between space-y-4 group shadow-sm hover:border-blue-200 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{song.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold">{song.artist}</p>
                      </div>
                      <div className={`text-right space-y-0.5`}>
                        <span className={`text-lg font-mono font-bold ${getRetentionColor(song.retentionScore)}`}>
                          {song.retentionScore}%
                        </span>
                        <p className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">Retention</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-50 flex justify-between items-center">
                      <div className="text-[9px] text-slate-400 font-bold font-mono">
                        Last Reviewed: {song.lastReviewedDate}
                      </div>
                      <button
                        onClick={() => handleReviewSong(song.id)}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Run Review
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 py-20 text-center space-y-3">
                    <BookOpen className="w-10 h-10 text-slate-200 mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">Your mastered library is empty. Add songs to start guarding them against decay.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

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
            <div className="lg:col-span-4 glass-panel p-6 rounded-3xl border-slate-200 space-y-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-display font-bold text-slate-900 text-sm tracking-wide flex items-center gap-2 uppercase">
                  <ListTodo className="w-4 h-4 text-blue-600" /> WORKOUT SCHEDULES
                </h3>
              </div>

              {/* Added blocks queue */}
              <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1 customized-scrollbar">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlock(block)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedBlock?.id === block.id
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div>
                      <h4 className="font-sans font-bold text-xs text-slate-900">{block.name}</h4>
                      <span className="text-[9px] text-blue-600 font-bold font-mono tracking-wider uppercase mt-1 inline-block bg-blue-50 px-1.5 py-0.5 rounded-md">{block.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold font-mono">{block.durationMinutes}m</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                        className="text-slate-300 hover:text-red-500 p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form to add quick blocks */}
              <form onSubmit={handleAddBlock} className="border-t border-slate-100 pt-5 space-y-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SESSION BLOCK NAME</label>
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
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DURATION (MIN)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={newBlockDuration}
                      onChange={(e) => setNewBlockDuration(Number(e.target.value) || 10)}
                      className="w-full premium-input font-mono font-bold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CATEGORY</label>
                    <select
                      value={newBlockCategory}
                      onChange={(e: any) => setNewBlockCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl text-xs p-2 text-slate-700 mt-1 h-10 font-bold focus:border-blue-500 outline-none shadow-sm"
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
                  className="w-full py-3 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Quick Enqueue Task
                </button>
              </form>
            </div>

            {/* Glowing clock right */}
            <div className="lg:col-span-8 flex flex-col justify-center items-center space-y-8 min-h-[350px]">
              {selectedBlock ? (
                <div className="text-center space-y-8">
                  
                  {/* Digital glowing readout */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 tracking-widest font-bold font-mono uppercase">ACTIVE BLOCK COUNTDOWN</span>
                    <h2 className="text-4xl md:text-5xl text-slate-900 font-display font-bold">{selectedBlock.name}</h2>
                  </div>

                  {/* Glassmorphic counting ring */}
                  <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full border-8 border-white bg-white flex items-center justify-center shadow-2xl shadow-blue-500/5">
                    {/* Background track circle */}
                    <div className="absolute inset-0 rounded-full border-8 border-slate-50" />
                    
                    <div className="text-center relative z-10">
                      <span className="text-6xl md:text-7xl font-mono font-bold text-slate-900 tracking-tighter">{formatTimerString(timeLeft)}</span>
                      <p className="text-[10px] text-slate-400 font-bold font-mono mt-1 tracking-widest uppercase">MINUTES REMAINING</p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={handleStartTimer}
                      className={`px-8 py-3 rounded-2xl text-sm font-bold cursor-pointer flex items-center gap-2 transition-all shadow-lg ${
                        isTimerRunning 
                          ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                      }`}
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="w-4 h-4" /> Pause Session
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" /> Start Practice
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleResetTimer}
                      className="p-3 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl border border-slate-200 cursor-pointer shadow-sm transition-all"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Enqueue blocks in schedule planner</p>
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
            className="max-w-xl mx-auto glass-panel p-10 rounded-3xl border-slate-200 space-y-8 shadow-sm"
          >
            <div className="text-center space-y-2">
              <h3 className="font-display font-bold text-slate-900 text-sm tracking-wide uppercase">AUTO-STEP TEMPO TRAINING</h3>
              <p className="text-xs text-slate-500 font-medium">Allows hands-free speed build-ups, increasing metronome pace gradually.</p>
            </div>

            <div className="grid grid-cols-3 gap-6 border-y border-slate-100 py-8">
              <div>
                <label className="text-[10px] text-slate-400 font-bold font-mono tracking-widest uppercase">START BPM</label>
                <input
                  type="number"
                  min="20"
                  max="350"
                  value={startBpm}
                  onChange={(e) => setStartBpm(Number(e.target.value) || 80)}
                  disabled={isTrainerPlaying}
                  className="w-full premium-input mt-2 text-sm font-bold font-mono text-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold font-mono tracking-widest uppercase">BPM ADD</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={incAmount}
                  onChange={(e) => setIncAmount(Number(e.target.value) || 4)}
                  disabled={isTrainerPlaying}
                  className="w-full premium-input mt-2 text-sm font-bold font-mono text-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold font-mono tracking-widest uppercase">EVERY (S)</label>
                <input
                  type="number"
                  min="3"
                  max="300"
                  value={incTimerSeconds}
                  onChange={(e) => setIncTimerSeconds(Number(e.target.value) || 15)}
                  disabled={isTrainerPlaying}
                  className="w-full premium-input mt-2 text-sm font-bold font-mono text-blue-600"
                />
              </div>
            </div>

            {/* Large active trainer panel */}
            <div className="h-40 bg-slate-50 rounded-3xl relative border border-slate-100 flex flex-col justify-center items-center shadow-inner overflow-hidden">
              {isTrainerPlaying ? (
                <div className="text-center space-y-1 relative z-10">
                  <span className="text-[10px] font-bold font-mono text-blue-600 uppercase animate-pulse tracking-widest">TRAINING MOTOR SPEED...</span>
                  <div className="text-5xl font-mono font-bold text-slate-900 mt-1">
                    {trainerActiveBpm} <span className="text-sm text-slate-400 font-bold uppercase">BPM</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold font-mono">Ramping in {incTimerSeconds - (trainerElapsedSeconds % incTimerSeconds)}s</p>
                </div>
              ) : (
                <span className="text-xs text-slate-300 font-bold font-mono uppercase tracking-widest">TRAINER INACTIVE</span>
              )}
            </div>

            <button
              onClick={handleToggleTrainer}
              className={`w-full py-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all ${
                isTrainerPlaying
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              {isTrainerPlaying ? (
                <>
                  <Square className="w-4 h-4 fill-white" /> Hard Stop Trainer
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
            <form onSubmit={handleSaveJournalEntry} className="lg:col-span-5 glass-panel p-8 rounded-3xl border-slate-200 space-y-6 shadow-sm">
              <h3 className="font-display font-bold text-slate-900 text-sm tracking-wide uppercase">WRITE JOURNAL ENTRY</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PRACTICED SEGMENT</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mendelssohn Violin Concerto"
                    value={jotNote}
                    onChange={(e) => setJotNote(e.target.value)}
                    className="w-full premium-input mt-1.5 text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">MAX BPM</label>
                    <input
                      type="number"
                      min="20"
                      max="400"
                      value={jotBpm}
                      onChange={(e) => setJotBpm(Number(e.target.value) || 120)}
                      className="w-full premium-input font-mono font-bold mt-1.5 text-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">CATEGORY</label>
                    <select
                      value={jotCategory}
                      onChange={(e: any) => setJotCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl text-xs p-2 text-slate-700 mt-1.5 h-10 font-bold focus:border-blue-500 outline-none shadow-sm"
                    >
                      <option value="scales">Scales</option>
                      <option value="exercises">Exercises</option>
                      <option value="songs">Songs</option>
                      <option value="technique">Technique</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">OBSERVATIONS</label>
                  <textarea
                    rows={4}
                    placeholder="Need to relax my pinky during shifts. Metronome sync flawless."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full premium-input mt-1.5 text-xs resize-none font-medium leading-relaxed"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white cursor-pointer shadow-lg shadow-blue-500/20 transition-all"
              >
                Log Session & Unlock XP
              </button>
            </form>

            {/* List entries */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-display font-bold text-slate-900 uppercase">HISTORIC JOURNAL BOOK</h3>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 customized-scrollbar">
                {journal.map((j) => (
                  <div key={j.id} className="p-5 rounded-2xl border border-slate-100 bg-white space-y-3 relative group shadow-sm hover:border-blue-200 transition-all">
                    <button
                      onClick={() => handleDeleteJournal(j.id)}
                      className="absolute top-4 right-4 text-slate-200 hover:text-red-500 cursor-pointer p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-bold font-mono tracking-wider px-2 py-0.5 rounded-md uppercase">{j.category}</span>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">{j.date}</span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 pr-8">{j.sessionNotes}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{j.observations}</p>

                    {j.bpmReached > 0 && (
                      <div className="font-mono text-[10px] text-blue-600 font-bold mt-2 bg-blue-50/50 px-2 py-1 rounded-lg inline-block uppercase tracking-wider">
                        Peak Tempo: {j.bpmReached} BPM
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
            <div className="lg:col-span-8 glass-panel p-8 rounded-3xl border-slate-200 space-y-6 shadow-sm">
              <div>
                <h3 className="text-xs font-display font-bold text-slate-900 uppercase">TRAINING CONSISTENCY TIMELINE</h3>
                <p className="text-[10px] text-slate-500 font-medium mt-1">Practice duration (Minutes) mapped dynamically across the standard week.</p>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007AFF" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} fontClassName="font-mono font-bold" axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} fontClassName="font-mono font-bold" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: 11, fontWeight: 'bold', color: '#1D1D1F' }} />
                    <Area type="monotone" dataKey="minutes" stroke="#007AFF" strokeWidth={3} fillOpacity={1} fill="url(#colorMinutes)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legend right */}
            <div className="lg:col-span-4 glass-panel p-8 rounded-3xl border-slate-200 space-y-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-6">
                <h3 className="font-display font-bold text-slate-900 text-sm tracking-wide flex items-center gap-2 uppercase">
                  <Award className="w-4 h-4 text-orange-500" /> MILESTONE REWARDS
                </h3>

                <div className="space-y-5">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-mono font-bold text-lg shadow-inner">142</div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Max BPM Achieved</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Peak pace registered on scale work logs.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-mono font-bold text-lg shadow-inner">2.5h</div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Total Hours practice</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Summary accrued across blocks.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                <p className="text-[10px] text-slate-500 font-bold leading-normal italic">
                  "Musicians logging 30m+ daily see average rhythm consistency gains of up to 18% in the first fortnight. Keep practicing!"
                </p>
              </div>

              {/* AI COACHING WIDGET */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <button
                  onClick={handleGetAiInsights}
                  disabled={isAiLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                  {isAiLoading ? 'Analyzing Performance...' : 'Get AI Practice Insights'}
                </button>

                {aiInsights.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl space-y-3 shadow-sm"
                  >
                    <span className="text-[9px] text-blue-700 font-bold font-mono uppercase tracking-widest border-b border-blue-100 pb-1 block">Coach Recommendations:</span>
                    <ul className="space-y-2">
                      {aiInsights.map((insight, i) => (
                        <li key={i} className="text-[10px] text-slate-700 leading-relaxed flex gap-2 font-medium">
                          <span className="text-blue-600 font-bold">•</span> {insight}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
