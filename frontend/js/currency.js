// ================================
// AFRISHOP — Gestion des devises
// ================================

// Taux de conversion depuis FCFA
const CURRENCY_RATES = {
    XOF: { rate: 1,        symbol: 'F',  name: 'Franc CFA',        flag: '🇸🇳' },
    EUR: { rate: 0.00152,  symbol: '€',  name: 'Euro',             flag: '🇪🇺' },
    USD: { rate: 0.00166,  symbol: '$',  name: 'Dollar US',        flag: '🇺🇸' },
    GBP: { rate: 0.00130,  symbol: '£',  name: 'Livre Sterling',   flag: '🇬🇧' },
    CAD: { rate: 0.00225,  symbol: 'CA$',name: 'Dollar Canadien',  flag: '🇨🇦' },
    CHF: { rate: 0.00148,  symbol: 'CHF',name: 'Franc Suisse',     flag: '🇨🇭' },
    MAD: { rate: 0.01650,  symbol: 'DH', name: 'Dirham Marocain',  flag: '🇲🇦' },
    GNF: { rate: 14.30,    symbol: 'GF', name: 'Franc Guinéen',    flag: '🇬🇳' },
};

// Devise actuelle
let currentCurrency = localStorage.getItem('afrishop_currency') || 'XOF';

// ================================
// CONVERTIR UN PRIX
// ================================
function convertPrice(priceInFCFA) {
    const currency = CURRENCY_RATES[currentCurrency];
    if (!currency) return priceInFCFA + ' F';

    const converted = priceInFCFA * currency.rate;

    // Formater selon la devise
    if (currentCurrency === 'XOF' || currentCurrency === 'GNF') {
        return Math.round(converted).toLocaleString() + ' ' + currency.symbol;
    } else {
        return currency.symbol + ' ' + converted.toFixed(2);
    }
}

// ================================
// CHANGER LA DEVISE
// ================================
function changeCurrency(code) {
    currentCurrency = code;
    localStorage.setItem('afrishop_currency', code);

    // Mettre à jour l'affichage
    updateCurrencyDisplay();

    // Recharger les prix
    if (typeof renderProductsHome === 'function') renderProductsHome();
    if (typeof renderProducts === 'function' && typeof currentProducts !== 'undefined') {
        renderProducts(currentProducts);
    }

    showNotif('💱 Devise changée : ' + CURRENCY_RATES[code].flag + ' ' + CURRENCY_RATES[code].name);
    closeCurrencyMenu();
}

// ================================
// AFFICHER LE MENU DEVISE
// ================================
function updateCurrencyDisplay() {
    const currency = CURRENCY_RATES[currentCurrency];
    const btn = document.getElementById('currency-btn');
    if (btn) {
        btn.textContent = currency.flag + ' ' + currentCurrency;
    }
}

function toggleCurrencyMenu() {
    const menu = document.getElementById('currency-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

function closeCurrencyMenu() {
    const menu = document.getElementById('currency-menu');
    if (menu) menu.style.display = 'none';
}

// ================================
// CRÉER LE SÉLECTEUR DE DEVISE
// ================================
function createCurrencySelector() {
    const selector = document.createElement('div');
    selector.className = 'currency-selector';
    selector.innerHTML = `
        <button class="currency-btn" id="currency-btn" onclick="toggleCurrencyMenu()">
            🇸🇳 XOF
        </button>
        <div class="currency-menu" id="currency-menu" style="display:none">
            ${Object.entries(CURRENCY_RATES).map(([code, curr]) => `
                <div class="currency-option ${code === currentCurrency ? 'active' : ''}"
                     onclick="changeCurrency('${code}')">
                    <span>${curr.flag}</span>
                    <span class="currency-code">${code}</span>
                    <span class="currency-name">${curr.name}</span>
                </div>
            `).join('')}
        </div>
    `;

    // Fermer le menu en cliquant ailleurs
    document.addEventListener('click', (e) => {
        if (!selector.contains(e.target)) {
            closeCurrencyMenu();
        }
    });

    return selector;
}

// ================================
// DÉTECTER LE PAYS AUTOMATIQUEMENT
// ================================
async function detectCountry() {
    // Si devise déjà sauvegardée, on l'utilise
    if (localStorage.getItem('afrishop_currency')) {
        updateCurrencyDisplay();
        return;
    }

    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        const countryToCurrency = {
            'FR': 'EUR', 'DE': 'EUR', 'IT': 'EUR', 'ES': 'EUR',
            'BE': 'EUR', 'NL': 'EUR', 'PT': 'EUR', 'AT': 'EUR',
            'US': 'USD', 'CA': 'CAD', 'GB': 'GBP',
            'CH': 'CHF', 'MA': 'MAD', 'GN': 'GNF',
            'SN': 'XOF', 'CI': 'XOF', 'ML': 'XOF',
            'BF': 'XOF', 'TG': 'XOF', 'BJ': 'XOF',
        };

        const detectedCurrency = countryToCurrency[data.country_code] || 'XOF';
        currentCurrency = detectedCurrency;
        localStorage.setItem('afrishop_currency', detectedCurrency);
        updateCurrencyDisplay();

        if (detectedCurrency !== 'XOF') {
            showNotif('💱 Devise détectée : ' + CURRENCY_RATES[detectedCurrency].flag + ' ' + CURRENCY_RATES[detectedCurrency].name);
        }
    } catch (err) {
        console.log('Détection pays impossible — FCFA par défaut');
        updateCurrencyDisplay();
    }
}

// ================================
// INITIALISATION
// ================================
document.addEventListener('DOMContentLoaded', () => {
    // Ajouter le sélecteur dans la navbar
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        const selector = createCurrencySelector();
        navActions.insertBefore(selector, navActions.firstChild);
        updateCurrencyDisplay();
    }

    // Détecter le pays automatiquement
    detectCountry();
});