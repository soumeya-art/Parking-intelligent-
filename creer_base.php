<?php
/**
 * CRÉER LA BASE DE DONNÉES - MOUBARIK Parking
 * Ouvrez dans votre navigateur: http://localhost/parking%20intelligent/api/creer_base.php
 * (ou http://localhost/parking-intelligent/api/creer_base.php selon le nom de votre dossier)
 */
header('Content-Type: text/html; charset=utf-8');

$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'moubarik_parking';

echo "<h1>Création de la base MOUBARIK Parking</h1>";

try {
    // Connexion sans base
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p>✓ Connexion à MySQL OK</p>";

    // Créer la base
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname`");
    echo "<p>✓ Base '$dbname' créée</p>";

    $pdo->exec("USE `$dbname`");

    // Lire et exécuter le fichier SQL
    $sql = file_get_contents(__DIR__ . '/db.sql');
    $sql = preg_replace('/CREATE DATABASE.*?;/s', '', $sql);
    $sql = preg_replace('/USE moubarik_parking;/i', '', $sql);
    
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    $count = 0;
    foreach ($statements as $stmt) {
        if (!empty($stmt) && !preg_match('/^--/', $stmt)) {
            try {
                $pdo->exec($stmt);
                $count++;
            } catch (PDOException $e) {
                // Ignorer les erreurs "table existe déjà" ou "duplicate"
                if (strpos($e->getMessage(), 'already exists') === false && strpos($e->getMessage(), 'Duplicate') === false) {
                    echo "<p style='color:orange'>⚠ " . htmlspecialchars($e->getMessage()) . "</p>";
                }
            }
        }
    }

    echo "<p>✓ Tables et données créées ($count requêtes exécutées)</p>";
    echo "<h2 style='color:green'>✓ Installation terminée avec succès !</h2>";
    echo "<p><strong>Connexions :</strong></p>";
    echo "<ul>";
    echo "<li>Admin: admin@moubarik.dj / password</li>";
    echo "<li>Utilisateur: user@moubarik.dj / password</li>";
    echo "</ul>";
    echo "<p><a href='../'>→ Aller à l'application</a></p>";

} catch (PDOException $e) {
    echo "<h2 style='color:red'>Erreur</h2>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Vérifiez que WAMP est démarré (icône verte).</p>";
}
