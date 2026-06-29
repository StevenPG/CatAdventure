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

/** Six cat poses: 0/1 idle bob, 2/3 run, 4 jump, 5 attack. */
function drawCatFrame(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number): void {
  const cx = w / 2;
  ctx.fillStyle = '#ffffff';

  const bob = frame === 1 ? 2 : 0; // idle breathing
  const stretch = frame === 4; // jump
  const lean = frame === 5; // attack

  const bodyW = 32;
  const bodyH = stretch ? 36 : 30;
  const bodyX = cx - bodyW / 2 + (lean ? 3 : 0);
  const bodyY = h - bodyH - 2 - (stretch ? 4 : 0) + bob;

  // ears
  ctx.beginPath();
  ctx.moveTo(bodyX + 4, bodyY + 4);
  ctx.lineTo(bodyX + 10, bodyY - 10);
  ctx.lineTo(bodyX + 16, bodyY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bodyX + bodyW - 4, bodyY + 4);
  ctx.lineTo(bodyX + bodyW - 10, bodyY - 10);
  ctx.lineTo(bodyX + bodyW - 16, bodyY + 4);
  ctx.closePath();
  ctx.fill();

  // body
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 9);
  ctx.fill();

  // legs (alternate for run)
  if (frame === 2 || frame === 3) {
    const off = frame === 2 ? 4 : -4;
    ctx.fillRect(bodyX + 6 + off, h - 4, 6, 4);
    ctx.fillRect(bodyX + bodyW - 12 - off, h - 4, 6, 4);
  }

  // extended paw for attack
  if (lean) ctx.fillRect(bodyX + bodyW, bodyY + bodyH / 2 - 3, 10, 6);

  // face (stays dark through tint)
  ctx.fillStyle = '#1a1c2c';
  const eyeY = bodyY + 14;
  ctx.beginPath();
  ctx.arc(cx - 6 + (lean ? 3 : 0), eyeY, 3, 0, Math.PI * 2);
  ctx.arc(cx + 6 + (lean ? 3 : 0), eyeY, 3, 0, Math.PI * 2);
  ctx.fill();
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
