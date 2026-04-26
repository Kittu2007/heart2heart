import { adminDb } from '../firebase/admin-db';

export async function syncProfileToFirestore(uid: string, data: { name?: string; coupleId?: string | null; onboardingDone?: boolean }) {
  try {
    const profileRef = adminDb.collection('profiles').doc(uid);
    const update: any = {};
    if (data.name !== undefined) update.displayName = data.name;
    if (data.coupleId !== undefined) update.coupleId = data.coupleId;
    if (data.onboardingDone !== undefined) update.onboardingDone = data.onboardingDone;
    
    await profileRef.set(update, { merge: true });
    console.log(`[FirestoreSync] Profile ${uid} updated`);
  } catch (err) {
    console.error(`[FirestoreSync] Failed to update profile ${uid}:`, err);
  }
}

export async function syncCoupleToFirestore(coupleId: string, data: { inviteCode?: string; partnerAId?: string; partnerBId?: string | null; status?: string }) {
  try {
    const coupleRef = adminDb.collection('couples').doc(coupleId);
    const update: any = {};
    if (data.inviteCode !== undefined) update.inviteCode = data.inviteCode;
    if (data.partnerAId !== undefined) update.partnerAId = data.partnerAId;
    if (data.partnerBId !== undefined) update.partnerBId = data.partnerBId;
    if (data.status !== undefined) update.status = data.status;
    
    await coupleRef.set(update, { merge: true });
    console.log(`[FirestoreSync] Couple ${coupleId} updated`);
  } catch (err) {
    console.error(`[FirestoreSync] Failed to update couple ${coupleId}:`, err);
  }
}
