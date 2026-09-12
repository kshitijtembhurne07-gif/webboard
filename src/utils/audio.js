// Web Audio API Sound Synthesizer for Push Alert Chimes
// No external MP3 / audio files needed - works 100% reliably in all modern browsers

export class AudioAlertManager {
  constructor() {
    this.audioCtx = null;
    this.isMuted = localStorage.getItem('noticepulse_muted') === 'true';
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('noticepulse_muted', String(this.isMuted));
    return this.isMuted;
  }

  playUrgentPing() {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Dual-tone urgent chime (Attention-grabbing chime: Note 1 -> Note 2)
      // First tone (high harmonic)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.5);

      // Second tone (resonant pulse slightly delayed)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880.00, now + 0.15); // A5
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

      gain2.gain.setValueAtTime(0, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.15);
      osc2.stop(now + 0.75);

    } catch (err) {
      console.warn('Could not play audio alert:', err);
    }
  }

  playSubtleAcknowledgePing() {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (err) {
      console.warn('Could not play acknowledge chime:', err);
    }
  }

  // Request browser desktop notification permission
  static requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // Trigger browser desktop notification if permitted
  static showDesktopNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`NoticePulse Alert: ${title}`, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      } catch (e) {
        console.warn('Desktop notification failed:', e);
      }
    }
  }
}

export const alertSound = new AudioAlertManager();
