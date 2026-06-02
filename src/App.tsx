import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, Award } from 'lucide-react';

import { AppSection, UserProgress } from './types';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MetronomeTool from './components/MetronomeTool';
import RhythmLabTool from './components/RhythmLabTool';
import PracticeHubTool from './components/PracticeHubTool';
import TheoryToolkitTool from './components/TheoryToolkitTool';
import EarTrainingTool from './components/EarTrainingTool';
import ProducerTools from './components/ProducerTools';
import { getAudioContext, playSynthNote, triggerClickAtTime } from './lib/audio';

export default function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>('landing');
  
  // Collapsed states synchronized
  const [userProgress, setUserProgress] = useState<UserProgress>({
    xp: 60,
    level: 1,
    streak: 1,
    badges: ['first_session'],
  });

  const [totalPracticeDuration, setTotalPracticeDuration] = useState(40); // default simulated base 40m
  const [completedBlocksCount, setCompletedBlocksCount] = useState(0);

  // Level Up overlay modal state
  const [showLevelUpAlert, setShowLevelUpAlert] = useState(false);
  const [justLeveledTo, setJustLeveledTo] = useState(1);

  // Load user details from LocalStorage on mount
  useEffect(() => {
    const rawProgress = localStorage.getItem('resonance_user_progress');
    const rawTime = localStorage.getItem('resonance_total_practice_duration');
    const rawBlocks = localStorage.getItem('resonance_completed_blocks_count');

    if (rawProgress) {
      setUserProgress(JSON.parse(rawProgress));
    }
    if (rawTime) {
      setTotalPracticeDuration(Number(rawTime));
    }
    if (rawBlocks) {
      setCompletedBlocksCount(Number(rawBlocks));
    }
  }, []);

  // Save changes persistently helper
  const saveUserData = (updatedProgress: UserProgress) => {
    setUserProgress(updatedProgress);
    localStorage.setItem('resonance_user_progress', JSON.stringify(updatedProgress));
  };

  const gainXp = (amount: number) => {
    let nextXp = userProgress.xp + amount;
    let nextLevel = userProgress.level;
    let hasLeveledUp = false;

    // Formulas: Level 1 takes 400 XP, Level 2 takes 800 XP, etc.
    let targetCap = nextLevel * 400;
    while (nextXp >= targetCap) {
      nextXp -= targetCap;
      nextLevel += 1;
      targetCap = nextLevel * 400;
      hasLeveledUp = true;
    }

    const updated: UserProgress = {
      ...userProgress,
      xp: nextXp,
      level: nextLevel,
    };

    // Auto-unlock XP Badges
    const totalXpSum = (nextLevel - 1) * 400 + nextXp;
    if (totalXpSum >= 1000 && !updated.badges.includes('xp_1000')) {
      updated.badges.push('xp_1000');
    }

    saveUserData(updated);

    if (hasLeveledUp) {
      setJustLeveledTo(nextLevel);
      setShowLevelUpAlert(true);
      
      // Play a celebration level chime
      try {
        const ctx = getAudioContext();
        triggerClickAtTime(ctx, ctx.currentTime, 523.25, 'beep', 0.8); // C5
        setTimeout(() => triggerClickAtTime(ctx, ctx.currentTime, 659.25, 'beep', 0.8), 120); // E5
        setTimeout(() => triggerClickAtTime(ctx, ctx.currentTime, 783.99, 'beep', 0.8), 240); // G5
        setTimeout(() => triggerClickAtTime(ctx, ctx.currentTime, 1046.50, 'beep', 0.8), 360); // C6
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const earnBadge = (badgeId: string) => {
    if (userProgress.badges.includes(badgeId)) return;
    
    const updated: UserProgress = {
      ...userProgress,
      badges: [...userProgress.badges, badgeId],
    };
    saveUserData(updated);
  };

  const handleLogCompletedBlock = (minutes: number) => {
    const updatedTime = totalPracticeDuration + minutes;
    const updatedBlocks = completedBlocksCount + 1;

    setTotalPracticeDuration(updatedTime);
    setCompletedBlocksCount(updatedBlocks);

    localStorage.setItem('resonance_total_practice_duration', String(updatedTime));
    localStorage.setItem('resonance_completed_blocks_count', String(updatedBlocks));

    // Handle session count achievement
    if (updatedBlocks >= 1) {
      earnBadge('first_session');
    }
  };

  // Safe wrapper for Web Audio Context access on enter
  const handleLaunchStation = () => {
    try {
      getAudioContext();
    } catch (e) {
      console.warn('Audio driver block:', e);
    }
    setCurrentSection('dashboard');
  };

  return (
    <div className="bg-slate-950 text-slate-100 font-sans min-h-screen relative flex overflow-hidden">
      
      {/* Immersive Landing Page Full Widescreen Overlay */}
      {currentSection === 'landing' && (
        <LandingPage onEnter={handleLaunchStation} />
      )}

      {/* Main Software Station Dual Columns */}
      {currentSection !== 'landing' && (
        <>
          <Sidebar
            currentSection={currentSection}
            onSectionChange={setCurrentSection}
            userProgress={userProgress}
          />
          
          <main className="flex-1 overflow-y-auto relative bg-slate-950">
            {/* Visual ambient circles */}
            <div className="absolute top-0 right-1/4 w-[35rem] h-[35rem] rounded-full bg-gradient-to-tr from-purple-900/10 to-transparent blur-[120px] pointer-events-none -z-10" />

            <AnimatePresence mode="wait">
              {currentSection === 'dashboard' && (
                <Dashboard
                  onSectionChange={setCurrentSection}
                  userProgress={userProgress}
                  totalPracticeDuration={totalPracticeDuration}
                  completedBlocksCount={completedBlocksCount}
                />
              )}

              {currentSection === 'metronome' && (
                <MetronomeTool onGainXp={gainXp} />
              )}

              {currentSection === 'rhythm-lab' && (
                <RhythmLabTool onEarnBadge={earnBadge} onGainXp={gainXp} />
              )}

              {currentSection === 'practice-hub' && (
                <PracticeHubTool
                  onGainXp={gainXp}
                  onLogCompletedBlock={handleLogCompletedBlock}
                />
              )}

              {currentSection === 'theory-toolkit' && (
                <TheoryToolkitTool onGainXp={gainXp} />
              )}

              {currentSection === 'ear-training' && (
                <EarTrainingTool onGainXp={gainXp} />
              )}

              {currentSection === 'producer-tools' && (
                <ProducerTools onGainXp={gainXp} />
              )}
            </AnimatePresence>
          </main>
        </>
      )}

      {/* Real-time Level Up Modal Overlay Popup */}
      <AnimatePresence>
        {showLevelUpAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 flex items-center justify-center p-6 z-50 backdrop-blur-md select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="glass-panel p-8 rounded-2xl bg-slate-950 border-purple-500/40 w-full max-w-sm text-center relative overflow-hidden"
            >
              {/* Confetti beam */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />
              
              <div className="w-16 h-16 rounded-full bg-purple-500/15 flex items-center justify-center text-purple-400 mx-auto mb-4 border border-purple-500/20">
                <Award className="w-8 h-8 text-amber-400 animate-bounce" />
              </div>

              <h3 className="font-display font-bold text-xl text-white">RESONANT ELEVATION!</h3>
              <p className="text-xs text-slate-400 mt-2">Outstanding execution! You have achieved Level {justLeveledTo}.</p>
              
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg font-mono text-[10px] text-purple-300 uppercase font-semibold mt-4">
                Unlock higher ranking thresholds
              </div>

              <button
                onClick={() => setShowLevelUpAlert(false)}
                className="w-full mt-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-semibold text-white rounded-lg shadow-md cursor-pointer"
              >
                Continue Training
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
