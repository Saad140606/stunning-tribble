import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from '../../lib/firebase';
import { AdminStatus } from '../useAdminReports';

export async function updateReportStatus({
  reportId,
  status,
  changedBy,
  note,
}: {
  reportId: string;
  status: AdminStatus;
  changedBy: string;
  note?: string;
}) {
  if (!isFirebaseConfigured) return;

  await updateDoc(doc(firestore, 'reports', reportId), {
    status,
    adminNote: note ?? '',
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(firestore, 'reports', reportId, 'history'), {
    status,
    changedBy,
    timestamp: serverTimestamp(),
    note: note ?? '',
  });
}

