// components.jsx — shared UI primitives in a sober Rijksoverheid-style.

const { useState, useRef, useEffect } = React;

/* ------------------------------- Logo --------------------------------- */
// Generic government-style lockup (not a real coat of arms). Blue ribbon + monogram.
function Logo({ t }) {
  return (
    <div style={cmp.logo}>
      <div style={cmp.logoMark} aria-hidden="true">
        <span style={cmp.logoRibbon} />
        <span style={cmp.logoLetters}>SD</span>
      </div>
      <div style={cmp.logoText}>
        <span style={cmp.logoName}>{t.appName}</span>
        <span style={cmp.logoSub}>{t.govLine}</span>
      </div>
    </div>
  );
}

/* ------------------------------ Header -------------------------------- */
function AppHeader({ t, onHome, right }) {
  return (
    <header style={cmp.header}>
      <div style={cmp.headerInner}>
        <a href="#" onClick={(e) => { e.preventDefault(); onHome && onHome(); }} style={cmp.homeLink} aria-label={t.appName}>
          <Logo t={t} />
        </a>
        <div style={cmp.headerRight}>{right}</div>
      </div>
    </header>
  );
}

/* ------------------------------ Stepper ------------------------------- */
const FLOW = ["stepSelect", "stepGenerate", "stepResult"];
function Stepper({ t, current }) {
  return (
    <nav aria-label={t.appSub} style={cmp.stepper}>
      <ol className="sd-steplist" style={cmp.stepList}>
        {FLOW.map((key, i) => {
          const state = i < current ? "done" : i === current ? "current" : "todo";
          return (
            <li key={key} style={cmp.stepItem} aria-current={state === "current" ? "step" : undefined}>
              <span style={{
                ...cmp.stepDot,
                ...(state === "done" ? cmp.stepDotDone : {}),
                ...(state === "current" ? cmp.stepDotCurrent : {}),
              }} aria-hidden="true">
                {state === "done" ? "✓" : i + 1}
              </span>
              <span style={{ ...cmp.stepLabel, color: state === "todo" ? "var(--fg-subtle)" : "var(--fg)", fontWeight: state === "current" ? 700 : 600 }}>
                {t[key]}
              </span>
              {i < FLOW.length - 1 && <span style={cmp.stepBar} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ------------------------------ Button -------------------------------- */
function Button({ children, onClick, variant = "primary", size = "md", icon, disabled, type = "button", full, ...rest }) {
  const [hover, setHover] = useState(false);
  const v = cmp.btnVariants[variant];
  const s = size === "lg" ? cmp.btnLg : size === "sm" ? cmp.btnSm : cmp.btnMd;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        ...cmp.btnBase, ...s, ...v,
        ...(hover && !disabled ? v.hover : {}),
        ...(disabled ? cmp.btnDisabled : {}),
        width: full ? "100%" : undefined,
      }} {...rest}>
      {icon && <span aria-hidden="true" style={{ display: "inline-flex" }}>{icon}</span>}
      {children}
    </button>
  );
}

/* ------------------------------- Card --------------------------------- */
function Card({ children, style, as: Tag = "div", ...rest }) {
  return <Tag style={{ ...cmp.card, ...style }} {...rest}>{children}</Tag>;
}
function CardHeader({ title, sub, action }) {
  return (
    <div style={cmp.cardHead}>
      <div>
        <h3 style={cmp.cardTitle}>{title}</h3>
        {sub && <p style={cmp.cardSub}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ Badge --------------------------------- */
function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: { background: "var(--bg-sunken)", color: "var(--fg-muted)" },
    must: { background: "var(--err-bg)", color: "var(--err)" },
    should: { background: "var(--warn-bg)", color: "var(--warn)" },
    could: { background: "var(--bg-sunken)", color: "var(--fg-subtle)" },
    ok: { background: "var(--ok-bg)", color: "var(--ok)" },
    info: { background: "color-mix(in srgb, var(--accent) 14%, white)", color: "var(--accent-dark)" },
  };
  return <span style={{ ...cmp.badge, ...tones[tone] }}>{children}</span>;
}

/* ---------------------------- Form fields ----------------------------- */
function Field({ label, hint, htmlFor, children, required }) {
  return (
    <div style={cmp.field}>
      <label htmlFor={htmlFor} style={cmp.label}>
        {label}{required && <span style={{ color: "var(--err)" }} aria-hidden="true"> *</span>}
      </label>
      {hint && <p id={htmlFor + "-hint"} style={cmp.hint}>{hint}</p>}
      {children}
    </div>
  );
}

function Select({ id, value, onChange, options, describedby, placeholder, disabled }) {
  return (
    <div style={cmp.selectWrap}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        aria-describedby={describedby} style={{ ...cmp.select, ...(disabled ? cmp.selectDisabled : {}) }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span style={{ ...cmp.selectChevron, ...(disabled ? { opacity: .4 } : {}) }} aria-hidden="true">▾</span>
    </div>
  );
}

/* Checkbox card for variable selection */
function CheckCard({ checked, onChange, title, desc, badge, disabled }) {
  return (
    <label style={{ ...cmp.checkCard, ...(checked ? cmp.checkCardOn : {}), ...(disabled ? { opacity: .55, cursor: "not-allowed" } : {}) }}>
      <input type="checkbox" checked={checked} disabled={disabled}
        onChange={(e) => onChange(e.target.checked)} style={cmp.checkInput} />
      <span style={{ ...cmp.checkBox, ...(checked ? cmp.checkBoxOn : {}) }} aria-hidden="true">{checked ? "✓" : ""}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={cmp.checkTitle}>{title} {badge}</span>
        {desc && <span style={cmp.checkDesc}>{desc}</span>}
      </span>
    </label>
  );
}

const cmp = {
  header: { background: "var(--bg)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", position: "sticky", top: 0, zIndex: 50 },
  headerInner: { maxWidth: "var(--maxw)", margin: "0 auto", padding: "0 24px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  homeLink: { textDecoration: "none", color: "inherit", display: "inline-flex", borderRadius: 4 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },

  logo: { display: "flex", alignItems: "center", gap: 14 },
  logoMark: { position: "relative", width: 44, height: 48, background: "var(--primary)", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoRibbon: { position: "absolute", left: 0, top: 0, bottom: 0, width: 7, background: "var(--accent)" },
  logoLetters: { color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: ".02em", paddingLeft: 5 },
  logoText: { display: "flex", flexDirection: "column", lineHeight: 1.15 },
  logoName: { fontWeight: 700, fontSize: 17, color: "var(--fg)" },
  logoSub: { fontSize: 12.5, color: "var(--fg-subtle)" },

  stepper: { background: "var(--bg)", borderBottom: "1px solid var(--border)" },
  stepList: { maxWidth: "var(--maxw)", margin: "0 auto", padding: "14px 24px", listStyle: "none", display: "flex", gap: 0, alignItems: "center", flexWrap: "wrap" },
  stepItem: { display: "flex", alignItems: "center", gap: 10, position: "relative", flex: "1 1 auto", minWidth: 0 },
  stepDot: { width: 28, height: 28, borderRadius: "50%", background: "var(--bg-sunken)", color: "var(--fg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0, border: "2px solid transparent" },
  stepDotDone: { background: "var(--ok)", color: "#fff" },
  stepDotCurrent: { background: "var(--primary)", color: "#fff" },
  stepLabel: { fontSize: 14.5, whiteSpace: "nowrap" },
  stepBar: { flex: 1, height: 2, background: "var(--border)", margin: "0 14px", minWidth: 20 },

  btnBase: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, fontFamily: "inherit", fontWeight: 700, borderRadius: "var(--radius)", border: "2px solid transparent", cursor: "pointer", transition: "background .15s, color .15s, border-color .15s, transform .05s", lineHeight: 1.1, textDecoration: "none" },
  btnMd: { fontSize: 16, padding: "11px 20px" },
  btnLg: { fontSize: 18, padding: "15px 28px" },
  btnSm: { fontSize: 14, padding: "8px 14px" },
  btnDisabled: { opacity: .45, cursor: "not-allowed" },
  btnVariants: {
    primary: { background: "var(--primary)", color: "var(--on-primary)", hover: { background: "var(--primary-dark)" } },
    accent: { background: "var(--accent)", color: "#fff", hover: { background: "var(--accent-dark)" } },
    secondary: { background: "var(--bg)", color: "var(--primary)", borderColor: "var(--primary)", hover: { background: "color-mix(in srgb, var(--primary) 8%, white)" } },
    ghost: { background: "transparent", color: "var(--primary)", hover: { background: "var(--bg-sunken)" } },
  },

  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "calc(22px * var(--density))", boxShadow: "var(--shadow-sm)" },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16 },
  cardTitle: { margin: 0, fontSize: 17, fontWeight: 700, color: "var(--fg)" },
  cardSub: { margin: "3px 0 0", fontSize: 13.5, color: "var(--fg-subtle)" },

  badge: { display: "inline-flex", alignItems: "center", fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, letterSpacing: ".01em" },

  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontWeight: 700, fontSize: 15, color: "var(--fg)" },
  hint: { margin: 0, fontSize: 13, color: "var(--fg-subtle)" },

  selectWrap: { position: "relative" },
  select: { width: "100%", appearance: "none", WebkitAppearance: "none", fontFamily: "inherit", fontSize: 15.5, padding: "11px 38px 11px 13px", border: "1.5px solid var(--border-strong)", borderRadius: "var(--radius)", background: "var(--bg)", color: "var(--fg)", cursor: "pointer" },
  selectDisabled: { background: "var(--bg-sunken)", color: "var(--fg-subtle)", border: "1.5px solid var(--border)", cursor: "not-allowed" },
  selectChevron: { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--fg-muted)", fontSize: 14 },

  checkCard: { display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 15px", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", cursor: "pointer", background: "var(--bg)", transition: "border-color .15s, background .15s" },
  checkCardOn: { borderColor: "var(--primary)", background: "color-mix(in srgb, var(--primary) 5%, white)" },
  checkInput: { position: "absolute", opacity: 0, width: 1, height: 1 },
  checkBox: { width: 22, height: 22, borderRadius: 4, border: "2px solid var(--border-strong)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800, marginTop: 1 },
  checkBoxOn: { background: "var(--primary)", borderColor: "var(--primary)" },
  checkTitle: { display: "block", fontWeight: 700, fontSize: 15, color: "var(--fg)" },
  checkDesc: { display: "block", fontSize: 13, color: "var(--fg-subtle)", marginTop: 2 },
};

Object.assign(window, { Logo, AppHeader, Stepper, Button, Card, CardHeader, Badge, Field, Select, CheckCard, cmp });
