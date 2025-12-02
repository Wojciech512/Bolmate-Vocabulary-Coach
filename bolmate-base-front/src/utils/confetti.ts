import confetti from "canvas-confetti";

export const triggerConfetti = (streak: number) => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  if (streak === 3) {
    // Simple confetti from left side
    confetti({
      ...defaults,
      particleCount: 50,
      origin: { x: 0, y: 0.6 },
      angle: 60,
    });
  } else if (streak === 5) {
    // Confetti from both sides
    confetti({
      ...defaults,
      particleCount: 50,
      origin: { x: 0, y: 0.6 },
      angle: 60,
    });
    confetti({
      ...defaults,
      particleCount: 50,
      origin: { x: 1, y: 0.6 },
      angle: 120,
    });
  } else if (streak === 10) {
    // Epic confetti burst from both sides continuously
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0, 0.1), y: Math.random() - 0.2 },
        angle: randomInRange(55, 125),
      });

      // Right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.9, 1), y: Math.random() - 0.2 },
        angle: randomInRange(55, 125),
      });
    }, 250);
  }
};
