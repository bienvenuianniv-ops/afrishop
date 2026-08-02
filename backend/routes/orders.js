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

// POST créer une commande — /api/orders
router.post('/', createOrder);

// GET toutes les commandes — /api/orders
router.get('/', getAllOrders);

// GET une commande par référence — /api/orders/:reference
router.get('/:reference', getOrderByReference);

module.exports = router;