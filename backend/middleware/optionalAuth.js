// ================================
// AFRISHOP — Middleware Auth optionnelle
// ================================
// Décode le token s'il est présent et valide, sans jamais bloquer la requête
// (utile pour le checkout invité : on veut lier la commande au compte si l'utilisateur est connecté).

const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'afrishop_secret');
    } catch (err) {
        req.user = null;
    }

    next();
};

module.exports = optionalAuth;
