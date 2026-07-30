// ================================
// AFRISHOP — Products Routes
// ================================

const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    getProductsByCategory
} = require('../controllers/productsController');

// GET tous les produits — /api/products
router.get('/', getAllProducts);

// GET un produit par ID — /api/products/1
router.get('/:id', getProductById);

// GET produits par catégorie — /api/products/category/tech
router.get('/category/:category', getProductsByCategory);

module.exports = router;