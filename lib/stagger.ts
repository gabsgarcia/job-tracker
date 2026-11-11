// Entrance animation for list items: each item fades/slides in a bit after the
// previous one. Capped so long lists don't take forever to appear.
export const enterClass = "animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both";

export function staggerStyle(index: number, stepMs = 40) {
  return { animationDelay: `${Math.min(index, 12) * stepMs}ms` };
}
