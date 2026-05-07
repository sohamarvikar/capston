import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectDetails, getRecommendationForTask, assignTask, autoReassignTask, getTaskSubmissions } from '../services/api';
import { AlertCircle, UserCheck, CheckCircle, Clock, MessageSquare, X, Send, Sparkles, Activity, FileText, Download } from 'lucide-react';

const ProjectDetails = () => {
  const { key } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendingTask, setRecommendingTask] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isRecommending, setIsRecommending] = useState(false);
  
  // Submissions State
  const [taskSubmissions, setTaskSubmissions] = useState({});
  const [loadingSubmissions, setLoadingSubmissions] = useState({});
  
  // Notice Modal State
  const [noticeTask, setNoticeTask] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [isSendingNotice, setIsSendingNotice] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await getProjectDetails(key);
      setProject(res.data.data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [key]);

  const handleRecommend = async (task) => {
    setRecommendingTask(task);
    setIsRecommending(true);
    setRecommendations([]);
    
    try {
      const res = await getRecommendationForTask({
        taskSummary: task.summary,
        requiredSkills: task.requiredSkills,
        requiredDepartment: task.requiredDepartment,
        requiredExperience: task.requiredExperience,
        topN: 3
      });
      setRecommendations(res.data.data);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setIsRecommending(false);
    }
  };

  const handleAssign = async (employeeId, score, reason) => {
    try {
      await assignTask(key, recommendingTask.issueKey, { employeeId });
      // In a real app, also log the assignment details (score, reason) via the /accept endpoint
      setRecommendingTask(null);
      fetchProject(); // Refresh board
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const handleAutoReassign = async (task) => {
    if (!window.confirm("Auto-reassign using AI? This will automatically find a better match and reassign.")) return;
    try {
      const res = await autoReassignTask(key, task.issueKey);
      if (res.data.success) {
        alert(`${res.data.message}\n\nNew Assignee: ${res.data.newAssignee}\nReason: ${res.data.reason}`);
        fetchProject();
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error auto reassigning');
    }
  };

  const handleToggleSubmissions = async (task) => {
    if (taskSubmissions[task.issueKey]) {
      // Toggle off
      setTaskSubmissions(prev => { const next = {...prev}; delete next[task.issueKey]; return next; });
      return;
    }
    
    setLoadingSubmissions(prev => ({ ...prev, [task.issueKey]: true }));
    try {
      const res = await getTaskSubmissions(key, task.issueKey);
      setTaskSubmissions(prev => ({ ...prev, [task.issueKey]: res.data.data }));
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoadingSubmissions(prev => ({ ...prev, [task.issueKey]: false }));
    }
  };

  const handleSendNotice = async (e) => {
    e.preventDefault();
    if (!noticeMessage.trim()) return;
    
    setIsSendingNotice(true);
    try {
      const { sendNotice } = await import('../services/api');
      await sendNotice({
        message: noticeMessage,
        receiverId: noticeTask.assignedTo._id,
        taskId: noticeTask.issueKey
      });
      alert('Notice sent successfully!');
      setNoticeTask(null);
      setNoticeMessage('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send notice');
    } finally {
      setIsSendingNotice(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading Project Board...</div>;
  if (!project) return <div className="text-center py-10 text-red-500">Project not found</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.projectKey} : {project.projectName}</h1>
        <p className="text-gray-600">{project.description}</p>
        <div className="mt-4 flex justify-between items-end">
          <div className="flex space-x-6 text-sm">
            <span className="font-medium text-gray-500">Department: <span className="text-gray-900">{project.requiredDepartment || 'Cross-functional'}</span></span>
            <span className="font-medium text-gray-500">Status: <span className="text-green-600">{project.status}</span></span>
          </div>
          <div className="text-right w-1/3">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-gray-600">Project Progress</span>
              <span className="font-bold text-indigo-600">
                {project.tasks?.length ? Math.round((project.tasks.filter(t => t.status === 'completed' || t.status === 'Closed' || t.status === 'Resolved').length / project.tasks.length) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="h-2.5 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-indigo-500 to-green-500" 
                style={{ width: `${project.tasks?.length ? Math.round((project.tasks.filter(t => t.status === 'completed' || t.status === 'Closed' || t.status === 'Resolved').length / project.tasks.length) * 100) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TASK BOARD (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Task Backlog</h2>
          
          {(project.tasks || []).map((task) => (
            <div key={task._id} className={`bg-white p-4 rounded-lg shadow-sm border ${recommendingTask?._id === task._id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold text-indigo-600">{task.issueKey}</span>
                    {/* Visual Status Badge */}
                    {task.status === 'completed' || task.status === 'Closed' || task.status === 'Resolved' ? (
                      <span className="bg-green-100 text-green-800 border border-green-200 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Completed</span>
                    ) : task.status === 'ongoing' || task.status === 'In Progress' ? (
                      <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center"><Clock className="w-3 h-3 mr-1" /> Ongoing</span>
                    ) : (
                      <span className="bg-red-100 text-red-800 border border-red-200 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Pending</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded ${task.priority === 'Critical' || task.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{task.priority}</span>
                    {task.deadlineStatus && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold border ${
                        task.deadlineStatus === 'On Time' ? 'bg-green-50 text-green-700 border-green-200' :
                        task.deadlineStatus === 'At Risk' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {task.deadlineStatus}
                      </span>
                    )}
                    {task.assignedTo && task.delayProbability !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold border ${
                        task.delayProbability >= 70 ? 'bg-red-50 text-red-700 border-red-200' :
                        task.delayProbability >= 40 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {task.delayProbability >= 70 ? 'High Risk' : task.delayProbability >= 40 ? 'Medium Risk' : 'Low Risk'} ({task.delayProbability}%)
                      </span>
                    )}
                  </div>
                  <h3 className={`text-md font-medium mt-1 ${task.status === 'completed' || task.status === 'Closed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.summary}</h3>
                  {task.estimatedDaysMin && task.estimatedDaysMax && (
                    <p className="text-[11px] text-indigo-600 mt-0.5 font-bold tracking-wide">
                      AI Est: {task.estimatedDaysMin}-{task.estimatedDaysMax} days
                    </p>
                  )}
                  
                  {/* View Files Button */}
                  {(task.status === 'completed' || task.status === 'Closed' || task.status === 'ongoing' || task.status === 'In Progress') && (
                    <button 
                      onClick={() => handleToggleSubmissions(task)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center font-medium bg-blue-50 px-2 py-1 rounded"
                    >
                      <FileText className="w-3 h-3 mr-1" /> {taskSubmissions[task.issueKey] ? 'Hide Files' : 'View Submitted Files'}
                    </button>
                  )}
                </div>
                
                {/* Assignment Status / Button */}
                <div className="flex flex-col items-end">
                  {task.assignedTo ? (
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center text-sm text-green-700 bg-green-50 px-3 py-1 rounded border border-green-200">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Assigned to: <span className="font-semibold ml-1">{task.assignedTo.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setNoticeTask(task)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center font-medium bg-blue-50 px-2 py-1 rounded"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" /> Send Notice
                        </button>
                        {(task.delayProbability >= 70 || task.deadlineStatus === 'Late') && task.status !== 'completed' && task.status !== 'Closed' && (
                          <button 
                            onClick={() => handleAutoReassign(task)}
                            className="text-[10px] text-white bg-purple-600 hover:bg-purple-700 flex items-center font-bold px-2 py-1 rounded uppercase tracking-wide shadow-sm"
                          >
                            <Sparkles className="w-3 h-3 mr-1" /> AI Reassign
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleRecommend(task)}
                      className="flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
                    >
                      <UserCheck className="w-4 h-4 mr-1" /> AI Recommend
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                {(task.requiredSkills || []).map(skill => (
                  <span key={skill} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">{skill}</span>
                ))}
              </div>

              {/* Submissions List */}
              {loadingSubmissions[task.issueKey] && <p className="mt-3 text-xs text-gray-500 animate-pulse">Loading files...</p>}
              {taskSubmissions[task.issueKey] && (
                <div className="mt-4 border-t border-gray-100 pt-3 space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center">
                    <FileText className="w-3 h-3 mr-1 text-gray-400" /> Submitted Files ({taskSubmissions[task.issueKey].length})
                  </h4>
                  {taskSubmissions[task.issueKey].length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No files submitted yet.</p>
                  ) : (
                    taskSubmissions[task.issueKey].map(sub => (
                      <div key={sub._id} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                        <div className="flex flex-col">
                          <a href={`http://localhost:5001${sub.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline flex items-center">
                            <Download className="w-3 h-3 mr-1" /> {sub.fileName}
                          </a>
                          <span className="text-[10px] text-gray-500 mt-0.5">By {sub.submittedBy?.name || 'Unknown'} • {new Date(sub.createdAt).toLocaleDateString()}</span>
                        </div>
                        {sub.notes && <span className="text-xs text-gray-600 bg-white px-2 py-1 border border-gray-200 rounded max-w-[50%] truncate">{sub.notes}</span>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI RECOMMENDATION PANEL (Right Column) */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-b from-blue-50 to-white rounded-lg shadow border border-blue-100 p-5 sticky top-6">
            <h2 className="text-lg font-bold text-blue-900 flex items-center mb-4">
              <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
              AI Matchmaker
            </h2>
            
            {!recommendingTask && (
              <div className="text-center py-10 text-gray-500">
                <Clock className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p>Select "AI Recommend" on any unassigned task to find the best employee match.</p>
              </div>
            )}

            {isRecommending && (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm font-medium text-blue-600 animate-pulse">Analyzing task requirements & employee profiles...</p>
              </div>
            )}

            {recommendingTask && !isRecommending && recommendations.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                <p>No active employees matched the required skills or department.</p>
                <button onClick={() => setRecommendingTask(null)} className="mt-3 text-sm text-blue-600 hover:underline">Clear Selection</button>
              </div>
            )}

            {recommendations.length > 0 && !isRecommending && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 font-medium border-b border-blue-100 pb-2">
                  Top matches for: <span className="text-gray-900">{recommendingTask.issueKey}</span>
                </p>
                
                {recommendations.map((rec, idx) => (
                  <div key={rec.employee._id} className="bg-white border border-gray-200 rounded p-4 shadow-sm hover:shadow relative overflow-hidden">
                    {idx === 0 && <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-2 py-0.5 rounded-bl">#1 BEST FIT</div>}
                    
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900">{rec.employee.name}</h4>
                        <p className="text-xs text-gray-500">{rec.employee.department} • Workload: {rec.employee.currentWorkload}/10</p>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${rec.score >= 80 ? 'text-green-600' : 'text-orange-500'}`}>{rec.score}%</div>
                        <div className="text-[10px] text-gray-400 uppercase">Match Score</div>
                      </div>
                    </div>
                    
                    {rec.matchedSkills && rec.matchedSkills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Matched Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {rec.matchedSkills.map(skill => (
                            <span key={skill} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">✓ {skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 mb-3 italic">
                      " {rec.reason} "
                    </p>
                    
                    <button 
                      onClick={() => handleAssign(rec.employee._id, rec.score, rec.reason)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-1.5 rounded transition"
                    >
                      Assign Task
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TIMELINE VISUALIZATION */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-indigo-500" />
          Project Timeline
        </h2>
        
        <div className="space-y-4">
          {(project.tasks || []).map(task => {
            const start = task.startedAt ? new Date(task.startedAt) : new Date(task.createdDate);
            const end = task.completedAt ? new Date(task.completedAt) : (task.deadline ? new Date(task.deadline) : new Date(start.getTime() + (task.estimatedDaysMax || 5) * 86400000));
            const totalDuration = end.getTime() - start.getTime() || 1;
            
            // Simplified relative progress mapping for UI timeline
            const today = new Date();
            let progress = 0;
            let barColor = 'bg-gray-300';
            
            const isCompleted = task.status === 'completed' || task.status === 'Closed' || task.status === 'Resolved';
            const isOngoing = task.status === 'ongoing' || task.status === 'In Progress';
            const isLate = task.deadlineStatus === 'Late';
            
            if (isCompleted) {
              progress = 100;
              barColor = 'bg-green-500';
            } else if (isOngoing) {
              if (today > start) progress = Math.min(100, Math.max(0, ((today.getTime() - start.getTime()) / totalDuration) * 100));
              barColor = isLate ? 'bg-red-500' : 'bg-blue-500';
            } else {
              // Pending or unassigned
              progress = 0;
              barColor = 'bg-gray-300';
            }
            
            return (
              <div key={task._id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700">{task.issueKey}: {task.summary}</span>
                  <span className="text-xs text-gray-500">
                    {start.toLocaleDateString()} - {end.toLocaleDateString()}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden flex">
                  <div 
                    className={`h-2.5 flex-none transition-all duration-500 ${barColor}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] mt-1 text-gray-400 font-medium uppercase tracking-wider">
                  <span>Start</span>
                  {isLate && !task.completedAt && <span className="text-red-500">Delayed</span>}
                  <span>Deadline</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEND NOTICE MODAL */}
      {noticeTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                Send Notice to {noticeTask.assignedTo.name}
              </h2>
              <button onClick={() => setNoticeTask(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded">
              Task: <span className="font-semibold">{noticeTask.issueKey} - {noticeTask.summary}</span>
            </p>
            <form onSubmit={handleSendNotice}>
              <textarea 
                rows="4" 
                required
                value={noticeMessage}
                onChange={(e) => setNoticeMessage(e.target.value)}
                placeholder="E.g., Please provide an update on this task..."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
              ></textarea>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setNoticeTask(null)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSendingNotice} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {isSendingNotice ? 'Sending...' : <><Send className="w-4 h-4 mr-1.5" /> Send Notice</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDetails;
