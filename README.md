# Mantra Asta

Web app essenziale per gestire un'asta Fantacalcio Mantra. Legge i 12 fogli ruolo del Google Sheet e registra gli acquisti in una nuova scheda `Asta`.

## Pubblicazione su Vercel

1. Importa il repository `TSarca30/fanta-mantra` su Vercel (Framework preset: **Other**).
2. In **Settings → Environment Variables**, aggiungi:
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: il contenuto completo del file JSON del service account (oppure il suo Base64).
   - `SPREADSHEET_ID`: `1SSQTxpr4-TR8n6bk0mXyMvmu0hXSUd2W7revPjjDeXo`
3. Deploy. Il service account deve rimanere Editor del foglio, come già configurato.

La chiave non va mai inserita nel repository o nel browser: viene usata soltanto dalle API serverless Vercel.

## Funzioni

- ricerca immediata e scheda con commento/note;
- filtri per ruolo e ordinamento per prezzo, PMA, quotazione e nome;
- otto rose con budget residuo su base 500;
- assegnazione di un giocatore a un partecipante e rimozione automatica dai disponibili;
- storico acquisti salvato nel foglio `Asta`.

