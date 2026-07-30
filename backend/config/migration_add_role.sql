-- ================================
-- AFRISHOP — Migration : ajout du rôle admin
-- À exécuter une seule fois sur une base afrishop_db déjà existante.
-- ================================

ALTER TABLE users
    ADD COLUMN role ENUM('client', 'admin') DEFAULT 'client' AFTER niveau;

-- Ensuite, promouvoir votre propre compte en admin (remplacez l'email) :
-- UPDATE users SET role = 'admin' WHERE email = 'votre_email@exemple.com';
