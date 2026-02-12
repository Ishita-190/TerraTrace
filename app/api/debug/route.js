import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envInfo = {
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'SET' : 'NOT SET',
      jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
      allEnvVars: Object.keys(process.env).filter(key => 
        key.includes('DATABASE') || 
        key.includes('NEON') || 
        key.includes('MAPBOX') || 
        key.includes('JWT') ||
        key.includes('API_URL')
      ),
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL ? 'YES' : 'NO'
    };

    return NextResponse.json({
      success: true,
      message: 'Environment variables debug info',
      data: envInfo
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}
