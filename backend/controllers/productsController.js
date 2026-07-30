// ================================
// AFRISHOP — Products Controller
// ================================

const db = require('../config/database');

// Emojis des produits
const productEmojis = {
    1: '🎧', 2: '⌚', 3: '🔌', 4: '👕',
    5: '📱', 6: '👟', 7: '👜', 8: '🧴',
    9: '🧼', 10: '🌺', 11: '🌶️'
};

// Ajouter les emojis aux produits
const addEmojis = (products) => {
    return products.map(p => ({
        ...p,
        emoji: productEmojis[p.id] || '📦'
    }));
};

// ================================
// GET TOUS LES PRODUITS
// ================================
const getAllProducts = (req, res) => {
    const { category, search, maxPrice } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    let params = [];

    if (category && category !== 'all') {
        query += ' AND category = ?';
        params.push(category);
    }

    if (search) {
        query += ' AND (name LIKE ? OR description LIKE ? OR badge LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (maxPrice) {
        query += ' AND price <= ?';
        params.push(maxPrice);
    }

    query += ' ORDER BY created_at DESC';

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erreur products :', err.message);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur'
            });
        }
        res.json({
            success: true,
            count: results.length,
            products: addEmojis(results)
        });
    });
};

// ================================
// GET UN PRODUIT PAR ID
// ================================
const getProductById = (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM products WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Erreur products :', err.message);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé'
            });
        }

        res.json({
            success: true,
            product: addEmojis([results[0]])[0]
        });
    });
};

// ================================
// GET PRODUITS PAR CATEGORIE
// ================================
const getProductsByCategory = (req, res) => {
    const { category } = req.params;

    db.query(
        'SELECT * FROM products WHERE category = ? ORDER BY created_at DESC',
        [category],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erreur serveur',
                    error: err.message
                });
            }
            res.json({
                success: true,
                count: results.length,
                products: addEmojis(results)
            });
        }
    );
};

module.exports = {
    getAllProducts,
    getProductById,
    getProductsByCategory
};