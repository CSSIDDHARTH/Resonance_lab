import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Music4,
  Volume2,
  Sparkles,
  HelpCircle,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Compass
} from 'lucide-react';
import { midiToFreq, playSynthNote, playSynthChord } from '../lib/audio';

interface EarTrainingToolProps {
  onGainXp: (xp: number) => void;
}

interface EarGameQuestion {
  correctOptionId: string;
  options: { id: string; name: string }[];
  audioTrigger: () => void;
}

export default function EarTrainingTool({ onGainXp }: EarTrainingToolProps) {
  const [activeEarTab, setActiveEarTab] = useState<'interval' | 'chord'>('interval');

  // Multi-choice configuration matrices
  const STABLE_INTERVALS = [
    { id: 'm2', name: 'Minor 2nd (1 semitone)', offset: 1 },
    { id: 'M2', name: 'Major 2nd (2 semitones)', offset: 2 },
    { id: 'm3', name: 'Minor 3rd (3 semitones)', offset: 3 },
    { id: 'M3', name: 'Major 3rd (4 semitones)', offset: 4 },
    { id: 'P4', name: 'Perfect 4th (5 semitones)', offset: 5 },
    { id: 'd5', name: 'Tritone (6 semitones)', offset: 6 },
    { id: 'P5', name: 'Perfect 5th (7 semitones)', offset: 7 },
    { id: 'Oct', name: 'Octave (12 semitones)', offset: 12 },
  ];

  const STABLE_CHORDS = [
    { id: 'maj', name: 'Major Triad', formula: [0, 4, 7] },
    { id: 'min', name: 'Minor Triad', formula: [0, 3, 7] },
    { id: 'dim', name: 'Diminished Triad', formula: [0, 3, 6] },
    { id: 'dom7', name: 'Dominant 7th', formula: [0, 4, 7, 10] },
    { id: 'maj7', name: 'Major 7th', formula: [0, 4, 7, 11] }
  ];

  // ==========================================
  // GENERAL GAME STATES
  // ==========================================
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<EarGameQuestion | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered');

  useEffect(() => {
    // Generate the initial question automatically
    generateNewQuestion();
  }, [activeEarTab]);

  const generateNewQuestion = () => {
    setSelectedAnswerId(null);
    setAnswerState('unanswered');

    const baseMidi = Math.floor(Math.random() * 12) + 55; // Middle G3 to G4 range

    if (activeEarTab === 'interval') {
      // Pick a random interval spelling
      const randomId = Math.floor(Math.random() * STABLE_INTERVALS.length);
      const targetInterval = STABLE_INTERVALS[randomId];
      
      const optionList = [...STABLE_INTERVALS]
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

      // Ensure correct answer exists in options
      if (!optionList.find(o => o.id === targetInterval.id)) {
        optionList[Math.floor(Math.random() * 4)] = targetInterval;
      }

      const audioTrigger = () => {
        // play sequential notes
        playSynthNote(midiToFreq(baseMidi), 0.35, 'sine', 0.6);
        setTimeout(() => {
          playSynthNote(midiToFreq(baseMidi + targetInterval.offset), 0.35, 'sine', 0.6);
        }, 400);
      };

      setCurrentQuestion({
        correctOptionId: targetInterval.id,
        options: optionList,
        audioTrigger
      });

      // Automatically play the notes once so user doesn't have to click play
      setTimeout(audioTrigger, 300);

    } else {
      // Chord recognition game
      const randomIdx = Math.floor(Math.random() * STABLE_CHORDS.length);
      const targetChord = STABLE_CHORDS[randomIdx];

      const optionList = [...STABLE_CHORDS]
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

      if (!optionList.find(o => o.id === targetChord.id)) {
        optionList[Math.floor(Math.random() * 4)] = targetChord;
      }

      const audioTrigger = () => {
        const freqs = targetChord.formula.map(offset => midiToFreq(baseMidi + offset));
        playSynthChord(freqs, 0.8, 0.55);
      };

      setCurrentQuestion({
        correctOptionId: targetChord.id,
        options: optionList,
        audioTrigger
      });

      setTimeout(audioTrigger, 300);
    }
  };

  const handleVerifyAnswer = (optionId: string) => {
    if (answerState !== 'unanswered' || !currentQuestion) return;

    setSelectedAnswerId(optionId);
    setTotalQuestions(prev => prev + 1);

    if (optionId === currentQuestion.correctOptionId) {
      setAnswerState('correct');
      setScore(prev => prev + 1);
      
      // Joyous synthesizer audio feedback
      playSynthNote(1200, 0.12, 'sine', 0.5);
      setTimeout(() => playSynthNote(1500, 0.22, 'sine', 0.5), 100);

      onGainXp(30); // 30 XP for correct guess!
    } else {
      setAnswerState('incorrect');
      // Sad buzzer audio feedback
      playSynthNote(220, 0.35, 'beep', 0.5);
      onGainXp(5); // Consolation 5 XP
    }
  };

  const handleResetScorecard = () => {
    setScore(0);
    setTotalQuestions(0);
    generateNewQuestion();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 space-y-8 select-none"
    >
      {/* Station Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Music4 className="w-5 h-5 text-yellow-500 animate-pulse" />
            <h1 className="font-display font-semibold text-2xl text-white tracking-tight">Ear Training Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Train relative pitch and harmonic spelling. Identify programmatic intervals and random chords.</p>
        </div>

        {/* Action Toggle */}
        <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveEarTab('interval')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium font-sans cursor-pointer transition-all ${
              activeEarTab === 'interval'
                ? 'bg-yellow-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Interval Recognition
          </button>
          <button
            onClick={() => setActiveEarTab('chord')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium font-sans cursor-pointer transition-all ${
              activeEarTab === 'chord'
                ? 'bg-yellow-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chord Recognition
          </button>
        </div>
      </div>

      {/* Main Core split grid: Game dashboard and Scoreboards */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Answer and Trigger board left */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border-slate-800 space-y-8 min-h-[330px] flex flex-col justify-between">
            
            {/* Top Prompt and Trigger */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[9px] text-yellow-500 font-mono tracking-widest font-semibold uppercase">ACTIVE TEST TARGET</span>
                <h3 className="font-display font-bold text-lg text-white mt-1">
                  {activeEarTab === 'interval' ? 'Identify the interval.' : 'Identify the strummed chord quality.'}
                </h3>
              </div>
              
              <button
                onClick={() => currentQuestion?.audioTrigger()}
                className="w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-850 text-yellow-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-slate-800 cursor-pointer shadow-lg"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Answer Options Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {currentQuestion?.options.map((opt) => {
                const isSelected = selectedAnswerId === opt.id;
                const isCorrect = opt.id === currentQuestion.correctOptionId;
                
                let cardStyle = 'border-slate-800 bg-slate-900/35 hover:border-yellow-500/30 text-slate-300';
                if (answerState !== 'unanswered') {
                  if (isCorrect) {
                     cardStyle = 'border-emerald-500 bg-emerald-950/20 text-emerald-300 pointer-events-none font-bold shadow-md shadow-emerald-500/5';
                  } else if (isSelected) {
                     cardStyle = 'border-red-500 bg-red-950/20 text-red-400 pointer-events-none font-bold';
                  } else {
                     cardStyle = 'border-slate-900 bg-slate-950/20 text-slate-500 pointer-events-none opacity-40';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleVerifyAnswer(opt.id)}
                    className={`p-4 rounded-xl border text-left text-xs font-semibold font-sans transition-all flex items-center justify-between cursor-pointer ${cardStyle}`}
                  >
                    <span>{opt.name}</span>
                    {answerState !== 'unanswered' && isCorrect && (
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                    {answerState !== 'unanswered' && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Transitional feedback bottom */}
            <div className="flex justify-between items-center border-t border-slate-900/60 pt-4 mt-2">
              <div className="text-xs font-mono">
                {answerState === 'correct' && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Elite Ear! +30 XP gained.</span>
                )}
                {answerState === 'incorrect' && (
                  <span className="text-red-400 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Close! Try looping notes. +5 XP.</span>
                )}
                {answerState === 'unanswered' && (
                  <span className="text-slate-500">Awaiting audio evaluation...</span>
                )}
              </div>

              {answerState !== 'unanswered' && (
                <button
                  onClick={generateNewQuestion}
                  className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-550 text-slate-950 rounded-lg text-xs font-semibold cursor-pointer shadow transition-colors"
                >
                  Next Challenge
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Scorecard panel right */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="font-display font-medium text-slate-200 text-sm tracking-wide">PITCH SCORECARD</h3>
            <button
              onClick={handleResetScorecard}
              className="text-[10px] text-slate-500 hover:text-slate-200 items-center flex gap-1 cursor-pointer font-mono"
            >
              <RotateCcw className="w-3 h-3" /> CLEAR
            </button>
          </div>

          <div className="flex justify-around items-center py-4 bg-slate-950/60 rounded-xl border border-slate-900">
            <div className="text-center">
              <span className="text-3xl font-mono font-bold text-white leading-none">{score}</span>
              <p className="text-[9px] text-emerald-400 font-mono uppercase mt-1">SUCCESSES</p>
            </div>
            
            <div className="h-8 w-px bg-slate-800" />

            <div className="text-center">
              <span className="text-3xl font-mono font-bold text-slate-300 leading-none">{totalQuestions}</span>
              <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">QUESTIONS</p>
            </div>

            <div className="h-8 w-px bg-slate-800" />

            <div className="text-center">
              <span className="text-3xl font-mono font-bold text-yellow-500 leading-none">
                {totalQuestions > 0 ? `${Math.round((score / totalQuestions) * 100)}%` : '100%'}
              </span>
              <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">RATIO</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400 space-y-2 leading-relaxed">
            <h4 className="font-bold text-slate-300 flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-yellow-400" /> Relative Pitch Training Pro</h4>
            <p className="text-[11px]">
              Identify structural intervals. Understanding the distance between key tones speeds visual sight-reading and chord substitution spelling immensely on string and keys instruments.
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
