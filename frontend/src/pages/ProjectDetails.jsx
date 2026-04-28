import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectDetails, getRecommendationForTask, assignTask } from '../services/api';
import { AlertCircle, UserCheck, CheckCircle, Clock } from 'lucide-react';

const ProjectDetails = () => {
  const { key } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendingTask, setRecommendingTask] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isRecommending, setIsRecommending] = useState(false);

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

  if (loading) return <div className="text-center py-10">Loading Project Board...</div>;
  if (!project) return <div className="text-center py-10 text-red-500">Project not found</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.projectKey} : {project.projectName}</h1>
        <p className="text-gray-600">{project.description}</p>
        <div className="mt-4 flex space-x-6 text-sm">
          <span className="font-medium text-gray-500">Department: <span className="text-gray-900">{project.requiredDepartment || 'Cross-functional'}</span></span>
          <span className="font-medium text-gray-500">Status: <span className="text-green-600">{project.status}</span></span>
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
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{task.issueType}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${task.priority === 'Critical' || task.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{task.priority}</span>
                  </div>
                  <h3 className="text-md font-medium text-gray-900">{task.summary}</h3>
                </div>
                
                {/* Assignment Status / Button */}
                <div className="flex flex-col items-end">
                  {task.assignedTo ? (
                    <div className="flex items-center text-sm text-green-700 bg-green-50 px-3 py-1 rounded border border-green-200">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Assigned to: <span className="font-semibold ml-1">{task.assignedTo.name}</span>
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
    </div>
  );
};

export default ProjectDetails;
