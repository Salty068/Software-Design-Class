import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !isAdmin()) {
      navigate('/');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const download = async (path: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(path, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = path.split('/').pop() || 'report';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to download report:', response.statusText);
        alert('Failed to download report. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report. Please try again.');
    }
  };

  // Don't render anything if not authenticated or not admin
  if (!isAuthenticated || !isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5efe6' }}>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">
            Generate comprehensive reports for volunteer management insights. 
            Export real-time data in multiple formats to track performance and participation.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl p-6 shadow-lg border border-orange-200">
            <div className="text-3xl font-bold text-orange-600">📊</div>
            <div className="text-gray-700 mt-1 font-medium">Live Reports</div>
            <div className="text-sm text-gray-600 mt-1">Real-time data</div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl p-6 shadow-lg border border-orange-200">
            <div className="text-3xl font-bold text-orange-700">📋</div>
            <div className="text-gray-700 mt-1 font-medium">Export Formats</div>
            <div className="text-sm text-gray-600 mt-1">PDF & CSV</div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl p-6 shadow-lg border border-orange-200">
            <div className="text-3xl font-bold text-orange-600">📈</div>
            <div className="text-gray-700 mt-1 font-medium">Analytics</div>
            <div className="text-sm text-gray-600 mt-1">Performance insights</div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Volunteer Participation Report */}
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-lg border border-orange-200">
            <div className="p-6 border-b border-orange-200">
              <div className="flex items-center">
                <div className="text-2xl mr-3">👥</div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Volunteer Participation</h2>
                  <p className="text-gray-600">Complete volunteer activity history</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Report Includes:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Participation status tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Volunteer hours logged</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Complete event history</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Performance analytics</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => download("/api/reports/volunteers/csv")}
                  className="flex-1 p-4 rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 text-orange-800 hover:text-orange-900 font-medium text-center"
                >
                  📄 CSV Export
                </button>

                <button
                  onClick={() => download("/api/reports/volunteers/pdf")}
                  className="flex-1 p-4 rounded-lg border border-orange-300 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 text-white font-medium text-center"
                >
                  📋 PDF Export
                </button>
              </div>
            </div>
          </div>

          {/* Event Details Report */}
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-lg border border-orange-200">
            <div className="p-6 border-b border-orange-200">
              <div className="flex items-center">
                <div className="text-2xl mr-3">📅</div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Event Management</h2>
                  <p className="text-gray-600">Comprehensive event & assignment data</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Report Includes:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Complete event listings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Volunteer assignments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Event details & status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Resource allocation</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => download("/api/reports/events/csv")}
                  className="flex-1 p-4 rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 text-orange-800 hover:text-orange-900 font-medium text-center"
                >
                  📄 CSV Export
                </button>

                <button
                  onClick={() => download("/api/reports/events/pdf")}
                  className="flex-1 p-4 rounded-lg border border-orange-300 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 text-white font-medium text-center"
                >
                  📋 PDF Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-center">
            <span className="text-sm text-orange-800 font-medium">
              ℹ️ All reports are generated in real-time from your live database
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
