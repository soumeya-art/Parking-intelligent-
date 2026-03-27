# MOUBARIK Parking - Démarrage rapide

## Méthode simple (sans Apache)

### 1. Démarrer MySQL dans XAMPP
- Ouvrez le **panneau XAMPP**
- Cliquez sur **Start** à côté de **MySQL** (Apache peut rester arrêté)

### 2. Lancer l'API PHP
Ouvrez un terminal et exécutez :
```
cd "c:\Users\hp\Documents\parking intelligent"
npm run dev:api
```
Laissez ce terminal ouvert.

### 3. Lancer l'application
Ouvrez un **deuxième terminal** :
```
cd "c:\Users\hp\Documents\parking intelligent"
npm run dev
```

### 4. Ouvrir l'application
Allez sur : **http://localhost:5173**

### Connexion test
- **Email :** user@moubarik.dj
- **Mot de passe :** password

---

## Si ça ne marche pas

1. **MySQL doit tourner** dans XAMPP (icône verte)
2. **PHP** doit être installé (vérifier : `php -v` dans le terminal)
3. Si PHP n'est pas trouvé : ajoutez `C:\xampp\php` au PATH Windows
