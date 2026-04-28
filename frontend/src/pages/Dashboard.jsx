import React, { useEffect, useState } from 'react';
import { getDashboardStats, getTopEmployees } from '../services/api';
import { Users, Briefcase, CheckCircle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [topEmployees, setTopEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, empRes] = await Promise.all([
          getDashboardStats(),
          getTopEmployees()
        ]);
        setStats(statsRes.data.data);
        setTopEmployees(empRes.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Employees" value={stats?.employees?.total || 0} icon={<Users />} color="bg-blue-500" />
        <StatCard title="Active Projects" value={stats?.projects?.active || 0} icon={<Briefcase />} color="bg-indigo-500" />
        <StatCard title="Open Tasks" value={stats?.projects?.openTasks || 0} icon={<CheckCircle />} color="bg-emerald-500" />
        <StatCard title="Avg Performance" value={stats?.employees?.avgPerformance || 0} icon={<TrendingUp />} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Employees */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Top Performers</h2>
          <div className="space-y-4">
            {topEmployees.map((emp) => (
              <div key={emp.employeeId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{emp.name}</p>
                  <p className="text-sm text-gray-500">{emp.department} • {emp.experience} yrs exp</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Score: {emp.performanceScore}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">AI Workforce Engine</h2>
          <p className="text-gray-600 mb-4">
            Karmavyuha uses a multi-factor recommendation algorithm to match tasks with the best employees based on:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
            <li><strong>Skill Overlap (40%)</strong>: Matches required task skills with employee capabilities.</li>
            <li><strong>Performance History (25%)</strong>: Favors proven top-performers.</li>
            <li><strong>Experience Match (15%)</strong>: Ensures the employee meets seniority requirements.</li>
            <li><strong>Availability (10%)</strong>: Prevents overloading employees.</li>
            <li><strong>Department Fit (10%)</strong>: Aligns tasks with core departmental responsibilities.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center">
    <div className={`p-3 rounded-full text-white ${color} mr-4`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default Dashboard;
