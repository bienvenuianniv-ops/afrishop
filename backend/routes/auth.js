// ================================
// AFRISHOP — Auth Routes
// ================================

const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');

// POST inscription — /api/auth/register
router.post('/register', register);

// POST connexion — /api/auth/login
router.post('/login', login);

// GET profil — /api/auth/profile
router.get('/profile', auth, getProfile);

module.exports = router;