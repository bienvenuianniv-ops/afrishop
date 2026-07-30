USE afrishop_db;
SET NAMES utf8mb4;
SET character_set_client = utf8mb4;

UPDATE products SET emoji = CONVERT('🎧' USING utf8mb4) WHERE id = 1;
UPDATE products SET emoji = CONVERT('⌚' USING utf8mb4) WHERE id = 2;
UPDATE products SET emoji = CONVERT('🔌' USING utf8mb4) WHERE id = 3;
UPDATE products SET emoji = CONVERT('👕' USING utf8mb4) WHERE id = 4;
UPDATE products SET emoji = CONVERT('📱' USING utf8mb4) WHERE id = 5;
UPDATE products SET emoji = CONVERT('👟' USING utf8mb4) WHERE id = 6;
UPDATE products SET emoji = CONVERT('👜' USING utf8mb4) WHERE id = 7;
UPDATE products SET emoji = CONVERT('🧴' USING utf8mb4) WHERE id = 8;
UPDATE products SET emoji = CONVERT('🧼' USING utf8mb4) WHERE id = 9;
UPDATE products SET emoji = CONVERT('🌺' USING utf8mb4) WHERE id = 10;
UPDATE products SET emoji = CONVERT('🌶' USING utf8mb4) WHERE id = 11;