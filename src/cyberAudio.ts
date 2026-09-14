// Stephen Cybernetic Sound Synthesizer System (Web Audio API)
class CyberAudioEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    // Resume context if suspended (browser security restriction)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Cute cyber interface feedback beep
  public playBeep(freq = 1200, duration = 0.06, type: OscillatorType = 'sine') {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      // Decay curve
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('CyberAudio playBeep failed:', e);
    }
  }

  // Immersive dual-frequency digital glitch burst
  public playGlitch() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const duration = 0.15;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.05);
      osc.frequency.setValueAtTime(200, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(1200, now + duration);

      filter.type = 'peaking';
      filter.frequency.setValueAtTime(800, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + duration);
    } catch (e) {
      console.warn('CyberAudio playGlitch failed:', e);
    }
  }

  // High-frequency sweep cyber hacking alert alarm
  public playAlarm(times = 3) {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      let now = ctx.currentTime;
      
      for (let i = 0; i < times; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const sweepDuration = 0.35;
        const delay = i * 0.45;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now + delay);
        osc.frequency.exponentialRampToValueAtTime(1800, now + delay + sweepDuration);

        gain.gain.setValueAtTime(0.0, now + delay);
        gain.gain.linearRampToValueAtTime(0.06, now + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + sweepDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + sweepDuration);
      }
    } catch (e) {
      console.warn('CyberAudio playAlarm failed:', e);
    }
  }

  // Retro cyber complete alert chime
  public playComplete() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      // Note 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
      gain2.gain.setValueAtTime(0.08, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.12 + 0.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.12 + 0.2);

      // Note 3
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(783.99, now + 0.24); // G5
      gain3.gain.setValueAtTime(0.1, now + 0.24);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.24 + 0.4);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.24);
      osc3.stop(now + 0.24 + 0.4);

    } catch (e) {
      console.warn('CyberAudio playComplete failed:', e);
    }
  }
}

export const cyberAudio = new CyberAudioEngine();
