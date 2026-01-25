import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';

async function runSeeds() {
  try {
    console.log('🌱 Starting database seeding...\n');

    const seedsDir = path.join(__dirname, '../../seeds');
    const files = fs.readdirSync(seedsDir).sort();

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      console.log(`📝 Running seed: ${file}`);
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await pool.query(sql);
      console.log(`✅ ${file} completed\n`);
    }

    console.log('✅ All seeds completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeeds();
