// ================================
// AFRISHOP — Page Produits JS
// ================================

const API_URL = 'http://localhost:3000/api';

let searchTerm = '';
let maxPrice = 50000;
let currentProducts = [];

// ================================
// CHARGER PRODUITS DEPUIS L'API
// ================================
async function loadProductsFromAPI() {
    try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (maxPrice < 50000) params.append('maxPrice', maxPrice);

        const response = await fetch(`${API_URL}/products?${params}`);
        const data = await response.json();

        if (data.success) {
            currentProducts = data.products;
            renderProducts(currentProducts);
        }
    } catch (err) {
        console.error('Erreur API:', err);
        showNotif('⚠️ Erreur de connexion au serveur');
    }
}

// ================================
// AFFICHER LES PRODUITS
// ================================
function renderProducts(list) {
    const grid = document.getElementById('products-grid');
    const count = document.getElementById('result-count');

    if (!grid) return;

    if (count) count.textContent = list.length + ' produit(s) trouvé(s)';

    if (list.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:#888">
                <div style="font-size:48px; margin-bottom:16px">🔍</div>
                <p style="font-size:16px">Aucun produit trouvé</p>
            </div>`;
        return;
    }

    grid.innerHTML = list.map(p => `
        <div class="product-card" onclick="goToProduct(${p.id})">
            <div class="product-img">
    ${p.image
        ? `<img src="images/${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" onerror="this.parentElement.textContent='${escapeHtml(p.emoji)}'">`
        : escapeHtml(p.emoji)
    }
</div>
            <div class="product-info">
                <div class="product-name">${escapeHtml(p.name)}</div>
                <div class="product-origin">${escapeHtml(p.origin)}</div>
                <div class="product-footer">
                    <span class="product-price">${convertPrice(parseInt(p.price))}</span>
                    <button class="btn-add" onclick="event.stopPropagation(); addToCart(${p.id})">+</button>
                </div>
                <span class="product-badge">${escapeHtml(p.badge)}</span>
            </div>
        </div>
    `).join('');
}

// ================================
// ALLER A LA PAGE PRODUIT
// ================================
function goToProduct(id) {
    localStorage.setItem('afrishop_product', id);
    window.location.href = 'product-detail.html';
}

// ================================
// RECHERCHE
// ================================
function searchProducts(val) {
    searchTerm = val.toLowerCase();
    loadProductsFromAPI();
}

// ================================
// FILTRES
// ================================
function applyFilters() {
    const checkedCats = [...document.querySelectorAll('[data-filter="cat"]:checked')]
        .map(e => e.value);

    let filtered = currentProducts.filter(p => {
        const cat = p.category || p.cat;
        const matchCat = checkedCats.length === 0 || checkedCats.includes(cat);
        const matchPrice = parseInt(p.price) <= maxPrice;
        const matchSearch = !searchTerm ||
            p.name.toLowerCase().includes(searchTerm) ||
            p.badge.toLowerCase().includes(searchTerm);
        return matchCat && matchPrice && matchSearch;
    });

    renderProducts(filtered);
}

// ================================
// FILTRE PAR CATEGORIE
// ================================
function filterProducts(cat) {
    if (cat === 'all') {
        renderProducts(currentProducts);
    } else {
        const filtered = currentProducts.filter(p =>
            (p.category || p.cat) === cat
        );
        renderProducts(filtered);
    }
}

// ================================
// PRIX
// ================================
function updatePrice(val) {
    maxPrice = parseInt(val);
    document.getElementById('price-max-label').textContent =
        parseInt(val).toLocaleString() + ' F';
    applyFilters();
}

// ================================
// TRI
// ================================
function sortProducts(val) {
    let sorted = [...currentProducts];
    if (val === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (val === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    renderProducts(sorted);
}

// ================================
// RESET FILTRES
// ================================
function resetFilters() {
    document.querySelectorAll('input[type="checkbox"]').forEach(e => e.checked = false);
    document.getElementById('price-slider').value = 50000;
    document.getElementById('price-max-label').textContent = '50 000 F';
    document.getElementById('search-input').value = '';
    searchTerm = '';
    maxPrice = 50000;
    renderProducts(currentProducts);
}

// ================================
// INITIALISATION
// ================================
document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromAPI();
    updateCartCount();
});