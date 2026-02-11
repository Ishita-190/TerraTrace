import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL);

export async function POST() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        survey_data JSONB,
        survey_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Create dams table
    await sql`
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
    `;

    // Create forests table
    await sql`
      CREATE TABLE IF NOT EXISTS forests (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        location JSONB,
        coverage_percent DOUBLE PRECISION DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Create complaints table
    await sql`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Seed sample dams if empty
    const damsCount = await sql`SELECT COUNT(*)::int AS count FROM dams`;
    if (damsCount.rows[0].count === 0) {
      await sql`
        INSERT INTO dams (name, lat, lng, status, affected_population, displacement_percentage, satellite_imagery)
        VALUES 
        ('Narmada Dam', 21.8274, 73.4535, 'operational', 245000, 78, 'sentinel-2-latest'),
        ('Tehri Dam', 30.3849, 78.4867, 'operational', 186000, 65, 'sentinel-2-latest'),
        ('Sardar Sarovar Dam', 21.8165, 73.2563, 'operational', 320000, 85, 'sentinel-2-latest');
      `;
    }

    // Seed sample forests if empty
    const forestsCount = await sql`SELECT COUNT(*)::int AS count FROM forests`;
    if (forestsCount.rows[0].count === 0) {
      await sql`
        INSERT INTO forests (name, location, coverage_percent, status)
        VALUES 
        ('Terror Lake', '{"lat": 45.5231, "lng": -122.6765}', 85.5, 'active'),
        ('Mayo', '{"lat": 45.5231, "lng": -122.6765}', 72.3, 'active'),
        ('Blue Lake', '{"lat": 45.5231, "lng": -122.6765}', 91.2, 'active'),
        ('Green Lake', '{"lat": 45.5231, "lng": -122.6765}', 68.7, 'active');
      `;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully',
      tables: ['users', 'dams', 'forests', 'complaints']
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
