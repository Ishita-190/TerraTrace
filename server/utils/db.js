const { Pool } = require('pg');

// Prefer DATABASE_URL, otherwise use individual PG* env vars
const connectionString = process.env.DATABASE_URL;

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl:
          process.env.PGSSLMODE === 'require'
            ? { rejectUnauthorized: false }
            : undefined,
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        database: process.env.PGDATABASE || 'terratrace',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
      }
);

async function initDb() {
  // Create tables if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dams (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL,
      affected_population INTEGER NOT NULL DEFAULT 0,
      displacement_percentage INTEGER NOT NULL DEFAULT 0,
      satellite_imagery TEXT,
      last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      survey_data JSONB,
      survey_completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Ensure columns exist (add them if they don't)
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS survey_data JSONB');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS survey_completed BOOLEAN DEFAULT FALSE');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');
  } catch (err) {
    console.log('[DB] Columns already exist or migration not needed');
  }

  // Seed minimal dataset for dams if empty
  const countRes = await pool.query('SELECT COUNT(*)::int AS count FROM dams');
  if (countRes.rows[0].count === 0) {
    // Clear any existing data first
    await pool.query('DELETE FROM dams');
    
    await pool.query(
      `INSERT INTO dams (name, lat, lng, status, affected_population, displacement_percentage, satellite_imagery)
       VALUES 
       ($1, $2, $3, $4, $5, $6, $7),
       ($8, $9, $10, $11, $12, $13, $14),
       ($15, $16, $17, $18, $19, $20, $21)`,
      [
        'Narmada Dam', 21.8274, 73.4535, 'operational', 245000, 78, 'sentinel-2-latest',
        'Tehri Dam', 30.3849, 78.4867, 'operational', 186000, 65, 'sentinel-2-latest',
        'Sardar Sarovar Dam', 21.8165, 73.2563, 'operational', 320000, 85, 'sentinel-2-latest',
      ]
    );
    console.log('[DB] Seeded dams table with sample data');
  }

  // Seed sample users if empty
  const userCountRes = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  if (userCountRes.rows[0].count === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await pool.query(
      `INSERT INTO users (name, email, password_hash, survey_completed, created_at)
       VALUES 
       ($1, $2, $3, $4, $5),
       ($6, $7, $8, $9, $10, $11)`,
      [
        'Test User', 'test@example.com', hashedPassword, false, new Date(),
        'Demo User', 'demo@example.com', hashedPassword, true, new Date()
      ]
    );
    console.log('[DB] Seeded users table with sample data');
  }
}

module.exports = { pool, initDb };