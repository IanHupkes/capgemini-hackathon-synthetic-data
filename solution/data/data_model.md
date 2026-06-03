# Datamodel Plan – Synthesische Populatie

## Doel
Een uitbreidbaar datamodel voor synthetische populaties, gebaseerd op de variable catalogue.

Strategie:
- Start met minimale subset (must-have)
- Bouw pipeline end-to-end
- Breid iteratief uit per categorie

---

## Model Principes

- Werk met **discrete categorieën (buckets)**
- Gebruik **marginals als input (CBS data)**
- Houd model **IPF-vriendelijk (lage dimensionaliteit)**
- Vermijd complexe relaties in v0

---

## Fase 1 – Minimal Viable Model

**Doel:** werkende pipeline

**Dimensies:**
- Buurtcode (spatial sleutel)
- Leeftijd (5 groepen)
- Huishoudgrootte (vereenvoudigd: 1 / 2 / 3+)

**Waarom deze set:**
- direct IPF toepasbaar
- epidemiologisch relevant
- beschikbaar in één CBS tabel (`86165NED`)

---

## Fase 2 – Basis Uitbreiding

**Toevoegen:**
- inkomen (laag / midden / hoog)
- woningtype (3 categorieën)
- stedelijkheidsgraad

**Effect:**
- realistischer sociaal profiel
- lichte toename complexiteit (3D+ IPF)

---

## Fase 3 – Sociaal & Gedrag

**Toevoegen:**
- opleidingsniveau
- arbeidsmarktpositie
- schoolgaande kinderen (%)

**Let op:**
- mogelijk afhankelijkheden → valideren nodig

---

## Fase 4 – Ruimtelijk & Meta

**Toevoegen:**
- landgebruik (% verdelingen)
- RWZI / catchment koppeling
- nabijheid (voorzieningen)

**Gebruik:**
- koppeling naar epidemiologische modellen
- spatial analyses

---

## Representatie

### Dimensies
Elke variabele → discrete categorieën: