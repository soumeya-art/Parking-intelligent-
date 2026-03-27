-- MOUBARIK Parking Djibouti - Schéma MySQL pour WAMP
-- Exécutez ce script dans phpMyAdmin (http://localhost/phpmyadmin)

CREATE DATABASE IF NOT EXISTS moubarik_parking;
USE moubarik_parking;

-- SystemePaiement
CREATE TABLE IF NOT EXISTS SystemePaiement (
  idSysteme INT AUTO_INCREMENT PRIMARY KEY,
  typeSysteme VARCHAR(50) NOT NULL
);

-- Tarif
CREATE TABLE IF NOT EXISTS Tarif (
  idTarif INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  montantHoraire DECIMAL(10,2) NOT NULL DEFAULT 0,
  montantJournalier DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- Administrateur
CREATE TABLE IF NOT EXISTS Administrateur (
  idAdmin INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  motDePasse VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conducteur
CREATE TABLE IF NOT EXISTS Conducteur (
  idConducteur INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  telephone VARCHAR(20),
  motDePasse VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Etablissement (GPS - parkings) — créé avant Place pour la FK
CREATE TABLE IF NOT EXISTS Etablissement (
  idEtablissement INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  adresse VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  placesDisponibles INT DEFAULT 0
);

-- Place
CREATE TABLE IF NOT EXISTS Place (
  idPlace INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(20) UNIQUE NOT NULL,
  localisation VARCHAR(255) NOT NULL,
  statut ENUM('available', 'occupied', 'reserved') DEFAULT 'available',
  idTarif INT,
  idEtablissement INT,
  FOREIGN KEY (idTarif) REFERENCES Tarif(idTarif),
  FOREIGN KEY (idEtablissement) REFERENCES Etablissement(idEtablissement)
);

-- Capteur
CREATE TABLE IF NOT EXISTS Capteur (
  idCapteur INT AUTO_INCREMENT PRIMARY KEY,
  idPlace INT UNIQUE NOT NULL,
  localisation VARCHAR(255),
  etat ENUM('empty', 'occupied') DEFAULT 'empty',
  derniereLecture TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (idPlace) REFERENCES Place(idPlace) ON DELETE CASCADE
);

-- Reservation
CREATE TABLE IF NOT EXISTS Reservation (
  idReservation INT AUTO_INCREMENT PRIMARY KEY,
  idConducteur INT,
  idPlace INT NOT NULL,
  idTarif INT,
  dateDebut DATETIME NOT NULL,
  dateFin DATETIME,
  montant DECIMAL(10,2) DEFAULT 0,
  statut ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'confirmed',
  FOREIGN KEY (idConducteur) REFERENCES Conducteur(idConducteur),
  FOREIGN KEY (idPlace) REFERENCES Place(idPlace),
  FOREIGN KEY (idTarif) REFERENCES Tarif(idTarif)
);

-- Paiement
CREATE TABLE IF NOT EXISTS Paiement (
  idPaiement INT AUTO_INCREMENT PRIMARY KEY,
  idReservation INT UNIQUE NOT NULL,
  idSysteme INT NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  dateP TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  methodePaiement VARCHAR(50),
  statut ENUM('pending', 'successful', 'failed', 'refunded') DEFAULT 'successful',
  FOREIGN KEY (idReservation) REFERENCES Reservation(idReservation) ON DELETE CASCADE,
  FOREIGN KEY (idSysteme) REFERENCES SystemePaiement(idSysteme)
);

-- Notification
CREATE TABLE IF NOT EXISTS Notification (
  idNotification INT AUTO_INCREMENT PRIMARY KEY,
  idConducteur INT,
  message TEXT NOT NULL,
  dateNotification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  typeNotification VARCHAR(50),
  lu TINYINT DEFAULT 0,
  FOREIGN KEY (idConducteur) REFERENCES Conducteur(idConducteur)
);

-- Données initiales - Moyens de paiement Djibouti (D-Money et Espèces uniquement)
INSERT INTO SystemePaiement (typeSysteme) VALUES 
  ('D-Money (Mobile Money)'), 
  ('Espèces (FDJ)');

INSERT INTO Tarif (description, montantHoraire, montantJournalier) VALUES
  ('Tarif standard - MOUBARIK Djibouti', 250, 3000);

-- Admin: admin@moubarik.dj / password
INSERT INTO Administrateur (nom, email, motDePasse) VALUES
  ('Admin MOUBARIK', 'admin@moubarik.dj', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Conducteur: user@moubarik.dj / password
INSERT INTO Conducteur (nom, prenom, email, telephone, motDePasse) VALUES
  ('Démo', 'Utilisateur', 'user@moubarik.dj', '+253 77 00 00 00', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Etablissements (parkings avec GPS) — avant Places pour les FK
INSERT INTO Etablissement (nom, adresse, latitude, longitude, placesDisponibles) VALUES
  ('MOUBARIK Centre', 'Place du 27 Juin, Djibouti', 11.5890, 43.1450, 45),
  ('MOUBARIK Ambouli', 'Avenue de l''Aéroport, Djibouti', 11.5590, 43.1390, 30),
  ('MOUBARIK PK12', 'Route de Dikhil, Djibouti', 11.5240, 43.0780, 25);

-- Places
INSERT INTO Place (numero, localisation, statut, idTarif) VALUES
  ('RDC-A1', 'Rez-de-chaussée Zone A', 'available', 1),
  ('RDC-A2', 'Rez-de-chaussée Zone A', 'available', 1),
  ('RDC-A3', 'Rez-de-chaussée Zone A', 'occupied', 1),
  ('RDC-A4', 'Rez-de-chaussée Zone A', 'reserved', 1),
  ('RDC-A5', 'Rez-de-chaussée Zone A', 'available', 1),
  ('RDC-B1', 'Rez-de-chaussée Zone B', 'occupied', 1),
  ('RDC-B2', 'Rez-de-chaussée Zone B', 'available', 1),
  ('RDC-B3', 'Rez-de-chaussée Zone B', 'available', 1),
  ('RDC-B4', 'Rez-de-chaussée Zone B', 'occupied', 1),
  ('RDC-B5', 'Rez-de-chaussée Zone B', 'available', 1),
  ('RDC-C1', 'Rez-de-chaussée Zone C', 'available', 1),
  ('RDC-C2', 'Rez-de-chaussée Zone C', 'occupied', 1),
  ('RDC-C3', 'Rez-de-chaussée Zone C', 'reserved', 1),
  ('RDC-C4', 'Rez-de-chaussée Zone C', 'available', 1),
  ('RDC-C5', 'Rez-de-chaussée Zone C', 'occupied', 1),
  ('B1-A1', 'Sous-sol 1 Zone A', 'available', 1),
  ('B1-A2', 'Sous-sol 1 Zone A', 'occupied', 1),
  ('B1-A3', 'Sous-sol 1 Zone A', 'reserved', 1),
  ('B1-A4', 'Sous-sol 1 Zone A', 'available', 1),
  ('B1-A5', 'Sous-sol 1 Zone A', 'occupied', 1),
  ('B1-B1', 'Sous-sol 1 Zone B', 'available', 1),
  ('B1-B2', 'Sous-sol 1 Zone B', 'available', 1),
  ('B1-B3', 'Sous-sol 1 Zone B', 'occupied', 1),
  ('B1-B4', 'Sous-sol 1 Zone B', 'available', 1),
  ('B1-B5', 'Sous-sol 1 Zone B', 'occupied', 1),
  ('B1-C1', 'Sous-sol 1 Zone C', 'occupied', 1),
  ('B1-C2', 'Sous-sol 1 Zone C', 'available', 1),
  ('B1-C3', 'Sous-sol 1 Zone C', 'available', 1),
  ('B1-C4', 'Sous-sol 1 Zone C', 'occupied', 1),
  ('B1-C5', 'Sous-sol 1 Zone C', 'available', 1),
  ('B2-A1', 'Sous-sol 2 Zone A', 'available', 1),
  ('B2-A2', 'Sous-sol 2 Zone A', 'occupied', 1),
  ('B2-A3', 'Sous-sol 2 Zone A', 'available', 1),
  ('B2-A4', 'Sous-sol 2 Zone A', 'reserved', 1),
  ('B2-A5', 'Sous-sol 2 Zone A', 'available', 1),
  ('B2-B1', 'Sous-sol 2 Zone B', 'occupied', 1),
  ('B2-B2', 'Sous-sol 2 Zone B', 'occupied', 1),
  ('B2-B3', 'Sous-sol 2 Zone B', 'available', 1),
  ('B2-B4', 'Sous-sol 2 Zone B', 'available', 1),
  ('B2-B5', 'Sous-sol 2 Zone B', 'occupied', 1),
  ('B2-C1', 'Sous-sol 2 Zone C', 'available', 1),
  ('B2-C2', 'Sous-sol 2 Zone C', 'occupied', 1),
  ('B2-C3', 'Sous-sol 2 Zone C', 'available', 1),
  ('B2-C4', 'Sous-sol 2 Zone C', 'available', 1),
  ('B2-C5', 'Sous-sol 2 Zone C', 'occupied', 1);

-- Lier places aux établissements (RDC->Centre, B1->Ambouli, B2->PK12)
UPDATE Place SET idEtablissement = 1 WHERE numero LIKE 'RDC-%';
UPDATE Place SET idEtablissement = 2 WHERE numero LIKE 'B1-%';
UPDATE Place SET idEtablissement = 3 WHERE numero LIKE 'B2-%';

-- Capteurs
INSERT INTO Capteur (idPlace, localisation, etat)
SELECT idPlace, localisation, IF(statut = 'available', 'empty', 'occupied') FROM Place;
