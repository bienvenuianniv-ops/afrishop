// ================================
// AFRISHOP — Orders Routes
// ================================

const express = require('express');
const router = express.Router();
const {
    createOrder,
    getAllOrders,
    getOrderByReference
} = require('../controllers/ordersController');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { orderLookupLimiter } = require('../middleware/rateLimit');

// POST créer une commande — /api/orders
router.post('/', createOrder);

// GET toutes les commandes — réservé aux admins — /api/orders
router.get('/', auth, requireAdmin, getAllOrders);

// GET une commande par référence — /api/orders/:reference
router.get('/:reference', orderLookupLimiter, getOrderByReference);

module.exports = router;