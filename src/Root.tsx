import { Composition, Folder } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";
import { normalDayStory } from "./stories/a-normal-day";
import { everyoneGoneStory } from "./stories/nw052-everyone-gone";
import { gardenExplainerStory } from "./stories/garden-explainer";
import { littleSeedStory } from "./stories/little-seed";
import {
  calculateStoryMetadata,
  StoryVideo,
} from "./story/StoryVideo";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Elements">
        <Composition
          id="Logo"
          component={Logo}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            logoColor1: "#91EAE4",
            logoColor2: "#86A8E7",
          }}
        />
        <Composition
          id="Title"
          component={Title}
          durationInFrames={115}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            titleText: "Welcome to Remotion",
            titleColor: "#000000",
          }}
        />
      </Folder>
      <Composition
        // You can take the "id" to render a video:
        // bunx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
        }}
      />
      <Folder name="Stickman-Stories">
        <Composition
          id="StickmanStory"
          component={StoryVideo}
          durationInFrames={900}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ story: normalDayStory }}
          calculateMetadata={calculateStoryMetadata}
        />
        <Composition
          id="StickmanStoryLandscape"
          component={StoryVideo}
          durationInFrames={900}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            story: { ...normalDayStory, width: 1920, height: 1080 },
          }}
          calculateMetadata={calculateStoryMetadata}
        />
        <Composition
          id="StickmanStoryPreview"
          component={StoryVideo}
          durationInFrames={900}
          fps={30}
          width={720}
          height={1280}
          defaultProps={{
            story: { ...normalDayStory, width: 720, height: 1280 },
          }}
          calculateMetadata={calculateStoryMetadata}
        />
      </Folder>
      <Folder name="NW052-Stories">
        <Composition
          id="EveryoneGoneStory"
          component={StoryVideo}
          durationInFrames={450}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ story: everyoneGoneStory }}
          calculateMetadata={calculateStoryMetadata}
        />
        <Composition
          id="EveryoneGoneStoryLandscape"
          component={StoryVideo}
          durationInFrames={450}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            story: { ...everyoneGoneStory, width: 1920, height: 1080 },
          }}
          calculateMetadata={calculateStoryMetadata}
        />
        <Composition
          id="EveryoneGoneStoryPreview"
          component={StoryVideo}
          durationInFrames={450}
          fps={30}
          width={720}
          height={1280}
          defaultProps={{
            story: { ...everyoneGoneStory, width: 720, height: 1280 },
          }}
          calculateMetadata={calculateStoryMetadata}
        />
      </Folder>
      <Folder name="Explainer-Stories">
        <Composition
          id="LittleSeedPreview"
          component={StoryVideo}
          durationInFrames={3600}
          fps={30}
          width={720}
          height={1280}
          defaultProps={{ story: { ...littleSeedStory, width: 720, height: 1280 } }}
          calculateMetadata={calculateStoryMetadata}
        />
        <Composition
          id="LittleSeed"
          component={StoryVideo}
          durationInFrames={3600}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ story: littleSeedStory }}
          calculateMetadata={calculateStoryMetadata}
        />
        <Composition
          id="LittleSeedLandscape"
          component={StoryVideo}
          durationInFrames={3600}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ story: { ...littleSeedStory, width: 1920, height: 1080 } }}
          calculateMetadata={calculateStoryMetadata}
        />
        <Composition
          id="GardenExplainer"
          component={StoryVideo}
          durationInFrames={360}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ story: gardenExplainerStory }}
          calculateMetadata={calculateStoryMetadata}
        />
        <Composition
          id="GardenExplainerPreview"
          component={StoryVideo}
          durationInFrames={360}
          fps={30}
          width={720}
          height={1280}
          defaultProps={{ story: { ...gardenExplainerStory, width: 720, height: 1280 } }}
          calculateMetadata={calculateStoryMetadata}
        />
        <Composition
          id="GardenExplainerLandscape"
          component={StoryVideo}
          durationInFrames={360}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ story: { ...gardenExplainerStory, width: 1920, height: 1080 } }}
          calculateMetadata={calculateStoryMetadata}
        />
      </Folder>
      <Folder name="Automation">
        {/* Renders any built story passed with --props (used by scripts/pipeline.py). */}
        <Composition
          id="ScriptStory"
          component={StoryVideo}
          durationInFrames={3600}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ story: littleSeedStory }}
          calculateMetadata={calculateStoryMetadata}
        />
      </Folder>
    </>
  );
};
