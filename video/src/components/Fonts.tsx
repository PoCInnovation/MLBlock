import { staticFile, continueRender, delayRender } from "remotion";
import { useEffect, useState } from "react";

// Charge les polices du produit (Geist + Fredoka) avant tout rendu d'image.
export const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const geist = new FontFace("Geist Variable", `url(${staticFile("fonts/geist-latin-wght-normal.woff2")})`, { weight: "100 900" });
    const fred = new FontFace("Fredoka", `url(${staticFile("fonts/fredoka-latin-700-normal.woff2")})`, { weight: "700" });
    Promise.all([geist.load(), fred.load()]).then(fs => { fs.forEach(f => document.fonts.add(f)); continueRender(h); });
  }, [h]);
};
