// ================================
// AFRISHOP ADMIN — Clients
// ================================

const ROLE_LABELS = { client: 'Client', admin: 'Admin' };
const CUSTOMER_ORDER_STATUS_LABELS = {
    pending: 'En attente',
    processing: 'En préparation',
    transit: 'En transit',
    delivered: 'Livrée',
    cancelled: 'Annulée'
};

let allCustomers = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!initAdminLayout('customers')) return;
    await loadCustomers();

    document.getElementById('filter-role').addEventListener('change', renderCustomers);
    document.getElementById('filter-search').addEventListener('input', renderCustomers);
});

async function loadCustomers() {
    const container = document.getElementById('customers-content');
    try {
        const data = await adminFetch('/admin/users');
        if (!data.success) {
            container.innerHTML = `<div class="empty-state">Erreur de chargement des clients</div>`;
            return;
        }
        allCustomers = data.users;
        renderCustomers();
    } catch (err) {
        if (err.message !== 'Session expirée ou accès refusé') {
            container.innerHTML = `<div class="empty-state">Erreur de connexion au serveur</div>`;
        }
    }
}

function renderCustomers() {
    const container = document.getElementById('customers-content');
    const roleFilter = document.getElementById('filter-role').value;
    const search = document.getElementById('filter-search').value.trim().toLowerCase();

    let filtered = allCustomers;
    if (roleFilter !== 'all') filtered = filtered.filter(u => u.role === roleFilter);
    if (search) {
        filtered = filtered.filter(u =>
            (u.prenom || '').toLowerCase().includes(search) ||
            (u.nom || '').toLowerCase().includes(search) ||
            (u.email || '').toLowerCase().includes(search)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state">Aucun client ne correspond</div>`;
        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Pays</th>
                    <th>Commandes</th>
                    <th>Total dépensé</th>
                    <th>Niveau</th>
                    <th>Rôle</th>
                    <th>Inscrit le</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(u => `
                    <tr>
                        <td>${escapeHtml(u.prenom)} ${escapeHtml(u.nom)}</td>
                        <td>${escapeHtml(u.email)}</td>
                        <td>${escapeHtml(u.pays || '—')}</td>
                        <td>${u.orders_count}</td>
                        <td>${formatFCFA(u.total_spent)}</td>
                        <td>${escapeHtml(u.niveau || '—')}</td>
                        <td><span class="badge ${u.role === 'admin' ? 'badge-transit' : 'badge-delivered'}">${ROLE_LABELS[u.role] || u.role}</span></td>
                        <td>${formatDate(u.created_at)}</td>
                        <td><button class="btn btn-secondary btn-sm" onclick="openCustomerModal(${u.id})">Détails</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function openCustomerModal(id) {
    const overlay = document.getElementById('customer-modal-overlay');
    const content = document.getElementById('customer-modal-content');
    document.getElementById('customer-modal-title').textContent = 'Chargement...';
    content.innerHTML = '';
    overlay.style.display = 'flex';

    try {
        const data = await adminFetch(`/admin/users/${id}`);
        if (!data.success) {
            content.innerHTML = `<div class="empty-state">${escapeHtml(data.message || 'Erreur de chargement')}</div>`;
            return;
        }

        renderCustomerModal(data.user, data.orders);
    } catch (err) {
        if (err.message !== 'Session expirée ou accès refusé') {
            content.innerHTML = `<div class="empty-state">Erreur de connexion au serveur</div>`;
        }
    }
}

function renderCustomerModal(user, orders) {
    const currentUser = getStoredUser();
    const isSelf = currentUser && String(currentUser.id) === String(user.id);

    document.getElementById('customer-modal-title').textContent = `${user.prenom} ${user.nom}`;

    const ordersHtml = orders.length === 0
        ? `<div class="empty-state">Aucune commande</div>`
        : `
            <table class="admin-table">
                <thead><tr><th>Référence</th><th>Total</th><th>Statut</th><th>Date</th></tr></thead>
                <tbody>
                    ${orders.map(o => `
                        <tr>
                            <td>${escapeHtml(o.reference)}</td>
                            <td>${formatFCFA(o.total)}</td>
                            <td><span class="badge badge-${escapeHtml(o.status)}">${CUSTOMER_ORDER_STATUS_LABELS[o.status] || o.status}</span></td>
                            <td>${formatDate(o.created_at)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

    document.getElementById('customer-modal-content').innerHTML = `
        <div class="form-group">
            <label>Email</label>
            <div>${escapeHtml(user.email)}</div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Téléphone</label>
                <div>${escapeHtml(user.telephone || '—')}</div>
            </div>
            <div class="form-group">
                <label>Pays</label>
                <div>${escapeHtml(user.pays || '—')}</div>
            </div>
        </div>
        <div class="form-group">
            <label>Adresse</label>
            <div>${escapeHtml(user.adresse || '—')}</div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Points fidélité</label>
                <div>${user.points || 0} (${escapeHtml(user.niveau || 'bronze')})</div>
            </div>
            <div class="form-group">
                <label>Rôle</label>
                <select class="status-select" id="customer-role-select" ${isSelf ? 'disabled title="Vous ne pouvez pas modifier votre propre rôle ici"' : ''}>
                    <option value="client" ${user.role === 'client' ? 'selected' : ''}>Client</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </div>
        </div>

        <div class="panel-title" style="margin-top:20px;">Historique des commandes</div>
        <div class="table-scroll">${ordersHtml}</div>

        <div class="modal-actions" style="justify-content:space-between; margin-top:20px;">
            <button type="button" class="btn btn-danger btn-sm" onclick="handleDeleteCustomer(${user.id})" ${isSelf ? 'disabled title="Vous ne pouvez pas supprimer votre propre compte"' : ''}>Supprimer ce client</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="handleRoleChange(${user.id})" ${isSelf ? 'disabled' : ''}>Enregistrer le rôle</button>
        </div>
    `;
}

function closeCustomerModal() {
    document.getElementById('customer-modal-overlay').style.display = 'none';
}

async function handleRoleChange(id) {
    const role = document.getElementById('customer-role-select').value;

    try {
        const data = await adminFetch(`/admin/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role })
        });

        if (!data.success) {
            showNotif(data.message || 'Erreur lors de la mise à jour du rôle', true);
            return;
        }

        showNotif('✓ Rôle mis à jour');
        closeCustomerModal();
        await loadCustomers();
    } catch (err) {
        if (err.message !== 'Session expirée ou accès refusé') {
            showNotif('Erreur de connexion au serveur', true);
        }
    }
}

async function handleDeleteCustomer(id) {
    const customer = allCustomers.find(u => u.id === id);
    const name = customer ? `${customer.prenom} ${customer.nom}` : `#${id}`;
    if (!confirm(`Supprimer le compte de « ${name} » ? Ses commandes resteront dans l'historique. Cette action est irréversible.`)) return;

    try {
        const data = await adminFetch(`/admin/users/${id}`, { method: 'DELETE' });

        if (!data.success) {
            showNotif(data.message || 'Suppression impossible', true);
            return;
        }

        showNotif('✓ Client supprimé');
        closeCustomerModal();
        await loadCustomers();
    } catch (err) {
        if (err.message !== 'Session expirée ou accès refusé') {
            showNotif('Erreur de connexion au serveur', true);
        }
    }
}
