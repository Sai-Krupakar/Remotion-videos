import { buildStoryFromScript, type NarrationTimings, type StoryScript } from "../story/scriptToStory";
import script from "./little-seed-script.json";
import timings from "./little-seed-timings.json";

export const littleSeedStory = buildStoryFromScript(
  script as StoryScript,
  timings as NarrationTimings,
  { id: "little-seed", audioDir: "audio/little-seed" },
);
