#!/usr/bin/env tsx
import { pool } from '../src/config/database';
import * as fs from 'fs';
import * as path from 'path';

interface QuestionOption {
  id: string;
  text: string;
}

interface QuestionData {
  id?: string;
  topic_id: string;
  type: 'single_correct' | 'multi_correct' | 'true_false';
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  options: QuestionOption[];
  correct_answer_ids: string[];
  explanation: string | null;
  is_active: boolean;
  times_asked?: number;
  times_correct?: number;
}

async function importQuestions(filePath: string) {
  console.log(`📚 Starting question import from: ${filePath}`);

  try {
    // Read and parse JSON file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const questions: QuestionData[] = JSON.parse(fileContent);

    console.log(`📖 Found ${questions.length} questions to import`);

    // Begin transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let imported = 0;
      let skipped = 0;
      let updated = 0;

      for (const question of questions) {
        try {
          // Check if question already exists
          const existingQuery = `
            SELECT id FROM trivia.questions WHERE id = $1
          `;
          const existing = await client.query(existingQuery, [question.id]);

          if (existing.rows.length > 0) {
            // Update existing question
            const updateQuery = `
              UPDATE trivia.questions
              SET
                topic_id = $2,
                type = $3,
                difficulty = $4,
                text = $5,
                options = $6,
                correct_answer_ids = $7,
                explanation = $8,
                is_active = $9,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $1
            `;

            await client.query(updateQuery, [
              question.id,
              question.topic_id,
              question.type,
              question.difficulty,
              question.text,
              JSON.stringify(question.options),
              question.correct_answer_ids,
              question.explanation,
              question.is_active
            ]);

            updated++;
          } else {
            // Insert new question
            const insertQuery = `
              INSERT INTO trivia.questions (
                id, topic_id, type, difficulty, text, options,
                correct_answer_ids, explanation, is_active,
                times_asked, times_correct, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              )
            `;

            await client.query(insertQuery, [
              question.id || null, // Let database generate if not provided
              question.topic_id,
              question.type,
              question.difficulty,
              question.text,
              JSON.stringify(question.options),
              question.correct_answer_ids,
              question.explanation,
              question.is_active,
              question.times_asked || 0,
              question.times_correct || 0
            ]);

            imported++;
          }

          // Log progress every 100 questions
          if ((imported + updated + skipped) % 100 === 0) {
            console.log(`Progress: ${imported + updated + skipped}/${questions.length} processed...`);
          }
        } catch (error: any) {
          console.warn(`⚠️  Failed to import question: ${question.text?.substring(0, 50)}...`);
          console.warn(`   Error: ${error.message}`);
          skipped++;
        }
      }

      await client.query('COMMIT');

      console.log('\n✅ Import completed successfully!');
      console.log(`   📊 Summary:`);
      console.log(`   - New questions imported: ${imported}`);
      console.log(`   - Existing questions updated: ${updated}`);
      console.log(`   - Questions skipped: ${skipped}`);
      console.log(`   - Total processed: ${imported + updated + skipped}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('❌ Import failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  const filePath = args[0] || path.join(__dirname, 'office_questions.json');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    console.log('\nUsage: tsx scripts/importQuestions.ts [path-to-json-file]');
    console.log('Example: tsx scripts/importQuestions.ts scripts/office_questions.json');
    process.exit(1);
  }

  try {
    await importQuestions(filePath);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

main();
