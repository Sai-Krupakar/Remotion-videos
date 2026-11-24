# Project: Stickman Story Video Generator
## Complete Project Implementation Instructions for GitHub Copilot

You are an expert React, TypeScript, Remotion, SVG animation, and video-rendering engineer.

Your task is to develop a complete, reusable, code-driven Stickman Story Video Generator using Remotion, React, TypeScript, SVG, and FFmpeg.

The goal is to create entertaining, engaging, high-quality animated stickman videos for YouTube Shorts, Instagram Reels, and eventually longer YouTube videos.

IMPORTANT: This is NOT an AI video-generation project. All characters, movements, environments, objects, animations, scenes, and transitions must be created programmatically using SVG, React, CSS, and Remotion.

Do not use ComfyUI, Stable Diffusion, AnimateDiff, generative video models, or other AI video-generation models.

---

# 1. EXISTING ENVIRONMENT AND SETUP

The development environment is Windows.

Hardware:
- Processor: Intel Core i5-1135G7
- RAM: 8 GB
- GPU: NVIDIA GeForce MX350 (2 GB VRAM)
- Storage: 1.14 TB

Installed software:
- Node.js: v24.18.1
- npm: 11.16.0
- Git: 2.55.0
- FFmpeg: 8.1.2
- Visual Studio Code: Installed

The Remotion project has already been created and is working.

The project root is currently named:

VideoProjects

The Remotion Studio starts successfully using:

npm run dev

Remotion Studio is available at:

http://localhost:3000

Do not recreate the project or reinstall all existing dependencies unnecessarily.

Inspect package.json, package-lock.json, remotion.config.ts, tsconfig.json, and all existing source files before making changes.

Use the installed Remotion and React versions. Do not arbitrarily upgrade dependencies.

---

# 2. CURRENT IMPLEMENTATION

The following files have already been created:

src/
├── characters/
│   ├── animations.ts
│   └── Stickman.tsx
│
├── scenes/
│   └── WalkingScene.tsx
│
├── HelloWorld/
├── HelloWorld.tsx
├── index.ts
└── Root.tsx

Current functionality:

1. A basic SVG stickman character exists.
2. The character has a circular head, body, arms, and legs.
3. Walking animation is implemented using mathematical sine functions.
4. Arms and legs swing during walking.
5. The body has a small bouncing movement.
6. A ground and shadow are displayed.
7. A Remotion composition called StickmanWalking has been registered.
8. The composition uses:
   - Width: 1080
   - Height: 1920
   - FPS: 30
   - Duration: 300 frames (10 seconds)
9. The composition is grouped inside a Remotion folder named Stickman-Animations.

The existing Logo, Title, and HelloWorld compositions must remain functional.

IMPORTANT:
- The initial walking implementation is basic and should be improved.
- Inspect its actual implementation before changing it.
- Preserve useful existing functionality.
- Do not unnecessarily delete or overwrite working files.

---

# 3. MAIN OBJECTIVE

Build a reusable Stickman Animation Engine.

The system should allow us to create videos by defining characters, actions, scenes, dialogue, objects, backgrounds, and timing.

We should not need to manually draw every frame or create every animation from scratch.

The same stickman character should be reusable across hundreds of videos.

Prioritize smooth animation, consistent character proportions, expressive movements, and storytelling.

Visual direction:

- Clean 2D stickman animation.
- White or lightly colored circular head.
- Black stickman body and limbs.
- Clearly visible facial expressions.
- Simple but attractive backgrounds.
- Smooth movements.
- Consistent character proportions.
- Interesting visual storytelling.
- High-quality animated captions.

Avoid overly complicated 3D graphics.

Do not copy copyrighted characters or assets from existing channels. Create an original visual identity.

---

# 4. CHARACTER ENGINE

Develop a reusable Stickman component.

Suggested architecture:

src/
├── characters/
│   ├── Stickman.tsx
│   ├── StickmanTypes.ts
│   ├── CharacterRegistry.ts
│   │
│   ├── animations/
│   │   ├── idle.ts
│   │   ├── walking.ts
│   │   ├── running.ts
│   │   ├── jumping.ts
│   │   ├── falling.ts
│   │   ├── sitting.ts
│   │   ├── waving.ts
│   │   ├── talking.ts
│   │   └── thinking.ts
│   │
│   └── expressions/
│       ├── happy.ts
│       ├── sad.ts
│       ├── angry.ts
│       ├── surprised.ts
│       ├── confused.ts
│       ├── crying.ts
│       └── neutral.ts

Implement these actions:

1. Idle / standing.
2. Walking.
3. Running.
4. Jumping.
5. Falling.
6. Sitting.
7. Standing up.
8. Waving.
9. Talking.
10. Thinking.
11. Pointing.
12. Celebrating.
13. Looking around.
14. Shaking head.
15. Reacting with surprise.

Implement facial expressions:

- Neutral
- Happy
- Sad
- Angry
- Surprised
- Confused
- Crying
- Laughing
- Scared
- Thinking

Technical requirements:

- Use SVG for character rendering.
- Use deterministic frame-based animation.
- Use Remotion's useCurrentFrame() and useVideoConfig().
- Do not use setInterval, setTimeout, requestAnimationFrame, or random values for animation.
- Every animation must render identically for the same frame.
- Use reusable mathematical animation functions.
- Maintain consistent character dimensions and proportions.
- Support configurable character colors, size, position, and rotation.
- Support multiple instances of the same character in one scene.
- Use clear TypeScript interfaces.

Animations must be smooth and should not look like disconnected moving lines.

Pay attention to joint positions, limb rotations, body movement, foot placement, and ground contact.

---

# 5. SCENE AND ENVIRONMENT ENGINE

Create reusable environment components.

Suggested structure:

src/
├── components/
│   ├── backgrounds/
│   │   ├── SolidBackground.tsx
│   │   ├── RoomBackground.tsx
│   │   ├── OfficeBackground.tsx
│   │   ├── StreetBackground.tsx
│   │   ├── ParkBackground.tsx
│   │   └── NightBackground.tsx
│   │
│   ├── objects/
│   │   ├── House.tsx
│   │   ├── Car.tsx
│   │   ├── Tree.tsx
│   │   ├── Chair.tsx
│   │   ├── Table.tsx
│   │   ├── Door.tsx
│   │   ├── Phone.tsx
│   │   ├── Laptop.tsx
│   │   ├── Bed.tsx
│   │   └── Box.tsx
│   │
│   ├── captions/
│   │   └── AnimatedCaption.tsx
│   │
│   └── camera/
│       └── Camera.tsx

Requirements:

1. All objects should be reusable SVG or React components.
2. Objects should support positioning, scaling, and rotation.
3. Backgrounds should support configurable colors.
4. Objects should support frame-based animations.
5. Support foreground, middle-ground, and background layers.
6. Support camera movement, zoom, and panning.
7. Support multiple characters and objects in the same scene.

Do not attempt to implement every possible object immediately. Build a reusable system and start with essential objects.

---

# 6. STORYTELLING AND SCENE ENGINE

This is one of the most important parts of the project.

Create a data-driven scene system.

We should be able to define a video using JSON or TypeScript configuration rather than manually writing a separate React component for every video.

Example:

{
  "id": "stickman-story-001",
  "title": "A Normal Day",
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "scenes": [
    {
      "id": "scene-1",
      "duration": 3,
      "background": "room",
      "characters": [
        {
          "id": "main",
          "action": "idle",
          "expression": "neutral",
          "x": 540,
          "y": 1200,
          "scale": 1
        }
      ]
    },
    {
      "id": "scene-2",
      "duration": 4,
      "background": "street",
      "characters": [
        {
          "id": "main",
          "action": "walking",
          "expression": "happy",
          "x": 540,
          "y": 1200,
          "scale": 1
        }
      ]
    }
  ]
}

This is an illustrative schema, not a restriction on the final implementation.

Design a proper TypeScript schema with validation.

Requirements:

- Multiple scenes per video.
- Multiple characters per scene.
- Different character actions.
- Different facial expressions.
- Scene-specific backgrounds.
- Objects and props.
- Dialogue and captions.
- Scene transitions.
- Configurable duration.
- Configurable camera position.
- Optional voiceover and music.
- Different scene durations.

The renderer must calculate the correct global and local frame for each scene.

Use frame-based timing, not real-time timers.

The same scene configuration must always produce the same rendered result.

---

# 7. CAPTIONS AND TEXT ANIMATIONS

Create an animated caption system.

Features:

1. Text fade-in and fade-out.
2. Word-by-word captions.
3. Highlight important keywords.
4. Pop-up text.
5. Animated dialogue bubbles.
6. Text positioning.
7. Text scaling.
8. Different font sizes.
9. Optional subtitles synchronized with audio.
10. Proper text wrapping for mobile screens.

Use readable fonts and ensure text does not exceed the safe area of a vertical video.

Support both:

- Manually timed captions.
- Word-level timestamps supplied by a transcription or voiceover process.

Do not require an external paid API for basic caption rendering.

---

# 8. AUDIO ENGINE

Create a reusable audio system.

Support:

- Voiceover files.
- Background music.
- Sound effects.
- Multiple audio tracks.
- Volume control.
- Fade-in and fade-out.
- Audio timing and synchronization.

Use Remotion's audio components and appropriate utilities.

Voiceover and music must be optional.

Do not automatically download copyrighted music or sound effects.

Use locally supplied audio assets.

Design the system so that a future TTS integration can be added without changing the scene engine.

Do not require a paid TTS API for the initial implementation.

---

# 9. VIDEO FORMATS AND RENDERING

Support these video configurations:

YouTube Shorts / Instagram Reels:
- 1080 × 1920
- 9:16
- 30 FPS
- MP4
- H.264

YouTube landscape:
- 1920 × 1080
- 16:9
- 30 FPS
- MP4
- H.264

Optional preview:
- 720 × 1280
- 30 FPS

Support different video durations:

- 10 seconds.
- 15 seconds.
- 30 seconds.
- 60 seconds.
- 2 minutes.
- 5 minutes.

Use configuration-driven durations instead of hardcoding 300 frames.

Rendering requirements:

- Provide a simple render command.
- Allow rendering a selected video composition.
- Save outputs in an organized output directory.
- Use meaningful output filenames.
- Support rendering at different resolutions.
- Provide useful error messages.
- Ensure rendering works on Windows.

Example desired command:

npm run render -- --video stickman-story-001

Adapt this command to the actual implementation and document it.

---

# 10. PERFORMANCE REQUIREMENTS

This project runs on an 8 GB RAM laptop.

Performance is extremely important.

Follow these rules:

1. Avoid unnecessary React re-renders.
2. Avoid excessive SVG complexity.
3. Reuse components.
4. Avoid unnecessary dependencies.
5. Avoid unnecessary image assets.
6. Use deterministic mathematical animations.
7. Keep preview resolution configurable.
8. Avoid rendering multiple compositions concurrently.
9. Make rendering concurrency configurable.
10. Default to conservative rendering settings.
11. Keep memory usage under control.
12. Use efficient SVG structures.
13. Do not introduce heavy 3D libraries.
14. Do not use AI inference or local AI video models.

Start with concurrency 1 or 2.

The project must work on the current hardware without requiring a GPU upgrade.

---

# 11. FIRST COMPLETE DEMONSTRATION VIDEO

After building the necessary architecture, create a polished demonstration video.

Video title:

"A Normal Day in a Stickman's Life"

Duration: 30 seconds.

Resolution: 1080 × 1920.

FPS: 30.

Create the following scenes:

Scene 1 (0–4 seconds):
- A stickman is sleeping in a bedroom.
- Show a simple bed and room background.
- Add a small clock.
- Character has a peaceful expression.

Scene 2 (4–8 seconds):
- Alarm rings.
- Character wakes up.
- Character looks surprised.
- Add an alarm sound effect if available.

Scene 3 (8–13 seconds):
- Character gets out of bed.
- Character stands and stretches.
- Show natural body and arm movement.

Scene 4 (13–18 seconds):
- Character walks outside.
- Change the background to a street.
- Add a walking animation.

Scene 5 (18–23 seconds):
- Character encounters an obstacle.
- Character looks surprised.
- Use a suitable reaction animation.

Scene 6 (23–27 seconds):
- Character reacts and starts running.

Scene 7 (27–30 seconds):
- Character stops.
- Show a funny final facial expression.
- Display a short ending caption.

Make the transitions smooth.

The demonstration should be visually coherent, entertaining, and polished.

Do not simply display a static character while changing text.

Use real body movement and object interactions.

If a required feature is not implemented yet, implement a simple working version rather than leaving an empty placeholder.

---

# 12. AUTOMATION ARCHITECTURE

Prepare the project for future automated video production.

The intended workflow is:

Video Topic
    ↓
Script and Story Breakdown
    ↓
Scene Configuration
    ↓
Character and Action Selection
    ↓
Environment and Object Selection
    ↓
Voiceover Integration
    ↓
Caption Generation
    ↓
Remotion Rendering
    ↓
Final MP4

For the current implementation:

- Build the complete rendering and scene-generation foundation.
- Use manually authored JSON/TypeScript scripts.
- Provide an example video configuration.
- Keep the architecture ready for future script-generation and TTS integrations.

Do not implement unnecessary external API integrations now.

Do not make API keys mandatory.

Do not create an automated social media uploader at this stage.

---

# 13. CODE QUALITY AND DEVELOPMENT RULES

Follow these development standards:

1. Use TypeScript strictly.
2. Use reusable React components.
3. Follow KISS (Keep It Simple).
4. Follow DRY (Don't Repeat Yourself).
5. Keep files small and focused.
6. Avoid unnecessary abstractions.
7. Avoid hardcoded scene timings.
8. Avoid hardcoded character positions wherever configurable values are appropriate.
9. Use meaningful variable and function names.
10. Add comments for non-obvious animation calculations.
11. Handle invalid scene configurations.
12. Avoid unnecessary dependencies.
13. Maintain compatibility with the installed Remotion version.
14. Preserve existing HelloWorld, Logo, and Title compositions.
15. Do not introduce breaking changes unnecessarily.
16. Never use nondeterministic animation logic.
17. Do not leave TODO-only implementations for required functionality.

Before adding any dependency, verify that it is compatible with the project's installed versions.

---

# 14. TESTING AND VALIDATION

After implementation:

1. Run TypeScript type checking.
2. Run ESLint if configured.
3. Fix compilation errors.
4. Verify Remotion Studio starts.
5. Verify the existing compositions remain available.
6. Verify the new stickman compositions appear.
7. Verify animations at different frames.
8. Verify scene transitions.
9. Verify 9:16 rendering.
10. Render the complete 30-second demonstration video.
11. Verify the output MP4 exists and plays.
12. Verify video dimensions and frame rate using FFprobe if available.
13. Verify audio integration if audio assets are supplied.
14. Check that rendering does not require AI models or a powerful GPU.

Do not claim a feature works unless you have tested it.

If a test cannot be run, explicitly document that limitation.

---

# 15. DOCUMENTATION

Create or update:

README.md

Include:

- Project overview.
- Architecture.
- Installation requirements.
- How to start Remotion Studio.
- How to create a character.
- How to add an animation.
- How to create a scene.
- How to create a video configuration.
- How to add voiceovers.
- How to add captions.
- How to render videos.
- Supported video resolutions.
- Performance recommendations for 8 GB RAM.
- Example commands.
- Known limitations.
- Future roadmap.

Also create:

docs/
├── ARCHITECTURE.md
├── CHARACTER_ENGINE.md
├── SCENE_ENGINE.md
├── VIDEO_RENDERING.md
└── AUTOMATION_ROADMAP.md

Keep documentation aligned with the actual implementation.

---

# 16. IMPLEMENTATION APPROACH

Follow this sequence:

PHASE 1:
Inspect the entire existing project.
Understand its structure, dependencies, Remotion version, existing compositions, and current walking animation.

PHASE 2:
Identify missing functionality and prepare a concise implementation plan.

PHASE 3:
Implement the reusable character engine and animation functions.

PHASE 4:
Implement facial expressions and character actions.

PHASE 5:
Implement reusable backgrounds, objects, captions, and camera movement.

PHASE 6:
Implement the data-driven scene and storytelling engine.

PHASE 7:
Implement the audio integration and rendering pipeline.

PHASE 8:
Create the 30-second demonstration video.

PHASE 9:
Run tests, fix errors, and validate the generated video.

PHASE 10:
Update documentation.

IMPORTANT EXECUTION INSTRUCTIONS:

- Do not stop after analyzing the project.
- Do not only produce a plan.
- Actually implement the functionality in the existing workspace.
- Work incrementally and verify each phase.
- Preserve working code.
- Do not unnecessarily recreate files.
- Do not overwrite existing files without inspecting them.
- If the existing implementation differs from this prompt, adapt to the actual project instead of blindly replacing it.
- Resolve TypeScript and Remotion compilation errors before proceeding.
- Keep the project runnable after each major phase.
- Do not introduce features that cannot be completed or tested within the current environment.
- If the full scope is too large for one implementation pass, prioritize a complete working foundation and a fully rendered demonstration video, then clearly document remaining work.

# FINAL EXPECTED RESULT

At the end, I should have:

1. A working Remotion project.
2. A reusable SVG stickman character engine.
3. Multiple character actions and facial expressions.
4. Reusable backgrounds and objects.
5. A data-driven scene engine.
6. Animated captions.
7. Optional voiceover and music integration.
8. A configurable video rendering pipeline.
9. A working 30-second stickman demonstration video.
10. Documentation explaining how to create additional videos.

The long-term goal is to create multiple entertaining stickman storytelling videos, including 10–60-second Shorts and 1–5-minute YouTube videos, using the same reusable animation engine.

Focus on visual quality, smooth animation, maintainability, deterministic rendering, and efficient performance on the existing laptop.

Start by inspecting the existing repository and then implement the project.