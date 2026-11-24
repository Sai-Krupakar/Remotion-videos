import assert from "node:assert/strict";
import { validateScript } from "../src/story/scriptValidation";
import littleSeed from "../src/stories/little-seed-script.json";

const copy = () => JSON.parse(JSON.stringify(littleSeed));

assert.deepEqual(validateScript(littleSeed), []);

const badCamera = copy();
badCamera.scenes[0].lines[0].camera = "zoomy";
assert.match(validateScript(badCamera).join("\n"), /unknown camera "zoomy"/);

const longLine = copy();
longLine.scenes[0].lines[0].text = "word ".repeat(40);
assert.match(validateScript(longLine).join("\n"), /longer than/);

// The table is kept at home; using its id on the sidewalk corner breaks continuity.
const moved = copy();
moved.scenes[3].lines[0].props = [{ id: "table", type: "flower", x: 0.5, y: 0.76 }];
assert.match(validateScript(moved).join("\n"), /Continuity: "table"/);

console.log("Script validation tests passed");
