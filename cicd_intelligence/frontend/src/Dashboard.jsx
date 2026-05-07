import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, Clock, Activity, Cpu } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch CI/CD Analytics from our new Backend
    axios.get('http://localhost:5002/api/analytics')
      .then(res => setData(res.data.data))
      .catch(err => console.error(err));
  }, []);

  if (!data) return <div className="p-10 text-center text-white bg-slate-900 min-h-screen">Loading...</div>;

  // Mock chart data based on API summary
  const chartData = [
    { name: 'Success', count: data.totalRuns - data.totalFailures },
    { name: 'Failures', count: data.totalFailures }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center">
            <Cpu className="w-8 h-8 mr-3 text-cyan-400" />
            CI/CD Intelligence Dashboard
          </h1>
          <div className="flex space-x-2">
            <span className="px-3 py-1 bg-slate-800 rounded-full text-sm font-medium border border-slate-700">
              {data.totalRuns} Total Runs
            </span>
            <span className="px-3 py-1 bg-red-900/30 text-red-400 rounded-full text-sm font-medium border border-red-800">
              {data.failureRate.toFixed(1)}% Failure Rate
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-64">
             <h3 className="text-lg font-semibold mb-4 text-slate-300">Build Status Overview</h3>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                 <XAxis dataKey="name" stroke="#94a3b8" />
                 <YAxis stroke="#94a3b8" />
                 <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }} />
                 <Bar dataKey="count" fill="#22d3ee" radius={[4,4,0,0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700 overflow-y-auto h-64">
            <h3 className="text-lg font-semibold mb-4 text-slate-300">AI Failure Insights</h3>
            <div className="space-y-3">
              {data.recentExecutions.filter(e => e.status === 'failure').map((fail, i) => (
                <div key={i} className="flex flex-col p-4 bg-slate-900 rounded-lg border border-red-900/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs text-slate-500">{fail.repoName} | {fail.developer}</span>
                    <span className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider bg-red-500/20 text-red-400 rounded">
                      {fail.aiAnalysis?.priority || 'Medium'} Priority
                    </span>
                  </div>
                  <div className="font-semibold text-rose-300 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {fail.aiAnalysis?.category || 'Unknown Failure'}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{fail.aiAnalysis?.summary}</p>
                  {fail.assignedTo && (
                    <div className="mt-2 text-xs text-cyan-400">
                      → AI Auto-Assigned to: {fail.assignedTo}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Run ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Commit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Developer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">AI Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {data.recentExecutions.map((exec, idx) => (
                <tr key={idx} className="hover:bg-slate-700/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-300">{exec.runId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{exec.commitMessage}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{exec.developer}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {exec.status === 'success' ? (
                      <span className="flex items-center text-emerald-400 text-sm"><CheckCircle className="w-4 h-4 mr-1"/> Success</span>
                    ) : (
                      <span className="flex items-center text-rose-400 text-sm"><AlertCircle className="w-4 h-4 mr-1"/> Failed</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {exec.aiAnalysis?.category || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
