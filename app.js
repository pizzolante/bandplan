// Variabili globali
let allBands = [];
let filteredBands = [];

// Carica i dati al caricamento della pagina
document.addEventListener('DOMContentLoaded', async () => {
    await loadBandData();
    populateFilters();
    updateStats();
    displayBands(allBands);
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
}

// Applica i filtri
function applyFilters() {
    const bandFilter = document.getElementById('bandFilter').value.toLowerCase();
    const usageFilter = document.getElementById('usageFilter').value.toLowerCase();
    const countryFilter = document.getElementById('countryFilter').value.toLowerCase();
    const searchText = document.getElementById('searchBox').value.toLowerCase();

    filteredBands = allBands.filter(band => {
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
    return `
        <div class="band-card">
            <div class="band-header">
                <div class="band-frequency">${band.frequency}</div>
                <span class="badge badge-${band.usage.toLowerCase()}">${band.usage}</span>
            </div>
            <div class="band-assignment">${band.assignment}</div>
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
                ${band.modes ? `
                <div class="detail-item">
                    <div class="detail-label">Modi</div>
                    <div class="detail-value">${band.modes.join(', ')}</div>
                </div>
                ` : ''}
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
