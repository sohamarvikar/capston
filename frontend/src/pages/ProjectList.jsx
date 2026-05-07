import React, { useEffect, useState } from 'react';
import { getProjects, createProject, getRecommendationForTask } from '../services/api';
import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight, Plus, X, Sparkles, UserCheck } from 'lucide-react';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');

  // AI Recommendation state
  const [recommendingProject, setRecommendingProject] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isRecommending, setIsRecommending] = useState(false);

  const [formData, setFormData] = useState({
    projectKey: '',
    projectName: '',
    projectType: 'software',
    description: '',
    requiredDepartment: 'IT',
    requiredSkills: '',
    tasks: '',
  });

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProjects({ limit: 50 });
      setProjects(res.data.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Could not load projects. Is the backend running on port 5001?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.projectKey || !formData.projectName) {
      setFormError('Project Key and Project Name are required.');
      return;
    }

    try {
      const skills = formData.requiredSkills ? formData.requiredSkills.split(',').map(s => s.trim().toLowerCase()) : [];

      // Build tasks array from simple comma-separated summaries
      const taskSummaries = formData.tasks ? formData.tasks.split('\n').filter(t => t.trim()) : [];
      const tasks = taskSummaries.map((summary, idx) => ({
        issueKey: `${formData.projectKey.toUpperCase()}-${idx + 1}`,
        summary: summary.trim(),
        issueType: 'Task',
        status: 'Open',
        priority: 'Medium',
        requiredSkills: skills,
        requiredDepartment: formData.requiredDepartment,
        estimatedDays: 5,
      }));

      const payload = {
        projectKey: formData.projectKey.toUpperCase(),
        projectName: formData.projectName,
        projectType: formData.projectType,
        description: formData.description,
        requiredDepartment: formData.requiredDepartment,
        requiredSkills: skills,
        tasks: tasks,
        totalTasks: tasks.length,
        openTasks: tasks.length,
        status: 'Active',
      };

      await createProject(payload);
      setShowForm(false);
      setFormData({ projectKey: '', projectName: '', projectType: 'software', description: '', requiredDepartment: 'IT', requiredSkills: '', tasks: '' });
      fetchProjects();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create project.';
      setFormError(msg);
    }
  };

  // AI: Start Project → recommend best employee for the project's overall requirements
  const handleStartProject = async (project) => {
    setRecommendingProject(project);
    setIsRecommending(true);
    setRecommendations([]);
    try {
      const res = await getRecommendationForTask({
        requiredSkills: project.requiredSkills || [],
        requiredDepartment: project.requiredDepartment || '',
        taskSummary: project.projectName + ' — ' + (project.description || ''),
        topN: 3,
      });
      setRecommendations(res.data.data);
    } catch (err) {
      console.error('Recommendation error:', err);
    } finally {
      setIsRecommending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Projects Workspace</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
          <Plus className="w-4 h-4 mr-1" /> Create Project
        </button>
      </div>

      {/* Create Project Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Create New Project</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{formError}</div>}
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Key *</label>
                  <input name="projectKey" value={formData.projectKey} onChange={handleFormChange} placeholder="e.g. MYAPP" required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select name="requiredDepartment" value={formData.requiredDepartment} onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input name="projectName" value={formData.projectName} onChange={handleFormChange} placeholder="e.g. Customer Portal Redesign" required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleFormChange} rows="2" placeholder="Brief project description..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma-separated)</label>
                <input name="requiredSkills" value={formData.requiredSkills} onChange={handleFormChange} placeholder="e.g. react, node.js, mongodb"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tasks (one per line)</label>
                <textarea name="tasks" value={formData.tasks} onChange={handleFormChange} rows="4"
                  placeholder={"Setup project boilerplate\nDesign REST API\nBuild authentication system"}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                <p className="text-xs text-gray-400 mt-1">Each line becomes a separate task with auto-generated issue keys.</p>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Recommendation Panel */}
      {recommendingProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-amber-500" /> AI Recommendation
              </h2>
              <button onClick={() => { setRecommendingProject(null); setRecommendations([]); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Best employees for <strong>{recommendingProject.projectKey}</strong>:</p>

            {isRecommending && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm text-blue-600 animate-pulse">Analyzing workforce skills & availability...</p>
              </div>
            )}

            {!isRecommending && recommendations.length > 0 && (
              <div className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <div key={rec.employee._id} className="border border-gray-200 rounded-lg p-4 relative overflow-hidden">
                    {idx === 0 && <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-2 py-0.5 rounded-bl text-gray-900">#1 BEST FIT</div>}
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h4 className="font-bold text-gray-900">{rec.employee.name}</h4>
                        <p className="text-xs text-gray-500">{rec.employee.department} • {rec.employee.experience} yrs • Load: {rec.employee.currentWorkload}/10</p>
                      </div>
                      <div className={`text-lg font-bold ${rec.score >= 70 ? 'text-green-600' : 'text-orange-500'}`}>{rec.score}%</div>
                    </div>
                    {rec.matchedSkills && rec.matchedSkills.length > 0 && (
                      <div className="mt-2 mb-1">
                        <div className="flex flex-wrap gap-1">
                          {rec.matchedSkills.map(skill => (
                            <span key={skill} className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200">✓ {skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded mt-2">"{rec.reason}"</p>
                  </div>
                ))}
              </div>
            )}

            {!isRecommending && recommendations.length === 0 && (
              <div className="text-center py-6 text-gray-500">No active employees matched. Check the Employees page.</div>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">{error}</div>}

      {/* Loading */}
      {loading && <div className="text-center text-gray-500 py-10">Loading projects...</div>}

      {/* Empty State */}
      {!loading && !error && projects.length === 0 && (
        <div className="text-center text-gray-500 py-10">No projects yet. Click "Create Project" to get started.</div>
      )}

      {/* Project Grid — All Projects Unified (both seeded and user-created) */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-md text-indigo-600 mr-3">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{project.projectKey}</h3>
                    <p className="text-xs font-medium text-gray-500 uppercase">{project.projectType || 'software'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {project.status}
                </span>
              </div>

              <h4 className="text-md font-semibold text-gray-800 mb-2 line-clamp-1">{project.projectName}</h4>
              <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-2">{project.description || 'No description provided.'}</p>

              {/* Required Skills */}
              {(project.requiredSkills || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {project.requiredSkills.slice(0, 4).map(skill => (
                    <span key={skill} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">{skill}</span>
                  ))}
                </div>
              )}

              <div className="border-t pt-4 mt-auto space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-gray-500">Tasks: </span>
                    <span className="font-semibold text-gray-900">{project.totalTasks ?? 0}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-red-500 font-medium">{project.openTasks ?? 0} Open</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link to={`/projects/${project.projectKey}`}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
                    View Board <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                  <button onClick={() => handleStartProject(project)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200">
                    <UserCheck className="w-4 h-4 mr-1" /> Start
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
