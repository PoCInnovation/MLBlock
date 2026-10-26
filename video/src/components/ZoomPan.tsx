import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

export type View = { x: number; y: number; s: number }; // centre en px sur la capture 1920x1080, échelle
// Les enfants sont rendus DANS le repère de la capture (coordonnées image) : ils suivent le zoom.
export const ZoomPan: React.FC<{ src: string; from: View; to: View; dur: number; children?: React.ReactNode }> = ({ src, from, to, dur, children }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, dur], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const v = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, s: from.s + (to.s - from.s) * t };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 1920, height: 1080, transformOrigin: "0 0",
        transform: `translate(${960 - v.x * v.s}px, ${540 - v.y * v.s}px) scale(${v.s})` }}>
        <Img src={staticFile(`shots/${src}`)} style={{ width: 1920, height: 1080 }} />
        {children}
      </div>
    </AbsoluteFill>
  );
};
