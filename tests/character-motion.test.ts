import assert from "node:assert/strict";
import { getCharacterPose } from "../src/characters/animations";
import { resolveCharacterMotion } from "../src/characters/motion";
import { parseStoryConfig, type StoryCharacter } from "../src/story/StorySchema";

const character: StoryCharacter = {
  id: "guide",
  action: "walking",
  expression: "happy",
  characterType: "explainer",
  x: 0.2,
  y: 0.8,
  scale: 1,
  rotation: 0,
  lineColor: "#191a20",
  headColor: "white",
  motion: [
    { timeSeconds: 2, x: 0.6, y: 0.8, action: "pointing" },
    { timeSeconds: 3, x: 0.6, y: 0.8, action: "waving" },
  ],
};

assert.deepEqual(
  resolveCharacterMotion({ ...character, motion: undefined }, 15, 30).pose,
  getCharacterPose("walking", 15, 30),
);
assert.equal(resolveCharacterMotion(character, 0, 30).character.x, 0.2);
assert.ok(Math.abs(resolveCharacterMotion(character, 30, 30).character.x - 0.4) < 1e-10);
assert.equal(resolveCharacterMotion(character, 60, 30).character.x, 0.6);
assert.equal(resolveCharacterMotion(character, 60, 30).character.action, "pointing");
assert.deepEqual(resolveCharacterMotion(character, 60, 30).pose, getCharacterPose("walking", 60, 30));
assert.deepEqual(resolveCharacterMotion(character, 69, 30).pose, getCharacterPose("pointing", 9, 30));
assert.deepEqual(resolveCharacterMotion(character, 90, 30).pose, getCharacterPose("pointing", 30, 30));
assert.deepEqual(resolveCharacterMotion(character, 99, 30).pose, getCharacterPose("waving", 9, 30));
const overlapping = {
  ...character,
  motion: [
    { timeSeconds: 2, x: 0.6, y: 0.8, action: "pointing" as const },
    { timeSeconds: 2.1, x: 0.6, y: 0.8, action: "waving" as const },
  ],
};
assert.deepEqual(
  resolveCharacterMotion(overlapping, 63, 30).pose,
  resolveCharacterMotion({ ...overlapping, motion: overlapping.motion.slice(0, 1) }, 63, 30).pose,
);
const repeatedAction = {
  ...character,
  motion: [{ timeSeconds: 1, x: 0.4, y: 0.8, action: "walking" as const }],
};
assert.deepEqual(resolveCharacterMotion(repeatedAction, 30, 30).pose, getCharacterPose("walking", 30, 30));

const story = (motion: StoryCharacter["motion"]) => ({
  id: "test",
  title: "Test",
  width: 720,
  height: 1280,
  fps: 30,
  scenes: [{
    id: "scene",
    durationSeconds: 4,
    background: "garden",
    characters: [{ ...character, motion }],
  }],
});

assert.doesNotThrow(() => parseStoryConfig(story(character.motion)));
assert.throws(() => parseStoryConfig(story([
  { timeSeconds: 2, x: 0.6, y: 0.8, action: "pointing" },
  { timeSeconds: 1, x: 0.6, y: 0.8, action: "waving" },
])));
assert.throws(() => parseStoryConfig(story([
  { timeSeconds: 4, x: 0.6, y: 0.8, action: "waving" },
])));
assert.throws(() => parseStoryConfig(story([
  { timeSeconds: 0.01, x: 0.6, y: 0.8, action: "waving" },
])));
console.log("Character motion tests passed");
