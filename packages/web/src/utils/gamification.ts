/**
 * Gamification utilities for the Laser Focus (ADHD) cognitive profile
 */

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8B4D9', '#52B788'
];

interface ConfettiParticle {
  element: HTMLDivElement;
  x: number;
  duration: number;
}

/**
 * Triggers a confetti explosion animation
 * @param origin - Optional origin point for the confetti (defaults to center of screen)
 */
export function triggerConfetti(origin?: { x: number; y: number }) {
  const particleCount = 30;
  const particles: ConfettiParticle[] = [];

  const centerX = origin?.x ?? window.innerWidth / 2;
  const centerY = origin?.y ?? window.innerHeight / 2;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';

    // Random color
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    if (randomColor) {
      particle.style.backgroundColor = randomColor;
    }

    // Random position around origin
    const angle = (Math.PI * 2 * i) / particleCount;
    const velocity = 50 + Math.random() * 100;
    const x = centerX + Math.cos(angle) * velocity;
    const y = centerY + Math.sin(angle) * velocity;

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    // Random duration
    const duration = 1.5 + Math.random() * 1;
    particle.style.animationDuration = `${duration}s`;

    document.body.appendChild(particle);
    particles.push({ element: particle, x, duration });

    // Remove after animation
    setTimeout(() => {
      particle.remove();
    }, duration * 1000);
  }
}

/**
 * Plays a satisfying completion sound
 */
export function playCompletionSound() {
  // Create a simple success tone using Web Audio API
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 587.33; // D5
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);

  // Play second note
  setTimeout(() => {
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);

    oscillator2.frequency.value = 783.99; // G5
    oscillator2.type = 'sine';

    gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.4);
  }, 150);
}

/**
 * Celebrates a task completion with visual and audio feedback
 */
export function celebrateCompletion(origin?: { x: number; y: number }) {
  triggerConfetti(origin);

  // Play sound (with try-catch in case audio is blocked)
  try {
    playCompletionSound();
  } catch (e) {
    console.log('Audio playback prevented:', e);
  }
}

/**
 * Shows a brief encouraging message
 */
export function showEncouragement(message: string = 'Great job!') {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    font-weight: 600;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideDown 0.3s ease-out forwards;
    pointer-events: none;
  `;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      to {
        transform: translateX(-50%) translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(toast);

  // Remove after delay
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease-out reverse forwards';
    setTimeout(() => {
      toast.remove();
      style.remove();
    }, 300);
  }, 2000);
}
