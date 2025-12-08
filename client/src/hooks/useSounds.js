// Sound system using Web Audio API - no external files needed
// Lazy initialization for mobile compatibility

let audioContext = null;

// Initialize AudioContext on first user interaction (required for mobile)
const getAudioContext = () => {
  if (!audioContext && typeof window !== 'undefined') {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

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

// Unlock audio on user interaction (critical for iOS/mobile)
const unlockAudio = () => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
  // Play a silent buffer to fully unlock on iOS
  if (ctx) {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  }
};

// Add multiple event listeners to unlock audio
if (typeof window !== 'undefined') {
  const events = ['touchstart', 'touchend', 'click', 'keydown'];
  const unlock = () => {
    unlockAudio();
    events.forEach(e => document.removeEventListener(e, unlock));
  };
  events.forEach(e => document.addEventListener(e, unlock, { passive: true }));
}

// Generate different sound types
const playTone = (frequency, duration, type = 'sine', volume = 0.3) => {
  if (!soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume if suspended
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
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch (e) {
    // Silently fail if audio not available
    console.log('Audio playback failed:', e);
  }
};

// Sound effects
export const sounds = {
  correct: () => {
    // Happy ascending ding
    playTone(523.25, 0.1, 'sine', 0.4); // C5
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.4), 100); // E5
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.4), 200); // G5
  },

  wrong: () => {
    // Buzzer sound
    playTone(200, 0.3, 'sawtooth', 0.2);
    setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.2), 150);
  },

  tick: () => {
    // Quick tick
    playTone(800, 0.05, 'square', 0.15);
  },

  tickUrgent: () => {
    // Urgent tick (last 5 seconds)
    playTone(1000, 0.08, 'square', 0.25);
  },

  victory: () => {
    // Triumphant fanfare
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.35), i * 150);
    });
    // Final chord
    setTimeout(() => {
      playTone(523.25, 0.5, 'sine', 0.3);
      playTone(659.25, 0.5, 'sine', 0.3);
      playTone(783.99, 0.5, 'sine', 0.3);
    }, 600);
  },

  defeat: () => {
    // Sad descending
    playTone(400, 0.2, 'sine', 0.25);
    setTimeout(() => playTone(350, 0.2, 'sine', 0.25), 200);
    setTimeout(() => playTone(300, 0.4, 'sine', 0.2), 400);
  },

  click: () => {
    playTone(600, 0.05, 'sine', 0.2);
  },

  gameStart: () => {
    // Exciting start
    playTone(440, 0.1, 'sine', 0.3);
    setTimeout(() => playTone(554.37, 0.1, 'sine', 0.3), 100);
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.35), 200);
  },

  reaction: () => {
    // Pop sound for reactions
    playTone(1200, 0.08, 'sine', 0.2);
  },

  streak: (count) => {
    // Higher pitch for higher streaks
    const baseFreq = 600 + (count * 100);
    playTone(baseFreq, 0.1, 'sine', 0.3);
    setTimeout(() => playTone(baseFreq * 1.25, 0.15, 'sine', 0.35), 80);
  },

  countdown: (num) => {
    // 3-2-1 countdown
    const freq = num === 1 ? 880 : 660;
    playTone(freq, 0.15, 'sine', 0.3);
  }
};

export default sounds;
