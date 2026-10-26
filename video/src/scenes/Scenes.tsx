import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { RESULTS, SCENES } from "../../data/timeline";
import { Callout } from "../components/Callout";
import { Counter } from "../components/Counter";
import { Subtitle } from "../components/Subtitle";
import { View, ZoomPan } from "../components/ZoomPan";
import { C, FONT, HEAD } from "../theme";

const sub = (id: string) => SCENES.find(s => s.id === id)!.sub;
const Frame: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>{children}<Subtitle text={sub(id)} /></AbsoluteFill>
);
const fit: View = { x: 960, y: 540, s: 1 };
const D = (id: string) => SCENES.find(s => s.id === id)!.sec * 30;

export const S1: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [20, 50], [0, 1], { extrapolateRight: "clamp" });
  return (
    <Frame id="hook">
      <ZoomPan src="00-landing.png" from={{ x: 1000, y: 400, s: 1.1 }} to={{ x: 1040, y: 400, s: 1.25 }} dur={D("hook")} />
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${C.bg} 0%, ${C.bg} 44%, ${C.bg}00 60%)`, opacity: o }} />
      <div style={{ position: "absolute", left: 120, top: 330, opacity: o }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 150, color: C.fg, lineHeight: 1 }}>MLBlock</div>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 64, color: C.primary, marginTop: 18 }}>Scratch, mais pour l'IA</div>
      </div>
    </Frame>
  );
};

// Projets : boutons Baselines / Importer (positions réelles sur 02-projets.png).
export const S2: React.FC = () => (
  <Frame id="dashboard">
    <ZoomPan src="02-projets.png" from={fit} to={{ x: 1200, y: 150, s: 1.7 }} dur={D("dashboard") - 30}>
      <Callout x={1112} y={62} w={104} h={42} label="Modèles prêts" at={55} labelSide="top" />
      <Callout x={1226} y={62} w={100} h={42} label="Importer le tien" at={95} labelSide="bottom" />
    </ZoomPan>
  </Frame>
);

export const S3: React.FC = () => (
  <Frame id="build">
    <ZoomPan src="04-editeur-complet.png" from={fit} to={{ x: 960, y: 540, s: 1 }} dur={90}>
      <Callout x={315} y={482} w={738} h={124} label="1 · Données" at={100} color={C.donnees} labelSide="top" />
      <Callout x={1088} y={344} w={246} h={356} label="2 · Modèle" at={220} color={C.modele} labelSide="top" />
      <Callout x={1364} y={344} w={236} h={370} label="3 · Résultats" at={340} color={C.resultats} labelSide="top" />
    </ZoomPan>
  </Frame>
);

export const S4: React.FC = () => (
  <Frame id="types">
    <ZoomPan src="06-type-refuse.png" from={fit} to={{ x: 1500, y: 900, s: 1.6 }} dur={80}>
      <Callout x={1538} y={978} w={352} h={78} at={90} color="#EF4444" label="Connexion refusée" labelSide="top" />
    </ZoomPan>
  </Frame>
);

export const S5: React.FC = () => {
  const f = useCurrentFrame();
  const swap = f > 150;
  return (
    <Frame id="score">
      <ZoomPan src={swap ? "08-score-popover.png" : "07-score-badge.png"} from={fit} to={swap ? { x: 1380, y: 220, s: 1.8 } : { x: 1480, y: 60, s: 2.2 }} dur={swap ? 120 : 140}>
        {!swap && <Callout x={1448} y={26} w={125} h={40} at={30} label="Score IA : 85 · Expert" labelSide="bottom" />}
      </ZoomPan>
    </Frame>
  );
};

const Card: React.FC<{ at: number; title: string; color: string; children: React.ReactNode }> = ({ at, title, color, children }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = spring({ frame: f - at, fps, config: { damping: 16 } });
  return (
    <div style={{ opacity: Math.min(1, Math.max(0, p)), transform: `translateY(${(1 - Math.min(1, Math.max(0, p))) * 30}px)`,
      background: C.card, border: `2px solid ${color}55`, borderRadius: 24, padding: "28px 36px", color: C.fg, fontFamily: FONT }}>
      <div style={{ color, fontWeight: 700, fontSize: 28, marginBottom: 12 }}>{title}</div>{children}
    </div>
  );
};
const fmt = (n: number) => String(n).padStart(2, " ");

// Résultats d'un vrai run (RESULTS). Cut sec « plus tard » entre queue et résultats.
export const S6: React.FC = () => {
  const f = useCurrentFrame();
  const phase = f < 240 ? 0 : 1; // 0..8 s : journal en attente, puis résultats
  return (
    <Frame id="run">
      {phase === 0 ? (
        <>
          <ZoomPan src="09-run-1-start.png" from={fit} to={{ x: 560, y: 840, s: 1.4 }} dur={200}>
            <Callout x={24} y={850} w={300} h={80} at={40} color={C.primary} label="Un job est créé" labelSide="top" />
          </ZoomPan>
        </>
      ) : (
        <AbsoluteFill style={{ background: C.bg }}>
          <div style={{ position: "absolute", left: 90, top: 70, fontFamily: HEAD, fontWeight: 700, fontSize: 56, color: C.fg }}>Résultats</div>
          <div style={{ position: "absolute", left: 90, top: 700, fontFamily: FONT, fontWeight: 600, fontSize: 28, color: C.fg, opacity: 0.65 }}>
            Exécution locale du code généré · jeu « wine » (scikit-learn, 178 vins)
          </div>
          <div style={{ position: "absolute", left: 90, top: 150, display: "grid", gridTemplateColumns: "800px", gap: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
              <Card at={250} title="Random Forest" color={C.modele}><Counter value={RESULTS.rf} from={255} size={80} /></Card>
              <Card at={275} title="Rég. logistique" color={C.modele}><Counter value={RESULTS.lr} from={280} size={80} /></Card>
            </div>
            <Card at={310} title="Matrice de confusion" color={C.resultats}>
              <pre style={{ margin: 0, fontFamily: "ui-monospace, monospace", fontSize: 44, lineHeight: 1.3, color: C.fg }}>
                {RESULTS.matrix.map(r => "[ " + r.map(fmt).join("  ") + " ]").join("\n")}
              </pre>
            </Card>
          </div>
          <div style={{ position: "absolute", right: 90, top: 150, opacity: interpolate(f, [340, 380], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            <div style={{ background: C.card, border: `2px solid ${C.resultats}55`, borderRadius: 24, padding: 20 }}>
              <div style={{ color: C.resultats, fontWeight: 700, fontSize: 28, margin: "0 0 10px 12px" }}>t-SNE · 3 classes de vins</div>
              <Img src={staticFile("shots/11-tsne.png")} style={{ width: 640, borderRadius: 12, background: "#fff" }} />
            </div>
          </div>
        </AbsoluteFill>
      )}
    </Frame>
  );
};

export const S7: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [60, 90], [0, 1], { extrapolateRight: "clamp" });
  return (
    <Frame id="outro">
      <ZoomPan src="10-cours.png" from={fit} to={{ x: 900, y: 420, s: 1.1 }} dur={D("outro")} />
      <AbsoluteFill style={{ background: `${C.bg}f0`, opacity: o }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: o, paddingBottom: 150 }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 120, color: C.fg }}>9 cours guidés</div>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 56, color: C.primary, marginTop: 20 }}>Essaie-le · MLBlock</div>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 34, color: C.fg, opacity: 0.7, marginTop: 30 }}>© PoC Innovation</div>
      </AbsoluteFill>
    </Frame>
  );
};
