// ================================
// AFRISHOP — Orders Controller (PostgreSQL)
// ================================

const db = require('../config/database');
const crypto = require('crypto');

// Codes promo valides — même liste que frontend/js/checkout.js.
// Source de vérité pour le calcul de la remise : jamais le montant envoyé par le client.
const PROMO_CODES = {
    'BIENVENUE20': { type: 'percent', value: 20 },
    'AFRIQUE10': { type: 'percent', value: 10 },
    'DAKAR500': { type: 'fixed', value: 500 },
    'DIASPORA15': { type: 'percent', value: 15 },
};

// ================================
// CRÉER UNE COMMANDE
// ================================
const createOrder = async (req, res) => {
    const {
        prenom, nom, email, telephone,
        pays, adresse,
        delivery_price, promo_code,
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

    let client;

    try {
        client = await db.connect();
        await client.query('BEGIN');

        // Recalculer les prix côté serveur à partir du catalogue, et verrouiller les lignes
        // pour empêcher deux commandes concurrentes de survendre le même stock —
        // ne jamais faire confiance aux prix/stock envoyés par le client
        const productsResult = await client.query(
            'SELECT id, name, price, stock FROM products WHERE id = ANY($1) FOR UPDATE',
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
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Un article du panier est invalide ou n\'existe plus'
                });
            }

            if (quantity > product.stock) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: `Stock insuffisant pour "${product.name}" (disponible : ${product.stock})`
                });
            }

            const price = parseFloat(product.price);
            subtotal += price * quantity;
            verifiedItems.push({ id, name: product.name, price, quantity });
        }

        let safeDeliveryPrice = Number(delivery_price);
        if (!Number.isFinite(safeDeliveryPrice) || safeDeliveryPrice < 0) safeDeliveryPrice = 0;

        // Remise calculée uniquement à partir d'un code promo valide, jamais d'un montant fourni par le client
        let safeDiscount = 0;
        const normalizedPromo = typeof promo_code === 'string' ? promo_code.trim().toUpperCase() : '';
        const promo = PROMO_CODES[normalizedPromo];
        if (promo) {
            safeDiscount = promo.type === 'percent'
                ? Math.round(subtotal * promo.value / 100)
                : promo.value;
            if (safeDiscount > subtotal) safeDiscount = subtotal;
        }

        const total = subtotal + safeDeliveryPrice - safeDiscount;

        // Référence à haute entropie — non énumérable
        const reference = '#AS-' + new Date().getFullYear() + '-' +
            crypto.randomBytes(6).toString('hex');

        // Lier la commande au compte connecté, s'il y en a un (checkout invité toujours possible)
        const userId = req.user ? req.user.id : null;

        // Insérer la commande
        const orderResult = await client.query(`
            INSERT INTO orders
            (reference, user_id, prenom, nom, email, telephone, pays, adresse,
             subtotal, delivery_price, discount, total, payment_method, delivery_method)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
        `, [reference, userId, prenom, nom, email, telephone,
            pays, adresse, subtotal, safeDeliveryPrice,
            safeDiscount, total, payment_method, delivery_method]);

        const orderId = orderResult.rows[0].id;

        // Insérer les articles (prix et noms vérifiés côté serveur) et décrémenter le stock
        for (const item of verifiedItems) {
            await client.query(`
                INSERT INTO order_items (order_id, product_id, name, price, quantity)
                VALUES ($1, $2, $3, $4, $5)
            `, [orderId, item.id, item.name, item.price, item.quantity]);

            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.id]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Commande créée avec succès !',
            reference: reference,
            orderId: orderId
        });
    } catch (err) {
        if (client) {
            try { await client.query('ROLLBACK'); } catch (_) { /* transaction already aborted */ }
        }
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la commande',
            error: err.message
        });
    } finally {
        if (client) client.release();
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

// ================================
// CHANGER LE STATUT D'UNE COMMANDE (admin)
// ================================
const VALID_STATUSES = ['pending', 'processing', 'transit', 'delivered', 'cancelled'];

const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Statut invalide (valeurs acceptées : ${VALID_STATUSES.join(', ')})`
        });
    }

    try {
        const result = await db.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Commande non trouvée' });
        }

        res.json({
            success: true,
            message: 'Statut mis à jour avec succès !',
            order: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut',
            error: err.message
        });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getMyOrders,
    getOrderByReference,
    updateOrderStatus
};