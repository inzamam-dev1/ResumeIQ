export default function ScoreRing({ score, size = 140, stroke = 12 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#00D9A3" : score >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{
          transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)",
          strokeLinecap: "round"
        }}
      />
      <text
        x="50%" y="50%"
        dominantBaseline="middle" textAnchor="middle"
        style={{
          transform: "rotate(90deg)",
          transformOrigin: "center",
          fill: color,
          fontSize: size * 0.22,
          fontWeight: 800,
          fontFamily: "inherit"
        }}
      >
        {score}
      </text>
    </svg>
  );
}
