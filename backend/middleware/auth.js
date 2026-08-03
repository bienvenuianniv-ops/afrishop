// ================================
// AFRISHOP — Middleware Auth
// ================================

const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // Récupérer le token
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Accès refusé — token manquant'
        });
    }

    try {
        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({
            success: false,
            message: 'Token invalide ou expiré'
        });
    }
};

module.exports = auth;