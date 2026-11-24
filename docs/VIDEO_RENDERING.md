# Video rendering

Run Remotion Studio with `npm run dev`. The Stickman Stories folder contains:

- `StickmanStory`: 1080 x 1920 portrait.
- `StickmanStoryPreview`: 720 x 1280 portrait.
- `StickmanStoryLandscape`: 1920 x 1080 landscape.

Render the demo from PowerShell or another terminal:

```console
npm run render -- --video stickman-story-001
npm run render -- --video stickman-story-001 --resolution portrait-720
npm run render -- --video stickman-story-001 --resolution landscape-1080 --concurrency 1
```

Files are written to `outputs/` by default, using H.264 MP4 and a conservative
concurrency of 1. Concurrency 2 is also accepted; avoid parallel renders on
memory-constrained machines. `--output <path>` can override the output filename.
The helper reuses Chrome/Edge when detected or accepts
`--browser-executable <path>` to select one explicitly.

An equivalent direct render uses `npx remotion render src/index.ts
StickmanStory outputs/story.mp4 --codec=h264 --concurrency=1`.

Optional voiceover, music, and sound effects use local files only. Put media
inside `public/` (for example `public/audio/voiceover.wav`) and reference it as
`audio/voiceover.wav`; tracks support start time, duration, volume, and fades.
No copyrighted music or external API is downloaded by the project.
