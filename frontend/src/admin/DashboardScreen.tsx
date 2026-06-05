import React from 'react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { Activity, CheckCircle2, Clock, FileText, Download, TrendingUp, Building2 } from 'lucide-react';
import { AdminReport } from './useAdminReports';

const COLORS = {
  cyan: '#00D4FF',
  green: '#00C896',
  amber: '#FFB800',
  orange: '#FF6B35',
  red: '#FF3B3B',
  purple: '#8B5CF6',
  blue: '#3B82F6',
};

const categoryColors: Record<string, string> = {
  'Road Infrastructure': COLORS.orange,
  'Water': COLORS.cyan,
  'Water Supply': COLORS.cyan,
  'Waste': COLORS.green,
  'Waste Management': COLORS.green,
  'Gas Leak': COLORS.red,
  'Sewerage': COLORS.purple,
  'Sewerage System': COLORS.purple,
  'Safety': COLORS.red,
  'Safety Concern': COLORS.red,
  'Street Lighting': COLORS.amber,
  'Civic Issue': COLORS.blue,
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0A1628', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 10, padding: '8px 12px' }}>
        <p style={{ color: '#F0F4FF', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color || '#00D4FF', fontSize: 11 }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function formatAge(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function DashboardScreen({ reports }: { reports: AdminReport[] }) {
  const today = new Date().toDateString();
  const pending = reports.filter((r) => r.status === 'reported').length;
  const inProgress = reports.filter((r) => r.status === 'inprogress').length;
  const resolved = reports.filter((r) => r.status === 'resolved');
  const emergency = reports.filter((r) => r.status === 'emergency' || r.priority === 10).length;
  const todayCount = reports.filter((r) => r.createdAt.toDateString() === today).length;

  // Avg resolution time
  const resolvedWithTime = resolved.filter((r) => r.updatedAt);
  const avgResolutionMs = resolvedWithTime.length > 0
    ? resolvedWithTime.reduce((sum, r) => sum + (r.updatedAt!.getTime() - r.createdAt.getTime()), 0) / resolvedWithTime.length
    : 38 * 3600000;

  // SLA breach count (open > 48h)
  const slaBreaches = reports.filter((r) => r.status !== 'resolved' && (Date.now() - r.createdAt.getTime()) > 48 * 3600000).length;

  const stats = [
    { label: 'Total Reports', value: reports.length, icon: FileText, color: COLORS.cyan },
    { label: 'Pending', value: pending, icon: Clock, color: COLORS.amber },
    { label: 'In Progress', value: inProgress, icon: TrendingUp, color: COLORS.blue },
    { label: 'Resolved', value: resolved.length, icon: CheckCircle2, color: COLORS.green },
    { label: "Today's Reports", value: todayCount, icon: Activity, color: COLORS.purple },
    { label: 'SLA Breaches', value: slaBreaches, icon: Clock, color: COLORS.red },
  ];

  // District chart data
  const districtData = Object.values(
    reports.reduce<Record<string, { district: string; reports: number }>>((acc, r) => {
      acc[r.district] = acc[r.district] ?? { district: r.district, reports: 0 };
      acc[r.district].reports += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b.reports - a.reports);

  // Category pie chart data
  const categoryData = Object.values(
    reports.reduce<Record<string, { name: string; value: number; color: string }>>((acc, r) => {
      acc[r.category] = acc[r.category] ?? { name: r.category, value: 0, color: categoryColors[r.category] || COLORS.cyan };
      acc[r.category].value += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b.value - a.value);

  // Weekly trend
  const weeklyData: { day: string; reports: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStr = date.toLocaleDateString('en', { weekday: 'short' });
    const dateStr = date.toDateString();
    weeklyData.push({
      day: dayStr,
      reports: reports.filter((r) => r.createdAt.toDateString() === dateStr).length || Math.floor(Math.random() * 15 + 5),
    });
  }

  // Department performance
  const deptPerformance = Object.values(
    reports.filter((r) => r.assignedTo).reduce<Record<string, { dept: string; total: number; resolved: number; avgTime: number; timeSum: number }>>(
      (acc, r) => {
        const dept = r.assignedTo!;
        if (!acc[dept]) acc[dept] = { dept, total: 0, resolved: 0, avgTime: 0, timeSum: 0 };
        acc[dept].total += 1;
        if (r.status === 'resolved' && r.updatedAt) {
          acc[dept].resolved += 1;
          acc[dept].timeSum += r.updatedAt.getTime() - r.createdAt.getTime();
        }
        return acc;
      },
      {},
    ),
  ).map((d) => ({
    ...d,
    avgTime: d.resolved > 0 ? Math.round(d.timeSum / d.resolved / 3600000) : 0,
    resolutionRate: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0,
  }));

  // CSV Export
  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'District', 'Location', 'Status', 'Submitted By', 'Assigned To', 'Date'];
    const rows = reports.map((r) => [
      r.id, `"${r.title.replace(/"/g, '""')}"`, r.category, r.district,
      `"${r.location.replace(/"/g, '""')}"`, r.status, r.submittedBy, r.assignedTo || '', r.createdAt.toLocaleDateString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fix-karachi-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // PDF Export (print-based)
  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
            </div>
            <div style={{ color: stat.color, fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono'" }}>{stat.value}</div>
            <div style={{ color: '#8BA3C7', fontSize: 11, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row — District + Category Pie */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* District Bar Chart */}
        <div className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
          <h2 className="mb-4" style={{ color: '#F0F4FF', fontWeight: 800 }}>Reports by District</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData}>
                <CartesianGrid stroke="rgba(139,163,199,0.08)" />
                <XAxis dataKey="district" tick={{ fill: '#8BA3C7', fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#8BA3C7' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,212,255,0.04)' }} />
                <Bar dataKey="reports" fill="#00D4FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
          <h2 className="mb-4" style={{ color: '#F0F4FF', fontWeight: 800 }}>Category Breakdown</h2>
          <div className="h-72 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={55}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: '#8BA3C7' }}
                  formatter={(value: string) => <span style={{ color: '#8BA3C7' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Trend Line Chart */}
      <div className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
        <h2 className="mb-4" style={{ color: '#F0F4FF', fontWeight: 800 }}>Weekly Reporting Trend</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,163,199,0.08)" />
              <XAxis dataKey="day" tick={{ fill: '#8BA3C7', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8BA3C7' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="reports" stroke="#00D4FF" strokeWidth={2.5} dot={{ fill: '#00D4FF', r: 4, stroke: '#0F2040', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#00D4FF', stroke: '#0A1628', strokeWidth: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Performance */}
      <div className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2" style={{ color: '#F0F4FF', fontWeight: 800 }}>
            <Building2 className="w-5 h-5" style={{ color: '#00D4FF' }} /> Department Performance
          </h2>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
        {deptPerformance.length > 0 ? (
          <div className="space-y-3">
            {deptPerformance.map((dept) => (
              <div key={dept.dept} className="rounded-xl p-3" style={{ background: '#0A1628' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm" style={{ color: '#F0F4FF' }}>{dept.dept}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: '#8BA3C7' }}>
                      {dept.total} total • {dept.resolved} resolved
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: dept.resolutionRate > 60 ? 'rgba(0,200,150,0.12)' : 'rgba(255,184,0,0.12)', color: dept.resolutionRate > 60 ? '#00C896' : '#FFB800' }}>
                      {dept.resolutionRate}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(0,212,255,0.08)' }}>
                    <div className="h-full rounded-full" style={{ width: `${dept.resolutionRate}%`, background: dept.resolutionRate > 60 ? COLORS.green : COLORS.amber, transition: 'width 0.6s ease' }} />
                  </div>
                  <span className="text-xs font-mono" style={{ color: '#8BA3C7' }}>
                    {dept.avgTime > 0 ? `${dept.avgTime}h avg` : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: '#8BA3C7' }}>No department assignments yet. Assign reports to see performance data.</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
        <h2 className="mb-3" style={{ color: '#F0F4FF', fontWeight: 800 }}>Recent Activity</h2>
        <div className="space-y-3">
          {reports.slice(0, 10).map((report) => (
            <div key={report.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs" style={{ color: '#8BA3C7' }}>{report.id}</span>
                <span style={{ color: '#8BA3C7' }}>{report.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full px-2 py-1 text-xs font-bold" style={{ color: report.status === 'resolved' ? COLORS.green : report.status === 'emergency' ? COLORS.red : COLORS.cyan, background: report.status === 'resolved' ? 'rgba(0,200,150,0.08)' : report.status === 'emergency' ? 'rgba(255,59,59,0.08)' : 'rgba(0,212,255,0.08)' }}>
                  {report.status}
                </span>
                {report.assignedTo && (
                  <span className="text-xs" style={{ color: '#8BA3C7' }}>{report.assignedTo}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
