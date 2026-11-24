import assert from "node:assert/strict";
import { buildStoryFromScript, type StoryScript } from "../src/story/scriptToStory";

const timingsFor = (script: StoryScript) =>
  script.scenes.map((scene) => ({ id: scene.id, durations: scene.lines.map(() => 2) }));
const build = (script: StoryScript) => buildStoryFromScript(script, timingsFor(script), { id: "t", audioDir: "audio/t" });
const types = (story: ReturnType<typeof build>, index: number) => story.scenes[index].objects.map((o) => o.type);

const places: StoryScript["places"] = {
  corner: { location: "sidewalk", props: [{ id: "bed", type: "garden-bed", x: 0.6, y: 0.8 }] },
  home: { location: "living-room" },
};

// Kept props stay in their place, are replaced by id, and never leak into other places.
const story = build({
  title: "t",
  places,
  scenes: [
    { id: "a", place: "corner", lines: [{ text: "Plant.", props: [{ id: "p", keep: true, type: "sprout", x: 0.6, y: 0.75, appear: 1 }] }] },
    { id: "b", place: "home", lines: [{ text: "Home." }] },
    { id: "c", place: "corner", lines: [
      { text: "Back.", props: [{ id: "p", keep: true, type: "flower", x: 0.6, y: 0.76 }] },
      { text: "Later." },
    ] },
  ],
});
assert.deepEqual(types(story, 0), ["garden-bed", "sprout"]);
assert.equal(story.scenes[1].background, "living-room");
assert.deepEqual(types(story, 1), []);
assert.deepEqual(types(story, 2), ["garden-bed", "flower"]);
assert.deepEqual(types(story, 3), ["garden-bed", "flower"]);
assert.equal(story.scenes[3].objects[1].appearSeconds, undefined);

// A kept prop cannot reappear in a different place unless it is taken first.
assert.throws(
  () => build({
    title: "t",
    places,
    scenes: [
      { id: "a", place: "corner", lines: [{ text: "Plant.", props: [{ id: "p", keep: true, type: "sprout", x: 0.6, y: 0.75 }] }] },
      { id: "b", place: "home", lines: [{ text: "Moved?", props: [{ id: "p", type: "flower", x: 0.5, y: 0.76 }] }] },
    ],
  }),
  /Continuity: "p" is kept at "corner"/,
);
const taken = build({
  title: "t",
  places,
  scenes: [
    { id: "a", place: "corner", lines: [{ text: "Seed.", props: [{ id: "s", keep: true, type: "seed", x: 0.6, y: 0.79 }] }] },
    { id: "b", place: "home", lines: [{ text: "Carry.", take: ["s"], props: [{ id: "s", type: "seed", x: 0.5, y: 0.7 }] }] },
    { id: "c", place: "corner", lines: [{ text: "Gone." }] },
  ],
});
assert.deepEqual(types(taken, 2), ["garden-bed"]);

assert.throws(() => build({ title: "t", places, scenes: [{ id: "a", place: "park", lines: [{ text: "x" }] }] }), /unknown place "park"/);
console.log("Script continuity tests passed");
