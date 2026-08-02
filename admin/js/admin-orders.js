// ================================
// AFRISHOP ADMIN — Commandes
// ================================

const ORDER_STATUS_LABELS = {
    pending: 'En attente',
    processing: 'En préparation',
    transit: 'En transit',
    delivered: 'Livrée',
    cancelled: 'Annulée'
};

let allOrders = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!initAdminLayout('orders')) return;
    await loadOrders();

    document.getElementById('filter-status').addEventListener('change', renderOrders);
    document.getElementById('filter-search').addEventListener('input', renderOrders);
});

async function loadOrders() {
    const container = document.getElementById('orders-content');
    try {
        const data = await adminFetch('/orders');
        if (!data.success) {
            container.innerHTML = `<div class="empty-state">Erreur de chargement des commandes</div>`;
            return;
        }
        allOrders = data.orders;
        renderOrders();
    } catch (err) {
        if (err.message !== 'Session expirée ou accès refusé') {
            container.innerHTML = `<div class="empty-state">Erreur de connexion au serveur</div>`;
        }
    }
}

function renderOrders() {
    const container = document.getElementById('orders-content');
    const statusFilter = document.getElementById('filter-status').value;
    const search = document.getElementById('filter-search').value.trim().toLowerCase();

    let filtered = allOrders;

    if (statusFilter !== 'all') {
        filtered = filtered.filter(o => o.status === statusFilter);
    }

    if (search) {
        filtered = filtered.filter(o =>
            (o.reference || '').toLowerCase().includes(search) ||
            (o.prenom || '').toLowerCase().includes(search) ||
            (o.nom || '').toLowerCase().includes(search) ||
            (o.email || '').toLowerCase().includes(search)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state">Aucune commande ne correspond</div>`;
        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Référence</th>
                    <th>Client</th>
                    <th>Contact</th>
                    <th>Articles</th>
                    <th>Total</th>
                    <th>Paiement</th>
                    <th>Statut</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(o => `
                    <tr>
                        <td>${escapeHtml(o.reference)}</td>
                        <td>${escapeHtml(o.prenom)} ${escapeHtml(o.nom)}</td>
                        <td>${escapeHtml(o.email)}<br><span style="color:var(--text-light)">${escapeHtml(o.telephone || '')}</span></td>
                        <td>${escapeHtml(String(o.items_count || 0))}</td>
                        <td>${formatFCFA(o.total)}</td>
                        <td>${escapeHtml(o.payment_method || '—')}</td>
                        <td>
                            <select class="status-select" data-order-id="${o.id}" onchange="changeOrderStatus(this)">
                                ${Object.keys(ORDER_STATUS_LABELS).map(key => `
                                    <option value="${key}" ${o.status === key ? 'selected' : ''}>${ORDER_STATUS_LABELS[key]}</option>
                                `).join('')}
                            </select>
                        </td>
                        <td>${formatDate(o.created_at)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function changeOrderStatus(selectEl) {
    const orderId = selectEl.dataset.orderId;
    const newStatus = selectEl.value;
    const previousValue = allOrders.find(o => String(o.id) === String(orderId))?.status;

    selectEl.disabled = true;
    try {
        const data = await adminFetch(`/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        });

        if (!data.success) {
            showNotif(data.message || 'Erreur lors de la mise à jour', true);
            selectEl.value = previousValue;
            return;
        }

        const order = allOrders.find(o => String(o.id) === String(orderId));
        if (order) order.status = newStatus;
        showNotif('✓ Statut mis à jour');
    } catch (err) {
        if (err.message !== 'Session expirée ou accès refusé') {
            showNotif('Erreur de connexion au serveur', true);
        }
        selectEl.value = previousValue;
    } finally {
        selectEl.disabled = false;
    }
}
