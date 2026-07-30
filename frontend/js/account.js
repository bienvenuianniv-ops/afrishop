// ================================
// AFRISHOP — Espace Client JS
// ================================

let currentUser = null;
let myOrders = [];

const statusMeta = {
    pending: { label: 'En attente', cls: 'status-processing' },
    processing: { label: 'En préparation', cls: 'status-processing' },
    transit: { label: 'En transit', cls: 'status-transit' },
    delivered: { label: 'Livrée', cls: 'status-delivered' },
    cancelled: { label: 'Annulée', cls: 'status-processing' }
};

const niveauLabels = { bronze: 'Bronze', argent: 'Argent', or: 'Or', platine: 'Platine' };
const niveauIcons = { bronze: '🥉', argent: '🥈', or: '🥇', platine: '💎' };
const niveauRanges = {
    bronze: '0 - 199 pts',
    argent: '200 - 499 pts',
    or: '500 - 999 pts',
    platine: '1000+ pts'
};

function authHeaders() {
    return { 'Authorization': `Bearer ${localStorage.getItem('afrishop_token')}` };
}

// ================================
// CHARGEMENT DES DONNÉES RÉELLES
// ================================
async function loadAccountData() {
    const token = localStorage.getItem('afrishop_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const [profileRes, ordersRes] = await Promise.all([
            fetch(`${API_URL}/auth/profile`, { headers: authHeaders() }),
            fetch(`${API_URL}/orders/mine`, { headers: authHeaders() })
        ]);

        const profileData = await profileRes.json();

        if (!profileData.success) {
            localStorage.removeItem('afrishop_token');
            localStorage.removeItem('afrishop_user');
            window.location.href = 'login.html';
            return;
        }

        const ordersData = await ordersRes.json();

        currentUser = profileData.user;
        myOrders = ordersData.success ? ordersData.orders : [];

        renderSidebar();
        document.getElementById('account-main').innerHTML = sections.dashboard();
    } catch (err) {
        console.error('Erreur chargement compte:', err);
        showNotif('⚠️ Erreur de connexion au serveur');
    }
}

function renderSidebar() {
    const initials = ((currentUser.prenom || '')[0] || '') + ((currentUser.nom || '')[0] || '');
    document.getElementById('sidebar-avatar').textContent = initials.toUpperCase();
    document.getElementById('sidebar-name').textContent = `${currentUser.prenom} ${currentUser.nom}`;
    document.getElementById('sidebar-email').textContent = currentUser.email;
    document.getElementById('sidebar-level').textContent =
        `✨ Client ${niveauLabels[currentUser.niveau] || 'Bronze'}`;
    document.getElementById('orders-badge').textContent = myOrders.length;
}

// ================================
// SECTIONS
// ================================
const sections = {

    dashboard: () => {
        const enCours = myOrders.filter(o => ['pending', 'processing', 'transit'].includes(o.status)).length;
        return `
        <div class="section-title">📊 Tableau de bord</div>
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-num">${myOrders.length}</div>
                <div class="stat-label">Commandes</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">${enCours}</div>
                <div class="stat-label">En cours</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">${currentUser.points || 0}</div>
                <div class="stat-label">Points</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">${niveauLabels[currentUser.niveau] || 'Bronze'}</div>
                <div class="stat-label">Niveau</div>
            </div>
        </div>
        <div class="section-title" style="font-size:15px">📦 Dernières commandes</div>
        ${renderOrders()}`;
    },

    orders: () => `
        <div class="section-title">📦 Mes commandes</div>
        ${renderOrders(true)}`,

    tracking: () => `
        <div class="section-title">🚚 Suivi de livraison</div>
        <p style="color:#888;font-size:13px">
            Le suivi détaillé sera disponible une fois votre commande expédiée.
        </p>`,

    wishlist: () => `
        <div class="section-title">❤️ Mes favoris</div>
        <div class="products-grid" style="grid-template-columns:repeat(3,1fr);gap:16px">
            ${products.slice(0, 3).map(p => `
                <div class="product-card">
                    <div class="product-img">${escapeHtml(p.emoji)}</div>
                    <div class="product-info">
                        <div class="product-name">${escapeHtml(p.name)}</div>
                        <div class="product-origin">${escapeHtml(p.origin)}</div>
                        <div class="product-footer">
                            <span class="product-price">${Number(p.price).toLocaleString()} F</span>
                            <button class="btn-add" onclick="addToCart(${p.id})">+</button>
                        </div>
                        <span class="product-badge">${escapeHtml(p.badge)}</span>
                    </div>
                </div>`).join('')}
        </div>`,

    profile: () => `
        <div class="section-title">👤 Mon profil</div>
        <div class="profile-form">
            <div class="form-row-2">
                <div class="form-group">
                    <label>Prénom</label>
                    <input type="text" id="profile-prenom" value="${escapeHtml(currentUser.prenom)}">
                </div>
                <div class="form-group">
                    <label>Nom</label>
                    <input type="text" id="profile-nom" value="${escapeHtml(currentUser.nom)}">
                </div>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" value="${escapeHtml(currentUser.email)}" disabled>
            </div>
            <div class="form-group">
                <label>Téléphone</label>
                <input type="tel" id="profile-tel" value="${escapeHtml(currentUser.telephone || '')}">
            </div>
            <div class="form-group">
                <label>Pays</label>
                <select id="profile-pays">
                    <option value="Sénégal" ${currentUser.pays === 'Sénégal' ? 'selected' : ''}>🇸🇳 Sénégal</option>
                    <option value="France" ${currentUser.pays === 'France' ? 'selected' : ''}>🇫🇷 France</option>
                    <option value="États-Unis" ${currentUser.pays === 'États-Unis' ? 'selected' : ''}>🇺🇸 États-Unis</option>
                </select>
            </div>
            <div class="form-group">
                <label>Adresse</label>
                <input type="text" id="profile-adresse" value="${escapeHtml(currentUser.adresse || '')}">
            </div>
            <button class="btn-primary" onclick="saveProfile()">
                Enregistrer
            </button>
        </div>`,

    fidelite: () => `
        <div class="section-title">⭐ Fidélité & Points</div>
        <div class="points-card">
            <div class="points-info">
                <h3>Votre solde de points</h3>
                <p>1 point = 10 FCFA de réduction</p>
            </div>
            <div>
                <div class="points-num">${currentUser.points || 0}</div>
                <div class="points-sub">points</div>
            </div>
        </div>
        <div class="levels-grid">
            ${['bronze', 'argent', 'or', 'platine'].map(lvl => `
                <div class="level-card ${currentUser.niveau === lvl ? 'current' : ''}">
                    ${currentUser.niveau === lvl ? '<div class="current-badge">Votre niveau</div>' : ''}
                    <div class="level-icon">${niveauIcons[lvl]}</div>
                    <div class="level-name">${niveauLabels[lvl]}</div>
                    <div class="level-pts">${niveauRanges[lvl]}</div>
                </div>`).join('')}
        </div>
        <button class="btn-primary" onclick="showNotif('✓ Points échangés !')">
            Échanger mes points
        </button>`
};

// ================================
// COMMANDES
// ================================
function renderOrders(all = false) {
    const list = all ? myOrders : myOrders.slice(0, 3);

    if (list.length === 0) {
        return `<div class="orders-list">
            <p style="color:#888;padding:20px 0;text-align:center">
                Vous n'avez pas encore de commande.
            </p>
        </div>`;
    }

    return `<div class="orders-list">
        ${list.map(o => {
            const st = statusMeta[o.status] || statusMeta.pending;
            const date = new Date(o.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div class="order-ref">${escapeHtml(o.reference)}</div>
                        <div class="order-date">${date}</div>
                    </div>
                    <span class="order-status ${st.cls}">${st.label}</span>
                </div>
                <div class="order-body">
                    <div class="order-items">
                        <span class="order-item-chip">${o.items_count} article(s)</span>
                    </div>
                    <div class="order-footer">
                        <span class="order-total">${Number(o.total).toLocaleString()} F</span>
                    </div>
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

// ================================
// PROFIL — ENREGISTRER
// ================================
async function saveProfile() {
    const payload = {
        prenom: document.getElementById('profile-prenom').value.trim(),
        nom: document.getElementById('profile-nom').value.trim(),
        telephone: document.getElementById('profile-tel').value.trim(),
        pays: document.getElementById('profile-pays').value,
        adresse: document.getElementById('profile-adresse').value.trim()
    };

    if (!payload.prenom || !payload.nom) {
        showNotif('⚠️ Prénom et nom sont obligatoires');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (data.success) {
            Object.assign(currentUser, payload);
            renderSidebar();
            showNotif('✓ Profil mis à jour !');
        } else {
            showNotif('⚠️ ' + data.message);
        }
    } catch (err) {
        showNotif('⚠️ Erreur de connexion au serveur');
    }
}

// ================================
// NAVIGATION
// ================================
function showSection(el, key) {
    if (!currentUser) return;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('account-main').innerHTML = sections[key]();
}

// ================================
// DECONNEXION
// ================================
function logout() {
    localStorage.removeItem('afrishop_token');
    localStorage.removeItem('afrishop_user');
    showNotif('👋 Déconnexion...');
    setTimeout(() => window.location.href = 'login.html', 1500);
}

// ================================
// INITIALISATION
// ================================
document.addEventListener('DOMContentLoaded', () => {
    loadAccountData();
    updateCartCount();
});
