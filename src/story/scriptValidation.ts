import { buildStoryFromScript, type StoryScript } from "./scriptToStory";

export const SCRIPT_LOCATIONS = ["sidewalk", "garden", "living-room", "park", "street", "room", "bedroom", "night"];
export const SCRIPT_CAMERAS = ["wide", "push-in", "pull-out", "close-up", "punch-in", "follow", "prop"];
export const SCRIPT_MOVES = ["stay", "walk", "run", "enter-left", "enter-right", "exit-left", "exit-right"];
const MAX_LINE_CHARACTERS = 110;

// Checks an (often AI-written) script and returns readable problems; an empty list means it can be built.
export const validateScript = (input: unknown): string[] => {
  const errors: string[] = [];
  const script = input as StoryScript;
  if (!script || typeof script !== "object") return ["Script must be a JSON object."];
  if (!script.title) errors.push('Missing "title".');
  if (!Array.isArray(script.scenes) || script.scenes.length === 0) return [...errors, 'Missing "scenes".'];

  const places = script.places ?? {};
  Object.keys(places).forEach((name) => {
    if (SCRIPT_LOCATIONS.indexOf(places[name].location) === -1) {
      errors.push(`Place "${name}" has unknown location "${places[name].location}". Use one of: ${SCRIPT_LOCATIONS.join(", ")}.`);
    }
  });
  const sceneIds: string[] = [];
  script.scenes.forEach((scene, sceneIndex) => {
    const label = `Scene ${sceneIndex + 1} ("${scene.id}")`;
    if (!scene.id || !/^[a-z0-9-]+$/.test(scene.id)) errors.push(`${label}: id must be lowercase letters, digits and dashes.`);
    if (sceneIds.indexOf(scene.id) !== -1) errors.push(`${label}: duplicate scene id.`);
    sceneIds.push(scene.id);
    if (!Array.isArray(scene.lines) || scene.lines.length === 0) {
      errors.push(`${label}: needs at least one line.`);
      return;
    }
    scene.lines.forEach((line, lineIndex) => {
      const where = `${label} line ${lineIndex + 1}`;
      if (!line.text || !line.text.trim()) errors.push(`${where}: empty text.`);
      else if (line.text.length > MAX_LINE_CHARACTERS) errors.push(`${where}: text is longer than ${MAX_LINE_CHARACTERS} characters; split it.`);
      if (line.camera && SCRIPT_CAMERAS.indexOf(line.camera) === -1) errors.push(`${where}: unknown camera "${line.camera}".`);
      if (line.move && SCRIPT_MOVES.indexOf(line.move) === -1) errors.push(`${where}: unknown move "${line.move}".`);
      if (line.location && SCRIPT_LOCATIONS.indexOf(line.location) === -1) errors.push(`${where}: unknown location "${line.location}".`);
    });
  });
  if (errors.length) return errors;

  // Build with placeholder narration lengths to catch schema, range and continuity errors.
  try {
    const timings = script.scenes.map((scene) => ({ id: scene.id, durations: scene.lines.map(() => 2.5) }));
    buildStoryFromScript(script, timings, { id: "validate", audioDir: "audio/validate" });
  } catch (error) {
    errors.push(error instanceof Error ? error.message.slice(0, 1500) : String(error));
  }
  return errors;
};
