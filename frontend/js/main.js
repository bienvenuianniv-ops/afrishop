// ================================
// AFRISHOP — Main JavaScript
// ================================

// URL de l'API
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://afrishop-backend-q1fr.onrender.com/api';

// ================================
// ÉCHAPPEMENT HTML (anti-XSS)
// ================================
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ================================
// DONNÉES PRODUITS
// ================================
let products = [];

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();

        if (data.success) {
            products = data.products;
            renderProductsHome();
        }
    } catch (err) {
        console.error('Erreur chargement produits:', err);
        products = [
            { id: 1, name: "Écouteurs sans fil", cat: "tech", category: "tech", price: 12500, origin: "Import tendance", emoji: "🎧", badge: "Populaire", image: "ecouteurs-1.jpg" },
            { id: 2, name: "Montre connectée", cat: "tech", category: "tech", price: 35000, origin: "Import", emoji: "⌚", badge: "Promo", image: "montre-1.jpg" },
            { id: 3, name: "Chargeur rapide", cat: "tech", category: "tech", price: 7500, origin: "Import", emoji: "🔌", badge: "Nouveau", image: null },
            { id: 4, name: "T-shirt wax print", cat: "mode", category: "mode", price: 9000, origin: "Artisan Dakar", emoji: "👕", badge: "Local", image: null },
            { id: 5, name: "Coque iPhone wax", cat: "mode", category: "mode", price: 3500, origin: "Artisan Dakar", emoji: "📱", badge: "Local", image: null },
            { id: 6, name: "Sneakers vintage", cat: "mode", category: "mode", price: 22000, origin: "Import", emoji: "👟", badge: "Tendance", image: null },
            { id: 7, name: "Sac tissé africain", cat: "mode", category: "mode", price: 15000, origin: "Dakar", emoji: "👜", badge: "Artisan", image: null },
            { id: 8, name: "Huile de baobab", cat: "beaute", category: "beaute", price: 8000, origin: "Sénégal", emoji: "🧴", badge: "Bio", image: null },
            { id: 9, name: "Savon karité", cat: "beaute", category: "beaute", price: 1500, origin: "Sénégal", emoji: "🧼", badge: "Bio", image: null },
            { id: 10, name: "Bissap séché", cat: "food", category: "food", price: 2500, origin: "Casamance", emoji: "🌺", badge: "Naturel", image: null },
            { id: 11, name: "Épices thiéboudienne", cat: "food", category: "food", price: 3500, origin: "Sénégal", emoji: "🌶️", badge: "Local", image: null },
        ];
        renderProductsHome();
    }
}
// ================================
// PANIER
// ================================
let cart = JSON.parse(localStorage.getItem('afrishop_cart')) || [];

function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (!countEl) return;
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    countEl.textContent = count;
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('afrishop_cart', JSON.stringify(cart));
    updateCartCount();
    showNotif(`✓ ${product.name} ajouté au panier !`);
}

// ================================
// AFFICHER PRODUITS (index.html)
// ================================
function renderProductsHome(filter = 'all') {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    const filtered = filter === 'all'
        ? products
        : products.filter(p => (p.category || p.cat) === filter);

    grid.innerHTML = filtered.map(p => `
        <div class="product-card">
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
                    <button class="btn-add" onclick="addToCart(${p.id})">+</button>
                </div>
                <span class="product-badge">${escapeHtml(p.badge)}</span>
            </div>
        </div>
    `).join('');
}

// ================================
// FILTRER PAR CATEGORIE (index.html)
// ================================
function filterProducts(cat) {
    const isHomePage = document.querySelector('.products');
    if (isHomePage) {
        renderProductsHome(cat);
        document.querySelector('.products').scrollIntoView({ behavior: 'smooth' });
    }
}

// ================================
// NOTIFICATION
// ================================
function showNotif(message) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #1A1A1A;
        color: #C9A84C;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 13px;
        border: 1px solid #C9A84C;
        z-index: 9999;
        white-space: nowrap;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);
}

// ================================
// INITIALISATION
// ================================
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartCount();
    console.log('✅ AfriShop Frontend chargé !');
});