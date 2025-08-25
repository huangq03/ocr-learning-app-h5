import { type NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=No token provided', request.url))
  }

  try {
    const result = await pool.query(
      'SELECT id, confirmation_sent_at FROM users WHERE confirmation_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.redirect(new URL('/auth/login?error=Invalid token', request.url))
    }

    const user = result.rows[0];
    const tokenExpiry = new Date(user.confirmation_sent_at).getTime() + 24 * 60 * 60 * 1000; // 24 hours

    if (Date.now() > tokenExpiry) {
      return NextResponse.redirect(new URL('/auth/login?error=Token expired', request.url))
    }

    await pool.query(
      'UPDATE users SET email_confirmed_at = NOW(), confirmation_token = NULL WHERE id = $1',
      [user.id]
    );

    return NextResponse.redirect(new URL('/auth/login?message=Email confirmed successfully. You can now log in.', request.url))
  } catch (error) {
    console.error('Confirmation error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=An unexpected error occurred', request.url))
  }
}
