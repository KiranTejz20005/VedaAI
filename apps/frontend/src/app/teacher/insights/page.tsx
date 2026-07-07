'use client';

import { Users, AlertTriangle, TrendingUp, BookOpen, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { useClassInsights } from '@/hooks/useClassInsights';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function ClassInsightsPage() {
  const { 
    classes, 
    selectedClassId, 
    setSelectedClassId, 
    dashboardData, 
    loadingClasses, 
    loadingDashboard, 
    error, 
    refresh 
  } = useClassInsights();

  if (loadingClasses) return <LoadingState lines={8} />;
  
  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">No Classes Assigned</h2>
        <p className="text-slate-500">You do not have any active classes assigned to you.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Class Insights"
          subtitle="Real-time performance and engagement analytics."
        />
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-sm font-semibold text-slate-600 pl-2">Select Class:</span>
          <select 
            value={selectedClassId} 
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="border-none bg-slate-50 text-slate-800 font-bold text-sm rounded-lg py-2 px-4 focus:ring-2 focus:ring-indigo-500"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                Grade {c.grade} - {c.section} ({c.academicYear})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : loadingDashboard || !dashboardData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-xl border border-slate-100 animate-pulse" />)}
          <div className="lg:col-span-2 h-80 bg-white rounded-xl border border-slate-100 animate-pulse" />
          <div className="lg:col-span-2 h-80 bg-white rounded-xl border border-slate-100 animate-pulse" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 relative overflow-hidden group">
              <div className="flex items-center gap-3 text-indigo-600 mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg"><Users size={20} /></div>
                <span className="font-bold text-sm text-slate-600 uppercase tracking-wider">Total Students</span>
              </div>
              <div className="text-4xl font-extrabold text-slate-900">{dashboardData.overview.totalStudents}</div>
              <div className="absolute -right-4 -bottom-4 text-indigo-50 opacity-50 group-hover:scale-110 transition-transform"><Users size={100} /></div>
            </Card>

            <Card className="p-6 relative overflow-hidden group">
              <div className="flex items-center gap-3 text-emerald-600 mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle2 size={20} /></div>
                <span className="font-bold text-sm text-slate-600 uppercase tracking-wider">Attendance Rate</span>
              </div>
              <div className="text-4xl font-extrabold text-slate-900">{dashboardData.overview.attendanceRate.toFixed(1)}%</div>
              <div className="absolute -right-4 -bottom-4 text-emerald-50 opacity-50 group-hover:scale-110 transition-transform"><CheckCircle2 size={100} /></div>
            </Card>

            <Card className="p-6 relative overflow-hidden group">
              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <div className="p-2 bg-amber-50 rounded-lg"><BookOpen size={20} /></div>
                <span className="font-bold text-sm text-slate-600 uppercase tracking-wider">Assignment Completion</span>
              </div>
              <div className="text-4xl font-extrabold text-slate-900">{dashboardData.overview.assignmentCompletionRate.toFixed(1)}%</div>
              <div className="absolute -right-4 -bottom-4 text-amber-50 opacity-50 group-hover:scale-110 transition-transform"><BookOpen size={100} /></div>
            </Card>

            <Card className="p-6 relative overflow-hidden group">
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <div className="p-2 bg-rose-50 rounded-lg"><TrendingUp size={20} /></div>
                <span className="font-bold text-sm text-slate-600 uppercase tracking-wider">Average Grade</span>
              </div>
              <div className="text-4xl font-extrabold text-slate-900">{dashboardData.overview.averageGrade.toFixed(1)}%</div>
              <div className="absolute -right-4 -bottom-4 text-rose-50 opacity-50 group-hover:scale-110 transition-transform"><TrendingUp size={100} /></div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Attendance Trend (30 Days)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.trends.attendance}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} dx={-10} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Attendance']}
                    />
                    <Area type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Submission Volume Trend</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.trends.submissions}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} dx={-10} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Line type="monotone" dataKey="submissions" stroke="#6366F1" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Student Insights Table */}
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Student Insights</h3>
                <p className="text-sm text-slate-500 mt-1">Detailed performance metrics per student.</p>
              </div>
              <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <AlertTriangle size={16} />
                {dashboardData.overview.atRiskCount} At-Risk Students
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Roll No</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Submissions</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Grade</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardData.studentInsights.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-semibold text-slate-800">{student.name}</td>
                      <td className="p-4 text-slate-500 text-sm">{student.rollNo}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${student.attendanceRate < 70 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${student.attendanceRate}%` }} 
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-600">{student.attendanceRate.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium text-slate-600">{student.assignmentCompletionRate.toFixed(0)}%</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-bold text-slate-700">{student.averageGrade !== null ? `${student.averageGrade.toFixed(1)}%` : 'N/A'}</span>
                      </td>
                      <td className="p-4">
                        {student.isAtRisk ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                            At Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            On Track
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {dashboardData.studentInsights.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">No students found in this class.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
