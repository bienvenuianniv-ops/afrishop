// ================================
// AFRISHOP — Products Routes
// ================================

const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    getProductsByCategory,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productsController');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

// GET tous les produits — /api/products
router.get('/', getAllProducts);

// GET produits par catégorie — /api/products/category/tech
router.get('/category/:category', getProductsByCategory);

// GET un produit par ID — /api/products/1
router.get('/:id', getProductById);

// POST créer un produit — réservé aux admins — /api/products
router.post('/', auth, requireAdmin, createProduct);

// PUT modifier un produit — réservé aux admins — /api/products/1
router.put('/:id', auth, requireAdmin, updateProduct);

// DELETE supprimer un produit — réservé aux admins — /api/products/1
router.delete('/:id', auth, requireAdmin, deleteProduct);

module.exports = router;