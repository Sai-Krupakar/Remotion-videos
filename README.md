# Stickman Story Video Generator

A Remotion, React, TypeScript, and SVG foundation for building deterministic
stickman story videos. Artwork and movement are rendered programmatically; no
AI video model or paid generation API is required.

## Requirements and setup

### New machine (Windows)

1. Install [Git](https://git-scm.com/downloads), [Node.js 20+](https://nodejs.org)
   and [Python 3.11](https://www.python.org/downloads/) (tick "Add python.exe to PATH").
   Google Chrome or Microsoft Edge is used for rendering if present.
2. Clone and run the one-time setup:

   ```powershell
   git clone https://github.com/Sai-Krupakar/Remotion-videos.git
   cd Remotion-videos
   powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
   ```

   It installs the npm packages, creates `.venv-local-video` with Piper TTS,
   downloads the six Piper voices into `voices/` (about 360 MB), and runs the
   tests. Add `-WithLocalAI` to also install the experimental local AI video
   packages, or `-SkipVoices` to skip the voice download. It is safe to re-run.
3. Render a video: `npm run render -- --video little-seed --resolution portrait-720`

Generated videos (`outputs/`), voices, Python and npm packages are not stored
in Git; the setup script recreates them. The narration clips in `public/audio`
are stored, so existing stories render without regenerating audio.

### Everyday commands

```console
npm run dev      # Remotion Studio preview
npm test         # tests
npm run lint     # ESLint + TypeScript
```

The Remotion Studio lists the original `Logo`, `Title`, and `HelloWorld`
compositions as well as portrait, landscape, and preview stickman stories.

## Architecture

- `src/characters/`: reusable SVG stickman and frame-based pose functions.
- `src/components/`: reusable backgrounds, SVG objects, and animated captions.
- `src/story/`: Zod schemas, timing validation, scene sequencing, audio, and
  story renderer.
- `src/stories/`: authored video configurations; `a-normal-day.ts` is the
  30-second demonstration.
- `docs/`: engine details, extension guidance, rendering, and roadmap.

## Create and animate characters

Each scene contains character IDs, action/expression names, normalized `x`/`y`
positions from 0 to 1, scale, rotation, and colors. Multiple characters can
share a scene. Implement actions as deterministic frame calculations in
`src/characters/animations.ts` and add their type to the story schema.

Supported actions include idle, walking, running, jumping, falling, sitting,
standing up, waving, talking, thinking, pointing, celebrating, looking around,
shaking the head, surprise, sleeping, and stretching. Expressions include
neutral, happy, sad, angry, surprised, confused, crying, laughing, scared, and
thinking.

## Create scenes and stories

Edit or copy `src/stories/a-normal-day.ts`. A story defines its title, size, FPS,
optional audio tracks, and ordered scenes. Scenes define duration, background,
objects, characters, captions, and optional camera zoom. Zod validates the
configuration before render and calculates scene timing in frames.

Coordinates are normalized so the same story works in portrait and landscape.
Scene duration is in seconds; transitions overlap adjacent scenes without
reducing the configured total duration.

Available backgrounds: bedroom, room, street, park, night, and solid. Available
objects: bed, clock, alarm, obstacle, chair, table, door, phone, box, tree, car,
house, and laptop.

## Captions and audio

Captions have scene-local start/end seconds, top/middle/bottom positioning,
optional dialogue styling, and keyword or word-level highlights. Words reveal
progressively when word timings are not supplied. For word-level timing, pass
`words` with text and start/end seconds.

Audio tracks are optional. Place voiceover, music, or sound-effect files in
`public/` and reference a path relative to that directory, such as
`audio/voiceover.wav`. Tracks support start time, duration, volume, and fade in
and out. No audio files or copyrighted assets are bundled.

## Render

```console
npm run render -- --video stickman-story-001
npm run render -- --video stickman-story-001 --resolution portrait-720
npm run render -- --video stickman-story-001 --resolution landscape-1080 --concurrency 1
npm run render -- --video garden-explainer --resolution portrait-720
npm run render -- --video little-seed --resolution portrait-720
```

Output defaults to `outputs/` as H.264 MP4. Resolutions are `portrait-1080`
(1080 x 1920), `portrait-720` (720 x 1280), and `landscape-1080`
(1920 x 1080). Use `--output <path>` to choose another output file.
`garden-explainer` is a short, silent demonstration of the new flat explainer
style and scene-local movement keyframes. Its visuals are original, inspired by
the reference style, not a reconstruction of the reference video. The existing
stickman and NW052 stories remain available. See `docs/CHARACTER_ENGINE.md` for
adding motion to a story; add voiceover as an audio track if desired.
`little-seed` is a narrated story (about 72 seconds). Its original script is in
`src/stories/little-seed-script.json`, and the generated transcript is in
`outputs/little-seed-script.txt`. Narration is made offline with the Piper neural
voice `en_US-ryan-medium` (the default); its clips and timings are stored with the project. Each shot lasts as long
as its line plus a short pause (`pauseSeconds`, default 0.25), so lines flow
without gaps. It uses the `toon`
character with camera moves, close-ups, punch-ins and scripted locations and
movement (see `docs/CHARACTER_ENGINE.md`).

To create a new video in this style:

1. Copy `src/stories/little-seed-script.json` to `src/stories/<name>-script.json`
   and write the lines, places, moves and camera shots. Define each real-world
   spot once under `"places"` and give scenes a `"place"`; props marked
   `"keep": true` (planted seeds, flowers, benches) then stay in that place for
   every later shot there, so the story stays consistent. Building fails if a
   kept prop shows up in another place without being picked up with `"take"`.
2. Generate narration (shots follow the audio length):
   ```powershell
   .\.venv-local-video\Scripts\python.exe scripts\create_narration.py --list-voices
   .\.venv-local-video\Scripts\python.exe scripts\create_narration.py --name <name>
   ```
   Choose the narrator with `"voice"` and `"voiceSpeed"` in the script (or
   `--voice` / `--speed`), and give any line its own `"voice"`, e.g. for a
   character speaking. Add `--overwrite` to regenerate. Voice ids:
   - `piper:en_US-ryan-medium` (default), `piper:en_US-lessac-medium`,
     `piper:en_US-amy-medium`, `piper:en_US-joe-medium`,
     `piper:en_GB-alan-medium`, `piper:en_GB-jenny_dioco-medium`
   - `windows:David`, `windows:Zira` (built-in, more robotic)

   Piper voices live in the git-ignored `voices/` folder. Add more from
   https://huggingface.co/rhasspy/piper-voices (download the `.onnx` and
   `.onnx.json` files into `voices/`). Piper is installed in
   `.venv-local-video` (`pip install piper-tts`).
3. Copy `src/stories/little-seed.ts`, point it at the new script, timings and
   `audio/<name>`, then register compositions in `src/Root.tsx` and the
   video ID in `scripts/render.mjs`.

## Experimental local AI video

The separate `local-video` experiment accepts an English topic, writes a short
script with a local language model, generates one video clip, adds a Windows
voice and approximate word-by-word captions, and exports a portrait MP4.
It is a proof of concept, not a way to reproduce the reference video's quality
or consistent characters across scenes. It generates one clip of about six
seconds at 8 fps; longer narration holds the last frame. Cropping its landscape
output to portrait may cut off important visual details. Model output may be
inaccurate or fail to answer the topic; check the narration before sharing,
especially for consequential topics.

On Windows, with Python 3.11, FFmpeg (including `ffprobe` and the `subtitles`
filter), and an NVIDIA GPU supported by CUDA:

```powershell
python -m venv .venv-local-video
.\.venv-local-video\Scripts\python.exe -m pip install --use-feature=truststore -r .\local-video\requirements.txt
.\.venv-local-video\Scripts\python.exe .\local-video\generate.py --topic "Why leaves change color"
```

The first run downloads roughly 15 GB of model weights in addition to Python
dependencies. It requires internet for the initial downloads; inference runs
locally afterward. Rendering may be very slow, and the 6 GB GPU configuration
completed one sample on an NVIDIA RTX A1000 laptop GPU; the diffusion stage
took about ten minutes. Performance and available memory vary by machine.
The resulting file is written to `outputs/`. Existing output files are not
overwritten. Use `--output <path>` to choose another file and `--steps <number>`
to adjust diffusion steps.

## Performance and known limits

For the stickman renderer, run one job at a time on an 8 GB machine;
concurrency defaults to 1 and is capped at 2. Preview at 720 x 1280 before
full-size renders. The stickman demo has no bundled sound. The experimental
AI pipeline above is separate and does not provide social uploading.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md),
[docs/CHARACTER_ENGINE.md](docs/CHARACTER_ENGINE.md),
[docs/SCENE_ENGINE.md](docs/SCENE_ENGINE.md),
[docs/VIDEO_RENDERING.md](docs/VIDEO_RENDERING.md), and
[docs/AUTOMATION_ROADMAP.md](docs/AUTOMATION_ROADMAP.md).
