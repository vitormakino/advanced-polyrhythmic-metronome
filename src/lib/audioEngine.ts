/**
 * Web Audio API based Metronome Engine
 * Provides accurate timing and polyrhythm scheduling
 */

export type SoundType = 'sine' | 'wood' | 'bell' | 'electronic';

export interface PulseConfig {
  id: string;
  beats: number;
  frequency: number;
  color: string;
  beatIntensities: number[]; // Array of intensities for each beat
  soundType: SoundType;
  enabled?: boolean; // New property to allow muting
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private timerID: number | null = null;
  private lookahead: number = 25.0; // How far ahead to schedule audio (ms)
  private scheduleAheadTime: number = 0.1; // How far to look ahead (s)
  
  private bpm: number = 120;
  private pulses: PulseConfig[] = [];
  private nextPulseTimes: Map<string, number> = new Map();
  private currentPulseBeats: Map<string, number> = new Map();
  
  private onPulseBeat?: (pulseId: string, beat: number, time: number) => void;
  private debugLogs: string[] = [];
  private onDebugUpdate?: (logs: string[]) => void;

  constructor() {
    this.audioContext = null;
  }

  public setDebugCallback(cb: (logs: string[]) => void) {
    this.onDebugUpdate = cb;
  }

  private addLog(msg: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.debugLogs = [`[${timestamp}] ${msg}`, ...this.debugLogs].slice(0, 5);
    if (this.onDebugUpdate) this.onDebugUpdate(this.debugLogs);
  }

  public async testSound() {
    this.init();
    if (!this.audioContext) return;
    this.addLog("Testing direct sound...");
    try {
      await this.unlock();
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.5);
      this.addLog("Direct sound triggered (osc start/stop)");
    } catch (e) {
      this.addLog("Direct test failed: " + e);
    }
  }

  private init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Specifically for iOS/Safari: Unlocks the AudioContext by resuming it and playing a silent buffer
   * during a user gesture.
   */
  public async unlock(): Promise<boolean> {
  this.init();
  if (!this.audioContext) return false;

  this.addLog(`Unlocking ctx (State: ${this.audioContext.state})...`);

  try {
    if (this.audioContext.state !== 'running') {
      await this.audioContext.resume(); // 👈 primeiro
    }

    const buffer = this.audioContext.createBuffer(1, 1, 22050);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(0); // 👈 depois

    return this.audioContext.state === 'running';
  } catch (e) {
    console.error('Failed to unlock audio context:', e);
    return false;
  }
}

  public getContextState(): AudioContextState | 'not-initialized' {
    return this.audioContext ? this.audioContext.state : 'not-initialized';
  }

  public setParams(bpm: number, pulses: PulseConfig[]) {
    this.bpm = bpm;
    this.pulses = pulses;
  }

  public setCallback(callback: (pulseId: string, beat: number, time: number) => void) {
    this.onPulseBeat = callback;
  }

  private scheduleNote(pulse: PulseConfig, beatNumber: number, time: number) {
    if (!this.audioContext) return;

    const isEnabled = pulse.enabled !== false;
    const isAccent = beatNumber === 0;
    const beatIntensity = pulse.beatIntensities[beatNumber] ?? 0.5;
    const gainValue = beatIntensity;

    if (isEnabled) {
      if (beatNumber === 0) this.addLog(`Beat triggered: Pulse ${pulse.id.substring(0,4)}`);
      const envelope = this.audioContext.createGain();
      
      envelope.gain.setValueAtTime(0, time);
      envelope.gain.linearRampToValueAtTime(gainValue, time + 0.005);
      envelope.gain.exponentialRampToValueAtTime(0.001, time + (pulse.soundType === 'bell' ? 0.4 : 0.1));

      if (pulse.soundType === 'sine' || !pulse.soundType) {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = isAccent ? pulse.frequency * 1.5 : pulse.frequency;
        osc.connect(envelope);
        osc.start(time);
        osc.stop(time + 0.1);
      } else if (pulse.soundType === 'wood') {
        const osc = this.audioContext.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = isAccent ? 800 : 600;
        
        const noise = this.audioContext.createBufferSource();
        const bufferSize = this.audioContext.sampleRate * 0.02;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.3 * gainValue, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.01);
        
        noise.connect(noiseGain);
        noiseGain.connect(envelope);
        osc.connect(envelope);
        
        noise.start(time);
        osc.start(time);
        osc.stop(time + 0.05);
      } else if (pulse.soundType === 'bell') {
        [1, 2.5, 3.2].forEach(harmonic => {
          const osc = this.audioContext.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = (isAccent ? pulse.frequency * 1.5 : pulse.frequency) * harmonic;
          const harmGain = this.audioContext.createGain();
          harmGain.gain.value = 1 / harmonic;
          osc.connect(harmGain);
          harmGain.connect(envelope);
          osc.start(time);
          osc.stop(time + 0.5);
        });
      } else if (pulse.soundType === 'electronic') {
        const osc = this.audioContext.createOscillator();
        osc.type = 'square';
        osc.frequency.value = isAccent ? 150 : 100;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, time);
        filter.frequency.exponentialRampToValueAtTime(100, time + 0.05);
        
        osc.connect(filter);
        filter.connect(envelope);
        osc.start(time);
        osc.stop(time + 0.1);
      }

      envelope.connect(this.audioContext.destination);
    }

    if (this.onPulseBeat) this.onPulseBeat(pulse.id, beatNumber, time);
  }

  private polyrhythmScheduler() {
    if (!this.audioContext) return;

    // Use a reference pulse (the first one) to define the measure duration based on BPM.
    // If no pulses, just wait.
    if (this.pulses.length === 0) {
      this.timerID = window.setTimeout(() => this.polyrhythmScheduler(), this.lookahead);
      return;
    }

    // Measure duration is determined by the first pulse (Pulse A behavior)
    // One "beat" of Pulse[0] = 60 / BPM
    // One "measure" = Pulse[0].beats * (60 / BPM)
    const referencePulse = this.pulses[0];
    const secondsPerBeatRef = 60.0 / this.bpm;
    const measureDuration = secondsPerBeatRef * referencePulse.beats;

    this.pulses.forEach((pulse) => {
      const nextTime = this.nextPulseTimes.get(pulse.id) || this.audioContext!.currentTime;
      const currentBeat = this.currentPulseBeats.get(pulse.id) || 0;
      
      const secondsPerBeat = measureDuration / pulse.beats;

      let t = nextTime;
      let b = currentBeat;

      while (t < this.audioContext!.currentTime + this.scheduleAheadTime) {
        this.scheduleNote(pulse, b, t);
        t += secondsPerBeat;
        b = (b + 1) % pulse.beats;
      }

      this.nextPulseTimes.set(pulse.id, t);
      this.currentPulseBeats.set(pulse.id, b);
    });

    this.timerID = window.setTimeout(() => this.polyrhythmScheduler(), this.lookahead);
  }

public async start() {
  this.init();
  if (!this.audioContext) return;

  if (this.audioContext.state !== 'running') {
    this.addLog('Context not running, trying resume...');
    try {
      await this.audioContext.resume();
    } catch {
      this.addLog('Resume failed');
      return;
    }
  }

  if (this.audioContext.state !== 'running') {
    this.addLog('Context still not running');
    return;
  }

  this.nextPulseTimes.clear();
  this.currentPulseBeats.clear();

  const startTime = this.audioContext.currentTime + 0.05;

  this.pulses.forEach(p => {
    this.nextPulseTimes.set(p.id, startTime);
    this.currentPulseBeats.set(p.id, 0);
  });

  this.polyrhythmScheduler();
}

  public stop() {
    if (this.timerID) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  public isRunning(): boolean {
    return this.timerID !== null;
  }
}
