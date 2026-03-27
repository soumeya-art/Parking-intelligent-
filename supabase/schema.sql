-- Schéma MOUBARIK Parking Djibouti - Basé sur le diagramme UML
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- ========== SUPPRIMER LES ANCIENNES TABLES (si migration) ==========
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS spots CASCADE;
DROP TABLE IF EXISTS floors CASCADE;

-- ========== TABLES SELON LE DIAGRAMME UML ==========

-- SystemePaiement (doit exister avant Paiement)
CREATE TABLE SystemePaiement (
  idSysteme SERIAL PRIMARY KEY,
  typeSysteme TEXT NOT NULL
);

-- Tarif
CREATE TABLE Tarif (
  idTarif SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  montantHoraire DECIMAL(10,2) NOT NULL DEFAULT 0,
  montantJournalier DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- Administrateur
CREATE TABLE Administrateur (
  idAdmin SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);

-- Conducteur
CREATE TABLE Conducteur (
  idConducteur SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telephone TEXT
);

-- Place (remplace spots - numero = RDC-A1, localisation = étage/zone)
CREATE TABLE Place (
  idPlace SERIAL PRIMARY KEY,
  numero TEXT UNIQUE NOT NULL,
  localisation TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'available' CHECK (statut IN ('available', 'occupied', 'reserved')),
  idTarif INT REFERENCES Tarif(idTarif)
);

-- Capteur (1 capteur par place)
CREATE TABLE Capteur (
  idCapteur SERIAL PRIMARY KEY,
  idPlace INT UNIQUE NOT NULL REFERENCES Place(idPlace) ON DELETE CASCADE,
  localisation TEXT,
  etat TEXT NOT NULL DEFAULT 'empty' CHECK (etat IN ('empty', 'occupied')),
  derniereLecture TIMESTAMPTZ DEFAULT NOW()
);

-- Reservation
CREATE TABLE Reservation (
  idReservation SERIAL PRIMARY KEY,
  idConducteur INT REFERENCES Conducteur(idConducteur),
  idPlace INT NOT NULL REFERENCES Place(idPlace),
  idTarif INT REFERENCES Tarif(idTarif),
  dateDebut TIMESTAMPTZ NOT NULL,
  dateFin TIMESTAMPTZ,
  montant DECIMAL(10,2) DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'confirmed' CHECK (statut IN ('pending', 'confirmed', 'cancelled'))
);

-- Paiement (1 paiement par réservation)
CREATE TABLE Paiement (
  idPaiement SERIAL PRIMARY KEY,
  idReservation INT UNIQUE NOT NULL REFERENCES Reservation(idReservation) ON DELETE CASCADE,
  idSysteme INT NOT NULL REFERENCES SystemePaiement(idSysteme),
  montant DECIMAL(10,2) NOT NULL,
  dateP TIMESTAMPTZ DEFAULT NOW(),
  methodePaiement TEXT,
  statut TEXT NOT NULL DEFAULT 'successful' CHECK (statut IN ('pending', 'successful', 'failed', 'refunded'))
);

-- Notification
CREATE TABLE Notification (
  idNotification SERIAL PRIMARY KEY,
  idConducteur INT REFERENCES Conducteur(idConducteur),
  message TEXT NOT NULL,
  dateNotification TIMESTAMPTZ DEFAULT NOW(),
  typeNotification TEXT
);

-- ========== DONNÉES INITIALES - MOUBARIK Parking Djibouti ==========

INSERT INTO SystemePaiement (typeSysteme) VALUES ('MOUBARIK'), ('Stripe'), ('PayPal');

INSERT INTO Tarif (description, montantHoraire, montantJournalier) VALUES
  ('Tarif standard - MOUBARIK Djibouti', 500, 3000);

INSERT INTO Administrateur (nom, email) VALUES
  ('siman MOUBARIK', 'siman@moubarik-djibouti.dj');

INSERT INTO Conducteur (nom, prenom, email, telephone) VALUES
  ('sihan', 'Utilisateur', 'sihan@moubarik.dj', '+253 77 06 12 34');

-- Places (numero = identifiant type RDC-A1, localisation = étage)
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

-- Capteurs pour chaque place
INSERT INTO Capteur (idPlace, localisation, etat)
SELECT idPlace, localisation, 
  CASE WHEN statut = 'available' THEN 'empty' ELSE 'occupied' END 
FROM Place;

-- RLS (Row Level Security)
ALTER TABLE Place ENABLE ROW LEVEL SECURITY;
ALTER TABLE Reservation ENABLE ROW LEVEL SECURITY;
ALTER TABLE Conducteur ENABLE ROW LEVEL SECURITY;
ALTER TABLE Paiement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture Place" ON Place;
CREATE POLICY "Lecture Place" ON Place FOR SELECT USING (true);

DROP POLICY IF EXISTS "Update Place" ON Place;
CREATE POLICY "Update Place" ON Place FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Lecture Reservation" ON Reservation;
CREATE POLICY "Lecture Reservation" ON Reservation FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert Reservation" ON Reservation;
CREATE POLICY "Insert Reservation" ON Reservation FOR INSERT WITH CHECK (true);
