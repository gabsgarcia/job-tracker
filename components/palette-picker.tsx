"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DEFAULT_PALETTE,
  PALETTES,
  PALETTE_STORAGE_KEY,
  isPalette,
  type PaletteId,
} from "@/lib/palettes";

// Lets the user pick a color scheme. Saved in this browser (localStorage).
export function PalettePicker() {
  const [palette, setPalette] = useState<PaletteId | null>(null);

  // The <head> script already applied the saved palette; read it back on mount.
  useEffect(() => {
    const current = document.documentElement.dataset.palette;
    setPalette(isPalette(current) ? current : DEFAULT_PALETTE);
  }, []);

  function choose(id: PaletteId) {
    setPalette(id);
    document.documentElement.dataset.palette = id;
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, id);
    } catch {
      // Private mode / blocked storage: the choice still applies until reload.
    }
  }

  if (!palette) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Color scheme">
          <Palette size={16} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Color scheme</DropdownMenuLabel>
        {PALETTES.map((p) => (
          <DropdownMenuItem key={p.id} onSelect={() => choose(p.id)} className="flex gap-2">
            <span
              aria-hidden
              className="size-4 rounded-full ring-1 ring-border"
              style={{ background: p.swatch }}
            />
            <span className="flex-1">{p.label}</span>
            {palette === p.id && <Check size={14} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
