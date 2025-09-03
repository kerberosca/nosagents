FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Installer pnpm
RUN npm install -g pnpm

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Copier le code source
COPY . .

# Construire l'application
RUN pnpm build

# Exposer le port
EXPOSE 3001

# Commande de démarrage
CMD ["pnpm", "start"]
