# Motion film skill

An agent skill for making professional motion videos (adverts, launch films, educational explainers and product walkthroughs) as code. Your agent writes the brief, proposes directions, and builds scenes in HTML canvas on a frame-exact timeline. It renders every frame with headless Chromium, writes original sound from oscillators, encodes with FFmpeg and hands you a QC report that proves the export.

It came out of producing a series of product films. The method that held up was the same each time:

- **Approve before building.** Brief, direction, script, then a 6 to 8 second motion study before the full render.
- **Every claim checked.** Each claim on screen is either true today or labelled as illustration or planned.
- **Original pixels and sound.** References are studied for pacing, never copied.
- **The same source renders the same film.** Scenes read only the time `t`.
- **Done means measured.** Frame count, codec, loudness and a frame-by-frame look.

## What you get

```
skills/motion-film/
  SKILL.md                    the workflow and the rules the agent follows
  references/
    process.md                brief, reference study, directions, gates, delivery notes
    motion-grammar.md         timing, easing, continuity, type, social cuts
    sound-design.md           foley, score, voice timing, ducking, loudness, captions
    formats.md                advert, marketing film, explainer, tutorial patterns
    qc-checklist.md           measured and visual checks, the delivery set
  templates/                  a working 10-second demo film to start from
    film.html  film.js  film.config.json
    render.cjs                proof stills, motion study, full render, QC
    sound.cjs  mix.cjs        original sound bed and loudness-normalised mix
  examples/prompts.md         prompts for each kind of video
```

## Install

Pick one.

**Skill Fish** (installs into every agent it finds: Claude Code, Cursor, Copilot, Codex, Gemini CLI and more):

```bash
npx skillfish add Iziedking/motion-film-skill
```

**npx, straight from GitHub** (Claude Code by default):

```bash
npx github:Iziedking/motion-film-skill
# other agents:
npx github:Iziedking/motion-film-skill --agent cursor
npx github:Iziedking/motion-film-skill --agent codex
# a project instead of your user folder:
npx github:Iziedking/motion-film-skill --project
```

**Manual:**

```bash
git clone https://github.com/Iziedking/motion-film-skill
cp -r motion-film-skill/skills/motion-film ~/.claude/skills/
```

On Windows PowerShell: `Copy-Item -Recurse motion-film-skill\skills\motion-film $HOME\.claude\skills\`

Restart your agent (or start a new session) so it picks up the skill.

## Requirements for rendering

- Node.js 18 or newer
- FFmpeg and FFprobe on your PATH (`ffmpeg -version` should work)
- Chromium for Playwright: in your film folder, `npm install` then `npx playwright install chromium`
- About 2 GB of free memory for a 1080p render. On a small machine, render on a server or in a container.

## Try it

Ask your agent:

> Use the motion-film skill. Make a 15-second advert for my bakery's new order-online page. Start with the brief and two directions.

Or run the demo film yourself:

```bash
cp -r ~/.claude/skills/motion-film/templates my-film
cd my-film
npm install && npx playwright install chromium
node render.cjs proof     # stills in output/
node render.cjs render    # output/demo-film.mp4 with sound
node render.cjs qc        # qc.json, audio-qc.txt, contact sheet, strips
```

Open `film.html` in a browser to scrub: Space plays, arrows seek a second, comma and period step a frame.

More prompts are in [`skills/motion-film/examples/prompts.md`](skills/motion-film/examples/prompts.md).

## What it will not do

- Copy footage, music or artwork from a reference.
- Put invented customers, metrics, testimonials or partner logos on screen.
- Use a synthetic voice, stock music or generated imagery unless you approve it and its licence is recorded.

## Licence

MIT. See [LICENSE](LICENSE).
