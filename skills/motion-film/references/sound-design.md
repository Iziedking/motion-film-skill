# Sound design

Sound is built from cue times, the same way the picture is. `templates/sound.cjs` writes a 48 kHz stereo WAV from oscillators and seeded noise, so it is original and repeatable.

## Layers

1. **Foley:** short sounds that confirm motion: whoosh (camera, card entrance), pop and click (UI), tick (step completes), coin and chime (money lands, success), thud (something settles), paper flip, lock. Place each at the frame the motion starts, not where it ends.
2. **Score:** sparse. A pad and a few plucked notes set the mood; a key change marks the turn of the story. No melody competing with a voice.
3. **Ambience:** room tone, hum, waves, a clock, used for one scene each and faded.
4. **Voice:** placed clip by clip on the timeline.

## Voice and timing

Record one sentence per clip. Transcribe each clip with word timestamps (any speech-to-text that returns word timings). Write `timeline.json`:

```json
{ "fps": 30, "duration": 42.0,
  "scenes": { "s1": { "start": 0.6, "words": [ { "w": "You", "s": 0.62, "e": 0.78 } ] } } }
```

Key picture beats to words: `wt('s1', 'finished')` returns the time the word starts. When the voice is re-recorded, the picture moves with it.

## Ducking and loudness

- Duck the score to about 40% under every spoken word (attack 150 ms before, release 300 ms after).
- Normalise the final mix to -15 LUFS integrated for social, -16 for the web, true peak at or under -1.5 dBTP. `templates/mix.cjs` does this with FFmpeg `loudnorm`.
- Deliver a sound-only mix (no voice, score not ducked) and a silent master as well.

## Captions

Burn captions in for social (most people watch muted). Take the words from the transcription of the delivered voice, not the script. Two lines maximum, 32 to 42 characters per line, sentence case, never over faces or key UI. Deliver an `.srt` too.

## Checks

```bash
ffmpeg -hide_banner -i film.mp4 -af ebur128=peak=true -f null - 2> audio-qc.txt
```

Read integrated loudness (I) and true peak from the summary at the end of the file.
