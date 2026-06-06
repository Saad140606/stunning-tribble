import React from 'react';
import { BarChart3, CheckCircle, Clock, Timer, MapPin, Activity, Flame, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Report, User } from '../App';
import { translations } from './translations';
import { useCountUp } from '../hooks/useCountUp';

interface AnalyticsScreenProps {
  reports: Report[];
  user: User;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '10px', padding: '10px 14px' }}>
        <p style={{ color: '#F0F4FF', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color || entry.fill, fontSize: '12px' }}>
            {entry.value} reports
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function AnalyticsScreen({ reports, user }: AnalyticsScreenProps) {
  const t = translations[user.language];

  const districtReports = reports.filter(r => r.district === user.district);
  const totalReports = districtReports.length;
  const resolvedCount = districtReports.filter(r => r.status === 'resolved').length;
  const pendingCount = districtReports.filter(r => r.status !== 'resolved').length;

  const animatedTotal = useCountUp(totalReports);
  const animatedResolved = useCountUp(resolvedCount);
  const animatedPending = useCountUp(pendingCount);

  // Weekly data computed from real reports
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData = dayNames.map((day, i) => ({
    day,
    reports: reports.filter(r => new Date(r.timestamp).getDay() === i).length,
  }));

  // Top areas from real district counts
  const districtCounts = reports.reduce<Record<string, number>>((acc, r) => {
    if (r.district) { acc[r.district] = (acc[r.district] || 0) + 1; }
    return acc;
  }, {});
  const areaColors = ['#FF6B35', '#00D4FF', '#FFB800', '#FF3B3B', '#00C896', '#8B5CF6'];
  const topAreas = Object.entries(districtCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count], i) => ({ name, count, color: areaColors[i] }));
  const maxAreaCount = topAreas.length > 0 ? Math.max(...topAreas.map(a => a.count)) : 1;

  // Real average resolution time
  const resolvedReports = districtReports.filter(r => r.status === 'resolved');
  const avgHours = resolvedReports.length > 0
    ? Math.round(resolvedReports.reduce((sum, r) => sum + (Date.now() - r.timestamp.getTime()), 0) / resolvedReports.length / 3600000)
    : 0;
  const animatedAvg = useCountUp(avgHours);

  // Reports today
  const reportsToday = districtReports.filter(r => {
    const today = new Date();
    const rDate = new Date(r.timestamp);
    return today.getFullYear() === rDate.getFullYear() &&
           today.getMonth() === rDate.getMonth() &&
           today.getDate() === rDate.getDate();
  }).length;
  const animatedToday = useCountUp(reportsToday);

  // Resolution Rate Chart Data
  const resolutionRate = totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0;
  const resolutionData = [
    { name: t.resolved, value: resolvedCount, color: '#00C896' },
    { name: t.pending, value: pendingCount, color: '#FFB800' }
  ];

  const statsCards = [
    { title: t.totalReports, value: animatedTotal, icon: BarChart3, color: '#00D4FF' },
    { title: t.resolved, value: animatedResolved, icon: CheckCircle, color: '#00C896' },
    { title: t.pending, value: animatedPending, icon: Clock, color: '#FFB800' },
    { title: t.avgResolution, value: `${animatedAvg}h`, icon: Timer, color: '#8B5CF6' },
  ];

  // Category data for bar chart
  const categoryData = [
    { name: t.pothole, count: districtReports.filter(r => r.type === 'pothole').length, fill: '#FF6B35' },
    { name: t.garbage, count: districtReports.filter(r => r.type === 'garbage').length, fill: '#00C896' },
    { name: t.water, count: districtReports.filter(r => r.type === 'water').length, fill: '#00D4FF' },
    { name: t.streetlight, count: districtReports.filter(r => r.type === 'streetlight').length, fill: '#FFB800' },
    { name: t.sewerage, count: districtReports.filter(r => r.type === 'sewerage').length, fill: '#8B5CF6' },
    { name: t.safety, count: districtReports.filter(r => r.type === 'safety').length, fill: '#FF3B3B' },
  ];

  return (
    <motion.div className="min-h-screen pb-12" style={{ background: '#0A1628' }} variants={pageVariants} initial="hidden" animate="show">
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(10, 22, 40, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,212,255,0.08)' }}
      >
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '22px', color: '#F0F4FF' }}>
            {t.cityDashboard}
          </h1>
          <p style={{ fontSize: '13px', color: '#4A6080', marginTop: '2px' }}>
            {user.district} district • Live monitoring
          </p>
        </div>

        {/* Live Citizen Activity Banner */}
        <div className="flex items-center gap-2 bg-[#0F2040] border border-[rgba(0,212,255,0.15)] rounded-full px-4 py-1.5 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-xs font-semibold text-[#8BA3C7]" style={{ fontFamily: "'Plus Jakarta Sans'" }}>
            {animatedToday} {user.language === 'ur' ? 'آج کی رپورٹس' : 'filed today'}
          </span>
        </div>
      </div>

      <motion.div className="p-6 space-y-6 max-w-7xl mx-auto" variants={itemVariants}>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              className="rounded-2xl p-5"
              style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.35, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}15` }}
                >
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              <div
                style={{ fontFamily: "'JetBrains Mono'", fontSize: '28px', fontWeight: 700, color: stat.color }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: '#4A6080', marginTop: '4px', fontWeight: 500 }}>{stat.title}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <motion.div
            className="rounded-2xl p-5 flex flex-col justify-between"
            style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF', marginBottom: '20px' }}>
              {t.reportsByCategory}
            </h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#4A6080', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 212, 255, 0.03)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Line Chart */}
          <motion.div
            className="rounded-2xl p-5 flex flex-col justify-between"
            style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.35 }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF', marginBottom: '20px' }}>
              {t.weeklyTrend}
            </h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.04)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#4A6080', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="reports"
                    stroke="#00D4FF"
                    strokeWidth={2.5}
                    dot={{ fill: '#00D4FF', r: 4, strokeWidth: 2, stroke: '#0F2040' }}
                    activeDot={{ r: 6, fill: '#00D4FF', stroke: '#0A1628', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Lower Dashboard Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resolution Rate Donut Chart */}
          <motion.div
            className="rounded-2xl p-5 flex flex-col justify-between"
            style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.35 }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF', marginBottom: '20px' }}>
              {user.language === 'ur' ? 'رپورٹس کی حیثیت' : 'Resolution Performance'}
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
              <div className="relative flex items-center justify-center">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={resolutionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {resolutionData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-[#00C896] font-mono">{resolutionRate}%</span>
                  <span className="text-[10px] text-[#4A6080] tracking-wider uppercase font-semibold">{t.resolved}</span>
                </div>
              </div>

              <div className="space-y-4 flex-1 max-w-[240px] w-full">
                <div className="space-y-2.5">
                  {resolutionData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-[#8BA3C7]">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                        <span className="font-medium">{entry.name}</span>
                      </div>
                      <span className="font-bold text-white font-mono bg-[rgba(255,255,255,0.03)] px-2.5 py-0.5 rounded-md border border-[rgba(255,255,255,0.05)]">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-[rgba(0,212,255,0.08)]">
                  <p className="text-[11px] text-[#4A6080] leading-relaxed">
                    {user.language === 'ur'
                      ? 'بند ہونے اور فعال ہونے والے مسائل کی کل شرح۔'
                      : 'Total breakdown of closed vs active citizen issues.'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Top Problem Areas */}
          <motion.div
            className="rounded-2xl p-5 flex flex-col justify-between"
            style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.35 }}
          >
            <h3 className="flex items-center gap-2 mb-4" style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF' }}>
              <MapPin className="w-4 h-4" style={{ color: '#00D4FF' }} />
              {t.topProblemAreas}
            </h3>
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {topAreas.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#4A6080]">{t.noReports}</div>
              ) : (
                topAreas.map((area, index) => (
                  <motion.div
                    key={area.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.07 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#F0F4FF' }}>{area.name}</span>
                      <span style={{ fontFamily: "'JetBrains Mono'", fontSize: '12px', fontWeight: 600, color: area.color }}>
                        {area.count}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(0,212,255,0.06)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: area.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(area.count / maxAreaCount) * 100}%` }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
