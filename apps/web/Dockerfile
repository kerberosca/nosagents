# Dockerfile pour l'application web Next.js
FROM node:18-alpine AS base

# Installer les dépendances nécessaires
RUN apk add --no-cache libc6-compat

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package.json pnpm-lock.yaml* ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copier les packages
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Installer pnpm
RUN npm install -g pnpm

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Build de l'application
RUN pnpm build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/apps/web/.next/standalone ./
COPY --from=base /app/apps/web/.next/static ./apps/web/.next/static

# Changer les permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
