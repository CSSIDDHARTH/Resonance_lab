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
      className="relative flex flex-col h-screen bg-white border-r border-slate-200 text-slate-800 z-30 flex-shrink-0 shadow-sm"
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Brand logo & name */}
      <div className="flex items-center px-4 py-6 border-b border-slate-100 overflow-hidden">
        <div 
          onClick={() => onSectionChange('landing')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col select-none"
            >
              <span className="font-display font-bold text-lg leading-tight tracking-tight text-slate-900">
                Resonance<span className="text-blue-600">Lab</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest font-bold">
                PRO AUDIO STATION
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
          className="p-4 mx-4 mt-4 rounded-xl bg-slate-50 border border-slate-200"
        >
          <div className="flex items-center justify-between font-sans">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-600" />
              <span className="text-xs text-slate-500 font-medium">{getLevelTier(userProgress.level)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/20" />
              <span className="text-xs font-mono font-bold text-slate-800">{userProgress.streak} Day Streak</span>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono mb-1">
              <span>LVL {userProgress.level}</span>
              <span>{userProgress.xp}/{(userProgress.level * 400)} XP</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
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
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-sans font-semibold transition-all group relative ${
                isActive
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
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
      <div className="p-4 border-t border-slate-100 flex flex-col gap-2 bg-white">
        <button
          onClick={() => onSectionChange('landing')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
            {!isCollapsed && <span className="font-sans text-xs font-medium">Return to Intro</span>}
          </div>
        </button>
      </div>

      {/* Collapse Action Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-20 -right-3.5 flex items-center justify-center w-7 h-7 rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-slate-400 hover:text-slate-600 transition-all z-40 transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
