// ================================
// AFRISHOP ADMIN — Produits
// ================================

const CATEGORY_LABELS = { tech: 'Tech', mode: 'Mode', beaute: 'Beauté', food: 'Food' };

let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!initAdminLayout('products')) return;
    await loadProducts();

    document.getElementById('filter-category').addEventListener('change', renderProducts);
    document.getElementById('filter-search').addEventListener('input', renderProducts);
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
});

async function loadProducts() {
    const container = document.getElementById('products-content');
    try {
        const data = await adminFetch('/products');
        if (!data.success) {
            container.innerHTML = `<div class="empty-state">Erreur de chargement des produits</div>`;
            return;
        }
        allProducts = data.products;
        renderProducts();
    } catch (err) {
        if (err.message !== 'Session expirée ou accès refusé') {
            container.innerHTML = `<div class="empty-state">Erreur de connexion au serveur</div>`;
        }
    }
}

function renderProducts() {
    const container = document.getElementById('products-content');
    const category = document.getElementById('filter-category').value;
    const search = document.getElementById('filter-search').value.trim().toLowerCase();

    let filtered = allProducts;
    if (category !== 'all') filtered = filtered.filter(p => p.category === category);
    if (search) filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(search));

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state">Aucun produit ne correspond</div>`;
        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th></th>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Prix</th>
                    <th>Stock</th>
                    <th>Badge</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(p => `
                    <tr>
                        <td style="font-size:20px;">${escapeHtml(p.emoji || '📦')}</td>
                        <td>${escapeHtml(p.name)}</td>
                        <td>${CATEGORY_LABELS[p.category] || escapeHtml(p.category)}</td>
                        <td>${formatFCFA(p.price)}</td>
                        <td>${p.stock <= 5 ? `<span class="badge badge-low-stock">${p.stock}</span>` : p.stock}</td>
                        <td>${escapeHtml(p.badge || '—')}</td>
                        <td style="white-space:nowrap;">
                            <button class="btn btn-secondary btn-sm" onclick="openProductModalById(${p.id})">Modifier</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Supprimer</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function openProductModalById(id) {
    const product = allProducts.find(p => p.id === id);
    openProductModal(product || null);
}

function openProductModal(product = null) {
    document.getElementById('product-modal-title').textContent = product ? 'Modifier le produit' : 'Ajouter un produit';
    document.getElementById('product-id').value = product ? product.id : '';
    document.getElementById('product-name').value = product ? product.name : '';
    document.getElementById('product-description').value = product ? (product.description || '') : '';
    document.getElementById('product-price').value = product ? product.price : '';
    document.getElementById('product-stock').value = product ? product.stock : 0;
    document.getElementById('product-category').value = product ? product.category : 'tech';
    document.getElementById('product-emoji').value = product ? (product.emoji || '') : '';
    document.getElementById('product-origin').value = product ? (product.origin || '') : '';
    document.getElementById('product-badge').value = product ? (product.badge || '') : '';
    document.getElementById('product-image').value = product ? (product.image || '') : '';

    document.getElementById('product-modal-overlay').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('product-modal-overlay').style.display = 'none';
}

async function handleProductSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('product-id').value;
    const payload = {
        name: document.getElementById('product-name').value.trim(),
        description: document.getElementById('product-description').value.trim(),
        price: document.getElementById('product-price').value,
        stock: document.getElementById('product-stock').value,
        category: document.getElementById('product-category').value,
        emoji: document.getElementById('product-emoji').value.trim(),
        origin: document.getElementById('product-origin').value.trim(),
        badge: document.getElementById('product-badge').value.trim(),
        image: document.getElementById('product-image').value.trim()
    };

    try {
        const data = await adminFetch(id ? `/products/${id}` : '/products', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });

        if (!data.success) {
            showNotif(data.message || 'Erreur lors de l\'enregistrement', true);
            return;
        }

        showNotif(id ? '✓ Produit modifié' : '✓ Produit ajouté');
        closeProductModal();
        await loadProducts();
    } catch (err) {
        if (err.message !== 'Session expirée ou accès refusé') {
            showNotif('Erreur de connexion au serveur', true);
        }
    }
}

async function deleteProduct(id) {
    const product = allProducts.find(p => p.id === id);
    const name = product ? product.name : `#${id}`;
    if (!confirm(`Supprimer « ${name} » ? Cette action est irréversible.`)) return;

    try {
        const data = await adminFetch(`/products/${id}`, { method: 'DELETE' });

        if (!data.success) {
            showNotif(data.message || 'Suppression impossible', true);
            return;
        }

        showNotif('✓ Produit supprimé');
        await loadProducts();
    } catch (err) {
        if (err.message !== 'Session expirée ou accès refusé') {
            showNotif('Erreur de connexion au serveur', true);
        }
    }
}
