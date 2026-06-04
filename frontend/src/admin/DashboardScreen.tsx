import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, CheckCircle2, Clock, FileText } from 'lucide-react';
import { AdminReport } from './useAdminReports';

export function DashboardScreen({ reports }: { reports: AdminReport[] }) {
  const today = new Date().toDateString();
  const pending = reports.filter((report) => report.status === 'reported').length;
  const resolved = reports.filter((report) => report.status === 'resolved');
  const chartData = Object.values(reports.reduce<Record<string, { district: string; reports: number }>>((acc, report) => {
    acc[report.district] = acc[report.district] ?? { district: report.district, reports: 0 };
    acc[report.district].reports += 1;
    return acc;
  }, {}));

  const stats = [
    { label: 'Total Reports', value: reports.length, icon: FileText },
    { label: 'Pending', value: pending, icon: Clock },
    { label: 'Avg Resolution Time', value: '38h', icon: CheckCircle2 },
    { label: "Today's Reports", value: reports.filter((report) => report.createdAt.toDateString() === today).length, icon: Activity },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
            <stat.icon className="w-5 h-5 mb-3" style={{ color: '#00D4FF' }} />
            <div style={{ color: '#F0F4FF', fontSize: 24, fontWeight: 800 }}>{stat.value}</div>
            <div style={{ color: '#8BA3C7', fontSize: 12 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
        <h2 className="mb-4" style={{ color: '#F0F4FF', fontWeight: 800 }}>Reports by District</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="rgba(139,163,199,0.12)" />
              <XAxis dataKey="district" tick={{ fill: '#8BA3C7', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8BA3C7' }} />
              <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(0,212,255,0.2)', color: '#F0F4FF' }} />
              <Bar dataKey="reports" fill="#00D4FF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
        <h2 className="mb-3" style={{ color: '#F0F4FF', fontWeight: 800 }}>Recent Activity</h2>
        <div className="space-y-3">
          {reports.slice(0, 10).map((report) => (
            <div key={report.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
              <span style={{ color: '#8BA3C7' }}>{report.title}</span>
              <span className="rounded-full px-2 py-1 text-xs" style={{ color: '#00D4FF', background: 'rgba(0,212,255,0.08)' }}>{report.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

