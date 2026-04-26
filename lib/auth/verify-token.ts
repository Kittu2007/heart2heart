import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';

// Initialize Firebase Admin once (Node.js runtime only — safe in API routes)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function verifyFirebaseToken(req: NextRequest): Promise<string | null> {
  // Primary: x-auth-token set by middleware
  let token = req.headers.get('x-auth-token');

  // Fallback: read Authorization header directly
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}
