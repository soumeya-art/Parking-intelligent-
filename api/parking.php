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

// Synchroniser Place.statut avec les réservations actives (temps réel)
// occupied = chrono en cours (voiture sur place) | reserved = en attente d'arrivée
function syncPlaceStatut($pdo) {
    try {
        $stmt = $pdo->query("SELECT idPlace, statut FROM Reservation WHERE dateFin IS NULL AND statut IN ('pending','confirmed')");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $occupiedIds = [];
        $reservedIds = [];
        foreach ($rows as $r) {
            if ($r['statut'] === 'confirmed') $occupiedIds[] = $r['idPlace'];
            else $reservedIds[] = $r['idPlace'];
        }
        if (!empty($occupiedIds)) {
            $ph = implode(',', array_map('intval', $occupiedIds));
            $pdo->exec("UPDATE Place SET statut = 'occupied' WHERE idPlace IN ($ph)");
        }
        if (!empty($reservedIds)) {
            $ph = implode(',', array_map('intval', $reservedIds));
            $pdo->exec("UPDATE Place SET statut = 'reserved' WHERE idPlace IN ($ph)");
        }
        $activeIds = array_merge($occupiedIds, $reservedIds);
        $stmt = $pdo->query("SELECT idPlace, statut FROM Place WHERE statut IN ('occupied','reserved')");
        $toFree = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (!in_array($row['idPlace'], $activeIds)) $toFree[] = $row['idPlace'];
        }
        if (!empty($toFree)) {
            $ph = implode(',', array_map('intval', $toFree));
            $pdo->exec("UPDATE Place SET statut = 'available' WHERE idPlace IN ($ph)");
        }
    } catch (Exception $e) { /* ignorer */ }
}

// Stats parking
if ($action === 'stats' || ($method === 'GET' && !$action)) {
    syncPlaceStatut($pdo);
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

// Liste des places (idEtablissement, date optionnels : exclut les places réservées pour la date)
if ($action === 'places') {
    syncPlaceStatut($pdo);
    $idEtablissement = isset($_GET['idEtablissement']) ? (int)$_GET['idEtablissement'] : null;
    $date = isset($_GET['date']) ? trim($_GET['date']) : null;

    // Libérer les places : réservations pending > 15 min ET sessions actives > 24h
    try {
        $stmtExp = $pdo->query("SELECT r.idReservation, r.idPlace FROM Reservation r
            WHERE r.dateFin IS NULL AND (
                (r.statut = 'pending' AND r.dateDebut < NOW() - INTERVAL 15 MINUTE)
                OR (r.statut = 'confirmed' AND r.dateDebut < NOW() - INTERVAL 24 HOUR)
            )");
        $expiredRows = $stmtExp->fetchAll(PDO::FETCH_ASSOC);
        if (!empty($expiredRows)) {
            $ids = array_column($expiredRows, 'idPlace');
            $ph = implode(',', array_fill(0, count($ids), '?'));
            $pdo->prepare("UPDATE Place SET statut = 'available' WHERE idPlace IN ($ph)")->execute($ids);
            $rids = array_column($expiredRows, 'idReservation');
            $ph2 = implode(',', array_fill(0, count($rids), '?'));
            $pdo->prepare("UPDATE Reservation SET statut = 'cancelled' WHERE idReservation IN ($ph2)")->execute($rids);
        }
    } catch (Exception $e) { /* ignorer */ }

    $sql = "SELECT p.idPlace, p.numero, p.localisation, p.statut FROM Place p WHERE 1=1";
    $params = [];
    if ($idEtablissement) {
        $sql .= " AND (p.idEtablissement = ? OR p.idEtablissement IS NULL)";
        $params[] = $idEtablissement;
    }
    if ($date) {
        $sql .= " AND p.idPlace NOT IN (SELECT idPlace FROM Reservation WHERE DATE(dateDebut) = ? AND statut IN ('pending','confirmed'))";
        $params[] = $date;
    }
    $sql .= " ORDER BY p.numero";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
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

// Session active (conducteur) — réservation en attente OU chrono en cours
if ($action === 'session-active') {
    $token = getToken();
    $data = $token ? json_decode(base64_decode($token), true) : null;
    if (!$data || $data['role'] !== 'conducteur') {
        respond(['active' => false, 'pending' => false]);
    }
    // Chrono en cours (statut confirmed)
    $stmt = $pdo->prepare("SELECT r.idReservation, r.dateDebut, r.montant, pl.numero as spot FROM Reservation r JOIN Place pl ON r.idPlace = pl.idPlace WHERE r.idConducteur = ? AND r.dateFin IS NULL AND r.statut = 'confirmed'");
    $stmt->execute([$data['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        respond(['active' => true, 'pending' => false, 'idReservation' => (int)$row['idReservation'], 'dateDebut' => $row['dateDebut'], 'spot' => $row['spot']]);
    }
    // Réservation en attente (statut pending) — 15 min pour arriver
    $stmt = $pdo->prepare("SELECT r.idReservation, r.dateDebut, pl.numero as spot FROM Reservation r JOIN Place pl ON r.idPlace = pl.idPlace WHERE r.idConducteur = ? AND r.dateFin IS NULL AND r.statut = 'pending'");
    $stmt->execute([$data['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $expiresAt = (new DateTime($row['dateDebut']))->modify('+15 minutes')->format('c');
        respond(['active' => false, 'pending' => true, 'idReservation' => (int)$row['idReservation'], 'dateReservation' => $row['dateDebut'], 'spot' => $row['spot'], 'expiresAt' => $expiresAt]);
    }
    respond(['active' => false, 'pending' => false]);
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
        $statutDb = $row['statut'] ?? 'confirmed';
        $debutTs = strtotime($row['dateDebut']);
        $enCours = empty($row['dateFin']);
        $isPending = $statutDb === 'pending';
        $statusLabel = $statutDb === 'cancelled' ? 'annulée' : ($isPending ? 'en attente' : ($enCours ? 'en cours' : 'terminée'));
        $reservations[] = [
            'id' => (int)$row['idReservation'],
            'idPlace' => (int)$row['idPlace'],
            'spot' => $row['numero'],
            'date' => $debut->format('d/m/Y'),
            'dateDebut' => $row['dateDebut'],
            'startTime' => $debut->format('H:i'),
            'endTime' => $fin ? $fin->format('H:i') : '—',
            'duration' => $duration,
            'montant' => (float)$row['montant'],
            'statut' => $statutDb,
            'dateFin' => $row['dateFin'] ?? null,
            'enCours' => $enCours,
            'isPending' => $isPending,
            'status' => $statusLabel
        ];
    }
    respond($reservations);
}

// Réservation = place réservée 15 min (statut pending). Chrono démarre au signal d'arrivée.
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
    if (!$spotId) respond(['success' => false, 'error' => 'Données incomplètes']);

    $stmt = $pdo->prepare("SELECT idConducteur FROM Reservation WHERE idConducteur = ? AND dateFin IS NULL AND statut IN ('pending','confirmed')");
    $stmt->execute([$data['id']]);
    if ($stmt->fetch()) respond(['success' => false, 'error' => 'Vous avez déjà une réservation ou session en cours.']);

    $stmt = $pdo->prepare("SELECT idPlace FROM Place WHERE numero = ? AND statut = 'available'");
    $stmt->execute([$spotId]);
    $place = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$place) respond(['success' => false, 'error' => 'Place non disponible']);

    $now = new DateTime();
    $date = $now->format('Y-m-d');
    $stmt = $pdo->prepare("SELECT idReservation FROM Reservation r WHERE r.idPlace = ? AND DATE(r.dateDebut) = ? AND r.statut IN ('pending','confirmed') AND r.dateFin IS NULL");
    $stmt->execute([$place['idPlace'], $date]);
    if ($stmt->fetch()) respond(['success' => false, 'error' => 'Cette place est occupée.']);

    $dateReservation = $now->format('Y-m-d H:i:s');

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT INTO Reservation (idConducteur, idPlace, idTarif, dateDebut, dateFin, montant, statut) VALUES (?, ?, 1, ?, NULL, 0, 'pending')");
        $stmt->execute([$data['id'], $place['idPlace'], $dateReservation]);
        $idReservation = $pdo->lastInsertId();
        $pdo->prepare("UPDATE Place SET statut = 'reserved' WHERE idPlace = ?")->execute([$place['idPlace']]);
        $stmt = $pdo->prepare("SELECT numero FROM Place WHERE idPlace = ?");
        $stmt->execute([$place['idPlace']]);
        $placeNum = $stmt->fetch(PDO::FETCH_ASSOC)['numero'] ?? $spotId;
        $notifMsg = "Réservation place $placeNum. Signalez votre arrivée dans les 15 min.";
        try { $pdo->prepare("INSERT INTO Notification (idConducteur, message, typeNotification, lu) VALUES (?, ?, 'reservation', 0)")->execute([$data['id'], $notifMsg]); } catch (Exception $e) {}
        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['success' => false, 'error' => 'Erreur: ' . $e->getMessage()]);
    }
    respond(['success' => true, 'idReservation' => (int)$idReservation, 'dateReservation' => $dateReservation, 'message' => 'Place réservée. Vous avez 15 minutes pour arriver et signaler.']);
}

// Signaler l'arrivée (dans les 15 min) → chrono démarre
if ($action === 'signaler-arrivee' && $method === 'POST') {
    $token = getToken() ?? getTokenFromInput($input);
    $data = null;
    if ($token) $data = json_decode(base64_decode($token), true);
    if (!$data || $data['role'] !== 'conducteur') respond(['success' => false, 'error' => 'Connexion requise']);

    $idReservation = (int)($input['idReservation'] ?? 0);
    if (!$idReservation) respond(['success' => false, 'error' => 'Réservation invalide']);

    $stmt = $pdo->prepare("SELECT r.idReservation, r.dateDebut, r.idPlace, pl.numero FROM Reservation r JOIN Place pl ON r.idPlace = pl.idPlace WHERE r.idReservation = ? AND r.idConducteur = ? AND r.statut = 'pending' AND r.dateFin IS NULL");
    $stmt->execute([$idReservation, $data['id']]);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$res) respond(['success' => false, 'error' => 'Réservation introuvable, expirée ou déjà activée']);

    $dateResa = new DateTime($res['dateDebut']);
    $now = new DateTime();
    $diffMin = ($now->getTimestamp() - $dateResa->getTimestamp()) / 60;
    if ($diffMin > 15) {
        try {
            $pdo->prepare("UPDATE Reservation SET statut = 'cancelled' WHERE idReservation = ?")->execute([$idReservation]);
            $pdo->prepare("UPDATE Place SET statut = 'available' WHERE idPlace = ?")->execute([$res['idPlace']]);
        } catch (Exception $e) {}
        respond(['success' => false, 'error' => 'Les 15 minutes sont écoulées. La réservation est expirée. Veuillez réserver à nouveau.']);
    }

    $dateDebut = $now->format('Y-m-d H:i:s');
    try {
        $pdo->prepare("UPDATE Reservation SET dateDebut = ?, statut = 'confirmed' WHERE idReservation = ?")->execute([$dateDebut, $idReservation]);
        $notifMsg = "Chrono démarré : place {$res['numero']}. Le tarif sera calculé à votre départ.";
        try { $pdo->prepare("INSERT INTO Notification (idConducteur, message, typeNotification, lu) VALUES (?, ?, 'session_start', 0)")->execute([$data['id'], $notifMsg]); } catch (Exception $e) {}
    } catch (Exception $e) {
        respond(['success' => false, 'error' => 'Erreur serveur']);
    }
    respond(['success' => true, 'idReservation' => $idReservation, 'dateDebut' => $dateDebut, 'message' => 'Chrono démarré. Le tarif sera calculé à votre départ.']);
}

// Départ = calcul du tarif (basé sur durée) puis paiement
if ($action === 'terminer-session' && $method === 'POST') {
    $token = getToken() ?? getTokenFromInput($input);
    $data = null;
    if ($token) $data = json_decode(base64_decode($token), true);
    if (!$data || $data['role'] !== 'conducteur') respond(['success' => false, 'error' => 'Connexion requise']);

    $idReservation = (int)($input['idReservation'] ?? 0);
    if (!$idReservation) respond(['success' => false, 'error' => 'Session invalide']);

    $stmt = $pdo->prepare("SELECT r.idReservation, r.idPlace, r.idConducteur, r.dateDebut, r.montant, pl.numero FROM Reservation r JOIN Place pl ON r.idPlace = pl.idPlace WHERE r.idReservation = ? AND r.idConducteur = ? AND r.dateFin IS NULL");
    $stmt->execute([$idReservation, $data['id']]);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$res) respond(['success' => false, 'error' => 'Session introuvable ou déjà terminée']);

    $debut = new DateTime($res['dateDebut']);
    $fin = new DateTime();
    $interval = $debut->diff($fin);
    $minutesTotal = $interval->days * 24 * 60 + $interval->h * 60 + $interval->i + $interval->s / 60;
    if ($minutesTotal < 1) $minutesTotal = 1;

    $stmt = $pdo->query("SELECT montantHoraire, montantJournalier FROM Tarif WHERE idTarif = 1");
    $tarif = $stmt->fetch(PDO::FETCH_ASSOC);
    $par30min = $tarif ? (float)($tarif['montantHoraire'] ?? 250) : 250;
    $journalier = $tarif ? (float)($tarif['montantJournalier'] ?? 3000) : 3000;
    $blocs30 = (int)ceil($minutesTotal / 30);
    $montant = $blocs30 * $par30min;
    if ($journalier > 0 && $montant > $journalier) $montant = $journalier;

    $dateFin = $fin->format('Y-m-d H:i:s');
    try {
        $pdo->beginTransaction();
        $pdo->prepare("UPDATE Reservation SET dateFin = ?, montant = ? WHERE idReservation = ?")->execute([$dateFin, $montant, $idReservation]);
        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['success' => false, 'error' => 'Erreur']);
    }
    $heures = $minutesTotal / 60;
    respond(['success' => true, 'idReservation' => $idReservation, 'montant' => $montant, 'dureeHeures' => round($heures, 2), 'place' => $res['numero']]);
}

// Payer la session terminée
if ($action === 'payer-session' && $method === 'POST') {
    $token = getToken() ?? getTokenFromInput($input);
    $data = null;
    if ($token) $data = json_decode(base64_decode($token), true);
    if (!$data || $data['role'] !== 'conducteur') respond(['success' => false, 'error' => 'Connexion requise']);

    $idReservation = (int)($input['idReservation'] ?? 0);
    $idSysteme = (int)($input['idSysteme'] ?? 1);
    $paymentPhone = trim($input['paymentPhone'] ?? '');

    if ($idSysteme == 1 && strlen(preg_replace('/\D/', '', $paymentPhone)) < 8) respond(['success' => false, 'error' => 'Numéro D-Money invalide']);

    $stmt = $pdo->prepare("SELECT r.idReservation, r.montant, r.idConducteur, pl.numero FROM Reservation r JOIN Place pl ON r.idPlace = pl.idPlace WHERE r.idReservation = ? AND r.idConducteur = ? AND r.dateFin IS NOT NULL");
    $stmt->execute([$idReservation, $data['id']]);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$res) respond(['success' => false, 'error' => 'Session invalide']);

    $stmt = $pdo->prepare("SELECT idPaiement FROM Paiement WHERE idReservation = ?");
    $stmt->execute([$idReservation]);
    if ($stmt->fetch()) respond(['success' => false, 'error' => 'Paiement déjà effectué']);

    $montant = (float)$res['montant'];
    if ($montant <= 0) respond(['success' => false, 'error' => 'Montant invalide. Rechargez la page et cliquez sur "Je pars" à nouveau.']);
    $methodeNom = $idSysteme == 1 ? 'D-Money (Mobile Money)' : 'Espèces (FDJ)';
    $stmtPl = $pdo->prepare("SELECT idPlace FROM Reservation WHERE idReservation = ?");
    $stmtPl->execute([$idReservation]);
    $pl = $stmtPl->fetch(PDO::FETCH_ASSOC);
    $statutPaiement = $idSysteme == 2 ? 'successful' : 'pending';
    try {
        $pdo->prepare("INSERT INTO Paiement (idReservation, idSysteme, montant, methodePaiement, statut) VALUES (?, ?, ?, ?, ?)")->execute([$idReservation, $idSysteme, $montant, $methodeNom, $statutPaiement]);
        if ($pl) $pdo->prepare("UPDATE Place SET statut = 'available' WHERE idPlace = ?")->execute([$pl['idPlace']]);
        if ($statutPaiement === 'successful') {
            $notifMsg = "Paiement reçu : place " . $res['numero'] . ", $montant FDJ.";
        } else {
            $notifMsg = "Paiement D-Money enregistré. En attente de confirmation par l'administrateur.";
        }
        $pdo->prepare("INSERT INTO Notification (idConducteur, message, typeNotification, lu) VALUES (?, ?, 'paiement', 0)")->execute([$res['idConducteur'], $notifMsg]);
    } catch (Exception $e) {
        respond(['success' => false, 'error' => $e->getMessage()]);
    }
    respond([
        'success' => true,
        'message' => $statutPaiement === 'successful' ? 'Paiement effectué.' : 'Paiement enregistré. L\'administrateur confirmera la réception.',
        'enAttenteAdmin' => $statutPaiement === 'pending'
    ]);
}

// Annuler une réservation (conducteur, min. 2h avant)
if ($action === 'annuler-reservation' && $method === 'POST') {
    $token = getToken() ?? getTokenFromInput($input);
    $data = null;
    if ($token) {
        $data = json_decode(base64_decode($token), true);
    }
    if (!$data || $data['role'] !== 'conducteur') {
        respond(['success' => false, 'error' => 'Connexion requise']);
    }

    $idReservation = (int)($input['idReservation'] ?? 0);
    if (!$idReservation) respond(['success' => false, 'error' => 'Réservation invalide']);

    $stmt = $pdo->prepare("SELECT idConducteur, idPlace, dateDebut, statut FROM Reservation WHERE idReservation = ?");
    $stmt->execute([$idReservation]);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$res) respond(['success' => false, 'error' => 'Réservation introuvable']);
    if ((int)$res['idConducteur'] !== (int)$data['id']) respond(['success' => false, 'error' => 'Cette réservation ne vous appartient pas']);
    if ($res['statut'] === 'cancelled') respond(['success' => false, 'error' => 'Réservation déjà annulée']);

    if ($res['statut'] === 'pending') {
        // Réservation en attente (avant signal d'arrivée) : annulation libre
    } else {
        $debutTs = strtotime($res['dateDebut']);
        $now = time();
        if ($debutTs - $now < 7200) respond(['success' => false, 'error' => 'Annulation possible jusqu\'à 2h avant le début de la session']);
    }

    try {
        $pdo->beginTransaction();
        $pdo->prepare("UPDATE Reservation SET statut = 'cancelled' WHERE idReservation = ?")->execute([$idReservation]);
        $pdo->prepare("UPDATE Place SET statut = 'available' WHERE idPlace = ?")->execute([$res['idPlace']]);
        $pdo->prepare("INSERT INTO Notification (idConducteur, message, typeNotification, lu) VALUES (?, ?, 'annulation', 0)")->execute([$data['id'], "Réservation #$idReservation annulée."]);
        $pdo->commit();
        respond(['success' => true, 'message' => 'Réservation annulée']);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['success' => false, 'error' => 'Erreur lors de l\'annulation']);
    }
}

// Tarifs publics (pour afficher les prix)
if ($action === 'tarifs-public') {
    try {
        $stmt = $pdo->query("SELECT * FROM Tarif");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond(!empty($rows) ? $rows : [['idTarif' => 1, 'montantHoraire' => 250, 'montantJournalier' => 3000]]);
    } catch (Exception $e) {
        respond([['idTarif' => 1, 'montantHoraire' => 250, 'montantJournalier' => 3000]]);
    }
}

// Moyens de paiement (Djibouti)
if ($action === 'systemes-paiement') {
    try {
        $stmt = $pdo->query("SELECT * FROM SystemePaiement WHERE idSysteme IN (1, 2) ORDER BY idSysteme");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond(!empty($rows) ? $rows : [
            ['idSysteme' => 1, 'typeSysteme' => 'D-Money (Mobile Money)'],
            ['idSysteme' => 2, 'typeSysteme' => 'Espèces (FDJ)']
        ]);
    } catch (Exception $e) {
        respond([
            ['idSysteme' => 1, 'typeSysteme' => 'D-Money (Mobile Money)'],
            ['idSysteme' => 2, 'typeSysteme' => 'Espèces (FDJ)']
        ]);
    }
}

// Etablissements avec GPS (parkings) — recherche par q (nom ou adresse)
if ($action === 'etablissements') {
    try {
        $stmt = $pdo->query("SELECT * FROM Etablissement");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $rows = [];
    }
    if (empty($rows)) {
        $rows = [
            ['idEtablissement' => 1, 'nom' => 'MOUBARIK Centre', 'adresse' => 'Place du 27 Juin, Djibouti', 'latitude' => 11.5890, 'longitude' => 43.1450, 'placesDisponibles' => 45],
            ['idEtablissement' => 2, 'nom' => 'MOUBARIK Ambouli', 'adresse' => "Avenue de l'Aéroport, Djibouti", 'latitude' => 11.5590, 'longitude' => 43.1390, 'placesDisponibles' => 30],
            ['idEtablissement' => 3, 'nom' => 'MOUBARIK PK12', 'adresse' => 'Route de Dikhil, Djibouti', 'latitude' => 11.5240, 'longitude' => 43.0780, 'placesDisponibles' => 25]
        ];
    }
    $q = trim($_GET['q'] ?? $_GET['search'] ?? '');
    if ($q !== '') {
        $q = strtolower($q);
        $rows = array_filter($rows, function ($r) use ($q) {
            return stripos($r['nom'] ?? '', $q) !== false || stripos($r['adresse'] ?? '', $q) !== false;
        });
    }
    respond(array_values($rows));
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
        respond([['idTarif' => 1, 'description' => 'Tarif standard', 'montantHoraire' => 250, 'montantJournalier' => 3000]]);
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
    $description = trim($input['description'] ?? '');
    $horaire = (float)($input['montantHoraire'] ?? 0);
    $journalier = (float)($input['montantJournalier'] ?? 0);
    if ($id) {
        if ($description !== '') {
            $pdo->prepare("UPDATE Tarif SET description=?, montantHoraire=?, montantJournalier=? WHERE idTarif=?")->execute([$description, $horaire, $journalier, $id]);
        } else {
            $pdo->prepare("UPDATE Tarif SET montantHoraire=?, montantJournalier=? WHERE idTarif=?")->execute([$horaire, $journalier, $id]);
        }
    }
    respond(['success' => true]);
}

// Créer tarif (admin)
if ($action === 'tarif-create' && $method === 'POST') {
    $token = getToken();
    $data = $token ? json_decode(base64_decode($token), true) : null;
    if (!$data || $data['role'] !== 'admin') {
        http_response_code(401);
        respond(['error' => 'Non autorisé']);
    }
    $description = trim($input['description'] ?? 'Tarif MOUBARIK');
    $horaire = (float)($input['montantHoraire'] ?? 250);
    $journalier = (float)($input['montantJournalier'] ?? 3000);
    if (!$description) $description = 'Tarif MOUBARIK';
    $pdo->prepare("INSERT INTO Tarif (description, montantHoraire, montantJournalier) VALUES (?, ?, ?)")->execute([$description, $horaire, $journalier]);
    respond(['success' => true, 'idTarif' => (int)$pdo->lastInsertId()]);
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
    $pending = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Derniers paiements (pour afficher l'historique même quand aucun en attente)
    $stmt2 = $pdo->query("
        SELECT p.idPaiement, p.idReservation, p.montant, p.methodePaiement, p.dateP, p.statut,
               r.dateDebut, pl.numero, c.nom, c.prenom, c.telephone
        FROM Paiement p
        JOIN Reservation r ON p.idReservation = r.idReservation
        JOIN Place pl ON r.idPlace = pl.idPlace
        LEFT JOIN Conducteur c ON r.idConducteur = c.idConducteur
        ORDER BY p.dateP DESC
        LIMIT 15
    ");
    $recent = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    respond(['pending' => $pending, 'recent' => $recent]);
}

// Confirmer paiement (admin) — marque le paiement D-Money comme reçu (place déjà libérée par payer-session)
if ($action === 'confirmer-paiement' && $method === 'POST') {
    $token = getToken() ?? getTokenFromInput($input);
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
        $stmt = $pdo->prepare("SELECT r.idReservation, r.idPlace, r.idConducteur, pl.numero, r.montant FROM Paiement p JOIN Reservation r ON p.idReservation = r.idReservation JOIN Place pl ON r.idPlace = pl.idPlace WHERE p.idPaiement = ?");
        $stmt->execute([$idPaiement]);
        $r = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($r) {
            // La place a déjà été libérée par payer-session (conducteur). Ne pas la ré-réserver.
            $msg = "Paiement D-Money confirmé. Place " . $r['numero'] . " — " . $r['montant'] . " FDJ reçus.";
            $pdo->prepare("INSERT INTO Notification (idConducteur, message, typeNotification, lu) VALUES (?, ?, 'paiement_confirme', 0)")->execute([$r['idConducteur'], $msg]);
        }
    }
    respond(['success' => true, 'message' => 'Paiement confirmé']);
}

// Rapport (admin) — temps réel
if ($action === 'rapport') {
    $token = getToken();
    $data = $token ? json_decode(base64_decode($token), true) : null;
    if (!$data || $data['role'] !== 'admin') respond(['error' => 'Non autorisé']);
    syncPlaceStatut($pdo);
    $stmt = $pdo->query("SELECT statut, COUNT(*) as cnt FROM Place GROUP BY statut");
    $counts = ['available' => 0, 'occupied' => 0, 'reserved' => 0];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) $counts[$row['statut']] = (int)$row['cnt'];
    $total = array_sum($counts);
    $stmt = $pdo->query("SELECT COUNT(*) as nb FROM Reservation WHERE DATE(dateDebut) = CURDATE()");
    $reservationsToday = $stmt->fetch(PDO::FETCH_ASSOC)['nb'];
    $stmt = $pdo->query("SELECT COALESCE(SUM(montant), 0) as total FROM Paiement WHERE DATE(dateP) = CURDATE()");
    $revenueToday = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    respond([
        'placesTotal' => $total,
        'placesDispo' => $counts['available'],
        'placesOccupees' => $counts['occupied'],
        'placesReservees' => $counts['reserved'],
        'reservationsToday' => (int)$reservationsToday,
        'revenueToday' => (float)$revenueToday
    ]);
}

// Notifications (conducteur connecté) — inclut rappel 15 min si réservation en attente
if ($action === 'notifications') {
    $token = getToken();
    $data = $token ? json_decode(base64_decode($token), true) : null;
    if (!$data || $data['role'] !== 'conducteur') {
        respond([]);
    }
    $idConducteur = $data['id'];
    // Rappel « 5 min restantes » si réservation pending entre 10 et 14 min
    try {
        $stmt = $pdo->prepare("SELECT r.idReservation, pl.numero FROM Reservation r JOIN Place pl ON r.idPlace = pl.idPlace WHERE r.idConducteur = ? AND r.dateFin IS NULL AND r.statut = 'pending' AND r.dateDebut BETWEEN NOW() - INTERVAL 14 MINUTE AND NOW() - INTERVAL 10 MINUTE");
        $stmt->execute([$idConducteur]);
        $pending = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($pending) {
            $stmtCheck = $pdo->prepare("SELECT 1 FROM Notification WHERE idConducteur = ? AND typeNotification = 'rappel_15min' AND dateNotification > NOW() - INTERVAL 10 MINUTE LIMIT 1");
            $stmtCheck->execute([$idConducteur]);
            if (!$stmtCheck->fetch()) {
                $msg = "Plus que 5 minutes pour signaler votre arrivée ! Place " . $pending['numero'];
                $pdo->prepare("INSERT INTO Notification (idConducteur, message, typeNotification, lu) VALUES (?, ?, 'rappel_15min', 0)")->execute([$idConducteur, $msg]);
            }
        }
    } catch (Exception $e) { /* ignorer */ }
    $stmt = $pdo->prepare("SELECT idNotification, message, dateNotification, typeNotification, lu FROM Notification WHERE idConducteur = ? ORDER BY dateNotification DESC LIMIT 20");
    $stmt->execute([$idConducteur]);
    respond($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Marquer notification comme lue
if ($action === 'notification-lue' && $method === 'POST') {
    $token = getToken();
    $data = $token ? json_decode(base64_decode($token), true) : null;
    if (!$data || $data['role'] !== 'conducteur') respond(['success' => false]);
    $id = (int)($input['idNotification'] ?? 0);
    if ($id) $pdo->prepare("UPDATE Notification SET lu = 1 WHERE idNotification = ? AND idConducteur = ?")->execute([$id, $data['id']]);
    respond(['success' => true]);
}

// Avis — vérifier si une réservation peut être évaluée (terminée, payée, sans avis)
if ($action === 'avis-reservation-evaluable') {
    $token = getToken();
    $data = $token ? json_decode(base64_decode($token), true) : null;
    if (!$data || $data['role'] !== 'conducteur') respond(['evaluable' => false]);
    $idReservation = (int)($_GET['idReservation'] ?? 0);
    if (!$idReservation) respond(['evaluable' => false]);
    try {
        $stmt = $pdo->prepare("SELECT 1 FROM Avis WHERE idReservation = ?");
        $stmt->execute([$idReservation]);
        if ($stmt->fetch()) respond(['evaluable' => false]);
        $stmt = $pdo->prepare("SELECT r.idReservation FROM Reservation r JOIN Paiement p ON p.idReservation = r.idReservation WHERE r.idReservation = ? AND r.idConducteur = ? AND r.dateFin IS NOT NULL AND p.statut IN ('successful','pending')");
        $stmt->execute([$idReservation, $data['id']]);
        respond(['evaluable' => (bool)$stmt->fetch()]);
    } catch (Exception $e) { respond(['evaluable' => false]); }
}

// Avis — soumettre une évaluation
if ($action === 'avis-submit' && $method === 'POST') {
    $token = getToken() ?? getTokenFromInput($input);
    $data = $token ? json_decode(base64_decode($token), true) : null;
    if (!$data || $data['role'] !== 'conducteur') respond(['success' => false, 'error' => 'Connexion requise']);
    $idReservation = (int)($input['idReservation'] ?? 0);
    $note = (int)($input['note'] ?? 0);
    $commentaire = trim($input['commentaire'] ?? '');
    if ($idReservation < 1 || $note < 1 || $note > 5) respond(['success' => false, 'error' => 'Données invalides']);
    try {
        $stmt = $pdo->prepare("SELECT r.idReservation, r.idConducteur FROM Reservation r JOIN Paiement p ON p.idReservation = r.idReservation WHERE r.idReservation = ? AND r.idConducteur = ? AND r.dateFin IS NOT NULL");
        $stmt->execute([$idReservation, $data['id']]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$res) respond(['success' => false, 'error' => 'Réservation non trouvée ou non payée']);
        $stmt = $pdo->prepare("SELECT 1 FROM Avis WHERE idReservation = ?");
        $stmt->execute([$idReservation]);
        if ($stmt->fetch()) respond(['success' => false, 'error' => 'Déjà évaluée']);
        $pdo->prepare("INSERT INTO Avis (idReservation, idConducteur, note, commentaire) VALUES (?, ?, ?, ?)")->execute([$idReservation, $data['id'], $note, $commentaire ?: null]);
        respond(['success' => true]);
    } catch (Exception $e) { respond(['success' => false, 'error' => $e->getMessage()]); }
}

respond(['error' => 'Action inconnue']);
