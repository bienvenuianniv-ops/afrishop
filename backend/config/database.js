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

module.exports = pool;