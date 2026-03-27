<?php
/**
 * MOUBARIK Parking - Installation / Diagnostic
 * Ouvrez: http://localhost/parking-intelligent/api/install.php
 */
header('Content-Type: text/html; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>MOUBARIK Parking - Diagnostic</h1>";

// 1. Test PHP
echo "<h2>1. PHP</h2><p>OK - PHP " . phpversion() . "</p>";

// 2. Test MySQL
$host = 'localhost';
$username = 'root';
$password = '';
$dbname = 'moubarik_parking';

try {
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<h2>2. MySQL</h2><p>OK - Connexion réussie</p>";
} catch (PDOException $e) {
    echo "<h2>2. MySQL</h2><p style='color:red'>ERREUR: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Vérifiez que MySQL est démarré dans XAMPP.</p>";
    exit;
}

// 3. Créer la base si nécessaire
try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname`");
    $pdo->exec("USE `$dbname`");
    echo "<h2>3. Base de données</h2><p>OK - Base '$dbname' prête</p>";
} catch (PDOException $e) {
    echo "<h2>3. Base</h2><p style='color:red'>ERREUR: " . htmlspecialchars($e->getMessage()) . "</p>";
    exit;
}

// 4. Vérifier les tables
$tables = ['Conducteur', 'Administrateur', 'Place', 'Tarif', 'Reservation', 'Etablissement'];
$missing = [];
foreach ($tables as $t) {
    $r = $pdo->query("SHOW TABLES LIKE '$t'");
    if ($r->rowCount() === 0) $missing[] = $t;
}

if (!empty($missing)) {
    echo "<h2>4. Tables</h2><p style='color:orange'>Tables manquantes: " . implode(', ', $missing) . "</p>";
    echo "<p>Exécution de l'installation...</p>";
    $sql = file_get_contents(__DIR__ . '/db.sql');
    $sql = preg_replace('/CREATE DATABASE.*?;/s', '', $sql);
    $sql = preg_replace('/USE moubarik_parking;/', '', $sql);
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    $errors = [];
    foreach ($statements as $stmt) {
        if (empty($stmt) || preg_match('/^--/', $stmt)) continue;
        try {
            $pdo->exec($stmt);
        } catch (PDOException $e) {
            $errors[] = $e->getMessage();
        }
    }
    if (!empty($errors)) {
        echo "<p style='color:orange'>Certaines commandes ont échoué (peut être normal si déjà créé):</p><pre>" . htmlspecialchars(implode("\n", array_slice($errors, 0, 5))) . "</pre>";
    }
    echo "<p><strong>Rafraîchissez cette page</strong> pour revérifier.</p>";
} else {
    echo "<h2>4. Tables</h2><p>OK - Toutes les tables existent</p>";
}

// 5. Test compte conducteur
$stmt = $pdo->query("SELECT COUNT(*) FROM Conducteur");
$n = $stmt->fetchColumn();
echo "<h2>5. Données</h2><p>Conducteurs: $n (user@moubarik.dj / password si 1)</p>";

echo "<h2>Résultat</h2>";
echo "<p style='color:green;font-weight:bold'>Si tout est OK ci-dessus, essayez de vous connecter avec:<br>user@moubarik.dj / password</p>";
echo "<p><a href='/parking-intelligent/api/auth.php'>Tester auth.php</a></p>";
