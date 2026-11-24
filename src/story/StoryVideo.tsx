import type React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background } from "../components/Background";
import { AnimatedCaption } from "../components/AnimatedCaption";
import { StoryObject } from "../components/StoryObject";
import { Stickman } from "../characters/Stickman";
import { StickmanNW052 } from "../characters/StickmanNW052";
import { ExplainerStickman } from "../characters/ExplainerStickman";
import { ToonStickman } from "../characters/ToonStickman";
import { Letterbox, TagPill } from "../components/Overlays";
import { getCameraTransform, resolveCamera } from "./camera";
import { resolveCharacterMotion } from "../characters/motion";
import {
  getStoryDurationInFrames,
  storySchema,
  type AudioTrack,
  type StoryConfig,
  type StoryScene,
} from "./StorySchema";

export type StoryVideoProps = {
  story: StoryConfig;
};

const getSceneStartFrames = (story: StoryConfig) => {
  let currentFrame = 0;

  return story.scenes.map((scene, index) => {
    const incomingTransition =
      index === 0 ? 0 : Math.round(scene.transitionSeconds * story.fps);
    if (index > 0) {
      currentFrame -= incomingTransition;
    }
    const startFrame = currentFrame;
    currentFrame +=
      Math.round(scene.durationSeconds * story.fps) + incomingTransition;
    return startFrame;
  });
};

const SceneLayer: React.FC<{
  scene: StoryScene;
  index: number;
  story: StoryConfig;
}> = ({ scene, index, story }) => {
  const { durationInFrames: totalFrames } = useVideoConfig();
  const previousTransition =
    index === 0 ? 0 : Math.round(scene.transitionSeconds * story.fps);
  const sceneDuration =
    Math.round(scene.durationSeconds * story.fps) + previousTransition;
  const nextTransition =
    index === story.scenes.length - 1
      ? 0
      : Math.round(story.scenes[index + 1].transitionSeconds * story.fps);

  return (
    <SceneContents
      scene={scene}
      story={story}
      sceneDuration={sceneDuration}
      previousTransition={previousTransition}
      nextTransition={nextTransition}
      totalFrames={totalFrames}
    />
  );
};

const SceneContents: React.FC<{
  scene: StoryScene;
  story: StoryConfig;
  sceneDuration: number;
  previousTransition: number;
  nextTransition: number;
  totalFrames: number;
}> = ({
  scene,
  story,
  sceneDuration,
  previousTransition,
  nextTransition,
  totalFrames,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const fadeIn = previousTransition
    ? interpolate(frame, [0, previousTransition], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const fadeOut = nextTransition
    ? interpolate(
      frame,
        [sceneDuration - nextTransition, sceneDuration],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 1;
  const legacyCamera = !scene.cameraMotion;
  const cameraState = resolveCamera(scene, frame, story.fps);
  const camera = getCameraTransform(cameraState, width, height, legacyCamera);
  // The sky moves at 40% of the camera's zoom to create depth.
  const skyCamera = getCameraTransform(
    { ...cameraState, zoom: 1 + (camera.zoom - 1) * 0.4 },
    width,
    height,
    legacyCamera,
  );
  const skyTransform = `translate(${(skyCamera.tx - camera.tx) / camera.zoom} ${(skyCamera.ty - camera.ty) / camera.zoom}) scale(${skyCamera.zoom / camera.zoom})`;
  const tracks = scene.audioTracks ?? [];

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut), overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <Background
          background={scene.background}
          backgroundColor={scene.backgroundColor}
          skyTransform={skyTransform}
        />
        {scene.objects.map((object) => (
          <StoryObject key={object.id} object={object} />
        ))}
        {scene.characters.map((character) => {
          const resolved = resolveCharacterMotion(character, frame, story.fps);
          if (character.characterType === "toon") {
            return <ToonStickman key={character.id} character={resolved.character} pose={resolved.pose} direction={resolved.direction} />;
          }
          const CharacterComponent = character.characterType === "nw052"
            ? StickmanNW052
            : character.characterType === "explainer" ? ExplainerStickman : Stickman;
          return <CharacterComponent key={character.id} character={resolved.character} pose={resolved.pose} />;
        })}
      </AbsoluteFill>
      {scene.letterbox && <Letterbox />}
      {(scene.tags ?? []).map((tag) => (
        <TagPill key={tag.id} tag={tag} />
      ))}
      {scene.captions.map((caption) => (
        <AnimatedCaption key={caption.id} caption={caption} />
      ))}
      {tracks.map((track) => (
        <AudioSequence
          key={`${scene.id}-${track.id}`}
          track={track}
          fps={story.fps}
          totalFrames={totalFrames}
        />
      ))}
    </AbsoluteFill>
  );
};

const AudioSequence: React.FC<{
  track: AudioTrack;
  fps: number;
  totalFrames: number;
}> = ({ track, fps, totalFrames }) => {
  const from = Math.round(track.startSeconds * fps);
  const duration = track.durationSeconds
    ? Math.round(track.durationSeconds * fps)
    : Math.max(1, totalFrames - from);
  const fadeInFrames = Math.round(track.fadeInSeconds * fps);
  const fadeOutFrames = Math.round(track.fadeOutSeconds * fps);

  const getVolume = (frame: number) => {
    let envelope = 1;

    if (fadeInFrames > 0 && frame < fadeInFrames) {
      envelope = Math.min(
        envelope,
        interpolate(frame, [0, fadeInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      );
    }

    if (fadeOutFrames > 0 && frame > duration - fadeOutFrames) {
      envelope = Math.min(
        envelope,
        interpolate(frame, [duration - fadeOutFrames, duration], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      );
    }

    return track.volume * envelope;
  };

  return (
    <Sequence from={from} durationInFrames={duration} layout="none">
      <Audio
        src={staticFile(track.src)}
        volume={getVolume}
      />
    </Sequence>
  );
};

export const StoryVideo: React.FC<StoryVideoProps> = ({ story: inputStory }) => {
  const story = storySchema.parse(inputStory);
  const starts = getSceneStartFrames(story);
  const totalFrames = getStoryDurationInFrames(story);

  return (
    <AbsoluteFill style={{ backgroundColor: "#f4eee4" }}>
      {story.scenes.map((scene, index) => (
        <Sequence
          key={scene.id}
          from={starts[index]}
          durationInFrames={
            Math.round(scene.durationSeconds * story.fps) +
            (index === 0 ? 0 : Math.round(scene.transitionSeconds * story.fps))
          }
          layout="none"
        >
          <SceneLayer scene={scene} index={index} story={story} />
        </Sequence>
      ))}
      {story.audioTracks.map((track) => (
        <AudioSequence
          key={`story-${track.id}`}
          track={track}
          fps={story.fps}
          totalFrames={totalFrames}
        />
      ))}
    </AbsoluteFill>
  );
};

export const calculateStoryMetadata = ({
  props,
}: {
  props: StoryVideoProps;
}) => {
  const story = storySchema.parse(props.story);

  return {
    durationInFrames: getStoryDurationInFrames(story),
    fps: story.fps,
    width: story.width,
    height: story.height,
    props: { story },
  };
};
