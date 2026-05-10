import React, { useEffect, useState } from 'react';
import { getEmployees, createEmployee, deleteEmployee, getEmployee } from '../services/api';
import { Trash2, Plus, X, Search, BrainCircuit, Activity } from 'lucide-react';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });

  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', department: 'IT',
    salary: '', experience: '', status: 'Active',
    location: 'New York', session: 'Morning',
    skills: '',
  });
  const [formError, setFormError] = useState('');
  
  // AI Insights State
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedAIEmployee, setSelectedAIEmployee] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 50, page };
      if (searchTerm) params.search = searchTerm;
      if (deptFilter) params.department = deptFilter;
      const res = await getEmployees(params);
      
      setEmployees(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Could not load employees. Is the backend running on port 5001?');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when page or deptFilter changes
  useEffect(() => {
    fetchEmployees();
  }, [page, deptFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    fetchEmployees();
  };

  // When changing department filter, reset page
  const handleDeptFilterChange = (e) => {
    setDeptFilter(e.target.value);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this employee?')) {
      try {
        await deleteEmployee(id);
        fetchEmployees();
      } catch (err) {
        alert('Failed to delete employee: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAIInsights = async (employeeId) => {
    setShowAIModal(true);
    setLoadingAI(true);
    setSelectedAIEmployee(null);
    try {
      const res = await getEmployee(employeeId);
      setSelectedAIEmployee(res.data.data);
    } catch (error) {
      alert('Error fetching AI insights');
      setShowAIModal(false);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.age || !formData.salary || !formData.experience) {
      setFormError('Name, Age, Salary, and Experience are required.');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        department: formData.department,
        salary: Number(formData.salary),
        joiningDate: new Date(),
        experience: Number(formData.experience),
        status: formData.status,
        location: formData.location,
        session: formData.session,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim().toLowerCase()) : [],
      };
      await createEmployee(payload);
      setShowForm(false);
      setFormData({ name: '', age: '', gender: 'Male', department: 'IT', salary: '', experience: '', status: 'Active', location: 'New York', session: 'Morning', skills: '' });
      fetchEmployees();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add employee.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Employees Directory</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
          <Plus className="w-4 h-4 mr-1" /> Add Employee
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex flex-1">
          <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700">
            <Search className="w-4 h-4" />
          </button>
        </form>
        <select value={deptFilter} onChange={handleDeptFilterChange}
          className="border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Departments</option>
          <option value="IT">IT</option>
          <option value="HR">HR</option>
          <option value="Sales">Sales</option>
        </select>
      </div>

      {/* Add Employee Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add New Employee</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{formError}</div>}
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input name="name" value={formData.name} onChange={handleFormChange} required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                  <input name="age" type="number" min="18" max="70" value={formData.age} onChange={handleFormChange} required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select name="department" value={formData.department} onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary *</label>
                  <input name="salary" type="number" min="0" value={formData.salary} onChange={handleFormChange} required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (yrs) *</label>
                  <input name="experience" type="number" min="0" value={formData.experience} onChange={handleFormChange} required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select name="location" value={formData.location} onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="New York">New York</option>
                    <option value="Los Angeles">Los Angeles</option>
                    <option value="Chicago">Chicago</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
                <input name="skills" value={formData.skills} onChange={handleFormChange} placeholder="e.g. react, node.js, python"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI INSIGHTS MODAL */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 border border-indigo-100">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <BrainCircuit className="w-5 h-5 mr-2 text-indigo-600" />
                AI Employee Profile
              </h2>
              <button onClick={() => setShowAIModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {loadingAI ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-sm font-medium text-indigo-600 animate-pulse">Running ML predictions...</p>
              </div>
            ) : selectedAIEmployee ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedAIEmployee.name}</h3>
                    <p className="text-xs text-gray-500">{selectedAIEmployee.department} • {selectedAIEmployee.experience} yrs exp</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${selectedAIEmployee.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedAIEmployee.status}
                  </span>
                </div>
                
                {selectedAIEmployee.mlPredictions ? (
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
                    <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-3 flex items-center">
                      <Activity className="w-4 h-4 mr-1" /> Predictive Analytics
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 font-medium">Burnout Risk</span>
                          <span className={`font-bold ${
                            selectedAIEmployee.mlPredictions.burnoutRisk === 'High Risk' ? 'text-red-600' :
                            selectedAIEmployee.mlPredictions.burnoutRisk === 'Medium Risk' ? 'text-yellow-600' : 'text-green-600'
                          }`}>{selectedAIEmployee.mlPredictions.burnoutRisk}</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-gray-200">
                          <div 
                            className={`h-2 transition-all duration-1000 ${
                              selectedAIEmployee.mlPredictions.burnoutRisk === 'High Risk' ? 'bg-red-500 w-[90%]' :
                              selectedAIEmployee.mlPredictions.burnoutRisk === 'Medium Risk' ? 'bg-yellow-500 w-[50%]' : 'bg-green-500 w-[15%]'
                            }`}
                          ></div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Based on workload ({selectedAIEmployee.currentWorkload}/3) and performance patterns.</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 font-medium">Projected Trajectory</span>
                          <span className="text-blue-600 font-bold">{selectedAIEmployee.mlPredictions.projectedPerformance} / 5.0</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-gray-200">
                          <div 
                            className="h-2 bg-blue-500 transition-all duration-1000"
                            style={{ width: `${(selectedAIEmployee.mlPredictions.projectedPerformance / 5.0) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Expected performance on next assignment.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800">
                    Python AI microservice is currently offline or unreachable. Displaying standard data.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && <div className="text-center text-gray-500 py-10">Loading employees...</div>}

      {/* Empty State */}
      {!loading && !error && employees.length === 0 && (
        <div className="text-center text-gray-500 py-10">No employees found. Try a different filter or add a new employee.</div>
      )}

      {/* Employee Table */}
      {!loading && employees.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status & Workload</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Skills</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr key={emp.employeeId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{emp.name}</div>
                    <div className="text-sm text-gray-500">ID: {emp.employeeId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{emp.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">{emp.performanceScore ?? '—'}</span>
                    <span className="text-sm text-gray-400"> / 5</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {emp.status}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">Load: {emp.currentWorkload ?? 0}/3</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(Array.isArray(emp.skills) ? emp.skills : typeof emp.skills === 'string' ? emp.skills.split(',').map(s => s.trim()) : []).slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-100">{skill}</span>
                      ))}
                      {(Array.isArray(emp.skills) ? emp.skills : typeof emp.skills === 'string' ? emp.skills.split(',') : []).length > 3 && <span className="text-xs text-gray-400">+{(Array.isArray(emp.skills) ? emp.skills : typeof emp.skills === 'string' ? emp.skills.split(',') : []).length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenAIInsights(emp.employeeId)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="AI Insights"><BrainCircuit className="w-4 h-4 inline" /></button>
                    <button onClick={() => handleDelete(emp.employeeId)} className="text-red-600 hover:text-red-900" title="Delete"><Trash2 className="w-4 h-4 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.currentPage}</span> of <span className="font-medium">{pagination.totalPages}</span> 
                  {' '}(Total <span className="font-medium">{pagination.totalRecords}</span> employees)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                    disabled={page === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
