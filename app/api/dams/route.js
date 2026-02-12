import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    console.log('[Dams-API] Request received');
    
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const country = searchParams.get('country');
    const usage = searchParams.get('usage');
    
    console.log('[Dams-API] Query params:', { limit, country, usage });

    // Check environment variables
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('[Dams-API] DATABASE_URL not found');
      return NextResponse.json(
        { success: false, error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    console.log('[Dams-API] DATABASE_URL found, connecting...');
    
    // Create Neon client with error handling
    let sql;
    try {
      sql = neon(databaseUrl);
      console.log('[Dams-API] Neon client created successfully');
    } catch (neonError) {
      console.error('[Dams-API] Neon client creation failed:', neonError.message);
      return NextResponse.json(
        { success: false, error: 'Database connection failed', details: neonError.message },
        { status: 500 }
      );
    }

    // Default to Indian dams if no country specified
    const targetCountry = country || 'India';
    const damLimit = Math.min(parseInt(limit) || 500, 2000);
    
    console.log('[Dams-API] Executing query for country:', targetCountry, 'limit:', damLimit);
    
    let result;
    try {
      result = await sql`
        SELECT 
          id,
          dam_name,
          reservoir_name,
          river,
          country,
          main_usage,
          longitude,
          latitude,
          year,
          dam_height,
          dam_length,
          area_sqkm,
          status
        FROM dams_reservoirs 
        WHERE country ILIKE ${targetCountry} 
          AND dam_name IS NOT NULL 
          AND longitude IS NOT NULL 
          AND latitude IS NOT NULL
        ORDER BY id 
        LIMIT ${damLimit}
      `;
      console.log('[Dams-API] Query successful, rows:', result.length);
    } catch (queryError) {
      console.error('[Dams-API] Query failed:', queryError.message);
      return NextResponse.json(
        { success: false, error: 'Database query failed', details: queryError.message },
        { status: 500 }
      );
    }
    
    const data = result.map((row) => ({
      id: String(row.id),
      name: row.dam_name || 'Unknown Dam',
      reservoirName: row.reservoir_name,
      river: row.river,
      country: row.country,
      usage: row.main_usage,
      location: {
        lat: Number(row.latitude),
        lng: Number(row.longitude),
      },
      year: row.year,
      height: row.dam_height,
      length: row.dam_length,
      area: row.area_sqkm,
      status: row.status,
    }));
    
    console.log('[Dams-API] Successfully mapped', data.length, 'dams for', targetCountry);
    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      totalAvailable: result.length === damLimit ? 'More available' : 'All shown'
    });

  } catch (error) {
    console.error('[Dams-API] Unexpected error:', error.message);
    console.error('[Dams-API] Full error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dams data', details: error.message },
      { status: 500 }
    );
  }
}
