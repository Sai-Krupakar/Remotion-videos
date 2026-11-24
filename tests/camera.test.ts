import assert from "node:assert/strict";
import { getCameraTransform, resolveCamera } from "../src/story/camera";
import { chunkCaption } from "../src/story/scriptToStory";
import { storySchema } from "../src/story/StorySchema";

const fps = 30;
const scene = {
  camera: { x: 0.5, y: 0.5, zoom: 1 },
  cameraMotion: [
    { timeSeconds: 2, x: 0.3, y: 0.4, zoom: 2, ease: "cut" as const },
    { timeSeconds: 4, x: 0.3, y: 0.4, zoom: 3, ease: "smooth" as const },
  ],
};

assert.deepEqual(resolveCamera(scene, 59, fps), { x: 0.5, y: 0.5, zoom: 1 }, "cut holds the previous framing");
assert.equal(resolveCamera(scene, 60, fps).zoom, 2, "cut switches instantly");
const midway = resolveCamera(scene, 90, fps).zoom;
assert.ok(midway > 2 && midway < 3, "smooth keyframes interpolate");
assert.equal(resolveCamera(scene, 200, fps).zoom, 3);

const edge = getCameraTransform({ x: 0, y: 1, zoom: 2 }, 1000, 2000);
assert.deepEqual(edge, { tx: 0, ty: -2000, zoom: 2 }, "zoomed frame stays inside the scene");
assert.deepEqual(getCameraTransform({ x: 0.55, y: 0.5, zoom: 1.08 }, 1000, 2000, true), { tx: 0.55 * 1000 * (1 - 1.08), ty: 0.5 * 2000 * (1 - 1.08), zoom: 1.08 });

const chunks = chunkCaption("On a windy morning, a little seed landed beside a sidewalk.", 0.2, 3);
assert.deepEqual(chunks.map((chunk) => chunk.text), ["On a windy morning,", "a little seed landed", "beside a sidewalk."]);
assert.equal(chunks[0].startSeconds, 0.2);
assert.ok(Math.abs(chunks[chunks.length - 1].endSeconds - 3.2) < 1e-9);
assert.equal(chunkCaption("Hello there friend.", 0, 1).length, 1);

const invalid = storySchema.safeParse({
  id: "camera", title: "Camera", width: 1080, height: 1920, fps,
  scenes: [{ id: "a", durationSeconds: 2, background: "solid", cameraMotion: [{ timeSeconds: 1 }, { timeSeconds: 1 }] }],
});
assert.equal(invalid.success, false, "camera keyframes must increase");

console.log("Camera and caption tests passed");
