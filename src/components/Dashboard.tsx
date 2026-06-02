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
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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

  const activityData = [
    { day: 'Mon', xp: 120, minutes: 15 },
    { day: 'Tue', xp: 240, minutes: 30 },
    { day: 'Wed', xp: 150, minutes: 20 },
    { day: 'Thu', xp: 350, minutes: 45 },
    { day: 'Fri', xp: 80,  minutes: 10 },
    { day: 'Sat', xp: 480, minutes: 60 },
    { day: 'Sun', xp: 320, minutes: 40 },
  ];
  
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight">
            Welcome, <span className="text-blue-600">Acoustic Master</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Build your auditory precision, tracking rhythms and dynamic ranges.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-blue-700 font-mono font-bold">Rank Tier: {getLevelTier(userProgress.level)}</span>
        </div>
      </div>

      {/* Main Core Stats Bento Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Stat card 1: Today's practice */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-[130px] border-slate-200 relative group overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold font-sans">TODAY'S PRACTICE</span>
            <Target className="w-4.5 h-4.5 text-blue-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-slate-900">{completedBlocksCount}</span>
              <span className="text-xs text-slate-500 font-bold">blocks done</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full" 
                style={{ width: `${Math.min(100, (completedBlocksCount / 4) * 100)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Stat card 2: Practice Streak */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-[130px] border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold font-sans">DAILY HABIT</span>
            <Flame className={`w-4.5 h-4.5 ${userProgress.lastPracticeDate === new Date().toISOString().split('T')[0] ? 'text-orange-500 fill-orange-500/10' : 'text-slate-300'}`} />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-orange-500">{userProgress.streak}</span>
              <span className="text-xs text-slate-500 font-bold">day streak</span>
            </div>
            {userProgress.lastPracticeDate === new Date().toISOString().split('T')[0] ? (
              <p className="text-[10px] text-emerald-600 mt-2 font-mono flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> STREAK SECURED
              </p>
            ) : (
              <button 
                onClick={() => onSectionChange('practice-hub')}
                className="text-[10px] text-blue-600 mt-2 font-mono hover:text-blue-500 underline underline-offset-2 cursor-pointer font-bold"
              >
                Practice 5m to keep streak
              </button>
            )}
          </div>
        </div>

        {/* Stat card 3: Total duration minutes */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-[130px] border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold font-sans">TOTAL TIME</span>
            <Clock className="w-4.5 h-4.5 text-indigo-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-slate-900">{totalPracticeDuration}</span>
              <span className="text-xs text-slate-500 font-bold">minutes</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-mono font-medium">Average 15m / block</p>
          </div>
        </div>

        {/* Stat card 4: XP Level Progress */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-[130px] border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold font-sans">XP PROGRESS</span>
            <Award className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-slate-900">Lvl {userProgress.level}</span>
              <span className="text-[10px] text-slate-500 font-mono font-bold">{userProgress.xp}/{nextLevelXp} XP</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-700" 
                style={{ width: `${xpPercent}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Analytics Premium Chart */}
      <div className="glass-panel p-5 md:p-6 rounded-2xl border-slate-200 space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" /> Weekly Output Telemetry
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Tracking sustained growth via XP & Session Duration over the last 7 days.</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono font-bold">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-blue-500" /> XP Earned</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-indigo-500" /> Minutes</span>
          </div>
        </div>
        
        <div className="h-[200px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007AFF" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5856D6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#5856D6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} fontClassName="font-mono font-bold" axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} fontClassName="font-mono font-bold" axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1D1D1F', fontSize: '11px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }} 
                itemStyle={{ color: '#64748b' }}
              />
              <Area type="monotone" dataKey="xp" stroke="#007AFF" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" activeDot={{ r: 5, fill: '#007AFF', stroke: '#fff', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="minutes" stroke="#5856D6" strokeWidth={3} fillOpacity={1} fill="url(#colorMin)" activeDot={{ r: 5, fill: '#5856D6', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Consistency Heatmap Layer */}
      <div className="glass-panel p-5 md:p-6 rounded-2xl border-slate-200 space-y-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Practice Density Map
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Visualizing your commitment frequency over the last 12 weeks.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate-400">
            Less <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-200" />
              <div className="w-2.5 h-2.5 rounded-sm bg-blue-100" />
              <div className="w-2.5 h-2.5 rounded-sm bg-blue-300" />
              <div className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
            </div> More
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-2 customized-scrollbar">
          {/* Mocking a 12-week grid (7 days per column) */}
          {Array.from({ length: 12 }).map((_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1.5 flex-shrink-0">
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                // Procedural generation of "activity" for visual flair
                const seed = (weekIdx * 7) + dayIdx;
                const activityLevel = Math.sin(seed * 0.5) * Math.cos(seed * 0.8);
                
                let color = 'bg-slate-50 border-slate-100';
                if (activityLevel > 0.7) color = 'bg-blue-600 border-blue-500/20';
                else if (activityLevel > 0.2) color = 'bg-blue-300 border-blue-400/20';
                else if (activityLevel > -0.3) color = 'bg-blue-100 border-blue-200/20';

                return (
                  <div 
                    key={dayIdx} 
                    className={`w-3.5 h-3.5 rounded-sm border transition-all hover:scale-110 cursor-help ${color}`}
                    title={`Activity level: ${Math.abs(Math.floor(activityLevel * 100))}%`}
                  />
                );
              })}
            </div>
          ))}
          <div className="flex flex-col justify-between py-1 text-[8px] font-mono font-bold text-slate-400 uppercase ml-2 select-none">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>
        </div>
      </div>

      {/* Shortcuts & Achievements split grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Navigation panel */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" /> Workstation Quick Launcher
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {quickLaunchers.map((ql) => {
              const Icon = ql.logo;
              const cleanAccent = ql.accent.replace('text-', 'text-slate-800').split(' ')[0] + ' bg-slate-50 border-slate-200';
              return (
                <button
                  key={ql.id}
                  onClick={() => onSectionChange(ql.id)}
                  className="glass-card p-4 rounded-xl text-left border border-slate-200 hover:border-blue-300 transition-all cursor-pointer flex gap-4 group justify-between items-center"
                >
                  <div className="flex gap-4.5 items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cleanAccent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-sans font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                        {ql.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 leading-normal line-clamp-1 font-medium">{ql.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Achievements badge list */}
        <div className="glass-panel p-5 rounded-2xl border-slate-200 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-orange-500" /> Professional Medals
              </h2>
              <span className="text-[10px] text-slate-400 font-mono font-bold">
                {userProgress.badges.length}/{ACHIEVEMENTS.length} Earned
              </span>
            </div>

            {/* Micro Badge Items */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 customized-scrollbar">
              {ACHIEVEMENTS.map((badge) => {
                const isEarned = userProgress.badges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`flex items-center gap-3.5 p-2 rounded-lg transition-all ${
                      isEarned ? 'bg-blue-50/50 border border-blue-100' : 'bg-slate-50 border border-transparent opacity-40 grayscale'
                    }`}
                  >
                    <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center ${
                      isEarned ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Award className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-sans text-xs font-bold ${isEarned ? 'text-slate-900' : 'text-slate-400'}`}>
                          {badge.name}
                        </span>
                        {isEarned && (
                          <span className="text-[9px] bg-blue-100 text-blue-600 font-mono px-1.5 py-0.5 rounded uppercase font-bold">Unlocked</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1 font-medium">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => onSectionChange('practice-hub')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20"
            >
              Log Session & Unlock XP <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
