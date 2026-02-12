import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');

    let query = `
      SELECT 
        id,
        state_ut,
        year_1987,
        year_1989,
        year_1991,
        year_1993,
        year_1995,
        year_1997,
        year_1999,
        year_2001,
        year_2003,
        year_2005,
        year_2007,
        year_2011,
        year_2013
      FROM forest_coverage
    `;

    const params = [];

    if (state) {
      query += ` WHERE state_ut ILIKE $${params.length + 1}`;
      params.push(`%${state}%`);
    }

    query += ` ORDER BY state_ut`;

    const rows = await sql(query, ...params);

    if (!rows || !Array.isArray(rows)) {
      console.error('[Forest Coverage] Invalid query result:', rows);
      return NextResponse.json(
        { success: false, error: 'Invalid data format from database' },
        { status: 500 }
      );
    }

    const data = rows.map((row) => ({
      id: String(row.id),
      state: row.state_ut,
      coverage: {
        1987: row.year_1987,
        1989: row.year_1989,
        1991: row.year_1991,
        1993: row.year_1993,
        1995: row.year_1995,
        1997: row.year_1997,
        1999: row.year_1999,
        2001: row.year_2001,
        2003: row.year_2003,
        2005: row.year_2005,
        2007: row.year_2007,
        2011: row.year_2011,
        2013: row.year_2013,
      },
      // Calculate change between first and last year
      change: row.year_1987 && row.year_2013 ? row.year_2013 - row.year_1987 : null,
    }));

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });

  } catch (error) {
    console.error('[Forest Coverage] Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch forest coverage data' },
      { status: 500 }
    );
  }
}
