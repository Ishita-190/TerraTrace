import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[Test-Neon] Testing Neon database connection...');
    
    const databaseUrl = process.env.DATABASE_URL;
    console.log('[Test-Neon] DATABASE_URL:', databaseUrl ? 'SET' : 'NOT SET');
    
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL not set',
        debug: {
          envVars: Object.keys(process.env).filter(key => key.includes('DATABASE'))
        }
      }, { status: 500 });
    }

    const sql = neon(databaseUrl);
    console.log('[Test-Neon] Neon client created');
    
    // Test simple query
    const result = await sql`SELECT 1 as test`;
    console.log('[Test-Neon] Simple query result:', result);
    
    // Test dams table
    const damsCount = await sql`SELECT COUNT(*) as count FROM dams_reservoirs`;
    console.log('[Test-Neon] Dams count:', damsCount);
    
    // Test forest table
    const forestCount = await sql`SELECT COUNT(*) as count FROM forest_coverage`;
    console.log('[Test-Neon] Forest count:', forestCount);
    
    return NextResponse.json({
      success: true,
      message: 'Neon database connection successful',
      data: {
        simpleQuery: result,
        damsCount: damsCount[0]?.count || 0,
        forestCount: forestCount[0]?.count || 0,
        databaseUrl: databaseUrl.substring(0, 50) + '...' // Show first 50 chars for security
      }
    });

  } catch (error) {
    console.error('[Test-Neon] Error:', error.message);
    console.error('[Test-Neon] Full error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Neon database connection failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
