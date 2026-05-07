import React, { useEffect, useState } from 'react';
import { getMyTasks, startTask, completeTask, uploadDocument } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, UploadCloud, Clock, AlertCircle, Play, Hourglass } from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingTask, setUploadingTask] = useState(null);
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await getMyTasks();
      setTasks(res.data.data);
    } catch (err) {
      setError('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStart = async (projectKey, issueKey) => {
    try {
      await startTask({ projectKey, issueKey });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start task.');
    }
  };

  const handleComplete = async (projectKey, issueKey) => {
    try {
      await completeTask({ projectKey, issueKey });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete task.');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !uploadingTask) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('projectKey', uploadingTask.projectKey);
    formData.append('issueKey', uploadingTask.issueKey);
    formData.append('notes', notes);

    try {
      await uploadDocument(formData);
      alert('Document uploaded successfully.');
      setUploadingTask(null);
      setFile(null);
      setNotes('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload document.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your tasks...</div>;

  const openTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'Closed' && t.status !== 'Resolved');
  const closedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'Closed' || t.status === 'Resolved');
  
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((closedTasks.length / totalTasks) * 100);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
            <p className="text-gray-600">Here are your assigned tasks.</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-blue-600">{progressPercentage}%</span>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Overall Progress</p>
          </div>
        </div>
        
        {/* Dynamic Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="h-3 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-500 to-green-500" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-amber-500" /> Active Tasks ({openTasks.length})
          </h2>
          {openTasks.length === 0 ? (
            <p className="text-gray-500 bg-white p-4 rounded-lg shadow border border-gray-100 text-center">No active tasks.</p>
          ) : (
            <div className="space-y-4">
              {openTasks.map(task => (
                <div key={task.issueKey} className="bg-white p-5 rounded-xl shadow border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-blue-600">{task.issueKey}</span>
                      <h3 className="text-lg font-bold text-gray-900">{task.summary}</h3>
                      <p className="text-sm text-gray-500">Project: {task.projectName}</p>
                      {task.estimatedDaysMin && task.estimatedDaysMax && (
                        <p className="text-xs text-indigo-600 mt-1 font-medium">
                          AI Est. Time: {task.estimatedDaysMin}-{task.estimatedDaysMax} days
                        </p>
                      )}
                    </div>
                    {/* Visual Status Badge & Deadline */}
                    <div className="flex space-x-2">
                      {task.deadlineStatus && (
                        <span className={`border text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center ${
                          task.deadlineStatus === 'On Time' ? 'bg-green-100 text-green-800 border-green-200' :
                          task.deadlineStatus === 'At Risk' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {task.deadlineStatus}
                        </span>
                      )}
                    {task.status === 'ongoing' || task.status === 'In Progress' ? (
                      <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center">
                        <Hourglass className="w-3 h-3 mr-1" /> Ongoing
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 border border-red-200 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" /> Pending
                      </span>
                    )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {task.status === 'ongoing' || task.status === 'In Progress' ? (
                      <button onClick={() => handleComplete(task.projectKey, task.issueKey)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center transition shadow-sm">
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Mark as Done
                      </button>
                    ) : (
                      <button onClick={() => handleStart(task.projectKey, task.issueKey)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center transition shadow-sm">
                        <Play className="w-4 h-4 mr-1.5 fill-current" /> Start Task
                      </button>
                    )}
                    <button onClick={() => setUploadingTask(task)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm flex items-center justify-center transition border border-gray-300">
                      <UploadCloud className="w-4 h-4 mr-1.5" /> Upload Doc
                    </button>
                  </div>

                  {/* Upload Form inline */}
                  {uploadingTask?.issueKey === task.issueKey && (
                    <form onSubmit={handleUploadSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                        <input type="file" onChange={e => setFile(e.target.files[0])} required className="text-sm w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setUploadingTask(null)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100">Cancel</button>
                        <button type="submit" className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">Upload</button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" /> Completed Tasks ({closedTasks.length})
          </h2>
          {closedTasks.length === 0 ? (
            <p className="text-gray-500 bg-white p-4 rounded-lg shadow border border-gray-100 text-center">No completed tasks yet.</p>
          ) : (
            <div className="space-y-4">
              {closedTasks.map(task => (
                <div key={task.issueKey} className="bg-green-50 p-4 rounded-xl border border-green-200 opacity-90 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-wider">
                    Completed
                  </div>
                  <span className="text-xs font-bold text-gray-500">{task.issueKey}</span>
                  <h3 className="text-md font-medium text-gray-700 line-through mt-1">{task.summary}</h3>
                  <p className="text-xs text-gray-500 mt-1">Project: {task.projectName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
