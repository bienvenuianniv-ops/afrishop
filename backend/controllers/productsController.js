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
        emoji: p.emoji || productEmojis[p.id] || '📦'
    }));
};

const VALID_CATEGORIES = ['tech', 'mode', 'beaute', 'food'];

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

// ================================
// VALIDATION D'UN PRODUIT (création/modification)
// ================================
const validateProductInput = (body) => {
    const { name, price, category, stock } = body;

    if (!name || !String(name).trim()) return 'Le nom du produit est obligatoire';
    if (!category || !VALID_CATEGORIES.includes(category)) {
        return `Catégorie invalide (valeurs acceptées : ${VALID_CATEGORIES.join(', ')})`;
    }

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) return 'Prix invalide';

    if (stock !== undefined && stock !== null && stock !== '') {
        const stockNum = Number(stock);
        if (!Number.isInteger(stockNum) || stockNum < 0) return 'Stock invalide';
    }

    return null;
};

// ================================
// CRÉER UN PRODUIT (admin)
// ================================
const createProduct = async (req, res) => {
    const { name, description, price, category, origin, emoji, badge, stock, image } = req.body;

    const validationError = validateProductInput(req.body);
    if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
    }

    try {
        const result = await db.query(`
            INSERT INTO products (name, description, price, category, origin, emoji, badge, stock, image)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            name, description || null, Number(price), category,
            origin || null, emoji || null, badge || null,
            stock !== undefined && stock !== null && stock !== '' ? parseInt(stock, 10) : 0,
            image || null
        ]);

        res.status(201).json({
            success: true,
            message: 'Produit créé avec succès !',
            product: addEmojis([result.rows[0]])[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du produit',
            error: err.message
        });
    }
};

// ================================
// MODIFIER UN PRODUIT (admin)
// ================================
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category, origin, emoji, badge, stock, image } = req.body;

    const validationError = validateProductInput(req.body);
    if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
    }

    try {
        const result = await db.query(`
            UPDATE products
            SET name = $1, description = $2, price = $3, category = $4,
                origin = $5, emoji = $6, badge = $7, stock = $8, image = $9
            WHERE id = $10
            RETURNING *
        `, [
            name, description || null, Number(price), category,
            origin || null, emoji || null, badge || null,
            stock !== undefined && stock !== null && stock !== '' ? parseInt(stock, 10) : 0,
            image || null, id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        }

        res.json({
            success: true,
            message: 'Produit modifié avec succès !',
            product: addEmojis([result.rows[0]])[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la modification du produit',
            error: err.message
        });
    }
};

// ================================
// SUPPRIMER UN PRODUIT (admin)
// ================================
const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        // Un produit déjà commandé ne doit pas être supprimé : order_items a
        // une contrainte ON DELETE CASCADE sur product_id, donc supprimer le
        // produit effacerait aussi les lignes de commandes historiques.
        const usedInOrders = await db.query(
            'SELECT 1 FROM order_items WHERE product_id = $1 LIMIT 1',
            [id]
        );

        if (usedInOrders.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ce produit a déjà été commandé et ne peut pas être supprimé (il apparaît dans l\'historique des commandes). Mettez son stock à 0 pour le retirer de la vente.'
            });
        }

        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        }

        res.json({ success: true, message: 'Produit supprimé avec succès !' });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du produit',
            error: err.message
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    getProductsByCategory,
    createProduct,
    updateProduct,
    deleteProduct
};