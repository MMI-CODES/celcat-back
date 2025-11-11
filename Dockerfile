# --- Builder Stage ---
# This stage installs all dependencies (including dev) and builds the TypeScript code.
FROM node:20-alpine AS builder

# Définit le répertoire de travail dans le conteneur
WORKDIR /app

# Copie les fichiers package.json et package-lock.json
COPY package*.json ./

# Installe toutes les dépendances (dev et prod)
RUN npm ci

# Copie le reste du code de l'application
COPY . .

# Compile l'application TypeScript
RUN npm run build

# --- Production Stage ---
# This stage creates the final, lean image for production.
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
# Copie uniquement le code compilé et les node_modules de production
COPY --from=builder /app/dist ./dist

# Expose le port sur lequel l'application s'exécute
EXPOSE 5000

# Commande pour lancer l'application en production
CMD ["npm", "start"]
