-- MOUBARIK Parking - Migrations
-- Exécutez ce script si votre base existe déjà (phpMyAdmin ou mysql)

USE moubarik_parking;

-- 1. Mot de passe oublié
CREATE TABLE IF NOT EXISTS password_reset (
  email VARCHAR(150) NOT NULL PRIMARY KEY,
  token VARCHAR(64) NOT NULL,
  expires DATETIME NOT NULL,
  INDEX idx_token (token)
);

-- 2. Lier Place à Etablissement (choix de parking)
-- Exécuter si la colonne n'existe pas encore (erreur 1060 = colonne existe déjà, ignorer)
ALTER TABLE Place ADD COLUMN idEtablissement INT NULL AFTER idTarif;

-- Assignation des places aux établissements (RDC->Centre, B1->Ambouli, B2->PK12)
UPDATE Place SET idEtablissement = 1 WHERE numero LIKE 'RDC-%';
UPDATE Place SET idEtablissement = 2 WHERE numero LIKE 'B1-%';
UPDATE Place SET idEtablissement = 3 WHERE numero LIKE 'B2-%';
