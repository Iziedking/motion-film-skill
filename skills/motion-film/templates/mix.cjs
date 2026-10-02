'use strict';
/* Lays voice clips over the sound bed and normalises loudness in two passes:
   measure first, then apply a linear correction, which lands on target even
   for short or sparse films where single-pass loudnorm drifts.

   Voice clips are optional: list them in voice.json as [["vo/s1.wav", 0.6], ...]
   (file, start second). The bed is lowered to 55% under a voice; duck it per
   word in sound.cjs if the score competes with speech. */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'film.config.json'), 'utf8'));
const out = path.resolve(__dirname, cfg.output || 'output');
const voicePath = path.join(__dirname, 'voice.json');
const clips = fs.existsSync(voicePath) ? JSON.parse(fs.readFileSync(voicePath, 'utf8')) : [];
const { integrated, truePeak } = cfg.loudness;

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stderr;
}

// 1. Place the voice over the bed, unnormalised.
const premix = path.join(out, 'premix.wav');
const args = ['-loglevel', 'error', '-y', '-i', path.join(out, 'sound.wav')];
let filter;
if (clips.length) {
  const parts = [];
  clips.forEach(([file, start], i) => {
    args.push('-i', path.join(__dirname, file));
    const ms = Math.round(start * 1000);
    parts.push(`[${i + 1}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${ms}|${ms}[v${i}]`);
  });
  parts.push(`${clips.map((_, i) => `[v${i}]`).join('')}amix=inputs=${clips.length}:normalize=0[vo]`);
  parts.push('[0:a]volume=0.55[bed]');
  parts.push(`[bed][vo]amix=inputs=2:normalize=0,apad,atrim=0:${cfg.duration}[out]`);
  filter = parts.join(';');
} else {
  filter = `[0:a]apad,atrim=0:${cfg.duration}[out]`;
}
ffmpeg([...args, '-filter_complex', filter, '-map', '[out]', '-c:a', 'pcm_s16le', premix]);

// 2. Measure.
const target = `I=${integrated}:TP=${truePeak}:LRA=11`;
const log = ffmpeg(['-i', premix, '-af', `loudnorm=${target}:print_format=json`, '-f', 'null', '-']);
const m = JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1));

// 3. Apply with the measured values, linear where possible.
ffmpeg([
  '-loglevel', 'error', '-y', '-i', premix,
  '-af', `loudnorm=${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`,
  '-c:a', 'pcm_s16le', path.join(out, 'mix.wav'),
]);
fs.rmSync(premix, { force: true });
console.log(`mix.wav normalised from ${m.input_i} LUFS to ${integrated} LUFS target`);
