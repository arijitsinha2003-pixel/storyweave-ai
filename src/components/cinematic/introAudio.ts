/**
 * Procedural Web Audio synthesizer for the StoryWeave cinematic intro.
 * Audio never autoplays — it activates only when the user explicitly toggles sound on.
 */
export class CinematicAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isEnabled = false;
  private padOscs: OscillatorNode[] = [];
  private whooshFired = false;
  private sparkleStage = 0;
  private revealFired = false;

  public enable(): boolean {
    if (typeof window === 'undefined') return false;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return false;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.startAmbientPad();
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    this.masterGain?.gain.cancelScheduledValues(now);
    this.masterGain?.gain.setTargetAtTime(0.28, now, 0.35);
    this.isEnabled = true;
    return true;
  }

  public disable(): void {
    this.isEnabled = false;
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(0.0001, now, 0.18);
  }

  private startAmbientPad(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Warm C#m9 orchestral-like drone chord (C#2, G#2, E3, B3, D#4)
    const freqs = [69.3, 103.83, 164.81, 246.94, 311.13];
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(680, now);
    filter.Q.value = 0.7;

    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.24, now);
    filter.connect(padGain);
    padGain.connect(this.masterGain);

    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx < 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.detune.setValueAtTime((idx - 2) * 4, now);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(idx < 2 ? 0.25 : 0.14, now);
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(now);
      this.padOscs.push(osc);
    });
  }

  public updateTimeline(elapsedSeconds: number): void {
    if (!this.isEnabled || !this.ctx || !this.masterGain) return;

    // Gentle magical sparkles as the book opens & letters ascend (3s - 8s)
    if (elapsedSeconds >= 3.2 && this.sparkleStage === 0) {
      this.sparkleStage = 1;
      this.playSparkleCluster([659.25, 830.61, 987.77, 1318.5]);
    }
    if (elapsedSeconds >= 6.0 && this.sparkleStage === 1) {
      this.sparkleStage = 2;
      this.playSparkleCluster([783.99, 987.77, 1174.66, 1479.98, 1661.22]);
    }

    // Deep cinematic whoosh entering the circular portal (7.3s)
    if (elapsedSeconds >= 7.3 && !this.whooshFired) {
      this.whooshFired = true;
      this.playCinematicWhoosh();
    }

    // Elegant harmonic chime for STORYWEAVE logo reveal (9.1s)
    if (elapsedSeconds >= 9.1 && !this.revealFired) {
      this.revealFired = true;
      this.playLogoRevealChime();
    }
  }

  private playSparkleCluster(notes: number[]): void {
    if (!this.ctx || !this.masterGain) return;
    const base = this.ctx.currentTime;
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const t = base + i * 0.14;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 1.4);
    });
  }

  private playCinematicWhoosh(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const duration = 2.0;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.65;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.6;
    filter.frequency.setValueAtTime(110, now);
    filter.frequency.exponentialRampToValueAtTime(920, now + 0.9);
    filter.frequency.exponentialRampToValueAtTime(160, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.75);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + duration);
  }

  private playLogoRevealChime(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const chord = [277.18, 415.3, 554.37, 659.25, 830.61];
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(idx === 0 ? 0.2 : 0.12, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 3.3);
    });
  }

  public dispose(): void {
    this.isEnabled = false;
    this.padOscs.forEach((osc) => {
      try {
        osc.stop();
      } catch {
        // Ignore already stopped
      }
    });
    this.padOscs = [];
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.masterGain = null;
  }
}
