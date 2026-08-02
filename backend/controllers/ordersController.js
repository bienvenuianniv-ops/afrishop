// ================================
// AFRISHOP — Orders Controller (PostgreSQL)
// ================================

const db = require('../config/database');
const crypto = require('crypto');

// ================================
// CRÉER UNE COMMANDE
// ================================
const createOrder = async (req, res) => {
    const {
        prenom, nom, email, telephone,
        pays, adresse,
        delivery_price, discount,
        payment_method, delivery_method,
        items
    } = req.body;

    if (!prenom || !nom || !email || !adresse || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Veuillez remplir tous les champs obligatoires'
        });
    }

    const productIds = items.map(item => parseInt(item.id, 10));
    if (productIds.some(id => !Number.isInteger(id))) {
        return res.status(400).json({
            success: false,
            message: 'Panier invalide'
        });
    }

    try {
        // Recalculer les prix côté serveur à partir du catalogue —
        // ne jamais faire confiance aux prix envoyés par le client
        const productsResult = await db.query(
            'SELECT id, name, price FROM products WHERE id = ANY($1)',
            [productIds]
        );

        const productById = {};
        productsResult.rows.forEach(p => { productById[p.id] = p; });

        let subtotal = 0;
        const verifiedItems = [];

        for (const item of items) {
            const id = parseInt(item.id, 10);
            const quantity = parseInt(item.quantity, 10);
            const product = productById[id];

            if (!product || !Number.isInteger(quantity) || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Un article du panier est invalide ou n\'existe plus'
                });
            }

            const price = parseFloat(product.price);
            subtotal += price * quantity;
            verifiedItems.push({ id, name: product.name, price, quantity });
        }

        let safeDeliveryPrice = Number(delivery_price);
        if (!Number.isFinite(safeDeliveryPrice) || safeDeliveryPrice < 0) safeDeliveryPrice = 0;

        let safeDiscount = Number(discount);
        if (!Number.isFinite(safeDiscount) || safeDiscount < 0) safeDiscount = 0;
        if (safeDiscount > subtotal) safeDiscount = subtotal;

        const total = subtotal + safeDeliveryPrice - safeDiscount;

        // Référence à haute entropie — non énumérable
        const reference = '#AS-' + new Date().getFullYear() + '-' +
            crypto.randomBytes(6).toString('hex');

        // Lier la commande au compte connecté, s'il y en a un (checkout invité toujours possible)
        const userId = req.user ? req.user.id : null;

        // Insérer la commande
        const orderResult = await db.query(`
            INSERT INTO orders
            (reference, user_id, prenom, nom, email, telephone, pays, adresse,
             subtotal, delivery_price, discount, total, payment_method, delivery_method)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
        `, [reference, userId, prenom, nom, email, telephone,
            pays, adresse, subtotal, safeDeliveryPrice,
            safeDiscount, total, payment_method, delivery_method]);

        const orderId = orderResult.rows[0].id;

        // Insérer les articles (prix et noms vérifiés côté serveur)
        for (const item of verifiedItems) {
            await db.query(`
                INSERT INTO order_items (order_id, product_id, name, price, quantity)
                VALUES ($1, $2, $3, $4, $5)
            `, [orderId, item.id, item.name, item.price, item.quantity]);
        }

        res.status(201).json({
            success: true,
            message: 'Commande créée avec succès !',
            reference: reference,
            orderId: orderId
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la commande',
            error: err.message
        });
    }
};

// ================================
// GET TOUTES LES COMMANDES
// ================================
const getAllOrders = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT o.*, COUNT(oi.id) as items_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `);
        res.json({
            success: true,
            count: result.rows.length,
            orders: result.rows
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
// GET MES COMMANDES (utilisateur connecté)
// ================================
const getMyOrders = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT o.*, COUNT(oi.id) as items_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = $1
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `, [req.user.id]);
        res.json({
            success: true,
            count: result.rows.length,
            orders: result.rows
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
// GET UNE COMMANDE PAR REFERENCE
// ================================
const getOrderByReference = async (req, res) => {
    const { reference } = req.params;

    try {
        const orderResult = await db.query(
            'SELECT * FROM orders WHERE reference = $1',
            [reference]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }

        const order = orderResult.rows[0];

        const itemsResult = await db.query(
            'SELECT * FROM order_items WHERE order_id = $1',
            [order.id]
        );

        res.json({
            success: true,
            order: { ...order, items: itemsResult.rows }
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
    createOrder,
    getAllOrders,
    getMyOrders,
    getOrderByReference
};