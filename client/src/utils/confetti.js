import confetti from 'canvas-confetti';

export const fireVictoryConfetti = () => {
  const duration = 3000;
  const end = Date.now() + duration;

  const colors = ['#06b6d4', '#a855f7', '#ec4899', '#fbbf24', '#22c55e'];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: colors
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: colors
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
};

export const fireStreakConfetti = (streak) => {
  const particleCount = Math.min(streak * 10, 50);
  confetti({
    particleCount,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#f59e0b', '#ef4444', '#f97316']
  });
};

export const fireCorrectConfetti = () => {
  confetti({
    particleCount: 30,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#22c55e', '#4ade80', '#86efac']
  });
};
