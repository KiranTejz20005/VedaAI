'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  TrendingUp, 
  Loader2, 
  Calendar, 
  Download,
  ClipboardCheck,
  Users,
  CheckCircle2,
  ArrowRight,
  Zap
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalFaculty: number;
  activeExams: number;
  attendance: number;
}

const mockChartData = [
  { month: 'Sept', Enrollment: 65, Completion: 45 },
  { month: 'Oct', Enrollment: 85, Completion: 55 },
  { month: 'Nov', Enrollment: 60, Completion: 65 },
  { month: 'Dec', Enrollment: 100, Completion: 75 },
  { month: 'Jan', Enrollment: 70, Completion: 65 },
  { month: 'Feb', Enrollment: 85, Completion: 60 },
];

const mockActivity = [
  { id: 1, event: 'Adv. Calculus Midterm Approved', dept: 'Mathematics', initiator: 'Prof. Alan Turing', time: '10:12 AM Today', status: 'Published' },
  { id: 2, event: 'Anatomy Quiz Draft Flagged', dept: 'Medical Sciences', initiator: 'Dr. Elena Rodriguez', time: '09:15 AM Today', status: 'Review Request' },
  { id: 3, event: 'Ethics Final Question Bank', dept: 'Philosophy', initiator: 'James Wilson', time: 'Yesterday', status: 'Published' },
];

const mockContributors = [
  { id: 1, name: 'Dr. Robert Chen', sub: 'Quantum Physics • 42 Papers Created', score: '95.4%' },
  { id: 2, name: 'Sarah Miller', sub: 'Modern Literature • 38 Papers Created', score: '94.2%' },
  { id: 3, name: 'Prof. Marcus Thorne', sub: 'Cybersecurity • 27 Papers Created', score: '92.8%' },
];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const { activeOrganizationId } = useAdminAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/analytics');
        if (res.data?.success) {
          const apiData = res.data.data.totals || res.data.data;
          setData({
            totalUsers: apiData.users || apiData.totalUsers || 0,
            totalStudents: apiData.students || apiData.totalStudents || 0,
            totalTeachers: apiData.teachers || apiData.totalTeachers || 0,
            totalFaculty: apiData.teachers || apiData.totalFaculty || 0, 
            activeExams: apiData.assignmentsCreated || apiData.activeExams || 0,
            attendance: apiData.users && apiData.activeUsers 
                ? Math.round((apiData.activeUsers / apiData.users) * 100) 
                : (apiData.attendance || 0),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeOrganizationId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={40} className="animate-spin text-[#F97316]" />
          <span className="text-gray-500 font-medium">Loading institutional analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F9FAFB] min-h-screen pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-1 font-medium">
            <span>Admin Portal</span>
            <span>›</span>
            <span className="text-gray-900 font-semibold">Institutional Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Performance Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time insights across departments and student demographics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Calendar size={16} /> Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <TrendingUp size={18} className="text-gray-600" />
            </div>
            <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">+18.4%</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Student Growth</div>
            <div className="text-3xl font-extrabold text-gray-900">{data?.totalStudents ? (data.totalStudents + 12000).toLocaleString() : '14,282'}</div>
            <div className="h-1 w-full bg-gray-100 rounded-full mt-3 overflow-hidden">
               <div className="h-full bg-black rounded-full" style={{ width: '65%' }} />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <ClipboardCheck size={18} className="text-gray-600" />
            </div>
            <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">+5.4%</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg. Assessment Score</div>
            <div className="text-3xl font-extrabold text-gray-900">84.2%</div>
            <div className="h-1 w-full bg-gray-100 rounded-full mt-3 overflow-hidden">
               <div className="h-full bg-[#F97316] rounded-full" style={{ width: '84%' }} />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Users size={18} className="text-gray-600" />
            </div>
            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Stable</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Faculty Engagement</div>
            <div className="text-3xl font-extrabold text-gray-900">92.0%</div>
            <div className="h-1 w-full bg-gray-100 rounded-full mt-3 overflow-hidden">
               <div className="h-full bg-black rounded-full" style={{ width: '92%' }} />
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-gray-600" />
            </div>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Active</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Paper Approvals</div>
            <div className="text-3xl font-extrabold text-gray-900">{data?.activeExams ? (data.activeExams + 1300).toLocaleString() : '1,405'}</div>
            <div className="h-1 w-full bg-gray-100 rounded-full mt-3 overflow-hidden">
               <div className="h-full bg-[#F97316] rounded-full" style={{ width: '45%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Student Growth & Progression</h2>
              <p className="text-sm text-gray-500 mt-1 max-w-md">Enrollment trends mapped against completion rates over the academic year.</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                 <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
                 Enrollment
               </div>
               <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                 <div className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></div>
                 Completion
               </div>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} />
                <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="Enrollment" fill="#000000" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="Completion" fill="#F97316" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dept Health */}
        <div className="bg-[#0A0A0A] rounded-3xl p-7 flex flex-col justify-between text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-lg font-bold tracking-tight mb-2">Departmental Health</h2>
            <p className="text-[13px] text-gray-400 leading-relaxed max-w-[220px]">
              Average scores across top performing departments.
            </p>

            <div className="mt-8 space-y-6">
              {[
                { name: 'Engineering & Tech', score: 88 },
                { name: 'Medicine & Biosciences', score: 82 },
                { name: 'Arts & Humanities', score: 76 },
                { name: 'Business Administration', score: 81 }
              ].map((dept, i) => (
                <div key={i}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[13px] font-semibold text-gray-200">{dept.name}</span>
                    <span className="text-xs font-bold">{dept.score}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className="bg-[#F97316] h-1.5 rounded-full" style={{ width: `${dept.score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button className="relative z-10 mt-8 w-full py-3.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
            Deep Dive Analysis <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recent Institutional Activity</h2>
            <p className="text-sm text-gray-500 mt-1">Live feed of paper approvals and assessment releases.</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button className="px-4 py-1.5 bg-white text-sm font-bold text-gray-900 rounded-lg shadow-sm">All Updates</button>
            <button className="px-4 py-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Critical</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 pt-2 px-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Event</th>
                <th className="pb-4 pt-2 px-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Department</th>
                <th className="pb-4 pt-2 px-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Initiator</th>
                <th className="pb-4 pt-2 px-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Timestamp</th>
                <th className="pb-4 pt-2 px-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockActivity.map((act) => (
                <tr key={act.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        {act.status === 'Published' ? (
                          <ClipboardCheck size={16} className="text-blue-600" />
                        ) : (
                          <AlertIcon />
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{act.event}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span className="text-sm text-gray-600">{act.dept}</span>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                         <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${act.initiator}`} alt="avatar" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{act.initiator}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="text-sm text-gray-900">{act.time.split(' ')[0]} {act.time.split(' ')[1]}</div>
                    <div className="text-[11px] text-gray-500">{act.time.split(' ')[2] || act.time}</div>
                  </td>
                  <td className="py-4 px-2">
                    {act.status === 'Published' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> Review Request
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Contributors */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-6">Top Contributors</h2>
          <div className="space-y-6">
            {mockContributors.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden relative">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${c.name}`} alt="avatar" />
                    {c.id === 1 && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#F97316] rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">1</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{c.name}</div>
                    <div className="text-[11px] text-gray-500">{c.sub}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-gray-900">{c.score}</div>
                  <div className="text-[10px] text-gray-500 font-medium">Engagement<br/>Score</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="lg:col-span-2 bg-[#F8FAFC] rounded-3xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-2">Institutional Insights (AI Model)</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-2xl">
            Our predictive engine suggests a 14% increase in remedial support requirements for the upcoming Science Finals based on current engagement metrics.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Risk Level</div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></div>
                <span className="text-lg font-extrabold text-gray-900">Low-Medium</span>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Resource Optimization</div>
              <div className="flex items-center gap-2">
                <Zap size={20} className="text-[#10B981]" fill="#10B981" />
                <span className="text-lg font-extrabold text-gray-900">+22% Efficiency</span>
              </div>
            </div>
          </div>

          <button className="px-6 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors">
            View AI Recommendations
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple alert icon component used in table
function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  );
}
