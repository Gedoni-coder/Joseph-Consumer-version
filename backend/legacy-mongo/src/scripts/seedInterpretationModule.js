/**
 * Interpretation Module Seed Script
 * Run this script to seed the Interpretation module with initial rules
 *
 * Usage:
 *   node backend/src/scripts/seedInterpretationModule.js
 *   node backend/src/scripts/seedInterpretationModule.js --force
 *   node backend/src/scripts/seedInterpretationModule.js --dry-run
 */

import mongoose from 'mongoose';
import { seedAll } from '../seeders/interpretationSeeder.js';
import { connectDB, disconnectDB } from '../config/db.js';

// ==========================================
// PARSE COMMAND LINE ARGS
// ==========================================
const args = process.argv.slice(2);
const force = args.includes('--force');
const dryRun = args.includes('--dry-run');

// ==========================================
// MAIN FUNCTION
// ==========================================
async function main() {
  console.log('\n🌱=== Interpretation Module Seeder ===\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : force ? 'FORCE UPDATE' : 'SAFE MODE'}`);
  console.log('');

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    console.log(`   MONGODB_URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/joseph-ai'}`);
    await connectDB();
    console.log('   ✅ Connected!\n');

    // Run seeder
    const result = await seedAll({ force, dryRun });

    if (dryRun) {
      console.log('\n✨ Dry run complete - No changes made');
    } else {
      console.log('\n✨ Seeding complete!');
      console.log(`   📜 Rules: ${result.rules.created} created, ${result.rules.updated} updated, ${result.rules.skipped} skipped`);
    }

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    // Disconnect
    console.log('\n📡 Closing database connection...');
    await disconnectDB();
    console.log('   ✅ Closed!');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(() => process.exit(0));
}

export default main;

// SR
