// The neon city on the landing page. Windows use fixed positions, so the server and browser always agree.

const NEON = ["#35D0E0", "#FF8A2A", "#FF5FA8", "#7EE081", "#B79CFF", "#FDE24D"];
const WINDOW_COLOURS = ["#FDE24D", "#FDE24D", "#35D0E0", "#FF5FA8", "#7EE081", "#FFFFFF"];

// x, width, height of each plain tower. Gaps are left for the landmarks.
const TOWERS: [number, number, number][] = [
  [0, 54, 120], [58, 40, 170], [290, 46, 110], [340, 52, 160], [396, 38, 95],
  [640, 44, 130], [688, 56, 185], [748, 40, 120], [960, 48, 150], [1012, 42, 100],
  [1058, 50, 175], [1110, 34, 115], [1370, 70, 145],
];

function windowsFor(towers: [number, number, number][], height: number, flip: boolean) {
  return towers.flatMap(([x, width, tall], t) => {
    const spots = [];
    for (let wx = x + 7; wx + 7 <= x + width - 4; wx += 12) {
      for (let wy = 10; wy + 7 <= tall - 6; wy += 15) {
        if ((wx * 7 + wy * 13 + t) % 5 >= 2) continue;
        spots.push({ x: wx, y: flip ? wy : height - tall + wy });
      }
    }
    return spots;
  });
}

function Windows({ towers, height, flip = false, sequence = false }: {
  towers: [number, number, number][];
  height: number;
  flip?: boolean;
  sequence?: boolean;
}) {
  const spots = windowsFor(towers, height, flip);
  const ordered = sequence ? [...spots].sort((a, b) => a.x - b.x) : spots;
  return (
    <>
      {ordered.map((spot, i) => (
        <rect
          key={`${spot.x}-${spot.y}`}
          className={i % 12 === 0 ? "lp-win lp-flicker" : "lp-win"}
          x={spot.x}
          y={spot.y}
          width="7"
          height="7"
          fill={WINDOW_COLOURS[i % WINDOW_COLOURS.length]}
          style={sequence ? ({ "--seq": `${i * 0.025}s` } as React.CSSProperties) : { animationDelay: `${((i * 37) % 74) / 20}s` }}
        />
      ))}
    </>
  );
}

function Towers({ towers, height, flip = false }: { towers: [number, number, number][]; height: number; flip?: boolean }) {
  return (
    <>
      {towers.map(([x, width, tall], i) => (
        <rect
          key={x}
          x={x}
          y={flip ? -4 : height - tall}
          width={width}
          height={tall + 4}
          fill="#14103F"
          stroke={NEON[i % NEON.length]}
          strokeWidth="3"
        />
      ))}
    </>
  );
}

function Landmark({ x, colour, d, fill = "#191452" }: { x: number; colour: string; d: string; fill?: string }) {
  return <path transform={`translate(${x} 0)`} d={d} fill={fill} stroke={colour} strokeWidth="4" strokeLinejoin="round" />;
}

// Drawn on a 260-tall canvas, standing on the ground line.
const CHARMINAR =
  "M0 260V90a12 12 0 1 1 24 0V130H36V170a42 42 0 0 1 84 0V130h12V90a12 12 0 1 1 24 0V260H120V210a42 42 0 0 0-84 0V260Z";
const INDIA_GATE =
  "M0 260V110H12V90H118V110H130V260H92V170a27 27 0 0 0-54 0V260ZM38 90V70H92V90";
const QUTUB =
  "M26 260L38 110L44 30H60L66 110L78 260ZM34 200H70M38 140H66M41 85H63";
const GATEWAY =
  "M0 260V120a11 11 0 1 1 22 0V140H38V120a11 11 0 1 1 22 0V140H78V120a11 11 0 1 1 22 0V140H116V120a11 11 0 1 1 22 0V260H100V205a31 31 0 0 0-62 0V260Z";

export function HeroSkyline({ sequence = false }: { sequence?: boolean }) {
  return (
    <svg className="lp-skyline" viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <Towers towers={TOWERS} height={260} />
      <Landmark x={110} colour="#FF8A2A" d={CHARMINAR} />
      <Landmark x={470} colour="#FFFFFF" d={INDIA_GATE} />
      <Landmark x={800} colour="#7EE081" d={QUTUB} />
      <Landmark x={1180} colour="#35D0E0" d={GATEWAY} />
      <Windows towers={TOWERS} height={260} sequence={sequence} />
    </svg>
  );
}

const HANGING: [number, number, number][] = [
  [0, 70, 90], [90, 48, 130], [170, 60, 70], [260, 80, 120], [370, 44, 60], [440, 70, 140], [560, 50, 85],
  [740, 66, 125], [830, 46, 70], [900, 80, 135], [1010, 54, 90], [1090, 70, 120], [1190, 48, 65], [1260, 80, 130], [1360, 80, 85],
];

export function UpsideDownCity() {
  return (
    <svg className="lp-topcity" viewBox="0 0 1440 150" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <Towers towers={HANGING} height={150} flip />
      <Windows towers={HANGING} height={150} flip />
    </svg>
  );
}
