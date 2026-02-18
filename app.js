// Variabili globali
let allBands = [];
let filteredBands = [];
let currentFrequencyKHz = null;

// Mappatura dei codici paese alle bandiere emoji
const countryFlags = {
    'IT': '🇮🇹', 'DE': '🇩🇪', 'FR': '🇫🇷', 'UK': '🇬🇧', 'GB': '🇬🇧',
    'ES': '🇪🇸', 'US': '🇺🇸', 'JP': '🇯🇵', 'AU': '🇦🇺', 'BR': '🇧🇷',
    'AR': '🇦🇷', 'ZA': '🇿🇦', 'CN': '🇨🇳'
};

// Ottieni la bandiera emoji per un codice paese
// Restituisce il codice paese stesso se la bandiera non è disponibile
function getCountryFlag(countryCode) {
    return countryFlags[countryCode.toUpperCase()] || countryCode;
}

/**
 * Calcola il numero di canale per frequenze canalizzate (CB, PMR, LPD)
 * @param {number} freqKHz - Frequenza in kHz
 * @param {Object} band - Oggetto banda
 * @returns {string|null} - Numero di canale formattato o null
 */
function getChannelNumber(freqKHz, band) {
    const freqMHz = freqKHz / 1000;
    
    // CB (Citizen Band) - 40 canali da 26.965 a 27.405 MHz
    if (band.band === 'CB (11m)') {
        // Canali CB AM/FM: CH1 = 26.965 MHz, spaziatura 10 kHz fino a CH40 = 27.405 MHz
        const cbStartMHz = 26.965;
        const cbStepMHz = 0.010; // 10 kHz
        const channel = Math.round((freqMHz - cbStartMHz) / cbStepMHz) + 1;
        if (channel >= 1 && channel <= 40) {
            return `Canale CB ${channel}`;
        }
    }
    
    // PMR446 - 16 canali da 446.00625 a 446.19375 MHz
    if (band.band === 'PMR446') {
        // Canali PMR: CH1 = 446.00625 MHz, spaziatura 12.5 kHz
        const pmrStartMHz = 446.00625;
        const pmrStepMHz = 0.0125; // 12.5 kHz
        const channel = Math.round((freqMHz - pmrStartMHz) / pmrStepMHz) + 1;
        if (channel >= 1 && channel <= 16) {
            return `Canale PMR ${channel}`;
        }
    }
    
    // LPD (Low Power Device) - 69 canali da 433.075 a 434.775 MHz
    if (band.band === '70cm ISM' && freqMHz >= 433.075 && freqMHz <= 434.775) {
        // Canali LPD: CH1 = 433.075 MHz, spaziatura 25 kHz
        const lpdStartMHz = 433.075;
        const lpdStepMHz = 0.025; // 25 kHz
        const channel = Math.round((freqMHz - lpdStartMHz) / lpdStepMHz) + 1;
        if (channel >= 1 && channel <= 69) {
            return `Canale LPD ${channel}`;
        }
    }
    
    return null;
}

/**
 * Determina lo stato di trasmissione per una banda
 * @param {Object} band - Oggetto banda con informazioni su trasmissione e uso
 * @returns {Object} Oggetto con: allowed (boolean/'license'/'unknown'), icon (emoji), text (string), class (string), reason (string)
 */
function getTransmissionStatus(band) {
    if (!band.transmission) {
        return {
            allowed: false,
            icon: '🔴',
            text: 'NO',
            class: 'forbidden',
            reason: 'Trasmissione non permessa. Solo ricezione.'
        };
    }
    
    const usage = band.usage.toLowerCase();
    
    if (usage === 'libero') {
        return {
            allowed: true,
            icon: '🟢',
            text: 'SI',
            class: 'allowed',
            reason: 'Trasmissione libera, nessuna licenza richiesta.'
        };
    } else if (usage === 'radioamatoriale') {
        return {
            allowed: 'license',
            icon: '🟡',
            text: 'SI con licenza',
            class: 'license-required',
            reason: 'Trasmissione permessa con licenza radioamatoriale valida.'
        };
    } else if (usage === 'licenziato') {
        return {
            allowed: 'license',
            icon: '🟡',
            text: 'SI con licenza',
            class: 'license-required',
            reason: band.notes || 'Richiede licenza specifica per la trasmissione.'
        };
    } else if (usage === 'riservato') {
        return {
            allowed: false,
            icon: '🔴',
            text: 'NO',
            class: 'forbidden',
            reason: 'Banda riservata ad uso professionale/militare. Solo ricezione per privati.'
        };
    }
    
    return {
        allowed: 'unknown',
        icon: '⚪',
        text: 'N/D',
        class: 'unknown',
        reason: 'Informazioni non disponibili.'
    };
}

// Carica i dati al caricamento della pagina
document.addEventListener('DOMContentLoaded', async () => {
    await loadBandData();
    populateFilters();
    handleURLRouting();
    updateStats();
    displayBands(filteredBands);
    setupEventListeners();
});

// Carica i dati dal file JSON
async function loadBandData() {
    try {
        const response = await fetch('bands.json');
        allBands = await response.json();
        filteredBands = [...allBands];
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        allBands = [];
        filteredBands = [];
    }
}

// Popola i filtri con le opzioni disponibili
function populateFilters() {
    // Estrai tutte le bande uniche
    const bands = new Set();
    const countries = new Set();
    
    allBands.forEach(band => {
        bands.add(band.band);
        if (band.countries) {
            band.countries.forEach(country => countries.add(country));
        }
    });

    // Popola il filtro delle bande
    const bandFilter = document.getElementById('bandFilter');
    Array.from(bands).sort().forEach(band => {
        const option = document.createElement('option');
        option.value = band;
        option.textContent = band;
        bandFilter.appendChild(option);
    });

    // Popola il filtro delle nazioni
    const countryFilter = document.getElementById('countryFilter');
    Array.from(countries).sort().forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });
}

// Configura gli event listeners
function setupEventListeners() {
    document.getElementById('bandFilter').addEventListener('change', applyFilters);
    document.getElementById('usageFilter').addEventListener('change', applyFilters);
    document.getElementById('countryFilter').addEventListener('change', applyFilters);
    document.getElementById('searchBox').addEventListener('input', applyFilters);
    
    // Input della frequenza
    const frequencyInput = document.getElementById('frequencyInput');
    frequencyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const freqKHz = parseInt(frequencyInput.value);
            if (!isNaN(freqKHz) && freqKHz >= 0 && freqKHz <= 3000000) {
                navigateToFrequency(freqKHz);
            }
        }
    });
    
    frequencyInput.addEventListener('blur', () => {
        const freqKHz = parseInt(frequencyInput.value);
        if (!isNaN(freqKHz) && freqKHz >= 0 && freqKHz <= 3000000) {
            navigateToFrequency(freqKHz);
        }
    });
    
    // Gestisce i cambiamenti di URL (back/forward del browser)
    window.addEventListener('popstate', handleURLRouting);
    window.addEventListener('hashchange', handleURLRouting);
}

// Gestisce il routing basato su URL
function handleURLRouting() {
    // Supporta sia path-based (/27255) che hash-based (#27255) routing per compatibilità
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    // Rimuovi il base path per GitHub Pages se presente
    const basePath = '/bandplan';
    let cleanPath = path;
    if (path.startsWith(basePath)) {
        cleanPath = path.substring(basePath.length);
    }
    
    let frequencyMatch = cleanPath.match(/\/(\d+)$/);
    if (!frequencyMatch && hash) {
        frequencyMatch = hash.match(/#(\d+)$/);
    }
    
    if (frequencyMatch) {
        const freqKHz = parseInt(frequencyMatch[1]);
        if (freqKHz >= 0 && freqKHz <= 3000000) { // 0 Hz a 3 GHz
            currentFrequencyKHz = freqKHz;
            filterByFrequency(freqKHz);
            updatePageMetadata(freqKHz);
        } else {
            currentFrequencyKHz = null;
            filteredBands = [...allBands];
            resetPageMetadata();
        }
    } else {
        currentFrequencyKHz = null;
        filteredBands = [...allBands];
        resetPageMetadata();
    }
}

// Aggiorna i metadati della pagina per una frequenza specifica
function updatePageMetadata(freqKHz) {
    const formattedFreq = formatFrequency(freqKHz);
    const freqMHz = (freqKHz / 1000).toFixed(3);
    document.title = `${formattedFreq} - Posso trasmettere? | Bandplan.it`;
    
    // Aggiorna o crea meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = `${formattedFreq}: scopri se puoi trasmettere in Italia, le licenze richieste e le restrizioni.`;
}

// Ripristina i metadati della pagina
function resetPageMetadata() {
    document.title = 'Bandplan.it - Piano di Frequenze Radioamatoriali';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.content = 'Piano di Frequenze Radioamatoriali interattivo per l\'Italia e il mondo. Trova informazioni su bande, frequenze, licenze e possibilità di trasmissione.';
    }
}

// Filtra le bande per una frequenza specifica
function filterByFrequency(freqKHz) {
    filteredBands = allBands.filter(band => {
        const range = parseFrequencyRange(band.frequency);
        if (range) {
            const freqMHz = freqKHz / 1000;
            return freqMHz >= range.min && freqMHz <= range.max;
        }
        return false;
    });
}

// Parsea un range di frequenze (es. "14.0 - 14.35 MHz")
function parseFrequencyRange(freqString) {
    const patterns = [
        // Pattern per MHz (es. "14.0 - 14.35 MHz")
        /(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*MHz/i,
        // Pattern per GHz (es. "2.4 - 2.5 GHz")
        /(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*GHz/i
    ];
    
    for (let pattern of patterns) {
        const match = freqString.match(pattern);
        if (match) {
            let min = parseFloat(match[1]);
            let max = parseFloat(match[2]);
            
            // Converti GHz in MHz se necessario
            if (freqString.toLowerCase().includes('ghz')) {
                min *= 1000;
                max *= 1000;
            }
            
            return { min, max };
        }
    }
    return null;
}

// Formatta una frequenza in kHz in formato leggibile
function formatFrequency(freqKHz) {
    if (freqKHz >= 1000000) {
        const ghz = freqKHz / 1000000;
        return `${ghz.toFixed(3)} GHz`;
    } else if (freqKHz >= 1000) {
        const mhz = freqKHz / 1000;
        return `${mhz.toFixed(3)} MHz`;
    } else {
        return `${freqKHz} kHz`;
    }
}

// Naviga a una frequenza specifica
function navigateToFrequency(freqKHz) {
    // Usa path-based routing per migliorare l'indicizzazione
    const newURL = `/${freqKHz}`;
    window.history.pushState({frequency: freqKHz}, '', newURL);
    currentFrequencyKHz = freqKHz;
    filterByFrequency(freqKHz);
    updateStats();
    displayBands(filteredBands);
    updatePageMetadata(freqKHz);
}

// Applica i filtri
function applyFilters() {
    const bandFilter = document.getElementById('bandFilter').value.toLowerCase();
    const usageFilter = document.getElementById('usageFilter').value.toLowerCase();
    const countryFilter = document.getElementById('countryFilter').value.toLowerCase();
    const searchText = document.getElementById('searchBox').value.toLowerCase();

    // Se c'è una frequenza specifica, parti da quella selezione
    let bandsToFilter = currentFrequencyKHz !== null 
        ? allBands.filter(band => {
            const range = parseFrequencyRange(band.frequency);
            if (range) {
                const freqMHz = currentFrequencyKHz / 1000;
                return freqMHz >= range.min && freqMHz <= range.max;
            }
            return false;
          })
        : [...allBands];

    filteredBands = bandsToFilter.filter(band => {
        // Filtro banda
        if (bandFilter && band.band.toLowerCase() !== bandFilter) {
            return false;
        }

        // Filtro tipo di uso
        if (usageFilter && band.usage.toLowerCase() !== usageFilter) {
            return false;
        }

        // Filtro nazione
        if (countryFilter && band.countries && 
            !band.countries.some(c => c.toLowerCase() === countryFilter)) {
            return false;
        }

        // Filtro ricerca testuale
        if (searchText) {
            const searchableText = `
                ${band.frequency} 
                ${band.assignment} 
                ${band.band} 
                ${band.usage}
            `.toLowerCase();
            
            if (!searchableText.includes(searchText)) {
                return false;
            }
        }

        return true;
    });

    displayBands(filteredBands);
    updateStats();
}

// Visualizza le bande
function displayBands(bands) {
    const bandList = document.getElementById('bandList');
    
    if (bands.length === 0) {
        bandList.innerHTML = `
            <div class="no-results">
                <p>Nessuna banda trovata</p>
                <small>Prova a modificare i filtri di ricerca</small>
            </div>
        `;
        return;
    }

    bandList.innerHTML = bands.map(band => createBandCard(band)).join('');
}

// Crea una card per la banda
function createBandCard(band) {
    // Determina i modi da mostrare
    let modesToShow = band.modes || [];
    let modeNote = '';
    
    // Se c'è una frequenza specifica, mostra solo i modi per quella frequenza
    if (currentFrequencyKHz !== null && band.segments) {
        const freqMHz = currentFrequencyKHz / 1000;
        const segment = band.segments.find(seg => {
            const segStartMHz = seg.start / 1000;
            const segEndMHz = seg.end / 1000;
            return freqMHz >= segStartMHz && freqMHz <= segEndMHz;
        });
        
        if (segment) {
            modesToShow = segment.modes || [];
            if (segment.note) {
                modeNote = ` (${segment.note})`;
            }
        }
    }
    
    // Ottieni lo stato di trasmissione
    const transmissionStatus = getTransmissionStatus(band);
    
    // Calcola il numero di canale se applicabile
    const channelNumber = currentFrequencyKHz !== null ? getChannelNumber(currentFrequencyKHz, band) : null;
    
    // Genera pulsanti prev/next per navigazione frequenze
    const prevNextButtons = currentFrequencyKHz !== null ? `
        <div class="frequency-navigation">
            <button class="nav-button prev-button" onclick="navigateToFrequency(${currentFrequencyKHz - 1})">
                ← ${formatFrequency(currentFrequencyKHz - 1)}
            </button>
            <button class="nav-button next-button" onclick="navigateToFrequency(${currentFrequencyKHz + 1})">
                ${formatFrequency(currentFrequencyKHz + 1)} →
            </button>
        </div>
    ` : '';
    
    // Genera HTML per la frequenza specifica
    const frequencyPageHTML = currentFrequencyKHz !== null ? `
        <div class="frequency-page-header">
            <h2>Frequenza ${formatFrequency(currentFrequencyKHz)}</h2>
            ${channelNumber ? `<div class="channel-info">${channelNumber}</div>` : ''}
            <div class="transmission-status ${transmissionStatus.class}">
                <div class="status-question">
                    <h3>Posso trasmettere a ${formatFrequency(currentFrequencyKHz)}?</h3>
                </div>
                <div class="status-answer">
                    <span class="status-icon">${transmissionStatus.icon}</span>
                    <span class="status-text">${transmissionStatus.text}</span>
                </div>
                <div class="status-reason">
                    ${transmissionStatus.reason}
                </div>
            </div>
            ${prevNextButtons}
        </div>
    ` : '';
    
    return `
        <div class="band-card">
            ${frequencyPageHTML}
            <div class="band-header">
                <div class="band-frequency">${band.frequency}</div>
                <span class="badge badge-${band.usage.toLowerCase()}">${band.usage}</span>
            </div>
            <div class="band-assignment">${band.assignment}</div>
            ${currentFrequencyKHz !== null ? `
            <div class="specific-frequency-info">
                <strong>Banda:</strong> ${band.band}
            </div>
            ` : ''}
            <div class="band-details">
                <div class="detail-item">
                    <div class="detail-label">Banda</div>
                    <div class="detail-value">${band.band}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Trasmissione</div>
                    <div class="detail-value">${band.transmission ? '✅ Permessa' : '❌ Non permessa'}</div>
                </div>
                ${band.power ? `
                <div class="detail-item">
                    <div class="detail-label">Potenza massima</div>
                    <div class="detail-value">${band.power}</div>
                </div>
                ` : ''}
                ${modesToShow && modesToShow.length > 0 ? `
                <div class="detail-item">
                    <div class="detail-label">${currentFrequencyKHz !== null ? 'Modi ammessi su questa frequenza' : 'Modi'}</div>
                    <div class="detail-value modes-display">${modesToShow.join(', ')}${modeNote}</div>
                </div>
                ` : ''}
            </div>
            ${band.countries && band.countries.length > 0 ? `
            <div class="band-details">
                <div class="detail-item">
                    <div class="detail-label">Nazioni${currentFrequencyKHz === null ? ' (uso radioamatoriale)' : ''}</div>
                    <div class="countries">
                        ${band.countries.map(country => `
                            <span class="country-tag">
                                ${getCountryFlag(country)} ${country}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
            ` : ''}
            ${band.notes ? `
            <div class="band-details">
                <div class="detail-item">
                    <div class="detail-label">Note</div>
                    <div class="detail-value">${band.notes}</div>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// Aggiorna le statistiche
function updateStats() {
    // Mostra la frequenza corrente se impostata
    const currentFreqCard = document.getElementById('currentFreqCard');
    const currentFreqDisplay = document.getElementById('currentFreqDisplay');
    
    if (currentFrequencyKHz !== null) {
        currentFreqCard.style.display = 'block';
        currentFreqDisplay.textContent = formatFrequency(currentFrequencyKHz);
    } else {
        currentFreqCard.style.display = 'none';
    }
    
    document.getElementById('totalBands').textContent = filteredBands.length;
    
    const amateurBands = filteredBands.filter(b => 
        b.usage.toLowerCase() === 'radioamatoriale'
    ).length;
    document.getElementById('amateurBands').textContent = amateurBands;
    
    const freeBands = filteredBands.filter(b => 
        b.usage.toLowerCase() === 'libero'
    ).length;
    document.getElementById('freeBands').textContent = freeBands;
}
