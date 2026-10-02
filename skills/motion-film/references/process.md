# Process and gates

## 1. Brief

Write it down before any picture. One page, these headings:

- **Goal:** what the viewer should think, feel or do after watching. One sentence.
- **Audience and channel:** who watches, where (X, LinkedIn, YouTube, a landing page, a pitch), sound on or off by default.
- **Length and formats:** master length; aspect ratios needed (16:9, 9:16, 1:1). Each extra ratio is re-composed, not centre-cropped.
- **Voice:** client's recording, no voice, or an approved synthetic voice with its licence.
- **Brand:** logo files, fonts, colours, words to use and avoid.
- **Truth boundaries:** a table of every claim the film might make, with its status: live, testnet or beta, planned, illustrative. Anything not on the table does not go on screen.
- **Deadline and review rounds.**

## 2. Reference study

For each reference video:

```bash
# overall shape: one frame every 1.5 s, tiled
ffmpeg -i ref.mp4 -vf "fps=2/3,scale=384:-1,tile=4x6" -frames:v 1 ref-contact.jpg
# motion detail: 12 frames across 4 s from a chosen moment
ffmpeg -ss 5 -i ref.mp4 -t 4 -vf "fps=3,scale=480:-1,tile=4x3" -frames:v 1 ref-motion.jpg
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate -of json ref.mp4
```

Write down: length, cut rhythm, how many ideas per scene, how transitions carry objects, type scale, how long text holds, where the logo lands, what the sound does. Name what to borrow (pacing, a device) and what belongs to the reference (its art, music, brand). Never put reference pixels in the export.

## 3. Directions

Offer two to four. Each one has:

- a title and the opening line;
- a time table (time, picture and motion, spoken idea or on-screen text);
- motion character in one sentence;
- its truth boundary;
- your recommendation and why.

Ask the client to pick one. Do not storyboard several in parallel.

## 4. Script and storyboard

Script for speech: short sentences, one idea each, numbers spoken the way people say them. Run the script through a plain-language edit (cut filler, inflated claims, AI-sounding phrasing). Then the storyboard: a row per beat with time, picture, motion, text, sound.

If there is a voiceover, record or generate it before building, and key the timeline to word timings (see `sound-design.md`). Picture follows voice, not the other way round.

## 5. Motion study

Build 6 to 8 seconds at final quality: the hardest transition plus one hold. Render it (`node render.cjs study`) and show it. This is where the client approves the look, the type, the easing and the sound character. Do not continue until it is approved.

## 6. Build

Build scene by scene on the locked timeline. After each scene, render proof stills at its key times and look at them. Keep a `proof` list in `film.config.json` that covers every transition's start, middle and end.

## 7. Sound, 8. Render, 9. QC

See `sound-design.md`, `templates/render.cjs` and `qc-checklist.md`.

## Resources

Rendering is CPU-bound and holds one browser page. One render at a time. On a machine with little free memory, render remotely or in a container with a memory cap (`docker run --memory 3g --cpus 1 ...`). Clean up temporary frames and containers afterwards.

## Delivery notes (always include)

- What the film shows and what it labels as illustrative or planned.
- Provenance: fonts, logo, any third-party material and its licence, voice source and licence.
- Files delivered and the QC results.
- How to regenerate: commands, and which file to edit for copy changes.
