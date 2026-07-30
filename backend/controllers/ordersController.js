// ================================
// AFRISHOP — Orders Controller
// ================================

const db = require('../config/database');
const crypto = require('crypto');

// ================================
// CRÉER UNE COMMANDE
// ================================
const createOrder = (req, res) => {
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

    // Lier la commande au compte connecté, s'il y en a un (checkout invité toujours possible)
    const userId = req.user ? req.user.id : null;

    // Recalculer les prix côté serveur à partir du catalogue —
    // ne jamais faire confiance aux prix envoyés par le client
    db.query('SELECT id, name, price FROM products WHERE id IN (?)', [productIds], (err, dbProducts) => {
        if (err) {
            console.error('Erreur createOrder (SELECT products) :', err.message);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur'
            });
        }

        const productById = {};
        dbProducts.forEach(p => { productById[p.id] = p; });

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

        const orderQuery = `
            INSERT INTO orders
            (reference, user_id, prenom, nom, email, telephone, pays, adresse,
             subtotal, delivery_price, discount, total, payment_method, delivery_method)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const orderParams = [
            reference, userId, prenom, nom, email, telephone,
            pays, adresse, subtotal, safeDeliveryPrice,
            safeDiscount, total, payment_method, delivery_method
        ];

        db.query(orderQuery, orderParams, (err2, result) => {
            if (err2) {
                console.error('Erreur createOrder (INSERT order) :', err2.message);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la création de la commande'
                });
            }

            const orderId = result.insertId;

            const itemsQuery = `
                INSERT INTO order_items (order_id, product_id, name, price, quantity)
                VALUES ?
            `;

            const itemsValues = verifiedItems.map(item => [
                orderId, item.id, item.name, item.price, item.quantity
            ]);

            db.query(itemsQuery, [itemsValues], (err3) => {
                if (err3) {
                    console.error('Erreur createOrder (INSERT items) :', err3.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Erreur lors de l\'enregistrement des articles'
                    });
                }

                res.status(201).json({
                    success: true,
                    message: 'Commande créée avec succès !',
                    reference: reference,
                    orderId: orderId
                });
            });
        });
    });
};

// ================================
// GET TOUTES LES COMMANDES (admin)
// ================================
const getAllOrders = (req, res) => {
    const query = `
        SELECT o.*, COUNT(oi.id) as items_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erreur getAllOrders :', err.message);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur'
            });
        }
        res.json({
            success: true,
            count: results.length,
            orders: results
        });
    });
};

// ================================
// GET MES COMMANDES (utilisateur connecté)
// ================================
const getMyOrders = (req, res) => {
    const query = `
        SELECT o.*, COUNT(oi.id) as items_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `;

    db.query(query, [req.user.id], (err, results) => {
        if (err) {
            console.error('Erreur getMyOrders :', err.message);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur'
            });
        }
        res.json({
            success: true,
            count: results.length,
            orders: results
        });
    });
};

// ================================
// GET UNE COMMANDE PAR REFERENCE
// ================================
const getOrderByReference = (req, res) => {
    const { reference } = req.params;

    db.query(
        'SELECT * FROM orders WHERE reference = ?',
        [reference],
        (err, results) => {
            if (err) {
                console.error('Erreur getOrderByReference :', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur serveur'
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Commande non trouvée'
                });
            }

            const order = results[0];

            db.query(
                'SELECT * FROM order_items WHERE order_id = ?',
                [order.id],
                (err2, items) => {
                    if (err2) {
                        console.error('Erreur getOrderByReference (items) :', err2.message);
                        return res.status(500).json({
                            success: false,
                            message: 'Erreur serveur'
                        });
                    }

                    res.json({
                        success: true,
                        order: { ...order, items }
                    });
                }
            );
        }
    );
};

module.exports = {
    createOrder,
    getAllOrders,
    getMyOrders,
    getOrderByReference
};
