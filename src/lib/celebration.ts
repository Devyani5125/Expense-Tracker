import confetti from 'canvas-confetti';

/**
 * Triggers a vibrant "sprinkler" celebration effect using canvas-confetti.
 * This features a central burst followed by continuous side-cannon sprays
 * from the bottom corners of the screen.
 */
export const triggerCelebration = () => {
  const duration = 5 * 1000; // 5 seconds of sprinklers
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  // Initial big center burst for immediate feedback
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
  });

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // Left side "sprinkler" cannon
    confetti({ 
      ...defaults, 
      particleCount, 
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 1 },
      colors: ['#8b5cf6', '#3b82f6']
    });
    
    // Right side "sprinkler" cannon
    confetti({ 
      ...defaults, 
      particleCount, 
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 1 },
      colors: ['#ec4899', '#f59e0b']
    });

    // Random little pops across the screen
    if (Math.random() > 0.6) {
      confetti({
        ...defaults,
        particleCount: 20,
        origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.1, 0.4) },
        colors: ['#10b981', '#ffffff']
      });
    }
  }, 250);
};
