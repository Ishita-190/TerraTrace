import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM dams ORDER BY id
    `;
    
    const data = result.rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      location: { lat: row.lat, lng: row.lng },
      status: row.status,
      affectedPopulation: row.affected_population,
      displacementPercentage: row.displacement_percentage,
      satelliteImagery: row.satellite_imagery,
      lastUpdated: row.last_updated,
    }));
    
    return NextResponse.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('[Dams] Database error:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to fetch dams data' }, { status: 500 });
  }
}
