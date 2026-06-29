import type { EffectId } from '../../types';

/**
 * Screen effects are rendered as a full-screen overlay in the UIScene. Each
 * effect describes how that overlay should look while a given cat is active.
 * This keeps the rendering in one place (ScreenEffectLayer) and the data here.
 */
export interface ScreenEffectSpec {
  /** Radial darkening at the edges. 0 = none, 1 = fully black edges. */
  vignetteStrength: number;
  /** Radius of the clear center as a fraction of screen size (smaller = more
   *  tunnel-like). Only meaningful when vignetteStrength > 0. */
  vignetteRadius: number;
  /** Optional full-screen color wash (RGB). */
  tint?: number;
  /** Alpha of the color wash. */
  tintAlpha: number;
}

const NONE: ScreenEffectSpec = { vignetteStrength: 0, vignetteRadius: 1, tintAlpha: 0 };

export const SCREEN_EFFECTS: Record<EffectId, ScreenEffectSpec> = {
  none: NONE,
  // Gentle edge dimming — low-vision cats.
  vignette: { vignetteStrength: 0.6, vignetteRadius: 0.75, tintAlpha: 0 },
  // Strong tunnel — blind cats see only what's close.
  'tunnel-vision': { vignetteStrength: 0.92, vignetteRadius: 0.42, tintAlpha: 0 },
  // Night hunter — green wash plus mild vignette.
  'night-vision': { vignetteStrength: 0.5, vignetteRadius: 0.8, tint: 0x38d973, tintAlpha: 0.18 },
  // Warm golden glow.
  'warm-glow': { vignetteStrength: 0.45, vignetteRadius: 0.85, tint: 0xffcd75, tintAlpha: 0.14 },
};

export function getEffectSpec(id: EffectId): ScreenEffectSpec {
  return SCREEN_EFFECTS[id] ?? NONE;
}
