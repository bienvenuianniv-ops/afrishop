// ================================
// AFRISHOP — Admin Routes
// ================================

const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const {
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser
} = require('../controllers/usersController');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

// GET statistiques du tableau de bord — réservé aux admins — /api/admin/stats
router.get('/stats', auth, requireAdmin, getDashboardStats);

// GET tous les clients — /api/admin/users
router.get('/users', auth, requireAdmin, getAllUsers);

// GET un client + ses commandes — /api/admin/users/5
router.get('/users/:id', auth, requireAdmin, getUserById);

// PATCH changer le rôle d'un client — /api/admin/users/5/role
router.patch('/users/:id/role', auth, requireAdmin, updateUserRole);

// DELETE supprimer un client — /api/admin/users/5
router.delete('/users/:id', auth, requireAdmin, deleteUser);

module.exports = router;
