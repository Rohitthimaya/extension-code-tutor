import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_YwREX4g6jlcu@ep-patient-rice-a4d375i4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(client => {
    console.log('✅ Connected to the database successfully');
    client.release();
  })
  .catch(err => {
    console.error('❌ Failed to connect to the database:', err);
  });

// Existing function: inserts question/response/rating into feedback table
export async function sendFeedbackToDatabase(data: {
  question: string | null,
  response: string | null,
  rating: number | null,
  user_id?: string | null,
  session_id?: string | null,
  response_time?: number | null
}) {
  console.log('📤 Sending feedback to database:', data);
  await pool.query(
    `INSERT INTO feedback (question, response, rating, user_id, session_id, response_time)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      data.question,
      data.response,
      data.rating,
      data.user_id ?? null,
      data.session_id ?? null,
      data.response_time ?? null
    ]
  );
  console.log('✅ Feedback inserted into database');
}

// New function: inserts user comment only into separate feedback_comments table
export async function sendCommentFeedbackToDatabase(data: {
  user_comment: string | null,
  user_id?: string | null,
  session_id?: string | null
}) {
  console.log('📤 Sending comment feedback to database:', data);
  await pool.query(
    `INSERT INTO feedback_comments (user_comment, user_id, session_id)
     VALUES ($1, $2, $3)`,
    [
      data.user_comment,
      data.user_id ?? null,
      data.session_id ?? null
    ]
  );
  console.log('✅ Comment feedback inserted into database');
}
