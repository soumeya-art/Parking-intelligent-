-- Modes de paiement Djibouti - D-Money et Espèces uniquement
USE moubarik_parking;

UPDATE SystemePaiement SET typeSysteme = 'D-Money (Mobile Money)' WHERE idSysteme = 1;
UPDATE SystemePaiement SET typeSysteme = 'Espèces (FDJ)' WHERE idSysteme = 2;
