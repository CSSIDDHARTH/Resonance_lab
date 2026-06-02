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
  const [activeEarTab, setActiveEarTab] = useState<'interval' | 'chord' | 'functional'>('interval');

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

  const FUNCTIONAL_DEGREES = [
    { id: '1', name: 'Tonic (1)', offset: 0 },
    { id: 'b2', name: 'Flat 2nd (b2)', offset: 1 },
    { id: '2', name: 'Major 2nd (2)', offset: 2 },
    { id: 'b3', name: 'Minor 3rd (b3)', offset: 3 },
    { id: '3', name: 'Major 3rd (3)', offset: 4 },
    { id: '4', name: 'Perfect 4th (4)', offset: 5 },
    { id: 'b5', name: 'Tritone (b5)', offset: 6 },
    { id: '5', name: 'Perfect 5th (5)', offset: 7 },
    { id: 'b6', name: 'Minor 6th (b6)', offset: 8 },
    { id: '6', name: 'Major 6th (6)', offset: 9 },
    { id: 'b7', name: 'Minor 7th (b7)', offset: 10 },
    { id: '7', name: 'Major 7th (7)', offset: 11 },
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

    } else if (activeEarTab === 'functional') {
      // Functional Ear Training: Hear a note relative to a key center
      const randomId = Math.floor(Math.random() * FUNCTIONAL_DEGREES.length);
      const targetDegree = FUNCTIONAL_DEGREES[randomId];

      const optionList = [...FUNCTIONAL_DEGREES]
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

      if (!optionList.find(o => o.id === targetDegree.id)) {
        optionList[Math.floor(Math.random() * 4)] = targetDegree;
      }

      const audioTrigger = () => {
        // Play a simple I-IV-V-I cadence to establish key
        const playChord = (offsets: number[], time: number) => {
          const freqs = offsets.map(o => midiToFreq(baseMidi + o));
          setTimeout(() => playSynthChord(freqs, 0.6, 0.4), time);
        };

        playChord([0, 4, 7], 0);      // I
        playChord([5, 9, 12], 600);   // IV
        playChord([7, 11, 14], 1200); // V
        playChord([0, 4, 7], 1800);   // I

        // Finally play the target note
        setTimeout(() => {
          playSynthNote(midiToFreq(baseMidi + targetDegree.offset), 0.5, 'sine', 0.7);
        }, 2600);
      };

      setCurrentQuestion({
        correctOptionId: targetDegree.id,
        options: optionList,
        audioTrigger
      });

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Music4 className="w-5 h-5 text-orange-500 animate-pulse" />
            <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Ear Training Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Train relative pitch and harmonic spelling. Identify programmatic intervals and random chords.</p>
        </div>

        {/* Action Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveEarTab('interval')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all ${
              activeEarTab === 'interval'
                ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Intervals
          </button>
          <button
            onClick={() => setActiveEarTab('functional')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all ${
              activeEarTab === 'functional'
                ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Functional
          </button>
          <button
            onClick={() => setActiveEarTab('chord')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all ${
              activeEarTab === 'chord'
                ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Chords
          </button>
        </div>
      </div>

      {/* Main Core split grid: Game dashboard and Scoreboards */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Answer and Trigger board left */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border-slate-200 space-y-8 min-h-[350px] flex flex-col justify-between shadow-sm">
            
            {/* Top Prompt and Trigger */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] text-orange-600 font-bold font-mono tracking-widest uppercase">ACTIVE EVALUATION</span>
                <h3 className="font-display font-bold text-xl text-slate-900 mt-1">
                  {activeEarTab === 'interval' 
                    ? 'Identify the interval.' 
                    : activeEarTab === 'functional'
                    ? 'Identify the note degree relative to the key.'
                    : 'Identify the strummed chord quality.'}
                </h3>
              </div>
              
              <button
                onClick={() => currentQuestion?.audioTrigger()}
                className="w-14 h-14 rounded-full bg-slate-50 hover:bg-white text-orange-600 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-slate-100 cursor-pointer shadow-lg"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>

            {/* Answer Options Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {currentQuestion?.options.map((opt) => {
                const isSelected = selectedAnswerId === opt.id;
                const isCorrect = opt.id === currentQuestion.correctOptionId;
                
                let cardStyle = 'border-slate-100 bg-white hover:border-orange-400 text-slate-700 shadow-sm';
                if (answerState !== 'unanswered') {
                  if (isCorrect) {
                     cardStyle = 'border-emerald-500 bg-emerald-50 text-emerald-700 pointer-events-none font-bold shadow-md';
                  } else if (isSelected) {
                     cardStyle = 'border-red-500 bg-red-50 text-red-700 pointer-events-none font-bold';
                  } else {
                     cardStyle = 'border-slate-50 bg-slate-50 text-slate-300 pointer-events-none opacity-40';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleVerifyAnswer(opt.id)}
                    className={`p-5 rounded-2xl border-2 text-left text-sm font-bold font-sans transition-all flex items-center justify-between cursor-pointer ${cardStyle}`}
                  >
                    <span>{opt.name}</span>
                    {answerState !== 'unanswered' && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    )}
                    {answerState !== 'unanswered' && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Transitional feedback bottom */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-4">
              <div className="text-xs font-bold font-mono uppercase tracking-tight">
                {answerState === 'correct' && (
                  <span className="text-emerald-600 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Elite Ear! +30 XP gained.</span>
                )}
                {answerState === 'incorrect' && (
                  <span className="text-red-500 flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Incorrect. Re-loop audio. +5 XP.</span>
                )}
                {answerState === 'unanswered' && (
                  <span className="text-slate-400">Awaiting pitch evaluation...</span>
                )}
              </div>

              {answerState !== 'unanswered' && (
                <button
                  onClick={generateNewQuestion}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-orange-500/20 transition-all"
                >
                  Next Challenge
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Scorecard panel right */}
        <div className="lg:col-span-4 glass-panel p-8 rounded-3xl border-slate-200 space-y-8 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="font-display font-bold text-slate-800 text-sm tracking-wide">PITCH SCORECARD</h3>
            <button
              onClick={handleResetScorecard}
              className="text-[10px] text-slate-400 hover:text-slate-900 items-center flex gap-1 cursor-pointer font-bold font-mono"
            >
              <RotateCcw className="w-3.5 h-3.5" /> RESET
            </button>
          </div>

          <div className="flex justify-around items-center py-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
            <div className="text-center">
              <span className="text-4xl font-mono font-bold text-slate-900 leading-none">{score}</span>
              <p className="text-[10px] text-emerald-600 font-bold uppercase mt-2">SUCCEEDED</p>
            </div>
            
            <div className="h-10 w-px bg-slate-200" />

            <div className="text-center">
              <span className="text-4xl font-mono font-bold text-slate-400 leading-none">{totalQuestions}</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">TOTAL</p>
            </div>

            <div className="h-10 w-px bg-slate-200" />

            <div className="text-center">
              <span className="text-4xl font-mono font-bold text-orange-600 leading-none">
                {totalQuestions > 0 ? `${Math.round((score / totalQuestions) * 100)}%` : '--'}
              </span>
              <p className="text-[10px] text-orange-400 font-bold uppercase mt-2">ACCURACY</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-dashed border-slate-200 bg-white/50 text-xs text-slate-500 space-y-3 leading-relaxed">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider"><Compass className="w-4 h-4 text-orange-500" /> Harmonic Discipline</h4>
            <p className="font-medium">
              Identify structural intervals. Understanding the distance between key tones speeds visual sight-reading and chord substitution spelling immensely on string and keys instruments.
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
