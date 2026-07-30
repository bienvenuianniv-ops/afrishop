// ================================
// AFRISHOP — Auth Controller
// ================================

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ================================
// INSCRIPTION
// ================================
const register = (req, res) => {
    const { prenom, nom, email, telephone, mot_de_passe, pays, adresse } = req.body;

    // Validation
    if (!prenom || !nom || !email || !mot_de_passe) {
        return res.status(400).json({
            success: false,
            message: 'Prénom, nom, email et mot de passe sont obligatoires'
        });
    }

    if (mot_de_passe.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Le mot de passe doit contenir au moins 6 caractères'
        });
    }

    // Vérifier si email existe déjà
    db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Erreur register (SELECT) :', err.message);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur'
            });
        }

        if (results.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cet email est déjà utilisé'
            });
        }

        // Chiffrer le mot de passe
        const hashedPassword = bcrypt.hashSync(mot_de_passe, 10);

        // Insérer l'utilisateur
        const query = `
            INSERT INTO users (prenom, nom, email, telephone, mot_de_passe, pays, adresse)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [prenom, nom, email, telephone, hashedPassword, pays, adresse],
            (err2, result) => {
                if (err2) {
                    console.error('Erreur register (INSERT) :', err2.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de la création du compte'
                    });
                }

                // Créer le token JWT
                const token = jwt.sign(
                    { id: result.insertId, email, role: 'client' },
                    process.env.JWT_SECRET || 'afrishop_secret',
                    { expiresIn: '7d' }
                );

                res.status(201).json({
                    success: true,
                    message: 'Compte créé avec succès !',
                    token,
                    user: {
                        id: result.insertId,
                        prenom,
                        nom,
                        email
                    }
                });
            }
        );
    });
};

// ================================
// CONNEXION
// ================================
const login = (req, res) => {
    const { email, mot_de_passe } = req.body;

    // Validation
    if (!email || !mot_de_passe) {
        return res.status(400).json({
            success: false,
            message: 'Email et mot de passe obligatoires'
        });
    }

    // Chercher l'utilisateur
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Erreur login (SELECT) :', err.message);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur'
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        const user = results[0];

        // Vérifier le mot de passe
        const validPassword = bcrypt.compareSync(mot_de_passe, user.mot_de_passe);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Créer le token JWT
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
                niveau: user.niveau
            }
        });
    });
};

// ================================
// GET PROFIL
// ================================
const getProfile = (req, res) => {
    const userId = req.user.id;

    db.query(
        'SELECT id, prenom, nom, email, telephone, pays, adresse, points, niveau FROM users WHERE id = ?',
        [userId],
        (err, results) => {
            if (err) {
                console.error('Erreur getProfile :', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur serveur'
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            res.json({
                success: true,
                user: results[0]
            });
        }
    );
};

// ================================
// METTRE À JOUR LE PROFIL
// ================================
const updateProfile = (req, res) => {
    const userId = req.user.id;
    const { prenom, nom, telephone, pays, adresse } = req.body;

    if (!prenom || !nom) {
        return res.status(400).json({
            success: false,
            message: 'Prénom et nom sont obligatoires'
        });
    }

    db.query(
        'UPDATE users SET prenom = ?, nom = ?, telephone = ?, pays = ?, adresse = ? WHERE id = ?',
        [prenom, nom, telephone, pays, adresse, userId],
        (err) => {
            if (err) {
                console.error('Erreur updateProfile :', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur serveur'
                });
            }

            res.json({
                success: true,
                message: 'Profil mis à jour avec succès !'
            });
        }
    );
};

module.exports = { register, login, getProfile, updateProfile };
