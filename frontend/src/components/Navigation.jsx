import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Upload, FileText, Users, Bookmark, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/login') {
    return null;
  }

  const isAdmin = localStorage.getItem('is_admin') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('company_name');
    localStorage.removeItem('latestReport');
    localStorage.removeItem('latestReportUrl');
    navigate('/login');
  };

  const navItems = [
    { path: '/upload', label: 'Upload', icon: Upload, show: !isAdmin },
    { path: '/history', label: 'History', icon: FileText, show: !isAdmin },
    { path: '/compliance', label: 'Compliance', icon: ShieldCheck, show: !isAdmin },
    { path: '/parties', label: 'Parties', icon: Users, show: !isAdmin },
    { path: '/summary', label: 'Summary', icon: Bookmark, show: !isAdmin },
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, show: isAdmin },
  ];

  return (
    <nav className="bg-dark-800 border-b border-gray-800 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="text-primary-500">
              <ShieldCheck size={28} />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">Auditor AI</span>
          </div>

          <div className="flex items-center space-x-4">
            {navItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <div className="w-px h-6 bg-gray-700 mx-2"></div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
