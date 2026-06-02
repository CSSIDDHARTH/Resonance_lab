import { useState } from 'react';
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
  const [activeToolkitTab, setActiveToolkitTab] = useState<'fifths' | 'scales' | 'chords' | 'progressions'>('fifths');

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-pink-400" />
            <h1 className="font-display font-semibold text-2xl text-white tracking-tight">Music Theory Toolkit</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Visualize sonic architectures. Interrogate coordinates on the Circle of Fifths, scales, and chord spelling.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800">
          {[
            { id: 'fifths', name: 'Circle of Fifths' },
            { id: 'scales', name: 'Scale Generator' },
            { id: 'chords', name: 'Chord Speller' },
            { id: 'progressions', name: 'Progressions' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveToolkitTab(t.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium font-sans cursor-pointer transition-all ${
                activeToolkitTab === t.id
                  ? 'bg-pink-600 text-white shadow shadow-pink-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        
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
              <div className="relative w-72 h-72 md:w-80 md:h-80 select-none">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  {/* Outer circle background and border */}
                  <circle cx="100" cy="100" r="95" fill="rgba(255,255,255,0.01)" stroke="#1e293b" strokeWidth="2" />
                  
                  {/* Relative division divider rings */}
                  <circle cx="100" cy="100" r="66" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

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
                            fill="none" stroke="rgba(236,72,153,0.15)" strokeWidth="30"
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
                            r="11"
                            fill={isSelected ? '#ec4899' : '#0f172a'}
                            stroke={isSelected ? '#f472b6' : '#334155'}
                            strokeWidth="1.5"
                          />
                          <text
                            x={xOuter}
                            y={yOuter + 3}
                            fill={isSelected ? '#fff' : '#cbd5e1'}
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
                            r="10"
                            fill={isSelected ? '#a855f7' : '#0f172a'}
                            stroke={isSelected ? '#c084fc' : '#1e293b'}
                            strokeWidth="1.2"
                          />
                          <text
                            x={xInner}
                            y={yInner + 3}
                            fill={isSelected ? '#fff' : '#94a3b8'}
                            fontSize="6.5"
                            fontWeight="medium"
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
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none">FIFTHS KEYBOARD</span>
                  <span className="text-xl font-display font-bold text-white mt-1 leading-none">{selectedKeyGroup.major} Major</span>
                  <span className="text-[10px] text-pink-400 font-mono mt-1 font-semibold">{selectedKeyGroup.sharpsFlats}</span>
                </div>
              </div>
            </div>

            {/* Scale degrees layout card right */}
            <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
              <div>
                <span className="text-[9px] text-pink-400 font-mono tracking-widest font-semibold uppercase">{selectedKeyGroup.degreeName} Coordinates</span>
                <h3 className="font-display font-medium text-lg text-white mt-1">Diatonic Chord Degrees inside {selectedKeyGroup.major} Major Key</h3>
                <p className="text-xs text-slate-400 leading-normal mt-1">
                  Click any degree badge below to hear the programmatic chord voicing synthesized instantly in real-time.
                </p>
              </div>

              {/* Degrees map */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
                {getMajorKeyDegrees(selectedKeyGroup.major).map((deg, i) => (
                  <button
                    key={i}
                    onClick={() => handlePlayFifthsChord(deg.rootName, deg.isMinor)}
                    className="p-3 bg-slate-900 border border-slate-850 hover:border-pink-500/30 transition-all rounded-xl text-left cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-pink-400">{deg.degree} Degree</span>
                      <Volume2 className="w-3.5 h-3.5 text-slate-600 group-hover:text-pink-300" />
                    </div>
                    <div className="space-y-0.5 mt-2">
                      <h4 className="font-sans font-bold text-slate-200 text-sm">{deg.chordName}</h4>
                      <span className="text-[9px] text-slate-400 font-mono italic">{deg.type} Triad</span>
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
            <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border-slate-800 space-y-5">
              <h3 className="font-display font-medium text-slate-200 text-sm tracking-wide uppercase">SCALE EXPLORER SPELLER</h3>
              
              <div className="space-y-4">
                {/* Key selection */}
                <div>
                  <span className="text-xs text-slate-400 font-sans block">SELECT ROOT KEY:</span>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {Object.keys(ROOT_MIDIS).map((root) => (
                      <button
                        key={root}
                        onClick={() => setScaleRoot(root)}
                        className={`py-1 rounded text-xs font-mono font-bold border transition-colors cursor-pointer ${
                          scaleRoot === root
                            ? 'bg-pink-600 text-white border-pink-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {root}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode type selection */}
                <div>
                  <span className="text-xs text-slate-400 font-sans block">SELECT PATH MODALITY:</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.keys(SCALE_FORMULAS).map((type) => (
                      <button
                        key={type}
                        onClick={() => setScaleType(type)}
                        className={`py-2 px-3 text-left rounded-lg text-xs font-mono border transition-colors cursor-pointer line-clamp-1 ${
                          scaleType === type
                            ? 'bg-pink-950/20 border-pink-500/35 text-pink-300 font-medium'
                            : 'bg-slate-900 border-slate-900 text-slate-400 hover:text-slate-200'
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
            <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border-slate-800 flex flex-col justify-between min-h-[300px]">
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <div>
                    <h3 className="font-display font-medium text-white text-lg">{scaleRoot} {scaleType} Notes</h3>
                    <p className="text-xs text-slate-400">Scale spelled out in chromatic interval structures.</p>
                  </div>
                  
                  <button
                    onClick={handlePlayScale}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-550 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Arpeggiate Scale
                  </button>
                </div>

                {/* Notes horizontal array spelling */}
                <div className="flex gap-4.5 flex-wrap">
                  {getScaleNotes(scaleRoot, scaleType).map((node, i) => {
                    const isFired = activeScalePlayingIndex === i;
                    return (
                      <motion.div
                        key={i}
                        animate={isFired ? { scale: 1.15, borderColor: '#ec4899', backgroundColor: 'rgba(236,72,153,0.1)' } : { scale: 1 }}
                        className={`w-14 h-14 rounded-xl border flex flex-col justify-center items-center ${
                          isFired ? 'border-pink-500 bg-pink-950/20 text-pink-300' : 'border-slate-800 bg-slate-900/40 text-slate-300'
                        }`}
                      >
                        <span className="text-sm font-bold font-mono leading-none">{node.noteName}</span>
                        <span className="text-[9px] text-slate-500 font-mono mt-1">deg {i + 1}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850">
                <p className="text-[10px] text-slate-400 leading-normal">
                  Scale spelling uses MIDI references. These modal scales represent specific musical characters used to improvise over jazz, classical, and modern pop frameworks.
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
            <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border-slate-800 space-y-5">
              <h3 className="font-display font-medium text-slate-200 text-sm tracking-wide uppercase">CHORD SPELlER VOICINGS</h3>

              <div className="space-y-4">
                {/* Key selection */}
                <div>
                  <span className="text-xs text-slate-400 font-sans block">SELECT ROOT KEY:</span>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {Object.keys(ROOT_MIDIS).map((root) => (
                      <button
                        key={root}
                        onClick={() => setChordRoot(root)}
                        className={`py-1 rounded text-xs font-mono font-bold border transition-colors cursor-pointer ${
                          chordRoot === root
                            ? 'bg-pink-600 text-white border-pink-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {root}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chord types list */}
                <div>
                  <span className="text-xs text-slate-400 font-sans block">SELECT CHORD TENSION:</span>
                  <div className="grid grid-cols-1 gap-1.5 mt-2 max-h-[170px] overflow-y-auto pr-1">
                    {Object.keys(CHORD_FORMULAS).map((type) => (
                      <button
                        key={type}
                        onClick={() => setChordType(type)}
                        className={`py-2 px-3 text-left rounded-lg text-xs font-mono border transition-colors cursor-pointer flex justify-between items-center ${
                          chordType === type
                            ? 'bg-pink-950/20 border-pink-500/35 text-pink-300 font-medium'
                            : 'bg-slate-900 border-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{type}</span>
                        <span className="text-[10px] text-pink-400">{CHORD_FORMULAS[type].name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Spelling output right */}
            <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border-slate-800 flex flex-col justify-between min-h-[300px]">
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <div>
                    <h3 className="font-display font-medium text-white text-lg">{chordRoot} {chordType}</h3>
                    <p className="text-xs text-slate-400">Chord triad / extended spelling notes spelling.</p>
                  </div>

                  <button
                    onClick={handlePlayChordText}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-550 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Voice Chord
                  </button>
                </div>

                {/* Chord notes array spelling */}
                <div className="flex gap-4 flex-wrap">
                  {getChordNotes(chordRoot, chordType).map((node, i) => (
                    <div
                      key={i}
                      className="w-14 h-14 rounded-xl border border-slate-800 bg-slate-900/45 flex flex-col justify-center items-center text-slate-300"
                    >
                      <span className="text-sm font-bold font-mono leading-none">{node.noteName}</span>
                      <span className="text-[9px] text-slate-500 font-mono mt-1">midi {node.midi}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850">
                <p className="text-[10px] text-slate-400 leading-normal">
                  Chords spelling spells out root, modulations, and extensions. Voice Chord triggers three-channel synthesized strumming, staggering voice pitch values slightly to simulate manual instrument strums.
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
            <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
              <h3 className="font-display font-medium text-slate-200 text-sm tracking-wide">COMMON SONIC CADENCES</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A chord progression represents a series of key changes forming the primary verse/chorus skeleton of tracks. Select a cadence to hear the sequential cycle built around the active key.
              </p>

              <div>
                <span className="text-xs text-slate-400 font-sans block">ACTIVE TARGET KEY:</span>
                <select
                  value={scaleRoot}
                  onChange={(e) => setScaleRoot(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 mt-1.5 focus:outline-none focus:border-pink-500"
                >
                  {Object.keys(ROOT_MIDIS).map((root) => (
                    <option key={root} value={root}>{root} Major</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List entries right */}
            <div className="lg:col-span-7 space-y-4">
              {EPIC_PROGRESSIONS.map((prog, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-900 bg-slate-900/30 flex items-center justify-between gap-6"
                >
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-sm text-slate-200">{prog.name}</h4>
                    <span className="text-xs text-pink-400 font-mono font-bold block">{prog.roman}</span>
                    <p className="text-xs text-slate-400 font-sans mt-1 leading-normal">{prog.desc}</p>
                  </div>

                  <button
                    onClick={() => handlePlayProgressionLine(prog)}
                    className="p-3 bg-pink-950/20 border border-pink-500/20 hover:border-pink-500/50 text-pink-400 hover:text-white rounded-xl transition-all cursor-pointer flex-shrink-0"
                  >
                    <Play className="w-5 h-5 fill-pink-400/20 text-pink-400" />
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
