export default function RoadSign() {
  return (
    <svg
      className="road-sign"
      viewBox="0 0 220 250"
      role="img"
      aria-label="Tiemerkki: henkilö lapioi. Lisäkilvessä teksti Under construction."
    >
      {/* post */}
      <rect x="106" y="236" width="8" height="14" fill="#5b6675" />

      {/* warning triangle */}
      <polygon
        points="110,16 202,176 18,176"
        fill="#f5b800"
        stroke="#c8102e"
        strokeWidth="12"
        strokeLinejoin="round"
      />

      {/* ground + dirt pile */}
      <line x1="76" y1="162" x2="192" y2="162" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" />
      <path d="M150 162 Q166 138 186 162 Z" fill="#1a1a1a" />

      {/* person */}
      <g stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round" fill="none">
        <line x1="98" y1="108" x2="108" y2="136" />
        <line x1="108" y1="136" x2="100" y2="160" />
        <line x1="108" y1="136" x2="121" y2="160" />
        <line x1="100" y1="114" x2="124" y2="124" />
        <line x1="118" y1="112" x2="140" y2="146" />
      </g>
      <circle cx="96" cy="98" r="8" fill="#1a1a1a" />
      <polygon points="134,146 148,141 153,152 141,157" fill="#1a1a1a" />

      {/* supplementary plate */}
      <rect x="10" y="190" width="200" height="46" rx="6" fill="#f5f7fa" stroke="#1a1a1a" strokeWidth="3" />
      <text
        x="110"
        y="219"
        textAnchor="middle"
        fontFamily="'Bricolage Grotesque', Arial, sans-serif"
        fontWeight="800"
        fontSize="19"
        fill="#1a1a1a"
      >
        Under construction
      </text>
    </svg>
  )
}
