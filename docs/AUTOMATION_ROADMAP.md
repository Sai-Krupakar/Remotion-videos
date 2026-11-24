# Automation roadmap

The current foundation covers manually authored, validated TypeScript stories,
character and prop selection, optional local audio, timed captions, Remotion
rendering, and multiple output formats.

Recommended future work:

1. Add focused story-config tests and visual regression snapshots.
2. Add a script-to-scene authoring tool that produces validated story data.
3. Add optional local or user-provided TTS/transcription integrations without
   making API keys mandatory.
4. Add reusable character registries and additional tested poses.
5. Add preview tooling and scene-level iteration for long-form videos.

The current demo uses deterministic SVG artwork and intentionally includes no
audio asset. Voiceover and music remain optional and can be added by supplying
local files. Automated social uploads and AI video generation are out of scope.
