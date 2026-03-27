<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

function respond($data) {
    echo json_encode($data);
    exit;
}

// Inscription Conducteur uniquement (pas d'inscription admin)
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'register') {
    if (($input['role'] ?? '') === 'admin') {
        respond(['success' => false, 'error' => 'L\'inscription admin n\'est pas autorisée']);
    }
    $nom = trim($input['nom'] ?? '');
    $prenom = trim($input['prenom'] ?? '');
    $email = trim($input['email'] ?? '');
    $telephone = trim($input['telephone'] ?? '');
    $motDePasse = $input['motDePasse'] ?? '';

    if (!$nom || !$prenom || !$email || !$motDePasse) {
        respond(['success' => false, 'error' => 'Tous les champs obligatoires']);
    }

    $stmt = $pdo->prepare("SELECT idConducteur FROM Conducteur WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        respond(['success' => false, 'error' => 'Cet email est déjà utilisé']);
    }

    $hash = password_hash($motDePasse, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO Conducteur (nom, prenom, email, telephone, motDePasse) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$nom, $prenom, $email, $telephone ?: null, $hash]);

    $id = $pdo->lastInsertId();
    respond([
        'success' => true,
        'user' => [
            'id' => (int)$id,
            'nom' => $nom,
            'prenom' => $prenom,
            'email' => $email,
            'role' => 'conducteur'
        ],
        'token' => base64_encode(json_encode(['id' => $id, 'role' => 'conducteur', 'email' => $email]))
    ]);
}

// Connexion
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'login') {
    $email = trim($input['email'] ?? '');
    $motDePasse = $input['motDePasse'] ?? '';
    $role = $input['role'] ?? 'conducteur'; // conducteur ou admin

    if (!$email || !$motDePasse) {
        respond(['success' => false, 'error' => 'Email et mot de passe requis']);
    }

    if ($role === 'admin') {
        $stmt = $pdo->prepare("SELECT idAdmin, nom, email, motDePasse FROM Administrateur WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user && password_verify($motDePasse, $user['motDePasse'])) {
            respond([
                'success' => true,
                'user' => [
                    'id' => (int)$user['idAdmin'],
                    'nom' => $user['nom'],
                    'email' => $user['email'],
                    'role' => 'admin'
                ],
                'token' => base64_encode(json_encode(['id' => $user['idAdmin'], 'role' => 'admin', 'email' => $email]))
            ]);
        }
    } else {
        $stmt = $pdo->prepare("SELECT idConducteur, nom, prenom, email, telephone, motDePasse FROM Conducteur WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user && password_verify($motDePasse, $user['motDePasse'])) {
            respond([
                'success' => true,
                'user' => [
                    'id' => (int)$user['idConducteur'],
                    'nom' => $user['nom'],
                    'prenom' => $user['prenom'],
                    'email' => $user['email'],
                    'telephone' => $user['telephone'],
                    'role' => 'conducteur'
                ],
                'token' => base64_encode(json_encode(['id' => $user['idConducteur'], 'role' => 'conducteur', 'email' => $email]))
            ]);
        }
    }

    respond(['success' => false, 'error' => 'Email ou mot de passe incorrect']);
}

// Vérifier token
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'verify') {
    $token = $input['token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (strpos($token, 'Bearer ') === 0) $token = substr($token, 7);
    
    if (!$token) {
        respond(['valid' => false]);
    }
    
    $data = json_decode(base64_decode($token), true);
    if (!$data || !isset($data['id'], $data['role'])) {
        respond(['valid' => false]);
    }

    $table = $data['role'] === 'admin' ? 'Administrateur' : 'Conducteur';
    $idCol = $data['role'] === 'admin' ? 'idAdmin' : 'idConducteur';
    $stmt = $pdo->prepare("SELECT * FROM $table WHERE $idCol = ?");
    $stmt->execute([$data['id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) respond(['valid' => false]);
    
    respond([
        'valid' => true,
        'user' => $data['role'] === 'admin' 
            ? ['id' => (int)$user['idAdmin'], 'nom' => $user['nom'], 'email' => $user['email'], 'role' => 'admin']
            : ['id' => (int)$user['idConducteur'], 'nom' => $user['nom'], 'prenom' => $user['prenom'], 'email' => $user['email'], 'telephone' => $user['telephone'] ?? null, 'role' => 'conducteur']
    ]);
}

// Mot de passe oublié
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'forgot-password') {
    $email = trim($input['email'] ?? '');
    if (!$email) {
        respond(['success' => false, 'error' => 'Email requis']);
    }

    $stmt = $pdo->prepare("SELECT idConducteur FROM Conducteur WHERE email = ?");
    $stmt->execute([$email]);
    if (!$stmt->fetch()) {
        respond(['success' => true, 'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.']);
    }

    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

    try {
        $pdo->prepare("CREATE TABLE IF NOT EXISTS password_reset (email VARCHAR(150) PRIMARY KEY, token VARCHAR(64) NOT NULL, expires DATETIME NOT NULL)")->execute();
    } catch (Exception $e) {}

    $stmt = $pdo->prepare("REPLACE INTO password_reset (email, token, expires) VALUES (?, ?, ?)");
    $stmt->execute([$email, $token, $expires]);

    $baseUrl = $input['baseUrl'] ?? (($_SERVER['REQUEST_SCHEME'] ?? 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $resetLink = rtrim($baseUrl, '/') . '/reinitialiser/' . $token;

    if (function_exists('mail') && !defined('FORGOT_PASSWORD_DEV_MODE')) {
        $subject = 'MOUBARIK Parking - Réinitialisation du mot de passe';
        $body = "Cliquez pour réinitialiser : $resetLink\n\nCe lien expire dans 1 heure.";
        @mail($email, $subject, $body, "From: noreply@moubarik.dj");
    }

    $res = ['success' => true, 'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.'];
    if (defined('FORGOT_PASSWORD_DEV_MODE') && FORGOT_PASSWORD_DEV_MODE) {
        $res['resetLink'] = $resetLink;
    }
    respond($res);
}

// Réinitialiser le mot de passe
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'reset-password') {
    $token = trim($input['token'] ?? '');
    $motDePasse = $input['motDePasse'] ?? '';

    if (!$token || strlen($motDePasse) < 6) {
        respond(['success' => false, 'error' => 'Token invalide ou mot de passe trop court (min. 6 caractères)']);
    }

    try {
        $stmt = $pdo->prepare("SELECT email FROM password_reset WHERE token = ? AND expires > NOW()");
        $stmt->execute([$token]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            respond(['success' => false, 'error' => 'Lien expiré ou invalide. Demandez un nouveau lien.']);
        }
        $email = $row['email'];

        $hash = password_hash($motDePasse, PASSWORD_DEFAULT);
        $pdo->prepare("UPDATE Conducteur SET motDePasse = ? WHERE email = ?")->execute([$hash, $email]);
        $pdo->prepare("DELETE FROM password_reset WHERE email = ?")->execute([$email]);

        respond(['success' => true, 'message' => 'Mot de passe mis à jour. Vous pouvez vous connecter.']);
    } catch (Exception $e) {
        respond(['success' => false, 'error' => 'Erreur lors de la réinitialisation.']);
    }
}

// Profil conducteur (GET + UPDATE)
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'profile-update') {
    $token = $input['token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (strpos($token, 'Bearer ') === 0) $token = substr($token, 7);
    if (!$token) respond(['success' => false, 'error' => 'Non connecté']);

    $data = json_decode(base64_decode($token), true);
    if (!$data || $data['role'] !== 'conducteur') respond(['success' => false, 'error' => 'Réservé aux conducteurs']);

    $nom = trim($input['nom'] ?? '');
    $prenom = trim($input['prenom'] ?? '');
    $email = trim($input['email'] ?? '');
    $telephone = trim($input['telephone'] ?? '');

    if (!$nom || !$prenom || !$email) respond(['success' => false, 'error' => 'Nom, prénom et email requis']);

    $stmt = $pdo->prepare("SELECT idConducteur FROM Conducteur WHERE email = ? AND idConducteur != ?");
    $stmt->execute([$email, $data['id']]);
    if ($stmt->fetch()) respond(['success' => false, 'error' => 'Cet email est déjà utilisé']);

    $pdo->prepare("UPDATE Conducteur SET nom=?, prenom=?, email=?, telephone=? WHERE idConducteur=?")->execute([$nom, $prenom, $email, $telephone ?: null, $data['id']]);
    respond(['success' => true, 'user' => ['id' => (int)$data['id'], 'nom' => $nom, 'prenom' => $prenom, 'email' => $email, 'telephone' => $telephone ?: null, 'role' => 'conducteur']]);
}

// Changer le mot de passe (conducteur connecté)
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'change-password') {
    $token = $input['token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (strpos($token, 'Bearer ') === 0) $token = substr($token, 7);
    if (!$token) respond(['success' => false, 'error' => 'Non connecté']);

    $data = json_decode(base64_decode($token), true);
    if (!$data || $data['role'] !== 'conducteur') respond(['success' => false, 'error' => 'Réservé aux conducteurs']);

    $current = $input['motDePasseActuel'] ?? '';
    $new = $input['nouveauMotDePasse'] ?? '';

    if (!$current || strlen($new) < 6) respond(['success' => false, 'error' => 'Mot de passe actuel requis et nouveau mot de passe min. 6 caractères']);

    $stmt = $pdo->prepare("SELECT motDePasse FROM Conducteur WHERE idConducteur = ?");
    $stmt->execute([$data['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row || !password_verify($current, $row['motDePasse'])) respond(['success' => false, 'error' => 'Mot de passe actuel incorrect']);

    $hash = password_hash($new, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE Conducteur SET motDePasse = ? WHERE idConducteur = ?")->execute([$hash, $data['id']]);
    respond(['success' => true]);
}

// === ADMIN uniquement ===
function requireAdmin($input) {
    $token = $input['token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (strpos($token, 'Bearer ') === 0) $token = substr($token, 7);
    if (!$token) return null;
    $data = json_decode(base64_decode($token), true);
    if (!$data || ($data['role'] ?? '') !== 'admin') return null;
    return $data;
}

// Admin: ajouter un administrateur
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'admin-add-admin') {
    $admin = requireAdmin($input);
    if (!$admin) respond(['success' => false, 'error' => 'Non autorisé']);

    $nom = trim($input['nom'] ?? '');
    $email = trim($input['email'] ?? '');
    $motDePasse = $input['motDePasse'] ?? '';

    if (!$nom || !$email || strlen($motDePasse) < 6) {
        respond(['success' => false, 'error' => 'Nom, email et mot de passe (min. 6 caractères) requis']);
    }

    $stmt = $pdo->prepare("SELECT idAdmin FROM Administrateur WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) respond(['success' => false, 'error' => 'Cet email admin existe déjà']);

    $hash = password_hash($motDePasse, PASSWORD_DEFAULT);
    $pdo->prepare("INSERT INTO Administrateur (nom, email, motDePasse) VALUES (?, ?, ?)")->execute([$nom, $email, $hash]);
    respond(['success' => true, 'message' => 'Administrateur ajouté']);
}

// Admin: liste des conducteurs
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'admin-conducteurs') {
    $admin = requireAdmin($input);
    if (!$admin) respond(['success' => false, 'error' => 'Non autorisé']);

    $stmt = $pdo->query("SELECT idConducteur, nom, prenom, email, telephone, createdAt FROM Conducteur ORDER BY nom, prenom");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    respond(['success' => true, 'conducteurs' => $rows]);
}

// Admin: supprimer un conducteur
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'admin-delete-conducteur') {
    $admin = requireAdmin($input);
    if (!$admin) respond(['success' => false, 'error' => 'Non autorisé']);

    $idConducteur = (int)($input['idConducteur'] ?? 0);
    if (!$idConducteur) respond(['success' => false, 'error' => 'Conducteur invalide']);

    try {
        $pdo->beginTransaction();
        $pdo->prepare("DELETE FROM Notification WHERE idConducteur = ?")->execute([$idConducteur]);
        $stmt = $pdo->prepare("SELECT idPlace, idReservation FROM Reservation WHERE idConducteur = ?");
        $stmt->execute([$idConducteur]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $placeIds = array_unique(array_column($rows, 'idPlace'));
        $resIds = array_column($rows, 'idReservation');
        if (!empty($resIds)) {
            $ph = implode(',', array_fill(0, count($resIds), '?'));
            $pdo->prepare("DELETE FROM Paiement WHERE idReservation IN ($ph)")->execute($resIds);
        }
        $pdo->prepare("DELETE FROM Reservation WHERE idConducteur = ?")->execute([$idConducteur]);
        if (!empty($placeIds)) {
            $ph2 = implode(',', array_map('intval', $placeIds));
            $pdo->exec("UPDATE Place SET statut = 'available' WHERE idPlace IN ($ph2)");
        }
        $pdo->prepare("DELETE FROM Conducteur WHERE idConducteur = ?")->execute([$idConducteur]);
        $pdo->commit();
        respond(['success' => true, 'message' => 'Conducteur supprimé']);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['success' => false, 'error' => 'Erreur lors de la suppression']);
    }
}

respond(['error' => 'Action non valide']);
