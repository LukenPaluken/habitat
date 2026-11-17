/**
 * Elevación de dos edificios con cotas, en línea fina. Es decorativa: acompaña
 * a las pantallas de ingreso y registro.
 */
export function HouseDrawing({ className }: { className?: string }) {
  const hatch = Array.from({ length: 22 }, (_, i) => 24 + i * 20);

  return (
    <svg
      viewBox="0 0 480 360"
      role="img"
      aria-label="Dibujo de un edificio de departamentos y una casa con techo a dos aguas"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
    >
      {/* suelo */}
      <path d="M12 300H468" strokeWidth="2" />
      <path
        d={hatch.map((x) => `M${x} 300l-8 9`).join("")}
        strokeWidth="1"
        opacity=".55"
      />

      {/* edificio de departamentos */}
      <rect x="40" y="90" width="160" height="210" />
      <rect x="35" y="80" width="170" height="10" />
      {[110, 160, 210].flatMap((y) =>
        [58, 106, 154].map((x) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="28" height="34" />
            <path
              d={`M${x + 14} ${y}V${y + 34}M${x} ${y + 17}H${x + 28}`}
              strokeWidth=".75"
              opacity=".6"
            />
          </g>
        ))
      )}
      <rect x="106" y="262" width="28" height="38" />
      <path d="M120 262v38" strokeWidth=".75" />

      {/* casa */}
      <rect x="230" y="200" width="130" height="100" />
      <path d="M220 200 295 138 370 200Z" />
      <rect x="326" y="150" width="16" height="34" />
      <rect x="244" y="222" width="26" height="30" />
      <rect x="320" y="222" width="26" height="30" />
      <rect x="282" y="248" width="26" height="52" />
      <circle cx="302" cy="276" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="295" cy="190" r="9" />

      {/* árbol */}
      <circle cx="418" cy="232" r="34" />
      <path d="M418 266V300M418 246l-12-12M418 252l12-14" />

      {/* cotas */}
      <g strokeWidth="1" opacity=".8">
        <path d="M40 332H200M40 326v12M200 326v12" />
        <path d="M18 90V300M12 90h12M12 300h12" />
      </g>
      <g
        fill="currentColor"
        stroke="none"
        fontFamily="var(--font-mono), monospace"
        fontSize="10"
        opacity=".8"
      >
        <text x="120" y="349" textAnchor="middle">
          12,40 m
        </text>
        <text x="10" y="195" textAnchor="middle" transform="rotate(-90 10 195)">
          17,80 m
        </text>
        <text x="295" y="332" textAnchor="middle">
          PB + 1
        </text>
      </g>
    </svg>
  );
}
