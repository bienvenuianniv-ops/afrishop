// ================================
// AFRISHOP — Auth Routes
// ================================

const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

// POST inscription — /api/auth/register
router.post('/register', authLimiter, register);

// POST connexion — /api/auth/login
router.post('/login', authLimiter, login);

// GET profil — /api/auth/profile
router.get('/profile', auth, getProfile);

// PUT profil — /api/auth/profile
router.put('/profile', auth, updateProfile);

module.exports = router;