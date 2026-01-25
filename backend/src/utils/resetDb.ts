import { pool } from '../config/database';

async function resetDatabase() {
  try {
    console.log('🗑️  Dropping all tables from public schema...\n');

    // Drop tables in reverse order to handle foreign key constraints
    const dropStatements = [
      'DROP TABLE IF EXISTS answer_submissions CASCADE',
      'DROP TABLE IF EXISTS player_progress CASCADE',
      'DROP TABLE IF EXISTS games CASCADE',
      'DROP TABLE IF EXISTS lobby_players CASCADE',
      'DROP TABLE IF EXISTS lobbies CASCADE',
      'DROP TABLE IF EXISTS questions CASCADE',
      'DROP TABLE IF EXISTS topics CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
      'DROP FUNCTION IF EXISTS update_updated_at_column CASCADE',
      'DROP FUNCTION IF EXISTS generate_lobby_code CASCADE',
      'DROP FUNCTION IF EXISTS sync_lobby_player_ids CASCADE',
    ];

    for (const statement of dropStatements) {
      await pool.query(statement);
      console.log(`✅ ${statement}`);
    }

    console.log('\n✅ All tables and functions dropped from public schema');
    console.log('Now run: npm run migrate:up\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();
