
# Synthesische Populatie Pipeline – Plan

## Doel
End-to-end pipeline bouwen voor synthetische populaties op basis van CBS data.

**Strategie**
- Start met minimale kolommen
- Bouw volledige flow
- Breid iteratief uit

---

## Pipeline

Macro data → Micro data (IPF) → Validatie → Feedback

---

## Data Model (v0)
zie #data_model.md

---

## Stap 1 – Macro Data

**Owner:** 1

**Input:**
- locatie (wijk/buurt/gemeente)
- kolommen (v0: hardcoded)

**Acties:**
- ophalen CBS / publieke data
- mappen naar datamodel (kolommen + buckets)
- aggregeren naar marginals

**Output (JSON):**
```json

{
  "area": {
    "type": "buurt",
    "code": "BU001",
    "name": "Voorbeeldbuurt"
  },
  "dimensions": {
    "leeftijd": ["0-14", "15-24", "25-44", "45-64", "65+"],
    "huishoudgrootte": ["1", "2", "3+"]
  },
  "marginals": {
    "leeftijd": [120, 180, 350, 220, 130],
    "huishoudgrootte": [200, 300, 200]
  },
  "total_population": 700
}

```

---

## Stap 2 – Micro Data (IPF)

**Owner:** Sander + 1/2

**Doel:**
Genereren van synthetische populatie op basis van marginale verdelingen

---

**Input:**
- JSON uit stap 1
- (optioneel later) constraints / probabilistische relaties

---

**Acties:**
1. Definieer dimensies (bijv. leeftijd × inkomen)
2. Initialiseer matrix (uniform of random)
3. Pas IPF iteratief toe:
   - schaal per dimensie naar marginals
   - herhaal tot convergentie
4. Genereer individuele records uit matrix



buurt,leeftijd,huishoudgrootte
BU001,25-44,2
BU001,45-64,1
BU001,15-24,2
BU001,65+,1
BU001,0-14,3+
BU001,25-44,2
BU001,25-44,3+

---

## Stap 3 – Validatie

**Owner:** 1+

**Doel:**
Controleren of synthetische populatie overeenkomt met brondata

---

**Input:**
- CSV synthetische data (stap 2)
- macro data / marginals (stap 1)

---

**Checks:**
1. Aggregatie:
   - tel synthetische data per dimensie
   - vergelijk met marginals

2. Afwijking:
   - absolute fout
   - procentuele fout

3. (optioneel):
   - plausibiliteit (bijv. leeftijd vs inkomen)

---


## 🖥️ UI

**Owner:** Wessel

**Doel:**
Gebruiker input laten geven en resultaten tonen / downloaden

---

**Input (via UI):**
- locatie (wijk/buurt/gemeente)
- selectie kolommen (bijv. leeftijd, inkomen)

---

**Functionaliteiten (MVP):**
- formulier voor selectie input
- knop: "Genereer populatie"
- trigger pipeline (stap 1 → 2 → 3)
- download CSV resultaat

---

**Output (UI):**
- download link CSV
- basis validatie resultaat (pass / fail)

---

**Uitbreidingen (optioneel):**
- visualisaties (histogrammen, verdelingen)
- validatie rapport (afwijkingen)
- grafieken per dimensie

---

## Extra Rollen

### Data Modelling

**Owner:** 1

**Doel:**
Zorgen voor consistent en bruikbaar datamodel

**Verantwoordelijkheden:**
- definiëren kolommen en categorieën
- afstemmen datamodel met CBS data
- bewaken input/output structuur (JSON)
- voorkomen inconsistenties tussen stap 1 en 2

---

### Pipeline Orchestration

**Owner:** 1

**Doel:**
Zorgen dat de volledige flow end-to-end werkt

**Verantwoordelijkheden:**
- koppelen stap 1 → 2 → 3
- beheren input/output formaten
- maken van run-script / pipeline trigger
- oplossen integratie issues

---

### Product Owner

**Owner:** Rico

**Doel:**
Bewaken van scope en succes van de hackathon

**Verantwoordelijkheden:**
- prioriteren wat gebouwd wordt
- beslissen “goed genoeg”
- voorkomen scope creep
- sturen op werkende demo i.p.v. perfectie

---

### Stakeholder

**Owner:** Wessel & Rico? & Jaap?

**Doel:**
Inzicht krijgen in het probleem, de context en de wensen van stakeholders

**Verantwoordelijkheden:**
- ophalen van requirements en use-cases
- valideren of oplossing aansluit bij verwachtingen
- vertalen van wensen naar concrete features


**Activiteiten:**
- korte afstemming met stakeholders (indien beschikbaar)
- formuleren van succescriteria
- feedback ophalen op demo/resultaten (guerilla testing)

**Output:**
- duidelijke use-case(s)
- lijst met prioriteiten / wensen
- validatie: voldoet oplossing aan behoefte?

