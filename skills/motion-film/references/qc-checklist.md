# QC checklist

`node render.cjs qc` produces the measured part. The rest is a look, frame by frame.

## Measured (must all pass)

- [ ] Dimensions, frame rate and codec match the brief (default 1920x1080, 30/1, H.264, yuv420p, AAC 48 kHz).
- [ ] Decoded frame count equals duration x fps; duration within one frame of the timeline.
- [ ] FFmpeg decodes the whole file with no errors.
- [ ] Integrated loudness within 1 LU of target; true peak at or under -1.5 dBTP.
- [ ] `qc.json` written with the file hash.

## Looked at

- [ ] Contact sheet: no blank frames, no frame where nothing is in focus.
- [ ] Transition strips (8 fps across 2 s) for every transition: no pop, no seam, no jump in easing.
- [ ] Every line of text readable on a phone at the size it is shown, and held long enough.
- [ ] Nothing clipped at the frame edges or in the social cut's platform UI zones.
- [ ] Every claim matches the brief's truth table; labels present and readable.
- [ ] Logo, fonts and colours are the client's own; no reference pixels.
- [ ] Captions match the delivered voice word for word and are in sync.
- [ ] Sound: foley lands on motion, nothing clips, voice always above the score.

## Delivery set

- Mixed master, silent master, sound-only master.
- Social cuts that were briefed (9:16, 1:1), each re-composed.
- `.srt` captions, poster frame, contact sheet, `qc.json`, `audio-qc.txt`.
- Editable source and a README with the regeneration commands and provenance.
