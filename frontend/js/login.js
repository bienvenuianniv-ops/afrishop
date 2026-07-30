// ================================
// AFRISHOP — Login JS
// ================================

// ================================
// SWITCH TABS
// ================================
function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');

    if (tab === 'login') {
        document.querySelectorAll('.auth-tab')[0].classList.add('active');
        document.getElementById('login-form').style.display = 'block';
    } else {
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.getElementById('register-form').style.display = 'block';
    }
}

// ================================
// TOGGLE PASSWORD
// ================================
function togglePwd(id) {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// ================================
// CONNEXION
// ================================
async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    errorEl.style.display = 'none';

    if (!email || !password) {
        errorEl.textContent = '⚠️ Veuillez remplir tous les champs';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                mot_de_passe: password
            })
        });

        const data = await response.json();

        if (data.success) {
            // Sauvegarder le token et l'utilisateur
            localStorage.setItem('afrishop_token', data.token);
            localStorage.setItem('afrishop_user', JSON.stringify(data.user));

            showNotif('✓ Connexion réussie ! Bienvenue ' + data.user.prenom);

            // Rediriger vers le compte
            setTimeout(() => {
                window.location.href = 'account.html';
            }, 1500);
        } else {
            errorEl.textContent = '❌ ' + data.message;
            errorEl.style.display = 'block';
        }
    } catch (err) {
        errorEl.textContent = '❌ Erreur de connexion au serveur';
        errorEl.style.display = 'block';
    }
}

// ================================
// INSCRIPTION
// ================================
async function register() {
    const prenom = document.getElementById('reg-prenom').value.trim();
    const nom = document.getElementById('reg-nom').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const tel = document.getElementById('reg-tel').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    const errorEl = document.getElementById('register-error');
    const successEl = document.getElementById('register-success');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    // Validation
    if (!prenom || !nom || !email || !password) {
        errorEl.textContent = '⚠️ Veuillez remplir tous les champs obligatoires';
        errorEl.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = '⚠️ Le mot de passe doit contenir au moins 6 caractères';
        errorEl.style.display = 'block';
        return;
    }

    if (password !== confirm) {
        errorEl.textContent = '⚠️ Les mots de passe ne correspondent pas';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prenom, nom, email,
                telephone: tel,
                mot_de_passe: password
            })
        });

        const data = await response.json();

        if (data.success) {
            // Sauvegarder le token
            localStorage.setItem('afrishop_token', data.token);
            localStorage.setItem('afrishop_user', JSON.stringify(data.user));

            successEl.textContent = '✓ Compte créé avec succès ! Bienvenue ' + data.user.prenom + ' !';
            successEl.style.display = 'block';

            // Rediriger vers le compte
            setTimeout(() => {
                window.location.href = 'account.html';
            }, 2000);
        } else {
            errorEl.textContent = '❌ ' + data.message;
            errorEl.style.display = 'block';
        }
    } catch (err) {
        errorEl.textContent = '❌ Erreur de connexion au serveur';
        errorEl.style.display = 'block';
    }
}

// ================================
// INITIALISATION
// ================================
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    // Si déjà connecté rediriger vers compte
    const token = localStorage.getItem('afrishop_token');
    if (token) {
        window.location.href = 'account.html';
    }
});