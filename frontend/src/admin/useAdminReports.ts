import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';

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
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return new Date();
};

export function useAdminReports() {
  const [reports, setReports] = useState<AdminReport[]>(fallbackReports);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await apiFetch('/admin/complaints');
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        const mapped = (data.complaints || []).map((item: any) => ({
          id: String(item.id),
          title: item.title ?? `${item.category ?? 'Issue'} report`,
          category: item.category ?? 'Civic Issue',
          district: item.district ?? 'Karachi',
          location: item.street ?? `${item.latitude ?? ''}, ${item.longitude ?? ''}`,
          status: item.status ?? 'reported',
          submittedBy: item.userId ? `Citizen #${item.userId}` : 'Citizen',
          phone: item.phone,
          createdAt: toDate(item.createdAt),
          updatedAt: item.updatedAt ? toDate(item.updatedAt) : undefined,
          assignedTo: item.assignedTo,
          adminNote: item.adminNote,
          imageUrl: item.imageUrl,
          priority: item.priority,
          slaDeadline: item.slaDeadline ? toDate(item.slaDeadline) : undefined,
        })) as AdminReport[];
        if (mapped.length) setReports(mapped);
      } catch (err) {
        console.error('Failed to load admin complaints:', err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => ({ reports, setReports }), [reports]);
}

