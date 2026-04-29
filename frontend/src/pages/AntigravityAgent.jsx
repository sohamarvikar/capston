import React, { useState, useEffect } from 'react';
import { runAntigravityAgent, getAgentDimensions, getProjects } from '../services/api';
import { Rocket, Zap, Target, Gauge, Building2, Clock, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const DIMENSION_ICONS = {
  skillGravity: <Target className="w-4 h-4" />,
  performanceThrust: <Rocket className="w-4 h-4" />,
  experienceMomentum: <Zap className="w-4 h-4" />,
  availabilityFuel: <Gauge className="w-4 h-4" />,
  departmentAlign: <Building2 className="w-4 h-4" />,
  deadlineFit: <Clock className="w-4 h-4" />,
};

const DIMENSION_COLORS = {
  skillGravity: 'bg-violet-500',
  performanceThrust: 'bg-rose-500',
  experienceMomentum: 'bg-amber-500',
  availabilityFuel: 'bg-emerald-500',
  departmentAlign: 'bg-blue-500',
  deadlineFit: 'bg-cyan-500',
};

const AntigravityAgent = () => {
  const [dimensions, setDimensions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // Form state
  const [skills, setSkills] = useState('');
  const [department, setDepartment] = useState('IT');
  const [experience, setExperience] = useState(3);
  const [estimatedDays, setEstimatedDays] = useState(7);
  const [topN, setTopN] = useState(5);

  // Result state
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [dimRes, projRes] = await Promise.all([
          getAgentDimensions(),
          getProjects({ limit: 50 }),
        ]);
        setDimensions(dimRes.data.dimensions);
        setProjects(projRes.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  // Prefill form from selected project
  const handleProjectSelect = (e) => {
    const key = e.target.value;
    if (!key) { setSelectedProject(null); return; }
    const proj = projects.find(p => p.projectKey === key);
    if (proj) {
      setSelectedProject(proj);
      setSkills((proj.requiredSkills || []).join(', '));
      setDepartment(proj.requiredDepartment || 'IT');
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    setExpandedCard(null);

    try {
      const payload = {
        requiredSkills: skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
        requiredExperience: Number(experience),
        requiredDepartment: department,
        estimatedDays: Number(estimatedDays),
        topN: Number(topN),
      };
      const res = await runAntigravityAgent(payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Agent analysis failed. Is the backend running?');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center mb-2">
          <Sparkles className="w-8 h-8 text-amber-400 mr-3" />
          <h1 className="text-3xl font-extrabold tracking-tight">Antigravity Agent</h1>
        </div>
        <p className="text-indigo-200 text-lg">Lifting project performance through intelligent employee matching</p>
        <p className="text-indigo-300 text-sm mt-2">
          6-dimensional AI scoring with bonus/penalty multipliers and confidence tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Scoring Dimensions Info */}
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Scoring Dimensions</h3>
            <div className="space-y-2">
              {dimensions.map(dim => (
                <div key={dim.key} className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-700">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-white mr-2 ${DIMENSION_COLORS[dim.key] || 'bg-gray-500'}`}>
                      {DIMENSION_ICONS[dim.key]}
                    </span>
                    {dim.label}
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 h-2 bg-gray-200 rounded-full mr-2 overflow-hidden">
                      <div className={`h-2 rounded-full ${DIMENSION_COLORS[dim.key] || 'bg-gray-500'}`} style={{ width: `${dim.percentage}%` }} />
                    </div>
                    <span className="text-xs font-mono text-gray-500 w-8 text-right">{dim.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task / Project Input Form */}
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Project Requirements</h3>

            {/* Quick-load from project */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">Load from Project</label>
              <select onChange={handleProjectSelect} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">— Custom input —</option>
                {projects.map(p => (
                  <option key={p._id} value={p.projectKey}>{p.projectKey} — {p.projectName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Required Skills</label>
                <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="react, node.js, aws"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <option value="">Any</option>
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Min Experience (yrs)</label>
                  <input type="number" min="0" max="20" value={experience} onChange={e => setExperience(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Deadline (days)</label>
                  <input type="number" min="1" value={estimatedDays} onChange={e => setEstimatedDays(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Top Results</label>
                  <input type="number" min="1" max="10" value={topN} onChange={e => setTopN(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
            </div>

            <button onClick={handleAnalyze} disabled={isAnalyzing}
              className="w-full mt-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center">
              {isAnalyzing ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" /> Analyzing...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" /> Run Antigravity Agent</>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT: Results Panel */}
        <div className="lg:col-span-2">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">{error}</div>
          )}

          {/* Empty state */}
          {!result && !isAnalyzing && !error && (
            <div className="bg-white rounded-xl shadow p-12 text-center border border-gray-100">
              <Sparkles className="w-16 h-16 mx-auto text-indigo-200 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Analyze</h3>
              <p className="text-gray-500">Configure your project requirements on the left and click "Run Antigravity Agent" to find the best employee matches.</p>
            </div>
          )}

          {/* Loading */}
          {isAnalyzing && (
            <div className="bg-white rounded-xl shadow p-12 text-center border border-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-indigo-700 animate-pulse">Antigravity Agent is analyzing...</h3>
              <p className="text-gray-500 text-sm mt-2">Evaluating {selectedProject ? selectedProject.projectKey : 'your'} requirements across the entire workforce</p>
            </div>
          )}

          {/* Results */}
          {result && !isAnalyzing && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="bg-white rounded-xl shadow p-4 border border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Agent: <span className="font-bold text-indigo-700">{result.agentName} v{result.agentVersion}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Evaluated: <span className="font-bold text-gray-900">{result.evaluatedCandidates} employees</span>
                </div>
                <div className="text-sm text-gray-600">
                  Showing top <span className="font-bold text-gray-900">{result.recommendations.length}</span>
                </div>
              </div>

              {/* Candidate Cards */}
              {result.recommendations.map((rec, idx) => (
                <div key={rec.employee._id}
                  className={`bg-white rounded-xl shadow border overflow-hidden transition-all ${
                    idx === 0 ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-200'
                  }`}>

                  {/* Card Header */}
                  <div className="p-5 cursor-pointer" onClick={() => setExpandedCard(expandedCard === idx ? null : idx)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4 ${
                          idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                          idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          'bg-gradient-to-br from-amber-700 to-amber-900'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{rec.employee.name}</h4>
                          <p className="text-sm text-gray-500">
                            {rec.employee.department} • {rec.employee.experience}yrs exp • {rec.employee.location}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex items-center space-x-4">
                        <div>
                          <div className={`text-2xl font-extrabold ${
                            rec.upliftScore >= 75 ? 'text-green-600' :
                            rec.upliftScore >= 50 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {rec.upliftScore}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Uplift Score</div>
                        </div>
                        {expandedCard === idx ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>

                    {/* Reason */}
                    <p className="mt-3 text-sm text-gray-600 bg-indigo-50 border border-indigo-100 p-3 rounded-lg italic">
                      "{rec.reason}"
                    </p>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border">
                        Confidence: {rec.confidence}%
                      </span>
                      {rec.multiplier !== 1 && (
                        <span className={`text-xs px-2 py-1 rounded-full border ${rec.multiplier > 1 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          Multiplier: {rec.multiplier}x
                        </span>
                      )}
                      {rec.bonuses.map((b, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{b}</span>
                      ))}
                      {(rec.employee.skills || []).slice(0, 4).map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Expanded: Dimension Breakdown */}
                  {expandedCard === idx && (
                    <div className="border-t border-gray-100 bg-gray-50 p-5">
                      <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Dimension Breakdown</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(rec.dimensions).map(([key, dim]) => (
                          <div key={key} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center text-sm font-medium text-gray-700">
                                <span className={`w-5 h-5 rounded flex items-center justify-center text-white mr-2 text-[10px] ${DIMENSION_COLORS[key] || 'bg-gray-500'}`}>
                                  {DIMENSION_ICONS[key]}
                                </span>
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                              </div>
                              <span className={`text-lg font-bold ${dim.score >= 70 ? 'text-green-600' : dim.score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                                {dim.score}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-2 rounded-full transition-all ${DIMENSION_COLORS[key] || 'bg-gray-500'}`} style={{ width: `${dim.score}%` }} />
                            </div>
                            {dim.label && <p className="text-xs text-gray-500 mt-1">{dim.label}</p>}
                            {dim.matched && dim.matched.length > 0 && (
                              <p className="text-xs text-green-600 mt-1">Matched: {dim.matched.join(', ')}</p>
                            )}
                            {dim.missing && dim.missing.length > 0 && (
                              <p className="text-xs text-red-500 mt-1">Missing: {dim.missing.join(', ')}</p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">Weight: {Math.round(dim.weight * 100)}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AntigravityAgent;
