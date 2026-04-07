import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Users, FileText, Building, ArrowLeft, ShieldCheck } from 'lucide-react';

// Determine API base dynamically
const API_BASE = import.meta.env.VITE_API_URL || "";  // empty string = same origin

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Quick auth check
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    if (!token || !isAdmin) {
      navigate('/');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/auth/admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch admin data or unauthorized');
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="card text-center p-8 max-w-md mx-auto mt-10">
      <div className="text-red-500 mb-4 flex justify-center"><Users size={48} /></div>
      <h3 className="text-xl font-bold mb-2">Access Denied</h3>
      <p className="text-gray-400 mb-6">{error}</p>
      <button onClick={() => navigate('/')} className="btn-primary">Return to Home</button>
    </div>
  );

  // Exclude the admin from metrics if desired, or keep them.
  const auditors = users.filter(u => !u.is_admin);

  // Group by Company
  const companyMap = {};
  auditors.forEach(u => {
    const comp = u.company_name || 'Unknown';
    companyMap[comp] = (companyMap[comp] || 0) + (u.contracts_analyzed || 0);
  });
  const companyData = Object.keys(companyMap).map(key => ({
    name: key,
    value: companyMap[key]
  })).sort((a, b) => b.value - a.value);

  // Group by User
  const userData = auditors.map(u => ({
    name: u.email,
    value: u.contracts_analyzed || 0
  })).sort((a, b) => b.value - a.value);

  const totalContracts = auditors.reduce((sum, u) => sum + (u.contracts_analyzed || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in relative z-10 w-full max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-dark-800 p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="text-primary-500" /> Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Platform usage analytics and registered auditors</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-dark-700 px-6 py-3 rounded-xl border border-gray-700 text-center">
            <div className="text-3xl font-bold text-primary-400">{auditors.length}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Auditors</div>
          </div>
          <div className="bg-dark-700 px-6 py-3 rounded-xl border border-gray-700 text-center">
            <div className="text-3xl font-bold text-green-400">{totalContracts}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Audits</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Company Chart */}
        <div className="card h-96 flex flex-col">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Building size={18} className="text-primary-400" /> Audits by Company</h3>
          {companyData.length > 0 && companyData.some(d => d.value > 0) ? (
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={companyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {companyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#f3f4f6' }}
                    itemStyle={{ color: '#f3f4f6' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 italic">No usage data to display</div>
          )}
        </div>

        {/* User Chart */}
        <div className="card h-96 flex flex-col">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Users size={18} className="text-green-400" /> Audits by User</h3>
          {userData.length > 0 && userData.some(d => d.value > 0) ? (
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name.split('@')[0]} ${(percent * 100).toFixed(0)}%`}
                  >
                    {userData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#f3f4f6' }}
                    itemStyle={{ color: '#f3f4f6' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 italic">No usage data to display</div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-dark-800/50">
          <h3 className="text-xl font-bold font-display flex items-center gap-2">
            <ShieldCheck className="text-primary-500" /> Registered Auditors Database
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-800 border-b border-gray-700 text-gray-400 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">User Email</th>
                <th className="px-6 py-4 font-semibold">Company</th>
                <th className="px-6 py-4 font-semibold">Hashed Password</th>
                <th className="px-6 py-4 font-semibold text-center">Contracts Audited</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {auditors.map((user, idx) => (
                <tr key={idx} className="hover:bg-dark-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold text-sm">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    <div className="flex items-center gap-2">
                      <Building size={14} className="text-gray-500" />
                      {user.company_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-500 truncate max-w-[200px]" title={user.password}>
                    {user.password.substring(0, 20)}...
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 font-bold border border-primary-500/20">
                      {user.contracts_analyzed || 0}
                    </span>
                  </td>
                </tr>
              ))}
              {auditors.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500 font-medium italic">
                    No auditors registered in the system yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
