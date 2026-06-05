// charts.jsx — small, accessible, dependency-free chart primitives.
// All colors come from CSS custom properties so Tweaks themes propagate.

const CHART_COLORS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)", "var(--c7)", "var(--c8)"];

/* Horizontal bar chart — good for categorical breakdowns */
function BarChartH({ data, unit = "%", title, color }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}${unit}`).join(", ")}`}>
      <ul style={chartStyles.barList}>
        {data.map((d, i) => (
          <li key={d.label} style={chartStyles.barRow}>
            <span style={chartStyles.barLabel} aria-hidden="true">{d.label}</span>
            <span style={chartStyles.barTrack} aria-hidden="true">
              <span style={{
                ...chartStyles.barFill,
                width: `${(d.value / max) * 100}%`,
                background: color || CHART_COLORS[i % CHART_COLORS.length],
              }} />
            </span>
            <span style={chartStyles.barVal} aria-hidden="true">{d.value}{unit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Vertical histogram — for age distribution */
function HistogramV({ data, unit = "%", title }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}${unit}`).join(", ")}`}
         style={chartStyles.histWrap}>
      {data.map((d, i) => (
        <div key={d.label} style={chartStyles.histCol}>
          <span style={chartStyles.histVal} aria-hidden="true">{d.value}</span>
          <div style={chartStyles.histTrack} aria-hidden="true">
            <div style={{
              ...chartStyles.histFill,
              height: `${(d.value / max) * 100}%`,
              background: CHART_COLORS[1],
            }} />
          </div>
          <span style={chartStyles.histLabel} aria-hidden="true">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* Donut — for a small categorical split (e.g. housing) */
function Donut({ data, title, size = 150 }) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const r = size / 2 - 14, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={chartStyles.donutWrap} role="img"
         aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}%`).join(", ")}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth="22" />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * circ;
          const seg = (
            <circle key={d.label} cx={cx} cy={cy} r={r} fill="none"
              stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth="22"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-acc * circ}
              transform={`rotate(-90 ${cx} ${cy})`} />
          );
          acc += frac;
          return seg;
        })}
      </svg>
      <ul style={chartStyles.legend}>
        {data.map((d, i) => (
          <li key={d.label} style={chartStyles.legendRow}>
            <span style={{ ...chartStyles.swatch, background: CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden="true" />
            <span style={chartStyles.legendLabel}>{d.label}</span>
            <span style={chartStyles.legendVal}>{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Radial gauge — for a single percentage (fit / quality) */
function Gauge({ value, label, size = 132, good = 95 }) {
  const r = size / 2 - 12, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  const frac = Math.min(value, 100) / 100;
  const stroke = value >= good ? "var(--ok)" : value >= 85 ? "var(--warn)" : "var(--err)";
  return (
    <div style={chartStyles.gaugeWrap} role="img" aria-label={`${label}: ${value}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth="12" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={`${frac * circ} ${circ}`}
          transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dasharray .9s ease" }} />
        <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: size * 0.24, fontWeight: 700, fill: "var(--fg)" }}>{value}%</text>
        <text x="50%" y="66%" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: size * 0.1, fill: "var(--fg-subtle)" }}>match</text>
      </svg>
    </div>
  );
}

const chartStyles = {
  barList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "calc(10px * var(--density))" },
  barRow: { display: "grid", gridTemplateColumns: "minmax(96px,38%) 1fr auto", alignItems: "center", gap: 12 },
  barLabel: { fontSize: 14, color: "var(--fg-muted)", textAlign: "right", lineHeight: 1.2 },
  barTrack: { height: 18, background: "var(--bg-sunken)", borderRadius: 3, overflow: "hidden" },
  barFill: { display: "block", height: "100%", borderRadius: 3, transition: "width .8s cubic-bezier(.2,.7,.2,1)" },
  barVal: { fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", minWidth: 46, textAlign: "right" },

  histWrap: { display: "flex", alignItems: "flex-end", gap: 10, height: 200, paddingTop: 8 },
  histCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" },
  histVal: { fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", marginBottom: 4 },
  histTrack: { flex: 1, width: "100%", display: "flex", alignItems: "flex-end", background: "transparent" },
  histFill: { width: "100%", borderRadius: "3px 3px 0 0", transition: "height .8s cubic-bezier(.2,.7,.2,1)" },
  histLabel: { fontSize: 12, color: "var(--fg-subtle)", marginTop: 8, textAlign: "center", lineHeight: 1.1 },

  donutWrap: { display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" },
  legend: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 7, flex: 1, minWidth: 150 },
  legendRow: { display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 8, fontSize: 14 },
  swatch: { width: 12, height: 12, borderRadius: 3, display: "block" },
  legendLabel: { color: "var(--fg-muted)" },
  legendVal: { fontWeight: 700, fontVariantNumeric: "tabular-nums" },

  gaugeWrap: { display: "flex", justifyContent: "center" },
};

Object.assign(window, { BarChartH, HistogramV, Donut, Gauge, CHART_COLORS });
