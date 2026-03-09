export default function SectionBar({ label, value }) {
  const color = value >= 80 ? "#00D9A3" : value >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13, color: "#94a3b8" }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ background: "#1e293b", borderRadius: 4, height: 7, overflow: "hidden" }}>
        <div style={{
          width: `${value}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          height: "100%",
          borderRadius: 4,
          transition: "width 1.2s ease"
        }} />
      </div>
    </div>
  );
}
