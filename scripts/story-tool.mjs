// Node helper for the automation pipeline.
//   node scripts/story-tool.mjs validate <script.json>
//   node scripts/story-tool.mjs build <script.json> <timings.json> <audioDir> <props.json> [width] [height]
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { build } from "esbuild";

const [command, ...args] = process.argv.slice(2);
const readJson = (path) => JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));

const dir = mkdtempSync(join(tmpdir(), "story-tool-"));
try {
  const entry = join(dir, "entry.ts");
  writeFileSync(
    entry,
    `export { validateScript } from ${JSON.stringify(resolve("src/story/scriptValidation.ts"))};\n` +
      `export { buildStoryFromScript } from ${JSON.stringify(resolve("src/story/scriptToStory.ts"))};\n`,
  );
  const outfile = join(dir, "tools.cjs");
  await build({ entryPoints: [entry], bundle: true, platform: "node", format: "cjs", outfile, logLevel: "error" });
  const tools = createRequire(import.meta.url)(outfile);

  if (command === "validate") {
    const errors = tools.validateScript(readJson(args[0]));
    console.log(JSON.stringify({ errors }));
    process.exitCode = errors.length ? 2 : 0;
  } else if (command === "build") {
    const [scriptPath, timingsPath, audioDir, outPath, width = "1080", height = "1920"] = args;
    const script = readJson(scriptPath);
    const story = tools.buildStoryFromScript(script, readJson(timingsPath), {
      id: "script-story",
      audioDir,
      width: Number(width),
      height: Number(height),
    });
    writeFileSync(outPath, JSON.stringify({ story }));
    const seconds = story.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
    console.log(JSON.stringify({ seconds: Math.round(seconds * 10) / 10, shots: story.scenes.length }));
  } else {
    console.error("Usage: story-tool.mjs validate <script.json> | build <script> <timings> <audioDir> <out> [w] [h]");
    process.exitCode = 1;
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
