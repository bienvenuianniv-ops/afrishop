// ================================
// AFRISHOP — Middleware Admin
// ================================
// À utiliser après le middleware `auth` (nécessite req.user déjà décodé).

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Accès réservé aux administrateurs'
        });
    }
    next();
};

module.exports = requireAdmin;
