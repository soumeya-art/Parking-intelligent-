-- Migration: Ajout GPS (Etablissement) pour parkings
-- Exécutez dans phpMyAdmin si vous avez déjà la base

USE moubarik_parking;

CREATE TABLE IF NOT EXISTS Etablissement (
  idEtablissement INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  adresse VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  placesDisponibles INT DEFAULT 0
);

INSERT IGNORE INTO Etablissement (nom, adresse, latitude, longitude, placesDisponibles) VALUES
  ('MOUBARIK Centre', 'Place du 27 Juin, Djibouti', 11.5890, 43.1450, 45),
  ('MOUBARIK Ambouli', 'Avenue de l''Aéroport, Djibouti', 11.5590, 43.1390, 30),
  ('MOUBARIK PK12', 'Route de Dikhil, Djibouti', 11.5240, 43.0780, 25);
