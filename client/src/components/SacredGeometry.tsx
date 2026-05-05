/**
 * SacredGeometryBackground
 * Renders a fixed, full-screen SVG with golden ratio spiral, Vesica Piscis,
 * and intersecting circle motifs in a warm gold palette.
 */
export function SacredGeometryBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.45 }}
      >
        <defs>
          <radialGradient id="goldGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(72% 0.14 75)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="oklch(72% 0.14 75)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer large circles — Flower of Life base */}
        <circle cx="720" cy="450" r="380" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.5" strokeOpacity="0.35" />
        <circle cx="720" cy="450" r="280" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.4" strokeOpacity="0.3" />
        <circle cx="720" cy="450" r="180" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.4" strokeOpacity="0.25" />

        {/* Vesica Piscis pair */}
        <circle cx="580" cy="450" r="190" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.5" strokeOpacity="0.3" />
        <circle cx="860" cy="450" r="190" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.5" strokeOpacity="0.3" />

        {/* Vertical Vesica pair */}
        <circle cx="720" cy="310" r="190" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.4" strokeOpacity="0.22" />
        <circle cx="720" cy="590" r="190" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.4" strokeOpacity="0.22" />

        {/* Diagonal intersecting circles */}
        <circle cx="585" cy="315" r="190" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.35" strokeOpacity="0.18" />
        <circle cx="855" cy="315" r="190" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.35" strokeOpacity="0.18" />
        <circle cx="585" cy="585" r="190" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.35" strokeOpacity="0.18" />
        <circle cx="855" cy="585" r="190" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.35" strokeOpacity="0.18" />

        {/* Golden Ratio Spiral approximation (Fibonacci rectangles outline) */}
        <g transform="translate(620, 380)" stroke="oklch(62% 0.16 60)" strokeWidth="0.6" strokeOpacity="0.4" fill="none">
          {/* Outer arc */}
          <path d="M 0,0 A 100,100 0 0,1 100,100" />
          <path d="M 100,100 A 61.8,61.8 0 0,0 161.8,38.2" />
          <path d="M 161.8,38.2 A 38.2,38.2 0 0,1 123.6,0" />
          <path d="M 123.6,0 A 23.6,23.6 0 0,0 100,23.6" />
          <path d="M 100,23.6 A 14.6,14.6 0 0,1 114.6,38.2" />
          <path d="M 114.6,38.2 A 9,9 0 0,0 105.6,47.2" />
          <path d="M 105.6,47.2 A 5.6,5.6 0 0,1 111.2,52.8" />
        </g>

        {/* Pentagon / pentagram lines */}
        <g transform="translate(720,450)" stroke="oklch(72% 0.14 75)" strokeWidth="0.4" strokeOpacity="0.2" fill="none">
          <polygon points="0,-200 190.2,-61.8 117.6,161.8 -117.6,161.8 -190.2,-61.8" />
          <polygon points="0,-200 190.2,-61.8 -117.6,161.8 117.6,161.8 -190.2,-61.8" />
        </g>

        {/* Corner accent circles */}
        <circle cx="0" cy="0" r="200" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.5" strokeOpacity="0.2" />
        <circle cx="1440" cy="0" r="200" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.5" strokeOpacity="0.2" />
        <circle cx="0" cy="900" r="200" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.5" strokeOpacity="0.2" />
        <circle cx="1440" cy="900" r="200" fill="none" stroke="oklch(72% 0.14 75)" strokeWidth="0.5" strokeOpacity="0.2" />

        {/* Subtle radial glow at center */}
        <circle cx="720" cy="450" r="500" fill="url(#goldGrad)" />

        {/* Fine grid of golden dots */}
        {[...Array(7)].map((_, i) =>
          [...Array(5)].map((_, j) => (
            <circle
              key={`dot-${i}-${j}`}
              cx={180 + i * 180}
              cy={112 + j * 169}
              r="1.5"
              fill="oklch(72% 0.14 75)"
              fillOpacity="0.25"
            />
          ))
        )}
      </svg>
    </div>
  );
}
