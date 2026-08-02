// ================================
// AFRISHOP ADMIN — Tableau de bord
// ================================

const STATUS_LABELS = {
    pending: 'En attente',
    processing: 'En préparation',
    transit: 'En transit',
    delivered: 'Livrée',
    cancelled: 'Annulée'
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!initAdminLayout('dashboard')) return;
    await loadDashboard();
});

async function loadDashboard() {
    const container = document.getElementById('dashboard-content');

    try {
        const data = await adminFetch('/admin/stats');

        if (!data.success) {
            container.innerHTML = `<div class="empty-state">Erreur de chargement des statistiques</div>`;
            return;
        }

        const s = data.stats;

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-label">Chiffre d'affaires</div>
                    <div class="stat-card-value gold">${formatFCFA(s.revenue)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-label">Commandes</div>
                    <div class="stat-card-value">${s.ordersCount}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-label">Produits</div>
                    <div class="stat-card-value">${s.productsCount}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-label">Clients inscrits</div>
                    <div class="stat-card-value">${s.usersCount}</div>
                </div>
            </div>

            <div class="panel">
                <div class="panel-title">Commandes par statut</div>
                <div class="stats-grid">
                    ${Object.keys(STATUS_LABELS).map(key => `
                        <div class="stat-card">
                            <div class="stat-card-label">${STATUS_LABELS[key]}</div>
                            <div class="stat-card-value">${s.statusBreakdown[key] || 0}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="panel">
                <div class="panel-title">Dernières commandes</div>
                <div class="table-scroll">
                    ${renderRecentOrdersTable(s.recentOrders)}
                </div>
            </div>

            <div class="panel">
                <div class="panel-title">Stock faible (≤ 5)</div>
                ${renderLowStock(s.lowStockProducts)}
            </div>
        `;
    } catch (err) {
        if (err.message !== 'Session expirée ou accès refusé') {
            container.innerHTML = `<div class="empty-state">Erreur de connexion au serveur</div>`;
        }
    }
}

function renderRecentOrdersTable(orders) {
    if (!orders || orders.length === 0) {
        return `<div class="empty-state">Aucune commande pour l'instant</div>`;
    }

    return `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Référence</th>
                    <th>Client</th>
                    <th>Total</th>
                    <th>Statut</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(o => `
                    <tr>
                        <td>${escapeHtml(o.reference)}</td>
                        <td>${escapeHtml(o.prenom)} ${escapeHtml(o.nom)}</td>
                        <td>${formatFCFA(o.total)}</td>
                        <td><span class="badge badge-${escapeHtml(o.status)}">${STATUS_LABELS[o.status] || o.status}</span></td>
                        <td>${formatDate(o.created_at)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderLowStock(products) {
    if (!products || products.length === 0) {
        return `<div class="empty-state">Aucun produit en stock faible 👍</div>`;
    }

    return `
        <table class="admin-table">
            <thead>
                <tr><th>Produit</th><th>Stock restant</th></tr>
            </thead>
            <tbody>
                ${products.map(p => `
                    <tr>
                        <td>${escapeHtml(p.name)}</td>
                        <td><span class="badge badge-low-stock">${p.stock}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
