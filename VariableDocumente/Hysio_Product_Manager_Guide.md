# Product Manager's Gids voor de Hysio Medical Scribe

## Inleiding

Dit document is de definitieve, niet-technische gids voor het begrijpen van de volledige gebruikerservaring van de Hysio Medical Scribe applicatie. Het beschrijft precies wat fysiotherapeuten zien en doen tijdens hun werkproces, waarom de interface zo is ontworpen, en welke waarde elke feature biedt.

De Hysio Medical Scribe heeft twee hoofdworkflows:
- **Hysio Intake**: Een uitgebreide, gestructureerde workflow voor nieuwe patiënten (45-60 minuten)
- **Hysio Consult**: Een snelle, gestroomlijnde workflow voor vervolgafspraken (10-15 minuten)

Beide workflows transformeren gesproken gesprekken en handmatige notities naar professionele, gestructureerde documentatie die direct in het EPD kan worden geïmporteerd.

---

# Hoofdstuk 1: De Hysio Intake Workflow - Een Diepgaande Walkthrough

De Intake Workflow begeleidt fysiotherapeuten door een complete nieuwe patiënt assessment in drie logische fasen. Het scherm is altijd verdeeld in twee hoofdpanelen: links voor resultaten en rechts voor invoer.

## Fase 1: Anamnese - Het Gesprek Vastleggen

### De Start: Een Leeg Canvas Met Duidelijke Richting

Wanneer de fysiotherapeut de anamnese begint, ziet het scherm er strategisch uit:

**Links Paneel - De Wachtende Resultaten**:
- **Anamnesekaart**: Een ingeklapte, grijze sectie met de titel "PHSB Anamnesekaart" die duidelijk wacht op informatie
- **Intake Voorbereiding**: Een uitgeklapte, actieve sectie bovenaan die al bruikbare voorbereidingsnotities bevat voor het gesprek

**Rechts Paneel - De Actieve Invoertools**:
- **Live Opname**: Een prominente sectie met een grote rode "Start Opname" knop en timer
- **Handmatige Notities**: Een groot tekstveld voor realtime typing tijdens het gesprek
- **Hysio Assistant**: Een ingeklapte AI-hulp sectie voor wanneer nodig

**Waarom deze indeling?** De fysiotherapeut ziet meteen waar de resultaten zullen verschijnen (links), terwijl alle actiegerichte tools rechts staan. Het is intuïtief: invoer rechts, output links.

### Het Gesprek: Meerdere Manieren om Informatie te Verzamelen

De fysiotherapeut heeft drie flexibele opties:

**1. Live Audio Opname**:
- Eén klik op "Start Opname" begint de sessie
- Een rode timer toont de verstreken tijd
- Pause/Resume knoppen voor onderbrekingen
- Maximum 30 minuten opnametijd

**2. Bestand Upload**:
- Een duidelijke upload-zone voor bestaande audio bestanden
- Automatische validatie (alleen audio bestanden, maximale grootte)
- Drag-and-drop functionaliteit

**3. Handmatige Notities**:
- Groot tekstveld dat tijdens de opname kan worden gebruikt
- Real-time karakter telling
- Combineert automatisch met audio transcriptie

**Waarom drie opties?** Flexibiliteit is cruciaal. Sommige fysiotherapeuten willen alleen opnemen, anderen typen graag mee, en sommige hebben al bestaande opnames. Het systeem past zich aan hun werkstijl aan.

### De Magie: Transformatie van Ruw naar Gestructureerd

Wanneer de fysiotherapeut op "Verwerk Anamnese" klikt, gebeurt er een dramatische transformatie van het scherm:

**De Verwachting Opbouwen**:
- Een loading spinner verschijnt met "Anamnese wordt verwerkt..."
- De "Verwerk" knop wordt grijs en onklikbaar
- Een subtiele indicatie dat er iets belangrijks gebeurt

**De Grote Onthulling - Links Paneel Transform**:
- **Anamnesekaart**: Klapt volledig open en wordt gevuld met vier gestructureerde secties:
  - **P - Patiënt Probleem**: De hoofdklacht en behandeldoelen
  - **H - Historie**: Ontstaan, beloop, voorgeschiedenis  
  - **S - Stoornissen**: Pijn, bewegingsbeperking, fysieke bevindingen
  - **B - Beperkingen**: Impact op dagelijks leven, werk, sport

- Elke sectie heeft:
  - **Bewerkbare tekst**: Direct klikken en aanpassen
  - **Kopieer knop**: Per sectie naar klembord
  - **Professionele formatting**: Nederlandse fysiotherapie terminologie

**De Verschuiving - Rechts Paneel Rust**:
- **Live Opname**: Klapt in en wordt grijs (taak voltooid)
- **Handmatige Notities**: Klapt in maar behoudt content (voor referentie)
- **Hysio Assistant**: Blijft beschikbaar voor vragen

**Waarom deze transformatie?** Dit is het "wow-moment" van de applicatie. Ruwe gespreksinformatie wordt automatisch een professionele, gestructureerde anamnese. De fysiotherapeut ziet direct de waarde en bespaart 20-30 minuten typewerk.

**De Edit Experience**:
- **Inline editing**: Klik op elke tekst om direct te bewerken
- **Auto-save**: Wijzigingen worden automatisch opgeslagen
- **Copy functionaliteit**: Hele kaart of per sectie naar EPD
- **Compact/Volledig view**: Toggle tussen samenvattings- en detailweergave

## Fase 2: Onderzoek - De Bevindingen Structureren

### De Gids: Intelligent Voorbereid Onderzoek

Bij het betreden van de onderzoeksfase ziet de fysiotherapeut een slim voorbereide omgeving:

**Links Paneel - Het Wachtende Onderzoek**:
- **Onderzoeksbevindingen**: Een lege, ingeklapte sectie die wacht op data
- **Anamnese Overzicht**: Een compacte, alleen-lezen weergave van fase 1 resultaten voor referentie

**Rechts Paneel - De Onderzoeksgids**:
- **Onderzoeksplan**: Een automatisch gegenereerd, gedetailleerd voorstel gebaseerd op de anamnese
  - Specifieke tests om uit te voeren
  - Bewegingsonderzoeken per gewricht
  - Krachttesten en functionele evaluaties
  - Aandachtspunten tijdens het onderzoek

**Waarom een voorbereid plan?** De AI heeft de anamnese geanalyseerd en stelt een op maat gemaakt onderzoeksprotocol voor. Dit voorkomt dat belangrijke tests worden vergeten en geeft minder ervaren therapeuten duidelijke richting.

### Het Onderzoek: Gestructureerde Data Vastlegging

**De Onderzoekstools** (rechts paneel):
- **Live Opname**: Opnieuw actief, maar nu voor onderzoeksbevindingen
- **Handmatige Notities**: Voor metingen, scores, observaties
- **Het Onderzoeksplan**: Blijft zichtbaar als checklist/gids

**Het Vastleg Proces**:
- De fysiotherapeut voert tests uit en noteert bevindingen
- Audio opname voor observaties ("Patient kan arm niet volledig heffen")
- Handmatige notities voor exacte metingen ("ROM schouder: flex 120°, abd 90°")

### Het Resultaat: Van Tests naar Professionele Bevindingen

Na klikken op "Verwerk Onderzoek" transformeert het scherm opnieuw:

**Links Paneel - Gestructureerde Bevindingen**:
- **Onderzoeksbevindingen**: Klapt open met volledig gestructureerde rapportage:
  - **Observaties & Inspectie**: Houding, zwelling, littekens
  - **Bewegingsonderzoek**: ROM metingen per gewricht (actief/passief)
  - **Krachtonderzoek**: MMT scores, functionele kracht
  - **Specifieke Tests**: Positieve/negatieve testresultaten
  - **Functionele Tests**: ADL simulaties, werkgerelateerde tests

**Rechts Paneel - Rust Mode**:
- Invoertools klappen in (taak voltooid)
- Onderzoeksplan blijft beschikbaar voor referentie

**Waarom deze structuur?** Ruwe testresultaten en observaties worden automatisch georganiseerd in de standaard Nederlandse fysiotherapie rapportage format. Dit bespaart 15-20 minuten structureren en zorgt voor consistentie.

## Fase 3: Klinische Conclusie - Het Eindverslag Samenstellen

### De Finale Stap: Alle Puzzelstukken Samenvoegen

In de laatste fase ziet de fysiotherapeut een clean, gefocuste interface:

**Volledig Scherm Layout**:
- Geen linker/rechter verdeling meer
- Eén grote, prominente knop: "Genereer Klinische Conclusie"
- Subtiele referenties naar vorige fasen onderaan

**Waarom volledig scherm?** Dit is het culminatiemoment. Alle aandacht moet naar deze finale actie gaan.

### Het Eindproduct: Geïntegreerde Klinische Intelligentie

Na het klikken op de knop verschijnt een complete klinische conclusie:

**De Gestructureerde Conclusie**:
- **Diagnose/Hypothese**: Primaire en secundaire diagnoses gebaseerd op bevindingen
- **Behandelplan**: Specifieke interventies, frequentie, duur
- **Prognose**: Verwachte herstelverloop en tijdlijn
- **Doelstellingen**: SMART behandeldoelen op kort/middellange termijn
- **Huisoefeningen**: Specifieke oefeningen met instructies
- **Adviezen**: Leefstijl, werk, sport aanbevelingen
- **Vervolgafspraken**: Wanneer en waarom

**De Bewerkbare Output**:
- Volledig bewerkbare tekst voor fine-tuning
- Copy naar klembord voor EPD import
- Export naar PDF voor patiënt
- Print optie voor dossier

**Waarom één geïntegreerd document?** Alle informatie uit de drie fasen wordt intelligent gecombineerd tot één samenhangend verhaal. De fysiotherapeut krijgt een complete, professionele rapportage die 45-60 minuten schrijfwerk bespaart.

---

# Hoofdstuk 2: De Hysio Consult Workflow - De Snelle Vervolgafspraak

De Consult Workflow is ontworpen voor snelheid en efficiency. Het hele proces duurt 3-5 minuten van start tot finish.

## Direct ter Zake: Een Gefocuste Interface

### De Opening: Alles Direct Zichtbaar

Wanneer de fysiotherapeut een vervolgconsult start, ziet het scherm:

**Links Paneel - Het SOEP Sjabloon**:
- Een leeg maar gestructureerd SOEP formulier:
  - **S - Subjectief**: Wat zegt de patiënt?
  - **O - Objectief**: Wat observeer je?
  - **E - Evaluatie**: Wat betekent dit?
  - **P - Plan**: Wat ga je doen?
- Elk onderdeel heeft een duidelijke kleur en icoon voor snelle herkenning

**Rechts Paneel - Snelle Invoer**:
- **Voorbereiding**: AI-gegenereerde herinneringspunten voor dit consult
- **Audio Opname**: Grote, prominente "Start Opname" knop
- **Handmatige Notities**: Voor snelle observaties tijdens gesprek

**Waarom deze directe aanpak?** Geen tijd verspillen. De fysiotherapeut ziet meteen waar het resultaat komt (links) en hoe het te bereiken (rechts).

### "Opnemen, Stoppen, Klaar": De Kern Ervaring

**De Eenvoudige Flow**:
1. **Start Opname**: Eén klik en de timer begint
2. **Voer Consult**: 10-15 minuten normaal gesprek met patiënt
3. **Stop Opname**: Nog een klik
4. **Verwerk**: Eén klik op "Verwerk in SOEP"
5. **Klaar**: Complete SOEP notitie verschijnt links

**De Timer Experience**:
- Grote, duidelijke timer tijdens opname
- Rood met pulse animatie (duidelijk "aan" signaal)
- Pause/Resume voor onderbrekingen
- Maximaal 15 minuten (vervolgconsulten zijn kort)

**Concurrent Typen**:
- Handmatige notities kunnen tijdens opname worden toegevoegd
- Beide inputs worden automatisch gecombineerd
- Flexibiliteit voor verschillende werkstijlen

**Waarom zo simpel?** Vervolgconsulten moeten snel. Elke extra klik of ingewikkelde interface kost tijd. De "opnemen-stoppen-klaar" mentaliteit past perfect bij hectische praktijken.

## Direct Resultaat: Van Gesprek naar EPD-Ready

### De Instant Transformatie

Na het verwerken verschijnt onmiddellijk:

**Links Paneel - Gevulde SOEP**:
- **Subjectief (S)**: "Patiënt rapporteert verminderde pijn (NPRS 3/10), beter slapen..."
- **Objectief (O)**: "ROM schouder: verbetering flexie naar 140°, kracht 4/5..."
- **Evaluatie (E)**: "Positieve respons op behandeling, doelen op schema..."
- **Plan (P)**: "Continueer huidige oefenprogramma, frequentie verhogen naar..."

**Elke sectie is**:
- Professioneel geformuleerd in fysiotherapie terminologie
- Direct bewerkbaar (klik en typ)
- Kopieerbaar naar EPD
- Print-ready voor dossier

### De Directe Actie Opties

**Onmiddellijk beschikbare acties**:
- **Copy naar EPD**: Volledige SOEP in geformatteerde tekst
- **Bewerken**: Inline editing voor aanpassingen
- **Export**: PDF voor patiënt of verzekering
- **Nieuw Consult**: Reset voor volgende patiënt

**Voor Verdere Detaillering** (optioneel):
- **"Bekijk Volledige SOEP"**: Opent gedetailleerde bewerkingspagina
- Sectie-per-sectie editing met kleurcodering
- Uitgebreide export opties
- Rode vlaggen detectie en highlighting

**Waarom directe acties?** Tijd is geld in vervolgconsulten. De fysiotherapeut moet binnen 1 minuut na verwerking de notitie in het EPD kunnen hebben staan.

---

# Hoofdstuk 3: Belangrijke Globale Elementen

Deze elementen verschijnen in beide workflows en zorgen voor consistente gebruikerservaring.

## De Voortgangsbalk Bovenaan (Workflow Navigator)

### Wat de Gebruiker Ziet

Bovenaan elke pagina staat een elegante horizontale balk met drie fasen:

**Voor Intake Workflow**:
- **Anamnese** (FileText icoon): Blauw als actief, groen als compleet
- **Onderzoek** (Stethoscope icoon): Grijs als toekomstig, blauw als actief  
- **Klinische Conclusie** (CheckCircle icoon): Grijs tot actief

**Visuele Feedback**:
- **Huidige fase**: Groter, gekleurd, met subtiele shadow
- **Voltooide fasen**: Groen vinkje, klikbaar voor navigatie
- **Toekomstige fasen**: Grijs, niet klikbaar
- **Progress bar**: Dunne lijn die vult naarmate fasen worden voltooid

### Waarom Deze Ontwerp

**Orientatie**: De gebruiker weet altijd waar ze zijn in het proces
**Vertrouwen**: Duidelijk zichtbare voortgang geeft gevoel van controle
**Navigatie**: Klikken op voltooide fasen om terug te gaan (voor edits)
**Motivatie**: Zien hoeveel er nog moet gebeuren

## Intelligent Interface Gedrag

### Automatische Interface Aanpassingen

**Als een fase wordt voltooid**:
- Invoerpanelen klappen automatisch in
- Resultaatpanelen klappen automatisch uit
- Focus verschuift naar de nieuw gevulde informatie
- Volgende fase wordt beschikbaar in de navigator

**Waarom automatisch inklappen?**
- **Ruimte**: Meer schermruimte voor belangrijke resultaten
- **Focus**: Aandacht gaat naar wat net is gecreëerd
- **Rust**: Voltooide taken verdwijnen uit zicht
- **Duidelijkheid**: Geen verwarrende, meerdere actieve panelen

### Hover en Click Feedback

**Bewerkbare Content**:
- Subtiele hover effect toont dat tekst bewerkbaar is
- Click transformeert tekst naar edit veld
- Auto-save na elke wijziging

**Copy Knoppen**:
- Hover toont preview van wat gekopieerd wordt
- Click geeft visuele feedback ("Gekopieerd!")
- Consistente locatie in elke sectie

## Error Handling en User Guidance

### Graceful Error Management

**Als iets misgaat**:
- **Duidelijke foutmelding** in begrijpelijke taal (geen technische codes)
- **Actiegerichte oplossing** ("Probeer opnieuw" knop altijd aanwezig)
- **Geen data verlies** (alles wat getypt/opgenomen is blijft bewaard)
- **Alternatieve routes** (als audio faalt, handmatige notities blijven werken)

**Preventieve Guidance**:
- **File validatie**: "Dit bestandstype wordt niet ondersteund" 
- **Lege invoer waarschuwing**: "Maak eerst een opname of typ notities"
- **Time limits**: Duidelijke timers en waarschuwingen bij limiet

### Waarom Fouten Zo Belangrijk Zijn

In een medische omgeving mag frustratie door technische problemen nooit patiëntenzorg verstoren. Elke fout moet:
- **Transparent** zijn over wat er mis ging
- **Hopeful** zijn over de oplossing  
- **Preserving** zijn van gebruikerswerk
- **Alternative** routes bieden

---

# Conclusie: De Product Visie in Actie

## De Kern Waardepropositie

**Voor Nieuwe Intakes (60+ minuten besparing)**:
- Van 90 minuten handmatig schrijven naar 30 minuten review en edit
- Gegarandeerde volledigheid door gestructureerde PHSB metodiek
- Professionele consistentie ongeacht therapeut ervaring

**Voor Vervolgconsulten (45+ minuten besparing)**:
- Van 20 minuten schrijven naar 3 minuten opnemen-en-klaar
- Directe EPD integratie zonder format problemen
- SOEP structuur voldoet aan alle Nederlandse richtlijnen

## De Gebruikerservaring Filosofie

**Invisible Technology**: De AI werkt op de achtergrond; vooraan staat de therapeut-patiënt interactie
**Workflow Integration**: Past in bestaande werkprocessen in plaats van nieuwe processen af te dwingen
**Professional Enhancement**: Maakt therapeuten beter in hun werk, vervangt ze niet

## Success Metrics voor Product Managers

**Adoption Metrics**:
- Time-to-first-value: Hoe snel ziet een nieuwe gebruiker voordeel?
- Session completion rate: Hoeveel begonnen workflows worden afgemaakt?
- Feature utilization: Welke delen van de workflow worden het meest gebruikt?

**Efficiency Metrics**:  
- Documentation time reduction: Gemiddelde tijdsbesparing per sessie
- Error reduction: Minder incomplete of incorrecte documentatie
- Consistency improvement: Standaardisatie tussen therapeuten

**Quality Metrics**:
- Edit ratio: Hoeveel van de AI output wordt ongewijzigd gebruikt?
- EPD integration success: Percentage foutloze import in patiënt systemen
- Compliance improvement: Beter voldoen aan documentatie richtlijnen

Dit document dient als de definitieve bron voor het begrijpen van de Hysio Medical Scribe vanuit product en business perspectief, zonder enige technische complexiteit.