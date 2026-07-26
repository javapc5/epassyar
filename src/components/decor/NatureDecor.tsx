/**
 * Nature & tourism SVG asset library — biophilic, themeable, zero-network.
 * All assets are inline vector (crisp at any size, honour currentColor,
 * aria-hidden decorative). Used as backgrounds, textures and dividers.
 */

/** Topographic contour lines — the classic trail-map motif.
 *  Renders in `currentColor`; drop it into a coloured surface at low opacity. */
export function TopoLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 400"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <g opacity="0.9">
        <path d="M-20 250 C 90 210 150 300 260 250 S 470 180 620 240" />
        <path d="M-20 210 C 100 165 170 255 280 205 S 470 130 620 195" />
        <path d="M-20 170 C 110 125 190 210 300 160 S 470 85 620 150" />
        <path d="M40 118 C 150 90 220 150 320 118 S 470 55 600 100" />
        <path d="M110 78 C 190 62 250 100 330 82 S 460 40 560 72" />
        <path d="M170 48 C 230 40 275 66 330 52" />
        <path d="M-20 300 C 110 268 180 340 300 300 S 480 240 620 300" />
        <path d="M-20 345 C 120 320 200 380 320 348 S 490 300 620 348" />
      </g>
    </svg>
  );
}

/** Layered rolling-hills divider. Sits flush at the bottom of a section
 *  to hand off organically to the next one. Pass fill colours via props. */
export function HillsDivider({
  className,
  back = "#DDEEDF",
  mid = "#8FC895",
  front = "#2E7D32",
}: {
  className?: string;
  back?: string;
  mid?: string;
  front?: string;
}) {
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path fill={back} d="M0 60 C 240 12 480 12 720 48 C 960 84 1200 84 1440 40 L1440 120 L0 120 Z" />
      <path fill={mid} d="M0 78 C 260 42 520 96 780 78 C 1020 62 1220 96 1440 72 L1440 120 L0 120 Z" opacity="0.9" />
      <path fill={front} d="M0 98 C 300 74 560 112 840 96 C 1080 82 1260 108 1440 94 L1440 120 L0 120 Z" />
    </svg>
  );
}

/** Pine-tree ridge silhouette — a woodland edge for footers / section tops. */
export function PineRidge({ className, fill = "currentColor" }: { className?: string; fill?: string }) {
  const trees = [40, 130, 205, 300, 380, 470, 560, 650, 740, 830, 920, 1010, 1100, 1190, 1280, 1380];
  return (
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className={className} aria-hidden="true">
      <rect x="0" y="52" width="1440" height="8" fill={fill} />
      {trees.map((x, i) => {
        const h = 30 + ((i * 7) % 18);
        return (
          <path
            key={x}
            d={`M${x} 54 L${x - 13} 54 L${x} ${54 - h} L${x + 13} 54 Z`}
            fill={fill}
          />
        );
      })}
    </svg>
  );
}

/** Soft radial sun-glow — a warm light source for hero corners. */
export function SunGlow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFF4C2" stopOpacity="0.9" />
          <stop offset="0.4" stopColor="#FFC845" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FFC845" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="100" fill="url(#sun-glow)" />
    </svg>
  );
}

/** Small leaf sprig accent — pairs with eyebrow labels & headings. */
export function LeafSprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2C7 4 4 8 4 13c0 4 3 8 8 9 0-6 1-9 5-13-3 1-5 3-6 6 0-4 0-7 1-13Z" />
    </svg>
  );
}
