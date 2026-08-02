// ================================
// AFRISHOP — Admin Routes
// ================================

const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

// GET statistiques du tableau de bord — réservé aux admins — /api/admin/stats
router.get('/stats', auth, requireAdmin, getDashboardStats);

module.exports = router;
