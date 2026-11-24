# Character engine

`src/characters/Stickman.tsx` draws a character with a consistent SVG skeleton.
Each instance receives an ID, action, expression, normalized position, scale,
rotation, line color, and head color from its scene configuration.

## Actions

Idle, walking, running, jumping, falling, sitting, standing up, waving, talking,
thinking, pointing, celebrating, looking around, shaking the head, reacting with
surprise, sleeping, and stretching are implemented by deterministic pose
functions in `animations.ts`.

The expression schema supports neutral, happy, sad, angry, surprised, confused,
crying, laughing, scared, and thinking faces. Face geometry is rendered with
the same head proportions for every action.

## Adding an action

Add the action name to `characterActionSchema` in `src/story/StorySchema.ts`,
then add a frame-based case to `getCharacterPose` in
`src/characters/animations.ts`. Return joint angles and offsets; do not use
timers or random values. Use the existing `StoryCharacter` type at the
component boundary.

Character `x` and `y` values are normalized (`0` to `1`) relative to the frame.
Scale is relative to the original 1080 x 1920 design size.

## Explainer style and movement

Set `characterType: "explainer"` for a black round head with white eyes and
simple limbs. The original `stickman` and `nw052` styles are unchanged. See
`src/stories/garden-explainer.ts` for an example using a garden, bees, flowers
and compact highlighted captions.

Add an optional `motion` array to a character to move and change actions within
one scene:

```ts
motion: [
  { timeSeconds: 2, x: 0.6, y: 0.8, action: "pointing" },
  { timeSeconds: 3, x: 0.6, y: 0.8, action: "waving" },
]
```

Coordinates ease from the character's initial position to each keyframe.
Actions blend over 0.3 seconds after each keyframe. Times are scene-local,
strictly increasing, and must fall before the scene ends. Motion is opt-in;
characters without keyframes keep their previous behavior.

## Toon style, camera and scripted staging

Set `characterType: "toon"` for the cartoon stickman with a white outlined
head, hair tufts, expressive eyebrows, white gloves, sneakers and a ground
shadow. Its eyes and shoes turn toward the walking direction. Add
`accessory: "cap"` or `"bow"` to tell characters apart.

Scenes can also use:

- `cameraMotion`: keyframes of `{ timeSeconds, x, y, zoom, ease }`. `x`/`y`
  is the focus point, `zoom` is 1-3, and `ease: "cut"` makes an instant
  punch-in instead of a smooth move. The sky moves at a slower rate for depth.
- `letterbox: true` for dramatic black bars, and `tags` for pop-in pill labels.
- Object `appearSeconds` (pop-in) and object `motion` keyframes (e.g. a falling
  seed or a flying bee). Flowers, sprouts, trees and plants sway; clouds drift.

`src/story/scriptToStory.ts` builds a whole video from a staged script such as
`src/stories/little-seed-script.json`. Each narration line becomes one shot
with:

| Field | Values |
| --- | --- |
| `place` | a named place from the script's `places` (defaults to the scene's place) |
| `location` | `sidewalk`, `garden`, `living-room`, `park`, `street`, `room`, ... (overrides the place background) |
| `take` | ids of kept props to pick up and remove from their place |
| `move` | `stay`, `walk`, `run`, `enter-left`, `enter-right`, `exit-left`, `exit-right`, with optional `to` (0-1) |
| `action`, `expression` | any character action or expression, used once the move ends |
| `camera` | `wide`, `push-in` (default), `pull-out`, `close-up`, `punch-in`, `follow`, `prop` |
| `props` | `{ id, keep, type, x, y, scale, rotation, appear, from: [x, y], at, carry }` |
| `cast` | extra characters `{ id, x, enter, to, action, expression, accessory }` |
| `tag`, `highlight`, `letterbox` | top label, highlighted caption words, black bars |
| `voice`, `voiceSpeed` | per-line narration voice override (see README) |

Continuity: `places` maps a name to `{ location, props }`. A prop with
`keep: true` is remembered by its place and drawn (at its final position) in
every later shot there; reusing its `id` replaces it, e.g. a sprout growing
into a flower. A kept id appearing in a different place throws a
`Continuity` error unless a line first `take`s it. Pip's position carries
over between shots in the same place. Captions are
split into short phrases and timed to the narration. Shot length is the line's
audio plus `pauseSeconds` (script level, default 0.25); prop `appear`/`at`
and camera times are clamped to fit. Set `shotSeconds` only to force a fixed
length for every shot.
