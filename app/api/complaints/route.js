import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, complaint, location } = body;

    console.log('[Complaints] Request received:', { name, email, complaint, location });

    // Validate required fields
    if (!name || !email || !complaint) {
      return NextResponse.json({
        success: false,
        error: 'Name, email, and complaint are required'
      }, { status: 400 });
    }

    // Mock complaint submission (in production, save to database)
    const complaintData = {
      id: Date.now().toString(),
      name,
      email,
      complaint,
      location: location || null,
      timestamp: new Date().toISOString(),
      status: 'submitted'
    };

    console.log('[Complaints] Complaint saved:', complaintData);

    return NextResponse.json({
      success: true,
      message: 'Complaint submitted successfully',
      data: complaintData
    });

  } catch (error) {
    console.error('[Complaints] Error:', error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit complaint',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Mock complaints list (in production, fetch from database)
    const mockComplaints = [
      {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        complaint: 'Sample complaint about water quality',
        location: 'Delhi, India',
        timestamp: '2024-01-15T10:30:00Z',
        status: 'submitted'
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockComplaints,
      count: mockComplaints.length
    });

  } catch (error) {
    console.error('[Complaints GET] Error:', error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch complaints',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
