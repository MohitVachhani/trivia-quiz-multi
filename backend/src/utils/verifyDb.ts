import { pool } from '../config/database';

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database setup...\n');

    // Check tables in trivia schema
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'trivia'
      ORDER BY table_name;
    `;

    const tables = await pool.query(tablesQuery);
    console.log('📊 Tables in trivia schema:');
    tables.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    // Count topics
    const topicsCount = await pool.query('SELECT COUNT(*) FROM trivia.topics');
    console.log(`\n📚 Topics: ${topicsCount.rows[0].count}`);

    // List topics
    const topics = await pool.query('SELECT slug, name, is_available FROM trivia.topics');
    topics.rows.forEach((topic) => {
      console.log(`   - ${topic.name} (${topic.slug}) ${topic.is_available ? '✅' : '❌'}`);
    });

    // Count questions
    const questionsCount = await pool.query('SELECT COUNT(*) FROM trivia.questions');
    console.log(`\n❓ Questions: ${questionsCount.rows[0].count}`);

    // Questions by difficulty
    const difficultyQuery = await pool.query(`
      SELECT difficulty, COUNT(*) as count
      FROM trivia.questions
      GROUP BY difficulty
      ORDER BY difficulty
    `);
    console.log('\n   By difficulty:');
    difficultyQuery.rows.forEach((row) => {
      console.log(`   - ${row.difficulty}: ${row.count}`);
    });

    // Count users
    const usersCount = await pool.query('SELECT COUNT(*) FROM trivia.users');
    console.log(`\n👥 Users: ${usersCount.rows[0].count}`);

    console.log('\n✅ Database verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyDatabase();
