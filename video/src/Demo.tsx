import { AbsoluteFill } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { FADE, FPS, SCENES } from "../data/timeline";
import { useFonts } from "./components/Fonts";
import { S1, S2, S3, S4, S5, S6, S7 } from "./scenes/Scenes";
import { C } from "./theme";

const MAP = [S1, S2, S3, S4, S5, S6, S7];
export const Demo: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <TransitionSeries>
        {SCENES.flatMap((s, i) => {
          const S = MAP[i];
          const seq = (
            <TransitionSeries.Sequence key={s.id} durationInFrames={s.sec * FPS}><S /></TransitionSeries.Sequence>
          );
          // Cut sec avant la scène 6 (« plus tard ») : pas de fondu ; fondu ailleurs.
          return i === SCENES.length - 1 ? [seq] : [seq, <TransitionSeries.Transition key={`t${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: FADE })} />];
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
