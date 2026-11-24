import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getStoryDurationInFrames } from "../src/story/StorySchema";
import { littleSeedStory } from "../src/stories/little-seed";

assert.ok(getStoryDurationInFrames(littleSeedStory) > 0);
assert.equal(littleSeedStory.scenes.length, 24);
for (const scene of littleSeedStory.scenes) {
  assert.equal(scene.audioTracks.length, 1);
  const [track] = scene.audioTracks;
  assert.ok(existsSync(resolve("public", track.src)), `Missing narration: ${track.src}`);
  assert.ok(track.durationSeconds);
  assert.ok(track.startSeconds + track.durationSeconds <= scene.durationSeconds);
  // Shots are paced by their narration, so there is no long silence before the next line.
  assert.ok(scene.durationSeconds - track.startSeconds - track.durationSeconds <= 0.5, `${scene.id} has a long pause`);
  assert.equal(scene.captions[0].startSeconds, track.startSeconds);
  const lastCaption = scene.captions[scene.captions.length - 1];
  assert.ok(Math.abs(lastCaption.endSeconds - track.startSeconds - track.durationSeconds) < 1e-8);
  assert.equal(scene.characters[0].characterType, "toon");
}
// The planted garden always appears in the same place it was planted.
const gardenBackgrounds = littleSeedStory.scenes
  .filter((scene) => scene.objects.some((object) => object.type === "garden-bed"))
  .map((scene) => scene.background);
assert.deepEqual(gardenBackgrounds.filter((bg, i) => gardenBackgrounds.indexOf(bg) === i), ["sidewalk"]);
console.log("Voice-paced story timing and narration tests passed");
