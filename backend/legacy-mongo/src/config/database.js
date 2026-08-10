/**
 * Database Configuration
 * Selects between Mongoose (MongoDB) and Prisma (PostgreSQL)
 * Based on DB_TYPE environment variable
 */

import 'dotenv/config';

const DB_TYPE = process.env.DB_TYPE || 'mongodb';

export const DATABASE_CONFIG = {
  type: DB_TYPE,
  isMongoose: DB_TYPE === 'mongodb',
  isPrisma: DB_TYPE === 'postgresql',

  // Connection info
  mongodb: {
    uri: process.env.MONGODB_URI || process.env.MONGO_URL,
    isConnected: false
  },

  postgresql: {
    url: process.env.DATABASE_URL,
    isConnected: false
  }
};

/**
 * Get the appropriate ORM service based on DB_TYPE
 */
export function getORMService(serviceName) {
  if (DATABASE_CONFIG.isPrisma) {
    // Dynamically import Prisma services
    return import(`../services/prisma/${serviceName}.js`)
      .then(module => module.default)
      .catch(() => {
        console.warn(`Prisma service '${serviceName}' not found, falling back to Mongoose`);
        return import(`../services/mongoose/${serviceName}.js`).then(m => m.default);
      });
  } else {
    // Use Mongoose services
    return import(`../services/mongoose/${serviceName}.js`)
      .then(module => module.default)
      .catch(() => {
        console.warn(`Mongoose service '${serviceName}' not found`);
        return null;
      });
  }
}

/**
 * Service factory for runtime ORM selection
 */
export class ServiceFactory {
  static async getService(serviceName) {
    const service = await getORMService(serviceName);
    return service;
  }

  static isPrisma() {
    return DATABASE_CONFIG.isPrisma;
  }

  static isMongoose() {
    return DATABASE_CONFIG.isMongoose;
  }

  static getDBType() {
    return DB_TYPE;
  }
}

export default DATABASE_CONFIG;
