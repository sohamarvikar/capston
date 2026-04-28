import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, Users, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-700';
  };

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="font-bold text-xl tracking-tight">Karmavyuha AI</span>
          </div>
          <div className="flex space-x-4">
            <Link to="/" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}>
              <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
            </Link>
            <Link to="/projects" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/projects')}`}>
              <Briefcase className="w-4 h-4 mr-2" /> Projects
            </Link>
            <Link to="/employees" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/employees')}`}>
              <Users className="w-4 h-4 mr-2" /> Employees
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
