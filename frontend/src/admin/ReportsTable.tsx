import React, { useState } from 'react';
import { Eye, ImagePlus, Save } from 'lucide-react';
import { AdminReport, AdminStatus } from './useAdminReports';
import { updateReportStatus } from './hooks/useUpdateReport';
import { useAuth } from '../context/AuthContext';

const departments = ['KMC Water', 'KMC Roads', 'KESC', 'Traffic Police'];
const statuses: AdminStatus[] = ['reported', 'inprogress', 'resolved'];

export function ReportsTable({
  reports,
  onLocalUpdate,
}: {
  reports: AdminReport[];
  onLocalUpdate: (report: AdminReport) => void;
}) {
  const { profile } = useAuth();
  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [note, setNote] = useState('');

  const applyUpdate = async (report: AdminReport, changes: Partial<AdminReport>) => {
    const updated = { ...report, ...changes, updatedAt: new Date() };
    onLocalUpdate(updated);
    if (changes.status) {
      await updateReportStatus({
        reportId: report.id,
        status: changes.status,
        changedBy: profile?.uid ?? 'admin-demo',
        note,
      });
    }
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead style={{ background: '#0A1628', color: '#8BA3C7' }}>
            <tr>
              {['ID', 'Category', 'Location', 'Status', 'Submitted By', 'Date', 'Actions'].map((heading) => (
                <th key={heading} className="text-left p-3">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} style={{ borderTop: '1px solid rgba(0,212,255,0.07)', color: '#F0F4FF' }}>
                <td className="p-3 font-mono">{report.id}</td>
                <td className="p-3">{report.category}</td>
                <td className="p-3">{report.location}</td>
                <td className="p-3">
                  <select
                    value={report.status}
                    onChange={(event) => applyUpdate(report, { status: event.target.value as AdminStatus })}
                    className="rounded-lg px-2 py-1"
                    style={{ background: '#0A1628', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.15)' }}
                  >
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
                <td className="p-3">{report.submittedBy}</td>
                <td className="p-3">{report.createdAt.toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <select
                      value={report.assignedTo ?? ''}
                      onChange={(event) => applyUpdate(report, { assignedTo: event.target.value })}
                      className="rounded-lg px-2 py-1"
                      style={{ background: '#0A1628', color: '#8BA3C7', border: '1px solid rgba(0,212,255,0.15)' }}
                    >
                      <option value="">Assign</option>
                      {departments.map((department) => <option key={department}>{department}</option>)}
                    </select>
                    <button onClick={() => { setSelected(report); setNote(report.adminNote ?? ''); }} className="p-2 rounded-lg" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)' }}>
          <div className="w-full max-w-2xl rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.18)' }}>
            <div className="flex justify-between mb-4">
              <div>
                <h2 style={{ color: '#F0F4FF', fontSize: 20, fontWeight: 800 }}>{selected.title}</h2>
                <p style={{ color: '#8BA3C7' }}>{selected.location} • {selected.district}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: '#8BA3C7' }}>Close</button>
            </div>
            {selected.imageUrl && <img src={selected.imageUrl} className="w-full aspect-video object-cover rounded-xl mb-4" alt="Evidence" />}
            <div className="rounded-xl p-3 mb-4" style={{ background: '#0A1628', color: '#8BA3C7' }}>
              <p>Status history timeline</p>
              <p className="text-xs mt-1">Created as {selected.status} by {selected.submittedBy}</p>
            </div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Admin Note / Add resolution details"
              className="w-full rounded-xl p-3 mb-3"
              rows={4}
              style={{ background: '#0A1628', border: '1px solid rgba(0,212,255,0.15)', color: '#F0F4FF' }}
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2" style={{ background: 'rgba(0,212,255,0.08)', color: '#00D4FF' }}>
                <ImagePlus className="w-4 h-4" /> Upload Resolution Photo
              </button>
              <button
                onClick={() => {
                  applyUpdate(selected, { adminNote: note });
                  setSelected(null);
                }}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold"
                style={{ background: '#00D4FF', color: '#0A1628' }}
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

