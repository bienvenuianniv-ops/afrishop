-- ================================
-- AFRISHOP — Base de données
-- ================================

CREATE DATABASE IF NOT EXISTS afrishop_db;
USE afrishop_db;

-- ================================
-- TABLE UTILISATEURS
-- ================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prenom VARCHAR(100) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    mot_de_passe VARCHAR(255) NOT NULL,
    pays VARCHAR(100) DEFAULT 'Sénégal',
    adresse TEXT,
    points INT DEFAULT 0,
    niveau ENUM('bronze', 'argent', 'or', 'platine') DEFAULT 'bronze',
    role ENUM('client', 'admin') DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- TABLE PRODUITS
-- ================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category ENUM('tech', 'mode', 'beaute', 'food') NOT NULL,
    origin VARCHAR(255),
    emoji VARCHAR(10),
    badge VARCHAR(100),
    stock INT DEFAULT 0,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- TABLE COMMANDES
-- ================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    prenom VARCHAR(100) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    pays VARCHAR(100),
    adresse TEXT,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_price DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    delivery_method VARCHAR(100),
    status ENUM('pending', 'processing', 'transit', 'delivered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ================================
-- TABLE DETAILS COMMANDES
-- ================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ================================
-- TABLE FAVORIS
-- ================================
CREATE TABLE IF NOT EXISTS wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ================================
-- DONNÉES DE TEST — PRODUITS
-- ================================
INSERT INTO products (name, description, price, category, origin, emoji, badge, stock) VALUES
('Écouteurs sans fil', 'Écouteurs bluetooth haute qualité', 12500, 'tech', 'Import tendance', '🎧', 'Populaire', 50),
('Montre connectée', 'Montre intelligente multifonction', 35000, 'tech', 'Import', '⌚', 'Promo', 30),
('Chargeur rapide', 'Chargeur USB-C rapide 65W', 7500, 'tech', 'Import', '🔌', 'Nouveau', 100),
('T-shirt wax print', 'T-shirt 100% coton wax africain', 9000, 'mode', 'Artisan Dakar', '👕', 'Local', 40),
('Coque iPhone wax', 'Coque téléphone motif wax', 3500, 'mode', 'Artisan Dakar', '📱', 'Local', 60),
('Sneakers vintage', 'Sneakers style rétro tendance', 22000, 'mode', 'Import', '👟', 'Tendance', 25),
('Sac tissé africain', 'Sac main tissé à la main', 15000, 'mode', 'Dakar', '👜', 'Artisan', 20),
('Huile de baobab', 'Huile naturelle 100% pure', 8000, 'beaute', 'Sénégal', '🧴', 'Bio', 80),
('Savon karité', 'Savon naturel au beurre de karité', 1500, 'beaute', 'Sénégal', '🧼', 'Bio', 150),
('Bissap séché', 'Fleurs de bissap séchées naturelles', 2500, 'food', 'Casamance', '🌺', 'Naturel', 200),
('Épices thiéboudienne', 'Mélange épices pour thiéboudienne', 3500, 'food', 'Sénégal', '🌶️', 'Local', 120);