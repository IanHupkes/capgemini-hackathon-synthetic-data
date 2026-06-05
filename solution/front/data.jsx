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
  { code: "GM0772", naam: "Eindhoven", wijken: [
    { code: "WK077205", naam: "Strijp", buurten: [
      { code: "BU07720512", naam: "Strijp-S", inw: 5470, lat: 51.448, lng: 5.456 },
      { code: "BU07720515", naam: "Philipsdorp", inw: 4310, lat: 51.4452, lng: 5.46 },
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
