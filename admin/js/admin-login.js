// ================================
// AFRISHOP ADMIN — Connexion
// ================================

document.addEventListener('DOMContentLoaded', () => {
    // Déjà connecté en admin ? on saute direct au dashboard.
    const token = localStorage.getItem('afrishop_token');
    const user = getStoredUser();
    if (token && user && user.role === 'admin') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('admin-login-form').addEventListener('submit', handleLogin);
});

async function handleLogin(e) {
    e.preventDefault();
    const errorBox = document.getElementById('login-error');
    errorBox.classList.remove('show');

    const email = document.getElementById('login-email').value.trim();
    const mot_de_passe = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, mot_de_passe })
        });
        const data = await response.json();

        if (!data.success) {
            errorBox.textContent = data.message || 'Connexion impossible';
            errorBox.classList.add('show');
            return;
        }

        if (data.user.role !== 'admin') {
            errorBox.textContent = 'Ce compte n\'a pas les droits administrateur';
            errorBox.classList.add('show');
            return;
        }

        localStorage.setItem('afrishop_token', data.token);
        localStorage.setItem('afrishop_user', JSON.stringify(data.user));
        window.location.href = 'index.html';
    } catch (err) {
        errorBox.textContent = 'Erreur de connexion au serveur';
        errorBox.classList.add('show');
    }
}
