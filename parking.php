<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $input['action'] ?? '';

function respond($data) {
    echo json_encode($data);
    exit;
}

function getToken() {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (strpos($auth, 'Bearer ') === 0) return substr($auth, 7);
    return null;
}

function getTokenFromInput($input) {
    return $input['token'] ?? $input['access_token'] ?? null;
}

// Stats parking
if ($action === 'stats' || ($method === 'GET' && !$action)) {
    $stmt = $pdo->query("SELECT statut, COUNT(*) as count FROM Place GROUP BY statut");
    $counts = ['available' => 0, 'occupied' => 0, 'reserved' => 0];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $counts[$row['statut']] = (int)$row['count'];
    }
    $total = array_sum($counts);
    respond([
        'total' => $total,
        'available' => $counts['available'],
        'occupied' => $counts['occupied'],
        'reserved' => $counts['reserved']
    ]);
}

// Liste des places
if ($action === 'places') {
    $stmt = $pdo->query("SELECT idPlace, numero, localisation, statut FROM Place ORDER BY numero");
    $places = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $parts = explode('-', $row['numero']);
        $places[] = [
            'id' => $row['numero'],
            'idPlace' => (int)$row['idPlace'],
            'numero' => $row['numero'],
            'floor' => $parts[0] ?? '',
            'zone' => $parts[1][0] ?? '',
            'localisation' => $row['localisation'],
            'status' => $row['statut']
        ];
    }
    respond($places);
}

// Étages
if ($action === 'floors') {
    $stmt = $pdo->query("SELECT numero, statut FROM Place");
    $floors = ['RDC' => ['total' => 0, 'available' => 0], 'B1' => ['total' => 0, 'available' => 0], 'B2' => ['total' => 0, 'available' => 0]];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $parts = explode('-', $row['numero']);
        $floor = $parts[0] ?? 'RDC';
        if (isset($floors[$floor])) {
            $floors[$floor]['total']++;
            if ($row['statut'] === 'available') $floors[$floor]['available']++;
        }
    }
    $names = ['RDC' => 'Rez-de-chaussée', 'B1' => 'Sous-sol 1', 'B2' => 'Sous-sol 2'];
    $result = [];
    foreach ($floors as $id => $data) {
        $result[] = ['id' => $id, 'name' => $names[$id], 'total' => $data['total'], 'available' => $data['available']];
    }
    respond($result);
}

// Réservations (avec filtre conducteur si token)
if ($action === 'reservations') {
    $token = getToken();
    $userId = null;
    if ($token) {
        $data = json_decode(base64_decode($token), true);
        if ($data && $data['role'] === 'conducteur') $userId = $data['id'];
    }

    $sql = "SELECT r.*, p.numero FROM Reservation r JOIN Place p ON r.idPlace = p.idPlace";
    if ($userId) $sql .= " WHERE r.idConducteur = ?";
    $sql .= " ORDER BY r.dateDebut DESC";
    
    $stmt = $userId ? $pdo->prepare($sql) : $pdo->query($sql);
    if ($userId) $stmt->execute([$userId]);
    
    $reservations = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $debut = new DateTime($row['dateDebut']);
        $fin = $row['dateFin'] ? new DateTime($row['dateFin']) : null;
        $duration = '—';
        if ($fin) {
            $diff = $debut->diff($fin);
            $duration = $diff->h . 'h' . ($diff->i ? $diff->i : '');
        }
        $reservations[] = [
            'id' => (int)$row['idReservation'],
            'spot' => $row['numero'],
            'date' => $debut->format('d/m/Y'),
            'startTime' => $debut->format('H:i'),
            'endTime' => $fin ? $fin->format('H:i') : '—',
            'duration' => $duration,
            'montant' => (float)$row['montant'],
            'status' => strtotime($row['dateDebut']) >= strtotime('today') ? 'à venir' : 'terminée'
        ];
    }
    respond($reservations);
}

// Créer réservation avec paiement
if ($action === 'reserve' && $method === 'POST') {
    $token = getToken() ?? getTokenFromInput($input);
    $data = null;
    if ($token) {
        $data = json_decode(base64_decode($token), true);
    }
    if (!$data || $data['role'] !== 'conducteur') {
        $stmt = $pdo->query("SELECT idConducteur FROM Conducteur LIMIT 1");
        $conducteur = $stmt->fetch(PDO::FETCH_ASSOC);
        $data = $conducteur ? ['id' => $conducteur['idConducteur'], 'role' => 'conducteur'] : null;
    }
    if (!$data) respond(['success' => false, 'error' => 'Aucun conducteur trouvé. Inscrivez-vous d\'abord.']);

    $spotId = $input['spotId'] ?? '';
    $date = $input['date'] ?? '';
    $time = $input['time'] ?? '';
    $montant = (float)($input['montant'] ?? 0);
    $idSysteme = (int)($input['idSysteme'] ?? 1);
    $typeDuree = $input['typeDuree'] ?? 'horaire';
    $dureeHeures = (float)($input['dureeHeures'] ?? 1);

    if (!$spotId || !$date || !$time) respond(['success' => false, 'error' => 'Données incomplètes']);

    $stmt = $pdo->prepare("SELECT idPlace FROM Place WHERE numero = ? AND statut = 'available'");
    $stmt->execute([$spotId]);
    $place = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$place) respond(['success' => false, 'error' => 'Place non disponible']);

    $stmt = $pdo->query("SELECT montantHoraire, montantJournalier FROM Tarif WHERE idTarif = 1");
    $tarif = $stmt->fetch(PDO::FETCH_ASSOC);
    $montantHoraire = $tarif ? (float)($tarif['montantHoraire'] ?? 500) : 500;
    $montantJournalier = $tarif ? (float)($tarif['montantJournalier'] ?? 3000) : 3000;
    $montantCalcule = $typeDuree === 'journalier' ? $montantJournalier : $montantHoraire * $dureeHeures;
    if ($montant <= 0) $montant = $montantCalcule;

    $heureFormat = (strlen($time) <= 5) ? $time . ':00' : $time;
    $dateDebut = $date . ' ' . $heureFormat;
    $dateFin = null;
    if ($dureeHeures > 0) {
        $dt = new DateTime($dateDebut);
        $dt->modify('+' . round($dureeHeures * 60) . ' minutes');
        $dateFin = $dt->format('Y-m-d H:i:s');
    }

    $methodeNom = ['', 'D-Money', 'MStarCard', 'Espèces', 'Carte bancaire'][$idSysteme] ?? 'D-Money';

    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("INSERT INTO Reservation (idConducteur, idPlace, idTarif, dateDebut, dateFin, montant, statut) VALUES (?, ?, 1, ?, ?, ?, 'pending')");
        $stmt->execute([$data['id'], $place['idPlace'], $dateDebut, $dateFin, $montant]);
        $idReservation = $pdo->lastInsertId();

        $pdo->prepare("UPDATE Place SET statut = 'reserved' WHERE idPlace = ?")->execute([$place['idPlace']]);
        
        try {
            $stmt = $pdo->prepare("INSERT INTO Paiement (idReservation, idSysteme, montant, methodePaiement, statut) VALUES (?, ?, ?, ?, 'pending')");
            $stmt->execute([$idReservation, $idSysteme ?: 1, $montant, $methodeNom]);
        } catch (Exception $e) {
        }

        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['success' => false, 'error' => 'Erreur: ' . $e->getMessage()]);
    }

    respond(['success' => true, 'message' => 'Réservation enregistrée. En attente de confirmation du paiement par l\'admin.']);
}

// Tarifs publics (pour afficher les prix)
if ($action === 'tarifs-public') {
    try {
        $stmt = $pdo->query("SELECT * FROM Tarif");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond(!empty($rows) ? $rows : [['idTarif' => 1, 'montantHoraire' => 500, 'montantJournalier' => 3000]]);
    } catch (Exception $e) {
        respond([['idTarif' => 1, 'montantHoraire' => 500, 'montantJournalier' => 3000]]);
    }
}

// Moyens de paiement (Djibouti)
if ($action === 'systemes-paiement') {
    try {
        $stmt = $pdo->query("SELECT * FROM SystemePaiement");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond(!empty($rows) ? $rows : [
            ['idSysteme' => 1, 'typeSysteme' => 'D-Money'],
            ['idSysteme' => 2, 'typeSysteme' => 'MStarCard'],
            ['idSysteme' => 3, 'typeSysteme' => 'Espèces'],
            ['idSysteme' => 4, 'typeSysteme' => 'Carte bancaire']
        ]);
    } catch (Exception $e) {
        respond([
            ['idSysteme' => 1, 'typeSysteme' => 'D-Money'],
            ['idSysteme' => 2, 'typeSysteme' => 'MStarCard'],
            ['idSysteme' => 3, 'typeSysteme' => 'Espèces'],
            ['idSysteme' => 4, 'typeSysteme' => 'Carte bancaire']
        ]);
    }
}

// Etablissements avec GPS (parkings)
if ($action === 'etablissements') {
    try {
        $stmt = $pdo->query("SELECT * FROM Etablissement");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $rows = [];
    }
    if (empty($rows)) {
        respond([
            ['idEtablissement' => 1, 'nom' => 'MOUBARIK Centre', 'adresse' => 'Place du 27 Juin, Djibouti', 'latitude' => 11.5890, 'longitude' => 43.1450, 'placesDisponibles' => 45],
            ['idEtablissement' => 2, 'nom' => 'MOUBARIK Ambouli', 'adresse' => "Avenue de l'Aéroport, Djibouti", 'latitude' => 11.5590, 'longitude' => 43.1390, 'placesDisponibles' => 30],
            ['idEtablissement' => 3, 'nom' => 'MOUBARIK PK12', 'adresse' => 'Route de Dikhil, Djibouti', 'latitude' => 11.5240, 'longitude' => 43.0780, 'placesDisponibles' => 25]
        ]);
    } else {
        respond($rows);
    }
}

// === ADMIN ===
// Tarifs (admin)
if ($action === 'tarifs') {
    $token = getToken();
    $data = $token ? json_decode(base64_decode($token), true) : null;
    if (!$data || $data['role'] !== 'admin') {
        http_response_code(401);
        respond(['error' => 'Non autorisé']);
    }
    try {
        $stmt = $pdo->query("SELECT * FROM Tarif");
        respond($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        respond([['idTarif' => 1, 'description' => 'Tarif standard', 'montantHoraire' => 500, 'montantJournalier' => 3000]]);
    }
}

// Modifier tarif (admin)
if ($action === 'tarif-update' && $method === 'POST') {
    $token = getToken();
    $data = $token ? json_decode(base64_decode($token), true) : null;
    if (!$data || $data['role'] !== 'admin') {
        http_response_code(401);
        respond(['error' => 'Non autorisé']);
    }
    $id = (int)($input['id'] ?? $input['idTarif'] ?? 0);
    $horaire = (float)($input['montantHoraire'] ?? 0);
    $journalier = (float)($input['montantJournalier'] ?? 0);
    if ($id) {
        $pdo->prepare("UPDATE Tarif SET montantHoraire=?, montantJournalier=? WHERE idTarif=?")->execute([$horaire, $journalier, $id]);
    }
    respond(['success' => true]);
}

// Modifier place (admin)
if ($action === 'place-update' && $method === 'POST') {
    $token = getToken();
    $data = $token ? json_decode(base64_decode($token), true) : null;
    if (!$data || $data['role'] !== 'admin') respond(['error' => 'Non autorisé']);
    $id = (int)($input['idPlace'] ?? 0);
    $statut = $input['statut'] ?? '';
    if ($id && in_array($statut, ['available', 'occupied', 'reserved'])) {
        $pdo->prepare("UPDATE Place SET statut=? WHERE idPlace=?")->execute([$statut, $id]);
        $pdo->prepare("UPDATE Capteur SET etat=? WHERE idPlace=?")->execute([$statut === 'available' ? 'empty' : 'occupied', $id]);
    }
    respond(['success' => true]);
}

// Paiements en attente (admin)
if ($action === 'paiements-en-attente') {
    $token = getToken();
    $data = $token ? json_decode(base64_decode($token), true) : null;
    if (!$data || $data['role'] !== 'admin') {
        http_response_code(401);
        respond(['error' => 'Non autorisé']);
    }
    $stmt = $pdo->query("
        SELECT p.idPaiement, p.idReservation, p.montant, p.methodePaiement, p.dateP, p.statut,
               r.dateDebut, pl.numero, c.nom, c.prenom, c.telephone
        FROM Paiement p
        JOIN Reservation r ON p.idReservation = r.idReservation
        JOIN Place pl ON r.idPlace = pl.idPlace
        LEFT JOIN Conducteur c ON r.idConducteur = c.idConducteur
        WHERE p.statut = 'pending'
        ORDER BY p.dateP DESC
    ");
    respond($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Confirmer paiement (admin)
if ($action === 'confirmer-paiement' && $method === 'POST') {
    $token = getToken();
    $data = $token ? json_decode(base64_decode($token), true) : null;
    if (!$data || $data['role'] !== 'admin') {
        http_response_code(401);
        respond(['error' => 'Non autorisé']);
    }
    $idPaiement = (int)($input['idPaiement'] ?? 0);
    if (!$idPaiement) respond(['success' => false, 'error' => 'ID manquant']);
    
    $stmt = $pdo->prepare("UPDATE Paiement SET statut = 'successful' WHERE idPaiement = ? AND statut = 'pending'");
    $stmt->execute([$idPaiement]);
    if ($stmt->rowCount() > 0) {
        $stmt = $pdo->prepare("SELECT idReservation FROM Paiement WHERE idPaiement = ?");
        $stmt->execute([$idPaiement]);
        $r = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($r) {
            $pdo->prepare("UPDATE Reservation SET statut = 'confirmed' WHERE idReservation = ?")->execute([$r['idReservation']]);
        }
    }
    respond(['success' => true, 'message' => 'Paiement confirmé']);
}

// Rapport (admin)
if ($action === 'rapport') {
    $token = getToken();
    $data = $token ? json_decode(base64_decode($token), true) : null;
    if (!$data || $data['role'] !== 'admin') respond(['error' => 'Non autorisé']);
    $stmt = $pdo->query("SELECT COUNT(*) as total, SUM(CASE WHEN statut='available' THEN 1 ELSE 0 END) as dispo FROM Place");
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt = $pdo->query("SELECT COUNT(*) as nb FROM Reservation WHERE DATE(dateDebut) = CURDATE()");
    $reservationsToday = $stmt->fetch(PDO::FETCH_ASSOC)['nb'];
    $stmt = $pdo->query("SELECT COALESCE(SUM(montant), 0) as total FROM Paiement WHERE DATE(dateP) = CURDATE()");
    $revenueToday = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    respond([
        'placesTotal' => (int)$stats['total'],
        'placesDispo' => (int)$stats['dispo'],
        'reservationsToday' => (int)$reservationsToday,
        'revenueToday' => (float)$revenueToday
    ]);
}

respond(['error' => 'Action inconnue']);
