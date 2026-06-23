/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBeep(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio context permission block or not supported
    }
  }

  playClick() {
    this.playBeep(800, 'sine', 0.1, 0.15);
  }

  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Arpeggio C Major C4 -> E4 -> G4 -> C5
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playBeep(freq, 'triangle', 0.25, 0.15);
        }, idx * 100);
      });
    } catch {}
  }

  playError() {
    this.playBeep(120, 'sawtooth', 0.3, 0.2);
  }

  playCountdownTick() {
    this.playBeep(1000, 'sine', 0.05, 0.08);
  }

  playVictoryTheme() {
    try {
      this.init();
      if (!this.ctx) return;
      // Synthesized cheerful multi-part fanfare
      const notes = [523.25, 659.25, 783.99, 523.25, 783.99, 1046.50];
      const durations = [0.15, 0.15, 0.15, 0.15, 0.15, 0.5];
      let cumulativeTime = 0;
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playBeep(freq, 'sine', durations[idx], 0.18);
        }, cumulativeTime);
        cumulativeTime += durations[idx] * 1000 + 40;
      });
    } catch {}
  }
}

export const sound = new AudioEngine();
