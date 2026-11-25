/**
 * Offline Focus Soundscape Synthesizer using Web Audio API.
 * Generates Brown Noise, Soft Rain (filtered pink-ish noise), and White Noise with zero external files.
 */

export type SoundscapeType = 'off' | 'brown' | 'rain' | 'white';

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private currentType: SoundscapeType = 'off';

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  start(type: SoundscapeType, volume = 0.25) {
    this.stop();
    if (type === 'off') {
      this.currentType = 'off';
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 3; // 3-second seamless noise buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'brown') {
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.2;
      }
    } else {
      // Soft rain: pink-ish noise
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = type === 'rain' ? 'bandpass' : 'lowpass';
    filter.frequency.value = type === 'rain' ? 1100 : type === 'brown' ? 500 : 4500;

    const gain = ctx.createGain();
    gain.gain.value = Math.max(0, Math.min(1, volume)) * 0.4;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    this.sourceNode = source;
    this.filterNode = filter;
    this.gainNode = gain;
    this.currentType = type;
  }

  setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)) * 0.4, this.ctx.currentTime);
    }
  }

  stop() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {
        // Ignore
      }
      this.sourceNode = null;
    }
    this.filterNode?.disconnect();
    this.gainNode?.disconnect();
    this.filterNode = null;
    this.gainNode = null;
    this.currentType = 'off';
  }

  getType(): SoundscapeType {
    return this.currentType;
  }
}

export const soundscape = new SoundscapeEngine();
