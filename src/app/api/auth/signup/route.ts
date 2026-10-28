import { NextRequest, NextResponse } from 'next/server';
import { createUserRecord, findUserByEmail } from '@/lib/userStore';
import { createSignedSessionToken, SessionPayload } from '@/lib/session';
import { checkRateLimit } from '@/lib/rateLimit';

// Sanitize string against XSS
function sanitize(input: string): string {
  return input.replace(/[<>'"&]/g, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`signup_${ip}`, 10, 60);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many account creation attempts. Please wait ${rateCheck.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter a name with at least 2 characters.' }, { status: 400 });
    }

    const cleanEmail = sanitize(email || '').toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email address already exists. Please log in.' }, { status: 409 });
    }

    const cleanName = sanitize(name);
    const userRecord = await createUserRecord(cleanName, cleanEmail, password);

    const payload: SessionPayload = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      createdAt: Date.now(),
    };

    const token = createSignedSessionToken(payload);
    const maxAge = 30 * 24 * 60 * 60; // 30 days

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
    console.error('Signup error in POST /api/auth/signup:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
