---
name: motion-film
description: Produce a professional motion video (product film, advert, explainer or tutorial) as deterministic code: authored vector scenes in HTML canvas, a frame-exact timeline, original synthesized sound, FFmpeg render and measured QC. Use when someone asks for a marketing video, an ad, a launch film, an educational explainer, a social cut (16:9, 9:16, 1:1) or a motion study, and wants a finished MP4 they can publish, not a storyboard alone.
---

# Motion film

A film made the way software is made: a script that becomes a timeline, scenes that are pure functions of time, a renderer that captures every frame, and a QC report that proves the export. Nothing depends on playback speed, so the same source always renders the same film.

Read `references/process.md` before starting. It holds the gates. The other references are loaded when their phase begins.

## The non-negotiables

1. **Approval gates.** Brief, then direction, then script and storyboard, then a 6 to 8 second motion study, then the full build. Never render the full film before the motion study is approved. A change of direction after the study costs minutes; after the build it costs hours.
2. **Truth boundaries.** Every claim on screen is either true today, labelled ("Illustration", "Planned", "Testnet", "Example figures"), or cut. No invented customers, metrics, testimonials, partner logos or prices. Write the boundaries down in the brief and check every frame against them at QC.
3. **Original pixels and sound.** Authored vector art, the client's real logo and fonts, original synthesized foley and score. References are studied for pacing and devices, never copied. No stock footage, stock music or generated imagery unless the client asks for it in writing, and then credited.
4. **Voice.** The client's recorded voice by default. A synthetic voice only with explicit approval, and its licence is stated in the delivery notes. Captions are taken from the delivered audio, never from the script.
5. **Deterministic time.** Every scene reads only `t`. No `Date.now()`, no `requestAnimationFrame` state, no unseeded randomness. `window.setTime(t)` draws frame `t` exactly.
6. **Object continuity.** Each transition carries an object or idea from one scene into the next (a message becomes an agreement, a receipt becomes a record). A cut between unrelated cards is a slideshow, not a film.
7. **Readable holds.** After every material statement, hold long enough to read it twice on a phone: about 0.3 s per word, never under 1.2 s for a line that matters.
8. **Measure, don't eyeball.** Deliver `qc.json` (frames, duration, codec, dimensions, hash, decoder errors), `audio-qc.txt` (integrated loudness, true peak) and a contact sheet. A film is done when QC passes and the frames have been looked at, not when the encode finishes.

## Workflow

| Phase | Output | Reference |
|---|---|---|
| 1 Brief | Goal, audience, channel, length, aspect ratios, voice, truth boundaries, brand assets, deadline | `process.md` |
| 2 Reference study | Contact sheets and dense frame strips of each reference, notes on pacing and devices | `process.md` |
| 3 Directions | Two to four directions, each with a one-line idea, a time table, motion character and truth boundary | `formats.md` |
| 4 Script and storyboard | Spoken lines or on-screen text per beat, with timings | `formats.md` |
| 5 Motion study | 6 to 8 s at final finish, rendered | `motion-grammar.md` |
| 6 Build | `film.js` scenes on the approved timeline | `motion-grammar.md` |
| 7 Sound | Foley, score, voice placement, ducking, loudness | `sound-design.md` |
| 8 Render | Silent master, mixed master, sound-only, captions, social cuts | `templates/render.cjs` |
| 9 QC and delivery | `qc.json`, `audio-qc.txt`, contact sheet, transition strips, poster, notes | `qc-checklist.md` |

## Starting a film

Copy `templates/` into a new working folder, then:

```bash
npm install                 # playwright-core for headless Chromium
npx playwright install chromium
node render.cjs proof       # stills at the times listed in film.config.json
node render.cjs study       # the motion study window only
node render.cjs render      # full silent master, then sound.cjs, then the mix
node render.cjs qc          # measured checks and contact sheets
```

`film.config.json` holds title, size, fps, duration, proof times and the study window. `film.js` holds the scenes. `sound.cjs` writes the original sound bed from cue times. `mix.cjs` places voice clips and normalises loudness.

Open `film.html` in a browser while building: Space plays and pauses, arrow keys seek one second, `,` and `.` step one frame.

## Formats

- **Advert (6 to 30 s):** one product, one benefit, one action. Hook in the first second, logo and call to action held for at least 2 s at the end.
- **Marketing film (30 to 60 s):** one person, one situation, one change. A beginning, a turn and an ending; the product earns its entrance.
- **Educational explainer (60 to 180 s):** chapters with numbered titles, a running example with consistent figures, diagrams where every line means something, a recap.
- **Tutorial:** real product captures for the actions that need proof, authored scenes for the ideas a recording cannot show.

Details, time tables and script patterns are in `references/formats.md`.

## When to stop and ask

- The brief has no truth boundary for a claim the script needs.
- A reference would have to be copied to meet the request.
- The client asks for a synthetic voice, stock music or generated imagery without stating the licence.
- Render resources are short (under 3 GB free memory): render on a remote machine or in a bounded container, one render at a time.
