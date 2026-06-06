import { apiFetch } from '../../services/api';
import { createNotification, createReportStatusNotification } from '../../services/notificationService';
import { AdminStatus } from '../useAdminReports';

export async function updateReportStatus({
  reportId,
  status,
  changedBy,
  note,
  reportOwnerId,
}: {
  reportId: string;
  status: AdminStatus;
  changedBy: string;
  note?: string;
  reportOwnerId?: string;
}) {
  await apiFetch(`/admin/complaints/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      adminNote: note ?? '',
      assignedTo: changedBy,
    }),
  });

  if (reportOwnerId) {
    await createReportStatusNotification({
      userId: reportOwnerId,
      reportId,
      status,
    });

    if (note?.trim()) {
      await createNotification({
        userId: reportOwnerId,
        title: 'Admin commented on your report',
        message: note.trim(),
        type: 'admin_message',
        relatedReportId: reportId,
      });
    }
  }
}

