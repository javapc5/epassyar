/** Lightweight SVG scene placeholders keyed by category, until real photos are added. */

type Props = { kind: string; className?: string };

function pick(kind: string): string {
  const k = kind.toLowerCase();
  if (k.includes("cave") || k.includes("heritage")) return "cave";
  if (k.includes("adventure")) return "adventure";
  if (k.includes("waterfall") || k.includes("falls")) return "falls";
  if (k.includes("landmark") || k.includes("bridge")) return "bridge";
  if (k.includes("viewpoint") || k.includes("viewdeck")) return "view";
  if (k.includes("park")) return "park";
  return "falls";
}

export default function Scenery({ kind, className }: Props) {
  const scene = pick(kind);
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      {scene === "falls" && <Falls />}
      {scene === "cave" && <Cave />}
      {scene === "bridge" && <Bridge />}
      {scene === "view" && <ViewDeck />}
      {scene === "park" && <Park />}
      {scene === "adventure" && <Adventure />}
    </svg>
  );
}

function Falls() {
  return (
    <>
      <defs>
        <linearGradient id="s-falls" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fd8e8" />
          <stop offset="1" stopColor="#2b7a4b" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#s-falls)" />
      <path d="M0,150 L300,120 L400,150 L400,240 L0,240Z" fill="#20603a" />
      <path d="M185,70 q6,70 -12,120 q26,-14 33,-56 q10,44 26,56 q-14,-58 -8,-120Z" fill="#eaf9ff" />
      <ellipse cx="200" cy="215" rx="120" ry="20" fill="#4ea8cf" opacity="0.85" />
    </>
  );
}

function Cave() {
  return (
    <>
      <linearGradient id="s-cave" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f7d9a0" />
        <stop offset="1" stopColor="#7a5a2b" />
      </linearGradient>
      <rect width="400" height="240" fill="url(#s-cave)" />
      <ellipse cx="200" cy="215" rx="200" ry="80" fill="#4d3a1c" />
      <path d="M110,215 Q200,55 290,215 Z" fill="#2e2210" />
      <path d="M150,215 Q200,100 250,215 Z" fill="#120d05" />
    </>
  );
}

function Bridge() {
  return (
    <>
      <linearGradient id="s-bridge" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a8d8b0" />
        <stop offset="1" stopColor="#155a2e" />
      </linearGradient>
      <rect width="400" height="240" fill="url(#s-bridge)" />
      <path d="M0,120 L400,90" stroke="#5a4632" strokeWidth="8" fill="none" />
      <path d="M0,120 L400,90" stroke="#8a6f52" strokeWidth="2" fill="none" strokeDasharray="6 8" />
      <path d="M40,116 L40,240 M120,108 L120,240 M200,100 L200,240 M280,92 L280,240 M360,84 L360,240" stroke="#5a4632" strokeWidth="3" />
      <path d="M0,190 Q100,180 200,195 T400,182 L400,240 L0,240Z" fill="#2c76a8" />
    </>
  );
}

function ViewDeck() {
  return (
    <>
      <linearGradient id="s-view" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffd9a0" />
        <stop offset="1" stopColor="#8a5a2b" />
      </linearGradient>
      <rect width="400" height="240" fill="url(#s-view)" />
      <circle cx="320" cy="55" r="26" fill="#fff2c8" />
      <path d="M0,150 L100,90 L210,140 L320,80 L400,130 L400,240 L0,240Z" fill="#8a5a2b" />
      <path d="M0,175 L130,135 L260,180 L400,150 L400,240 L0,240Z" fill="#1d5c33" />
      <path d="M30,180 h55 M95,168 h55 M175,180 h55" stroke="#3f7d4e" strokeWidth="5" />
    </>
  );
}

function Park() {
  return (
    <>
      <linearGradient id="s-park" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b7dff0" />
        <stop offset="1" stopColor="#2e6b35" />
      </linearGradient>
      <rect width="400" height="240" fill="url(#s-park)" />
      <path d="M0,130 L90,70 L180,115 L270,60 L400,120 L400,240 L0,240Z" fill="#2e6b35" />
      <path d="M70,95 l12,-34 l12,34Z M110,102 l10,-30 l10,30Z M300,90 l12,-34 l12,34Z" fill="#155a2e" />
    </>
  );
}

function Adventure() {
  return (
    <>
      <linearGradient id="s-adv" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8ecfa4" />
        <stop offset="1" stopColor="#174a2c" />
      </linearGradient>
      <rect width="400" height="240" fill="url(#s-adv)" />
      <path d="M0,90 L400,70 L400,240 L0,240Z" fill="#174a2c" />
      <path d="M198,40 q5,60 -12,100 q22,-12 28,-50 q9,38 22,50 q-12,-46 -7,-100Z" fill="#eafaff" />
      <path d="M198,52 L188,150" stroke="#ffb300" strokeWidth="3" strokeDasharray="5 5" />
      <circle cx="188" cy="150" r="5" fill="#ffb300" />
      <ellipse cx="200" cy="220" rx="110" ry="16" fill="#3f9cc4" />
    </>
  );
}
