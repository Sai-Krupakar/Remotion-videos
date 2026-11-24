# Scene engine

The example story is `src/stories/a-normal-day.ts`. A story has an ID, title,
canvas dimensions, FPS, optional audio tracks, and an ordered array of scenes.
Each scene configures a duration, background, characters, objects, captions,
optional camera zoom, and optional scene-local audio.

The Zod schema in `src/story/StorySchema.ts` validates IDs and values, requires
at least one scene, and checks transition and caption timing. Scene positions
are normalized fractions of the composition width and height. Caption and audio
times are seconds relative to the containing scene (global story audio starts
at the full video timeline).

## Example

```ts
{
  id: "opening",
  durationSeconds: 4,
  transitionSeconds: 0.3,
  background: "bedroom",
  characters: [{
    id: "main",
    action: "sleeping",
    expression: "happy",
    x: 0.5,
    y: 0.82,
    scale: 1
  }],
  objects: [],
  captions: [],
  audioTracks: []
}
```

Supported backgrounds are bedroom, room, street, park, night, and solid.
Supported reusable props include beds, clocks, alarms, obstacles, chairs,
tables, doors, phones, boxes, trees, cars, houses, and laptops. The camera
supports configurable zoom and zoom origin.

Captions support start/end times, safe-area placement, dialogue styling,
keywords, and optional word timing records. Without timestamps, words reveal
progressively over the configured caption interval.
