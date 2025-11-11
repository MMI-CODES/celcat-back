# Celcat Back - Proxy API

`celcat-back` est un serveur proxy simple et efficace conçu pour récupérer les emplois du temps depuis un serveur Celcat, les mettre en cache et les exposer via une API JSON propre.

## ✨ Fonctionnalités

-   **Proxy pour Celcat** : Récupère les données iCalendar (`.ics`) depuis n'importe quelle instance Celcat.
-   **Mise en Cache Intelligente** : Intègre un cache en mémoire pour réduire la charge sur le serveur Celcat et accélérer les réponses.
-   **API JSON Claire** : Transforme les données iCal en un format JSON facile à utiliser.
-   **Filtrage par Date** : Permet de requêter des événements pour une période spécifique.
-   **Gestion des Erreurs** : Fournit des messages d'erreur clairs pour les requêtes invalides ou les problèmes serveur.
-   **Configurable** : Utilise des variables d'environnement pour une configuration flexible.
-   **Prêt pour Docker** : Livré avec un `Dockerfile` pour un déploiement facile et reproductible.

---

## 🚀 Démarrage Rapide

### Prérequis

-   Node.js (v18 ou supérieure)
-   Docker (Optionnel, pour le déploiement)

### Installation et Développement Local

1.  **Clonez le dépôt :**
    ```bash
    git clone https://github.com/okayhappex/celcat-back.git
    cd celcat-back
    ```

2.  **Installez les dépendances :**
    ```bash
    npm install
    ```

3.  **Lancez le serveur de développement :**
    Ce script utilise `nodemon` pour redémarrer automatiquement le serveur à chaque modification.
    ```bash
    npm run dev
    ```
    Le serveur sera accessible à l'adresse `http://localhost:5000`.

---

## 🐳 Déploiement avec Docker

1.  **Construisez l'image Docker :**
    ```bash
    docker build -t celcat-back .
    ```

2.  **Lancez le conteneur :**
    Vous pouvez configurer l'application en passant des variables d'environnement.
    ```bash
    docker run -d -p 5000:5000 --name celcat-proxy \
      -e PORT=5000 \
      -e CACHE_TTL_SECONDS=600 \
      -e CELCAT_BASE_URL="https://celcat.rambouillet.iut-velizy.uvsq.fr" \
      celcat-back
    ```

---

## ⚙️ Configuration

L'application est configurable via les variables d'environnement suivantes :

| Variable            | Description                                                              | Défaut                                                 |
| ------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `PORT`              | Le port sur lequel le serveur écoute.                                    | `5000`                                                 |
| `CACHE_TTL_SECONDS` | La durée de vie du cache en secondes.                                    | `600` (10 minutes)                                     |
| `CELCAT_BASE_URL`   | L'URL de base de l'instance Celcat à requêter.                           | `https://celcat.rambouillet.iut-velizy.uvsq.fr`         |

---

## 📖 Documentation de l'API

### `GET /edt/:groupId`

Récupère l'emploi du temps pour un groupe spécifique.

#### Paramètres

-   **`groupId`** (paramètre de chemin, requis) : L'identifiant du groupe Celcat (ex: `133`).
-   **`start`** (paramètre de requête, requis) : La date de début de la période souhaitée, au format `YYYY-MM-DD`.
-   **`end`** (paramètre de requête, optionnel) : La date de fin de la période. Si non fournie, la recherche s'étend sur 5 jours après la date de début.

#### Exemple de Requête

```bash
curl "http://localhost:5000/edt/133?start=2024-09-02&end=2024-09-08"
```

#### Exemple de Réponse (Succès `200 OK`)

```json
[
    {
        "uid": "...",
        "summary": "R1.01 - Initiation au développement",
        "start": "2024-09-02T08:00:00.000Z",
        "end": "2024-09-02T10:00:00.000Z",
        "location": "Amphi WEISS",
        "description": "..."
    },
    ...
]
```

#### Exemple de Réponse (Erreur `400 Bad Request`)

```json
{
    "error": "Missing 'start' query parameter."
}
```

---

## 📜 Licence

Ce projet est sous licence GPL-3.0.