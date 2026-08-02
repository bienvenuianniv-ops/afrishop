// ================================
// AFRISHOP ADMIN — Commun (auth, helpers)
// ================================

const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://afrishop-backend-q1fr.onrender.com/api';

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatFCFA(amount) {
    return Number(amount || 0).toLocaleString('fr-FR') + ' F';
}

function formatDate(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function authHeaders() {
    return {
        'Authorization': `Bearer ${localStorage.getItem('afrishop_token')}`,
        'Content-Type': 'application/json'
    };
}

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem('afrishop_user') || 'null');
    } catch (err) {
        return null;
    }
}

function logout() {
    localStorage.removeItem('afrishop_token');
    localStorage.removeItem('afrishop_user');
    window.location.href = 'login.html';
}

// Vérifie côté client qu'un token + rôle admin sont présents.
// Ce n'est qu'un confort d'affichage : la vraie protection est côté serveur (requireAdmin).
function requireAdminGuard() {
    const token = localStorage.getItem('afrishop_token');
    const user = getStoredUser();

    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function showNotif(message, isError = false) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${isError ? '#E24B4A' : '#1A1A1A'};
        color: ${isError ? '#fff' : '#C9A84C'};
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 13px;
        border: 1px solid ${isError ? '#E24B4A' : '#C9A84C'};
        z-index: 9999;
        white-space: nowrap;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2500);
}

// Requête API authentifiée générique. Redirige vers le login sur 401/403.
async function adminFetch(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: { ...authHeaders(), ...(options.headers || {}) }
    });

    if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error('Session expirée ou accès refusé');
    }

    return response.json();
}

function renderSidebar(activePage) {
    const user = getStoredUser();
    const links = [
        { key: 'dashboard', href: 'index.html', icon: '📊', label: 'Tableau de bord' },
        { key: 'products', href: 'products.html', icon: '📦', label: 'Produits' },
        { key: 'orders', href: 'orders.html', icon: '🧾', label: 'Commandes' }
    ];

    return `
        <div class="admin-sidebar">
            <div class="admin-brand">
                <span class="admin-brand-emoji">🌍</span>
                <span>AfriShop <strong>Admin</strong></span>
            </div>
            <nav class="admin-nav">
                ${links.map(l => `
                    <a href="${l.href}" class="admin-nav-link ${activePage === l.key ? 'active' : ''}">
                        <span>${l.icon}</span> ${l.label}
                    </a>
                `).join('')}
            </nav>
            <div class="admin-sidebar-footer">
                <div class="admin-user">
                    <div class="admin-user-name">${escapeHtml(user ? `${user.prenom} ${user.nom}` : '')}</div>
                    <div class="admin-user-email">${escapeHtml(user ? user.email : '')}</div>
                </div>
                <button class="admin-logout-btn" onclick="logout()">Déconnexion</button>
            </div>
        </div>
    `;
}

function initAdminLayout(activePage) {
    if (!requireAdminGuard()) return false;
    const sidebarEl = document.getElementById('admin-sidebar-slot');
    if (sidebarEl) sidebarEl.outerHTML = renderSidebar(activePage);
    return true;
}
