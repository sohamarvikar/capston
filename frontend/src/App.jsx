import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeList from './pages/EmployeeList';
import ProjectList from './pages/ProjectList';
import ProjectDetails from './pages/ProjectDetails';
import AntigravityAgent from './pages/AntigravityAgent';
import Notices from './pages/Notices';
import Login from './pages/Login';
import Register from './pages/Register';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'employee') return <Navigate to="/employee-dashboard" />;
  return <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Root route redirects based on role */}
              <Route path="/" element={<RootRedirect />} />
              
              {/* Manager Routes */}
              <Route path="/dashboard" element={
                <PrivateRoute roles={['manager']}><Dashboard /></PrivateRoute>
              } />
              
              <Route path="/employees" element={
                <PrivateRoute roles={['manager']}><EmployeeList /></PrivateRoute>
              } />
              
              <Route path="/projects" element={
                <PrivateRoute roles={['manager']}><ProjectList /></PrivateRoute>
              } />
              
              <Route path="/projects/:key" element={
                <PrivateRoute roles={['manager']}><ProjectDetails /></PrivateRoute>
              } />
              
              <Route path="/antigravity" element={
                <PrivateRoute roles={['manager']}><AntigravityAgent /></PrivateRoute>
              } />

              <Route path="/notices" element={
                <PrivateRoute roles={['manager', 'employee']}><Notices /></PrivateRoute>
              } />

              {/* Employee Routes */}
              <Route path="/employee-dashboard" element={
                <PrivateRoute roles={['employee']}><EmployeeDashboard /></PrivateRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
