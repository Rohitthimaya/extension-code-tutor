import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_YwREX4g6jlcu@ep-patient-rice-a4d375i4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Confirm DB connection at startup
pool.connect()
  .then(client => {
    console.log('✅ Connected to the database successfully');
    client.release();
  })
  .catch(err => {
    console.error('❌ Failed to connect to the database:', err);
  });

export async function sendFeedbackToDatabase(data: {
  question: string,
  response: string,
  rating: 'positive' | 'negative',
  user_id?: string,
  session_id?: string,
  response_time?: number
}) {
  console.log('📤 Sending feedback to database:', data); // Log feedback data
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
