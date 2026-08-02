// ================================
// AFRISHOP — Admin Controller (dashboard)
// ================================

const db = require('../config/database');

// ================================
// STATISTIQUES DU TABLEAU DE BORD
// ================================
const getDashboardStats = async (req, res) => {
    try {
        const [
            revenueResult,
            ordersCountResult,
            statusBreakdownResult,
            productsCountResult,
            lowStockResult,
            usersCountResult,
            recentOrdersResult
        ] = await Promise.all([
            db.query("SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status != 'cancelled'"),
            db.query('SELECT COUNT(*) as count FROM orders'),
            db.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status'),
            db.query('SELECT COUNT(*) as count FROM products'),
            db.query('SELECT id, name, stock FROM products WHERE stock <= 5 ORDER BY stock ASC'),
            db.query('SELECT COUNT(*) as count FROM users'),
            db.query('SELECT id, reference, prenom, nom, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5')
        ]);

        const statusBreakdown = {};
        statusBreakdownResult.rows.forEach(r => { statusBreakdown[r.status] = parseInt(r.count, 10); });

        res.json({
            success: true,
            stats: {
                revenue: parseFloat(revenueResult.rows[0].revenue),
                ordersCount: parseInt(ordersCountResult.rows[0].count, 10),
                statusBreakdown,
                productsCount: parseInt(productsCountResult.rows[0].count, 10),
                lowStockProducts: lowStockResult.rows,
                usersCount: parseInt(usersCountResult.rows[0].count, 10),
                recentOrders: recentOrdersResult.rows
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

module.exports = { getDashboardStats };
