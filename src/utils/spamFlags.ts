import { doc, increment, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from '../lib/firebase';

export async function flagReportAsSpam(reportId: string, uid: string) {
  if (!isFirebaseConfigured) return;
  await setDoc(doc(firestore, 'flags', reportId, 'flags', uid), {
    uid,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(firestore, 'reports', reportId), {
    flagCount: increment(1),
  });
}

