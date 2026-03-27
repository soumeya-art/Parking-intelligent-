<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

function respond($data) {
    echo json_encode($data);
    exit;
}

// Inscription Conducteur
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'register') {
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
            : ['id' => (int)$user['idConducteur'], 'nom' => $user['nom'], 'prenom' => $user['prenom'], 'email' => $user['email'], 'role' => 'conducteur']
    ]);
}

respond(['error' => 'Action non valide']);
