-- Modes de paiement Djibouti - D-Money, MStarCard, etc.
USE moubarik_parking;

UPDATE SystemePaiement SET typeSysteme = 'D-Money' WHERE idSysteme = 1;
UPDATE SystemePaiement SET typeSysteme = 'MStarCard' WHERE idSysteme = 2;
UPDATE SystemePaiement SET typeSysteme = 'Espèces' WHERE idSysteme = 3;
INSERT IGNORE INTO SystemePaiement (idSysteme, typeSysteme) VALUES (4, 'Carte bancaire');
