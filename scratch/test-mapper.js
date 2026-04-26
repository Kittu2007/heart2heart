// Use dynamic import for ES modules
async function test() {
  const { toDbId } = await import('../lib/auth/id-mapper.js');

  const testUids = [
    '4q2p5H8dM9Y1R6n7K3jL4wV8zS2', // Typical Firebase UID
    'google-auth-user-123',
    '550e8400-e29b-41d4-a716-446655440000', // Already a UUID
  ];

  console.log('Testing ID Mapper:');
  testUids.forEach(uid => {
    const mapped = toDbId(uid);
    console.log(`Input:  ${uid}`);
    console.log(`Mapped: ${mapped}`);
    console.log('---');
  });
}

test();
