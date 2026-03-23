# App Assurmoi - API

[![Repository](https://img.shields.io/badge/Repository-GitHub-blue)](https://github.com/adamsbarry18/app-assurmoi-API.node)

Une API RESTful construite avec **Express.js** et **TypeScript**, conçue pour gérer les services de l'application Assurmoi. Ce projet utilise Docker pour la containerisation et intègre MariaDB pour la base de données et Mailhog pour les tests d'email.

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé:

- **Node.js** v20+ ([télécharger](https://nodejs.org/))
- **npm** v10+
- **Docker** v24+ ([télécharger](https://www.docker.com/))
- **Docker Compose** v2+ (généralement fourni avec Docker Desktop)

---

## Installation

### 1️⃣ Cloner le repository

```bash
git clone https://github.com/adamsbarry18/app-assurmoi-API.node.git
cd app-assurmoi-API
```

### 2️⃣ Installer les dépendances

```bash
npm install
```

### 3️⃣ Configuration environnement (optionnel)

Créer un fichier `.env` à la racine du projet:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=mysql://root:root@db:3306/assurmoidb
SMTP_HOST=mailhog
SMTP_PORT=1025
```

---

## Usage

### 🚀 Avec Docker (Recommandé)

Lancer tous les services (API, Base de données, Mailhog):

```bash
docker-compose up --build

ou
docker-compose up -d --build # pour lancer en arrière-plan

# lancer uniquement l'API
docker-compose up --build app-assurmoi-node

```

L'API sera accessible à `http://localhost:3000`

### 💻 Sans Docker (Développement local)

**Mode développement**:

```bash
npm run dev
```

**Build** du projet:

```bash
npm run build
```

**Production** (après build):

```bash
npm start
```

---

## Configuration

### Services dans Docker Compose

| Service | Description | Port(s) | Variable |
|---------|-------------|---------|----------|
| **app-assurmoi-node** | API Express/TypeScript | 3000 | NODE_ENV=development |
| **app-assurmoi-db** | MariaDB Database | 3306 | MARIADB_ROOT_PASSWORD=root |
| **app-assurmoi-mailhog** | SMTP Test Server | 1025, 8025 | - |
| **app-assurmoi-adminer** | DB Client Web UI | 8080 | - |

### Variables d'environnement principales

```env
PORT=3000                              # Port du serveur Express
NODE_ENV=development|production        # Environnement d'exécution
MARIADB_ROOT_PASSWORD=root            # Mot de passe root MariaDB
MARIADB_DATABASE=assurmoidb           # Nom de la base de données
```

### Accès aux services

- **API**: http://localhost:3000
- **Adminer (DB UI)**: http://localhost:8080
- **Mailhog Web UI**: http://localhost:8025
- **Mailhog SMTP**: localhost:1025

---

## Arborescence du projet

```
app-assurmoi-API/
│
├── src/
│   └── app.ts                 # Point d'entrée de l'application
│
├── dist/                       # Fichiers compilés (généré après build)
│   └── app.js
│
├── db-data/                    # Volume Docker - Données MariaDB
│   ├── assurmoidb/
│   ├── mysql/
│   ├── performance_schema/
│   └── sys/
│
├── node_modules/              # Dépendances npm (généré)
│
├── docker-compose.yml         # Configuration des services Docker
│
├── Dockerfile                 # Image Docker de l'application
│
├── package.json              # Dépendances et scripts npm
│
├── package-lock.json         # Verrouillage des versions npm
│
├── tsconfig.json             # Configuration TypeScript
│
├── README.md                 # Ce fichier
│
└── .env                      # Variables d'environnement (à créer)
```

### Description des fichiers clés

| Fichier | Description |
|---------|-------------|
| `src/app.ts` | Entrée principale de l'API Express avec configuration de base |
| `Dockerfile` | Configuration pour construire l'image Docker (Node 24 Alpine) |
| `docker-compose.yml` | Orchestration des 4 services (API, DB, Mailhog, Adminer) |
| `package.json` | Dépendances et scripts npm |
| `tsconfig.json` | Configuration du compilateur TypeScript |

---

## Auteur

👤 **Mamadou Barry**
- 📧 Email: [mabarry2018@gmail.com](mailto:mabarry2018@gmail.com)
- 🐙 GitHub: [@adamsbarry18](https://github.com/adamsbarry18)

---

## Ressources utiles

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [MariaDB Documentation](https://mariadb.com/docs/)
- [Mailhog Documentation](https://github.com/mailhog/MailHog)

---

**Licence**: ISC