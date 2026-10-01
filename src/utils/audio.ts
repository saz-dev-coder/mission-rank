// Web Audio API synthesizer for distraction-free alarms
let audioCtx: AudioContext | null = null;
let currentAlarmInterval: number | null = null;
let currentAutoStopTimeout: number | null = null;
let isAlarmPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSoundTone(
  sound: 'Soft bell' | 'Clear chime' | 'Digital beep',
  volumePercent: number
): void {
  try {
    const ctx = getAudioContext();
    const gainNode = ctx.createGain();
    const gainLevel = Math.max(0.01, Math.min(1, volumePercent / 100));
    gainNode.gain.setValueAtTime(gainLevel * 0.4, ctx.currentTime);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    if (sound === 'Soft bell') {
      // Warm, layered resonant bell tone (fundamental 528Hz + harmonics)
      const frequencies = [528, 1056, 1584];
      const gains = [0.6, 0.25, 0.1];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const partialGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        partialGain.gain.setValueAtTime(gains[idx] * gainLevel, now);
        partialGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

        osc.connect(partialGain);
        partialGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.2);
      });
    } else if (sound === 'Clear chime') {
      // Dual-tone melodic bell chime (E5 -> B5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g1 = ctx.createGain();
      const g2 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      g1.gain.setValueAtTime(gainLevel * 0.5, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc1.connect(g1);
      g1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 1.2);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(987.77, now + 0.18); // B5
      g2.gain.setValueAtTime(gainLevel * 0.4, now + 0.18);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc2.connect(g2);
      g2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 1.5);
    } else {
      // Digital beep: sharp pulse
      const osc = ctx.createOscillator();
      const bGain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174, now + 0.12);

      bGain.gain.setValueAtTime(gainLevel * 0.25, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(bGain);
      bGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (err) {
    console.warn('Audio playback not permitted or supported yet:', err);
  }
}

export function startAlarmLoop(
  sound: 'Soft bell' | 'Clear chime' | 'Digital beep',
  volume: number,
  vibrate: boolean,
  autoStopSeconds: number,
  onAutoStop?: () => void
): void {
  stopAlarmLoop();
  isAlarmPlaying = true;

  // Immediate sound
  playSoundTone(sound, volume);

  if (vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch {
      // ignore vibration error
    }
  }

  // Interval loop every 1.5s
  currentAlarmInterval = window.setInterval(() => {
    if (!isAlarmPlaying) return;
    playSoundTone(sound, volume);
    if (vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // ignore
      }
    }
  }, 1600);

  // Auto stop
  currentAutoStopTimeout = window.setTimeout(() => {
    stopAlarmLoop();
    if (onAutoStop) onAutoStop();
  }, autoStopSeconds * 1000);
}

export function stopAlarmLoop(): void {
  isAlarmPlaying = false;
  if (currentAlarmInterval !== null) {
    clearInterval(currentAlarmInterval);
    currentAlarmInterval = null;
  }
  if (currentAutoStopTimeout !== null) {
    clearTimeout(currentAutoStopTimeout);
    currentAutoStopTimeout = null;
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch {
      // ignore
    }
  }
}

export function getIsAlarmPlaying(): boolean {
  return isAlarmPlaying;
}
