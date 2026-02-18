// Variabili globali
let allBands = [];
let filteredBands = [];
let currentFrequencyKHz = null;

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
}

// Gestisce il routing basato su URL
function handleURLRouting() {
    const path = window.location.pathname;
    const frequencyMatch = path.match(/\/(\d+)$/);
    
    if (frequencyMatch) {
        const freqKHz = parseInt(frequencyMatch[1]);
        if (freqKHz >= 0 && freqKHz <= 3000000) { // 0 Hz a 3 GHz
            currentFrequencyKHz = freqKHz;
            filterByFrequency(freqKHz);
        } else {
            currentFrequencyKHz = null;
            filteredBands = [...allBands];
        }
    } else {
        currentFrequencyKHz = null;
        filteredBands = [...allBands];
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
    const newURL = `/${freqKHz}`;
    window.history.pushState({ frequency: freqKHz }, '', newURL);
    currentFrequencyKHz = freqKHz;
    filterByFrequency(freqKHz);
    updateStats();
    displayBands(filteredBands);
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
    let modesToShow = band.modes;
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
            modesToShow = segment.modes;
            if (segment.note) {
                modeNote = ` (${segment.note})`;
            }
        }
    }
    
    return `
        <div class="band-card">
            <div class="band-header">
                <div class="band-frequency">${band.frequency}</div>
                <span class="badge badge-${band.usage.toLowerCase()}">${band.usage}</span>
            </div>
            <div class="band-assignment">${band.assignment}</div>
            ${currentFrequencyKHz !== null ? `
            <div class="specific-frequency-info">
                <strong>Frequenza selezionata:</strong> ${formatFrequency(currentFrequencyKHz)}
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
                <div class="detail-item">
                    <div class="detail-label">${currentFrequencyKHz !== null ? 'Modi ammessi su questa frequenza' : 'Modi'}</div>
                    <div class="detail-value modes-display">${modesToShow.join(', ')}${modeNote}</div>
                </div>
            </div>
            ${band.countries && band.countries.length > 0 ? `
            <div class="band-details">
                <div class="detail-item">
                    <div class="detail-label">Nazioni (uso radioamatoriale)</div>
                    <div class="countries">
                        ${band.countries.map(country => `<span class="country-tag">${country}</span>`).join('')}
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
