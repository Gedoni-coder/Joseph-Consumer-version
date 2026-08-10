/**
 * MongoDB Database Connection Configuration
 * Handles connection setup, error handling, and graceful shutdown
 */

import mongoose from 'mongoose';

// ==========================================
// CONNECTION OPTIONS
// ==========================================
const connectionOptions = {
  // Auto-index creation (disable in production)
  autoIndex: process.env.NODE_ENV !== 'production',

  // Socket timeout
  socketTimeoutMS: 45000,

  // Server selection timeout
  serverSelectionTimeoutMS: 5000,

  // Retry writes
  retryWrites: true,

  // Buffer settings
  bufferCommands: true,

  // Max pool size
  maxPoolSize: 10,
  minPoolSize: 5,

  // Use new engine
  family: 4 // Use IPv4, skip trying IPv6
};

// ==========================================
// CONNECTION FUNCTION
// ==========================================
/**
 * Connect to MongoDB database
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Create connection
    await mongoose.connect(mongoUri, connectionOptions);

    // Connection success handlers
    const db = mongoose.connection;

    db.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    db.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    db.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Log connection info based on environment
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 MongoDB Connection Info:');
      console.log(`   Host: ${db.host}`);
      console.log(`   Port: ${db.port}`);
      console.log(`   Database: ${db.name}`);
    }

    console.log('✅ MongoDB connected successfully');
    return mongoose;

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

// ==========================================
// DISCONNECT FUNCTION
// ==========================================
/**
 * Disconnect from MongoDB gracefully
 * @returns {Promise<void>}
 */
export async function disconnectDB() {
  try {
    await mongoose.connection.close();
    console.log('👋 MongoDB disconnected gracefully');
  } catch (error) {
    console.error('❌ Error during MongoDB disconnect:', error);
    throw error;
  }
}

// ==========================================
// CONNECTION STATE HELPERS
// ==========================================
/**
 * Check if database is connected
 * @returns {boolean}
 */
export function isConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Get connection state description
 * @returns {string}
 */
export function getConnectionState() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
}

/**
 * Clear all collections (useful for testing)
 * WARNING: This will delete all data!
 * @returns {Promise<void>}
 */
export async function clearDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot clear database in production');
  }

  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
  console.log('🗑️  Database cleared');
}

// ==========================================
// DEFAULT EXPORT
// ==========================================
export default {
  connectDB,
  disconnectDB,
  isConnected,
  getConnectionState,
  clearDatabase
};
