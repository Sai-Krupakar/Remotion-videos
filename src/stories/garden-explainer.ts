import { parseStoryConfig } from "../story/StorySchema";

export const gardenExplainerStory = parseStoryConfig({
  id: "garden-explainer",
  title: "A Garden in Motion",
  width: 1080,
  height: 1920,
  fps: 30,
  scenes: [
    {
      id: "garden",
      durationSeconds: 4,
      transitionSeconds: 0,
      background: "garden",
      characters: [{
        id: "guide",
        characterType: "explainer",
        action: "walking",
        expression: "happy",
        x: 0.24,
        y: 0.79,
        scale: 1.35,
        lineColor: "#191a20",
        motion: [
          { timeSeconds: 2, x: 0.48, y: 0.79, action: "pointing" },
        ],
      }],
      objects: [
        { id: "flower-left", type: "flower", x: 0.14, y: 0.75, scale: 1.05 },
        { id: "flower-right", type: "flower", x: 0.82, y: 0.75, scale: 1.35 },
        { id: "bee", type: "bee", x: 0.72, y: 0.51, scale: 0.65 },
      ],
      captions: [
        { id: "intro", text: "A garden is full of life", startSeconds: 0.3, endSeconds: 3.8, mode: "explainer", position: "bottom", highlightWords: ["life"] },
      ],
    },
    {
      id: "flowers",
      durationSeconds: 4,
      transitionSeconds: 0,
      background: "garden",
      characters: [{
        id: "guide",
        characterType: "explainer",
        action: "talking",
        expression: "happy",
        x: 0.31,
        y: 0.79,
        scale: 1.35,
        lineColor: "#191a20",
        motion: [
          { timeSeconds: 1.6, x: 0.31, y: 0.79, action: "pointing" },
          { timeSeconds: 3.2, x: 0.31, y: 0.79, action: "talking" },
        ],
      }],
      objects: [
        { id: "flower-one", type: "flower", x: 0.6, y: 0.76, scale: 1.1 },
        { id: "flower-two", type: "flower", x: 0.84, y: 0.76, scale: 1.25 },
        { id: "bee", type: "bee", x: 0.65, y: 0.53, scale: 0.8 },
      ],
      captions: [
        { id: "pollen", text: "Bees carry pollen between flowers", startSeconds: 0.3, endSeconds: 3.8, mode: "explainer", position: "bottom", highlightWords: ["pollen"] },
      ],
    },
    {
      id: "goodbye",
      durationSeconds: 4,
      transitionSeconds: 0,
      background: "garden",
      characters: [{
        id: "guide",
        characterType: "explainer",
        action: "talking",
        expression: "happy",
        x: 0.48,
        y: 0.79,
        scale: 1.35,
        lineColor: "#191a20",
        motion: [
          { timeSeconds: 1.4, x: 0.48, y: 0.79, action: "waving" },
        ],
      }],
      objects: [
        { id: "flower-one", type: "flower", x: 0.17, y: 0.76, scale: 1.15 },
        { id: "flower-two", type: "flower", x: 0.83, y: 0.76, scale: 1.15 },
        { id: "bee", type: "bee", x: 0.73, y: 0.51, scale: 0.65 },
      ],
      captions: [
        { id: "thanks", text: "Small helpers make a big difference", startSeconds: 0.3, endSeconds: 3.8, mode: "explainer", position: "bottom", highlightWords: ["big"] },
      ],
    },
  ],
});
