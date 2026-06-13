import { BRAND } from "./UI";

// ─────────────────────────────────────────────────────────────
// Simple SVG-based charts — no external library needed
// Used in Admin Dashboard Overview tab
// ─────────────────────────────────────────────────────────────

// ── Bar Chart ────────────────────────────────────────────────
export function BarChart({ data, title, color = BRAND.blue, height = 120 }) {
  if (!data?.length) return null;
  const max    = Math.max(...data.map(d => d.value), 1);
  const gap    = 2;

  return (
    <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: "1rem" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: "1rem" }}>{title}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: gap, height }}>
        {data.map((d, i) => {
          const h = Math.max(4, Math.round((d.value / max) * (height - 24)));
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 10, color: BRAND.gray, fontFamily: "'DM Mono', monospace" }}>
                {d.value > 0 ? d.value : ""}
              </div>
              <div style={{ width: "100%", height: h, background: color, borderRadius: "4px 4px 0 0", opacity: 0.85 + (i / data.length) * 0.15, transition: "height 0.3s ease" }} />
              <div style={{ fontSize: 9, color: BRAND.gray, textAlign: "center", lineHeight: 1.2 }}>{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Line Sparkline ────────────────────────────────────────────
export function Sparkline({ data, color = BRAND.blue, height = 48, width = 120 }) {
  if (!data?.length || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1].split(",")[0]} cy={pts[pts.length-1].split(",")[1]} r="3" fill={color} />
    </svg>
  );
}

// ── Donut Chart ───────────────────────────────────────────────
export function DonutChart({ data, title, size = 100 }) {
  if (!data?.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2, cy = size / 2, r = size * 0.38, stroke = size * 0.14;
  let offset = 0;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1.25rem" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: "1rem" }}>{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg width={size} height={size} style={{ flexShrink: 0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
          {data.map((d, i) => {
            const pct  = d.value / total;
            const dash = pct * circ;
            const seg  = (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                stroke={d.color || BRAND.blue}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset * circ / 1 + circ / 4}
                strokeLinecap="butt"
                transform={`rotate(-90, ${cx}, ${cy})`}
                style={{ transition: "all 0.5s ease" }}
              />
            );
            offset += pct;
            return seg;
          })}
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: size * 0.18, fontWeight: 800, fontFamily: "'DM Mono', monospace", fill: BRAND.dark }}>
            {total}
          </text>
        </svg>
        <div style={{ flex: 1 }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color || BRAND.blue, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 12, color: BRAND.dark, fontWeight: 500 }}>{d.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, fontFamily: "'DM Mono', monospace" }}>{d.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Metric with sparkline ─────────────────────────────────────
export function MetricSparkline({ value, label, trend, color = BRAND.blue }) {
  const isUp = trend?.[trend.length - 1] >= (trend?.[0] || 0);
  return (
    <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>{value}</div>
        <div style={{ fontSize: 12, color: BRAND.gray }}>{label}</div>
        {trend && (
          <div style={{ fontSize: 10, color: isUp ? "#166534" : "#991B1B", fontWeight: 600, marginTop: 2 }}>
            {isUp ? "▲" : "▼"} {Math.abs(trend[trend.length-1] - trend[0])} vs last period
          </div>
        )}
      </div>
      {trend && <Sparkline data={trend} color={color} />}
    </div>
  );
}
