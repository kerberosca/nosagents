import { PrismaClient } from '@prisma/client';

// Déclaration globale pour le client Prisma
declare global {
  var __prisma: PrismaClient | undefined;
}

// Client Prisma singleton pour éviter les connexions multiples
export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Fonction pour fermer la connexion
export async function disconnect() {
  await prisma.$disconnect();
}

// Fonction pour se connecter
export async function connect() {
  await prisma.$connect();
}

// Fonction pour réinitialiser la base de données (uniquement en développement)
export async function reset() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset database in production');
  }
  
  await prisma.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE`;
  await prisma.$executeRaw`CREATE SCHEMA public`;
  await prisma.$executeRaw`GRANT ALL ON SCHEMA public TO postgres`;
  await prisma.$executeRaw`GRANT ALL ON SCHEMA public TO public`;
}

// Fonction pour vérifier la connexion
export async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
