import { useState } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Gauge,
  Activity,
  Calendar,
  BookOpen,
  Music4,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Flame,
  User,
  LogOut,
  Sparkles
} from 'lucide-react';
import { AppSection, UserProgress } from '../types';

interface SidebarProps {
  currentSection: AppSection;
  onSectionChange: (section: AppSection) => void;
  userProgress: UserProgress;
}

export default function Sidebar({ currentSection, onSectionChange, userProgress }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'metronome', label: 'Smart Metronome', icon: Gauge },
    { id: 'rhythm-lab', label: 'Rhythm Lab', icon: Activity },
    { id: 'practice-hub', label: 'Practice Hub', icon: Calendar },
    { id: 'theory-toolkit', label: 'Theory Toolkit', icon: BookOpen },
    { id: 'ear-training', label: 'Ear Training', icon: Music4 },
    { id: 'producer-tools', label: 'Producer Utilities', icon: SlidersHorizontal },
  ] as const;

  // Level classification helper
  const getLevelTier = (level: number) => {
    if (level < 3) return 'Beginner';
    if (level < 6) return 'Intermediate';
    if (level < 10) return 'Advanced';
    return 'Maestro';
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? '5rem' : '18rem' }}
      className="relative flex flex-col h-screen bg-slate-950 border-r border-slate-800 text-slate-200 z-30 flex-shrink-0"
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Brand logo & name */}
      <div className="flex items-center px-4 py-6 border-b border-slate-900 overflow-hidden">
        <div 
          onClick={() => onSectionChange('landing')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-purple-500/30 blur opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col select-none"
            >
              <span className="font-display font-medium text-lg leading-tight tracking-wide text-white">
                Resonance<span className="text-purple-400">Lab</span>
              </span>
              <span className="text-[10px] text-purple-400/80 font-mono tracking-wider font-semibold">
                AUDIO WORKSTATION
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Stats Quick-Bar */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 mx-4 mt-4 rounded-xl bg-gradient-to-r from-purple-950/20 to-slate-900 border border-purple-900/20"
        >
          <div className="flex items-center justify-between font-sans">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">{getLevelTier(userProgress.level)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-mono font-bold text-amber-500">{userProgress.streak} Day Streak</span>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
              <span>LEVEL {userProgress.level}</span>
              <span>{userProgress.xp}/{(userProgress.level * 400)} XP</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (userProgress.xp / (userProgress.level * 400)) * 100)}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Menu scroll area */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentSection === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-sm font-sans font-medium transition-all group relative ${
                isActive
                  ? 'bg-gradient-to-r from-purple-950/40 to-slate-900 text-purple-300 border-l-2 border-purple-500 pl-3 shadow shadow-purple-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                isActive ? 'text-purple-400 font-bold' : 'text-slate-400 group-hover:text-purple-300'
              }`} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile section */}
      <div className="p-4 border-t border-slate-900 flex flex-col gap-2 bg-slate-950">
        <button
          onClick={() => onSectionChange('landing')}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400" />
            {!isCollapsed && <span className="font-sans text-xs">Return to Intro</span>}
          </div>
        </button>
      </div>

      {/* Collapse Action Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-20 -right-3.5 flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 shadow-md text-slate-400 hover:text-white transition-all z-40 transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
