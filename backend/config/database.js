// ================================
// AFRISHOP — Configuration Base de données
// ================================

const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Pool de connexions : reconnexion automatique, résiste aux coupures réseau
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'afrishop_db',
    charset: 'utf8mb4',
    connectionLimit: 10,
    waitForConnections: true
});

// Vérifier la connexion au démarrage
db.query('SELECT 1', (err) => {
    if (err) {
        console.error('❌ Erreur connexion base de données :', err.message);
        return;
    }
    console.log('✅ Base de données connectée !');
});

module.exports = db;
