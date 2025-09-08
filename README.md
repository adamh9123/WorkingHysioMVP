# Hysio Medical Scribe MVP - Working Version

Welkom bij de Hysio Medical Scribe, een door AI aangedreven SaaS-applicatie die is ontworpen om de administratieve last voor fysiotherapeuten drastisch te verminderen. Dit platform automatiseert de verslaglegging voor zowel intakes als vervolgconsulten, waardoor therapeuten zich kunnen richten op wat echt telt: de patiënt.

## ✨ Kernfunctionaliteiten (Key Features)

* **Hysio Intake Workflow:** Een volledig begeleid 3-fasen proces (Anamnese, Onderzoek, Klinische Conclusie) voor nieuwe patiënten, conform de Nederlandse fysiotherapie-richtlijnen.
* **Hysio Consult Workflow:** Een razendsnelle, gestroomlijnde workflow voor vervolgconsulten, gebaseerd op de SOEP-methodiek ("opnemen, stoppen, klaar").
* **AI-Gedreven Voorbereiding:** Genereert automatisch slimme, contextuele voorbereidingen voor zowel intakes als consulten op basis van de hoofdklacht.
* **Geavanceerde Spraak-naar-Tekst:** Maakt gebruik van de Groq API (Whisper Large v3 Turbo) voor snelle en accurate transcripties van consulten.
* **Intelligente Documentatie:** OpenAI's GPT-4o zet ruwe transcripties en notities om in perfect gestructureerde, professionele PHSB- en SOEP-rapporten.
* **Volledig Bewerkbaar & Exporteerbaar:** Alle door AI gegenereerde content is direct in de interface aan te passen en te exporteren naar professioneel opgemaakte PDF- en Word-documenten.
* **Hysio Assistant:** Een geïntegreerde AI-co-piloot voor directe kennis-ondersteuning tijdens elke sessie.

## 🛠️ Tech Stack

* **Framework:** Next.js 14 (App Router)
* **Taal:** TypeScript
* **Styling:** Tailwind CSS
* **UI Componenten:** Radix UI & Shadcn/ui
* **Spraak-naar-Tekst:** Groq API
* **AI & Logica:** OpenAI API (GPT-4o)

## 🚀 Installatie & Opstarten

Volg deze stappen om het project lokaal op te zetten:

1.  **Clone de repository:**
    ```bash
    git clone https://github.com/adamh9123/WorkingHysioMVP.git
    ```
2.  **Navigeer naar de projectmap:**
    ```bash
    cd WorkingHysioMVP
    ```
3.  **Installeer de dependencies:**
    ```bash
    npm install
    ```
4.  **Configureer je environment variabelen:**
    * Maak een kopie van `.env.example` en hernoem deze naar `.env.local`.
    * Vul je persoonlijke API-sleutels in voor `OPENAI_API_KEY` en `GROQ_API_KEY`.
5.  **Start de development server:**
    ```bash
    npm run dev
    ```
    De applicatie is nu beschikbaar op `http://localhost:3000` (of een andere poort als 3000 bezet is).

## 📄 Licentie

Dit project wordt uitgebracht onder een eigen licentie. Alle rechten voorbehouden.