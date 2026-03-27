# MOUBARIK Parking - Djibouti

Application web de gestion intelligente des parkings pour MOUBARIK à Djibouti.  
Base de données **MySQL/WAMP**, authentification, tableau de bord administrateur et utilisateur.

## Fonctionnalités

- **Connexion / Inscription** – Conducteurs et administrateurs
- **Dashboard utilisateur** – Places disponibles, plan, réservation, historique
- **Dashboard admin** – Statistiques, gestion des places, tarifs, réservations
- **Logo personnalisé** – Thème sombre raffiné

## Installation (WAMP)

### 1. Copier le projet

Placez le dossier `parking intelligent` dans `C:\wamp64\www\`  
(nom suggéré: `parking-intelligent` pour éviter les espaces dans l'URL)

### 2. Base de données

**Option A – Script automatique**  
Allez sur : `http://localhost/parking-intelligent/api/install.php`  
Puis **supprimez** le fichier `api/install.php`.

**Option B – phpMyAdmin**  
1. Ouvrez `http://localhost/phpmyadmin`
2. Créez une base `moubarik_parking`
3. Exécutez le contenu de `api/db.sql`

### 3. Connexions par défaut

| Rôle       | Email              | Mot de passe |
|-----------|--------------------|--------------|
| Admin     | admin@moubarik.dj  | password     |
| Utilisateur | user@moubarik.dj | password     |

### 4. Configuration React

Créez un fichier `.env` :

```
VITE_API_URL=http://localhost/parking-intelligent/api
```

(Si le dossier a un espace : `http://localhost/parking%20intelligent/api`)

### 5. Lancer l'application

```bash
npm install
npm run dev
```

Ouvrez `http://localhost:5173`

## Structure

- `api/` – Backend PHP (auth, parking)
- `src/` – Application React
- `src/pages/Admin/` – Pages administration
