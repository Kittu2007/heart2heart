import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';

/**
 * Result of token verification
 */
export type VerifyResult = {
  decoded: DecodedIdToken | null;
  error?: string;
  code?: number;
};

// Initialize Firebase Admin lazily
function initFirebaseAdmin() {
  if (getApps().length > 0) return;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && privateKey && clientEmail) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    } catch (err) {
      console.error("[FirebaseAdmin] Initialization failed:", err);
    }
  } else {
    // Robust fallback for project ID
    initializeApp({ projectId: projectId || "demo-project" });
  }
}

/**
 * Verifies the token using the Google Identity Toolkit REST API.
 */
async function verifyWithRestApi(token: string): Promise<VerifyResult> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  if (!apiKey) {
    return { decoded: null, error: "Server missing API key config (NEXT_PUBLIC_FIREBASE_API_KEY)", code: 500 };
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const msg = data.error?.message || "Invalid token (REST API)";
      return { decoded: null, error: msg, code: 401 };
    }

    const user = data.users?.[0];
    if (!user) {
      return { decoded: null, error: "User not found in Firebase", code: 401 };
    }

    // Map REST user to DecodedIdToken structure
    const decoded = {
      uid: user.localId,
      email: user.email,
      email_verified: user.emailVerified,
      name: user.displayName,
      picture: user.photoUrl,
      aud: projectId || '',
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iss: `https://securetoken.google.com/${projectId}`,
      sub: user.localId,
      firebase: {
        identities: {},
        sign_in_provider: user.providerUserInfo?.[0]?.providerId || 'unknown'
      }
    } as DecodedIdToken;

    return { decoded };
  } catch (err: any) {
    return { decoded: null, error: `Network error during verification: ${err.message}`, code: 500 };
  }
}

/**
 * Main entry point for token verification.
 * Tries Admin SDK first, then falls back to REST API for maximum robustness.
 */
export async function verifyFirebaseToken(req: NextRequest): Promise<VerifyResult> {
  // Primary: x-auth-token set by middleware
  let token = req.headers.get('x-auth-token');

  // Fallback: read Authorization header directly
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return { decoded: null, error: "Missing authentication token", code: 401 };
  }

  // 1. Try with Firebase Admin SDK (Node.js runtime)
  try {
    initFirebaseAdmin();
    const decoded = await getAuth().verifyIdToken(token);
    return { decoded };
  } catch (err: any) {
    // If it's a "project ID mismatch" error, we know Admin SDK is misconfigured
    // If it's a "certificate fetch" error, Vercel might be having networking issues
    console.warn(`[Auth] Admin SDK failed: ${err.message}. Trying REST fallback...`);
    
    // 2. Fallback to REST API (handles cases where Admin SDK isn't fully configured)
    return await verifyWithRestApi(token);
  }
}
