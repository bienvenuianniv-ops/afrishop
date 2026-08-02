// ================================
// AFRISHOP — Auth Controller (PostgreSQL)
// ================================

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ================================
// INSCRIPTION
// ================================
const register = async (req, res) => {
    const { prenom, nom, email, telephone, mot_de_passe, pays, adresse } = req.body;

    if (!prenom || !nom || !email || !mot_de_passe) {
        return res.status(400).json({
            success: false,
            message: 'Prénom, nom, email et mot de passe sont obligatoires'
        });
    }

    try {
        // Vérifier si email existe déjà
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cet email est déjà utilisé'
            });
        }

        // Chiffrer le mot de passe
        const hashedPassword = bcrypt.hashSync(mot_de_passe, 10);

        // Insérer l'utilisateur
        const result = await db.query(`
            INSERT INTO users (prenom, nom, email, telephone, mot_de_passe, pays, adresse)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, prenom, nom, email, role
        `, [prenom, nom, email, telephone, hashedPassword, pays, adresse]);

        const user = result.rows[0];

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'afrishop_secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Compte créé avec succès !',
            token,
            user
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du compte',
            error: err.message
        });
    }
};

// ================================
// CONNEXION
// ================================
const login = async (req, res) => {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
        return res.status(400).json({
            success: false,
            message: 'Email et mot de passe obligatoires'
        });
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        const user = result.rows[0];
        const validPassword = bcrypt.compareSync(mot_de_passe, user.mot_de_passe);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'afrishop_secret',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Connexion réussie !',
            token,
            user: {
                id: user.id,
                prenom: user.prenom,
                nom: user.nom,
                email: user.email,
                points: user.points,
                niveau: user.niveau,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: err.message
        });
    }
};

// ================================
// GET PROFIL
// ================================
const getProfile = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await db.query(
            'SELECT id, prenom, nom, email, telephone, pays, adresse, points, niveau FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: err.message
        });
    }
};

// ================================
// CHANGER LE MOT DE PASSE
// ================================
const changePassword = async (req, res) => {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
        return res.status(400).json({
            success: false,
            message: 'Mot de passe actuel et nouveau mot de passe obligatoires'
        });
    }

    if (new_password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
        });
    }

    try {
        const result = await db.query('SELECT mot_de_passe FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        const validPassword = bcrypt.compareSync(current_password, result.rows[0].mot_de_passe);
        if (!validPassword) {
            // 400 et non 401 : l'utilisateur est bien authentifié (JWT valide), seule
            // sa saisie est incorrecte — un 401 déclencherait la déconnexion côté frontend.
            return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect' });
        }

        const hashedPassword = bcrypt.hashSync(new_password, 10);
        await db.query('UPDATE users SET mot_de_passe = $1 WHERE id = $2', [hashedPassword, userId]);

        res.json({ success: true, message: 'Mot de passe modifié avec succès !' });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: err.message
        });
    }
};

module.exports = { register, login, getProfile, changePassword };