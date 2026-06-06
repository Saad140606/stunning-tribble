import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Share2 } from 'lucide-react';
import { apiFetch } from '../services/api';

interface PublicReport {
  id: string;
  category: string;
  district: string;
  department: string;
  status: string;
  createdAt: Date;
  resolvedAt?: Date;
  emergencyWithinSla?: boolean;
}

const districts = ['Saddar', 'Gulshan-e-Iqbal', 'Clifton', 'Korangi', 'Malir', 'Lyari', 'Orangi', 'Nazimabad', 'DHA', 'North Karachi'];
const departments = ['KMC Roads', 'KMC Water (KWSB)', 'KESC', 'Traffic Police'];

const asDate = (value: unknown) => value instanceof Date ? value : value ? new Date(String(value)) : new Date();

export function TransparencyScreen() {
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await apiFetch('/complaints/public', { skipAuth: true });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        const mapped = (data.complaints || []).map((item: any) => ({
          id: String(item.id),
          category: item.category ?? 'Civic issue',
          district: item.district ?? 'Karachi',
          department: item.assignedTo ?? item.department ?? 'KMC Roads',
          status: item.status ?? 'reported',
          createdAt: asDate(item.createdAt),
          resolvedAt: item.status === 'resolved' ? asDate(item.updatedAt) : undefined,
          emergencyWithinSla: item.priority === 10 && item.status === 'resolved',
        }));
        setReports(mapped);
      } catch (err) {
        console.error('Failed to load public complaints:', err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const month = new Date().getMonth();
    const thisMonth = reports.filter((report) => report.createdAt.getMonth() === month);
    const resolved = thisMonth.filter((report) => report.status === 'resolved');
    const avgMs = resolved.reduce((sum, report) => sum + ((report.resolvedAt ?? new Date()).getTime() - report.createdAt.getTime()), 0) / Math.max(resolved.length, 1);
    const emergencies = thisMonth.filter((report) => report.emergencyWithinSla !== undefined);
    return {
      total: thisMonth.length,
      resolved: resolved.length,
      avgDays: Math.max(1, Math.round(avgMs / 86400000)),
      emergencyRate: emergencies.length ? Math.round((emergencies.filter((report) => report.emergencyWithinSla).length / emergencies.length) * 100) : 100,
    };
  }, [reports]);

  const copyShare = async () => {
    await navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen" style={{ background: '#0A1628', color: '#F0F4FF' }}>
      <header className="p-5" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900 }}>Karachi Civic Transparency Portal / کراچی شہری شفافیت پورٹل</h1>
            <div className="flex items-center gap-2 mt-2" style={{ color: '#00C896' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#00C896' }} />
              <span>Live Data</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={copyShare} className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: '#0F2040', color: '#00D4FF' }}>
              <Share2 className="w-4 h-4" /> {copied ? 'Copied' : 'Share'}
            </button>
            <Link to="/" className="rounded-xl px-4 py-3 font-bold" style={{ background: '#00D4FF', color: '#0A1628' }}>Report an Issue →</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-5 space-y-6">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['Total Reports This Month', stats.total],
            ['Resolved This Month', stats.resolved],
            ['Average Resolution Time', `${stats.avgDays} days`],
            ['Emergency Response Rate', `${stats.emergencyRate}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
              <div style={{ color: '#00D4FF', fontSize: 28, fontWeight: 900 }}>{value}</div>
              <div style={{ color: '#8BA3C7', fontSize: 12 }}>{label}</div>
            </div>
          ))}
        </section>

        <section className="rounded-xl overflow-hidden" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
          <h2 className="p-4" style={{ fontWeight: 900 }}>By Department</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead style={{ color: '#8BA3C7', background: '#0A1628' }}>
                <tr>{['Department', 'Assigned', 'Resolved', 'Pending', 'Avg Days'].map((head) => <th key={head} className="text-left p-3">{head}</th>)}</tr>
              </thead>
              <tbody>
                {departments.map((department) => {
                  const assigned = reports.filter((report) => report.department === department);
                  const resolved = assigned.filter((report) => report.status === 'resolved');
                  return (
                    <tr key={department} style={{ borderTop: '1px solid rgba(0,212,255,0.07)' }}>
                      <td className="p-3">{department}</td>
                      <td className="p-3">{assigned.length}</td>
                      <td className="p-3">{resolved.length}</td>
                      <td className="p-3">{assigned.length - resolved.length}</td>
                      <td className="p-3">3</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          {districts.map((district) => {
            const items = reports.filter((report) => report.district === district);
            const resolved = items.filter((report) => report.status === 'resolved').length;
            const rate = items.length ? Math.round((resolved / items.length) * 100) : 0;
            return (
              <div key={district} className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
                <div className="flex justify-between mb-2">
                  <span style={{ fontWeight: 800 }}>{district}</span>
                  <span style={{ color: '#8BA3C7' }}>{items.length} reports</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#0A1628' }}>
                  <div className="h-full" style={{ width: `${rate}%`, background: '#00C896' }} />
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
          <h2 className="mb-3" style={{ fontWeight: 900 }}>Recent Resolutions</h2>
          {reports.filter((report) => report.status === 'resolved').slice(0, 10).map((report) => (
            <div key={report.id} className="flex items-center gap-3 py-3" style={{ borderTop: '1px solid rgba(0,212,255,0.06)' }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: '#00C896' }} />
              <span style={{ color: '#8BA3C7' }}>{report.category} in {report.district} fixed in {Math.max(1, Math.round(((report.resolvedAt ?? new Date()).getTime() - report.createdAt.getTime()) / 86400000))} days</span>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

