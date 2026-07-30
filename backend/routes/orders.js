// ================================
// AFRISHOP — Orders Routes
// ================================

const express = require('express');
const router = express.Router();
const {
    createOrder,
    getAllOrders,
    getMyOrders,
    getOrderByReference
} = require('../controllers/ordersController');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const optionalAuth = require('../middleware/optionalAuth');
const { orderLookupLimiter } = require('../middleware/rateLimit');

// POST créer une commande — lie la commande au compte si connecté — /api/orders
router.post('/', optionalAuth, createOrder);

// GET mes commandes (utilisateur connecté) — /api/orders/mine
router.get('/mine', auth, getMyOrders);

// GET toutes les commandes — réservé aux admins — /api/orders
router.get('/', auth, requireAdmin, getAllOrders);

// GET une commande par référence — /api/orders/AS-2025-12345
router.get('/:reference', orderLookupLimiter, getOrderByReference);

module.exports = router;
