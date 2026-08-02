// ================================
// AFRISHOP ADMIN — Mon compte
// ================================

document.addEventListener('DOMContentLoaded', () => {
    if (!initAdminLayout('account')) return;
    document.getElementById('password-form').addEventListener('submit', handlePasswordChange);
});

async function handlePasswordChange(e) {
    e.preventDefault();

    const errorBox = document.getElementById('password-error');
    const successBox = document.getElementById('password-success');
    errorBox.classList.remove('show');
    successBox.classList.remove('show');

    const current_password = document.getElementById('current-password').value;
    const new_password = document.getElementById('new-password').value;
    const confirm_password = document.getElementById('confirm-password').value;

    if (new_password !== confirm_password) {
        errorBox.textContent = 'Les deux mots de passe ne correspondent pas';
        errorBox.classList.add('show');
        return;
    }

    if (new_password.length < 6) {
        errorBox.textContent = 'Le nouveau mot de passe doit contenir au moins 6 caractères';
        errorBox.classList.add('show');
        return;
    }

    try {
        const data = await adminFetch('/auth/password', {
            method: 'PUT',
            body: JSON.stringify({ current_password, new_password })
        });

        if (!data.success) {
            errorBox.textContent = data.message || 'Erreur lors de la mise à jour';
            errorBox.classList.add('show');
            return;
        }

        successBox.textContent = '✓ Mot de passe modifié avec succès';
        successBox.classList.add('show');
        document.getElementById('password-form').reset();
    } catch (err) {
        if (err.message !== 'Session expirée ou accès refusé') {
            errorBox.textContent = 'Erreur de connexion au serveur';
            errorBox.classList.add('show');
        }
    }
}
