import { apiFetch } from '../services/api';

export async function flagReportAsSpam(reportId: string, uid: string) {
  if (!uid) return;
  await apiFetch(`/complaints/${reportId}/flag`, {
    method: 'POST',
    body: JSON.stringify({ uid }),
  });
}

