// Hero mode's comic artwork and the small icons used across setup.

const WEB_RAYS = [
  [0, 150], [30, 148], [62, 140], [92, 122], [118, 96], [136, 68], [146, 36], [150, 0],
];

function strandDelay(index: number) {
  return { animationDelay: `${index * 130}ms` };
}

export function CornerWeb() {
  const rings = [0.28, 0.5, 0.72, 0.95];
  return (
    <svg className="corner-web" viewBox="0 0 150 150" aria-hidden="true">
      {WEB_RAYS.map(([x, y], i) => (
        <path key={`${x}-${y}`} className="web-strand" pathLength={1} style={strandDelay(i)} d={`M150 0L${150 - x} ${y}`} />
      ))}
      {rings.map((r, ring) => {
        const points = WEB_RAYS.map(([x, y]) => [150 - x * r, y * r]);
        const d = points
          .map(([x, y], i) => {
            if (i === 0) return `M${x} ${y}`;
            const [px, py] = points[i - 1];
            // Sag each strand towards the web's centre.
            const cx = (x + px) / 2 + (150 - (x + px) / 2) * 0.12;
            const cy = (y + py) / 2 - ((y + py) / 2) * 0.12;
            return `Q${cx} ${cy} ${x} ${y}`;
          })
          .join("");
        return <path key={r} className="web-strand" pathLength={1} style={strandDelay(WEB_RAYS.length + ring)} d={d} />;
      })}
    </svg>
  );
}

export function SpiderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 19L11 12L8 5M29 19L37 12L40 5" />
        <path d="M18 24H9L4 19M30 24H39L44 19" />
        <path d="M18 28L10 33L7 41M30 28L38 33L41 41" />
        <path d="M20 31L15 38L16 45M28 31L33 38L32 45" />
      </g>
      <ellipse cx="24" cy="17" rx="4" ry="4" fill="currentColor" />
      <ellipse cx="24" cy="27" rx="6.5" ry="8.5" fill="currentColor" />
    </svg>
  );
}

const BUILDINGS = [
  [0, 42, 34], [34, 24, 52], [62, 50, 40], [116, 16, 64], [146, 40, 46], [190, 26, 58],
  [220, 44, 36], [268, 30, 50], [302, 58, 44], [364, 26, 60], [394, 46, 38],
];
const WINDOW_COLOURS = ["#FFE14D", "#FFE14D", "#FFE14D", "#3D7BFF"];

// A fixed scatter of windows, so the skyline looks the same on every visit.
const WINDOWS = BUILDINGS.flatMap(([x, width, top]) => {
  const spots: { x: number; y: number }[] = [];
  for (let wx = x + 5; wx + 4 <= x + width - 3; wx += 9) {
    for (let wy = top + 6; wy + 4 <= 96; wy += 11) {
      if ((wx * 7 + wy * 13) % 5 < 2) spots.push({ x: wx, y: wy });
    }
  }
  return spots;
}).map((spot, i) => ({
  ...spot,
  colour: WINDOW_COLOURS[i % WINDOW_COLOURS.length],
  // Spread the switch-on order across the skyline rather than left to right.
  delay: 1200 + ((i * 37) % 23) * 140,
  twinkle: i % 6 === 0,
}));

export function Skyline() {
  return (
    <svg className="skyline" viewBox="0 0 440 100" preserveAspectRatio="none" aria-hidden="true">
      {BUILDINGS.map(([x, width, top]) => (
        <rect key={x} className="building" x={x} y={top} width={width} height={100 - top} />
      ))}
      {WINDOWS.map(({ x, y, colour, delay, twinkle }) => (
        <rect
          key={`${x}-${y}`}
          className={twinkle ? "city-window twinkle" : "city-window"}
          x={x}
          y={y}
          width="4"
          height="4"
          fill={colour}
          style={{ animationDelay: twinkle ? `${delay}ms, ${delay + 2000}ms` : `${delay}ms` }}
        />
      ))}
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path pathLength={1} d="M5 13l4.5 4.5L19 7" />
    </svg>
  );
}
