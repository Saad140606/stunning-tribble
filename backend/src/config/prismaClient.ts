import { PrismaClient } from '@prisma/client';

// Optional: configure logger, extensions, etc.
export const prisma = new PrismaClient({
  // Enable query logging in development
  log: ['query', 'info', 'warn', 'error'],
});

export default prisma;
