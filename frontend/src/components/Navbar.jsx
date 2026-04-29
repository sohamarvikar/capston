import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Users, LayoutDashboard, Sparkles, LogOut, Shield } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-700';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="font-bold text-xl tracking-tight flex items-center">
             <Shield className="w-5 h-5 mr-2 text-indigo-300" /> Karmavyuha AI
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl tracking-tight flex items-center">
              <Shield className="w-5 h-5 mr-2 text-indigo-300" /> Karmavyuha AI
            </Link>
          </div>
          <div className="flex space-x-2 items-center">
            <Link to="/" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}>
              <LayoutDashboard className="w-4 h-4 mr-1.5" /> Dashboard
            </Link>
            
            {user.role === 'manager' && (
              <>
                <Link to="/projects" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/projects')}`}>
                  <Briefcase className="w-4 h-4 mr-1.5" /> Projects
                </Link>
                <Link to="/employees" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/employees')}`}>
                  <Users className="w-4 h-4 mr-1.5" /> Employees
                </Link>
                <Link to="/antigravity" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md ${location.pathname === '/antigravity' ? 'ring-2 ring-amber-400' : ''}`}>
                  <Sparkles className="w-4 h-4 mr-1.5 text-amber-300" /> Antigravity
                </Link>
              </>
            )}

            <div className="border-l border-blue-700 mx-2 h-6"></div>
            
            <div className="text-sm font-medium text-blue-200 mr-2 flex flex-col items-end">
              <span>{user.name}</span>
              <span className="text-[10px] uppercase">{user.role}</span>
            </div>
            
            <button onClick={handleLogout} className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-300 hover:bg-red-900 hover:text-white transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
