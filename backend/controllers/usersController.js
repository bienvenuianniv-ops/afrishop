// ================================
// AFRISHOP — Users Controller (admin)
// ================================

const db = require('../config/database');

const VALID_ROLES = ['client', 'admin'];

// ================================
// GET TOUS LES CLIENTS
// ================================
const getAllUsers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.prenom, u.nom, u.email, u.telephone, u.pays,
                   u.points, u.niveau, u.role, u.created_at,
                   COUNT(o.id) as orders_count,
                   COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);

        res.json({
            success: true,
            count: result.rows.length,
            users: result.rows
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
// GET UN CLIENT + SES COMMANDES
// ================================
const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const userResult = await db.query(
            `SELECT id, prenom, nom, email, telephone, pays, adresse, points, niveau, role, created_at
             FROM users WHERE id = $1`,
            [id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Client non trouvé' });
        }

        const ordersResult = await db.query(
            `SELECT id, reference, total, status, created_at
             FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
            [id]
        );

        res.json({
            success: true,
            user: userResult.rows[0],
            orders: ordersResult.rows
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
// CHANGER LE RÔLE D'UN CLIENT (promouvoir/rétrograder admin)
// ================================
const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({
            success: false,
            message: `Rôle invalide (valeurs acceptées : ${VALID_ROLES.join(', ')})`
        });
    }

    if (String(req.user.id) === String(id) && role !== 'admin') {
        return res.status(400).json({
            success: false,
            message: 'Vous ne pouvez pas retirer vos propres droits administrateur'
        });
    }

    try {
        if (role === 'client') {
            const adminCount = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
            const target = await db.query('SELECT role FROM users WHERE id = $1', [id]);

            if (target.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Client non trouvé' });
            }

            if (target.rows[0].role === 'admin' && parseInt(adminCount.rows[0].count, 10) <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Impossible de retirer le dernier compte administrateur'
                });
            }
        }

        const result = await db.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, prenom, nom, email, role',
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Client non trouvé' });
        }

        res.json({
            success: true,
            message: 'Rôle mis à jour avec succès !',
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
// SUPPRIMER UN CLIENT
// ================================
const deleteUser = async (req, res) => {
    const { id } = req.params;

    if (String(req.user.id) === String(id)) {
        return res.status(400).json({
            success: false,
            message: 'Vous ne pouvez pas supprimer votre propre compte'
        });
    }

    try {
        const target = await db.query('SELECT role FROM users WHERE id = $1', [id]);

        if (target.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Client non trouvé' });
        }

        if (target.rows[0].role === 'admin') {
            const adminCount = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
            if (parseInt(adminCount.rows[0].count, 10) <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Impossible de supprimer le dernier compte administrateur'
                });
            }
        }

        // Les commandes existantes restent en base (user_id passe à NULL, ON DELETE SET NULL)
        await db.query('DELETE FROM users WHERE id = $1', [id]);

        res.json({ success: true, message: 'Client supprimé avec succès !' });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du client',
            error: err.message
        });
    }
};

module.exports = { getAllUsers, getUserById, updateUserRole, deleteUser };
