# Architecture

The project is a deterministic Remotion renderer. All artwork is drawn with React
and SVG; animation values are functions of the current frame and the composition
FPS. No external video-generation or AI model is used.

## Rendering path

`src/Root.tsx` registers the original Elements and HelloWorld compositions and
the portrait, landscape, and preview story compositions. `src/stories/` contains
authored story data. `src/story/StorySchema.ts` validates it and calculates the
frame count; `src/story/StoryVideo.tsx` lays out scenes and audio tracks.

Scenes use reusable backgrounds and objects from `src/components/`, plus the
SVG character in `src/characters/`. Scene coordinates are normalized from 0 to
1 so the same story can be composed at portrait or landscape dimensions.

## Determinism

The current Remotion frame and FPS drive all pose, caption, transition, and
audio-volume calculations. There are no timers or random animation values.
Scene transitions overlap in frame space while the overall duration remains
the sum of the configured scene durations.

## Extension points

- Add a pose in `src/characters/animations.ts` and include it in the action
  schema.
- Add an SVG object in `src/components/StoryObject.tsx` and its type in the
  story schema.
- Add a scene backdrop in `src/components/Background.tsx`.
- Add a new story object in `src/stories/` and register its composition.
- Add local audio under `public/` and refer to it with a path relative to that
  directory.

Current intentional limits: the demo has no bundled sound assets; there is no
TTS, automated script generation, long-form editor, or social-media uploader.
