'use strict';
/* Original sound bed from cue times: foley and a sparse score, built from
   oscillators and seeded noise. No samples, so nothing to license.

   node sound.cjs            whole film -> output/sound.wav
   node sound.cjs 2.8 8.8    a window (for the motion study)

   Cues live in film.config.json: sound[] (t, kind, gain, len, pan) and score. */

const fs = require('node:fs');
const path = require('node:path');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'film.config.json'), 'utf8'));
const from = Number(process.argv[2] ?? 0), to = Number(process.argv[3] ?? cfg.duration);
const SR = 48000, N = Math.round((to - from) * SR);
const L = new Float32Array(N), R = new Float32Array(N);

let seed = 4242;
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; };
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function put(i, v, pan = 0) {
  if (i < 0 || i >= N) return;
  L[i] += v * Math.sqrt((1 - pan) / 2);
  R[i] += v * Math.sqrt((1 + pan) / 2);
}

/* Foley. Each kind is a few lines of maths; add your own the same way. */
function fx({ t, kind, gain = 0.4, len = 0.5, pan = 0 }) {
  const o = Math.floor((t - from) * SR), n = Math.floor(len * SR);
  let low = 0, ph = 0;
  for (let i = 0; i < n; i++) {
    const s = i / SR, p = i / n, r = rnd();
    low = 0.9 * low + 0.1 * r;
    let v = 0;
    switch (kind) {
      case 'whoosh': v = (r - low) * Math.sin(Math.PI * p) ** 2; break;
      case 'pop': ph += (2 * Math.PI * (520 - 300 * p)) / SR; v = Math.sin(ph) * Math.exp(-s * 38) * Math.min(1, s * 900); break;
      case 'click': v = (Math.sin(2 * Math.PI * 1800 * s) * 0.5 + r * 0.5) * Math.exp(-s * 160); break;
      case 'tick': v = Math.sin(2 * Math.PI * 1200 * s) * Math.exp(-s * 90) * Math.min(1, s * 3000); break;
      case 'coin': v = (Math.sin(2 * Math.PI * 2637 * s) + 0.6 * Math.sin(2 * Math.PI * 3951 * s)) * Math.exp(-s * 9) * Math.min(1, s * 2000) * 0.5; break;
      case 'thud': v = (Math.sin(2 * Math.PI * (90 - 40 * p) * s) + low * 0.4) * Math.exp(-s * 10) * Math.min(1, s * 500); break;
      case 'flip': v = (r - low) * Math.exp(-s * 60) * Math.min(1, s * 2000); break;
      case 'chime': v = [1, 2.01, 3.02, 4.2].reduce((a, h, k) => a + Math.sin(2 * Math.PI * 880 * h * s) * Math.exp(-s * (2 + k * 1.5)) / (k + 1), 0) * Math.min(1, s * 600) * 0.6; break;
      case 'riser': ph += (2 * Math.PI * (220 + 660 * p * p)) / SR; v = (Math.sin(ph) * 0.35 + (r - low) * 0.5 * p) * p; break;
      default: throw new Error(`Unknown sound kind: ${kind}`);
    }
    put(o + i, v * gain, pan);
  }
}

/* Score: a soft pad and plucked chord tones on a steady tempo. */
function key(t, midi, len, gain, pan = 0) {
  const f = mtof(midi), o = Math.floor((t - from) * SR), n = Math.floor((len + 1) * SR);
  for (let i = 0; i < n; i++) {
    const s = i / SR;
    const env = Math.min(1, s * 180) * Math.exp(-s * (2.2 / len));
    put(o + i, (Math.sin(2 * Math.PI * f * s) + 0.3 * Math.sin(4 * Math.PI * f * s) * Math.exp(-s * 3)) * env * gain, pan);
  }
}
function pad(t, chord, len, gain) {
  const o = Math.floor((t - from) * SR), n = Math.floor(len * SR);
  for (let i = 0; i < n; i++) {
    const s = i / SR, env = Math.sin(Math.PI * (i / n)) ** 1.4;
    const v = chord.reduce((a, m, k) => a + Math.sin(2 * Math.PI * mtof(m) * s + k) * 0.6 + Math.sin(2 * Math.PI * mtof(m) * 1.003 * s) * 0.4, 0);
    put(o + i, (v * env * gain) / chord.length, Math.sin(s * 0.3) * 0.3);
  }
}
if (cfg.score) {
  const { bpm, from: a, to: b, chords, gain = 0.6 } = cfg.score;
  const bar = (4 * 60) / bpm;
  for (let k = 0; a + k * bar < b; k++) {
    const t = a + k * bar, ch = chords[k % chords.length];
    pad(t, ch, bar + 0.5, 0.05 * gain);
    key(t, ch[0] + 12, 1.6, 0.08 * gain, -0.2);
    key(t + bar / 2, ch[2] + 12, 1.2, 0.06 * gain, 0.3);
  }
}
for (const cue of cfg.sound || []) fx(cue);

/* A short stereo room so dry oscillators sit in a space. */
{
  const dl = Float32Array.from(L), dr = Float32Array.from(R);
  for (const [d, g] of [[0.031, 0.3], [0.047, 0.25], [0.067, 0.2], [0.089, 0.15], [0.113, 0.1]]) {
    const k = Math.floor(d * SR);
    for (let i = k; i < N; i++) { L[i] += dr[i - k] * g; R[i] += dl[i - k] * g; }
  }
}

/* 16-bit PCM WAV, peak-limited; loudness is set later by mix.cjs. */
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const scale = peak > 0.9 ? 0.9 / peak : 1;
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * scale)) * 32767), i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * scale)) * 32767), i * 4 + 2);
}
const head = Buffer.alloc(44);
head.write('RIFF', 0); head.writeUInt32LE(36 + data.length, 4); head.write('WAVE', 8);
head.write('fmt ', 12); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(2, 22);
head.writeUInt32LE(SR, 24); head.writeUInt32LE(SR * 4, 28); head.writeUInt16LE(4, 32); head.writeUInt16LE(16, 34);
head.write('data', 36); head.writeUInt32LE(data.length, 40);
const outDir = path.resolve(__dirname, cfg.output || 'output');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'sound.wav'), Buffer.concat([head, data]));
console.log(`sound.wav: ${(to - from).toFixed(2)}s, ${(cfg.sound || []).length} cues`);
