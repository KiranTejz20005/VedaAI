'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BarChart3, TrendingUp, Loader2 } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalFaculty: number;
  activeExams: number;
  attendance: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
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
        } else {
          setError('Failed to load analytics');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load analytics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={40} className="animate-spin text-blue-600" />
          <span className="text-gray-500">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
        <p className="font-semibold">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 size={28} className="text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
          <p className="text-gray-600">Overview of system-wide statistics and metrics</p>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">Total Users</h3>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.totalUsers}</p>
            <p className="text-xs text-gray-500 mt-2">All users in system</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">Total Students</h3>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.totalStudents}</p>
            <p className="text-xs text-gray-500 mt-2">Active students</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">Total Teachers</h3>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-orange-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.totalTeachers}</p>
            <p className="text-xs text-gray-500 mt-2">Teaching staff</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">Total Faculty</h3>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.totalFaculty}</p>
            <p className="text-xs text-gray-500 mt-2">Faculty members</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">Active Exams</h3>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-red-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.activeExams}</p>
            <p className="text-xs text-gray-500 mt-2">Running examinations</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">Attendance</h3>
              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-cyan-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.attendance}%</p>
            <p className="text-xs text-gray-500 mt-2">Today's attendance</p>
          </div>
        </div>
      )}
    </div>
  );
}
