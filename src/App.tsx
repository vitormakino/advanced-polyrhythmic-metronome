import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square, Plus, Minus, Activity, Zap, Volume2, Trash2, Settings2, Github, Sparkles } from 'lucide-react';
import { AudioEngine, PulseConfig } from './lib/audioEngine.ts';

// --- Components ---

const BPMDisplay = ({ bpm, onBpmChange }: { bpm: number; onBpmChange: (v: number) => void }) => {
  const [taps, setTaps] = useState<number[]>([]);

  const handleTap = () => {
    const now = performance.now();
    const newTaps = [...taps, now].slice(-4);
    setTaps(newTaps);

    if (newTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const tappedBpm = Math.round(60000 / avgInterval);
      if (tappedBpm >= 40 && tappedBpm <= 300) {
        onBpmChange(tappedBpm);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-300 opacity-50" />
      <div className="w-full flex justify-between items-center mb-2 px-1">
        <span className="text-zinc-500 text-xs font-mono tracking-widest uppercase">Tempo / BPM</span>
        <button 
          onClick={handleTap}
          className="text-[10px] font-mono text-orange-500/80 hover:text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 active:scale-95 transition-all"
        >
          TAP
        </button>
      </div>
      <div className="flex items-center gap-6">
        <button 
          onClick={() => onBpmChange(bpm - 1)}
          className="p-3 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
          id="bpm-decrease"
        >
          <Minus size={24} />
        </button>
        <span className="text-7xl font-light tabular-nums text-white tracking-tighter">
          {bpm}
        </span>
        <button 
          onClick={() => onBpmChange(bpm + 1)}
          className="p-3 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
          id="bpm-increase"
        >
          <Plus size={24} />
        </button>
      </div>
      <input 
        type="range" 
        min="40" 
        max="300" 
        value={bpm} 
        onChange={(e) => onBpmChange(parseInt(e.target.value))}
        className="w-full mt-6 accent-orange-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
        id="bpm-slider"
      />
    </div>
  );
};

interface PolyrhythmControlProps {
  key?: string;
  pulse: PulseConfig;
  onChange: (p: PulseConfig) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const PolyrhythmControl = ({ pulse, onChange, onRemove, canRemove }: PolyrhythmControlProps) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleBeatsChange = (delta: number) => {
    const newBeats = Math.max(1, pulse.beats + delta);
    let newIntensities = [...pulse.beatIntensities];
    if (newBeats > pulse.beats) {
      // Add new beats with default intensity (0.5)
      newIntensities = [...newIntensities, ...Array(newBeats - pulse.beats).fill(0.5)];
    } else {
      // Truncate
      newIntensities = newIntensities.slice(0, newBeats);
    }
    onChange({ ...pulse, beats: newBeats, beatIntensities: newIntensities });
  };

  const updateBeatIntensity = (index: number, value: number) => {
    const next = [...pulse.beatIntensities];
    next[index] = value;
    onChange({ ...pulse, beatIntensities: next });
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col bg-zinc-900 rounded-2xl border border-zinc-800 w-full relative group overflow-hidden"
    >
      <div className="p-3 flex flex-col items-center">
        {canRemove && (
          <button 
            onClick={onRemove}
            className="absolute top-1 right-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-2 text-zinc-500 hover:text-red-500 active:text-red-400"
            aria-label="Remove Pulse"
          >
            <Trash2 size={16} />
          </button>
        )}
        
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`absolute top-1 left-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-2 ${showSettings ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300 active:text-white'}`}
          aria-label="Pulse Settings"
        >
          <Settings2 size={16} />
        </button>

        <span className="text-zinc-500 text-[9px] uppercase tracking-wider mb-1 font-mono">Pulse {pulse.beats}</span>
        <div className="flex flex-col items-center gap-1">
          <button onClick={() => handleBeatsChange(1)} className="text-zinc-400 hover:text-white p-1"><Plus size={14}/></button>
          <span style={{ color: pulse.color }} className="text-3xl font-light tabular-nums">{pulse.beats}</span>
          <button onClick={() => handleBeatsChange(-1)} className="text-zinc-400 hover:text-white p-1"><Minus size={14}/></button>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black/20 border-t border-zinc-800/50 p-3 space-y-3"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1 justify-center">
                {pulse.beatIntensities.map((intensity, i) => {
                  const levels = [0, 0.3, 0.6, 1.0];
                  const currentLevelIdx = levels.findIndex(l => Math.abs(l - intensity) < 0.1);
                  
                  const cycleIntensity = () => {
                    const nextIdx = (currentLevelIdx + 1) % levels.length;
                    updateBeatIntensity(i, levels[nextIdx]);
                  };

                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <button 
                        onClick={cycleIntensity}
                        className="relative h-12 w-4 bg-zinc-800 rounded-sm overflow-hidden transition-all hover:bg-zinc-750 active:scale-95 border border-zinc-700/30"
                      >
                        <motion.div 
                          className="absolute bottom-0 w-full" 
                          initial={false}
                          animate={{ 
                            backgroundColor: intensity > 0 ? pulse.color : '#3f3f46',
                            height: `${intensity * 100}%` 
                          }} 
                        />
                      </button>
                      <span className="text-[6px] font-mono text-zinc-600">{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[8px] font-mono text-zinc-500 uppercase">Sound</span>
              <div className="grid grid-cols-2 gap-1">
                {(['sine', 'wood', 'bell', 'electronic'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => onChange({ ...pulse, soundType: type })}
                    className={`text-[8px] py-1 rounded border uppercase ${
                      pulse.soundType === type 
                        ? 'bg-zinc-700 text-white border-zinc-600' 
                        : 'bg-zinc-800 text-zinc-500 border-zinc-800 hover:bg-zinc-750'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-1 w-full bg-zinc-800 overflow-hidden mt-auto flex">
        {pulse.beatIntensities.map((intensity, i) => (
          <div 
            key={i} 
            className="h-full flex-1 border-r border-black/10 last:border-0" 
            style={{ backgroundColor: pulse.color, opacity: intensity * 0.7 }} 
          />
        ))}
      </div>
    </motion.div>
  );
};

const GeometricVisualizer = ({ pulses, activeBeats }: { pulses: PulseConfig[]; activeBeats: Record<string, number> }) => {
  const getPoints = (sides: number, radius: number) => {
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      points.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
      });
    }
    return points;
  };

  // Base radius starts from 110 and goes inward
  const getPulseRadius = (index: number) => 110 - index * 25;

  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      <svg width="100%" height="100%" viewBox="-130 -130 260 260" className="overflow-visible">
        {pulses.map((pulse, idx) => {
          const radius = getPulseRadius(idx);
          if (radius <= 0) return null;
          const points = getPoints(pulse.beats, radius);
          const activeIndex = activeBeats[pulse.id];

          return (
            <g key={pulse.id}>
              {/* Ring */}
              <circle cx="0" cy="0" r={radius} fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" opacity={0.5} />
              
              {/* Connection Shape */}
              {pulse.beats > 2 && (
                <polygon 
                  points={points.map(p => `${p.x},${p.y}`).join(' ')} 
                  fill="none" 
                  stroke={pulse.color} 
                  strokeWidth="0.5" 
                  strokeOpacity="0.1" 
                />
              )}

              {/* Beat Indicators */}
              {points.map((p, i) => (
                <motion.circle
                  key={`${pulse.id}-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={activeIndex === i ? 6 : 3}
                  fill={activeIndex === i ? pulse.color : '#3f3f46'}
                  initial={false}
                  animate={{
                    r: activeIndex === i ? 7 : 3.5,
                    fill: activeIndex === i ? pulse.color : '#3f3f46',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              ))}
            </g>
          );
        })}
      </svg>
      
      {/* Central Flash */}
      <AnimatePresence>
        {Object.values(activeBeats).some(b => b === 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.2, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            className="absolute w-40 h-40 rounded-full bg-white blur-3xl pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

const PRESET_COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#f43f5e', '#eab308'];

export default function App() {
  const [bpm, setBpm] = useState(120);
  const [pulses, setPulses] = useState<PulseConfig[]>([
    { id: '1', beats: 4, frequency: 800, color: PRESET_COLORS[0], beatIntensities: [1, 0.5, 0.5, 0.5], soundType: 'sine' },
    { id: '2', beats: 3, frequency: 500, color: PRESET_COLORS[1], beatIntensities: [1, 0.5, 0.5], soundType: 'wood' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeBeats, setActiveBeats] = useState<Record<string, number>>({});

  const engineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    engineRef.current = new AudioEngine();
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setParams(bpm, pulses);
    }
  }, [bpm, pulses]);

  const toggleMetronome = () => {
    if (!engineRef.current) return;

    if (isRunning) {
      engineRef.current.stop();
      setIsRunning(false);
      setActiveBeats({});
    } else {
      engineRef.current.setCallback((id, beat) => {
        setActiveBeats(prev => ({ ...prev, [id]: beat }));
      });
      engineRef.current.start();
      setIsRunning(true);
    }
  };

  const addPulse = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const lastPulse = pulses[pulses.length - 1];
    const newBeats = (lastPulse?.beats || 2) + 1;
    setPulses([...pulses, {
      id: newId,
      beats: newBeats,
      frequency: 400 + Math.random() * 400,
      color: PRESET_COLORS[pulses.length % PRESET_COLORS.length],
      beatIntensities: Array(newBeats).fill(0.5),
      soundType: 'sine'
    }]);
  };

  const removePulse = (id: string) => {
    if (pulses.length <= 1) return;
    setPulses(pulses.filter(p => p.id !== id));
    setActiveBeats(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updatePulse = (updated: PulseConfig) => {
    setPulses(pulses.map(p => p.id === updated.id ? updated : p));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 lg:p-12 font-sans selection:bg-orange-500/30">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Side: Controls (lg:col-7) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 space-y-6"
        >
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="text-orange-500 fill-orange-500" size={20} />
              <h1 className="text-2xl font-bold tracking-tight uppercase">Advanced Polyrhythmic Metronome</h1>
            </div>
            <p className="text-zinc-500 text-sm max-w-sm">
              Professional-grade rhythmic tool for precision practice and complex polyrhythmic exploration.
            </p>
          </header>

          <BPMDisplay bpm={bpm} onBpmChange={setBpm} />

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Active Pulses</h2>
              <button 
                onClick={addPulse}
                className="flex items-center gap-2 text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-800 transition-colors"
              >
                <Plus size={12} /> ADD PULSE
              </button>
            </div>
            
            <div id="pulse-controls-grid" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {pulses.map((pulse) => (
                  <PolyrhythmControl 
                    key={pulse.id} 
                    pulse={pulse} 
                    onChange={updatePulse} 
                    onRemove={() => removePulse(pulse.id)}
                    canRemove={pulses.length > 1}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

          <button
            id="main-toggle"
            onClick={toggleMetronome}
            className={`w-full py-6 rounded-2xl flex items-center justify-center gap-4 text-xl font-bold transition-all duration-300 ring-offset-4 ring-offset-zinc-950 active:scale-95 ${
              isRunning 
                ? 'bg-zinc-800 text-orange-500 border border-orange-500/30' 
                : 'bg-orange-500 text-white shadow-[0_0_40px_rgba(249,115,22,0.2)] hover:shadow-[0_0_60px_rgba(249,115,22,0.3)]'
            }`}
          >
            {isRunning ? (
              <><Square fill="currentColor" size={24} /> STOP</>
            ) : (
              <><Play fill="currentColor" size={24} /> START</>
            )}
          </button>
        </motion.div>

        {/* Right Side: Visualizer (lg:col-5) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-5 flex flex-col items-center justify-center bg-zinc-900/40 rounded-3xl aspect-square border border-zinc-800/50 backdrop-blur-md relative overflow-hidden"
        >
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-zinc-600 text-[9px] uppercase tracking-[0.4em] font-mono whitespace-nowrap">Rhythm Topology</div>
          
          <GeometricVisualizer 
            pulses={pulses} 
            activeBeats={activeBeats}
          />

          <div className="absolute bottom-6 flex gap-10">
            <div className="flex flex-col items-center">
              <span className="text-zinc-500 text-[8px] uppercase mb-1.5 font-mono">Coincidence</span>
              <div className={`w-2 h-2 rounded-full transition-all duration-200 ${Object.values(activeBeats).every(b => b === 0) && isRunning ? 'bg-white shadow-[0_0_8px_white] scale-125' : 'bg-zinc-800'}`} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-zinc-500 text-[8px] uppercase mb-1.5 font-mono">Engine</span>
              <div className="flex items-center gap-2">
                 <Activity size={10} className={isRunning ? 'text-orange-500 animate-pulse' : 'text-zinc-700'} />
                 <Volume2 size={10} className={isRunning ? 'text-zinc-300' : 'text-zinc-700'} />
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      <footer className="mt-16 text-zinc-600 text-[10px] uppercase tracking-widest font-mono flex flex-wrap justify-center items-center gap-6 opacity-60">
        <a 
          href="https://github.com/vitormakino/advanced-polyrhythmic-metronome" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-white transition-colors"
        >
          <Github size={14} />
          <span>View Source</span>
        </a>
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-orange-500/50" />
          <span>Built with Google AI Studio</span>
        </div>
      </footer>
    </div>
  );
}

