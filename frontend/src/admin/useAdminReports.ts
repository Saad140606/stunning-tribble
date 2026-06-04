import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from '../lib/firebase';

export type AdminStatus = 'reported' | 'inprogress' | 'resolved' | 'emergency' | 'flagged';

export interface AdminReport {
  id: string;
  title: string;
  category: string;
  district: string;
  location: string;
  status: AdminStatus;
  submittedBy: string;
  phone?: string;
  createdAt: Date;
  updatedAt?: Date;
  assignedTo?: string;
  adminNote?: string;
  imageUrl?: string;
  priority?: number;
  slaDeadline?: Date;
}

const fallbackReports: AdminReport[] = [
  {
    id: 'FK-2401',
    title: 'Major pothole on Shahrah-e-Faisal',
    category: 'Road Infrastructure',
    district: 'Saddar',
    location: 'PIDC, Shahrah-e-Faisal',
    status: 'reported',
    submittedBy: 'Citizen #2191',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600',
  },
  {
    id: 'FK-2402',
    title: 'Water supply disruption',
    category: 'Water',
    district: 'Gulshan-e-Iqbal',
    location: 'Block 13',
    status: 'inprogress',
    submittedBy: 'Citizen #4412',
    assignedTo: 'KMC Water',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
  },
  {
    id: 'FK-2403',
    title: 'Gas leak near market',
    category: 'Gas Leak',
    district: 'Korangi',
    location: 'Industrial Area',
    status: 'emergency',
    submittedBy: 'Citizen #9022',
    phone: '+923001234567',
    priority: 10,
    createdAt: new Date(Date.now() - 7 * 60 * 1000),
    slaDeadline: new Date(Date.now() + 8 * 60 * 1000),
  },
  {
    id: 'FK-2404',
    title: 'Garbage overflow fixed',
    category: 'Waste',
    district: 'Clifton',
    location: 'Block 2',
    status: 'resolved',
    submittedBy: 'Citizen #8310',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

const toDate = (value: unknown) => {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
};

export function useAdminReports() {
  const [reports, setReports] = useState<AdminReport[]>(fallbackReports);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(firestore, 'reports'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title ?? `${data.category ?? 'Issue'} report`,
          category: data.category ?? data.type ?? 'Civic Issue',
          district: data.district ?? 'Karachi',
          location: data.location ?? data.street ?? `${data.lat ?? ''}, ${data.lng ?? ''}`,
          status: data.status ?? 'reported',
          submittedBy: data.submittedBy ?? data.userId ?? 'Citizen',
          phone: data.phone,
          createdAt: toDate(data.createdAt),
          updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
          assignedTo: data.assignedTo,
          adminNote: data.adminNote,
          imageUrl: data.imageUrl,
          priority: data.priority,
          slaDeadline: data.slaDeadline ? toDate(data.slaDeadline) : undefined,
        };
      }));
    });
  }, []);

  return useMemo(() => ({ reports, setReports }), [reports]);
}

