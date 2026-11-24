import { parseStoryConfig, type StoryConfig, type StoryScene } from "./StorySchema";

type Action = StoryScene["characters"][number]["action"];
type Expression = StoryScene["characters"][number]["expression"];
type CharacterType = StoryScene["characters"][number]["characterType"];
type Location = StoryScene["background"];
type ObjectType = StoryScene["objects"][number]["type"];
type Accessory = NonNullable<StoryScene["characters"][number]["accessory"]>;

export type ScriptProp = {
  type: ObjectType;
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  appear?: number;
  from?: [number, number];
  at?: number;
  carry?: boolean;
  // Persistent props stay in their place for every later shot there. Reusing an id replaces it (e.g. sprout -> flower).
  id?: string;
  keep?: boolean;
};

export type ScriptPlace = {
  location: Location;
  props?: ScriptProp[];
};

export type ScriptCast = {
  id: string;
  x: number;
  to?: number;
  enter?: "left" | "right";
  action?: Action;
  expression?: Expression;
  characterType?: CharacterType;
  lineColor?: string;
  accessory?: Accessory;
};

export type CameraShot = "wide" | "push-in" | "pull-out" | "close-up" | "punch-in" | "follow" | "prop";
export type HeroMove = "stay" | "walk" | "run" | "enter-left" | "enter-right" | "exit-left" | "exit-right";

export type ScriptLine = {
  text: string;
  place?: string;
  location?: Location;
  take?: string[];
  action?: Action;
  expression?: Expression;
  move?: HeroMove;
  to?: number;
  camera?: CameraShot;
  props?: ScriptProp[];
  cast?: ScriptCast[];
  tag?: string;
  highlight?: string[];
  letterbox?: boolean;
  voice?: string;
  voiceSpeed?: number;
};

export type ScriptScene = {
  id: string;
  place?: string;
  location?: Location;
  props?: ScriptProp[];
  lines: ScriptLine[];
};

export type StoryScript = {
  title: string;
  shotSeconds?: number;
  pauseSeconds?: number;
  voice?: string;
  voiceSpeed?: number;
  hero?: { characterType?: CharacterType; scale?: number; lineColor?: string; accessory?: Accessory };
  places?: Record<string, ScriptPlace>;
  scenes: ScriptScene[];
};

export type NarrationTimings = { id: string; durations: number[] }[];

export type ScriptBuildOptions = {
  id: string;
  audioDir: string;
  width?: number;
  height?: number;
  fps?: number;
  audioStartSeconds?: number;
};

const GROUND_Y = 0.79;
const DEFAULT_X = 0.35;
const WALK_SPEED = 0.22;
const RUN_SPEED = 0.5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 100) / 100;

// Splits narration into short phrases timed by character count, like the reference captions.
export const chunkCaption = (text: string, start: number, duration: number, maxWords = 4) => {
  const words = text.trim().split(/\s+/);
  const chunks: string[][] = [];
  let current: string[] = [];
  for (const word of words) {
    current.push(word);
    if (current.length >= maxWords || /[,.!?;:]$/.test(word)) {
      chunks.push(current);
      current = [];
    }
  }
  if (current.length) {
    if (chunks.length && current.length === 1) {
      chunks[chunks.length - 1].push(...current);
    } else {
      chunks.push(current);
    }
  }
  const total = chunks.reduce((sum, chunk) => sum + chunk.join(" ").length, 0);
  let cursor = start;
  return chunks.map((chunk, index) => {
    const text = chunk.join(" ");
    const end = index === chunks.length - 1 ? start + duration : cursor + (duration * text.length) / total;
    const caption = { text, startSeconds: cursor, endSeconds: end };
    cursor = end;
    return caption;
  });
};

const walkTime = (from: number, to: number, speed: number, shot: number) =>
  clamp(Math.abs(to - from) / speed, 0.6, shot - 0.5);

export const buildStoryFromScript = (
  script: StoryScript,
  timings: NarrationTimings,
  options: ScriptBuildOptions,
): StoryConfig => {
  const fps = options.fps ?? 30;
  const audioStart = options.audioStartSeconds ?? 0.08;
  const pause = script.pauseSeconds ?? 0.25;
  const heroType = script.hero?.characterType ?? "toon";
  const heroScale = script.hero?.scale ?? 1.3;
  const heroHeight = (420 / 1920) * heroScale;
  let heroX = DEFAULT_X;
  let previousPlace: string | undefined;
  const places = script.places ?? {};
  // Props kept in each place, and which place owns each kept prop id, so later shots stay consistent.
  const placeProps: Record<string, ScriptProp[]> = {};
  const owner: Record<string, string> = {};
  Object.keys(places).forEach((name) => {
    placeProps[name] = [...(places[name].props ?? [])];
    placeProps[name].forEach((prop) => {
      if (prop.id) owner[prop.id] = name;
    });
  });

  if (timings.length !== script.scenes.length) {
    throw new Error("Narration timings must contain one entry per script scene.");
  }

  const scenes = script.scenes.map((scene, sceneIndex) => {
    const timing = timings[sceneIndex];
    if (timing.id !== scene.id || timing.durations.length !== scene.lines.length) {
      throw new Error(`Narration timings do not match scene "${scene.id}".`);
    }

    return scene.lines.map((line, lineIndex) => {
      const shotId = `${scene.id}-${lineIndex + 1}`;
      const audioDuration = timing.durations[lineIndex];
      const duration = script.shotSeconds ?? round(Math.max(1.2, audioStart + audioDuration + pause));
      // Prop and camera times are authored loosely; keep them inside shorter, voice-paced shots.
      const fit = (time: number) => round(clamp(time, 0, duration - 0.3));
      if (audioStart + audioDuration > duration) {
        throw new Error(`Narration for "${shotId}" is longer than its shot.`);
      }
      const placeName = line.place ?? scene.place;
      if (placeName !== undefined && !places[placeName]) {
        throw new Error(`Shot "${shotId}" uses unknown place "${placeName}". Add it to the script "places".`);
      }
      const location = line.location ?? (placeName !== undefined ? places[placeName].location : scene.location);
      if (!location) {
        throw new Error(`Shot "${shotId}" needs a place or location.`);
      }
      const placeKey = placeName ?? `location:${location}`;
      if (placeKey !== previousPlace || heroX < 0 || heroX > 1) {
        heroX = DEFAULT_X;
      }
      previousPlace = placeKey;

      const move = line.move ?? (line.to !== undefined ? "walk" : "stay");
      let x0 = heroX;
      let x1 = line.to ?? heroX;
      if (move === "enter-left") [x0, x1] = [-0.15, line.to ?? 0.38];
      if (move === "enter-right") [x0, x1] = [1.15, line.to ?? 0.62];
      if (move === "exit-left") x1 = -0.2;
      if (move === "exit-right") x1 = 1.2;
      const moving = Math.abs(x1 - x0) > 0.005;
      const gait: Action = move === "run" ? "running" : "walking";
      const moveTime = moving ? round(walkTime(x0, x1, move === "run" ? RUN_SPEED : WALK_SPEED, duration)) : 0;
      const finalAction = line.action ?? "idle";
      heroX = x1;

      const headY = GROUND_Y - heroHeight * 0.72;
      const bodyY = GROUND_Y - heroHeight * 0.5;
      const focusX = clamp(x1, 0, 1);
      const end = round(duration - 0.1);
      for (const id of line.take ?? []) {
        const from = owner[id];
        if (from === undefined) throw new Error(`Shot "${shotId}" takes "${id}", but no place keeps it.`);
        placeProps[from] = placeProps[from].filter((prop) => prop.id !== id);
        delete owner[id];
      }
      const lineProps = line.props ?? [];
      const replaced: string[] = [];
      for (const prop of lineProps) {
        if (!prop.id) continue;
        const kept = owner[prop.id];
        if (kept !== undefined && kept !== placeKey) {
          throw new Error(
            `Continuity: "${prop.id}" is kept at "${kept}" but shot "${shotId}" is at "${placeKey}". Use the same place or "take" it first.`,
          );
        }
        replaced.push(prop.id);
      }
      const persisted = (placeProps[placeKey] ?? []).filter((prop) => !prop.id || replaced.indexOf(prop.id) === -1);
      const props = [...persisted, ...(scene.props ?? []), ...lineProps];
      for (const prop of lineProps) {
        if (!prop.keep || prop.carry) continue;
        const settled: ScriptProp = { id: prop.id, type: prop.type, x: prop.x, y: prop.y, scale: prop.scale, rotation: prop.rotation };
        placeProps[placeKey] = [...(placeProps[placeKey] ?? []).filter((item) => !prop.id || item.id !== prop.id), settled];
        if (prop.id) owner[prop.id] = placeKey;
      }
      // "prop" shots focus on the line's most recently listed prop.
      const focusProp = props[props.length - 1];
      let camera: StoryScene["camera"];
      let cameraMotion: StoryScene["cameraMotion"];
      switch (line.camera ?? "push-in") {
        case "push-in":
          camera = { x: focusX, y: bodyY, zoom: 1 };
          cameraMotion = [{ timeSeconds: end, x: focusX, y: bodyY, zoom: 1.22, ease: "smooth" }];
          break;
        case "pull-out":
          camera = { x: focusX, y: headY, zoom: 1.6 };
          cameraMotion = [{ timeSeconds: fit(Math.min(end, 2.6)), x: focusX, y: bodyY, zoom: 1, ease: "smooth" }];
          break;
        case "close-up":
          camera = { x: focusX, y: headY, zoom: 2.4 };
          cameraMotion = [{ timeSeconds: end, x: focusX, y: headY, zoom: 2.65, ease: "smooth" }];
          break;
        case "punch-in":
          camera = { x: 0.5, y: 0.5, zoom: 1 };
          cameraMotion = [
            { timeSeconds: round(Math.max(moveTime, duration * 0.45)), x: focusX, y: headY + 0.04, zoom: 1.7, ease: "cut" },
            { timeSeconds: end, x: focusX, y: headY + 0.04, zoom: 1.8, ease: "smooth" },
          ];
          break;
        case "follow":
          camera = { x: clamp(x0, 0, 1), y: bodyY, zoom: 1.35 };
          cameraMotion = moving
            ? [{ timeSeconds: moveTime, x: focusX, y: bodyY, zoom: 1.35, ease: "smooth" }]
            : [{ timeSeconds: end, x: focusX, y: bodyY, zoom: 1.4, ease: "smooth" }];
          break;
        case "prop":
          camera = { x: 0.5, y: 0.5, zoom: 1 };
          cameraMotion = focusProp
            ? [
              { timeSeconds: fit(Math.min(end - 0.5, (focusProp.at ?? focusProp.appear ?? 0) + 0.6)), x: focusProp.x, y: focusProp.y - 0.04, zoom: 1.8, ease: "smooth" },
              { timeSeconds: end, x: focusProp.x, y: focusProp.y - 0.04, zoom: 1.9, ease: "smooth" },
            ]
            : undefined;
          break;
        default:
          camera = undefined;
      }

      const objects = props.map((prop, propIndex) => {
        const base = {
          id: `${shotId}-prop-${propIndex}`,
          type: prop.type,
          scale: prop.scale ?? 1,
          rotation: prop.rotation ?? 0,
          appearSeconds: prop.appear === undefined ? undefined : fit(prop.appear),
        };
        if (prop.carry) {
          const carryY = GROUND_Y - heroHeight * 0.36;
          return {
            ...base,
            x: clamp(x0 + 0.06, -0.5, 1.5),
            y: carryY,
            motion: moving ? [{ timeSeconds: moveTime, x: clamp(x1 + 0.06, -0.5, 1.5), y: carryY }] : undefined,
          };
        }
        if (prop.from) {
          return {
            ...base,
            x: prop.from[0],
            y: prop.from[1],
            motion: [{ timeSeconds: fit(prop.at ?? 1.5), x: prop.x, y: prop.y }],
          };
        }
        return { ...base, x: prop.x, y: prop.y };
      });

      const cast = (line.cast ?? []).map((member) => {
        const start = member.enter === "left" ? -0.15 : member.enter === "right" ? 1.15 : member.x;
        const target = member.enter ? member.x : member.to ?? member.x;
        const walking = Math.abs(target - start) > 0.005;
        return {
          id: member.id,
          characterType: member.characterType ?? heroType,
          action: walking ? "walking" as const : member.action ?? "idle",
          expression: member.expression ?? "happy",
          x: start,
          y: GROUND_Y,
          scale: heroScale * 0.95,
          lineColor: member.lineColor ?? "#2d3140",
          accessory: member.accessory ?? "cap",
          motion: walking
            ? [{ timeSeconds: round(walkTime(start, target, WALK_SPEED, duration)), x: target, y: GROUND_Y, action: member.action ?? "idle" }]
            : undefined,
        };
      });

      const hero = {
        id: "hero",
        characterType: heroType,
        action: moving ? gait : finalAction,
        expression: line.expression ?? "neutral",
        x: x0,
        y: GROUND_Y,
        scale: heroScale,
        lineColor: script.hero?.lineColor ?? "#1c1d22",
        accessory: script.hero?.accessory,
        motion: moving ? [{ timeSeconds: moveTime, x: x1, y: GROUND_Y, action: finalAction }] : undefined,
      };

      return {
        id: shotId,
        durationSeconds: duration,
        transitionSeconds: 0,
        background: location,
        camera,
        cameraMotion,
        letterbox: line.letterbox ?? false,
        tags: line.tag ? [{ id: `${shotId}-tag`, text: line.tag, startSeconds: fit(0.2), x: 0.5, y: 0.11 }] : [],
        characters: [hero, ...cast],
        objects,
        captions: chunkCaption(line.text, audioStart, audioDuration).map((chunk, chunkIndex) => ({
          id: `${shotId}-caption-${chunkIndex}`,
          ...chunk,
          mode: "explainer" as const,
          position: "bottom" as const,
          highlightWords: line.highlight,
        })),
        audioTracks: [{
          id: `${shotId}-voice`,
          src: `${options.audioDir}/${shotId}.wav`,
          startSeconds: audioStart,
          durationSeconds: audioDuration,
        }],
      };
    });
  });

  return parseStoryConfig({
    id: options.id,
    title: script.title,
    width: options.width ?? 1080,
    height: options.height ?? 1920,
    fps,
    scenes: scenes.reduce((all, shots) => all.concat(shots), [] as (typeof scenes)[number]),
  });
};
