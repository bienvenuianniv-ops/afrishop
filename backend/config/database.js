// ================================
// AFRISHOP — Configuration Base de données PostgreSQL
// ================================

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erreur connexion base de données :', err.message);
        return;
    }
    release();
    console.log('✅ Base de données PostgreSQL connectée !');
});

// Sans ce handler, une déconnexion d'un client inactif (courant avec Neon,
// qui ferme les connexions idle) fait planter tout le process Node.
pool.on('error', (err) => {
    console.error('⚠️ Erreur inattendue sur le pool PostgreSQL :', err.message);
});

module.exports = pool;