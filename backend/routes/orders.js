// ================================
// AFRISHOP — Orders Routes
// ================================

const express = require('express');
const router = express.Router();
const {
    createOrder,
    getAllOrders,
    getMyOrders,
    getOrderByReference,
    updateOrderStatus
} = require('../controllers/ordersController');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const optionalAuth = require('../middleware/optionalAuth');
const { orderLookupLimiter } = require('../middleware/rateLimit');

// POST créer une commande — lie la commande au compte si connecté — /api/orders
router.post('/', optionalAuth, createOrder);

// GET mes commandes (utilisateur connecté) — /api/orders/mine
// Doit être déclarée avant /:reference pour ne pas être capturée par cette route
router.get('/mine', auth, getMyOrders);

// GET toutes les commandes — réservé aux admins — /api/orders
router.get('/', auth, requireAdmin, getAllOrders);

// PATCH changer le statut d'une commande — réservé aux admins — /api/orders/6/status
router.patch('/:id/status', auth, requireAdmin, updateOrderStatus);

// GET une commande par référence — /api/orders/:reference
router.get('/:reference', orderLookupLimiter, getOrderByReference);

module.exports = router;