# 🎙️ Bandplan.it

Piano di Frequenze Radioamatoriali interattivo per l'Italia e il mondo.

## 🚀 Descrizione

Bandplan.it è un'applicazione web statica che fornisce informazioni dettagliate sulle bande di frequenza radio, con particolare attenzione all'uso radioamatoriale.

## ✨ Funzionalità

- **Database completo** di bande di frequenza con informazioni dettagliate
- **Filtri avanzati** per banda, tipo di uso e nazione
- **Ricerca testuale** per trovare rapidamente frequenze specifiche
- **Informazioni dettagliate** su:
  - Assegnazione della banda
  - Tipo di utilizzo (radioamatoriale, libero, licenziato, riservato)
  - Possibilità di trasmissione
  - Potenze massime consentite
  - Nazioni in cui è permesso l'uso radioamatoriale
  - Modi di trasmissione disponibili
  - Note aggiuntive
- **Design moderno e responsive** ottimizzato per desktop e mobile
- **Statistiche in tempo reale** sul numero di bande filtrate

## 🛠️ Tecnologie

- HTML5
- CSS3 (con variabili CSS e gradients)
- JavaScript vanilla (ES6+)
- JSON per i dati

## 📦 Installazione locale

```bash
# Clona il repository
git clone https://github.com/pizzolante/bandplan.git

# Entra nella directory
cd bandplan

# Apri index.html nel browser
# Oppure usa un server locale, ad esempio:
python3 -m http.server 8000
# Poi apri http://localhost:8000
```

## 🌐 Sito Web

Il sito è disponibile all'indirizzo:
https://bandplan.it/

E anche su GitHub Pages:
https://pizzolante.github.io/bandplan/

## 📝 Struttura dati

I dati delle bande sono memorizzati in `bands.json` con la seguente struttura:

```json
{
  "frequency": "14.0 - 14.35 MHz",
  "band": "20m",
  "assignment": "Radioamatori",
  "usage": "Radioamatoriale",
  "transmission": true,
  "power": "100W ERP (IT)",
  "modes": ["CW", "SSB", "Digital", "AM"],
  "countries": ["IT", "DE", "FR", "UK", "ES", "US"],
  "notes": "La banda DX per eccellenza..."
}
```

## 🤝 Contribuire

Per aggiungere nuove bande o correggere informazioni:

1. Modifica il file `bands.json`
2. Assicurati che i dati seguano la struttura esistente
3. Testa le modifiche localmente
4. Invia una pull request

## ⚠️ Disclaimer

Le informazioni fornite sono a scopo informativo. È sempre necessario verificare le normative locali vigenti prima di utilizzare qualsiasi frequenza radio. Le potenze e i permessi possono variare da nazione a nazione.

## 📄 Licenza

Questo progetto è open source e disponibile sotto licenza MIT.

## 📧 Contatti

Per domande o suggerimenti, apri una issue su GitHub.