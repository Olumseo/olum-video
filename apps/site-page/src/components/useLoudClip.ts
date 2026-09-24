/**
 * Which clip, if any, is playing with sound.
 *
 * "Only one may be loud" is a fact about the SET, not about any tile in it, so
 * a tile cannot own it — a tile has no way of knowing about its siblings. It
 * lives one level up, and pressing a second tile simply moves this id, which
 * mutes the first on its next render.
 *
 * On /results that set is nine tiles across three rows. Two rows each keeping
 * their own "which one is loud" would let two videos talk over each other from
 * different parts of the page, so the state belongs to the page rather than to
 * the row.
 *
 * Escape returns everything to silent wallpaper. There is no modal to close
 * any more, but Escape is still where people reach to back out of something
 * that started making noise.
 */

import { useCallback, useEffect, useState } from "react";

export function useLoudClip(): [string | null, (id: string) => void] {
  const [loud, setLoud] = useState<string | null>(null);

  // Pressing the tile that is already loud turns it back off, so the control
  // is a toggle rather than a trap.
  const activate = useCallback((id: string) => {
    setLoud((current) => (current === id ? null : id));
  }, []);

  useEffect(() => {
    if (!loud) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLoud(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [loud]);

  return [loud, activate];
}
