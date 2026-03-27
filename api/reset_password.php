<?php
/**
 * RÉINITIALISER LES MOTS DE PASSE
 * Ouvrez: http://localhost/parking%20intelligent/api/reset_password.php
 * Mot de passe défini: password
 */
header('Content-Type: text/html; charset=utf-8');

$host = 'localhost';
$dbname = 'moubarik_parking';
$user = 'root';
$pass = '';
$nouveauMotDePasse = 'password';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $hash = password_hash($nouveauMotDePasse, PASSWORD_DEFAULT);

    $pdo->prepare("UPDATE Administrateur SET motDePasse = ? WHERE email = 'admin@moubarik.dj'")->execute([$hash]);
    $pdo->prepare("UPDATE Conducteur SET motDePasse = ? WHERE email = 'user@moubarik.dj'")->execute([$hash]);

    echo "<h1>Mots de passe réinitialisés</h1>";
    echo "<p>Mot de passe défini pour tous les comptes: <strong>password</strong></p>";
    echo "<ul>";
    echo "<li>Admin: admin@moubarik.dj / password</li>";
    echo "<li>Utilisateur: user@moubarik.dj / password</li>";
    echo "</ul>";
    echo "<p><a href='../'>→ Aller à l'application</a></p>";

} catch (PDOException $e) {
    echo "<h1>Erreur</h1><p>" . htmlspecialchars($e->getMessage()) . "</p>";
}
