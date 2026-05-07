import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Users, LayoutDashboard, Sparkles, LogOut, Shield, MessageSquare } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        try {
          const { getNotices } = await import('../services/api');
          const res = await getNotices();
          const unread = res.data.data.filter(n => !n.isRead && n.receiverId._id === user._id).length;
          setUnreadCount(unread);
        } catch (err) {
          console.error('Failed to fetch unread notices:', err);
        }
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user, location.pathname]); // Also refresh on navigation


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
            {/* Conditional Dashboard Link */}
            {user.role === 'manager' ? (
              <Link to="/dashboard" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard') || isActive('/') ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-700'}`}>
                <LayoutDashboard className="w-4 h-4 mr-1.5" /> Dashboard
              </Link>
            ) : (
              <Link to="/employee-dashboard" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/employee-dashboard') || isActive('/') ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-700'}`}>
                <LayoutDashboard className="w-4 h-4 mr-1.5" /> My Tasks
              </Link>
            )}
            
            {user.role === 'manager' && (
              <>
                <Link to="/projects" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/projects') ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-700'}`}>
                  <Briefcase className="w-4 h-4 mr-1.5" /> Projects
                </Link>
                <Link to="/employees" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/employees') ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-700'}`}>
                  <Users className="w-4 h-4 mr-1.5" /> Employees
                </Link>
                <Link to="/ai" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/ai') ? 'bg-amber-600 text-white' : 'text-amber-200 hover:bg-blue-700'}`}>
                  <Sparkles className="w-4 h-4 mr-1.5" /> AI Agent
                </Link>
              </>
            )}

            {/* Common Notice Link */}
            <Link to="/notices" className={`relative flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/notices') ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-700'}`}>
              <MessageSquare className="w-4 h-4 mr-1.5" /> Notices
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-blue-900 rounded-full animate-pulse"></span>
              )}
            </Link>

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
