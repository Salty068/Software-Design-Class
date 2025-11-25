import './App.css';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHomeStats, getFeaturedEvents } from './services/home.api';
import type { HomeStats, FeaturedEvent } from './services/home.api';
import { useToast } from './components/ToastProvider';

function App() {
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [events, setEvents] = useState<FeaturedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, eventsResponse] = await Promise.all([
        getHomeStats(),
        getFeaturedEvents()
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      } else {
        toast.error('Failed to load statistics');
      }

      if (eventsResponse.success && eventsResponse.data) {
        setEvents(eventsResponse.data);
      } else {
        toast.error('Failed to load featured events');
      }
    } catch (error) {
      console.error('Error loading home data:', error);
      toast.error('Failed to load page data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Make a Difference in Your
              <span className="block text-orange-100">Community</span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-orange-50">
              Connect with local volunteer opportunities that match your skills and schedule. 
              Join thousands of volunteers making an impact every day.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="border-2 border-white text-orange-700 hover:bg-black px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-lg"
              >
                Get Started Today
              </Link>
              <Link
                to="/volunteer-matching"
                className="border-2 border-white text-white hover:bg-black px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200"
              >
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="py-12" style={{ backgroundColor: '#f5efe6' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Community Impact</h2>
              <p className="mt-2 text-gray-600">See the difference we're making together</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center bg-white p-6 rounded-lg shadow-sm border border-orange-200">
                <div className="text-3xl font-bold text-orange-600">{stats.volunteerCount.toLocaleString()}</div>
                <div className="text-gray-600 mt-1">Active Volunteers</div>
              </div>
              <div className="text-center bg-white p-6 rounded-lg shadow-sm border border-orange-200">
                <div className="text-3xl font-bold text-orange-500">{stats.upcomingEvents}</div>
                <div className="text-gray-600 mt-1">Upcoming Events</div>
              </div>
              <div className="text-center bg-white p-6 rounded-lg shadow-sm border border-orange-200">
                <div className="text-3xl font-bold text-orange-700">{Math.round(stats.totalHours).toLocaleString()}</div>
                <div className="text-gray-600 mt-1">Hours Logged</div>
              </div>
              <div className="text-center bg-white p-6 rounded-lg shadow-sm border border-orange-200">
                <div className="text-3xl font-bold text-orange-600">{stats.completedToday}</div>
                <div className="text-gray-600 mt-1">Completed Today</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="py-16" style={{ backgroundColor: '#ede5d9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-sm border hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Matching</h3>
                <p className="text-gray-600 mb-4">Find opportunities that fit your skills perfectly with our intelligent matching system.</p>
                <Link to="/volunteer-matching" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium">
                  Find Events →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Flexible Scheduling</h3>
                <p className="text-gray-600 mb-4">Choose your own schedule and commitment level. Volunteer when it works for you.</p>
                <Link to="/profile-page" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium">
                  Set Availability →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Impact</h3>
                <p className="text-gray-600 mb-4">See your volunteer hours and achievements. Watch your community impact grow.</p>
                <Link to="/volunteer-history" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium">
                  My History →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      {events.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Featured Opportunities</h2>
              <p className="mt-2 text-gray-600">Join these upcoming volunteer events</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {events.slice(0, 4).map((event) => (
                <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(event.urgency)}`}>
                      {event.urgency} Priority
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {event.signedUpCount} volunteers signed up
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                  
                  {Array.isArray(event.requiredSkills) && event.requiredSkills.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-2">Skills needed:</div>
                      <div className="flex flex-wrap gap-2">
                        {event.requiredSkills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                        {event.requiredSkills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{event.requiredSkills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Link
                      to={`/event-manage`}
                      className="flex-1 text-center bg-orange-600 text-white hover:bg-orange-700 px-4 py-2 rounded-md font-medium transition-colors"
                    >
                      Sign Up
                    </Link>
                    <button className="text-orange-600 hover:text-orange-700 px-4 py-2 rounded-md border border-orange-600 hover:bg-orange-50 font-medium transition-colors">
                      Learn More
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link
                to="/volunteer-matching"
                className="inline-flex items-center bg-orange-600 text-white hover:bg-orange-700 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                View All Opportunities
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Getting Started */}
      <section className="py-16" style={{ backgroundColor: '#f5efe6' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Make a Difference?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Getting started is easy! Create your profile, browse opportunities, and start volunteering today.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-orange-600 font-bold text-lg border-2 border-orange-200">1</div>
              <h3 className="font-semibold text-gray-900 mb-1">Create Your Profile</h3>
              <p className="text-gray-600 text-sm">Tell us about your skills and availability</p>
            </div>
            <div className="text-center">
              <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-orange-600 font-bold text-lg border-2 border-orange-200">2</div>
              <h3 className="font-semibold text-gray-900 mb-1">Browse Events</h3>
              <p className="text-gray-600 text-sm">Find opportunities that match your interests</p>
            </div>
            <div className="text-center">
              <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-orange-600 font-bold text-lg border-2 border-orange-200">3</div>
              <h3 className="font-semibold text-gray-900 mb-1">Start Volunteering</h3>
              <p className="text-gray-600 text-sm">Sign up and make an impact in your community</p>
            </div>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center bg-orange-600 text-white hover:bg-orange-700 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            Get Started Today
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default App;
