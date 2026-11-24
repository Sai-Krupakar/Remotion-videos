import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const resolutions = {
  "portrait-1080": { "stickman-story-001": "StickmanStory", "nw052-everyone-gone": "EveryoneGoneStory", "garden-explainer": "GardenExplainer", "little-seed": "LittleSeed" },
  "portrait-720": { "stickman-story-001": "StickmanStoryPreview", "nw052-everyone-gone": "EveryoneGoneStoryPreview", "garden-explainer": "GardenExplainerPreview", "little-seed": "LittleSeedPreview" },
  "landscape-1080": { "stickman-story-001": "StickmanStoryLandscape", "nw052-everyone-gone": "EveryoneGoneStoryLandscape", "garden-explainer": "GardenExplainerLandscape", "little-seed": "LittleSeedLandscape" },
};

const options = {
  video: "stickman-story-001",
  resolution: "portrait-1080",
  concurrency: "1",
  output: undefined,
  browserExecutable: undefined,
  props: undefined,
  frame: undefined,
};

for (let index = 2; index < process.argv.length; index += 1) {
  const flag = process.argv[index];
  const value = process.argv[index + 1];

  if (!value || value.startsWith("--")) {
    console.error(`Missing value for ${flag}`);
    process.exit(1);
  }

  if (flag === "--video") {
    options.video = value;
  } else if (flag === "--resolution") {
    options.resolution = value;
  } else if (flag === "--concurrency") {
    options.concurrency = value;
  } else if (flag === "--output") {
    options.output = value;
  } else if (flag === "--props") {
    options.props = value;
  } else if (flag === "--frame") {
    options.frame = value;
  } else if (flag === "--browser-executable") {
    options.browserExecutable = value;
  } else {
    console.error(`Unknown option: ${flag}`);
    process.exit(1);
  }

  index += 1;
}

// --props renders any built story (see scripts/pipeline.py) with the generic ScriptStory composition.
if (options.props && !options.output) {
  console.error("--props requires --output.");
  process.exit(1);
}

if (!options.props && !Object.hasOwn(resolutions["portrait-1080"], options.video)) {
  console.error(`Unknown video "${options.video}". Available: ${Object.keys(resolutions["portrait-1080"]).join(", ")}`);
  process.exit(1);
}

const composition = options.props ? "ScriptStory" : resolutions[options.resolution]?.[options.video];
if (!composition) {
  console.error(
    `Unknown resolution "${options.resolution}". Choose: ${Object.keys(resolutions).join(", ")}`,
  );
  process.exit(1);
}

const concurrency = Number(options.concurrency);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 2) {
  console.error("Concurrency must be 1 or 2 on the default memory-conscious setup.");
  process.exit(1);
}

const output = resolve(
  options.output ?? `outputs/${options.video}-${options.resolution}.mp4`,
);
const cli = resolve("node_modules/@remotion/cli/remotion-cli.js");
const browserExecutable =
  options.browserExecutable ??
  [process.env.CHROME_PATH, process.env.CHROME_BIN].find(
    (path) => path && existsSync(path),
  ) ??
  [
    process.env.ProgramFiles &&
      resolve(process.env.ProgramFiles, "Google/Chrome/Application/chrome.exe"),
    process.env["ProgramFiles(x86)"] &&
      resolve(process.env["ProgramFiles(x86)"], "Microsoft/Edge/Application/msedge.exe"),
  ].find((path) => path && existsSync(path));

if (!existsSync(cli)) {
  console.error("Remotion CLI is missing. Run npm install before rendering.");
  process.exit(1);
}

mkdirSync(dirname(output), { recursive: true });

console.log(`Rendering ${options.props ?? `${options.video} (${options.resolution})`} to ${output}`);
const renderArgs = options.frame
  ? [cli, "still", "src/index.ts", composition, output, `--frame=${options.frame}`]
  : [
    cli,
    "render",
    "src/index.ts",
    composition,
    output,
    "--codec=h264",
    `--concurrency=${concurrency}`,
  ];

if (options.props) {
  renderArgs.push(`--props=${resolve(options.props)}`);
}

if (browserExecutable) {
  renderArgs.push("--browser-executable", browserExecutable);
}

const result = spawnSync(
  process.execPath,
  renderArgs,
  { stdio: "inherit", windowsHide: true },
);

if (result.error) {
  console.error(`Could not start Remotion: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
