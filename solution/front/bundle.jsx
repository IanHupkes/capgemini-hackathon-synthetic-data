// AUTO-BUNDLED — edit source *.jsx files then re-bundle. Do not hand-edit.
const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } = React;


/* ===================== data.jsx ===================== */
// data.jsx — synthetic data domain layer: locations, personas, variables,
// seeded generators, i18n. Everything fake but plausible & deterministic.

/* ----------------------------- seeded RNG ----------------------------- */
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// jitter a base distribution deterministically by seed, keep it summing to 100
function jitterDist(base, rng, amount) {
  const out = base.map((v) => Math.max(0, v + (rng() - 0.5) * 2 * amount));
  const sum = out.reduce((a, b) => a + b, 0);
  return out.map((v) => (v / sum) * 100);
}

/* ----------------------------- locations ------------------------------ */
// gemeente → wijk → buurt, with inhabitant counts (plausible, not official)
const LOCATIONS = [
  { code: "GM0599", naam: "Rotterdam", wijken: [
    { code: "WK059910", naam: "Delfshaven", buurten: [
      { code: "BU05991042", naam: "Bospolder", inw: 8120, lat: 51.9181, lng: 4.443 },
      { code: "BU05991045", naam: "Tussendijken", inw: 9430, lat: 51.9205, lng: 4.435 },
      { code: "BU05991051", naam: "Nieuwe Westen", inw: 14870, lat: 51.9155, lng: 4.4555 },
    ]},
    { code: "WK059903", naam: "Kralingen-Crooswijk", buurten: [
      { code: "BU05990331", naam: "Kralingen-West", inw: 11260, lat: 51.9262, lng: 4.51 },
      { code: "BU05990336", naam: "Nieuw Crooswijk", inw: 6040, lat: 51.932, lng: 4.4875 },
    ]},
  ]},
  { code: "GM0363", naam: "Amsterdam", wijken: [
    { code: "WK036315", naam: "Oud-West", buurten: [
      { code: "BU03631500", naam: "Da Costabuurt", inw: 7380, lat: 52.366, lng: 4.873 },
      { code: "BU03631503", naam: "Helmersbuurt", inw: 9910, lat: 52.3628, lng: 4.8718 },
    ]},
    { code: "WK036320", naam: "Noord-West", buurten: [
      { code: "BU03632001", naam: "Tuindorp Oostzaan", inw: 6650, lat: 52.4082, lng: 4.888 },
      { code: "BU03632004", naam: "Molenwijk", inw: 5120, lat: 52.417, lng: 4.882 },
    ]},
  ]},
  { code: "GM0344", naam: "Utrecht", wijken: [
    { code: "WK034403", naam: "Noordoost", buurten: [
      { code: "BU03440310", naam: "Tuindorp", inw: 8760, lat: 52.1072, lng: 5.1402 },
      { code: "BU03440312", naam: "Voordorp", inw: 4980, lat: 52.1085, lng: 5.1555 },
    ]},
  ]},
  { code: "GM0518", naam: "Den Haag", wijken: [
    { code: "WK051828", naam: "Laak", buurten: [
      { code: "BU05182801", naam: "Laakkwartier-Oost", inw: 13540, lat: 52.062, lng: 4.323 },
      { code: "BU05182803", naam: "Spoorwijk", inw: 7290, lat: 52.0578, lng: 4.31 },
    ]},
  ]},
  { code: "GM0772", naam: "Zwolle", wijken: [
    { code: "WK077205", naam: "Binnenstad", buurten: [
      { code: "BU01931000", naam: "Binnenstad-Zuid", inw: 2370, lat: 52.5125, lng: 6.0944 },
    ]},
  ]},
];

function findBuurt(code) {
  for (const g of LOCATIONS) for (const w of g.wijken) for (const b of w.buurten)
    if (b.code === code) return { gemeente: g, wijk: w, buurt: b };
  return null;
}

/* ----------------------------- personas ------------------------------- */
const PERSONAS = [
  {
    id: "lena",
    naam: "Lena Vermeer",
    rol: "Epidemioloog",
    org: "RIVM",
    initialen: "LV",
    doel: "Voedt infectie- en herstelmodellen (SIR) met realistische micro-data.",
    nadruk: "Demografie & huishoudens op buurtniveau, direct te laden in Python.",
    aanbevolen: ["leeftijd", "huishouden", "woning", "werk", "locatie"],
    formaat: "csv",
  },
  {
    id: "daan",
    naam: "Daan Bakker",
    rol: "Data-analist rioolwatersurveillance",
    org: "Erasmus MC",
    initialen: "DB",
    doel: "Koppelt rioolwatersignalen aan de demografische context van het verzorgingsgebied.",
    nadruk: "Bevolkingsdichtheid en samenstelling per RWZI-gebied.",
    aanbevolen: ["leeftijd", "huishouden", "locatie", "dichtheid"],
    formaat: "parquet",
  },
];

/* --------------------------- variable catalogue ----------------------- */
// CBS-style; priority must/should/could mirrors docs/variables.md framing
const VARIABLES = [
  { id: "mobiliteit", naam: "Mobiliteit",            bron: "CBS / ODiN",   prioriteit: "could",  beschrijving: "Verplaatsingen per dag (woon-werk)" },
  { id: "vaccinatie", naam: "Vaccinatiegraad",       bron: "RIVM",         prioriteit: "should", beschrijving: "Gevaccineerd per leeftijdsgroep" },
  { id: "woning",     naam: "Woningtype",            bron: "CBS 82900NED", prioriteit: "should", beschrijving: "Koop, huur corporatie of particulier" },
  { id: "hoogbouw",   naam: "Hoogbouw",              bron: "CBS / BAG",    prioriteit: "could",  beschrijving: "Aandeel hoogbouw vs. laagbouw" },
  { id: "leeftijd",   naam: "Leeftijdsverdeling",    bron: "CBS 85496NED", prioriteit: "must",   beschrijving: "Leeftijd in 6 klassen per persoon" },
  { id: "huishouden", naam: "Huishoudsamenstelling", bron: "CBS 71488NED", prioriteit: "must",   beschrijving: "Type huishouden en grootte" },
];

/* ------------------------------- methods ------------------------------ */
const METHODS = [
  { id: "ipf",  naam: "Iterative Proportional Fitting (IPF)", aanbevolen: true },
  { id: "abm",  naam: "Agent-based generatie", aanbevolen: false },
  { id: "gen",  naam: "Generatief model (copula)", aanbevolen: false },
];

/* ------------------------------ generators ---------------------------- */
const AGE_BANDS = ["0–14", "15–24", "25–44", "45–64", "65–79", "80+"];
const AGE_BASE  = [16, 12, 31, 24, 12, 5];
const HH_TYPES  = ["Eenpersoons", "Paar zonder kind.", "Paar met kind.", "Eenoudergezin", "Overig"];
const HH_BASE   = [38, 24, 24, 9, 5];
const HOUSE_TYPES = ["Koopwoning", "Huur corporatie", "Huur particulier"];
const HOUSE_BASE  = [42, 38, 20];
const SECTORS = ["Zorg & welzijn", "Handel", "Onderwijs", "Bouw", "ICT", "Industrie", "Horeca", "Overig"];
const SECTOR_BASE = [19, 17, 9, 8, 11, 10, 7, 19];
const MOBILITY = ["Te voet / fiets", "Openbaar vervoer", "Auto", "Thuiswerk"];
const MOBILITY_BASE = [34, 22, 31, 13];
const HOOGBOUW_TYPES = ["Hoogbouw", "Laagbouw"];
const HOOGBOUW_BASE = [46, 54];
const VACC_BASE = [62, 68, 74, 80, 88, 91];   // per leeftijdsgroep, geen sommatie naar 100

function generate(buurtCode, vars, sampleSize) {
  const loc = findBuurt(buurtCode);
  if (!loc) return null;
  const rng = mulberry32(hashStr(buurtCode + "|" + sampleSize));
  const inw = loc.buurt.inw;

  const age   = jitterDist(AGE_BASE, rng, 4).map((v, i) => ({ label: AGE_BANDS[i], value: +v.toFixed(1) }));
  const hh    = jitterDist(HH_BASE, rng, 5).map((v, i) => ({ label: HH_TYPES[i], value: +v.toFixed(1) }));
  const house = jitterDist(HOUSE_BASE, rng, 6).map((v, i) => ({ label: HOUSE_TYPES[i], value: +v.toFixed(1) }));
  const sector = jitterDist(SECTOR_BASE, rng, 4).map((v, i) => ({ label: SECTORS[i], value: +v.toFixed(1) }));
  const mobility = jitterDist(MOBILITY_BASE, rng, 5).map((v, i) => ({ label: MOBILITY[i], value: +v.toFixed(1) }));
  const hoogbouw = jitterDist(HOOGBOUW_BASE, rng, 8).map((v, i) => ({ label: HOOGBOUW_TYPES[i], value: +v.toFixed(1) }));
  const vaccinatie = VACC_BASE.map((v, i) => ({ label: AGE_BANDS[i], value: +Math.min(99, Math.max(40, v + (rng() - 0.5) * 6)).toFixed(1) }));

  const occupancy = +(1.9 + rng() * 0.5).toFixed(2);            // pers/woning
  const density = Math.round(4200 + rng() * 9000);              // inw/km²
  const households = Math.round(inw / occupancy);

  // quality metrics (how well synthetic matches source)
  const fit = +(96 + rng() * 3.4).toFixed(1);                  // %
  const tvd = +(0.012 + rng() * 0.03).toFixed(3);              // total variation distance
  const kAnon = Math.round(8 + rng() * 9);                      // k
  const iterations = Math.round(18 + rng() * 22);

  // small sample of synthetic persons for the preview table
  const persons = [];
  const mobPick = () => MOBILITY[Math.floor(rng() * MOBILITY.length)];
  for (let i = 0; i < 14; i++) {
    const ageVal = Math.floor(rng() * 92);
    const hhPick = HH_TYPES[Math.floor(rng() * HH_TYPES.length)];
    persons.push({
      id: `SYN-${loc.buurt.code.slice(-4)}-${String(100000 + Math.floor(rng() * 899999))}`,
      leeftijd: ageVal,
      geslacht: rng() > 0.5 ? "V" : "M",
      huishouden: hhPick,
      woning: HOUSE_TYPES[Math.floor(rng() * HOUSE_TYPES.length)],
      hoogbouw: rng() > 0.54 ? "Laagbouw" : "Hoogbouw",
      mobiliteit: mobPick(),
      gevaccineerd: rng() > 0.22 ? "Ja" : "Nee",
      buurt: loc.buurt.code,
    });
  }

  return {
    loc, inw, households, sampleSize,
    age, hh, house, sector, mobility, hoogbouw, vaccinatie, occupancy, density,
    quality: { fit, tvd, kAnon, iterations },
    persons,
    generatedAt: new Date(),
  };
}

/* -------------------------------- CSV --------------------------------- */
function toCSV(result) {
  const head = ["persoon_id", "leeftijd", "geslacht", "huishoudtype", "woningtype", "hoogbouw", "mobiliteit", "gevaccineerd", "buurtcode"];
  const rows = result.persons.map((p) =>
    [p.id, p.leeftijd, p.geslacht, p.huishouden, p.woning, p.hoogbouw, p.mobiliteit, p.gevaccineerd, p.buurt].join(";"));
  return head.join(";") + "\n" + rows.join("\n");
}

/* ------------------------------ pipeline ------------------------------ */
const PIPELINE_STEPS = [
  { id: "load",    nl: "CBS-buurtaggregaten inladen",        en: "Loading CBS neighbourhood aggregates" },
  { id: "fit",     nl: "Iteratieve proportionele fitting",    en: "Iterative proportional fitting" },
  { id: "synth",   nl: "Synthetische personen samenstellen",  en: "Synthesising individual records" },
  { id: "spatial", nl: "Ruimtelijke coherentie toepassen",    en: "Applying spatial coherence" },
  { id: "privacy", nl: "Privacycontrole (k-anonimiteit)",     en: "Privacy check (k-anonymity)" },
  { id: "quality", nl: "Kwaliteitscontrole vs. bron",         en: "Quality check against source" },
];

/* -------------------------------- i18n -------------------------------- */
const I18N = {
  nl: {
    appName: "Synthetische Data Portal",
    appSub: "Demografische populatie — Laag 1",
    govLine: "Een voorziening voor pandemische paraatheid",
    skipToContent: "Naar hoofdinhoud",
    // landing
    landTag: "Open data · privacy by design · open source",
    landTitle: "Genereer een synthetische bevolking uit openbare buurtcijfers",
    landBody: "Zet grofmazige CBS- en RIVM-aggregaten op buurtniveau om in een statistisch correcte populatie op microniveau — bruikbaar voor infectiemodellen en rioolwatersurveillance.",
    landStart: "Start met genereren",
    landHow: "Hoe het werkt",
    landStepsTitle: "In vier stappen naar een dataset",
    privacyNote: "Nooit herleidbaar tot echte personen. Volledig op basis van openbare bronnen.",
    // steps labels
    stepSelect: "Selecteren", stepGenerate: "Genereren", stepDashboard: "Dashboard", stepDownload: "Downloaden", stepResult: "Resultaat",
    // select
    selTitle: "Stel uw dataset samen",
    selSub: "Kies een gebied en de gewenste gegevens, en genereer de dataset.",
    selPersona: "Voor wie genereert u?", selPersonaHint: "Bepaalt de aanbevolen variabelen en het exportformaat.",
    selLocation: "Gebied", selLocationHint: "Selecteer gemeente, wijk en buurt.",
    selGemeente: "Gemeente", selWijk: "Wijk", selBuurt: "Buurt",
    selVars: "Gegevens", selVarsHint: "Welke kenmerken wilt u in de dataset?",
    selSample: "Steekproefgrootte", selSampleHint: "Aantal synthetische personen.",
    selMethod: "Synthesemethode",
    selSummary: "Samenvatting", selGenerate: "Genereer dataset",
    selInhabitants: "inwoners", selSelected: "geselecteerd",
    must: "must", should: "should", could: "could",
    // pipeline
    pipeTitle: "Bezig met genereren…", pipeSub: "De AI-pipeline verwerkt openbare bronnen tot een synthetische populatie.",
    pipeDone: "Klaar", pipeView: "Bekijk resultaten",
    // dashboard
    dashTitle: "Dashboard", dashFor: "Synthetische populatie voor",
    kpiPersons: "Synthetische personen", kpiHouseholds: "Huishoudens", kpiFit: "Overeenkomst met bron", kpiDensity: "Dichtheid (inw/km²)",
    chartAge: "Leeftijdsverdeling", chartHH: "Huishoudsamenstelling", chartHouse: "Woningtype", chartSector: "Werksector",
    chartMob: "Mobiliteit", chartVacc: "Vaccinatiegraad", chartHoog: "Hoogbouw / laagbouw",
    pctOfPop: "% van bevolking", pctOfHH: "% van huishoudens",
    pctOfMob: "% van verplaatsingen", pctVacc: "% gevaccineerd per leeftijd", pctOfHomes: "% van woningen",
    viewReport: "Kwaliteit controleren", goDownload: "Download dataset", newRun: "Genereer nieuwe dataset",
    // report
    repTitle: "Kwaliteitsrapport", repSub: "Hoe goed komt de synthetische data overeen met de CBS-bronstatistiek?",
    repFit: "Statistische overeenkomst", repTVD: "Afwijking (TVD)", repK: "k-anonimiteit", repIter: "IPF-iteraties",
    repSources: "Gebruikte bronnen", repPrivacy: "Privacymaatregelen",
    repMatchTitle: "Overeenkomst per kenmerk",
    privacy1: "Geen herleidbaarheid tot individuen (synthese, geen echte records).",
    privacy2: "k-anonimiteit toegepast: elke combinatie komt minstens k keer voor.",
    privacy3: "Ruis op kleine cellen volgens disclosure-protectie.",
    // download
    dlTitle: "Download dataset", dlSub: "Open bestand — direct te laden in Python, Java of Excel.",
    dlFormat: "Formaat", dlPreview: "Voorbeeld (eerste 14 rijen)", dlRows: "rijen",
    dlBtn: "Download", dlAgain: "Terug naar dashboard", dlReady: "Bestand gereed",
    dlIncludes: "Bevat", dlLicense: "Licentie: CC BY 4.0 · Open data",
    // common
    back: "Terug", next: "Volgende", close: "Sluiten", tweaksTitle: "Aanpassen",
  },
  en: {
    appName: "Synthetic Data Portal",
    appSub: "Demographic population — Layer 1",
    govLine: "A facility for pandemic preparedness",
    skipToContent: "Skip to content",
    landTag: "Open data · privacy by design · open source",
    landTitle: "Generate a synthetic population from public neighbourhood data",
    landBody: "Turn coarse CBS and RIVM neighbourhood aggregates into a statistically correct micro-level population — usable for infection models and wastewater surveillance.",
    landStart: "Start generating",
    landHow: "How it works",
    landStepsTitle: "From data to dataset in four steps",
    privacyNote: "Never traceable to real individuals. Built entirely on public sources.",
    stepSelect: "Select", stepGenerate: "Generate", stepDashboard: "Dashboard", stepDownload: "Download", stepResult: "Result",
    selTitle: "Compose your dataset",
    selSub: "Choose an area and the data you need, then generate the dataset.",
    selPersona: "Who are you generating for?", selPersonaHint: "Sets the recommended variables and export format.",
    selLocation: "Area", selLocationHint: "Select municipality, district and neighbourhood.",
    selGemeente: "Municipality", selWijk: "District", selBuurt: "Neighbourhood",
    selVars: "Data fields", selVarsHint: "Which characteristics do you want in the dataset?",
    selSample: "Sample size", selSampleHint: "Number of synthetic individuals.",
    selMethod: "Synthesis method",
    selSummary: "Summary", selGenerate: "Generate dataset",
    selInhabitants: "inhabitants", selSelected: "selected",
    must: "must", should: "should", could: "could",
    pipeTitle: "Generating…", pipeSub: "The AI pipeline turns public sources into a synthetic population.",
    pipeDone: "Done", pipeView: "View results",
    dashTitle: "Dashboard", dashFor: "Synthetic population for",
    kpiPersons: "Synthetic individuals", kpiHouseholds: "Households", kpiFit: "Match with source", kpiDensity: "Density (inh/km²)",
    chartAge: "Age distribution", chartHH: "Household composition", chartHouse: "Housing type", chartSector: "Work sector",
    chartMob: "Mobility", chartVacc: "Vaccination rate", chartHoog: "High-rise / low-rise",
    pctOfPop: "% of population", pctOfHH: "% of households",
    pctOfMob: "% of trips", pctVacc: "% vaccinated by age", pctOfHomes: "% of homes",
    viewReport: "Check quality", goDownload: "Download dataset", newRun: "Generate new dataset",
    repTitle: "Quality report", repSub: "How well does the synthetic data match the CBS source statistics?",
    repFit: "Statistical match", repTVD: "Deviation (TVD)", repK: "k-anonymity", repIter: "IPF iterations",
    repSources: "Sources used", repPrivacy: "Privacy measures",
    repMatchTitle: "Match per field",
    privacy1: "No traceability to individuals (synthesis, not real records).",
    privacy2: "k-anonymity applied: every combination occurs at least k times.",
    privacy3: "Noise on small cells per disclosure protection.",
    dlTitle: "Download dataset", dlSub: "Open file — load directly into Python, Java or Excel.",
    dlFormat: "Format", dlPreview: "Preview (first 14 rows)", dlRows: "rows",
    dlBtn: "Download", dlAgain: "Back to dashboard", dlReady: "File ready",
    dlIncludes: "Includes", dlLicense: "Licence: CC BY 4.0 · Open data",
    back: "Back", next: "Next", close: "Close", tweaksTitle: "Customise",
  },
};

Object.assign(window, {
  LOCATIONS, findBuurt, PERSONAS, VARIABLES, METHODS, PIPELINE_STEPS,
  generate, toCSV, I18N, AGE_BANDS,
});


/* ===================== icons.jsx ===================== */
// icons.jsx — minimal Lucide-style line icons (functional UI glyphs).
function Icon({ name, size = 20, stroke = 2, style }) {
  const p = ICON_PATHS[name];
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style} aria-hidden="true" focusable="false">
      {p}
    </svg>
  );
}

const ICON_PATHS = {
  arrowRight: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
  arrowLeft: <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" /></>,
  sliders: <><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></>,
  chart: <><line x1="3" y1="21" x2="21" y2="21" /><rect x="5" y="11" width="3.5" height="7" /><rect x="10.25" y="6" width="3.5" height="12" /><rect x="15.5" y="13" width="3.5" height="5" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
  shieldCheck: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></>,
  mapPin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  check: <><polyline points="20 6 9 17 4 12" /></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></>,
  sparkles: <><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" /><path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z" /></>,
  refresh: <><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  home: <><path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>,
  table: <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /></>,
};

Object.assign(window, { Icon });


/* ===================== charts.jsx ===================== */
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
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0;
  const displayValue = safeValue.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const frac = safeValue / 100;
  const stroke = safeValue >= good ? "var(--ok)" : safeValue >= 85 ? "var(--warn)" : "var(--err)";
  return (
    <div style={chartStyles.gaugeWrap} role="img" aria-label={`${label}: ${displayValue}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth="12" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={`${frac * circ} ${circ}`}
          transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dasharray .9s ease" }} />
        <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: size * 0.24, fontWeight: 700, fill: "var(--fg)" }}>{displayValue}%</text>
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


/* ===================== components.jsx ===================== */
// components.jsx — shared UI primitives in a sober Rijksoverheid-style.

// (hooks hoisted to bundle top)
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


/* ===================== tweaks-panel.jsx ===================== */
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', { detail: edits }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  React.useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);
      else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };

  const onDragStart = (e) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;
  return (
    <>
      <style>{__TWEAKS_STYLE}</style>
      <div ref={dragRef} className="twk-panel" data-omelette-chrome=""
           style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button className="twk-x" aria-label="Close tweaks"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={dismiss}>✕</button>
        </div>
        <div className="twk-body">
          {children}
        </div>
      </div>
    </>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({ label, children }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

function TweakRow({ label, value, children, inline = false }) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }) {
  return (
    <TweakRow label={label} value={`${value}${unit}`}>
      <input type="range" className="twk-slider" min={min} max={max} step={step}
             value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </TweakRow>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'}
              role="switch" aria-checked={!!value}
              onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = (o) => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({ 2: 16, 3: 10 }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = (s) => {
      const m = options.find((o) => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return <TweakSelect label={label} value={value} options={options}
                        onChange={(s) => onChange(resolve(s))} />;
  }
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;

  const segAt = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = (e) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown}
           className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb"
             style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
                      width: `calc((100% - 4px) / ${n})` }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

function TweakSelect({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <select className="twk-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </TweakRow>
  );
}

function TweakText({ label, value, placeholder, onChange }) {
  return (
    <TweakRow label={label}>
      <input className="twk-field" type="text" value={value} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} />
    </TweakRow>
  );
}

function TweakNumber({ label, value, min, max, step = 1, unit = '', onChange }) {
  const clamp = (n) => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({ x: 0, val: 0 });
  const onScrubStart = (e) => {
    e.preventDefault();
    startRef.current = { x: e.clientX, val: value };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = (ev) => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div className="twk-num">
      <span className="twk-num-lbl" onPointerDown={onScrubStart}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
             onChange={(e) => onChange(clamp(Number(e.target.value)))} />
      {unit && <span className="twk-num-unit">{unit}</span>}
    </div>
  );
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}

const __TwkCheck = ({ light }) => (
  <svg viewBox="0 0 14 14" aria-hidden="true">
    <path d="M3 7.2 5.8 10 11 4.2" fill="none" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
          stroke={light ? 'rgba(0,0,0,.78)' : '#fff'} />
  </svg>
);

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({ label, value, options, onChange }) {
  if (!options || !options.length) {
    return (
      <div className="twk-row twk-row-h">
        <div className="twk-lbl"><span>{label}</span></div>
        <input type="color" className="twk-swatch" value={value}
               onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = (o) => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return (
    <TweakRow label={label}>
      <div className="twk-chips" role="radiogroup">
        {options.map((o, i) => {
          const colors = Array.isArray(o) ? o : [o];
          const [hero, ...rest] = colors;
          const sup = rest.slice(0, 4);
          const on = key(o) === cur;
          return (
            <button key={i} type="button" className="twk-chip" role="radio"
                    aria-checked={on} data-on={on ? '1' : '0'}
                    aria-label={colors.join(', ')} title={colors.join(' · ')}
                    style={{ background: hero }}
                    onClick={() => onChange(o)}>
              {sup.length > 0 && (
                <span>
                  {sup.map((c, j) => <i key={j} style={{ background: c }} />)}
                </span>
              )}
              {on && <__TwkCheck light={__twkIsLight(hero)} />}
            </button>
          );
        })}
      </div>
    </TweakRow>
  );
}

function TweakButton({ label, onClick, secondary = false }) {
  return (
    <button type="button" className={secondary ? 'twk-btn secondary' : 'twk-btn'}
            onClick={onClick}>{label}</button>
  );
}

Object.assign(window, {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
});


/* ===================== screen-landing.jsx ===================== */
// screen-landing.jsx — intro / hero + "how it works"

function LandingScreen({ t, onStart }) {
  const steps = [
    { icon: "sliders", title: t.stepSelect, body: t.lang === "en" ? "Persona, area and variables." : "Persona, gebied en variabelen." },
    { icon: "sparkles", title: t.stepGenerate, body: t.lang === "en" ? "AI pipeline upscales the aggregates." : "AI-pipeline schaalt aggregaten op." },
    { icon: "chart", title: t.stepDashboard, body: t.lang === "en" ? "Inspect the population in charts." : "Bekijk de populatie in grafieken." },
    { icon: "download", title: t.stepDownload, body: t.lang === "en" ? "Open CSV/Parquet for your models." : "Open CSV/Parquet voor uw modellen." },
  ];
  return (
    <main id="hoofdinhoud" style={land.main}>
      <section style={land.hero}>
        <div style={land.heroInner}>
          <div style={land.heroCopy}>
            <span style={land.tag}><Icon name="shieldCheck" size={15} /> {t.landTag}</span>
            <h1 style={land.title}>{t.landTitle}</h1>
            <p style={land.body}>{t.landBody}</p>
            <div style={land.ctaRow}>
              <Button variant="primary" size="lg" onClick={onStart}
                icon={<Icon name="arrowRight" size={20} />}>{t.landStart}</Button>
              <a href="#hoe" style={land.textLink}>{t.landHow}</a>
            </div>
            <p style={land.privacy}><Icon name="lock" size={15} /> {t.privacyNote}</p>
          </div>
          <aside style={land.heroPanel} aria-hidden="true">
            <div style={land.panelHead}>
              <span style={land.panelDot} /><span style={land.panelDot2} /><span style={land.panelDot3} />
              <span style={land.panelTitle}>synthese.py</span>
            </div>
            <pre style={land.code}>
{`> buurt = "Bospolder, Rotterdam"
> bron  = CBS.buurt(buurt)        # aggregaten
> pop   = IPF.fit(bron, k=12)     # synthese
> pop.head()
 id        leeftijd  huishouden     woning
 SYN-1042  34        Paar+kind.     Koop
 SYN-1042  8         Paar+kind.     Koop
 SYN-1042  71        Eenpersoons    Huur
✓ 8.120 personen · match 98,4% · k=12`}
            </pre>
            <div style={land.panelBadges}>
              <Badge tone="info">CBS StatLine</Badge>
              <Badge tone="info">RIVM</Badge>
              <Badge tone="ok">privacy by design</Badge>
            </div>
          </aside>
        </div>
      </section>

      <section id="hoe" style={land.how} aria-labelledby="how-title">
        <h2 id="how-title" style={land.howTitle}>{t.landStepsTitle}</h2>
        <ol style={land.stepGrid}>
          {steps.map((s, i) => (
            <li key={s.title} style={land.stepCard}>
              <span style={land.stepNum}>{i + 1}</span>
              <span style={land.stepIcon}><Icon name={s.icon} size={24} /></span>
              <h3 style={land.stepCardTitle}>{s.title}</h3>
              <p style={land.stepCardBody}>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

const land = {
  main: { maxWidth: "var(--maxw)", margin: "0 auto", padding: "0 24px 64px" },
  hero: { padding: "48px 0 16px" },
  heroInner: { display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 48, alignItems: "center" },
  heroCopy: { minWidth: 0 },
  tag: { display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "var(--accent-dark)", background: "color-mix(in srgb, var(--accent) 12%, white)", padding: "6px 12px", borderRadius: 999, marginBottom: 20 },
  title: { fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.08, fontWeight: 700, margin: "0 0 18px", letterSpacing: "-0.015em", textWrap: "balance", color: "var(--fg)" },
  body: { fontSize: "clamp(16px, 1.5vw, 19px)", lineHeight: 1.55, color: "var(--fg-muted)", margin: "0 0 28px", maxWidth: 560, textWrap: "pretty" },
  ctaRow: { display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" },
  textLink: { color: "var(--accent-dark)", fontWeight: 600, fontSize: 16, textDecoration: "underline", textUnderlineOffset: 3 },
  privacy: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--fg-subtle)", marginTop: 26 },

  heroPanel: { background: "var(--primary)", borderRadius: "var(--radius-lg)", padding: 18, boxShadow: "var(--shadow-md)", minWidth: 0 },
  panelHead: { display: "flex", alignItems: "center", gap: 7, marginBottom: 14 },
  panelDot: { width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" },
  panelDot2: { width: 11, height: 11, borderRadius: "50%", background: "#febc2e" },
  panelDot3: { width: 11, height: 11, borderRadius: "50%", background: "#28c840" },
  panelTitle: { marginLeft: 8, color: "rgba(255,255,255,.7)", fontSize: 13, fontFamily: "ui-monospace, monospace" },
  code: { margin: 0, padding: 16, background: "rgba(0,0,0,.28)", borderRadius: 6, color: "#dbe7f5", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5, lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre" },
  panelBadges: { display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" },

  how: { marginTop: 56 },
  howTitle: { fontSize: 24, fontWeight: 700, margin: "0 0 22px", color: "var(--fg)" },
  stepGrid: { listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 },
  stepCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 22, position: "relative", boxShadow: "var(--shadow-sm)" },
  stepNum: { position: "absolute", top: 16, right: 18, fontSize: 13, fontWeight: 700, color: "var(--fg-subtle)" },
  stepIcon: { display: "inline-flex", width: 48, height: 48, borderRadius: 10, background: "color-mix(in srgb, var(--primary) 9%, white)", color: "var(--primary)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  stepCardTitle: { margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "var(--fg)" },
  stepCardBody: { margin: 0, fontSize: 14, color: "var(--fg-muted)", lineHeight: 1.5 },
};

Object.assign(window, { LandingScreen });


/* ===================== screen-select.jsx ===================== */
// screen-select.jsx — minimal start screen: location + data + generate.

function SelectScreen({ t, cfg, setCfg, onGenerate }) {
  const gemeente = LOCATIONS.find((g) => g.code === cfg.gemeente) || null;
  const wijk = gemeente ? gemeente.wijken.find((w) => w.code === cfg.wijk) : null;
  const buurt = wijk ? wijk.buurten.find((b) => b.code === cfg.buurt) : null;

  const mustVars = VARIABLES.filter((v) => v.prioriteit === "must").map((v) => v.id);
  const canGenerate = !!buurt && cfg.vars.length > 0;

  function setGemeente(code) { setCfg({ ...cfg, gemeente: code, wijk: "", buurt: "" }); }
  function setWijk(code) { setCfg({ ...cfg, wijk: code, buurt: "" }); }
  function toggleVar(id) {
    if (mustVars.includes(id)) return;              // verplicht — niet uitschakelbaar
    setCfg({ ...cfg, vars: cfg.vars.includes(id) ? cfg.vars.filter((v) => v !== id) : [...cfg.vars, id] });
  }

  const presets = [5000, 10000, 25000];

  return (
    <main id="hoofdinhoud" style={sel.main}>
      <div style={sel.head}>
        <h1 style={sel.h1}>{t.selTitle}</h1>
        <p style={sel.sub}>{t.selSub}</p>
      </div>

      <div style={sel.card}>
        {/* Locatie */}
        <section style={sel.section}>
          <div style={sel.secHead}>
            <span style={sel.secIcon} aria-hidden="true"><Icon name="mapPin" size={18} /></span>
            <h2 style={sel.secTitle}>{t.selLocation}</h2>
          </div>
          <div style={sel.locGrid}>
            <Field label={t.selGemeente} htmlFor="f-gem">
              <Select id="f-gem" value={cfg.gemeente} onChange={setGemeente}
                placeholder={t.lang === "en" ? "Choose…" : "Kies…"}
                options={LOCATIONS.map((g) => ({ value: g.code, label: g.naam }))} />
            </Field>
            <Field label={t.selWijk} htmlFor="f-wijk">
              <Select id="f-wijk" value={cfg.wijk} onChange={setWijk}
                disabled={!gemeente}
                placeholder={t.lang === "en" ? "Choose…" : "Kies…"}
                options={gemeente ? gemeente.wijken.map((w) => ({ value: w.code, label: w.naam })) : []} />
            </Field>
            <Field label={t.selBuurt} htmlFor="f-buurt">
              <Select id="f-buurt" value={cfg.buurt} onChange={(v) => setCfg({ ...cfg, buurt: v })}
                disabled={!wijk}
                placeholder={t.lang === "en" ? "Choose…" : "Kies…"}
                options={wijk ? wijk.buurten.map((b) => ({ value: b.code, label: b.naam })) : []} />
            </Field>
          </div>
          {buurt && (
            <div style={sel.mapBlock}>
              <MiniMap buurt={buurt} wijk={wijk} />
              <p style={sel.locInfo}>
                <Icon name="mapPin" size={15} style={{ color: "var(--accent-dark)", flexShrink: 0 }} />
                <span><strong style={{ color: "var(--fg)", fontWeight: 700 }}>{buurt.naam}</strong> · {buurt.code} · {buurt.inw.toLocaleString("nl-NL")} {t.selInhabitants}</span>
              </p>
            </div>
          )}
        </section>

        <hr style={sel.divider} />

        {/* Gegevens */}
        <section style={sel.section}>
          <div style={sel.secHead}>
            <span style={sel.secIcon} aria-hidden="true"><Icon name="layers" size={18} /></span>
            <h2 style={sel.secTitle}>{t.selVars}</h2>
          </div>
          <div style={sel.chips} role="group" aria-label={t.selVars}>
            {VARIABLES.map((v) => {
              const on = cfg.vars.includes(v.id);
              const locked = mustVars.includes(v.id);
              return (
                <button key={v.id} type="button" onClick={() => toggleVar(v.id)}
                  aria-pressed={on} disabled={locked}
                  title={locked ? (t.lang === "en" ? "Required" : "Verplicht") : v.beschrijving}
                  style={{ ...sel.chip, ...(on ? sel.chipOn : {}), ...(locked ? sel.chipLocked : {}) }}>
                  <span style={sel.chipMark} aria-hidden="true">
                    {on ? <Icon name="check" size={15} stroke={3} /> : <Icon name="plus" size={15} stroke={2.5} />}
                  </span>
                  {v.naam}
                </button>
              );
            })}
          </div>
          <p style={sel.note}>{t.lang === "en" ? "Required fields are always included." : "Verplichte gegevens zijn altijd inbegrepen."}</p>
        </section>

        <hr style={sel.divider} />

        <div style={sel.actions}>
          <Button variant="primary" size="lg" disabled={!canGenerate} onClick={onGenerate}
            icon={<Icon name="sparkles" size={20} />}>{t.selGenerate}</Button>
          {!buurt && <span style={sel.hint}>{t.lang === "en" ? "Select an area first." : "Selecteer eerst een gebied."}</span>}
        </div>
      </div>
    </main>
  );
}

const sel = {
  main: { maxWidth: 720, margin: "0 auto", padding: "40px 24px 72px" },
  head: { marginBottom: 22, textAlign: "center" },
  h1: { fontSize: 28, fontWeight: 700, margin: "0 0 6px", color: "var(--fg)" },
  sub: { fontSize: 16, color: "var(--fg-muted)", margin: 0 },

  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "calc(26px * var(--density))", boxShadow: "var(--shadow-sm)" },
  section: {},
  sectionRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "start" },
  secHead: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 },
  secIcon: { width: 32, height: 32, borderRadius: 8, background: "color-mix(in srgb, var(--primary) 9%, white)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  secTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: "var(--fg)" },
  divider: { border: "none", borderTop: "1px solid var(--border)", margin: "22px 0" },

  locGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 },
  mapBlock: { marginTop: 14 },
  mapWrap: { position: "relative", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" },
  mapEl: { width: "100%", height: 200, background: "var(--bg-sunken)" },
  mapBadge: { position: "absolute", left: 10, top: 10, zIndex: 500, background: "var(--surface)", color: "var(--fg)", fontSize: 12.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, boxShadow: "var(--shadow-sm)", lineHeight: 1.2, pointerEvents: "none" },
  locInfo: { display: "flex", alignItems: "center", gap: 8, margin: "12px 0 0", fontSize: 13.5, color: "var(--fg-subtle)" },

  chips: { display: "flex", flexWrap: "wrap", gap: 9 },
  chip: { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px 9px 11px", border: "1.5px solid var(--border)", borderRadius: 999, background: "var(--bg)", color: "var(--fg-muted)", fontFamily: "inherit", fontSize: 14.5, fontWeight: 600, cursor: "pointer", transition: "border-color .15s, background .15s, color .15s" },
  chipOn: { borderColor: "var(--primary)", background: "color-mix(in srgb, var(--primary) 6%, white)", color: "var(--primary-dark)" },
  chipLocked: { cursor: "default" },
  chipMark: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, flexShrink: 0, color: "currentColor", opacity: 0.65 },
  note: { margin: "12px 0 0", fontSize: 13, color: "var(--fg-subtle)" },

  presets: { display: "flex", gap: 8 },
  preset: { flex: 1, padding: "11px 8px", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", background: "var(--bg)", color: "var(--fg-muted)", fontFamily: "inherit", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontVariantNumeric: "tabular-nums", transition: "border-color .15s, background .15s, color .15s" },
  presetOn: { borderColor: "var(--primary)", background: "var(--primary)", color: "#fff" },

  actions: { display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 16 },
  hint: { fontSize: 13.5, color: "var(--fg-subtle)" },
};

Object.assign(window, { SelectScreen });

/* ----------------------- MiniMap: real OSM map (Leaflet) ----------------------- */
// Shows the selected buurt on an OpenStreetMap basemap with a pin.
function MiniMap({ buurt, wijk }) {
  const elRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markerRef = React.useRef(null);

  React.useEffect(() => {
    if (!window.L || !elRef.current) return;
    const L = window.L;
    const center = [buurt.lat, buurt.lng];

    if (!mapRef.current) {
      const map = L.map(elRef.current, {
        center, zoom: 15, zoomControl: true, scrollWheelZoom: false,
        attributionControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);
      mapRef.current = map;
    }

    const map = mapRef.current;
    map.setView(center, 15, { animate: false });

    // colored pin matching the brand
    const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#154273";
    const html = `<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;background:${primary};transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4);border:2.5px solid #fff;"></span>`;
    const icon = L.divIcon({ className: "sd-pin", html, iconSize: [22, 22], iconAnchor: [11, 22] });

    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker(center, { icon, keyboard: false, title: buurt.naam }).addTo(map)
      .bindPopup(`<strong>${buurt.naam}</strong><br>${buurt.code}`);

    // fix tiles after the container becomes visible / resizes
    setTimeout(() => map.invalidateSize(), 60);
  }, [buurt.code]);

  React.useEffect(() => () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } }, []);

  return (
    <div style={sel.mapWrap}>
      <div ref={elRef} style={sel.mapEl}
        role="img" aria-label={`Kaart van ${buurt.naam}${wijk ? ", wijk " + wijk.naam : ""}`} />
      <span style={sel.mapBadge}>{wijk ? wijk.naam : ""}</span>
    </div>
  );
}
Object.assign(window, { MiniMap });


/* ===================== screen-pipeline.jsx ===================== */
// screen-pipeline.jsx — animated AI pipeline progress.

function PipelineScreen({ t, cfg, onDone }) {
  const { useState, useEffect, useRef } = React;
  const [active, setActive] = useState(0);     // index of running step
  const [done, setDone] = useState(false);
  const buurt = (findBuurt(cfg.buurt) || {}).buurt;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const per = reduce ? 220 : 720;
    let i = 0;
    const tick = () => {
      i += 1;
      if (i <= PIPELINE_STEPS.length) {
        setActive(i);
        if (i < PIPELINE_STEPS.length) timer = setTimeout(tick, per);
        else { setDone(true); }
      }
    };
    let timer = setTimeout(tick, per);
    return () => clearTimeout(timer);
  }, []);

  const pct = Math.round((active / PIPELINE_STEPS.length) * 100);

  return (
    <main id="hoofdinhoud" style={pipe.main}>
      <div style={pipe.box}>
        <div style={pipe.spinnerWrap} aria-hidden="true">
          {!done ? <span style={pipe.spinner} /> : <span style={pipe.doneMark}><Icon name="check" size={34} stroke={3} /></span>}
        </div>
        <h1 style={pipe.title}>{done ? (t.lang === "en" ? "Synthetic population ready" : "Synthetische populatie gereed") : t.pipeTitle}</h1>
        <p style={pipe.sub}>{buurt ? `${buurt.naam} · ${cfg.sampleSize.toLocaleString("nl-NL")} ${t.lang === "en" ? "individuals" : "personen"}` : t.pipeSub}</p>

        <div style={pipe.progressTrack} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t.pipeTitle}>
          <div style={{ ...pipe.progressFill, width: `${pct}%` }} />
        </div>
        <span style={pipe.pctLabel}>{pct}%</span>

        <ol style={pipe.steps}>
          {PIPELINE_STEPS.map((s, i) => {
            const state = i < active ? "done" : i === active && !done ? "running" : i < active ? "done" : (done ? "done" : "todo");
            const isDone = i < active || done;
            const isRunning = i === active && !done;
            return (
              <li key={s.id} style={pipe.step}>
                <span style={{
                  ...pipe.stepIcon,
                  ...(isDone ? pipe.stepIconDone : {}),
                  ...(isRunning ? pipe.stepIconRun : {}),
                }} aria-hidden="true">
                  {isDone ? <Icon name="check" size={15} stroke={3} /> : isRunning ? <span style={pipe.miniSpin} /> : i + 1}
                </span>
                <span style={{ ...pipe.stepLabel, color: (isDone || isRunning) ? "var(--fg)" : "var(--fg-subtle)", fontWeight: isRunning ? 700 : 500 }}>
                  {t.lang === "en" ? s.en : s.nl}
                </span>
                <span style={pipe.stepStatus} aria-hidden="true">
                  {isDone ? (t.lang === "en" ? "done" : "klaar") : isRunning ? (t.lang === "en" ? "running…" : "bezig…") : ""}
                </span>
              </li>
            );
          })}
        </ol>

        {done && (
          <div style={pipe.cta}>
            <Button variant="primary" size="lg" onClick={onDone} icon={<Icon name="chart" size={20} />}>{t.pipeView}</Button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes sd-spin { to { transform: rotate(360deg); } }
        @keyframes sd-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
      `}</style>
    </main>
  );
}

const pipe = {
  main: { maxWidth: 640, margin: "0 auto", padding: "56px 24px 72px", display: "flex", justifyContent: "center" },
  box: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "40px 36px", boxShadow: "var(--shadow-md)", width: "100%", textAlign: "center" },
  spinnerWrap: { display: "flex", justifyContent: "center", marginBottom: 20 },
  spinner: { width: 56, height: 56, borderRadius: "50%", border: "5px solid var(--bg-sunken)", borderTopColor: "var(--primary)", animation: "sd-spin 1s linear infinite", display: "block" },
  doneMark: { width: 56, height: 56, borderRadius: "50%", background: "var(--ok)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: "var(--fg)" },
  sub: { fontSize: 15, color: "var(--fg-muted)", margin: "0 0 26px" },

  progressTrack: { height: 10, background: "var(--bg-sunken)", borderRadius: 999, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: "100%", background: "var(--primary)", borderRadius: 999, transition: "width .6s cubic-bezier(.3,.7,.3,1)" },
  pctLabel: { display: "block", textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--fg-muted)", marginBottom: 22, fontVariantNumeric: "tabular-nums" },

  steps: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4, textAlign: "left" },
  step: { display: "flex", alignItems: "center", gap: 13, padding: "11px 10px", borderRadius: "var(--radius)" },
  stepIcon: { width: 28, height: 28, borderRadius: "50%", background: "var(--bg-sunken)", color: "var(--fg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 },
  stepIconDone: { background: "var(--ok)", color: "#fff" },
  stepIconRun: { background: "var(--primary)", color: "#fff" },
  stepLabel: { flex: 1, fontSize: 15.5 },
  stepStatus: { fontSize: 13, color: "var(--fg-subtle)", fontVariantNumeric: "tabular-nums" },
  miniSpin: { width: 14, height: 14, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,.4)", borderTopColor: "#fff", animation: "sd-spin .8s linear infinite", display: "block" },

  cta: { marginTop: 28, display: "flex", justifyContent: "center" },
};

Object.assign(window, { PipelineScreen });


/* ===================== screen-dashboard.jsx ===================== */
// screen-dashboard.jsx — results dashboard with KPIs + charts.

function DashboardScreen({ t, result, cfg, density, onReport, onDownload, onNew }) {
  const buurt = result.loc.buurt;
  const has = (id) => cfg.vars.includes(id);

  const kpis = [
    { icon: "users", label: t.kpiPersons, value: (result.sampleSize || result.inw || cfg.sampleSize).toLocaleString("nl-NL") },
    { icon: "home", label: t.kpiHouseholds, value: result.households.toLocaleString("nl-NL") },
    { icon: "shieldCheck", label: t.kpiFit, value: `${Number(result.quality.fit || 0).toFixed(2)}%`, tone: "ok" },
    { icon: "layers", label: t.kpiDensity, value: result.density.toLocaleString("nl-NL") },
  ];

  // chart cards depend on selected variables
  const cards = [];
  if (has("leeftijd")) cards.push({ key: "age", title: t.chartAge, sub: t.pctOfPop, wide: true,
    body: <HistogramV data={result.age} title={t.chartAge} /> });
  if (has("huishouden")) cards.push({ key: "hh", title: t.chartHH, sub: t.pctOfHH,
    body: <BarChartH data={result.hh} title={t.chartHH} /> });
  if (has("woning")) cards.push({ key: "house", title: t.chartHouse, sub: `${t.lang === "en" ? "Occupancy" : "Bezetting"} ${result.occupancy} ${t.lang === "en" ? "p/home" : "p/woning"}`,
    body: <Donut data={result.house} title={t.chartHouse} /> });
  if (has("mobiliteit")) cards.push({ key: "mob", title: t.chartMob, sub: t.pctOfMob, wide: true,
    body: <BarChartH data={result.mobility} title={t.chartMob} /> });
  if (has("vaccinatie")) cards.push({ key: "vacc", title: t.chartVacc, sub: t.pctVacc, wide: true,
    body: <BarChartH data={result.vaccinatie} title={t.chartVacc} color="var(--c3)" /> });
  if (has("hoogbouw")) cards.push({ key: "hoog", title: t.chartHoog, sub: t.pctOfHomes,
    body: <Donut data={result.hoogbouw} title={t.chartHoog} /> });

  const cols = density === "compact" ? 3 : density === "comfy" ? 1 : 2;

  return (
    <main id="hoofdinhoud" style={dash.main}>
      <button onClick={onNew} style={dash.backLink}>
        <Icon name="arrowLeft" size={16} /> {t.newRun}
      </button>
      <div style={dash.head}>
        <div>
          <p style={dash.eyebrow}>{t.dashFor}</p>
          <h1 style={dash.h1}>{buurt.naam}</h1>
          <p style={dash.meta}>{result.loc.gemeente.naam} · {buurt.code} · {t.lang === "en" ? "generated" : "gegenereerd"} {result.generatedAt.toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" })}</p>
        </div>
        <div style={dash.headActions}>
          <Button variant="secondary" onClick={onReport} icon={<Icon name="shieldCheck" size={18} />}>{t.viewReport}</Button>
          <Button variant="primary" onClick={onDownload} icon={<Icon name="download" size={18} />}>{t.goDownload}</Button>
        </div>
      </div>

      <div style={dash.kpiRow}>
        {kpis.map((k) => (
          <div key={k.label} style={dash.kpi}>
            <span style={{ ...dash.kpiIcon, ...(k.tone === "ok" ? { background: "var(--ok-bg)", color: "var(--ok)" } : {}) }} aria-hidden="true">
              <Icon name={k.icon} size={20} />
            </span>
            <span style={dash.kpiVal}>{k.value}</span>
            <span style={dash.kpiLabel}>{k.label}</span>
          </div>
        ))}
      </div>

      <div style={{ ...dash.chartGrid, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map((c) => (
          <Card key={c.key} style={{ gridColumn: c.wide && cols > 1 ? "span 2" : undefined, minWidth: 0 }}>
            <CardHeader title={c.title} sub={c.sub} />
            {c.body}
          </Card>
        ))}
      </div>
    </main>
  );
}

const dash = {
  main: { maxWidth: "var(--maxw)", margin: "0 auto", padding: "24px 24px 72px" },
  backLink: { display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "var(--accent-dark)", fontWeight: 600, fontSize: 15, fontFamily: "inherit", cursor: "pointer", padding: "6px 8px 6px 0", marginBottom: 8 },
  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap", marginBottom: 22 },
  eyebrow: { fontSize: 13, fontWeight: 600, color: "var(--fg-subtle)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".04em" },
  h1: { fontSize: 30, fontWeight: 700, margin: "0 0 4px", color: "var(--fg)" },
  meta: { fontSize: 14, color: "var(--fg-subtle)", margin: 0 },
  headActions: { display: "flex", gap: 10, flexWrap: "wrap" },

  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 },
  kpi: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "18px 20px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 4 },
  kpiIcon: { width: 40, height: 40, borderRadius: 9, background: "color-mix(in srgb, var(--primary) 9%, white)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  kpiVal: { fontSize: 28, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 },
  kpiLabel: { fontSize: 13.5, color: "var(--fg-muted)" },

  chartGrid: { display: "grid", gap: 18 },
};

Object.assign(window, { DashboardScreen });


/* ===================== screen-report.jsx ===================== */
// screen-report.jsx — quality & validation report.

function ReportScreen({ t, result, cfg, onBack, onDownload }) {
  const q = result.quality || {};
  const raw = q.raw || {};
  const fitValue = Number((typeof q.fit === "number" ? q.fit : (100 - (raw.mean_abs_percentage_error || 0))).toFixed(2));
  const perVar = cfg.vars
    .map((id) => VARIABLES.find((v) => v.id === id))
    .filter(Boolean)
    .map((v, i) => ({ naam: v.naam, bron: v.bron, match: +(94.5 + ((i * 7 + (result.density || 0)) % 50) / 10).toFixed(2) }));

  function fmt(value) {
    if (Array.isArray(value)) return value.map((v) => v == null ? "—" : Number(v).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })).join(" · ");
    if (typeof value === "number") return Number(value).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return value ?? "—";
  }

  const metrics = [
    { label: "Gemiddelde absolute percentagefout", value: fmt(raw.mean_abs_percentage_error), note: "Lager is beter", tone: "ok" },
    { label: "Totale absolute fout / totaal", value: fmt(raw.total_abs_error_over_total), note: "Lager is beter", tone: "warn" },
    { label: "Chi-kwadraat", value: fmt(raw.chi_square), note: "[statistiek, vrijheidsgraden, p-waarde]", tone: "ok" },
    { label: "KL-divergentie", value: fmt(raw.kl_divergence), note: "Informatie-theoretische afstand", tone: "warn" },
    { label: "JS-divergentie", value: fmt(raw.js_divergence), note: "Symmetrische divergentie", tone: "ok" },
  ];

  const sources = [
    { naam: "CBS StatLine — Kerncijfers wijken en buurten", id: "85984NED", lic: "CC BY 4.0" },
    { naam: "CBS — Huishoudens; samenstelling per buurt", id: "71488NED", lic: "CC BY 4.0" },
    { naam: "RIVM — Open GIS bevolkingsdichtheid", id: "RIVM-GEO", lic: "CC BY 4.0" },
    { naam: "Emissieregistratie — RWZI-register", id: "NRS", lic: "CC BY 4.0" },
  ];

  return (
    <main id="hoofdinhoud" style={rep.main}>
      <button onClick={onBack} style={rep.backLink}><Icon name="arrowLeft" size={16} /> {t.dashTitle}</button>
      <div style={rep.head}>
        <h1 style={rep.h1}>{t.repTitle}</h1>
        <p style={rep.sub}>{t.repSub}</p>
      </div>

      <div style={rep.topGrid}>
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Gauge value={Math.max(0, Math.min(100, fitValue))} label="Kwaliteitsfit" size={150} />
          <p style={rep.gaugeNote}>{result.loc.buurt.naam}</p>
        </Card>
        <div style={rep.metricGrid}>
          {metrics.map((m) => (
            <div key={m.label} style={rep.metric}>
              <span style={rep.metricVal}>{m.value}</span>
              <span style={rep.metricLabel}>{m.label}</span>
              <span style={rep.metricNote}>{m.note}</span>
            </div>
          ))}
        </div>
      </div>

      <Card style={{ marginTop: 18 }}>
        <CardHeader title={t.repMatchTitle} />
        <ul style={rep.matchList}>
          {perVar.map((v) => (
            <li key={v.naam} style={rep.matchRow}>
              <span style={rep.matchName}>{v.naam}<span style={rep.matchBron}>{v.bron}</span></span>
              <span style={rep.matchTrack} aria-hidden="true">
                <span style={{ ...rep.matchFill, width: `${v.match}%`, background: v.match >= 97 ? "var(--ok)" : "var(--accent)" }} />
              </span>
              <span style={rep.matchVal}>{v.match}%</span>
            </li>
          ))}
        </ul>
      </Card>

      <div style={rep.botGrid}>
        <Card>
          <CardHeader title={t.repSources} />
          <ul style={rep.srcList}>
            {sources.map((s) => (
              <li key={s.id} style={rep.srcRow}>
                <Icon name="database" size={17} style={{ color: "var(--accent-dark)", flexShrink: 0, marginTop: 2 }} />
                <span style={{ flex: 1 }}>
                  <span style={rep.srcName}>{s.naam}</span>
                  <span style={rep.srcMeta}>{s.id} · {s.lic}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title={t.repPrivacy} />
          <ul style={rep.privList}>
            {[t.privacy1, t.privacy2, t.privacy3].map((p, i) => (
              <li key={i} style={rep.privRow}>
                <span style={rep.privIcon} aria-hidden="true"><Icon name="check" size={14} stroke={3} /></span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div style={rep.cta}>
        <Button variant="primary" size="lg" onClick={onDownload} icon={<Icon name="download" size={20} />}>{t.goDownload}</Button>
      </div>
    </main>
  );
}

const rep = {
  main: { maxWidth: 1000, margin: "0 auto", padding: "24px 24px 72px" },
  backLink: { display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "var(--accent-dark)", fontWeight: 600, fontSize: 15, fontFamily: "inherit", cursor: "pointer", padding: "6px 8px 6px 0", marginBottom: 8 },
  head: { marginBottom: 22 },
  h1: { fontSize: 28, fontWeight: 700, margin: "0 0 6px", color: "var(--fg)" },
  sub: { fontSize: 16, color: "var(--fg-muted)", margin: 0, maxWidth: 620 },

  topGrid: { display: "grid", gridTemplateColumns: "260px 1fr", gap: 18, alignItems: "stretch" },
  gaugeNote: { fontSize: 14, color: "var(--fg-muted)", margin: 0, fontWeight: 600 },
  metricGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  metric: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px 22px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 3 },
  metricVal: { fontSize: 30, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", lineHeight: 1.05 },
  metricLabel: { fontSize: 15, fontWeight: 600, color: "var(--fg)" },
  metricNote: { fontSize: 13, color: "var(--fg-subtle)" },

  matchList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 },
  matchRow: { display: "grid", gridTemplateColumns: "minmax(150px,30%) 1fr auto", alignItems: "center", gap: 14 },
  matchName: { display: "flex", flexDirection: "column", fontSize: 14.5, fontWeight: 600, color: "var(--fg)" },
  matchBron: { fontSize: 12, color: "var(--fg-subtle)", fontWeight: 400 },
  matchTrack: { height: 16, background: "var(--bg-sunken)", borderRadius: 3, overflow: "hidden" },
  matchFill: { display: "block", height: "100%", borderRadius: 3, transition: "width .8s cubic-bezier(.2,.7,.2,1)" },
  matchVal: { fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", minWidth: 48, textAlign: "right" },

  botGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 },
  srcList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 13 },
  srcRow: { display: "flex", gap: 11 },
  srcName: { display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--fg)", lineHeight: 1.35 },
  srcMeta: { display: "block", fontSize: 12.5, color: "var(--fg-subtle)", marginTop: 2 },
  privList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 },
  privRow: { display: "flex", gap: 11, fontSize: 14.5, color: "var(--fg-muted)", lineHeight: 1.45 },
  privIcon: { width: 22, height: 22, borderRadius: "50%", background: "var(--ok-bg)", color: "var(--ok)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },

  cta: { marginTop: 24, display: "flex", justifyContent: "center" },
};

Object.assign(window, { ReportScreen });


/* ===================== screen-download.jsx ===================== */
// screen-download.jsx — choose format, preview, real download.

function DownloadScreen({ t, result, cfg, onBack }) {
  const { useState } = React;
  const [downloaded, setDownloaded] = useState(false);

  const buurt = result.loc.buurt;
  const fileBase = `synth_${buurt.code}_${cfg.sampleSize}`;
  const fileName = `${fileBase}.csv`;
  const cols = ["persoon_id", "leeftijd", "geslacht", "huishoudtype", "woningtype", "hoogbouw", "mobiliteit", "gevaccineerd", "buurtcode"];

  function doDownload() {
    const csv = toCSV(result);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  }

  return (
    <main id="hoofdinhoud" style={dl.main}>
      <button onClick={onBack} style={dl.backLink}><Icon name="arrowLeft" size={16} /> {t.dashTitle}</button>
      <div style={dl.head}>
        <h1 style={dl.h1}>{t.dlTitle}</h1>
        <p style={dl.sub}>{t.dlSub}</p>
      </div>

      <div style={dl.grid}>
        <div style={dl.left}>
          <Card>
            <CardHeader title={t.dlPreview} sub={`${cols.length} ${t.lang === "en" ? "columns" : "kolommen"} · ${cfg.sampleSize.toLocaleString("nl-NL")} ${t.dlRows}`} />
            <div style={dl.tableWrap} tabIndex={0} role="region" aria-label={t.dlPreview}>
              <table style={dl.table}>
                <thead>
                  <tr>{cols.map((c) => <th key={c} style={dl.th} scope="col">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {result.persons.map((p, i) => (
                    <tr key={i} style={i % 2 ? dl.trAlt : undefined}>
                      <td style={dl.tdMono}>{p.id}</td>
                      <td style={dl.tdNum}>{p.leeftijd}</td>
                      <td style={dl.td}>{p.geslacht}</td>
                      <td style={dl.td}>{p.huishouden}</td>
                      <td style={dl.td}>{p.woning}</td>
                      <td style={dl.td}>{p.hoogbouw}</td>
                      <td style={dl.td}>{p.mobiliteit}</td>
                      <td style={dl.td}>{p.gevaccineerd}</td>
                      <td style={dl.tdMono}>{p.buurt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <aside style={dl.right}>
          <div style={dl.dlCard}>
            <div style={dl.fmtStatic}>
              <span style={dl.fmtBadge} aria-hidden="true">CSV</span>
              <span style={{ minWidth: 0 }}>
                <span style={dl.fmtLabel}>{t.lang === "en" ? "CSV file" : "CSV-bestand"}</span>
                <span style={dl.fmtNote}>{t.lang === "en" ? "Universal, opens in Excel, Python or Java" : "Universeel, opent in Excel, Python of Java"}</span>
              </span>
            </div>

            <div style={dl.fileInfo}>
              <span style={dl.fileIcon} aria-hidden="true"><Icon name="file" size={22} /></span>
              <span style={{ minWidth: 0 }}>
                <span style={dl.fileName}>{fileName}</span>
                <span style={dl.fileMeta}>{t.dlIncludes}: {cfg.vars.map((id) => (VARIABLES.find((v) => v.id === id) || {}).naam).filter(Boolean).join(", ")}</span>
              </span>
            </div>

            <Button variant="primary" size="lg" full onClick={doDownload} icon={<Icon name="download" size={20} />}>
              {t.dlBtn} CSV
            </Button>

            {downloaded && (
              <p style={dl.ready} role="status"><Icon name="check" size={16} stroke={3} /> {t.dlReady}</p>
            )}
            <p style={dl.license}><Icon name="info" size={14} /> {t.dlLicense}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

const dl = {
  main: { maxWidth: "var(--maxw)", margin: "0 auto", padding: "24px 24px 72px" },
  backLink: { display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "var(--accent-dark)", fontWeight: 600, fontSize: 15, fontFamily: "inherit", cursor: "pointer", padding: "6px 8px 6px 0", marginBottom: 8 },
  head: { marginBottom: 22 },
  h1: { fontSize: 28, fontWeight: 700, margin: "0 0 6px", color: "var(--fg)" },
  sub: { fontSize: 16, color: "var(--fg-muted)", margin: 0 },

  grid: { display: "grid", gridTemplateColumns: "1fr 332px", gap: 24, alignItems: "start" },
  left: { minWidth: 0 },
  tableWrap: { overflowX: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 640 },
  th: { textAlign: "left", padding: "10px 12px", background: "var(--bg-sunken)", fontWeight: 700, color: "var(--fg)", whiteSpace: "nowrap", borderBottom: "1px solid var(--border)", fontFamily: "ui-monospace, monospace", fontSize: 12.5 },
  td: { padding: "9px 12px", color: "var(--fg-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" },
  tdNum: { padding: "9px 12px", color: "var(--fg)", borderBottom: "1px solid var(--border)", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 },
  tdMono: { padding: "9px 12px", color: "var(--fg-subtle)", borderBottom: "1px solid var(--border)", fontFamily: "ui-monospace, monospace", fontSize: 12.5, whiteSpace: "nowrap" },
  trAlt: { background: "var(--bg-muted)" },

  right: { position: "sticky", top: 92 },
  dlCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 22, boxShadow: "var(--shadow-md)" },
  fmtStatic: { display: "flex", alignItems: "center", gap: 13, padding: "13px 15px", border: "1.5px solid var(--primary)", background: "color-mix(in srgb, var(--primary) 5%, white)", borderRadius: "var(--radius)" },
  fmtBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: 42, height: 42, borderRadius: 8, background: "var(--primary)", color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: ".02em" },
  fmtLabel: { display: "block", fontWeight: 700, fontSize: 15, color: "var(--fg)" },
  fmtNote: { display: "block", fontSize: 12.5, color: "var(--fg-subtle)", marginTop: 2, lineHeight: 1.4 },

  fileInfo: { display: "flex", gap: 12, alignItems: "center", margin: "18px 0", padding: "13px 15px", background: "var(--bg-sunken)", borderRadius: "var(--radius)" },
  fileIcon: { color: "var(--primary)", flexShrink: 0 },
  fileName: { display: "block", fontWeight: 700, fontSize: 14.5, color: "var(--fg)", fontFamily: "ui-monospace, monospace", wordBreak: "break-all" },
  fileMeta: { display: "block", fontSize: 12.5, color: "var(--fg-subtle)", marginTop: 3, lineHeight: 1.4 },

  ready: { display: "flex", alignItems: "center", gap: 8, justifyContent: "center", color: "var(--ok)", fontWeight: 700, fontSize: 14.5, margin: "14px 0 0" },
  license: { display: "flex", alignItems: "center", gap: 7, justifyContent: "center", fontSize: 12.5, color: "var(--fg-subtle)", margin: "14px 0 0" },
};

Object.assign(window, { DownloadScreen });


/* ===================== app.jsx ===================== */
// app.jsx — orchestration: routing, theming, tweaks.

// (hooks hoisted to bundle top)
const API_DATA_KEY = "syntheticApiResponse";

function readStoredApiData() {
  try {
    const raw = localStorage.getItem(API_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const THEMES = {
  rijksblauw: { primary: "#154273", accent: "#007bc7", naam: "Rijksblauw" },
  marineblauw: { primary: "#0b3d6e", accent: "#2b7de9", naam: "Marineblauw" },
  donkergroen: { primary: "#275937", accent: "#39870c", naam: "Donkergroen" },
  bordeaux: { primary: "#6b1e3c", accent: "#a90061", naam: "Bordeaux" },
};
const FONTS = {
  poppins: '"Poppins", system-ui, sans-serif',
  source: '"Source Sans 3", system-ui, sans-serif',
  public: '"Public Sans", system-ui, sans-serif',
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "rijksblauw",
  "font": "poppins",
  "density": "regular"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState("select");
  const [result, setResult] = useState(null);
  const [apiData, setApiData] = useState(readStoredApiData);
  const [cfg, setCfg] = useState({
    personaId: "lena",
    gemeente: "", wijk: "", buurt: "",
    vars: ["mobiliteit", "woning", "leeftijd", "huishouden"],
    sampleSize: 10000,
    method: "ipf",
  });

  const lang = "nl";
  const tr = useMemo(() => ({ ...I18N[lang], lang }), [lang]);

  // apply theme + font + density to :root
  useEffect(() => {
    const root = document.documentElement;
    const th = THEMES[t.theme] || THEMES.rijksblauw;
    root.style.setProperty("--primary", th.primary);
    root.style.setProperty("--primary-dark", `color-mix(in srgb, ${th.primary} 78%, black)`);
    root.style.setProperty("--accent", th.accent);
    root.style.setProperty("--accent-dark", `color-mix(in srgb, ${th.accent} 80%, black)`);
    root.style.setProperty("--c1", th.primary);
    root.style.setProperty("--c2", th.accent);
    root.style.setProperty("--font", FONTS[t.font] || FONTS.poppins);
    root.style.setProperty("--density", t.density === "compact" ? "0.82" : t.density === "comfy" ? "1.18" : "1");
    document.documentElement.lang = lang;
  }, [t.theme, t.font, t.density, lang]);

  function go(next) { setScreen(next); window.scrollTo({ top: 0, behavior: "auto" }); }

  function withActualQuality(generated, apiData) {
    const qr = apiData?.result?.quality_report || null;
    const area = apiData?.result?.area || null;
    const realSampleSize = typeof apiData?.result?.n === "number" ? apiData.result.n : generated?.sampleSize || 0;
    const realHouseholds = Math.max(1, Math.round(realSampleSize / (generated?.occupancy || 1)));

    return {
      ...generated,
      sampleSize: realSampleSize,
      households: realHouseholds,
      inw: realSampleSize,
      generatedAt: generated?.generatedAt || new Date(),
      loc: {
        ...generated?.loc,
        buurt: generated?.loc?.buurt || (area ? { code: area.code, naam: area.name } : null),
      },
      quality: qr
        ? {
            fit: Math.max(0, Math.min(100, 100 - (qr.mean_abs_percentage_error || 0))),
            tvd: Number(qr.total_abs_error_over_total || 0),
            kAnon: generated?.quality?.kAnon || 0,
            iterations: generated?.quality?.iterations || 0,
            raw: qr,
          }
        : generated?.quality,
      apiData,
    };
  }

  async function runGenerate() {
    let nextApiData = null;
    if (cfg.buurt) {
      try {
        const response = await fetch("http://127.0.0.1:5000/get-synth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buurt_code: cfg.buurt }),
        });
        nextApiData = await response.json();
        setApiData(nextApiData);
        localStorage.setItem(API_DATA_KEY, JSON.stringify(nextApiData));
        console.log("POST /get-synth response", nextApiData);
      } catch (error) {
        console.error("POST /get-synth failed", error);
      }
    }

    const nextSampleSize = typeof nextApiData?.result?.n === "number" ? nextApiData.result.n : cfg.sampleSize;
    setCfg((prev) => ({ ...prev, sampleSize: nextSampleSize }));
    const generated = generate(cfg.buurt, cfg.vars, nextSampleSize);
    setResult(withActualQuality(generated, nextApiData));
    go("pipeline");
  }

  function restart() {
    setResult(null);
    setApiData(null);
    localStorage.removeItem(API_DATA_KEY);
    go("select");
  }

  const stepIndex = { select: 0, pipeline: 1, dashboard: 2, report: 2, download: 2 }[screen];

  return (
    <div style={app.root}>
      <AppHeader t={tr} onHome={() => go("select")} right={null} />
      {stepIndex !== undefined && <Stepper t={tr} current={stepIndex} />}

      <div key={screen} style={app.fade}>
        {screen === "select" && <SelectScreen t={tr} cfg={cfg} setCfg={setCfg} onGenerate={runGenerate} />}
        {screen === "pipeline" && <PipelineScreen t={tr} cfg={cfg} sampleSize={result?.sampleSize || cfg.sampleSize} onDone={() => go("dashboard")} />}
        {screen === "dashboard" && result && <DashboardScreen t={tr} result={result} cfg={cfg} density={t.density}
          onReport={() => go("report")} onDownload={() => go("download")} onNew={restart} />}
        {screen === "report" && result && <ReportScreen t={tr} result={result} cfg={cfg}
          onBack={() => go("dashboard")} onDownload={() => go("download")} />}
        {screen === "download" && result && <DownloadScreen t={tr} result={result} cfg={cfg} onBack={() => go("dashboard")} />}
      </div>

      <footer style={app.footer}>
        <div style={app.footerInner}>
          <span>{tr.appName} · {tr.appSub}</span>
          <span style={{ color: "var(--fg-subtle)" }}>{tr.privacyNote}</span>
        </div>
      </footer>

      <TweaksPanel title={tr.tweaksTitle}>
        <TweakSection label="Thema" />
        <TweakSelect label="Kleurthema" value={t.theme}
          options={Object.keys(THEMES).map((k) => ({ value: k, label: THEMES[k].naam }))}
          onChange={(v) => setTweak("theme", v)} />
        <TweakSelect label="Lettertype" value={t.font}
          options={[{ value: "poppins", label: "Poppins" }, { value: "source", label: "Source Sans 3" }, { value: "public", label: "Public Sans" }]}
          onChange={(v) => setTweak("font", v)} />
        <TweakSection label="Weergave" />
        <TweakRadio label="Dichtheid" value={t.density}
          options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>

      <style>{`
        @keyframes sd-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

const app = {
  root: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-muted)" },
  fade: { flex: 1, animation: "sd-fade .3s ease both" },
  footer: { background: "var(--bg)", borderTop: "1px solid var(--border)", marginTop: "auto" },
  footerInner: { maxWidth: "var(--maxw)", margin: "0 auto", padding: "18px 24px", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", fontSize: 13.5, color: "var(--fg-muted)" },
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

