// ================================
// AFRISHOP — Products Controller (PostgreSQL)
// ================================

const db = require('../config/database');

// Emojis des produits
const productEmojis = {
    1: '🎧', 2: '⌚', 3: '🔌', 4: '👕',
    5: '📱', 6: '👟', 7: '👜', 8: '🧴',
    9: '🧼', 10: '🌺', 11: '🌶️'
};

const addEmojis = (products) => {
    return products.map(p => ({
        ...p,
        emoji: productEmojis[p.id] || '📦'
    }));
};

// ================================
// GET TOUS LES PRODUITS
// ================================
const getAllProducts = async (req, res) => {
    const { category, search, maxPrice } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    let params = [];
    let paramCount = 1;

    if (category && category !== 'all') {
        query += ` AND category = $${paramCount}`;
        params.push(category);
        paramCount++;
    }

    if (search) {
        query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount + 1} OR badge ILIKE $${paramCount + 2})`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        paramCount += 3;
    }

    if (maxPrice) {
        query += ` AND price <= $${paramCount}`;
        params.push(maxPrice);
        paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    try {
        const result = await db.query(query, params);
        res.json({
            success: true,
            count: result.rows.length,
            products: addEmojis(result.rows)
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
// GET UN PRODUIT PAR ID
// ================================
const getProductById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé'
            });
        }

        res.json({
            success: true,
            product: addEmojis([result.rows[0]])[0]
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
// GET PRODUITS PAR CATEGORIE
// ================================
const getProductsByCategory = async (req, res) => {
    const { category } = req.params;

    try {
        const result = await db.query(
            'SELECT * FROM products WHERE category = $1 ORDER BY created_at DESC',
            [category]
        );
        res.json({
            success: true,
            count: result.rows.length,
            products: addEmojis(result.rows)
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: err.message
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    getProductsByCategory
};