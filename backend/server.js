// ================================
// AFRISHOP — Serveur Principal
// ================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config();

// Sans secret JWT, tous les tokens seraient signés/vérifiés avec une valeur
// devinable — refuser de démarrer plutôt que de servir une auth cassée.
if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET manquant. Définissez-le dans les variables d\'environnement avant de démarrer le serveur.');
    process.exit(1);
}

// Créer l'application Express
const app = express();

// ================================
// MIDDLEWARES
// ================================
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Pas d'origine (même origine, curl, appel serveur à serveur) : autorisé
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0) {
            // Aucune liste configurée : permissif en dev, restrictif en prod
            return callback(null, process.env.NODE_ENV !== 'production');
        }
        callback(null, allowedOrigins.includes(origin));
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques du frontend et de l'espace admin
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// ================================
// ROUTES API
// ================================
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// ================================
// ROUTE DE TEST
// ================================
app.get('/api', (req, res) => {
    res.json({
        message: '🌍 Bienvenue sur AfriShop API !',
        version: '1.0.0',
        status: 'En ligne',
        endpoints: {
            products: '/api/products',
            orders: '/api/orders',
            auth: '/api/auth'
        }
    });
});

// ================================
// ROUTE FRONTEND
// ================================
// ROUTE FRONTEND
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ================================
// DÉMARRER LE SERVEUR
// ================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ AfriShop server démarré sur http://localhost:${PORT}`);
    console.log(`📦 API disponible sur http://localhost:${PORT}/api`);
});