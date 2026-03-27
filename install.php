<?php
/**
 * Script d'installation - MOUBARIK Parking
 * Exécutez une fois: http://localhost/parking-intelligent/api/install.php
 * Puis supprimez ce fichier pour la sécurité.
 */
header('Content-Type: text/html; charset=utf-8');

$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'moubarik_parking';

try {
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS $db");
    $pdo->exec("USE $db");

    $sql = file_get_contents(__DIR__ . '/db.sql');
    $sql = preg_replace('/CREATE DATABASE.*?;/s', '', $sql);
    $sql = preg_replace('/USE moubarik_parking;/', '', $sql);
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    foreach ($statements as $stmt) {
        $stmt = trim($stmt);
        if (!empty($stmt) && !preg_match('/^--/', $stmt)) {
            $pdo->exec($stmt);
        }
    }

    echo '<h1>Installation réussie !</h1>';
    echo '<p>Base de données <strong>moubarik_parking</strong> créée.</p>';
    echo '<p><strong>Connexions par défaut (mot de passe: password) :</strong></p>';
    echo '<ul>';
    echo '<li>Admin: admin@moubarik.dj</li>';
    echo '<li>Utilisateur: user@moubarik.dj</li>';
    echo '</ul>';
    echo '<p><a href="../">Accéder à l\'application</a></p>';
    echo '<p style="color:red;"><strong>Supprimez ce fichier install.php pour la sécurité !</strong></p>';
} catch (Exception $e) {
    echo '<h1>Erreur</h1><p>' . htmlspecialchars($e->getMessage()) . '</p>';
}
