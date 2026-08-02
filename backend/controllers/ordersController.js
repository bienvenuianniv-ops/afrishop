// ================================
// AFRISHOP — Orders Controller (PostgreSQL)
// ================================

const db = require('../config/database');

// ================================
// CRÉER UNE COMMANDE
// ================================
const createOrder = async (req, res) => {
    const {
        prenom, nom, email, telephone,
        pays, adresse, subtotal,
        delivery_price, discount, total,
        payment_method, delivery_method,
        items
    } = req.body;

    if (!prenom || !nom || !email || !adresse || !items || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Veuillez remplir tous les champs obligatoires'
        });
    }

    const reference = '#AS-' + new Date().getFullYear() + '-' +
        Math.floor(10000 + Math.random() * 90000);

    try {
        // Insérer la commande
        const orderResult = await db.query(`
            INSERT INTO orders 
            (reference, prenom, nom, email, telephone, pays, adresse, 
             subtotal, delivery_price, discount, total, payment_method, delivery_method)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id
        `, [reference, prenom, nom, email, telephone,
            pays, adresse, subtotal, delivery_price,
            discount, total, payment_method, delivery_method]);

        const orderId = orderResult.rows[0].id;

        // Insérer les articles
        for (const item of items) {
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
    getOrderByReference
};