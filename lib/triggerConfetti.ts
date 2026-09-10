// lib/triggerConfetti.ts
// Shared confetti animation utility using animejs.
// Used by QuestMap.tsx and BadgeCelebrationModal.tsx.

export async function triggerConfetti(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const { animate, stagger, utils } = await import('animejs');
    const container = document.getElementById('quest-map-confetti');
    if (!container) return;

    // Create 30 confetti dots
    const colors = ['#a3e635', '#38bdf8', '#f97316', '#c084fc', '#ef4444', '#fbbf24'];
    const dots = Array.from({ length: 30 }, () => {
      const el = document.createElement('div');
      el.style.cssText = [
        'position:fixed',
        `left:${utils.random(10, 90)}vw`,
        'top:-20px',
        'width:8px',
        'height:8px',
        `border-radius:${utils.random(0, 50)}%`,
        `background:${colors[utils.random(0, colors.length - 1)]}`,
        'pointer-events:none',
        'z-index:9999',
      ].join(';');
      document.body.appendChild(el);
      return el;
    });

    animate(dots, {
      translateY: ['0vh', '110vh'],
      rotate: () => utils.random(-360, 360),
      opacity: [1, 0],
      duration: 1800,
      delay: stagger(60),
      ease: 'outQuad',
      onComplete: () => dots.forEach((d) => d.remove()),
    });
  } catch {
    // animejs unavailable — silently skip
  }
}
