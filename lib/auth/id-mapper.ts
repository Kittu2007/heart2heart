import { createHash } from 'crypto';

/**
 * Maps a Firebase UID to a valid PostgreSQL UUID.
 * This is necessary because the database schema uses UUID types,
 * but Firebase provides alphanumeric strings that don't match that format.
 * 
 * Uses a deterministic MD5 hash to ensure the same Firebase UID
 * always maps to the same UUID.
 */
export function toDbId(uid: string | undefined | null): string {
  if (!uid) return '';
  
  // If it's already a valid UUID format (8-4-4-4-12), return it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(uid)) {
    return uid.toLowerCase();
  }

  // Create a deterministic hash of the UID
  const hash = createHash('md5').update(uid).digest('hex');
  
  // Format as UUID v4-compliant string (for type checking)
  // 8-4-4-4-12
  const mapped = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16), // Version 4
    ((parseInt(hash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.substring(17, 20), // Variant 1
    hash.substring(20, 32)
  ].join('-').toLowerCase();

  return mapped;
}
