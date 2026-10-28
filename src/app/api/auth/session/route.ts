import { NextRequest, NextResponse } from 'next/server';
import { createSignedSessionToken, verifySessionToken, SessionPayload } from '@/lib/session';
import { checkRateLimit } from '@/lib/rateLimit';

// Sanitize string to prevent XSS injection
function sanitize(input: string): string {
  return input.replace(/[<>'"&]/g, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`session_create_${ip}`, 10, 60);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many session requests. Please wait ${rateCheck.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { uid, email, displayName, rememberMe } = body;

    if (!uid || typeof uid !== 'string') {
      return NextResponse.json({ error: 'Valid user identifier is required.' }, { status: 400 });
    }

    const cleanEmail = email ? sanitize(email) : '';
    const cleanName = displayName ? sanitize(displayName) : cleanEmail.split('@')[0] || 'Grower';

    const payload: SessionPayload = {
      uid: sanitize(uid),
      email: cleanEmail,
      displayName: cleanName,
      createdAt: Date.now(),
    };

    const token = createSignedSessionToken(payload);
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days if remember me, else 7 days

    const response = NextResponse.json({
      success: true,
      user: { uid: payload.uid, email: payload.email, displayName: payload.displayName },
    });

    response.cookies.set('rootwise_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('rootwise_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = verifySessionToken(sessionCookie);
    if (!payload) {
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.delete('rootwise_session');
      return response;
    }

    return NextResponse.json({
      user: { uid: payload.uid, email: payload.email, displayName: payload.displayName },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Signed out successfully' });
  response.cookies.delete('rootwise_session');
  return response;
}
