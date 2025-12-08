// Sound system for iOS/mobile compatibility
// Uses both Web Audio API and HTML5 Audio fallback

let audioContext = null;
let isUnlocked = false;

// Sound enabled state (persisted in localStorage)
let soundEnabled = typeof window !== 'undefined'
  ? localStorage.getItem('soundEnabled') !== 'false'
  : true;

export const setSoundEnabled = (enabled) => {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('soundEnabled', String(enabled));
  }
};

export const isSoundEnabled = () => soundEnabled;

// Create AudioContext only when needed
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
    }
  }
  return audioContext;
};

// Unlock audio - must be called from user gesture
export const unlockAudio = async () => {
  if (isUnlocked) return true;

  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    // Resume context
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Play silent buffer (required for iOS)
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    // Also try with oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(ctx.currentTime + 0.001);

    isUnlocked = true;
    console.log('Audio unlocked successfully');
    return true;
  } catch (e) {
    console.log('Audio unlock failed:', e);
    return false;
  }
};

// Auto-unlock on any user interaction
if (typeof window !== 'undefined') {
  const events = ['touchstart', 'touchend', 'mousedown', 'click', 'keydown'];

  const handleInteraction = () => {
    unlockAudio();
    // Keep listeners active for a while to ensure unlock
    setTimeout(() => {
      events.forEach(e => document.removeEventListener(e, handleInteraction, true));
    }, 5000);
  };

  events.forEach(e => {
    document.addEventListener(e, handleInteraction, { capture: true, passive: true });
  });
}

// Play a tone using Web Audio API
const playTone = (frequency, duration, type = 'sine', volume = 0.3) => {
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Try to resume if needed
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.1);
  } catch (e) {
    // Silent fail
  }
};

// Sound effects
export const sounds = {
  // Call this on first button press to ensure audio works
  init: () => {
    unlockAudio();
  },

  correct: () => {
    if (!soundEnabled) return;
    playTone(523.25, 0.1, 'sine', 0.5);
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.5), 100);
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.5), 200);
  },

  wrong: () => {
    if (!soundEnabled) return;
    playTone(200, 0.25, 'sawtooth', 0.3);
    setTimeout(() => playTone(150, 0.25, 'sawtooth', 0.3), 150);
  },

  tick: () => {
    if (!soundEnabled) return;
    playTone(800, 0.05, 'square', 0.2);
  },

  tickUrgent: () => {
    if (!soundEnabled) return;
    playTone(1000, 0.08, 'square', 0.3);
  },

  victory: () => {
    if (!soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.4), i * 150);
    });
    setTimeout(() => {
      playTone(523.25, 0.4, 'sine', 0.35);
      playTone(659.25, 0.4, 'sine', 0.35);
      playTone(783.99, 0.4, 'sine', 0.35);
    }, 600);
  },

  defeat: () => {
    if (!soundEnabled) return;
    playTone(400, 0.2, 'sine', 0.3);
    setTimeout(() => playTone(350, 0.2, 'sine', 0.3), 200);
    setTimeout(() => playTone(300, 0.35, 'sine', 0.25), 400);
  },

  click: () => {
    if (!soundEnabled) return;
    playTone(600, 0.04, 'sine', 0.25);
  },

  gameStart: () => {
    if (!soundEnabled) return;
    playTone(440, 0.1, 'sine', 0.4);
    setTimeout(() => playTone(554.37, 0.1, 'sine', 0.4), 100);
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.45), 200);
  },

  reaction: () => {
    if (!soundEnabled) return;
    playTone(1200, 0.06, 'sine', 0.25);
  },

  streak: (count) => {
    if (!soundEnabled) return;
    const baseFreq = 600 + (Math.min(count, 10) * 80);
    playTone(baseFreq, 0.1, 'sine', 0.4);
    setTimeout(() => playTone(baseFreq * 1.25, 0.12, 'sine', 0.45), 80);
  },

  countdown: (num) => {
    if (!soundEnabled) return;
    const freq = num === 1 ? 880 : 660;
    playTone(freq, 0.12, 'sine', 0.35);
  }
};

export default sounds;
