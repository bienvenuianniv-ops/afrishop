// ================================
// AFRISHOP — Page Détail Produit JS
// ================================

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://afrishop-backend-q1fr.onrender.com/api';

let qty = 1;
let currentProduct = null;

// ================================
// CHARGER LE PRODUIT DEPUIS L'API
// ================================
async function loadProduct() {
    const id = parseInt(localStorage.getItem('afrishop_product')) || 1;

    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        const data = await response.json();

        if (data.success) {
            currentProduct = data.product;
            // Ajouter cat pour compatibilité
            currentProduct.cat = currentProduct.category;
            displayProduct();
        } else {
            window.location.href = 'product.html';
        }
    } catch (err) {
        console.error('Erreur API:', err);
        window.location.href = 'product.html';
    }
}

// ================================
// AFFICHER LE PRODUIT
// ================================
function displayProduct() {
    if (!currentProduct) return;

    document.getElementById('detail-name').textContent = currentProduct.name;
    document.getElementById('detail-origin').textContent = currentProduct.origin;
    document.getElementById('detail-price').textContent =
    convertPrice(parseInt(currentProduct.price));
    document.getElementById('detail-badge').textContent = currentProduct.badge;
    document.getElementById('breadcrumb-name').textContent = currentProduct.name;
    document.getElementById('main-img').textContent = currentProduct.emoji;
    document.getElementById('spec-origin').textContent = currentProduct.origin;
    document.getElementById('spec-cat').textContent = currentProduct.category;

    // Titre de la page
    document.title = `AfriShop — ${currentProduct.name}`;

    // Description selon catégorie
    const descs = {
        tech: `Produit tech de haute qualité sélectionné par AfriShop.
               Testé et approuvé par notre équipe.`,
        mode: `Pièce unique fabriquée avec soin par nos artisans.
               Style africain authentique allié au design contemporain.`,
        beaute: `Produit naturel et authentique pour prendre soin de vous.
                 Fabriqué à partir d'ingrédients naturels africains.`,
        food: `Produit alimentaire 100% naturel en provenance directe
               des meilleures régions du Sénégal.`
    };

    document.getElementById('detail-desc').textContent =
        descs[currentProduct.category] || 'Produit de qualité sélectionné par AfriShop.';

    // Thumbnails
    document.querySelectorAll('.thumb').forEach(t => {
        t.textContent = currentProduct.emoji;
    });

    // Produits similaires
    loadRelated();
}

// ================================
// PRODUITS SIMILAIRES
// ================================
async function loadRelated() {
    try {
        const response = await fetch(`${API_URL}/products?category=${currentProduct.category}`);
        const data = await response.json();

        if (data.success) {
            const related = data.products
                .filter(p => p.id !== currentProduct.id)
                .slice(0, 4);

            const grid = document.getElementById('related-grid');
            if (!grid) return;

            if (related.length === 0) {
                grid.innerHTML = '<p style="color:#888;font-size:13px">Aucun produit similaire</p>';
                return;
            }

            grid.innerHTML = related.map(p => `
                <div class="product-card" onclick="goToProduct(${p.id})">
                    <div class="product-img">${escapeHtml(p.emoji)}</div>
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
    } catch (err) {
        console.error('Erreur produits similaires:', err);
    }
}

// ================================
// NAVIGATION PRODUIT
// ================================
function goToProduct(id) {
    localStorage.setItem('afrishop_product', id);
    window.location.reload();
}

// ================================
// IMAGE PRINCIPALE
// ================================
function setImg(el, emoji) {
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('main-img').textContent = emoji;
}

// ================================
// TAILLE
// ================================
function selectSize(el) {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
}

// ================================
// QUANTITE
// ================================
function changeQty(delta) {
    qty = Math.max(1, Math.min(10, qty + delta));
    document.getElementById('qty-val').textContent = qty;
}

// ================================
// AJOUTER AU PANIER
// ================================
function addToCartDetail() {
    if (!currentProduct) return;
    const added = addToCart(currentProduct.id, qty, { productData: currentProduct, silent: true });
    showNotif(added
        ? `✓ ${qty}x ${currentProduct.name} ajouté au panier !`
        : `⚠️ Impossible d'ajouter ${currentProduct.name} au panier`);
}

// ================================
// FAVORIS
// ================================
function addToWish() {
    if (!currentProduct) return;
    showNotif(`❤️ ${currentProduct.name} ajouté aux favoris !`);
}

// ================================
// TABS
// ================================
function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

    const tabs = ['desc', 'specs', 'reviews'];
    document.querySelectorAll('.tab')[tabs.indexOf(tab)].classList.add('active');
    document.getElementById('tab-' + tab).style.display = 'block';
}

// ================================
// INITIALISATION
// ================================
document.addEventListener('DOMContentLoaded', () => {
    loadProduct();
    updateCartCount();
});