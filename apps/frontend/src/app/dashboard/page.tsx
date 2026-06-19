'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  Plus,
  UserPlus,
  CheckCircle,
  Activity,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface DashboardData {
  stats: {
    totalFaculty: number;
    totalStudents: number;
    totalClasses: number;
    pendingApprovals: number;
  };
  recentActivity: Array<{
    id: string;
    description: string;
    timestamp: string;
    type: string;
  }>;
  summary: {
    publishedAssessments: number;
    activeLessons: number;
    submissionRate: number;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/analytics');
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          toast.error('Failed to load analytics');
        }
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || { totalFaculty: 0, totalStudents: 0, totalClasses: 0, pendingApprovals: 0 };
  const activity = data?.recentActivity || [];
  const summary = data?.summary || { publishedAssessments: 0, activeLessons: 0, submissionRate: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Organization Admin Dashboard</h2>
        <p className="text-gray-500 text-xs md:text-sm">Monitor your institution at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Faculty</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalFaculty}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <GraduationCap size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Students</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalStudents}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Classes</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalClasses}</h3>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <BookOpen size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingApprovals}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-1 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Activity</h3>
            <p className="text-gray-400 text-[10px]">Latest actions across your organization.</p>
          </div>

          {activity.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">No recent activity.</div>
          ) : (
            <div className="space-y-3">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity size={12} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-700 font-medium">{a.description}</p>
                    <p className="text-gray-400 text-[10px]">{new Date(a.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link href="/admin/audit" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold pt-2">
            View All Activity <ChevronRight size={14} />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/users" className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors">
              <GraduationCap size={16} /> Create Faculty
            </Link>
            <Link href="/admin/students" className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors">
              <UserPlus size={16} /> Add Student
            </Link>
            <Link href="/admin/classes" className="flex items-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-xl text-xs font-semibold hover:bg-purple-100 transition-colors">
              <Plus size={16} /> Create Class
            </Link>
            <Link href="/admin/approvals" className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-colors">
              <CheckCircle size={16} /> View Approvals
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Stats Summary</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-gray-500">Published Assessments</span>
                <span className="text-gray-900 font-bold">{summary.publishedAssessments}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(summary.publishedAssessments * 10, 100)}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-gray-500">Active Lessons</span>
                <span className="text-gray-900 font-bold">{summary.activeLessons}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.min(summary.activeLessons * 10, 100)}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-gray-500">Submission Rate</span>
                <span className="text-gray-900 font-bold">{summary.submissionRate}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${summary.submissionRate}%` }} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-100">
            <TrendingUp size={12} className="text-emerald-500" />
            <span>Submission rate is {summary.submissionRate >= 70 ? 'healthy' : 'needs improvement'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
