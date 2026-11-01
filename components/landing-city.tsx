// The neon city on the landing page, drawn in the style of the EDITH logo.
// The drawings scale with the page width, so nothing is ever cropped from the top.

const WIDTH = 1800;
const GROUND = 300;
const NAVY = "#1B1D66";
const WINDOW = "#FDE24D";

type Tower = { x: number; width: number; height: number; colour: string; roof?: "antenna" | "ring" | "step" };

const CYAN = "#46E6F5";
const ORANGE = "#FF9A2E";
const PINK = "#FF4FA3";
const GREEN = "#3DDC84";
const VIOLET = "#A98BFF";
const AMBER = "#FFD23F";

const TOWERS: Tower[] = [
  { x: 0, width: 76, height: 130, colour: VIOLET },
  { x: 290, width: 78, height: 150, colour: GREEN, roof: "step" },
  { x: 376, width: 62, height: 195, colour: PINK, roof: "antenna" },
  { x: 446, width: 90, height: 120, colour: CYAN },
  { x: 720, width: 84, height: 165, colour: AMBER, roof: "ring" },
  { x: 812, width: 60, height: 110, colour: PINK },
  { x: 880, width: 76, height: 205, colour: CYAN, roof: "antenna" },
  { x: 1090, width: 70, height: 135, colour: ORANGE },
  { x: 1168, width: 86, height: 180, colour: VIOLET, roof: "step" },
  { x: 1262, width: 58, height: 120, colour: GREEN },
  { x: 1560, width: 80, height: 170, colour: PINK, roof: "ring" },
  { x: 1648, width: 66, height: 120, colour: AMBER },
  { x: 1722, width: 78, height: 190, colour: CYAN, roof: "antenna" },
];

const HANGING: Tower[] = [
  { x: 0, width: 88, height: 92, colour: VIOLET },
  { x: 104, width: 70, height: 122, colour: CYAN, roof: "ring" },
  { x: 190, width: 96, height: 70, colour: PINK },
  { x: 302, width: 78, height: 112, colour: GREEN },
  { x: 396, width: 62, height: 60, colour: AMBER },
  { x: 474, width: 98, height: 128, colour: CYAN, roof: "ring" },
  { x: 588, width: 70, height: 84, colour: ORANGE },
  { x: 1010, width: 84, height: 118, colour: VIOLET },
  { x: 1110, width: 64, height: 66, colour: PINK },
  { x: 1190, width: 96, height: 126, colour: GREEN, roof: "ring" },
  { x: 1302, width: 72, height: 80, colour: CYAN },
  { x: 1390, width: 88, height: 112, colour: AMBER },
  { x: 1494, width: 62, height: 64, colour: ORANGE },
  { x: 1572, width: 96, height: 122, colour: PINK, roof: "ring" },
  { x: 1684, width: 116, height: 86, colour: VIOLET },
];

interface Spot {
  x: number;
  y: number;
  lit: boolean;
}

// An even grid in every building, with every other window lit, so each one glows the same amount.
function towerWindows(tower: Tower, index: number, top: number): Spot[] {
  const size = 8;
  const columns = Math.max(2, Math.floor((tower.width - 20) / 20));
  const rows = Math.max(2, Math.floor((tower.height - 26) / 22));
  const gapX = (tower.width - columns * size) / (columns + 1);
  const spots: Spot[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      spots.push({
        x: tower.x + gapX + column * (size + gapX),
        y: top + 16 + row * 22,
        lit: (row + column + index) % 2 === 0,
      });
    }
  }
  return spots;
}

function TowerShape({ tower, flip }: { tower: Tower; flip: boolean }) {
  const { x, width, height, colour, roof } = tower;
  const top = flip ? -6 : GROUND - height;
  const middle = x + width / 2;
  return (
    <g fill={NAVY} stroke={colour} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
      {!flip && roof === "antenna" && <path d={`M${middle} ${top}V${top - 34}`} fill="none" />}
      {!flip && roof === "step" && <rect x={x + width * 0.25} y={top - 16} width={width * 0.5} height="16" />}
      <rect x={x} y={top} width={width} height={height + 6} />
      {roof === "ring" && (
        <rect
          x={middle - 16}
          y={flip ? height - 28 : top - 13}
          width="32"
          height="22"
          rx="6"
          fill={NAVY}
        />
      )}
    </g>
  );
}

function Windows({ spots, sequence }: { spots: Spot[]; sequence: boolean }) {
  const ordered = sequence ? [...spots].sort((a, b) => a.x - b.x) : spots;
  return (
    <>
      {spots.map((spot) => (
        <rect key={`d${spot.x}-${spot.y}`} x={spot.x} y={spot.y} width="8" height="8" rx="1" fill="#0E0F45" />
      ))}
      {ordered.filter((spot) => spot.lit).map((spot, i) => (
        <rect
          key={`${spot.x}-${spot.y}`}
          className="lp-win"
          x={spot.x}
          y={spot.y}
          width="8"
          height="8"
          rx="1"
          fill={WINDOW}
          style={sequence ? ({ "--seq": `${i * 0.025}s` } as React.CSSProperties) : { animationDelay: `${((i * 37) % 74) / 20}s` }}
        />
      ))}
    </>
  );
}

const line = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Charminar({ x }: { x: number }) {
  const minaret = (mx: number) => (
    <g>
      <path d={`M${mx} ${GROUND}V120H${mx + 22}V${GROUND}Z`} />
      <circle cx={mx + 11} cy="104" r="15" />
      <circle cx={mx + 11} cy="104" r="6" fill={ORANGE} stroke="none" />
      <path {...line} d={`M${mx - 5} 165H${mx + 27}M${mx - 5} 220H${mx + 27}`} />
    </g>
  );
  return (
    <g transform={`translate(${x} 0)`} fill={NAVY} stroke={ORANGE} strokeWidth="5" strokeLinejoin="round">
      <path d={`M22 ${GROUND}V185H142V${GROUND}Z`} />
      <path {...line} d="M22 205H142" />
      <path d={`M52 ${GROUND}V262Q82 208 112 262V${GROUND}`} fill="#120F3A" />
      {minaret(0)}
      {minaret(142)}
    </g>
  );
}

function IndiaGate({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`} fill={NAVY} stroke="#FFFFFF" strokeWidth="5" strokeLinejoin="round">
      <path d="M46 118V96H124V118" />
      <path d="M28 142V118H142V142" />
      <path d={`M10 ${GROUND}V142H160V${GROUND}Z`} />
      <path d={`M50 ${GROUND}V215Q50 175 85 175T120 215V${GROUND}`} fill="#120F3A" />
      <path {...line} d="M10 160H160" />
    </g>
  );
}

function QutubMinar({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`} fill={NAVY} stroke={GREEN} strokeWidth="5" strokeLinejoin="round">
      <path d={`M0 ${GROUND}L18 170L26 92L32 62H48L54 92L62 170L80 ${GROUND}Z`} />
      <path {...line} d="M8 238H72M12 168H68M20 112H60" />
      <circle cx="40" cy="52" r="9" />
    </g>
  );
}

function Gateway({ x }: { x: number }) {
  const turret = (tx: number) => (
    <g>
      <path d={`M${tx} 165V118Q${tx + 12} 98 ${tx + 24} 118V165Z`} />
    </g>
  );
  return (
    <g transform={`translate(${x} 0)`} fill={NAVY} stroke={CYAN} strokeWidth="5" strokeLinejoin="round">
      {turret(0)}
      {turret(56)}
      {turret(120)}
      {turret(176)}
      <path d={`M0 ${GROUND}V165H200V${GROUND}Z`} />
      <path d={`M62 ${GROUND}V252Q100 180 138 252V${GROUND}`} fill="#120F3A" />
      <path {...line} d="M0 188H62M138 188H200" />
    </g>
  );
}

export function HeroSkyline({ sequence = false }: { sequence?: boolean }) {
  const spots = TOWERS.flatMap((tower, i) => towerWindows(tower, i, GROUND - tower.height));
  return (
    <svg className="lp-skyline" viewBox={`0 0 ${WIDTH} ${GROUND}`} aria-hidden="true">
      {TOWERS.map((tower) => <TowerShape key={tower.x} tower={tower} flip={false} />)}
      <Charminar x={96} />
      <IndiaGate x={546} />
      <QutubMinar x={980} />
      <Gateway x={1340} />
      <Windows spots={spots} sequence={sequence} />
    </svg>
  );
}

export function UpsideDownCity() {
  const spots = HANGING.flatMap((tower, i) => towerWindows(tower, i, 0).filter((s) => s.y + 8 < tower.height - 28 || tower.roof !== "ring"));
  return (
    <svg className="lp-topcity" viewBox={`0 0 ${WIDTH} 140`} aria-hidden="true">
      {HANGING.map((tower) => <TowerShape key={tower.x} tower={tower} flip />)}
      <Windows spots={spots} sequence={false} />
    </svg>
  );
}
