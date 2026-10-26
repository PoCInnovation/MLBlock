import { Easing, interpolate, useCurrentFrame } from "remotion";
import { C, HEAD } from "../theme";

// Compteur animé de 0 à `value` (en %), virgule française.
export const Counter: React.FC<{ value: number; from?: number; dur?: number; color?: string; size?: number }> =
  ({ value, from = 0, dur = 45, color = C.primary, size = 120 }) => {
    const f = useCurrentFrame();
    const v = interpolate(f, [from, from + dur], [0, value * 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    return <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: size, color, whiteSpace: "nowrap" }}>{v.toFixed(1).replace(".", ",")} %</span>;
  };
