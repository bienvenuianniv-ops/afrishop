// ================================
// AFRISHOP — Rate limiting
// ================================

const rateLimit = require('express-rate-limit');

// Connexion / inscription — freine le bruteforce de mots de passe
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Trop de tentatives, réessayez dans quelques minutes'
    }
});

// Recherche de commande par référence — freine l'énumération
const orderLookupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Trop de requêtes, réessayez dans quelques minutes'
    }
});

module.exports = { authLimiter, orderLookupLimiter };
