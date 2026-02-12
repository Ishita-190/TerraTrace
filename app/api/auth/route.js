import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, action } = body;

    console.log('[Auth] Request received:', { email, action });

    // Simple mock authentication for now
    if (action === 'login') {
      // Mock login logic
      if (email && password) {
        return NextResponse.json({
          success: true,
          message: 'Login successful',
          user: {
            id: '1',
            email: email,
            name: 'Test User'
          },
          token: 'mock-jwt-token-' + Date.now()
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Email and password required'
        }, { status: 400 });
      }
    } else if (action === 'signup') {
      // Mock signup logic
      if (email && password) {
        return NextResponse.json({
          success: true,
          message: 'Signup successful',
          user: {
            id: '1',
            email: email,
            name: 'Test User'
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Email and password required'
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[Auth] Error:', error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Authentication failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
