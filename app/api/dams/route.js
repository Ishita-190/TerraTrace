import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    console.log('[Dams-API] Request received');
    
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const country = searchParams.get('country');
    const usage = searchParams.get('usage');
    
    console.log('[Dams-API] Query params:', { limit, country, usage });

    // Default to Indian dams if no country specified, but allow much higher limits
    const targetCountry = country || 'India';
    const damLimit = Math.min(parseInt(limit) || 500, 2000); // Allow up to 2000 dams
    
    let query = `
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
      WHERE country ILIKE $1 
        AND dam_name IS NOT NULL 
        AND longitude IS NOT NULL 
        AND latitude IS NOT NULL
    `;

    const params = [targetCountry];

    if (usage) {
      query += ` AND main_usage ILIKE $${params.length + 1}`;
      params.push(`%${usage}%`);
    }

    query += ` ORDER BY id LIMIT $${params.length + 1}`;
    params.push(damLimit);

    console.log('[Dams-API] Executing query for country:', targetCountry, 'limit:', damLimit);
    const result = await sql(query, ...params);
    console.log('[Dams-API] Query successful, rows:', result.length);
    
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
    console.error('[Dams-API] Database error:', error.message);
    console.error('[Dams-API] Full error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dams data' },
      { status: 500 }
    );
  }
}
