# MOUBARIK Parking – Djibouti
## Description du projet
MOUBARIK Parking est une application web intelligente dédiée à la gestion des parkings à Djibouti.
Elle permet d’automatiser la gestion des places de stationnement, de faciliter la réservation en ligne et d’optimiser l’expérience des utilisateurs.
Le système propose deux interfaces principales :
Une interface utilisateur (conducteur)
Une interface administrateur
## Objectifs
Automatiser la gestion des parkings
Réduire le temps de recherche d’une place
Permettre la réservation en ligne
Offrir une solution moderne, intuitive et efficace
Améliorer l’organisation et la rentabilité des parkings
## Équipe du projet
- Soumeya Bachir Mahamoud
- Sihan Abdourahman
- Simen Abdourahman Hassan
- Salma Aden
  ### 🎓 Niveau : Licence 3 Informatique
### Technologies utilisées
 - Frontend
HTML5
CSS3 (Thème sombre personnalisé)
JavaScript (Vite)
 - Backend
PHP
- Base de données
MySQL (WAMP/XAMPP)
- Outils & Environnement
  - Node.js
  - Supabase
  - Git & GitHub
## Fonctionnalités
### Côté Utilisateur
- Inscription et connexion sécurisée
- Consultation des places disponibles
- Visualisation du plan du parking
- Réservation de place en ligne
- Historique des réservations
### Côté Administrateur
- Tableau de bord avec statistiques
- Gestion des places de parking
- Gestion des réservations
- Gestion des tarifs
- Suivi global de l’activité
### Comptes de test

| Rôle       | Email              | Mot de passe |
|-----------|--------------------|--------------|
| Admin     | admin@moubarik.dj  | password     |
| Utilisateur | user@moubarik.dj | password     |
## Structure du projet
bash

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
       
## Installation
### 1. Cloner le projet
Bash
git clone https://github.com/soumeya-art/parking-intelligent-.git
cd parking-intelligent-
### 2. Installer les dépendances
Bash
npm install
#### Configuration de la base de données
#### Étape 1 : Copier le projet
Placer le dossier dans :

C:\wamp64\www\parking-intelligent-
⚠️ Éviter les espaces dans le nom du dossier
#### Étape 2 : Initialisation de la base
#### ✔️ Option A – Installation automatique
Accéder à :

http://localhost/parking-intelligent-/api/install.php
Puis supprimer le fichier install.php après exécution.
#### ✔️ Option B – phpMyAdmin
Ouvrir : http://localhost/phpmyadmin
Créer une base : moubarik_parking
Importer le fichier : db.sql
#### Configuration du frontend
Créer un fichier .env :
Environment
VITE_API_URL=http://localhost/parking-intelligent-/api
 Lancement du projet
- Frontend
Bash
- npm run dev
- Backend
Démarrer Apache et MySQL (WAMP/XAMPP)
Bash
- npm run dev:api
## Tests réalisés
Les tests effectués incluent :
- Tests fonctionnels (connexion, réservation…)
- Tests d’interface utilisateur
- Vérification de la base de données
- Tests de stabilité du système
### Résultat :
Application stable et fonctionnelle
#### Déploiement
L’application peut être déployée sur :
  - Serveur local (WAMP/XAMPP)
  - Plateforme gratuite (ex : InfinityFree)
## Licence
Ce projet est réalisé dans un cadre pédagogique.
Toute utilisation commerciale nécessite une autorisation préalable.
## Remerciements
Nous remercions notre enseignant pour son encadrement ainsi que toutes les personnes ayant contribué à la réalisation de ce projet.
## Remarque
Ce projet a été conçu dans un objectif d’apprentissage en développement web et en gestion de bases de données.
