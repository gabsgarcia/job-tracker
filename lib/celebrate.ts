// Confetti burst for good news (an offer!). Loaded on demand so it does not
// weigh on the first page load, and skipped when the OS asks for reduced motion.
export async function celebrate() {
  const { default: confetti } = await import("canvas-confetti");
  const shared = { disableForReducedMotion: true, particleCount: 80, spread: 70, startVelocity: 45 };
  confetti({ ...shared, angle: 60, origin: { x: 0, y: 0.7 } });
  confetti({ ...shared, angle: 120, origin: { x: 1, y: 0.7 } });
}
