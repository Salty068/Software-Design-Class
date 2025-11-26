import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface User {
  id: string;
  userId: string;
  fullName: string;
  email?: string;
  role: 'volunteer' | 'admin';
  city: string;
  state: string;
  skills: string[];
  availability: string[];
  createdAt: string;
  status: 'active' | 'inactive' | 'pending';
}

export default function ManageUsers() {
  const { requireAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'volunteer' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  useEffect(() => {
    requireAdmin();
    fetchUsers();
  }, [requireAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profiles from the API
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch('/api/profile', { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      console.log('Raw API response:', data);
      console.log('Profiles from API:', data.data);
      
      // Transform the profile data to user format
      const transformedUsers = data.data?.map((profile: any, index: number) => {
        console.log('Processing profile:', profile);
        const user = {
          id: profile.userId || `user-${index}`,
          userId: profile.userId,
          fullName: profile.fullName,
          email: profile.userId, // Use the actual email (userId is email)
          role: profile.role?.toLowerCase() || 'volunteer', // Use actual role from database
          city: profile.location?.city || 'Unknown',
          state: profile.location?.state || 'TX',
          skills: profile.skills || [],
          availability: profile.availability || [],
          createdAt: profile.createdAt || new Date().toISOString(),
          status: 'active' as const
        };
        console.log('Transformed user:', user);
        return user;
      }) || [];

      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive' | 'pending') => {
    try {
      // Update user status locally for now
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
      
      // In a real app, you would make an API call here
      console.log(`Updated user ${userId} status to ${newStatus}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const closeUserProfile = () => {
    setSelectedUser(null);
    setShowUserProfile(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'volunteer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
            <p className="text-orange-100 text-lg">
              View and manage all system users, volunteers, and administrators
            </p>
          </div>

          {/* Filters and Search */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Role
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="volunteer">Volunteers</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                <strong>Error:</strong> {error}
                <button 
                  onClick={fetchUsers}
                  className="ml-4 underline hover:no-underline"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                <div className="text-blue-700 text-sm">Total Users</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.role === 'volunteer').length}
                </div>
                <div className="text-green-700 text-sm">Volunteers</div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.role === 'admin').length}
                </div>
                <div className="text-purple-700 text-sm">Administrators</div>
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {users.filter(u => u.status === 'active').length}
                </div>
                <div className="text-yellow-700 text-sm">Active Users</div>
              </div>
            </div>

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Users Found</h3>
                <p className="text-gray-500">
                  {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filters.' 
                    : 'No users are currently in the system.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Skills
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">ID: {user.userId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.city}, {user.state}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.status}
                            onChange={(e) => handleStatusChange(user.id, e.target.value as any)}
                            className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${getStatusColor(user.status)}`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {user.skills.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                              >
                                {skill}
                              </span>
                            ))}
                            {user.skills.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{user.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleViewUser(user)}
                            className="inline-flex items-center px-3 py-2 text-sm bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-800 hover:text-orange-900 rounded-lg border border-orange-200 transition-all duration-200 font-medium"
                          >
                            👁️ View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {showUserProfile && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">User Profile</h2>
                <button 
                  onClick={closeUserProfile}
                  className="text-white hover:text-orange-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Basic Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {selectedUser.fullName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {selectedUser.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">User ID</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-mono">
                      {selectedUser.userId}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Role</label>
                    <p className="mt-1">
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">City</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {selectedUser.city}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">State</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {selectedUser.state}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Current Status</label>
                    <p className="mt-1">
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedUser.status)}`}>
                        {selectedUser.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Joined Date</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Skills
                </h3>
                {selectedUser.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-md font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-gray-50 px-3 py-2 rounded-md">
                    No skills listed
                  </p>
                )}
              </div>

              {/* Availability */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Availability
                </h3>
                {selectedUser.availability.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.availability.map((time, index) => (
                      <span
                        key={index}
                        className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md font-medium"
                      >
                        {time}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-gray-50 px-3 py-2 rounded-md">
                    No availability information
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button 
                  onClick={closeUserProfile}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}