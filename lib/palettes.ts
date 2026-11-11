// Color schemes the user can pick. The CSS for each one lives in app/globals.css
// under [data-palette="…"]. "indigo" is the default (no attribute needed).
export const PALETTES = [
  { id: "indigo", label: "Indigo", swatch: "hsl(243 75% 59%)" },
  { id: "ocean", label: "Ocean", swatch: "hsl(192 85% 32%)" },
  { id: "forest", label: "Forest", swatch: "hsl(158 70% 30%)" },
  { id: "sunset", label: "Sunset", swatch: "hsl(14 80% 44%)" },
  { id: "rose", label: "Rose", swatch: "hsl(340 75% 46%)" },
  { id: "neutral", label: "Neutral", swatch: "hsl(0 0% 9%)" },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];

export const DEFAULT_PALETTE: PaletteId = "indigo";
export const PALETTE_STORAGE_KEY = "palette";

export function isPalette(value: unknown): value is PaletteId {
  return PALETTES.some((p) => p.id === value);
}

// Runs in <head> before the page paints, so there is no flash of the default colors.
export const paletteScript = `try{var p=localStorage.getItem(${JSON.stringify(
  PALETTE_STORAGE_KEY,
)});if(p)document.documentElement.dataset.palette=p}catch(e){}`;
