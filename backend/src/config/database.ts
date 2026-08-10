import { prisma } from './prisma.js';

export const DATABASE_CONFIG = {
  type: 'postgresql',
  isPrisma: true,
  postgresql: {
    url: process.env.DATABASE_URL
  }
} as const;

export class ServiceFactory {
  static async getService<T = unknown>(serviceName: string): Promise<T> {
    const module = await import(`../services/prisma/${serviceName}.js`);
    return module.default as T;
  }

  static isPrisma() {
    return true;
  }

  static getDBType() {
    return 'postgresql';
  }
}

export { prisma };
export default DATABASE_CONFIG;
