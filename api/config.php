<?php
// MOUBARIK Parking - Configuration WAMP/MySQL
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// En développement : retourne le lien de réinitialisation dans la réponse (pour tester sans email)
define('FORGOT_PASSWORD_DEV_MODE', true);

$host = 'localhost';
$dbname = 'moubarik_parking';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // Si la base n'existe pas (1049), la créer et installer
    if ($e->getCode() == 1049) {
        try {
            $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->exec("CREATE DATABASE `$dbname`");
            $pdo->exec("USE `$dbname`");

            $sql = file_get_contents(__DIR__ . '/db.sql');
            $sql = preg_replace('/CREATE DATABASE.*?;/s', '', $sql);
            $sql = preg_replace('/USE moubarik_parking;/', '', $sql);
            $statements = explode(';', $sql);
            foreach ($statements as $stmt) {
                $stmt = trim($stmt);
                if (!empty($stmt) && !preg_match('/^--/', $stmt)) {
                    try { $pdo->exec($stmt); } catch (PDOException $ex) { /* ignorer erreurs mineures */ }
                }
            }
            $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e2) {
            echo json_encode(['error' => 'Impossible de créer la base: ' . $e2->getMessage()]);
            exit;
        }
    } else {
        echo json_encode(['error' => 'Connexion DB échouée: ' . $e->getMessage()]);
        exit;
    }
}
