# MOUBARIK Parking - Djibouti

Application web de gestion intelligente des parkings pour MOUBARIK à Djibouti.  
Base de données **MySQL/WAMP**, authentification, tableau de bord administrateur et utilisateur.

## Fonctionnalités

- **Connexion / Inscription** – Conducteurs et administrateurs
- **Dashboard utilisateur** – Places disponibles, plan, réservation, historique
- **Dashboard admin** – Statistiques, gestion des places, tarifs, réservations
- **Logo personnalisé** – Thème sombre raffiné



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


##  Objectifs

* Automatiser la gestion des parkings
* Réduire le temps de recherche d’une place
* Permettre la réservation en ligne
* Offrir une solution moderne et efficace

---

##  Technologies utilisées

* Frontend : HTML, CSS, JavaScript (Vite)
* Backend : PHP
* Base de données : MySQL
* Outils : Node.js, Supabase

---

## 📁 Structure du projet

```bash
parking-intelligent/
│── api/              
│── public/           
│── src/              
│── supabase/         
│── auth/             
│── config/           
│── db.sql            
│── .env              
│── package.json      
│── README.md         
```

---

##  Installation

### 1. Cloner le projet

```bash
git clone https://github.com/soumeya-art/parking-intelligent.git
cd parking-intelligent
```

### 2. Installer les dépendances

```bash
npm install
```

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

##  Lancement du projet

### Frontend

```bash
npm run dev
```

### Backend

* Installer XAMPP ou WAMP
* Démarrer Apache et MySQL
* lancer
 ```bash
npm run dev:api
``` 



##  Tests

Des tests ont été effectués afin de vérifier :

* le bon fonctionnement du système
* la stabilité de l’application

---

##  Déploiement

Le projet peut être déployé sur un serveur local ou une plateforme gratuite comme InfinityFree.

---

##  Rapport

Le rapport détaillé du projet est disponible dans ce dépôt GitHub.

---

##  Auteur

* Nom :
  -Soumeya Bachir Mahamoud
  -Sihan Abdourahman
  -Simen Abdourahman Hassan
  -Salma Aden
* Niveau : Licence 3 Informatique

---

##  Remarque

Ce projet a été réalisé dans un but pédagogique.

