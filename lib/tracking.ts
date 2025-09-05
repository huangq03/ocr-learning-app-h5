
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { createDatabase } from './database';

/**
 * Creates a SHA-256 hash of the visitor's IP address and User-Agent.
 * This provides a way to identify a unique visitor without storing PII.
 * @param request - The Next.js request object.
 * @returns A SHA-256 hash string.
 */
function getVisitorHash(request: NextRequest): string {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  
  const hash = crypto
    .createHash('sha256')
    .update(ip + userAgent)
    .digest('hex');
    
  return hash;
}

/**
 * Records a visit to a shared set in the database.
 * @param sharedSetId - The ID of the shared set being visited.
 * @param request - The Next.js request object.
 */
export async function trackVisit(sharedSetId: string, request: NextRequest): Promise<void> {
  try {
    const visitorHash = getVisitorHash(request);
    const db = createDatabase();
    await db.trackVisit(sharedSetId, visitorHash);
  } catch (error) {
    console.error('Error tracking visit:', error);
    // Fail silently so it doesn't break the user experience
  }
}

/**
 * Increments the engagement count for a shared set.
 * @param sharedSetId - The ID of the shared set.
 */
export async function trackEngagement(sharedSetId: string): Promise<void> {
  try {
    const db = createDatabase();
    await db.trackEngagement(sharedSetId);
  } catch (error) {
    console.error('Error tracking engagement:', error);
  }
}
