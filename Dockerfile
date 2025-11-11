# Utilise une image Node.js officielle comme base
FROM node:20-alpine

# Définit le répertoire de travail dans le conteneur
WORKDIR /app

# Copie les fichiers package.json et package-lock.json
# pour installer les dépendances
COPY package*.json ./

# Installe les dépendances de production
RUN npm ci --only=production

# Copie le reste du code de l'application
COPY . .

# Compile l'application TypeScript
RUN npm run build

# Expose le port sur lequel l'application s'exécute
EXPOSE 5000

# Commande pour lancer l'application en production
CMD ["npm", "start"]
