import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.POSTGRES_POOL_MAX || '20', 10),
  min: parseInt(process.env.POSTGRES_POOL_MIN || '2', 10),
  idleTimeoutMillis: parseInt(process.env.POSTGRES_POOL_IDLE || '30000', 10),
  connectionTimeoutMillis: 10000,
});

pool.on('connect', async (client) => {
  try {
    await client.query('SET search_path TO trivia, public');
    console.log('✅ Database connected (schema: trivia)');
  } catch (error) {
    console.error('Failed to set search_path:', error);
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export { pool };
