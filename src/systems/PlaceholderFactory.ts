import type { ToneSpec } from '../config/assets';

/**
 * Generates placeholder assets at runtime so the game needs zero binary files.
 * Output is data URIs fed straight into Phaser's loader — the exact same code
 * path real files use, so swapping in real art/audio is just a path change in
 * the asset manifest.
 *
 * Shapes are drawn white (facial features dark) so they tint cleanly per-cat.
 */
export const PlaceholderFactory = {
  /** Build a multi-frame spritesheet PNG (data URI). */
  makeSheet(generator: 'cat' | 'enemy', frameW: number, frameH: number, frameCount: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = frameW * frameCount;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;
    for (let i = 0; i < frameCount; i++) {
      ctx.save();
      ctx.translate(i * frameW, 0);
      if (generator === 'cat') drawCatFrame(ctx, frameW, frameH, i);
      else drawEnemyFrame(ctx, frameW, frameH, i);
      ctx.restore();
    }
    return canvas.toDataURL('image/png');
  },

  /** Synthesize a short tone as a WAV data URI. */
  makeTone(spec: ToneSpec): string {
    const sampleRate = 22050;
    const length = Math.max(1, Math.floor((spec.durationMs / 1000) * sampleRate));
    const data = new Float32Array(length);
    const vol = spec.volume ?? 0.25;
    for (let i = 0; i < length; i++) {
      const t = i / length; // 0..1 progress
      const freq = spec.sweepTo !== undefined ? spec.freq + (spec.sweepTo - spec.freq) * t : spec.freq;
      const phase = (i / sampleRate) * freq * Math.PI * 2;
      let sample: number;
      switch (spec.type) {
        case 'square': sample = Math.sign(Math.sin(phase)); break;
        case 'sawtooth': sample = 2 * ((phase / (Math.PI * 2)) % 1) - 1; break;
        case 'triangle': sample = 2 * Math.abs(2 * ((phase / (Math.PI * 2)) % 1) - 1) - 1; break;
        case 'noise': sample = Math.random() * 2 - 1; break;
        default: sample = Math.sin(phase);
      }
      // Simple attack/decay envelope to avoid clicks.
      const env = Math.min(1, t * 12) * (1 - t);
      data[i] = sample * env * vol;
    }
    return encodeWav(data, sampleRate);
  },
};

// --- Sprite drawing ----------------------------------------------------------

/** A single cat pose. The cat faces right (the engine flips for left). */
interface CatPose {
  /** Top y of the body. */
  top: number;
  /** Body height. */
  bodyH: number;
  /** Horizontal lean (forward = +x). */
  lean: number;
  /** Body width multiplier (squash/stretch). */
  squash: number;
  /** Ears swept back (0 = up, 1 = flat back). */
  earBack: number;
  eyes: 'open' | 'closed' | 'narrow';
  /** x of the front legs (toward the face) relative to centre. */
  frontLeg: number;
  /** x of the back legs relative to centre. */
  backLeg: number;
  /** Tail raise (0 = low, 1 = high). */
  tailLift: number;
  /** Extend a front paw (attack). */
  paw: boolean;
  /** Open mouth (attack). */
  mouth: boolean;
}

/**
 * Ten reference poses for a 48x48 cat sheet:
 *   0-2 idle (breathe + blink), 3-6 run cycle, 7 jump, 8 fall, 9 attack.
 * Real art should follow this frame ordering (see public/assets/README.md).
 */
function drawCatFrame(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number): void {
  const base: CatPose = {
    top: 18, bodyH: 24, lean: 0, squash: 1, earBack: 0, eyes: 'open',
    frontLeg: 7, backLeg: -7, tailLift: 0.35, paw: false, mouth: false,
  };
  const poses: CatPose[] = [
    { ...base },                                                                      // 0 idle
    { ...base, top: 16, tailLift: 0.55 },                                             // 1 idle (breathe up)
    { ...base, eyes: 'closed' },                                                      // 2 idle (blink)
    { ...base, lean: 2, top: 18, frontLeg: 11, backLeg: -10, tailLift: 0.6 },         // 3 run reach
    { ...base, lean: 1, top: 15, frontLeg: 3, backLeg: -3, tailLift: 0.7 },           // 4 run gather (up)
    { ...base, lean: 2, top: 18, frontLeg: -8, backLeg: 9, tailLift: 0.6 },           // 5 run reach (other)
    { ...base, lean: 1, top: 15, frontLeg: -3, backLeg: 3, tailLift: 0.7 },           // 6 run gather (up)
    { ...base, top: 11, bodyH: 30, squash: 0.9, earBack: 1, tailLift: 1, frontLeg: 2, backLeg: -2 }, // 7 jump (stretch)
    { ...base, top: 21, bodyH: 21, squash: 1.18, tailLift: 0.15, frontLeg: 12, backLeg: -12 },       // 8 fall (spread)
    { ...base, lean: 4, eyes: 'narrow', paw: true, mouth: true, tailLift: 0.45 },     // 9 attack
  ];
  drawCat(ctx, w, h, poses[frame] ?? base);
}

function drawCat(ctx: CanvasRenderingContext2D, w: number, h: number, p: CatPose): void {
  const white = '#ffffff';
  const dark = '#1a1c2c';
  const cx = w / 2;
  const bodyW = 26 * p.squash;
  const bodyX = cx - bodyW / 2 + p.lean;
  const bottom = p.top + p.bodyH;
  const feetY = h - 1;

  // Tail (behind the body), curving up from the rear (left side).
  ctx.strokeStyle = white;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const tx = bodyX + 3;
  const ty = bottom - 4;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.quadraticCurveTo(tx - 11, ty - 2, tx - 9 - p.tailLift * 3, ty - 6 - p.tailLift * 18);
  ctx.stroke();

  // Legs (drawn behind the body).
  ctx.fillStyle = white;
  const legW = 5;
  const leg = (x: number) => {
    roundRect(ctx, cx + x - legW / 2, bottom - 3, legW, feetY - bottom + 3, 2);
    ctx.fill();
  };
  leg(p.backLeg);
  leg(p.frontLeg);

  // Ears (base tucked under the body top).
  const tilt = p.earBack * 6;
  ctx.beginPath();
  ctx.moveTo(bodyX + 4, p.top + 4);
  ctx.lineTo(bodyX + 9 + tilt, p.top - 9);
  ctx.lineTo(bodyX + 15, p.top + 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bodyX + bodyW - 4, p.top + 4);
  ctx.lineTo(bodyX + bodyW - 9 + tilt, p.top - 9);
  ctx.lineTo(bodyX + bodyW - 15, p.top + 4);
  ctx.closePath();
  ctx.fill();

  // Body.
  roundRect(ctx, bodyX, p.top, bodyW, p.bodyH, 9);
  ctx.fill();

  // Extended paw (attack).
  if (p.paw) {
    roundRect(ctx, bodyX + bodyW - 2, p.top + p.bodyH / 2 - 3, 12, 6, 3);
    ctx.fill();
  }

  // Face (dark — survives tinting). Front is the right side.
  ctx.fillStyle = dark;
  const ey = p.top + 11;
  const ex1 = cx + p.lean + 1;
  const ex2 = cx + p.lean + 8;
  if (p.eyes === 'closed') {
    ctx.fillRect(ex1 - 2, ey, 4, 1.6);
    ctx.fillRect(ex2 - 2, ey, 4, 1.6);
  } else if (p.eyes === 'narrow') {
    ctx.fillRect(ex1 - 2, ey - 1, 4, 2);
    ctx.fillRect(ex2 - 2, ey - 1, 4, 2);
  } else {
    ctx.beginPath();
    ctx.arc(ex1, ey, 2.4, 0, Math.PI * 2);
    ctx.arc(ex2, ey, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (p.mouth) {
    ctx.beginPath();
    ctx.arc(cx + p.lean + 5, ey + 7, 3, 0, Math.PI);
    ctx.fill();
  }
}

/** Four enemy walk frames with a bob + leg shuffle. */
function drawEnemyFrame(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number): void {
  const cx = w / 2;
  const bob = frame % 2 === 0 ? 0 : 2;
  ctx.fillStyle = '#ffffff';
  const bodyY = h - 28 - 2 + bob;
  roundRect(ctx, 2, bodyY, w - 4, 26, 8);
  ctx.fill();
  // spiky top
  ctx.beginPath();
  ctx.moveTo(6, bodyY);
  ctx.lineTo(12, bodyY - 8);
  ctx.lineTo(18, bodyY);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, bodyY);
  ctx.lineTo(24, bodyY - 8);
  ctx.lineTo(30, bodyY);
  ctx.closePath();
  ctx.fill();
  // shuffling feet
  const off = frame < 2 ? 3 : -3;
  ctx.fillRect(cx - 10 + off, h - 3, 6, 3);
  ctx.fillRect(cx + 4 - off, h - 3, 6, 3);
  // angry eyes
  ctx.fillStyle = '#1a1c2c';
  ctx.beginPath();
  ctx.moveTo(9, bodyY + 10);
  ctx.lineTo(17, bodyY + 8);
  ctx.lineTo(9, bodyY + 16);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w - 9, bodyY + 10);
  ctx.lineTo(w - 17, bodyY + 8);
  ctx.lineTo(w - 9, bodyY + 16);
  ctx.closePath();
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// --- WAV encoding ------------------------------------------------------------

function encodeWav(samples: Float32Array, sampleRate: number): string {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  // base64-encode the buffer
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(binary);
}
