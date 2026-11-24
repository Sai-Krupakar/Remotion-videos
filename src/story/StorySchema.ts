import { z } from "zod";

export const characterActionSchema = z.enum([
  "idle",
  "walking",
  "running",
  "jumping",
  "falling",
  "sitting",
  "standing-up",
  "waving",
  "talking",
  "thinking",
  "pointing",
  "celebrating",
  "looking-around",
  "shaking-head",
  "surprised",
  "sleeping",
  "stretching",
]);

export const expressionSchema = z.enum([
  "neutral",
  "happy",
  "sad",
  "angry",
  "surprised",
  "confused",
  "crying",
  "laughing",
  "scared",
  "thinking",
]);

const motionKeyframeSchema = z.object({
  timeSeconds: z.number().positive(),
  x: z.number().min(-0.5).max(1.5),
  y: z.number().min(0).max(1),
  action: characterActionSchema,
});

const characterSchema = z.object({
  id: z.string().min(1),
  action: characterActionSchema,
  expression: expressionSchema,
  x: z.number().min(-0.5).max(1.5),
  y: z.number().min(0).max(1),
  scale: z.number().positive().default(1),
  rotation: z.number().default(0),
  lineColor: z.string().default("#20202a"),
  headColor: z.string().default("#fffdf8"),
  characterType: z.enum(["stickman", "nw052", "explainer", "toon"]).default("stickman"),
  accessory: z.enum(["none", "cap", "bow"]).optional(),
  motion: z.array(motionKeyframeSchema).optional(),
});

const cameraKeyframeSchema = z.object({
  timeSeconds: z.number().nonnegative(),
  x: z.number().min(0).max(1).default(0.5),
  y: z.number().min(0).max(1).default(0.5),
  zoom: z.number().min(1).max(3).default(1),
  ease: z.enum(["smooth", "cut"]).default("smooth"),
});

const objectMotionKeyframeSchema = z.object({
  timeSeconds: z.number().positive(),
  x: z.number().min(-0.5).max(1.5),
  y: z.number().min(-0.5).max(1.5),
});

const tagSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  startSeconds: z.number().nonnegative().default(0),
  endSeconds: z.number().positive().optional(),
  x: z.number().min(0).max(1).default(0.5),
  y: z.number().min(0).max(1).default(0.1),
});

export const objectSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "bed",
    "clock",
    "alarm",
    "obstacle",
    "chair",
    "table",
    "door",
    "phone",
    "box",
    "tree",
    "car",
    "house",
    "laptop",
    "flower",
    "bee",
    "seed",
    "sprout",
    "watering-can",
    "garden-bed",
    "bench",
    "lamp-post",
    "sofa",
    "plant-pot",
  ]),
  x: z.number().min(-0.5).max(1.5),
  y: z.number().min(-0.5).max(1.5),
  scale: z.number().positive().default(1),
  rotation: z.number().default(0),
  appearSeconds: z.number().nonnegative().optional(),
  motion: z.array(objectMotionKeyframeSchema).optional(),
});

const wordTimingSchema = z.object({
  text: z.string().min(1),
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().positive(),
});

const captionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().positive(),
  mode: z.enum(["caption", "dialogue", "explainer"]).default("caption"),
  position: z.enum(["top", "middle", "bottom"]).default("bottom"),
  fontSize: z.number().positive().optional(),
  highlightWords: z.array(z.string()).optional(),
  words: z.array(wordTimingSchema).optional(),
});

const audioTrackSchema = z.object({
  id: z.string().min(1),
  src: z.string().min(1),
  startSeconds: z.number().nonnegative().default(0),
  durationSeconds: z.number().positive().optional(),
  volume: z.number().min(0).max(1).default(1),
  fadeInSeconds: z.number().nonnegative().default(0),
  fadeOutSeconds: z.number().nonnegative().default(0),
});

const sceneSchema = z.object({
  id: z.string().min(1),
  durationSeconds: z.number().positive(),
  transitionSeconds: z.number().nonnegative().default(0.35),
  background: z.enum(["bedroom", "room", "street", "park", "night", "solid", "garden", "sidewalk", "living-room"]),
  backgroundColor: z.string().optional(),
  camera: z
    .object({
      x: z.number().min(0).max(1).default(0.5),
      y: z.number().min(0).max(1).default(0.5),
      zoom: z.number().min(1).max(3).default(1),
    })
    .optional(),
  cameraMotion: z.array(cameraKeyframeSchema).optional(),
  letterbox: z.boolean().optional(),
  tags: z.array(tagSchema).optional(),
  characters: z.array(characterSchema).default([]),
  objects: z.array(objectSchema).default([]),
  captions: z.array(captionSchema).default([]),
  audioTracks: z.array(audioTrackSchema).default([]),
});

export const storySchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    fps: z.number().int().positive(),
    scenes: z.array(sceneSchema).min(1),
    audioTracks: z.array(audioTrackSchema).default([]),
  })
  .superRefine((story, context) => {
    const sceneIds = new Set<string>();

    story.scenes.forEach((scene, index) => {
      if (sceneIds.has(scene.id)) {
        context.addIssue({
          code: "custom",
          message: `Scene ID "${scene.id}" must be unique.`,
          path: ["scenes", index, "id"],
        });
      }
      sceneIds.add(scene.id);

      if (scene.transitionSeconds >= scene.durationSeconds && index > 0) {
        context.addIssue({
          code: "custom",
          message: `Scene "${scene.id}" transition must be shorter than its duration.`,
          path: ["scenes", index, "transitionSeconds"],
        });
      }

      if (index > 0 && scene.transitionSeconds >= story.scenes[index - 1].durationSeconds) {
        context.addIssue({
          code: "custom",
          message: `Scene "${scene.id}" transition must be shorter than the previous scene.`,
          path: ["scenes", index, "transitionSeconds"],
        });
      }

      scene.characters.forEach((character, characterIndex) => {
        let previousFrame = 0;
        character.motion?.forEach((keyframe, motionIndex) => {
          const keyframeFrame = Math.round(keyframe.timeSeconds * story.fps);
          if (keyframeFrame <= previousFrame || keyframe.timeSeconds >= scene.durationSeconds) {
            context.addIssue({
              code: "custom",
              message: "Motion keyframes must have distinct, increasing frame times inside the scene.",
              path: ["scenes", index, "characters", characterIndex, "motion", motionIndex],
            });
          }
          previousFrame = keyframeFrame;
        });
      });

      const checkKeyframes = (times: number[], path: (string | number)[], allowZero: boolean) => {
        let previous = allowZero ? -1 : 0;
        times.forEach((time, keyframeIndex) => {
          const keyframeFrame = Math.round(time * story.fps);
          if (keyframeFrame <= previous || time >= scene.durationSeconds) {
            context.addIssue({
              code: "custom",
              message: "Keyframes must have distinct, increasing frame times inside the scene.",
              path: [...path, keyframeIndex],
            });
          }
          previous = keyframeFrame;
        });
      };
      checkKeyframes((scene.cameraMotion ?? []).map((keyframe) => keyframe.timeSeconds), ["scenes", index, "cameraMotion"], true);
      scene.objects.forEach((object, objectIndex) => {
        checkKeyframes((object.motion ?? []).map((keyframe) => keyframe.timeSeconds), ["scenes", index, "objects", objectIndex, "motion"], false);
      });

      const captionIds = new Set<string>();
      scene.captions.forEach((caption, captionIndex) => {
        if (captionIds.has(caption.id)) {
          context.addIssue({
            code: "custom",
            message: `Caption ID "${caption.id}" must be unique within its scene.`,
            path: ["scenes", index, "captions", captionIndex, "id"],
          });
        }
        captionIds.add(caption.id);

        if (caption.endSeconds <= caption.startSeconds) {
          context.addIssue({
            code: "custom",
            message: `Caption "${caption.id}" must end after it starts.`,
            path: ["scenes", index, "captions", captionIndex, "endSeconds"],
          });
        }

        if (caption.endSeconds > scene.durationSeconds) {
          context.addIssue({
            code: "custom",
            message: `Caption "${caption.id}" must end within its scene.`,
            path: ["scenes", index, "captions", captionIndex, "endSeconds"],
          });
        }

        if (caption.words?.some((word) => word.endSeconds <= word.startSeconds)) {
          context.addIssue({
            code: "custom",
            message: `Word timings for caption "${caption.id}" must have positive durations.`,
            path: ["scenes", index, "captions", captionIndex, "words"],
          });
        }
      });
    });
  });

export type StoryConfig = z.infer<typeof storySchema>;
export type StoryScene = StoryConfig["scenes"][number];
export type StoryCharacter = StoryScene["characters"][number];
export type StoryObject = StoryScene["objects"][number];
export type StoryCaption = StoryScene["captions"][number];
export type StoryTag = NonNullable<StoryScene["tags"]>[number];
export type CameraKeyframe = NonNullable<StoryScene["cameraMotion"]>[number];
export type AudioTrack = StoryConfig["audioTracks"][number];

export const parseStoryConfig = (config: unknown): StoryConfig =>
  storySchema.parse(config);

export const getStoryDurationInFrames = (story: StoryConfig): number => {
  return story.scenes.reduce(
    (total, scene) => total + Math.round(scene.durationSeconds * story.fps),
    0,
  );
};
