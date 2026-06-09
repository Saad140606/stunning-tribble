import React from 'react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart,
} from 'recharts';
import { Activity, CheckCircle2, Clock, FileText, Download, TrendingUp, Building2 } from 'lucide-react';
import { AdminReport } from './useAdminReports';
import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

const COLORS = {
  cyan: '#00D4FF',
  green: '#00C896',
  amber: '#FFB800',
  orange: '#FF6B35',
  red: '#FF3B3B',
  purple: '#8B5CF6',
  blue: '#3B82F6',
};

/* ── Design tokens from Stitch ── */
const T = {
  bg: '#0e1417',
  surface: '#1a2123',
  surfaceHigh: '#242b2e',
  surfaceHighest: '#2f3639',
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
  borderRadius: 12,
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
      <div style={{ ...glassCard, padding: '10px 14px', borderRadius: 10 }}>
        <p style={{ color: T.onSurface, fontSize: 12, fontWeight: 700, fontFamily: T.fontHeadline, marginBottom: 3 }}>{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color || T.accent, fontSize: 11, fontFamily: T.fontData }}>
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
      reports: reports.filter((r) => r.createdAt.toDateString() === dateStr).length,
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
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3"
      >
        {stats.map((stat) => (
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, borderColor: "rgba(0, 212, 255, 0.25)" }}
            key={stat.label} 
            className="p-4 cursor-pointer" 
            style={glassCard}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}20` }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
            </div>
            <div
              style={{
                color: stat.color,
                fontSize: 28,
                fontWeight: 700,
                fontFamily: T.fontData,
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                color: T.muted,
                fontSize: 11,
                marginTop: 6,
                fontFamily: T.fontHeadline,
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row — District + Category Pie */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="grid lg:grid-cols-2 gap-4"
      >
        {/* District Bar Chart */}
        <div className="p-5" style={glassCard}>
          <h2 style={{ color: T.onSurface, fontWeight: 700, fontFamily: T.fontHeadline, fontSize: 15, marginBottom: 16 }}>
            Reports by District
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData}>
                <CartesianGrid stroke="rgba(133,147,152,0.08)" />
                <XAxis dataKey="district" tick={{ fill: T.muted, fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fill: T.muted }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,212,255,0.03)' }} />
                <Bar dataKey="reports" fill={T.accent} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="p-5" style={glassCard}>
          <h2 style={{ color: T.onSurface, fontWeight: 700, fontFamily: T.fontHeadline, fontSize: 15, marginBottom: 16 }}>
            Category Breakdown
          </h2>
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
                  wrapperStyle={{ fontSize: 11, color: T.muted }}
                  formatter={(value: string) => <span style={{ color: T.muted }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Weekly Trend Area Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="p-5" 
        style={glassCard}
      >
        <h2 style={{ color: T.onSurface, fontWeight: 700, fontFamily: T.fontHeadline, fontSize: 15, marginBottom: 16 }}>
          Weekly Reporting Trend
        </h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(133,147,152,0.08)" />
              <XAxis dataKey="day" tick={{ fill: T.muted, fontSize: 11 }} />
              <YAxis tick={{ fill: T.muted }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="reports"
                stroke="#00d4ff"
                strokeWidth={2}
                fill="url(#areaGradient)"
                dot={{ fill: '#00d4ff', r: 4, stroke: T.surface, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#00d4ff', stroke: T.bg, strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Department Performance */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="p-5" 
        style={glassCard}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-2" style={{ color: T.onSurface, fontWeight: 700, fontFamily: T.fontHeadline, fontSize: 15 }}>
            <Building2 className="w-5 h-5" style={{ color: T.accent }} /> Department Performance
          </h2>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: T.accentSoft, color: T.accent, border: `1px solid ${T.border}`, fontFamily: T.fontHeadline }}
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: T.accentSoft, color: T.accent, border: `1px solid ${T.border}`, fontFamily: T.fontHeadline }}
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
        {deptPerformance.length > 0 ? (
          <div className="space-y-3">
            {deptPerformance.map((dept) => (
              <div key={dept.dept} className="rounded-xl p-4" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm" style={{ color: T.onSurface, fontFamily: T.fontHeadline }}>{dept.dept}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: T.muted, fontFamily: T.fontData }}>
                      {dept.total} total · {dept.resolved} resolved
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: dept.resolutionRate > 60 ? 'rgba(0,200,150,0.1)' : 'rgba(255,184,0,0.1)',
                        color: dept.resolutionRate > 60 ? '#00C896' : '#FFB800',
                        fontFamily: T.fontData,
                      }}
                    >
                      {dept.resolutionRate}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(168,232,255,0.06)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${dept.resolutionRate}%`,
                        background: dept.resolutionRate > 60
                          ? 'linear-gradient(90deg, #00C896, #00E6AA)'
                          : 'linear-gradient(90deg, #FFB800, #FFD060)',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: T.muted, fontFamily: T.fontData }}>
                    {dept.avgTime > 0 ? `${dept.avgTime}h avg` : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: T.muted }}>No department assignments yet. Assign reports to see performance data.</p>
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="p-5" 
        style={glassCard}
      >
        <h2 className="mb-4" style={{ color: T.onSurface, fontWeight: 700, fontFamily: T.fontHeadline, fontSize: 15 }}>
          Recent Activity
        </h2>
        <div className="space-y-1">
          {reports.slice(0, 10).map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between py-3 px-2 rounded-lg transition-colors"
              style={{ borderBottom: `1px solid ${T.border}` }}
            >
              <div className="flex items-center gap-3">
                <span style={{ color: T.muted, fontFamily: T.fontData, fontSize: 11 }}>{report.id}</span>
                <span style={{ color: T.onSurfaceVariant, fontFamily: T.fontHeadline, fontSize: 13 }}>{report.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{
                    color: report.status === 'resolved' ? COLORS.green : report.status === 'emergency' ? COLORS.red : T.accent,
                    background: report.status === 'resolved' ? 'rgba(0,200,150,0.08)' : report.status === 'emergency' ? 'rgba(255,59,59,0.08)' : T.accentSoft,
                    fontFamily: T.fontData,
                    fontSize: 10,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  {report.status}
                </span>
                {report.assignedTo && (
                  <span className="text-xs" style={{ color: T.muted, fontFamily: T.fontData }}>{report.assignedTo}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
