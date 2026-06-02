import { motion } from 'motion/react';
import {
  Flame,
  Clock,
  Target,
  Award,
  Sparkles,
  ArrowRight,
  Gauge,
  Activity,
  Calendar,
  BookOpen,
  Music4,
  SlidersHorizontal,
  ChevronRight,
  Trophy,
  History
} from 'lucide-react';
import { AppSection, UserProgress, ACHIEVEMENTS } from '../types';

interface DashboardProps {
  onSectionChange: (section: AppSection) => void;
  userProgress: UserProgress;
  totalPracticeDuration: number;
  completedBlocksCount: number;
}

export default function Dashboard({
  onSectionChange,
  userProgress,
  totalPracticeDuration,
  completedBlocksCount
}: DashboardProps) {
  
  const getLevelTier = (level: number) => {
    if (level < 3) return 'Beginner';
    if (level < 6) return 'Intermediate';
    if (level < 10) return 'Advanced';
    return 'Maestro';
  };

  const nextLevelXp = userProgress.level * 400;
  const xpPercent = Math.min(100, Math.floor((userProgress.xp / nextLevelXp) * 100));

  const quickLaunchers = [
    {
      id: 'metronome',
      logo: Gauge,
      title: 'Smart Metronome',
      desc: 'Accurate BPM clock, swing, and visual beat sweep.',
      accent: 'border-purple-500/25 text-purple-400'
    },
    {
      id: 'rhythm-lab',
      logo: Activity,
      title: 'Rhythm Studio',
      desc: 'Verify timing consistency and play polyrhythms.',
      accent: 'border-blue-500/25 text-blue-400'
    },
    {
      id: 'practice-hub',
      logo: Calendar,
      title: 'Practice Hub',
      desc: 'Manage timers, log tracks, and view history.',
      accent: 'border-emerald-500/25 text-emerald-400'
    },
    {
      id: 'theory-toolkit',
      logo: BookOpen,
      title: 'Theory Toolkit',
      desc: 'Interactive circle of fifths and chord calculators.',
      accent: 'border-pink-500/25 text-pink-400'
    },
    {
      id: 'ear-training',
      logo: Music4,
      title: 'Ear Training',
      desc: 'Practise pitch, chord, and interval detection.',
      accent: 'border-yellow-500/25 text-yellow-500'
    },
    {
      id: 'producer-tools',
      logo: SlidersHorizontal,
      title: 'Producer Tools',
      desc: 'Convert delay taps, feedback, and notes.',
      accent: 'border-indigo-500/25 text-indigo-400'
    }
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="p-6 md:p-8 space-y-8 select-none"
    >
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl text-white tracking-tight">
            Welcome, <span className="text-gradient-purple font-bold">Acoustic Master</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build your auditory precision, tracking rhythms and dynamic ranges.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-purple-950/20 border border-purple-500/10 px-4 py-2 rounded-xl">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-xs text-purple-200 font-mono font-medium">Rank Tier: {getLevelTier(userProgress.level)}</span>
        </div>
      </div>

      {/* Main Core Stats Bento Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Stat card 1: Today's practice */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-[130px] border-slate-800 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium font-sans">TODAY'S PRACTICE</span>
            <Target className="w-4.5 h-4.5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-white">{completedBlocksCount}</span>
              <span className="text-xs text-slate-400 font-medium">blocks done</span>
            </div>
            <div className="w-full bg-slate-900 h-1 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full" 
                style={{ width: `${Math.min(100, (completedBlocksCount / 4) * 100)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Stat card 2: Practice Streak */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-[130px] border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium font-sans">CURRENT STREAK</span>
            <Flame className="w-4.5 h-4.5 text-orange-500 fill-orange-500/20" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-orange-500">{userProgress.streak}</span>
              <span className="text-xs text-slate-400 font-medium">consecutive days</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">Next milestone: 7 Days</p>
          </div>
        </div>

        {/* Stat card 3: Total duration minutes */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-[130px] border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium font-sans">TOTAL TIME</span>
            <Clock className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400">{totalPracticeDuration}</span>
              <span className="text-xs text-slate-400 font-medium">minutes</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">Average 15m / block</p>
          </div>
        </div>

        {/* Stat card 4: XP Level Progress */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-[130px] border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium font-sans">XP PROGRESS</span>
            <Award className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-white">Lvl {userProgress.level}</span>
              <span className="text-[10px] text-slate-400 font-mono">{userProgress.xp}/{nextLevelXp} XP</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-800/80">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${xpPercent}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shortcuts & Achievements split grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Navigation panel */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display font-medium text-base text-slate-300 flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" /> Workstation Quick Launcher
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {quickLaunchers.map((ql) => {
              const Icon = ql.logo;
              return (
                <button
                  key={ql.id}
                  onClick={() => onSectionChange(ql.id)}
                  className="glass-card p-4 rounded-xl text-left border border-slate-900 hover:border-slate-800 transition-all cursor-pointer flex gap-4 group justify-between items-center"
                >
                  <div className="flex gap-4.5 items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-900/60 border ${ql.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-sans font-medium text-slate-200 text-sm group-hover:text-purple-300 transition-colors">
                        {ql.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-400 leading-normal line-clamp-1">{ql.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Achievements badge list */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h2 className="font-display font-medium text-sm text-slate-300 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" /> Professional Medals
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {userProgress.badges.length}/{ACHIEVEMENTS.length} Earned
              </span>
            </div>

            {/* Micro Badge Items */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto">
              {ACHIEVEMENTS.map((badge) => {
                const isEarned = userProgress.badges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`flex items-center gap-3.5 p-2 rounded-lg transition-colors ${
                      isEarned ? 'bg-slate-900/40 border border-purple-500/10' : 'bg-slate-950/40 border border-transparent opacity-50'
                    }`}
                  >
                    <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center ${
                      isEarned ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-900 text-slate-600'
                    }`}>
                      <Award className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-sans text-xs font-semibold ${isEarned ? 'text-slate-200' : 'text-slate-400'}`}>
                          {badge.name}
                        </span>
                        {isEarned && (
                          <span className="text-[9px] bg-purple-500/10 text-purple-400 font-mono px-1.5 py-0.5 rounded uppercase font-semibold">Unlocked</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-900">
            <button
              onClick={() => onSectionChange('practice-hub')}
              className="w-full py-1.5 bg-purple-950/20 hover:bg-purple-900/20 text-purple-300 text-[10px] font-mono font-medium rounded-lg border border-purple-950 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Log Session & Unlock XP <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
