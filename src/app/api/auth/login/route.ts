import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword } from '@/lib/userStore';
import { createSignedSessionToken, SessionPayload } from '@/lib/session';
import { checkRateLimit } from '@/lib/rateLimit';

function sanitize(input: string): string {
  return input.replace(/[<>'"&]/g, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`login_${ip}`, 8, 60);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please wait ${rateCheck.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, rememberMe } = body;

    const cleanEmail = sanitize(email || '').toLowerCase();
    if (!cleanEmail || !password) {
      return NextResponse.json({ error: 'Please enter both email and password.' }, { status: 400 });
    }

    const userRecord = await findUserByEmail(cleanEmail);
    if (!userRecord) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const isMatch = verifyPassword(password, userRecord.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const payload: SessionPayload = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      createdAt: Date.now(),
    };

    const token = createSignedSessionToken(payload);
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

    const response = NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      },
    });

    response.cookies.set('rootwise_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (err: any) {
    console.error('Login error in POST /api/auth/login:', err);
    return NextResponse.json(
      { error: err?.message || 'Login service failed. Please try again.' },
      { status: 500 }
    );
  }
}
