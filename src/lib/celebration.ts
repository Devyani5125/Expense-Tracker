import confetti from 'canvas-confetti';

export const triggerCelebration = () => {
  const duration = 4 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 1000 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  // Initial big center burst for immediate feedback
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
  });

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 40 * (timeLeft / duration);
    
    // Corner sprinklers bursting upwards
    confetti({ 
      ...defaults, 
      particleCount, 
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 1 } 
    });
    
    confetti({ 
      ...defaults, 
      particleCount, 
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 1 } 
    });

    // Random sprinkles
    if (Math.random() > 0.7) {
      confetti({
        ...defaults,
        particleCount: 15,
        origin: { x: randomInRange(0.2, 0.8), y: randomInRange(0.2, 0.5) }
      });
    }
  }, 300);
};
