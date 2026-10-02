'use strict';
/* Frame-exact render of film.html with headless Chromium, encoded by FFmpeg.

   node render.cjs proof    stills at config.proof times
   node render.cjs study    the motion-study window (config.study) as an MP4
   node render.cjs render   full silent master, sound bed, mixed master
   node render.cjs qc       measured checks, contact sheet, transition strips

   Needs: Node 18+, FFmpeg and FFprobe on PATH, `npm install` (playwright-core)
   and a Chromium (`npx playwright install chromium`, or set CHROMIUM_PATH). */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const { pathToFileURL } = require('node:url');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'film.config.json'), 'utf8'));
const out = path.resolve(__dirname, cfg.output || 'output');
fs.mkdirSync(out, { recursive: true });
const mode = process.argv[2];
const silent = path.join(out, `${cfg.title}-silent.mp4`);
const master = path.join(out, `${cfg.title}.mp4`);

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr || r.status}`);
  return r.stdout;
}

async function openFilm() {
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--disable-gpu', '--disable-dev-shm-usage', '--font-render-hinting=none', '--force-color-profile=srgb'],
  });
  const page = await browser.newPage({ viewport: { width: cfg.width, height: cfg.height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(pathToFileURL(path.join(__dirname, 'film.html')).href);
  const meta = await page.evaluate(() => window.ready);
  if (meta.duration !== cfg.duration || meta.fps !== cfg.fps) {
    throw new Error(`film.js says ${meta.duration}s at ${meta.fps} fps, film.config.json says ${cfg.duration}s at ${cfg.fps} fps`);
  }
  const canvas = await page.$('canvas');
  return { browser, page, canvas, errors };
}

async function encode(from, to, target) {
  const { browser, page, canvas, errors } = await openFilm();
  const enc = spawn('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-vcodec', 'png', '-framerate', String(cfg.fps), '-i', 'pipe:0',
    '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-movflags', '+faststart', target,
  ], { stdio: ['pipe', 'ignore', 'pipe'] });
  let log = '';
  enc.stderr.on('data', (d) => (log += d));
  const done = once(enc, 'exit');
  const first = Math.round(from * cfg.fps), last = Math.round(to * cfg.fps);
  const started = Date.now();
  for (let f = first; f < last; f++) {
    await page.evaluate((t) => window.setTime(t), f / cfg.fps);
    const png = await canvas.screenshot({ type: 'png' });
    if (!enc.stdin.write(png)) await once(enc.stdin, 'drain');
    if ((f - first) % (cfg.fps * 3) === 0) console.log(`frame ${f - first}/${last - first}, ${Math.round((Date.now() - started) / 1000)}s`);
  }
  enc.stdin.end();
  const [code] = await done;
  await browser.close();
  if (code !== 0) throw new Error(log);
  if (errors.length) throw new Error(`page errors:\n${errors.join('\n')}`);
}

async function proof() {
  const { browser, page, canvas, errors } = await openFilm();
  for (const t of cfg.proof) {
    await page.evaluate((v) => window.setTime(v), t);
    await canvas.screenshot({ path: path.join(out, `proof-${String(t).replace('.', '_')}.png`) });
  }
  await browser.close();
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`${cfg.proof.length} proof stills in ${out}`);
}

function qc() {
  const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', master]));
  const v = probe.streams.find((s) => s.codec_type === 'video');
  const a = probe.streams.find((s) => s.codec_type === 'audio');
  const expected = Math.round(cfg.duration * cfg.fps);
  const failures = [];
  if (v.width !== cfg.width || v.height !== cfg.height) failures.push('dimensions');
  if (v.codec_name !== 'h264' || v.pix_fmt !== 'yuv420p') failures.push('codec');
  if (v.r_frame_rate !== `${cfg.fps}/1`) failures.push('frame rate');
  if (Math.abs(Number(v.nb_read_frames) - expected) > 1) failures.push(`frame count ${v.nb_read_frames}/${expected}`);
  if (!a || a.codec_name !== 'aac') failures.push('audio');
  run('ffmpeg', ['-v', 'error', '-i', master, '-f', 'null', '-']);

  const loud = spawnSync('ffmpeg', ['-hide_banner', '-i', master, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).stderr;
  fs.writeFileSync(path.join(out, 'audio-qc.txt'), loud);
  const I = Number((loud.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop()?.match(/-?[\d.]+/)[0]);
  const peak = Number((loud.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop()?.match(/-?[\d.]+/)[0]);
  if (Number.isFinite(I) && Math.abs(I - cfg.loudness.integrated) > 1) failures.push(`loudness ${I} LUFS`);
  if (Number.isFinite(peak) && peak > cfg.loudness.truePeak + 0.1) failures.push(`true peak ${peak} dBTP`);

  const cols = 4, rows = Math.ceil(Math.min(24, Math.max(4, cfg.duration)) / cols);
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', master, '-vf', `fps=${(cols * rows) / cfg.duration},scale=480:-1,tile=${cols}x${rows}`, '-frames:v', '1', path.join(out, 'contact-sheet.jpg')]);
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(cfg.duration * 0.4), '-i', master, '-frames:v', '1', path.join(out, 'poster.jpg')]);
  for (const t of cfg.proof) {
    run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(Math.max(0, t - 1)), '-i', master, '-t', '2', '-vf', 'fps=8,scale=480:-1,tile=4x4', '-frames:v', '1', path.join(out, `strip-${String(t).replace('.', '_')}.jpg`)]);
  }

  const report = {
    passed: failures.length === 0, failures,
    width: v.width, height: v.height, codec: v.codec_name, pixelFormat: v.pix_fmt, fps: v.r_frame_rate,
    frames: Number(v.nb_read_frames), expectedFrames: expected, duration: Number(probe.format.duration),
    loudnessLUFS: I, truePeakDb: peak, bytes: Number(probe.format.size),
    sha256: crypto.createHash('sha256').update(fs.readFileSync(master)).digest('hex'),
  };
  fs.writeFileSync(path.join(out, 'qc.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 1;
}

async function main() {
  if (mode === 'proof') return proof();
  if (mode === 'study') {
    const [a, b] = cfg.study;
    await encode(a, b, path.join(out, `${cfg.title}-study.mp4`));
    run('node', [path.join(__dirname, 'sound.cjs'), String(a), String(b)]);
    run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(out, `${cfg.title}-study.mp4`), '-i', path.join(out, 'sound.wav'), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', path.join(out, `${cfg.title}-study-sound.mp4`)]);
    return console.log('Motion study rendered.');
  }
  if (mode === 'render') {
    await encode(0, cfg.duration, silent);
    run('node', [path.join(__dirname, 'sound.cjs')]);
    run('node', [path.join(__dirname, 'mix.cjs')]);
    run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', silent, '-i', path.join(out, 'mix.wav'), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(cfg.duration), '-movflags', '+faststart', master]);
    return console.log(`Rendered ${master}`);
  }
  if (mode === 'qc') return qc();
  throw new Error('Usage: node render.cjs proof|study|render|qc');
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
