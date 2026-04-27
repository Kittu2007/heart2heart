import { adminDb } from '../firebase/admin-db';

export async function syncProfileToFirestore(uid: string, data: { 
  name?: string; 
  coupleId?: string | null; 
  onboardingDone?: boolean; 
  dbId?: string; 
  inviteCode?: string;
  loveLanguage?: string | null;
  communicationStyle?: string | null;
  comfortLevel?: number;
}) {
  try {
    const profileRef = adminDb.collection('profiles').doc(uid);
    const update: any = {};
    if (data.name !== undefined) update.displayName = data.name;
    if (data.coupleId !== undefined) update.coupleId = data.coupleId;
    if (data.onboardingDone !== undefined) update.onboardingDone = data.onboardingDone;
    if (data.dbId !== undefined) update.dbId = data.dbId;
    if (data.inviteCode !== undefined) update.inviteCode = data.inviteCode;
    if (data.loveLanguage !== undefined) update.loveLanguage = data.loveLanguage;
    if (data.communicationStyle !== undefined) update.communicationStyle = data.communicationStyle;
    if (data.comfortLevel !== undefined) update.comfortLevel = data.comfortLevel;
    
    await profileRef.set(update, { merge: true });
  } catch (err) {
    console.error(`[FirestoreSync] Failed to update profile ${uid}:`, err);
  }
}

export async function syncCoupleToFirestore(coupleId: string, data: { inviteCode?: string; partnerAId?: string; partnerBId?: string | null; status?: string; partnerAUid?: string; partnerBUid?: string | null }) {
  try {
    const coupleRef = adminDb.collection('couples').doc(coupleId);
    const update: any = {};
    if (data.inviteCode !== undefined) update.inviteCode = data.inviteCode;
    if (data.partnerAId !== undefined) update.partnerAId = data.partnerAId;
    if (data.partnerBId !== undefined) update.partnerBId = data.partnerBId;
    if (data.status !== undefined) update.status = data.status;
    if (data.partnerAUid !== undefined) update.partnerAUid = data.partnerAUid;
    if (data.partnerBUid !== undefined) update.partnerBUid = data.partnerBUid;
    
    await coupleRef.set(update, { merge: true });
  } catch (err) {
    console.error(`[FirestoreSync] Failed to update couple ${coupleId}:`, err);
  }
}

export async function deleteCoupleFromFirestore(coupleId: string) {
  try {
    const coupleRef = adminDb.collection('couples').doc(coupleId);
    await coupleRef.delete();
    console.log(`[FirestoreSync] Couple ${coupleId} deleted from Firestore`);
  } catch (err) {
    console.error(`[FirestoreSync] Failed to delete couple ${coupleId}:`, err);
  }
}
