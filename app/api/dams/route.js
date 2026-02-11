import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM dams ORDER BY id
    `;

    if (!rows || !Array.isArray(rows)) {
      console.error('[Dams] Invalid query result:', rows);
      return NextResponse.json(
        { success: false, error: 'Invalid data format from database' },
        { status: 500 }
      );
    }

    const data = rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      location: {
        lat: Number(row.lat),
        lng: Number(row.lng),
      },
      status: row.status,
      affectedPopulation: row.affected_population,
      displacementPercentage: row.displacement_percentage,
      satelliteImagery: row.satellite_imagery,
      lastUpdated: row.last_updated,
    }));

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });

  } catch (error) {
    console.error('[Dams] Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dams data' },
      { status: 500 }
    );
  }
}
