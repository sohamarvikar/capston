import React, { useEffect, useState } from 'react';
import { getDashboardStats, getTopEmployees, getProjects, getProjectProgress } from '../services/api';
import { Link } from 'react-router-dom';
import { Users, Briefcase, CheckCircle, TrendingUp, ArrowRight, Activity } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [topEmployees, setTopEmployees] = useState([]);
  const [projectProgress, setProjectProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, empRes, projRes] = await Promise.all([
          getDashboardStats(),
          getTopEmployees(),
          getProjects({ limit: 5 })
        ]);
        
        setStats(statsRes.data.data);
        setTopEmployees(empRes.data.data);
        
        // Fetch progress for top 5 projects
        const projects = projRes.data.data;
        const progressPromises = projects.map(p => getProjectProgress(p.projectKey));
        const progressResults = await Promise.all(progressPromises);
        setProjectProgress(progressResults.map(r => r.data.data));

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Could not connect to backend. Make sure the server is running on port 5001.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading manager dashboard...</div>;

  if (error) return (
    <div className="p-8 text-center">
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg inline-block">
        <p className="font-medium mb-2">Connection Error</p>
        <p className="text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700">
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Employees" value={stats?.employees?.total || 0} icon={<Users />} color="bg-blue-500" />
        <StatCard title="Active Projects" value={stats?.projects?.active || 0} icon={<Briefcase />} color="bg-indigo-500" />
        <StatCard title="Open Tasks" value={stats?.projects?.openTasks || 0} icon={<CheckCircle />} color="bg-emerald-500" />
        <StatCard title="Avg Performance" value={stats?.employees?.avgPerformance || 0} icon={<TrendingUp />} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress Tracker */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-indigo-500">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center"><Activity className="w-5 h-5 mr-2 text-indigo-500" /> Active Projects Progress</h2>
            <Link to="/projects" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          
          {projectProgress.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No active projects.</p>
          ) : (
            <div className="space-y-5">
              {projectProgress.map((proj) => (
                <div key={proj.projectKey}>
                  <div className="flex justify-between items-center mb-1">
                    <Link to={`/projects/${proj.projectKey}`} className="font-medium text-gray-900 hover:text-indigo-600 transition">
                      {proj.projectName} <span className="text-xs text-gray-500 font-normal">({proj.projectKey})</span>
                    </Link>
                    <span className="text-xs font-bold text-gray-700">{proj.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${proj.percentage}%` }}></div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 text-right">{proj.completed} of {proj.total} tasks completed</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Employees */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-amber-500">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-semibold text-gray-800">Top Performers</h2>
            <Link to="/employees" className="text-sm text-amber-600 hover:text-amber-800 flex items-center">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          {topEmployees.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No employee data yet.</p>
          ) : (
            <div className="space-y-3">
              {topEmployees.map((emp) => (
                <div key={emp.employeeId} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100 hover:border-amber-200 transition">
                  <div>
                    <p className="font-medium text-gray-900">{emp.name}</p>
                    <p className="text-sm text-gray-500">{emp.department} • {emp.experience} yrs exp</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                      Score: {emp.performanceScore}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center border border-gray-100">
    <div className={`p-3 rounded-full text-white ${color} mr-4 shadow-sm`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default Dashboard;
