import { useAuth } from '../contexts/AuthContext.tsx';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface AdminStats {
  totalUsers: number;
  totalVolunteers: number;
  totalAdmins: number;
  totalEvents: number;
  activeEvents: number;
  totalHoursLogged: number;
}

export default function AdminDashboard() {
  const { user, requireAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requireAdmin();
    loadAdminStats();
  }, [requireAdmin]);

  const loadAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5efe6' }}>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl p-6 shadow-lg border border-orange-200">
              <div className="text-3xl font-bold text-orange-600">{stats.totalUsers}</div>
              <div className="text-gray-700 mt-1 font-medium">Total Users</div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl p-6 shadow-lg border border-orange-200">
              <div className="text-3xl font-bold text-orange-700">{stats.totalVolunteers}</div>
              <div className="text-gray-700 mt-1 font-medium">Volunteers</div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl p-6 shadow-lg border border-orange-200">
              <div className="text-3xl font-bold text-orange-800">{stats.totalAdmins}</div>
              <div className="text-gray-700 mt-1 font-medium">Administrators</div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl p-6 shadow-lg border border-orange-200">
              <div className="text-3xl font-bold text-orange-600">{stats.totalEvents}</div>
              <div className="text-gray-700 mt-1 font-medium">Total Events</div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl p-6 shadow-lg border border-orange-200">
              <div className="text-3xl font-bold text-orange-500">{stats.activeEvents}</div>
              <div className="text-gray-700 mt-1 font-medium">Active Events</div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl p-6 shadow-lg border border-orange-200">
              <div className="text-3xl font-bold text-orange-700">{stats.totalHoursLogged}</div>
              <div className="text-gray-700 mt-1 font-medium">Hours Logged</div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl p-6 shadow-lg border border-orange-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                to="/admin/users"
                className="w-full text-left p-4 rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 block text-orange-800 hover:text-orange-900 font-medium"
              >
                👥 Manage Users
              </Link>
              <Link 
                to="/event-manage"
                className="w-full text-left p-4 rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 block text-orange-800 hover:text-orange-900 font-medium"
              >
                📅 Event Management
              </Link>
              <Link 
                to="/volunteer-matching"
                className="w-full text-left p-4 rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 block text-orange-800 hover:text-orange-900 font-medium"
              >
                🎯 Volunteer Matching
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl p-6 shadow-lg border border-orange-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 font-medium">New volunteer registered</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-700 font-medium">Event completed successfully</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                <span className="text-sm text-gray-700 font-medium">New event created</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}