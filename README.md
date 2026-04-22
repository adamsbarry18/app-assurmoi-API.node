# App AssurMoi — API

[![Repository](https://img.shields.io/badge/Repository-GitHub-blue)](https://github.com/adamsbarry18/app-assurmoi-API.node)

API REST **Node.js** ([Express 5](https://expressjs.com/)), **JavaScript** (CommonJS), avec **Sequelize** et **MariaDB**. Elle couvre l’espace AssurMoi : utilisateurs, authentification JWT, sinistres, dossiers, documents, historique d’audit, notifications, et **signature électronique** via [Yousign API v3](https://yousign.com/fr-fr/api).

Le dépôt inclut **Docker Compose** (API, MariaDB, MailHog, Adminer, **Expo/Metro** pour `APP-ASSURMOI-MOBILE`) et la **documentation interactive** OpenAPI sous `/api-docs`.

---

## Prérequis

- **Node.js** v20+ ([nodejs.org](https://nodejs.org/))
- **npm** v10+
- **Docker** v24+ et **Docker Compose** v2+ ([docker.com](https://www.docker.com/)) — recommandé pour l’environnement complet

---

## Installation

### Cloner le dépôt

```bash
git clone https://github.com/adamsbarry18/app-assurmoi-API.node.git
cd app-assurmoi-API
```

### Dépendances

```bash
npm install
```

### Variables d’environnement

Copier `.env.example` vers `.env` et renseigner les valeurs (JWT, base de données, email, Yousign si besoin).

**Exemple pour Docker Compose** (hôte des services = nom du service DB) :

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=change_me_min_16_chars_secret

DB_USERNAME=root
DB_PASSWORD=root
DB_HOST=app-assurmoi-db
DB_PORT=3306
DB_NAME=assurmoidb

MAIL_BACKEND=console
SMTP_HOST=app-assurmoi-mailhog
SMTP_PORT=1025
MAIL_FROM=noreply@assurmoi.local

# Signature — sandbox : https://api-sandbox.yousign.app/v3
YOUSIGN_API_KEY=
# YOUSIGN_BASE_URL=https://api-sandbox.yousign.app/v3
```

Puis exécuter les migrations (voir plus bas).

---

## Usage

### Avec Docker (recommandé)

**Toute la stack** (API + base + MailHog + Adminer + **bundler mobile Expo** sur le port 8081) :

```bash
docker compose up --build
# ou, équivalent
npm run docker:up:build
```

En arrière-plan :

```bash
docker compose up -d --build
```

- API : **http://localhost:3000**
- Metro (Expo) : **http://localhost:8081** — pour ouvrir l’app sur un téléphone / émulateur, suivre le flux [Expo](https://reactnative.dev/docs/environment-setup) (Expo Go, QR code, etc.). Le conteneur mobile monte le dossier `APP-ASSURMOI-MOBILE` : les changements de code sont pris en compte côté hôte. Si `node_modules` posent problème (binaires macOS vs Linux), lancer `docker compose run --rm app-assurmoi-mobile npm install` une fois, ou préférer l’Expo en **local** (voir ci-dessous).

**API + services de données uniquement** (pas de conteneur Expo) — utile si vous lancez le mobile sur la machine hôte (`npm start` dans `APP-ASSURMOI-MOBILE`) :

```bash
npm run docker:up:api
# avec rebuild des images
npm run docker:up:api:build
```

### Sans Docker

```bash
npm run dev
```

Production (sans recompilation : projet interprété directement) :

```bash
npm start
```

**Mobile (Expo) sans Docker** — démarrer l’API (Docker ou `npm run dev`) puis, dans un autre terminal :

```bash
cd APP-ASSURMOI-MOBILE
npm install
npm start
```

Côté app, copier `APP-ASSURMOI-MOBILE/.env.example` vers `.env` et définir si besoin **`EXPO_PUBLIC_API_URL`**. **Expo Web** (navigateur sur le même poste que l’API Docker) : utiliser **`http://localhost:3000`**, pas une IP LAN — sinon le navigateur peut afficher « Failed to fetch » (même si l’API répond). Téléphone sur le Wi‑Fi : `http://192.168.x.x:3000`. Par défaut sans variable : simulateur iOS / web → `localhost:3000` ; émulateur Android → `10.0.2.2:3000`. En **développement**, l’API accepte toute origine CORS (`origin: true`) pour faciliter Expo ; en **production**, renseigner **`CORS_ALLOWED_ORIGINS`** dans l’`.env` du serveur (voir `.env.example` à la racine).

**Authentification mobile** : écran de **connexion** (identifiants alignés sur `POST /api/auth/login` : e-mail ou nom d’utilisateur + mot de passe), **jetons** stockés via **expo-secure-store**, rafraîchissement via `POST /api/auth/refresh`, **déconnexion** via `POST /api/auth/logout`, profil `GET /api/auth/me`, mot de passe oublié `POST /api/auth/forgot-password`. Après login, l’**accueil** affiche le profil, `GET /` (état de l’API) et les liens utiles. UI : [React Native Paper](https://reactnativepaper.com/) (thème type applications assurance) + [Safe Area](https://github.com/react-native/safe-area-context).

**Arborescence (bonnes pratiques type template Expo + modules métier)** : `app/` = routes (expo-router) et écrans ; `components/` = UI réutilisable ; `constants/` = marque & thème ; `features/auth` = contexte session (`useAuth`) ; `lib/` = clients HTTP & config ; `theme/` = thème Paper ; `scripts/` = scripts outillage (dossier réservé).

**Appels API authentifiés** : `apiFetchWithAuth` (`lib/api.ts`) ajoute `Authorization: Bearer` à partir de **expo-secure-store** (mêmes jetons que le contexte) ; en cas de **401**, un **refresh** des jetons est tenté une fois. Les routes publiques restent sur `apiFetch` (ex. `GET /`).

Le dossier **`app-example/`** est l’ancienne démo Expo (après `reset-project`) : vous pouvez le supprimer quand il ne sert plus.

---

## Documentation API (Swagger UI)

Une fois le serveur démarré :

- **Swagger UI** : [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- Spécification source : [`docs/openapi.yml`](docs/openapi.yml)

La racine `GET /` renvoie les liens utiles vers les préfixes `/api/*`.

---

## Fonctionnalités principales

| Domaine | Préfixe | Rôles (aperçu) |
|--------|---------|----------------|
| Authentification (login, refresh, reset, invitation) | `/api/auth` | selon flux |
| Utilisateurs | `/api/users` | selon endpoint |
| Sinistres | `/api/sinisters` | gestionnaires, suivi, etc. |
| Documents (upload, consultation, validation) | `/api/documents` | lecture / upload / validation selon rôle |
| **Signature Yousign** | `POST /api/documents/:id/sign` | **ADMIN**, **PORTFOLIO_MANAGER** — document **validé**, fichier **PDF ou DOCX** |
| Dossiers & étapes | `/api/folders` | workflow dossier |
| Historique (audit) | `/api/history` | traçabilité des actions |
| Notifications | `/api/notifications` | notifications applicatives |

Flux typique **signature** : `POST /api/documents` (multipart) → `PATCH /api/documents/{id}/validate` → `POST /api/documents/{id}/sign` avec un corps JSON (`first_name`, `last_name`, `email`, champs optionnels de placement / nom de demande). La réponse inclut notamment `signature_request_id` et `signature_link` lorsque Yousign les fournit.

---

## Base de données (Sequelize)

Scripts npm :

```bash
npm run db:migrate        # appliquer les migrations
npm run db:migrate:undo   # annuler la dernière migration
npm run db:seed           # exécuter les seeders
```

Création d’une nouvelle migration (avec `sequelize-cli` en devDependency) :

```bash
npx sequelize-cli migration:generate --name ma-migration
```

---

## Services Docker Compose

| Service | Rôle | Ports |
|--------|------|-------|
| `app-assurmoi-node` | API Express | **3000** → 3000 |
| `app-assurmoi-db` | MariaDB | **3306** → 3306 |
| `app-assurmoi-mailhog` | SMTP de test + UI | **1025** (SMTP), **8025** (UI) |
| `app-assurmoi-adminer` | Client SQL web | **8080** → 8080 |

Accès rapides :

- API : http://localhost:3000  
- Adminer : http://localhost:8080  
- MailHog : http://localhost:8025  

---

## Arborescence (aperçu)

```
app-assurmoi-API/
├── app.js                 # Point d’entrée Express
├── config/                # Sequelize, OpenAPI
├── core/                  # logger, erreurs
├── routes/                # Routeurs par domaine (+ swagger)
├── middlewares/           # auth, validation, upload, etc.
├── services/              # Logique métier (dont yousignClient.js)
├── models/                # Modèles Sequelize
├── migrations/
├── seeders/
├── utils/                 # mailer, chemins upload
├── docs/
│   └── openapi.yml
├── docker-compose.yml
├── Dockerfile
├── package.json
└── .env.example
```

Les fichiers uploadés sont stockés sous **`UPLOAD_DIR`** (défaut : `./uploads`).

---

## Variables d’environnement (référence)

Liste détaillée et commentaires : **`.env.example`**. Notamment :

- **JWT** : `JWT_SECRET` (minimum 16 caractères), durées d’expiration, `PUBLIC_APP_URL` pour les liens dans les e-mails.
- **Base** : `DB_USERNAME`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`.
- **Fichiers** : `UPLOAD_DIR`, `UPLOAD_MAX_BYTES`.
- **E-mail** : `MAIL_BACKEND` (`console` ou SMTP), `SMTP_*`, `MAIL_FROM`.
- **Yousign** : `YOUSIGN_API_KEY`, `YOUSIGN_BASE_URL` (sandbox vs production).

---

## Ressources utiles

- [Express](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [Yousign — API](https://yousign.com/fr-fr/api) · [Developer Center](https://developers.yousign.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [MariaDB](https://mariadb.com/docs/)
- [MailHog](https://github.com/mailhog/MailHog)

---

## Auteur

**Mamadou Barry**  
- Email : [mabarry2018@gmail.com](mailto:mabarry2018@gmail.com)  
- GitHub : [@adamsbarry18](https://github.com/adamsbarry18)

---

**Licence** : ISC
