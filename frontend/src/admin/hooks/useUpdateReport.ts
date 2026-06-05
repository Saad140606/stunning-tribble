import { apiFetch } from '../../services/api';
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
  await apiFetch(`/admin/complaints/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      adminNote: note ?? '',
      assignedTo: changedBy,
    }),
  });
}

