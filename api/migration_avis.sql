-- Table Avis (évaluations après session)
CREATE TABLE IF NOT EXISTS Avis (
  idAvis INT AUTO_INCREMENT PRIMARY KEY,
  idReservation INT NOT NULL,
  idConducteur INT NOT NULL,
  note INT NOT NULL CHECK (note >= 1 AND note <= 5),
  commentaire TEXT,
  dateAvis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_reservation (idReservation),
  FOREIGN KEY (idReservation) REFERENCES Reservation(idReservation) ON DELETE CASCADE,
  FOREIGN KEY (idConducteur) REFERENCES Conducteur(idConducteur)
);
