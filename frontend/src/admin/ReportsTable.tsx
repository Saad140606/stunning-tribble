import React, { useState, useMemo } from 'react';
import { Eye, ImagePlus, Save, Search, Filter, Download, AlertTriangle, Link2, X, CheckSquare, Square } from 'lucide-react';
import { AdminReport, AdminStatus } from './useAdminReports';
import { updateReportStatus } from './hooks/useUpdateReport';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { toast } from 'sonner';

/* ── Design tokens from Stitch ── */
const T = {
  bg: '#0e1417',
  surface: '#1a2123',
  surfaceHigh: '#242b2e',
  surfaceHighest: '#2f3639',
  surfaceLowest: '#080f12',
  onSurface: '#dde3e7',
  onSurfaceVariant: '#bbc9cf',
  muted: '#859398',
  outline: '#3c494e',
  accent: '#00d4ff',
  accentSoft: 'rgba(0, 212, 255, 0.08)',
  border: 'rgba(168, 232, 255, 0.07)',
  borderHover: 'rgba(168, 232, 255, 0.14)',
  fontHeadline: "'Plus Jakarta Sans', system-ui, sans-serif",
  fontData: "'JetBrains Mono', monospace",
};

const glassCard: React.CSSProperties = {
  background: `linear-gradient(135deg, rgba(26,33,35,0.75) 0%, rgba(36,43,46,0.55) 100%)`,
  border: `1px solid ${T.border}`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const inputStyle: React.CSSProperties = {
  background: T.surfaceLowest,
  border: `1px solid ${T.border}`,
  color: T.onSurface,
  fontFamily: T.fontHeadline,
};

const departments = ['KMC Water', 'KMC Roads', 'KESC', 'Traffic Police'];
const statuses: AdminStatus[] = ['reported', 'inprogress', 'resolved'];
const categories = ['Road Infrastructure', 'Water', 'Water Supply', 'Waste', 'Waste Management', 'Gas Leak', 'Sewerage', 'Sewerage System', 'Safety', 'Safety Concern', 'Street Lighting', 'Civic Issue'];
const districts = ['Saddar', 'Gulshan-e-Iqbal', 'Clifton', 'Korangi', 'North Karachi', 'Malir', 'Nazimabad', 'Lyari', 'PECHS', 'Kemari', 'Defense', 'Gulberg', 'Karachi'];

const statusColors: Record<string, { bg: string; color: string }> = {
  reported: { bg: 'rgba(255,184,0,0.1)', color: '#FFB800' },
  inprogress: { bg: 'rgba(0,212,255,0.1)', color: '#00D4FF' },
  resolved: { bg: 'rgba(0,200,150,0.1)', color: '#00C896' },
  emergency: { bg: 'rgba(255,180,171,0.1)', color: '#ffb4ab' },
  flagged: { bg: 'rgba(139,92,246,0.1)', color: '#8B5CF6' },
};

function formatAge(date: Date): string {
  const ms = Date.now() - date.getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getSlaSeverity(report: AdminReport): 'breach' | 'warning' | 'ok' {
  if (report.status === 'resolved') return 'ok';
  const hoursOpen = (Date.now() - report.createdAt.getTime()) / 3600000;
  if (hoursOpen > 48) return 'breach';
  if (hoursOpen > 24) return 'warning';
  return 'ok';
}

/** Haversine distance in meters */
function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earth = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

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

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkDept, setBulkDept] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          report.title.toLowerCase().includes(q) ||
          report.location.toLowerCase().includes(q) ||
          report.id.toLowerCase().includes(q) ||
          report.category.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      if (filterCategory && report.category !== filterCategory) return false;
      if (filterStatus && report.status !== filterStatus) return false;
      if (filterDistrict && report.district !== filterDistrict) return false;
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        if (report.createdAt < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (report.createdAt > to) return false;
      }
      return true;
    });
  }, [reports, searchQuery, filterCategory, filterStatus, filterDistrict, filterDateFrom, filterDateTo]);

  // Find potential duplicates for a given report
  const findDuplicates = (report: AdminReport) => {
    if (!report.latitude || !report.longitude) return [];
    return reports.filter(
      (other) =>
        other.id !== report.id &&
        other.latitude &&
        other.longitude &&
        other.category === report.category &&
        other.status !== 'resolved' &&
        distanceMeters(
          { lat: report.latitude!, lng: report.longitude! },
          { lat: other.latitude!, lng: other.longitude! },
        ) <= 200,
    );
  };

  const applyUpdate = async (report: AdminReport, changes: Partial<AdminReport>) => {
    const updated = { ...report, ...changes, updatedAt: new Date() };
    onLocalUpdate(updated);
    if (changes.status) {
      await updateReportStatus({
        reportId: report.id,
        status: changes.status,
        changedBy: profile?.uid ?? 'admin-demo',
        note,
        reportOwnerId: report.userId,
      });
    }
  };

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredReports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReports.map((r) => r.id)));
    }
  };

  const applyBulkAction = async () => {
    if (selectedIds.size === 0) return;
    if (!bulkStatus && !bulkDept) {
      toast.error('Select a status or department');
      return;
    }
    try {
      await apiFetch('/admin/complaints/bulk', {
        method: 'POST',
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          status: bulkStatus || undefined,
          assignedTo: bulkDept || undefined,
        }),
      });

      // Optimistic local update
      for (const id of selectedIds) {
        const report = reports.find((r) => r.id === id);
        if (report) {
          onLocalUpdate({
            ...report,
            ...(bulkStatus ? { status: bulkStatus as AdminStatus } : {}),
            ...(bulkDept ? { assignedTo: bulkDept } : {}),
            updatedAt: new Date(),
          });
        }
      }

      toast.success(`${selectedIds.size} reports updated`);
      setSelectedIds(new Set());
      setBulkStatus('');
      setBulkDept('');
    } catch {
      toast.error('Bulk update failed');
    }
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'District', 'Location', 'Status', 'Submitted By', 'Assigned To', 'Date', 'Age'];
    const rows = filteredReports.map((r) => [
      r.id,
      `"${r.title.replace(/"/g, '""')}"`,
      r.category,
      r.district,
      `"${r.location.replace(/"/g, '""')}"`,
      r.status,
      r.submittedBy,
      r.assignedTo || '',
      r.createdAt.toLocaleDateString(),
      formatAge(r.createdAt),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fix-karachi-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const activeFiltersCount = [filterCategory, filterStatus, filterDistrict, filterDateFrom, filterDateTo].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.muted }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, title, location…"
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg outline-none transition-all"
            style={{ ...inputStyle, fontSize: 13 }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          style={{
            background: showFilters || activeFiltersCount > 0 ? 'rgba(0,212,255,0.1)' : T.surface,
            color: showFilters || activeFiltersCount > 0 ? T.accent : T.muted,
            border: `1px solid ${T.border}`,
            fontFamily: T.fontHeadline,
          }}
        >
          <Filter className="w-4 h-4" />
          Filters{activeFiltersCount > 0 && ` (${activeFiltersCount})`}
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: T.surface, color: T.muted, border: `1px solid ${T.border}`, fontFamily: T.fontHeadline }}
        >
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 rounded-xl p-4" style={{ ...glassCard }}>
          <div>
            <label className="text-xs mb-1 block" style={{ color: T.muted, fontFamily: T.fontHeadline, fontWeight: 600 }}>Category</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full rounded-lg px-2 py-2 text-xs" style={inputStyle}>
              <option value="">All</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: T.muted, fontFamily: T.fontHeadline, fontWeight: 600 }}>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full rounded-lg px-2 py-2 text-xs" style={inputStyle}>
              <option value="">All</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              <option value="emergency">emergency</option>
            </select>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: T.muted, fontFamily: T.fontHeadline, fontWeight: 600 }}>District</label>
            <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} className="w-full rounded-lg px-2 py-2 text-xs" style={inputStyle}>
              <option value="">All</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: T.muted, fontFamily: T.fontHeadline, fontWeight: 600 }}>From</label>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-full rounded-lg px-2 py-2 text-xs" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: T.muted, fontFamily: T.fontHeadline, fontWeight: 600 }}>To</label>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-full rounded-lg px-2 py-2 text-xs" style={inputStyle} />
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(0,212,255,0.04)', border: `1px solid ${T.borderHover}` }}>
          <span className="text-sm font-bold" style={{ color: T.accent, fontFamily: T.fontData }}>
            {selectedIds.size} selected
          </span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="rounded-lg px-2 py-1.5 text-xs" style={inputStyle}>
            <option value="">Change Status…</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={bulkDept} onChange={(e) => setBulkDept(e.target.value)} className="rounded-lg px-2 py-1.5 text-xs" style={inputStyle}>
            <option value="">Assign Dept…</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={applyBulkAction} className="px-4 py-1.5 rounded-lg text-xs font-bold" style={{ background: T.accent, color: T.bg, fontFamily: T.fontHeadline }}>
            Apply
          </button>
          <button
            onClick={() => { setSelectedIds(new Set()); setBulkStatus(''); setBulkDept(''); }}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{ color: T.muted }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ ...glassCard }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead style={{ background: T.surfaceLowest, color: T.muted }}>
              <tr>
                <th className="p-3 w-10">
                  <button onClick={toggleSelectAll} className="flex items-center justify-center">
                    {selectedIds.size === filteredReports.length && filteredReports.length > 0
                      ? <CheckSquare className="w-4 h-4" style={{ color: T.accent }} />
                      : <Square className="w-4 h-4" />
                    }
                  </button>
                </th>
                {['ID', 'Category', 'Location', 'Status', 'Age', 'Submitted By', 'Date', 'Actions'].map((heading) => (
                  <th key={heading} className="text-left p-3" style={{ fontFamily: T.fontHeadline, fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => {
                const slaSeverity = getSlaSeverity(report);
                const isSelected = selectedIds.has(report.id);
                const rowBg = slaSeverity === 'breach'
                  ? 'rgba(255,180,171,0.04)'
                  : slaSeverity === 'warning'
                    ? 'rgba(255,184,0,0.03)'
                    : 'transparent';

                return (
                  <tr
                    key={report.id}
                    className={slaSeverity === 'breach' ? 'sla-breach-row' : ''}
                    style={{ borderTop: `1px solid ${T.border}`, color: T.onSurface, background: isSelected ? 'rgba(0,212,255,0.04)' : rowBg }}
                  >
                    <td className="p-3">
                      <button onClick={() => toggleSelect(report.id)} className="flex items-center justify-center">
                        {isSelected
                          ? <CheckSquare className="w-4 h-4" style={{ color: T.accent }} />
                          : <Square className="w-4 h-4" style={{ color: T.muted }} />
                        }
                      </button>
                    </td>
                    <td className="p-3" style={{ fontFamily: T.fontData, fontSize: 12 }}>
                      <div className="flex items-center gap-1.5">
                        {report.id}
                        {report.isDuplicate && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                            <Link2 className="w-3 h-3" /> Dup
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3" style={{ fontFamily: T.fontHeadline, fontSize: 13 }}>{report.category}</td>
                    <td className="p-3" style={{ fontFamily: T.fontHeadline, fontSize: 13 }}>{report.location}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={report.status}
                          onChange={(event) => applyUpdate(report, { status: event.target.value as AdminStatus })}
                          className="rounded-lg px-2 py-1"
                          style={{ background: statusColors[report.status]?.bg || T.surfaceLowest, color: statusColors[report.status]?.color || T.accent, border: `1px solid ${T.border}`, fontWeight: 700, fontSize: 11, fontFamily: T.fontData }}
                        >
                          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                          <option value="emergency">emergency</option>
                        </select>
                        {slaSeverity === 'breach' && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(255,180,171,0.12)', color: '#ffb4ab' }}>
                            <AlertTriangle className="w-3 h-3" /> SLA
                          </span>
                        )}
                        {slaSeverity === 'warning' && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(255,184,0,0.12)', color: '#FFB800' }}>
                            ⏳
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span style={{ fontFamily: T.fontData, fontSize: 12, color: slaSeverity === 'breach' ? '#ffb4ab' : slaSeverity === 'warning' ? '#FFB800' : T.muted }}>
                        {formatAge(report.createdAt)}
                      </span>
                    </td>
                    <td className="p-3" style={{ fontFamily: T.fontHeadline, fontSize: 13 }}>{report.submittedBy}</td>
                    <td className="p-3" style={{ fontFamily: T.fontData, fontSize: 12, color: T.muted }}>{report.createdAt.toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <select
                          value={report.assignedTo ?? ''}
                          onChange={(event) => applyUpdate(report, { assignedTo: event.target.value })}
                          className="rounded-lg px-2 py-1"
                          style={{ ...inputStyle, fontSize: 11 }}
                        >
                          <option value="">Assign</option>
                          {departments.map((department) => <option key={department}>{department}</option>)}
                        </select>
                        <button
                          onClick={() => { setSelected(report); setNote(report.adminNote ?? ''); }}
                          className="p-2 rounded-lg transition-colors"
                          style={{ background: T.accentSoft, color: T.accent, border: `1px solid ${T.border}` }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center p-8" style={{ color: T.muted, fontFamily: T.fontHeadline }}>
                    No reports match filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLA pulse animation */}
      <style>{`
        @keyframes slaPulse {
          0%, 100% { background: rgba(255,180,171,0.03); }
          50% { background: rgba(255,180,171,0.08); }
        }
        .sla-breach-row {
          animation: slaPulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Report Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div
            className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{
              ...glassCard,
              background: `linear-gradient(135deg, rgba(26,33,35,0.92) 0%, rgba(36,43,46,0.88) 100%)`,
              border: `1px solid ${T.borderHover}`,
            }}
          >
            <div className="flex justify-between mb-4">
              <div>
                <h2 style={{ color: T.onSurface, fontSize: 20, fontWeight: 700, fontFamily: T.fontHeadline }}>
                  {selected.title}
                  {selected.isDuplicate && (
                    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                      <Link2 className="w-3 h-3" /> Duplicate
                    </span>
                  )}
                </h2>
                <p style={{ color: T.muted, fontFamily: T.fontHeadline, fontSize: 13, marginTop: 4 }}>{selected.location} · {selected.district}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg" style={{ color: T.muted }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {selected.imageUrl && <img src={selected.imageUrl} className="w-full aspect-video object-cover rounded-xl mb-4" alt="Evidence" />}

            {/* Status Timeline */}
            <div className="rounded-xl p-3 mb-4" style={{ background: T.surfaceLowest, color: T.muted }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: statusColors[selected.status]?.color || T.accent }} />
                <span className="font-bold text-xs" style={{ color: statusColors[selected.status]?.color, fontFamily: T.fontData, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{selected.status}</span>
                <span className="text-xs">·</span>
                <span className="text-xs" style={{ fontFamily: T.fontData }}>{formatAge(selected.createdAt)}</span>
              </div>
              <p className="text-xs mt-1" style={{ fontFamily: T.fontHeadline }}>Created by {selected.submittedBy} on {selected.createdAt.toLocaleString()}</p>
              {selected.assignedTo && <p className="text-xs mt-1" style={{ fontFamily: T.fontHeadline }}>Assigned to: <strong style={{ color: T.accent }}>{selected.assignedTo}</strong></p>}
            </div>

            {/* SLA Warning in Modal */}
            {getSlaSeverity(selected) !== 'ok' && (
              <div className="rounded-xl p-3 mb-4 flex items-center gap-2" style={{ background: getSlaSeverity(selected) === 'breach' ? 'rgba(255,180,171,0.06)' : 'rgba(255,184,0,0.06)', border: `1px solid ${getSlaSeverity(selected) === 'breach' ? 'rgba(255,180,171,0.15)' : 'rgba(255,184,0,0.15)'}` }}>
                <AlertTriangle className="w-4 h-4" style={{ color: getSlaSeverity(selected) === 'breach' ? '#ffb4ab' : '#FFB800' }} />
                <span className="text-xs font-bold" style={{ color: getSlaSeverity(selected) === 'breach' ? '#ffb4ab' : '#FFB800', fontFamily: T.fontHeadline }}>
                  {getSlaSeverity(selected) === 'breach' ? 'SLA BREACHED — Open for over 48 hours!' : 'SLA Warning — Open for over 24 hours'}
                </span>
              </div>
            )}

            {/* Potential Duplicates */}
            {(() => {
              const dupes = findDuplicates(selected);
              if (dupes.length === 0) return null;
              return (
                <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <h4 className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: '#8B5CF6', fontFamily: T.fontHeadline }}>
                    <Link2 className="w-3.5 h-3.5" /> Potential Duplicates ({dupes.length})
                  </h4>
                  <div className="space-y-2">
                    {dupes.slice(0, 5).map((dupe) => (
                      <div key={dupe.id} className="flex items-center justify-between text-xs rounded-lg p-2" style={{ background: T.surfaceLowest }}>
                        <div>
                          <span style={{ fontFamily: T.fontData, color: T.onSurface }}>{dupe.id}</span>
                          <span className="mx-2" style={{ color: T.muted }}>·</span>
                          <span style={{ color: T.muted, fontFamily: T.fontHeadline }}>{dupe.title.substring(0, 40)}{dupe.title.length > 40 ? '…' : ''}</span>
                        </div>
                        <button
                          onClick={() => {
                            applyUpdate(dupe, { isDuplicate: true, status: 'resolved' as AdminStatus });
                            toast.success(`#${dupe.id} merged`);
                          }}
                          className="px-2 py-1 rounded-lg font-bold"
                          style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontSize: 10, fontFamily: T.fontHeadline }}
                        >
                          Merge
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Admin Note */}
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Admin Note / Add resolution details"
              className="w-full rounded-xl p-3 mb-3 outline-none"
              rows={4}
              style={{ ...inputStyle, borderRadius: 12, fontFamily: T.fontHeadline, fontSize: 13 }}
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2" style={{ background: T.accentSoft, color: T.accent, border: `1px solid ${T.border}`, fontFamily: T.fontHeadline, fontWeight: 600 }}>
                <ImagePlus className="w-4 h-4" /> Upload Resolution Photo
              </button>
              <button
                onClick={() => {
                  applyUpdate(selected, { adminNote: note });
                  setSelected(null);
                }}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold"
                style={{ background: T.accent, color: T.bg, fontFamily: T.fontHeadline }}
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
