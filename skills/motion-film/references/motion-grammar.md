# Motion grammar

Pick a grammar in the motion study and keep it for the whole film.

## Timing

| Move | Duration | Easing |
|---|---|---|
| Focus change (highlight, underline, colour) | 0.25 to 0.4 s | ease-out cubic |
| Element entrance (card, label, row) | 0.45 to 0.7 s | ease-out quint, optional small overshoot |
| Object transformation (message to agreement) | 0.9 to 1.6 s | ease-in-out cubic |
| Camera move (push, pull, pan) | 1.2 to 3 s | ease-in-out cubic, never linear |
| Stagger between siblings | 0.06 to 0.12 s | same easing as the entrance |
| Hold after a statement | 0.3 s per word, minimum 1.2 s | none |

Do not give every object the same spring. Overshoot is for small, light things (a badge, a coin), never for text blocks or the camera.

## Easing helpers (already in `templates/film.js`)

```js
const eo  = p => 1 - Math.pow(1 - p, 3);          // ease-out cubic
const eo5 = p => 1 - Math.pow(1 - p, 5);          // ease-out quint
const eio = p => p < .5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2;
const eb  = p => 1 + 2.6*Math.pow(p - 1, 3) + 1.6*Math.pow(p - 1, 2); // small overshoot
const P   = (t, a, b) => clamp((t - a) / (b - a)); // progress of t between a and b
```

A scene reads only `t`: `const p = eo(P(t, 3.2, 3.8))`.

## Continuity

Every transition preserves something:

- **Match cut:** the same shape or word ends one scene and begins the next (a date in a receipt becomes the date in a record).
- **Morph:** one object changes content while keeping its frame position.
- **Camera move:** pull back to reveal where the object belongs, or push in to the detail that matters.
- **Carry:** an object travels across the boundary between scenes.

## Typography

- One family, two or three weights. Large type for the idea, small type for labels.
- A scale on a ratio (for 1080p: 120, 84, 60, 42, 30, 22 px). Labels never under 22 px at 1080p, since they are read on phones.
- Sentence case. Numbers in tabular figures. Keep text inside 90% safe margins.

## Composition

- One focal point per frame. If two things move, one of them is secondary and quieter.
- Generous negative space; let the background breathe.
- Colour has a job: the accent marks the one selected thing or the action, not decoration.

## Social cuts

Re-compose each scene for 9:16 and 1:1. Stack what sat side by side, enlarge type for the smaller canvas, move labels away from the platform's UI zones (top 12% and bottom 18% on vertical video). Never centre-crop a 16:9 master.

## Things that read as amateur

- Linear motion, especially on the camera.
- Everything entering at once, or everything with the same delay.
- Text that moves while it should be read.
- Floating dashboard cards with no relationship between them.
- Gradients, glows and orbs standing in for an idea.
- A logo sting longer than the message.
