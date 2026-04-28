import React, { useEffect, useState } from 'react';
import { getProjects } from '../services/api';
import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight } from 'lucide-react';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getProjects({ limit: 50 });
        setProjects(res.data.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Projects Workspace</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
          Create Project
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading projects...</div>
      ) : (
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
                    <p className="text-xs font-medium text-gray-500 uppercase">{project.projectType}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {project.status}
                </span>
              </div>
              
              <h4 className="text-md font-semibold text-gray-800 mb-2 line-clamp-1">{project.projectName}</h4>
              <p className="text-sm text-gray-600 mb-6 flex-grow line-clamp-3">{project.description}</p>
              
              <div className="border-t pt-4 mt-auto">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm">
                    <span className="text-gray-500">Tasks: </span>
                    <span className="font-semibold">{project.totalTasks} Total</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-red-500 font-medium">{project.openTasks} Open</span>
                  </div>
                </div>
                <Link to={`/projects/${project.projectKey}`} className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none">
                  View Board <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
