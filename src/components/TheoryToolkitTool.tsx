import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Volume2,
  Sparkles,
  Music,
  ArrowRight,
  HelpCircle,
  Play
} from 'lucide-react';
import {
  ROOT_MIDIS,
  NOTE_NAMES,
  SCALE_FORMULAS,
  CHORD_FORMULAS,
  CIRCLE_OF_FIFTHS,
  midiToFreq,
  playSynthNote,
  playSynthChord
} from '../lib/audio';

interface TheoryToolkitToolProps {
  onGainXp: (xp: number) => void;
}

export default function TheoryToolkitTool({ onGainXp }: TheoryToolkitToolProps) {
  const [activeToolkitTab, setActiveToolkitTab] = useState<'fifths' | 'scales' | 'chords' | 'progressions' | 'midi'>('fifths');

  // ==========================================
  // MODULE: WEB MIDI API INTEGRATION
  // ==========================================
  const [midiAccess, setMidiAccess] = useState<any>(null);
  const [activeMidiNotes, setActiveMidiNotes] = useState<Set<number>>(new Set());
  const [midiStatus, setMidiStatus] = useState<'unsupported' | 'checking' | 'connected' | 'denied'>('checking');

  useEffect(() => {
    if (activeToolkitTab === 'midi' && !midiAccess) {
      if ('requestMIDIAccess' in navigator) {
        (navigator as any).requestMIDIAccess().then(
          (access: any) => {
            setMidiAccess(access);
            setMidiStatus('connected');
            
            // Listen for device changes
            access.onstatechange = (e: any) => {
              console.log('MIDI device state changed:', e.port.name, e.port.state);
            };

            // Initial bind to all inputs
            access.inputs.forEach((input: any) => {
              input.onmidimessage = handleMidiMessage;
            });
          },
          () => setMidiStatus('denied')
        );
      } else {
        setMidiStatus('unsupported');
      }
    }
  }, [activeToolkitTab, midiAccess]);

  const handleMidiMessage = (msg: any) => {
    const [command, note, velocity] = msg.data;
    
    // Command 144: Note On, 128: Note Off
    if (command === 144 && velocity > 0) {
      setActiveMidiNotes(prev => new Set(prev).add(note));
      onGainXp(1); // Small XP gain for playing hardware
    } else if (command === 128 || (command === 144 && velocity === 0)) {
      setActiveMidiNotes(prev => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    }
  };

  const getMidiChordName = () => {
    if (activeMidiNotes.size === 0) return 'No Input';
    const notes = Array.from(activeMidiNotes).sort((a: number, b: number) => a - b);
    const semitones = notes.map((n: number) => n % 12);
    const root = semitones[0];
    const relative = semitones.map((s: number) => (s - root + 12) % 12).sort((a: number, b: number) => a - b);
    
    // Basic chord detection
    const relStr = relative.join(',');
    if (relStr === '0,4,7') return `${NOTE_NAMES[root]} Major`;
    if (relStr === '0,3,7') return `${NOTE_NAMES[root]} Minor`;
    if (relStr === '0,4,7,11') return `${NOTE_NAMES[root]} Maj7`;
    if (relStr === '0,4,7,10') return `${NOTE_NAMES[root]} Dom7`;
    if (relStr === '0,3,7,10') return `${NOTE_NAMES[root]} Min7`;
    
    return `Complex ${NOTE_NAMES[root]} Voicing`;
  };

  // ==========================================
  // FIFTHS DIAL STATES
  // ==========================================
  const [selectedKeyGroup, setSelectedKeyGroup] = useState<any>(CIRCLE_OF_FIFTHS[0]);

  const handlePlayFifthsChord = (rootName: string, isMinor: boolean) => {
    const rootRaw = isMinor ? rootName.replace('m', '') : rootName;
    const cleanRoot = rootRaw === 'Ab' ? 'G#' : rootRaw === 'Bb' ? 'A#' : rootRaw === 'Eb' ? 'D#' : rootRaw === 'Db' ? 'C#' : rootRaw;
    
    const rootMidi = ROOT_MIDIS[cleanRoot] ?? 60;
    const intervals = isMinor ? [0, 3, 7] : [0, 4, 7]; // Triads
    const frequencies = intervals.map(int => midiToFreq(rootMidi + int));

    playSynthChord(frequencies, 0.8, 0.6);
    onGainXp(2);
  };

  // Get chord names for the degrees in a Major Key
  const getMajorKeyDegrees = (keyName: string) => {
    // Simplify flats for dictionary mapping
    const lookup = keyName === 'Ab' ? 'G#' : keyName === 'Bb' ? 'A#' : keyName === 'Eb' ? 'D#' : keyName === 'Db' ? 'C#' : keyName === 'F#' ? 'F#' : keyName;
    const rootIdx = NOTE_NAMES.indexOf(lookup);
    if (rootIdx === -1) return [];

    const degrees = [
      { Roman: 'I', type: 'Major', offset: 0, ending: '' },
      { Roman: 'ii', type: 'Minor', offset: 2, ending: 'm' },
      { Roman: 'iii', type: 'Minor', offset: 4, ending: 'm' },
      { Roman: 'IV', type: 'Major', offset: 5, ending: '' },
      { Roman: 'V', type: 'Major', offset: 7, ending: '' },
      { Roman: 'vi', type: 'Minor', offset: 9, ending: 'm' },
      { Roman: 'viiº', type: 'Diminished', offset: 11, ending: 'dim' },
    ];

    return degrees.map(deg => {
      const midiVal = (rootIdx + deg.offset) % 12;
      const rootNoteName = NOTE_NAMES[midiVal];
      return {
        degree: deg.Roman,
        chordName: rootNoteName + deg.ending,
        type: deg.type,
        rootName: rootNoteName,
        isMinor: deg.type === 'Minor' || deg.type === 'Diminished'
      };
    });
  };

  // ==========================================
  // SCALE GENERATOR STATES
  // ==========================================
  const [scaleRoot, setScaleRoot] = useState('C');
  const [scaleType, setScaleType] = useState('Major');
  const [activeScalePlayingIndex, setActiveScalePlayingIndex] = useState(-1);

  const getScaleNotes = (root: string, type: string) => {
    const rootMidi = ROOT_MIDIS[root] ?? 60;
    const formula = SCALE_FORMULAS[type] ?? SCALE_FORMULAS['Major'];

    return formula.map(interval => {
      const midi = rootMidi + interval;
      const noteName = NOTE_NAMES[midi % 12];
      return { noteName, midi };
    });
  };

  const handlePlayScale = () => {
    const notes = getScaleNotes(scaleRoot, scaleType);
    onGainXp(12);

    notes.forEach((note, idx) => {
      const timeOffset = idx * 280; // arpeggiated speed index
      setTimeout(() => {
        setActiveScalePlayingIndex(idx);
        playSynthNote(midiToFreq(note.midi), 0.25, 'sine', 0.55);
        
        // Remove highlighting on last note
        if (idx === notes.length - 1) {
          setTimeout(() => setActiveScalePlayingIndex(-1), 300);
        }
      }, timeOffset);
    });
  };

  // ==========================================
  // CHORD GENERATOR STATES
  // ==========================================
  const [chordRoot, setChordRoot] = useState('C');
  const [chordType, setChordType] = useState('Major triad');

  const getChordNotes = (root: string, type: string) => {
    const rootMidi = ROOT_MIDIS[root] ?? 60;
    const formulaVal = CHORD_FORMULAS[type] ?? CHORD_FORMULAS['Major triad'];

    return formulaVal.intervals.map(interval => {
      const midi = rootMidi + interval;
      const noteName = NOTE_NAMES[midi % 12];
      return { noteName, midi };
    });
  };

  const handlePlayChordText = () => {
    const notes = getChordNotes(chordRoot, chordType);
    const frequencies = notes.map(n => midiToFreq(n.midi));
    playSynthChord(frequencies, 0.9, 0.6);
    onGainXp(8);
  };

  // ==========================================
  // PROGRESSION CHIEFS STATES
  // ==========================================
  const BORROWED_CHORDS = [
    { name: 'Flat III (bIII)', degree: 'bIII', offset: 3, type: 'Major', desc: 'Borrowed from Parallel Minor. Rock/Epic sound.' },
    { name: 'Flat VI (bVI)', degree: 'bVI', offset: 8, type: 'Major', desc: 'Borrowed from Parallel Minor. Dramatic resolution.' },
    { name: 'Flat VII (bVII)', degree: 'bVII', offset: 10, type: 'Major', desc: 'Borrowed from Mixolydian. Classic Rock sound.' },
    { name: 'Minor IV (iv)', degree: 'iv', offset: 5, type: 'Minor', desc: 'Borrowed from Parallel Minor. Melancholy/Pop resolution.' }
  ];

  const handlePlayBorrowedChord = (offset: number, isMinor: boolean) => {
    const rootMidi = ROOT_MIDIS[scaleRoot] ?? 60;
    const intervals = isMinor ? [0, 3, 7] : [0, 4, 7];
    const freqs = intervals.map(i => midiToFreq(rootMidi + offset + i));
    playSynthChord(freqs, 0.8, 0.55);
    onGainXp(10);
  };

  const EPIC_PROGRESSIONS = [
    {
      name: 'Epic Pop Anchor',
      roman: 'I - V - vi - IV',
      desc: 'Foundational framework used in hundreds of chart-topping songs.',
      intervals: [0, 7, 9, 5],
      styles: ['Major', 'Major', 'Minor', 'Major']
    },
    {
      name: 'Jazz Cadence Essential',
      roman: 'ii - V - I',
      desc: 'The fundamental progression forming the core of standard jazz improvisation.',
      intervals: [2, 7, 0],
      styles: ['Minor', 'Major', 'Major']
    },
    {
      name: 'Emotional Ballad Cycle',
      roman: 'vi - IV - I - V',
      desc: 'A powerful, melancholy, storytelling loop with deep pull resolutions.',
      intervals: [9, 5, 0, 7],
      styles: ['Minor', 'Major', 'Major', 'Major']
    }
  ];

  const handlePlayProgressionLine = (prog: typeof EPIC_PROGRESSIONS[0]) => {
    const rootMidi = ROOT_MIDIS[scaleRoot] ?? 60;
    onGainXp(15);

    prog.intervals.forEach((step, idx) => {
      const chordTimeDelay = idx * 950; // trigger chords one by one nicely
      setTimeout(() => {
        const isMinor = prog.styles[idx] === 'Minor';
        const intervals = isMinor ? [0, 3, 7] : [0, 4, 7];
        const stepRootMidi = rootMidi + step;
        const freqs = intervals.map(i => midiToFreq(stepRootMidi + i));
        
        playSynthChord(freqs, 0.8, 0.55);
      }, chordTimeDelay);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 space-y-8 select-none"
    >
      {/* Station Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-pink-600" />
            <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Music Theory Toolkit</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Visualize sonic architectures. Interrogate coordinates on the Circle of Fifths, scales, and chord spelling.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
          {[
            { id: 'fifths', name: 'Circle of Fifths' },
            { id: 'scales', name: 'Scale Generator' },
            { id: 'chords', name: 'Chord Speller' },
            { id: 'progressions', name: 'Progressions' },
            { id: 'midi', name: 'MIDI Link' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveToolkitTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all whitespace-nowrap ${
                activeToolkitTab === t.id
                  ? 'bg-white text-pink-600 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* MIDI LINK ZONE */}
        {activeToolkitTab === 'midi' && (
          <motion.div
            key="midi"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="glass-panel p-10 rounded-[2.5rem] border-slate-200 text-center space-y-6 shadow-sm">
              <div className="flex justify-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                  midiStatus === 'connected' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-slate-100 bg-slate-50 text-slate-400'
                }`}>
                  <Music className="w-10 h-10" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-bold text-2xl text-slate-900">Hardware MIDI Analysis</h3>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  {midiStatus === 'connected' 
                    ? 'Engine online. Play notes on your MIDI controller to see live theoretical analysis.' 
                    : midiStatus === 'checking' 
                    ? 'Initializing MIDI driver...' 
                    : 'MIDI hardware not detected or browser support missing.'}
                </p>
              </div>

              {midiStatus === 'connected' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  {/* Note visualization */}
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-inner">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-4">ACTIVE VOICES</span>
                    <div className="flex flex-wrap justify-center gap-3">
                      {Array.from(activeMidiNotes).map((n: number) => (
                        <div key={n} className="w-14 h-14 rounded-2xl bg-white border-2 border-pink-500 text-pink-600 flex items-center justify-center font-mono font-bold shadow-md">
                          {NOTE_NAMES[n % 12]}
                        </div>
                      ))}
                      {activeMidiNotes.size === 0 && (
                        <span className="text-xs text-slate-300 italic">Waiting for note-on commands...</span>
                      )}
                    </div>
                  </div>

                  {/* Chord Detection */}
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-inner flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-4">HARMONIC IDENTIFICATION</span>
                    <div className="space-y-1">
                      <h4 className="text-3xl font-display font-bold text-slate-900 tracking-tighter">
                        {getMidiChordName()}
                      </h4>
                      <p className="text-[10px] text-pink-600 font-bold font-mono uppercase tracking-widest">Live Engine Stream</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-blue-900">Pro Tip: MIDI Integration</h4>
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  Using hardware MIDI controllers eliminates software-latency and provides a tactile connection to the theory workstation. Practice your inversions and see the engine identify them in real-time.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CIRCLE OF FIFTHS TAB */}
        {activeToolkitTab === 'fifths' && (
          <motion.div
            key="fifths"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid lg:grid-cols-12 gap-8 items-center"
          >
            {/* SVG Interaction Circle Dial Left */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center min-h-[340px]">
              <div className="relative w-72 h-72 md:w-80 md:h-80 select-none bg-white rounded-full p-4 shadow-xl border border-slate-100">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  {/* Outer circle background and border */}
                  <circle cx="100" cy="100" r="95" fill="none" stroke="#F1F5F9" strokeWidth="2" />
                  
                  {/* Relative division divider rings */}
                  <circle cx="100" cy="100" r="66" fill="none" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Render the 12 key regions */}
                  {CIRCLE_OF_FIFTHS.map((keyGroup, idx) => {
                    const angle = (360 / 12) * idx;
                    const rOuter = 81;
                    const rInner = 51;

                    const xOuter = 100 + rOuter * Math.cos((angle * Math.PI) / 180);
                    const yOuter = 100 + rOuter * Math.sin((angle * Math.PI) / 180);

                    const xInner = 100 + rInner * Math.cos((angle * Math.PI) / 180);
                    const yInner = 100 + rInner * Math.sin((angle * Math.PI) / 180);

                    const isSelected = selectedKeyGroup.id === keyGroup.id;

                    return (
                      <g key={keyGroup.id} className="cursor-pointer">
                        {/* Selected overlay ring slice background mock */}
                        {isSelected && (
                          <circle
                            cx="100" cy="100" r="82"
                            fill="none" stroke="rgba(219,39,119,0.05)" strokeWidth="30"
                          />
                        )}

                        {/* Outer Major key node clickable */}
                        <g 
                          onClick={() => {
                            setSelectedKeyGroup(keyGroup);
                            handlePlayFifthsChord(keyGroup.major, false);
                          }}
                        >
                          <circle
                            cx={xOuter}
                            cy={yOuter}
                            r={isSelected ? 13 : 11}
                            fill={isSelected ? '#DB2777' : '#FFFFFF'}
                            stroke={isSelected ? '#F472B6' : '#E2E8F0'}
                            strokeWidth="1.5"
                            className="transition-all"
                          />
                          <text
                            x={xOuter}
                            y={yOuter + 3}
                            fill={isSelected ? '#fff' : '#475569'}
                            fontSize="8"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="monospace"
                            transform={`rotate(90, ${xOuter}, ${yOuter})`}
                          >
                            {keyGroup.major}
                          </text>
                        </g>

                        {/* Inner relative minor node clickable */}
                        <g
                          onClick={() => {
                            setSelectedKeyGroup(keyGroup);
                            handlePlayFifthsChord(keyGroup.minor, true);
                          }}
                        >
                          <circle
                            cx={xInner}
                            cy={yInner}
                            r={isSelected ? 12 : 10}
                            fill={isSelected ? '#9333EA' : '#F8FAFC'}
                            stroke={isSelected ? '#C084FC' : '#E2E8F0'}
                            strokeWidth="1.2"
                            className="transition-all"
                          />
                          <text
                            x={xInner}
                            y={yInner + 2.5}
                            fill={isSelected ? '#fff' : '#64748B'}
                            fontSize="6.5"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="monospace"
                            transform={`rotate(90, ${xInner}, ${yInner})`}
                          >
                            {keyGroup.minor}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>
                
                {/* Center dial instructions */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
                  <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest leading-none">FIFTHS DECK</span>
                  <span className="text-2xl font-display font-bold text-slate-900 mt-1 leading-none">{selectedKeyGroup.major} Major</span>
                  <span className="text-[10px] text-pink-600 font-bold font-mono mt-1 tracking-widest">{selectedKeyGroup.sharpsFlats}</span>
                </div>
              </div>
            </div>

            {/* Scale degrees layout card right */}
            <div className="lg:col-span-6 glass-panel p-8 rounded-3xl border-slate-200 space-y-6 shadow-sm">
              <div>
                <span className="text-[10px] text-pink-600 font-bold font-mono tracking-widest font-semibold uppercase">{selectedKeyGroup.degreeName} Coordinates</span>
                <h3 className="font-display font-bold text-xl text-slate-900 mt-1">Diatonic Chord Degrees inside {selectedKeyGroup.major} Major Key</h3>
                <p className="text-xs text-slate-500 leading-normal mt-2 font-medium">
                  Click any degree badge below to hear the programmatic chord voicing synthesized instantly in real-time.
                </p>
              </div>

              {/* Degrees map */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
                {getMajorKeyDegrees(selectedKeyGroup.major).map((deg, i) => (
                  <button
                    key={i}
                    onClick={() => handlePlayFifthsChord(deg.rootName, deg.isMinor)}
                    className="p-4 bg-slate-50 border border-slate-100 hover:border-pink-300 transition-all rounded-2xl text-left cursor-pointer group flex flex-col justify-between shadow-sm"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] font-bold font-mono text-slate-400 group-hover:text-pink-600 uppercase tracking-wider">{deg.degree} Degree</span>
                      <Volume2 className="w-3.5 h-3.5 text-slate-300 group-hover:text-pink-600 transition-colors" />
                    </div>
                    <div className="space-y-0.5 mt-3">
                      <h4 className="font-sans font-bold text-slate-800 text-sm">{deg.chordName}</h4>
                      <span className="text-[9px] text-slate-400 font-bold font-mono italic uppercase tracking-tighter">{deg.type}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* SCALE GENERATOR TAB */}
        {activeToolkitTab === 'scales' && (
          <motion.div
            key="scales"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid lg:grid-cols-12 gap-8"
          >
            {/* Inputs left */}
            <div className="lg:col-span-5 glass-panel p-8 rounded-3xl border-slate-200 space-y-6 shadow-sm">
              <h3 className="font-display font-bold text-slate-900 text-sm tracking-wide uppercase">SCALE EXPLORER SPELLER</h3>
              
              <div className="space-y-6">
                {/* Key selection */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">ROOT KEYBOARD</span>
                  <div className="grid grid-cols-6 gap-2 mt-2.5">
                    {Object.keys(ROOT_MIDIS).map((root) => (
                      <button
                        key={root}
                        onClick={() => setScaleRoot(root)}
                        className={`py-1.5 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer shadow-sm ${
                          scaleRoot === root
                            ? 'bg-pink-600 text-white border-pink-400'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                        }`}
                      >
                        {root}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode type selection */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">PATH MODALITY</span>
                  <div className="grid grid-cols-2 gap-2 mt-2.5 max-h-[220px] overflow-y-auto pr-1 customized-scrollbar">
                    {Object.keys(SCALE_FORMULAS).map((type) => (
                      <button
                        key={type}
                        onClick={() => setScaleType(type)}
                        className={`py-2 px-3 text-left rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer line-clamp-1 shadow-sm ${
                          scaleType === type
                            ? 'bg-pink-50 border-pink-300 text-pink-700'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Spellings output right */}
            <div className="lg:col-span-7 glass-panel p-8 rounded-3xl border-slate-200 flex flex-col justify-between min-h-[350px] shadow-sm">
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-2xl tracking-tight">{scaleRoot} {scaleType}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Modal Interval Mapping</p>
                  </div>
                  
                  <button
                    onClick={handlePlayScale}
                    className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 shadow-lg shadow-pink-500/20 transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" /> Arpeggiate Scale
                  </button>
                </div>

                {/* Notes horizontal array spelling */}
                <div className="flex gap-4 flex-wrap">
                  {getScaleNotes(scaleRoot, scaleType).map((node, i) => {
                    const isFired = activeScalePlayingIndex === i;
                    return (
                      <motion.div
                        key={i}
                        animate={isFired ? { scale: 1.1, borderColor: '#ec4899', backgroundColor: '#FFF5F7' } : { scale: 1 }}
                        className={`w-16 h-16 rounded-2xl border-2 flex flex-col justify-center items-center shadow-sm transition-all ${
                          isFired ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-100 bg-white text-slate-700'
                        }`}
                      >
                        <span className="text-base font-bold font-mono leading-none">{node.noteName}</span>
                        <span className="text-[9px] text-slate-400 font-bold font-mono mt-1 tracking-tighter uppercase">deg {i + 1}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner mt-8">
                <p className="text-[10px] text-slate-400 font-bold leading-normal italic">
                  "Scale spelling uses high-precision MIDI coordinate mapping. These modal paths represent specific emotional characters used to navigate modern harmonic landscapes."
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CHORD SPELLER TAB */}
        {activeToolkitTab === 'chords' && (
          <motion.div
            key="chords"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid lg:grid-cols-12 gap-8"
          >
            {/* Inputs left */}
            <div className="lg:col-span-5 glass-panel p-8 rounded-3xl border-slate-200 space-y-6 shadow-sm">
              <h3 className="font-display font-bold text-slate-900 text-sm tracking-wide uppercase">CHORD SPELlER VOICINGS</h3>

              <div className="space-y-6">
                {/* Key selection */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">ROOT ANCHOR</span>
                  <div className="grid grid-cols-6 gap-2 mt-2.5">
                    {Object.keys(ROOT_MIDIS).map((root) => (
                      <button
                        key={root}
                        onClick={() => setChordRoot(root)}
                        className={`py-1.5 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer shadow-sm ${
                          chordRoot === root
                            ? 'bg-pink-600 text-white border-pink-400'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                        }`}
                      >
                        {root}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chord types list */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">SELECT TENSION LEVEL</span>
                  <div className="grid grid-cols-1 gap-1.5 mt-2.5 max-h-[220px] overflow-y-auto pr-1 customized-scrollbar">
                    {Object.keys(CHORD_FORMULAS).map((type) => (
                      <button
                        key={type}
                        onClick={() => setChordType(type)}
                        className={`py-2.5 px-4 text-left rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer flex justify-between items-center shadow-sm ${
                          chordType === type
                            ? 'bg-pink-50 border-pink-300 text-pink-700'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span>{type}</span>
                        <span className="text-[10px] text-pink-400 font-bold uppercase">{CHORD_FORMULAS[type].name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Spelling output right */}
            <div className="lg:col-span-7 glass-panel p-8 rounded-3xl border-slate-200 flex flex-col justify-between min-h-[350px] shadow-sm">
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-2xl tracking-tight">{chordRoot} {chordType}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Multi-Channel Voice Speller</p>
                  </div>

                  <button
                    onClick={handlePlayChordText}
                    className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 shadow-lg shadow-pink-500/20 transition-all"
                  >
                    <Volume2 className="w-4 h-4" /> Voice Chord
                  </button>
                </div>

                {/* Chord notes array spelling */}
                <div className="flex gap-4.5 flex-wrap">
                  {getChordNotes(chordRoot, chordType).map((node, i) => (
                    <div
                      key={i}
                      className="w-16 h-16 rounded-2xl border-2 border-slate-100 bg-white flex flex-col justify-center items-center text-slate-700 shadow-sm"
                    >
                      <span className="text-base font-bold font-mono leading-none">{node.noteName}</span>
                      <span className="text-[9px] text-slate-400 font-bold font-mono mt-1 uppercase tracking-tighter">midi {node.midi}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner mt-8">
                <p className="text-[10px] text-slate-400 font-bold leading-normal italic">
                  "Chord Speller triggers staggered multi-oscillator synthesis. By offsetting voice trigger times by ~15ms, we simulate the manual strum characteristic of organic instrumentation."
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* PROGRESSIONS GENERATOR TAB */}
        {activeToolkitTab === 'progressions' && (
          <motion.div
            key="progressions"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid lg:grid-cols-12 gap-8"
          >
            {/* Guide left */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-panel p-8 rounded-3xl border-slate-200 space-y-5 shadow-sm">
                <h3 className="font-display font-bold text-slate-800 text-sm tracking-wide uppercase">SONIC CADENCES</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  A chord progression represents a series of key changes forming the primary skeleton of tracks. Select a cadence to hear the sequential cycle built around the active key.
                </p>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 font-bold font-sans block uppercase tracking-widest">ACTIVE TARGET KEY</span>
                  <select
                    value={scaleRoot}
                    onChange={(e) => setScaleRoot(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 mt-2 font-bold focus:outline-none focus:border-pink-500 shadow-sm"
                  >
                    {Object.keys(ROOT_MIDIS).map((root) => (
                      <option key={root} value={root}>{root} Major</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Borrowed Chords Palette */}
              <div className="glass-panel p-8 rounded-3xl border-slate-200 space-y-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Sparkles className="w-4 h-4 text-pink-600" />
                  <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wide">Borrowed Palette</h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold italic">"Modal mixture chords from parallel keys. Perfect for breaking the diatonic rules."</p>
                
                <div className="grid grid-cols-2 gap-3.5">
                  {BORROWED_CHORDS.map((chord) => (
                    <button
                      key={chord.degree}
                      onClick={() => handlePlayBorrowedChord(chord.offset, chord.type === 'Minor')}
                      className="p-4 bg-white border border-slate-100 hover:border-pink-400 rounded-2xl text-left transition-all group cursor-pointer shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-sm font-bold text-pink-600">{chord.degree}</span>
                        <Volume2 className="w-3.5 h-3.5 text-slate-200 group-hover:text-pink-600 transition-colors" />
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1.5 line-clamp-2 leading-tight font-bold uppercase tracking-tighter">{chord.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List entries right */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-display font-bold text-slate-900 uppercase tracking-widest">CURATED PATHS</h3>
              {EPIC_PROGRESSIONS.map((prog, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-3xl border border-slate-50 bg-white flex items-center justify-between gap-6 shadow-sm hover:border-pink-200 transition-all group"
                >
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-pink-600 transition-colors">{prog.name}</h4>
                    <span className="text-xs text-pink-600 font-mono font-bold block bg-pink-50 px-2 py-0.5 rounded-md w-fit mt-1">{prog.roman}</span>
                    <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">{prog.desc}</p>
                  </div>

                  <button
                    onClick={() => handlePlayProgressionLine(prog)}
                    className="p-4 bg-slate-50 hover:bg-pink-600 border border-slate-100 hover:border-pink-500 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer flex-shrink-0 shadow-sm"
                  >
                    <Play className="w-6 h-6 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
