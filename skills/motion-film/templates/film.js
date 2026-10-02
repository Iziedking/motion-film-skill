'use strict';
/* A deterministic film: draw(t) paints frame t and reads nothing else.
   The renderer calls window.setTime(t) for every frame. In a browser, Space
   plays and pauses, arrows seek one second, comma and period step one frame.

   This demo is ten seconds: a request is typed, it becomes an agreement card,
   three steps tick, money lands, and the brand closes. Replace the scenes, keep
   the shape: a timeline of named beats, scenes that read t, primitives below. */

const W = 1920, H = 1080, FPS = 30, DURATION = 10;
const cv = document.getElementById('film');
const ctx = cv.getContext('2d');
cv.width = W; cv.height = H;

/* ---------- palette and type ---------- */
const C = { ink: '#16202A', ink2: '#2C353E', paper: '#FBFBF8', canvas: '#EEF2F7', muted: '#6A737C', line: '#E3E6E1', accent: '#AFC95B', accentInk: '#10170B' };
const FONT = (size, weight = 400) => `${weight} ${size}px Brand, "Helvetica Neue", Arial, sans-serif`;

/* ---------- maths ---------- */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const P = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const eo = p => 1 - Math.pow(1 - p, 3);
const eo5 = p => 1 - Math.pow(1 - p, 5);
const eio = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const eb = p => 1 + 2.6 * Math.pow(p - 1, 3) + 1.6 * Math.pow(p - 1, 2);

/* ---------- primitives ---------- */
function rr(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function fillRR(x, y, w, h, r, c) { rr(x, y, w, h, r); ctx.fillStyle = c; ctx.fill(); }
function text(s, x, y, size, color, weight = 400, align = 'left', alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = FONT(size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
  ctx.restore();
}
/* Draw inside a transform; the camera is a translate plus a uniform scale. */
function camera(x, y, s, fn) { ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-x, -y); fn(); ctx.restore(); }

/* ---------- timeline: every beat named once ---------- */
const T = {
  typeIn: [0.4, 2.4],      // the request types itself
  morph: [2.8, 4.0],       // request card becomes the agreement card
  steps: [4.1, 5.2],       // three steps tick
  land: [5.8, 6.6],        // money lands
  hold: [6.6, 7.4],
  pull: [7.4, 8.4],        // camera pulls back, brand enters
  brand: [8.0, 9.0],
};

const REQUEST = 'I need a logo for my bakery by Friday.';
const STEPS = ['Agreed', 'Funded', 'Delivered'];

function scene(t) {
  ctx.fillStyle = C.canvas;
  ctx.fillRect(0, 0, W, H);

  const pull = eio(P(t, ...T.pull));
  camera(W / 2, H / 2, lerp(1, 0.82, pull), () => {
    // One card carries the whole film: it starts as a message and becomes the agreement.
    const morph = eio(P(t, ...T.morph));
    const enter = eo5(P(t, 0, 0.6));
    const w = lerp(1000, 900, morph), h = lerp(150, 520, morph);
    const x = W / 2 - w / 2, y = lerp(H / 2 - 75, H / 2 - 260, morph) + (1 - enter) * 60;
    ctx.save();
    ctx.globalAlpha = enter;
    fillRR(x, y, w, h, 28, C.paper);
    ctx.restore();

    // The typed request, held as the card's first line once it morphs.
    const typed = Math.floor(REQUEST.length * P(t, ...T.typeIn));
    const caret = t < T.typeIn[1] + 0.4 && Math.floor(t * 2) % 2 === 0 ? '|' : '';
    text(REQUEST.slice(0, typed) + caret, x + 48, y + lerp(92, 96, morph), lerp(46, 34, morph), C.ink, 500, 'left', enter);

    // Agreement rows appear once the card has its new shape.
    const rows = P(t, T.morph[1] - 0.3, T.morph[1] + 0.3);
    if (rows > 0) {
      text('Agreement', x + 48, y + 150, 24, C.muted, 400, 'left', rows);
      text('120 USDC', x + 48, y + 236, 84, C.ink, 600, 'left', eo(rows));
      STEPS.forEach((label, i) => {
        const a = T.steps[0] + i * 0.35;
        const done = eb(P(t, a, a + 0.35));
        const cy = y + 320 + i * 62;
        ctx.beginPath();
        ctx.arc(x + 64, cy - 8, 14 * Math.max(0.6, done), 0, Math.PI * 2);
        ctx.fillStyle = done > 0.01 ? C.accent : C.line;
        ctx.fill();
        text(label, x + 96, cy, 30, done > 0.5 ? C.ink : C.muted, 500, 'left', rows);
      });
    }

    // Money lands: a badge with a small overshoot, then a held line.
    const land = P(t, ...T.land);
    if (land > 0) {
      const s = eb(land);
      ctx.save();
      ctx.translate(x + w - 150, y + 210);
      ctx.scale(s, s);
      fillRR(-96, -36, 192, 72, 36, C.accent);
      text('Paid', 0, 12, 32, C.accentInk, 600, 'center');
      ctx.restore();
    }
  });

  // Brand close, outside the camera so it never scales.
  const brand = eo(P(t, ...T.brand));
  if (brand > 0) {
    text('Your brand', W / 2, H - 150 + (1 - brand) * 30, 64, C.ink, 600, 'center', brand);
    text('yourbrand.com', W / 2, H - 92 + (1 - brand) * 30, 28, C.muted, 400, 'center', brand);
  }
}

/* ---------- player and renderer contract ---------- */
let now = 0, playing = false, last = 0;
function draw(t) { now = clamp(t, 0, DURATION); scene(now); }
window.setTime = t => draw(t);
window.ready = document.fonts.ready.then(() => { draw(0); return { width: W, height: H, fps: FPS, duration: DURATION }; });

function loop(ts) {
  if (!playing) return;
  now += (ts - last) / 1000;
  last = ts;
  if (now >= DURATION) { now = DURATION; playing = false; }
  draw(now);
  requestAnimationFrame(loop);
}
addEventListener('keydown', e => {
  if (e.code === 'Space') { playing = !playing; last = performance.now(); if (playing) requestAnimationFrame(loop); }
  if (e.code === 'ArrowRight') draw(now + 1);
  if (e.code === 'ArrowLeft') draw(now - 1);
  if (e.key === '.') draw(now + 1 / FPS);
  if (e.key === ',') draw(now - 1 / FPS);
});
