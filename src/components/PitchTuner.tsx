import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Activity, Sliders, Sparkles } from 'lucide-react';
import { getAudioContext, autoCorrelate, freqToNote } from '../lib/audio';

export default function PitchTuner() {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState<{ note: string; octave: number; cents: number } | null>(null);
  const [freq, setFreq] = useState<number>(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startTuner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const ctx = getAudioContext();
      audioContextRef.current = ctx;
      
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      setIsListening(true);
      updatePitch();
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Please allow microphone access to use the tuner.');
    }
  };

  const stopTuner = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    setIsListening(false);
    setPitch(null);
    setFreq(0);
  };

  const updatePitch = () => {
    if (!analyserRef.current) return;
    
    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    
    const detectedFreq = autoCorrelate(buffer, audioContextRef.current!.sampleRate);
    
    if (detectedFreq !== -1) {
      setFreq(detectedFreq);
      setPitch(freqToNote(detectedFreq));
    }
    
    animationFrameRef.current = requestAnimationFrame(updatePitch);
  };

  useEffect(() => {
    return () => stopTuner();
  }, []);

  return (
    <div className="glass-panel p-8 rounded-3xl border-slate-200 space-y-8 shadow-sm flex flex-col items-center text-center">
      <div className="space-y-2">
        <h3 className="font-display font-bold text-slate-900 text-sm tracking-wide uppercase">Chromatic Pro Tuner</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">Precision frequency detector using high-speed autocorrelation.</p>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Background Dial */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-100 shadow-inner" />
        
        {/* Cents Gauge */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="4"
          />
          {pitch && (
            <motion.circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={Math.abs(pitch.cents) < 5 ? "#10B981" : Math.abs(pitch.cents) < 20 ? "#3B82F6" : "#EF4444"}
              strokeWidth="4"
              strokeDasharray="283"
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 - (Math.abs(pitch.cents) / 50) * 141 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          )}
        </svg>

        {/* Note Display */}
        <div className="relative z-10 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {pitch ? (
              <motion.div
                key={pitch.note}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <span className="text-6xl font-display font-bold text-slate-900 tracking-tighter">
                  {pitch.note}
                </span>
                <span className="text-sm font-mono font-bold text-blue-600 uppercase">Octave {pitch.octave}</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-300"
              >
                <Activity className="w-12 h-12" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cents Indicator */}
      {pitch && (
        <div className="w-full space-y-2">
          <div className="flex justify-between text-[10px] font-bold font-mono text-slate-400">
            <span>-50 CENTS</span>
            <span className={Math.abs(pitch.cents) < 5 ? "text-emerald-500" : "text-slate-400"}>IN TUNE</span>
            <span>+50 CENTS</span>
          </div>
          <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className={`absolute top-0 bottom-0 w-1 rounded-full ${Math.abs(pitch.cents) < 5 ? 'bg-emerald-500' : 'bg-blue-600'}`}
              animate={{ left: `${50 + (pitch.cents)}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-300" />
          </div>
          <p className="text-[10px] font-mono font-bold text-slate-400">
            {freq.toFixed(2)} Hz
          </p>
        </div>
      )}

      <button
        onClick={isListening ? stopTuner : startTuner}
        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
        }`}
      >
        {isListening ? (
          <>
            <MicOff className="w-5 h-5" /> Deactivate Mic
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" /> Activate Tuner
          </>
        )}
      </button>
    </div>
  );
}
