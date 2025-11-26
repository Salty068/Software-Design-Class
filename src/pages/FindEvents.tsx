import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useNotify } from '../components/NotificationProvider.tsx';

interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  eventDate: string;
  requiredSkills: string[];
  urgency: string;
  isMatched?: boolean;
  status?: 'available' | 'registered' | 'completed' | 'cancelled' | 'assigned' | 'CheckedIn';
  source?: 'volunteer-history' | 'assignments';
}

export default function FindEvents() {
  const { user, requireAuth } = useAuth();
  const notify = useNotify();
  
  // Debug: Log user info
  console.log('Current user:', user);
  
  // Track cancelled events in localStorage to persist across page reloads
  const getCancelledEvents = () => {
    try {
      const cancelled = localStorage.getItem(`cancelled_events_${user?.id}`);
      return cancelled ? JSON.parse(cancelled) : [];
    } catch {
      return [];
    }
  };
  
  const setCancelledEvent = (eventId: string) => {
    try {
      const cancelled = getCancelledEvents();
      if (!cancelled.includes(eventId)) {
        cancelled.push(eventId);
        localStorage.setItem(`cancelled_events_${user?.id}`, JSON.stringify(cancelled));
      }
    } catch (error) {
      console.error('Error storing cancelled event:', error);
    }
  };
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'my-events'>('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [signingUp, setSigningUp] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{ type: 'checkin' | 'cancel', eventId: string, eventName: string } | null>(null);

  useEffect(() => {
    requireAuth();
    fetchEvents();
    fetchMyEvents();
  }, [requireAuth, user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/events');
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      
      // Transform the event data
      const transformedEvents = data.data?.map((event: any) => ({
        id: event.id,
        name: event.eventName || event.name,
        description: event.description || 'No description available',
        location: event.location || 'TBD',
        eventDate: event.eventDate,
        requiredSkills: event.requiredSkills || [],
        urgency: event.urgency || 'Medium',
        status: 'available'
      })) || [];

      setEvents(transformedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      if (!user?.id) return;

      // Fetch both volunteer history and admin assignments
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [historyResponse, assignmentsResponse] = await Promise.all([
        fetch(`/api/volunteer-history?userId=${user.id}`, { headers }),
        fetch(`/api/assignments?userId=${user.id}`, { headers })
      ]);
      
      let myEventsData: Event[] = [];

      // Process volunteer history (self sign-ups)
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log('Raw history data from API:', historyData);
        
        // Handle different data structures - check for nested items array
        const historyArray = historyData.data?.items || historyData.data || historyData || [];
        console.log('History array:', historyArray);
        
        const historyEvents = Array.isArray(historyArray) ? historyArray.map((history: any) => {
          console.log('Processing history item:', {
            eventId: history.eventId,
            eventName: history.eventName,
            rawStatus: history.status,
            participationStatus: history.participationStatus
          });
          
          // The API maps participationStatus to status field, so use status directly
          const statusField = history.status;
          
          // Check if this event was cancelled by the user (stored in localStorage)
          const cancelledEvents = getCancelledEvents();
          const isCancelledByUser = cancelledEvents.includes(history.eventId);
          
          return {
            id: history.eventId || history.id, // Prioritize eventId from updated backend
            name: history.assignment || history.eventName || 'Event',
            description: history.eventDescription || '',
            location: history.location || 'TBD',
            eventDate: history.eventDate,
            requiredSkills: history.requiredSkills || [],
            urgency: history.urgency || 'Medium',
            status: (isCancelledByUser ? 'cancelled' :
                      statusField === 'Completed' ? 'completed' : 
                      statusField === 'Cancelled' ? 'cancelled' : 
                      statusField === 'CheckedIn' ? 'CheckedIn' :
                      'registered') as 'registered' | 'completed' | 'cancelled' | 'CheckedIn',
            isMatched: true,
            source: 'volunteer-history' as const // Track the source
          };
        }) : [];
        
        console.log('Mapped history events:', historyEvents);
        
        // Filter out any events that have inconsistent status (this is a safeguard)
        const validHistoryEvents = historyEvents.filter(event => {
          if (event.name?.toLowerCase().includes('tutor')) {
            const originalItem = historyArray.find((h: any) => h.eventId === event.id);
            console.log('Tutor event status check:', {
              name: event.name,
              status: event.status,
              originalStatus: originalItem?.status,
              originalParticipationStatus: originalItem?.participationStatus
            });
          }
          return true; // Keep all events for now, just log for debugging
        });
        
        myEventsData = [...myEventsData, ...validHistoryEvents];
      }

      // Process admin assignments
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        // Handle different data structures  
        const assignmentsArray = assignmentsData.data || assignmentsData || [];
        
        const assignmentEvents = Array.isArray(assignmentsArray) ? assignmentsArray.map((assignment: any) => ({
          id: assignment.eventId,
          name: assignment.eventName || 'Event',
          description: assignment.eventDescription || '',
          location: assignment.location || 'TBD',
          eventDate: assignment.eventDate,
          requiredSkills: assignment.requiredSkills || [],
          urgency: assignment.urgency || 'Medium',
          status: 'assigned' as 'assigned',
          isMatched: true,
          source: 'assignments' as const // Track the source
        })) : [];
        myEventsData = [...myEventsData, ...assignmentEvents];
      }

      // Remove duplicates with smart status handling
      // If an event appears multiple times, prioritize cancelled status over others
      console.log('All myEventsData before duplicate removal:', myEventsData.map(e => ({
        id: e.id,
        name: e.name,
        status: e.status,
        source: e.source
      })));
      
      const eventMap = new Map();
      
      myEventsData.forEach(event => {
        const existingEvent = eventMap.get(event.id);
        
        if (!existingEvent) {
          // First occurrence, add it
          console.log(`Adding first occurrence: ${event.name} (${event.source}) with status ${event.status}`);
          eventMap.set(event.id, event);
        } else {
          // Duplicate found - prioritize cancelled status
          console.log(`Duplicate found for ${event.name}:`, {
            existing: { status: existingEvent.status, source: existingEvent.source },
            new: { status: event.status, source: event.source }
          });
          
          if (event.status?.toLowerCase() === 'cancelled') {
            console.log(`Prioritizing cancelled status for event ${event.name} (ID: ${event.id})`);
            eventMap.set(event.id, event);
          } else if (existingEvent.status?.toLowerCase() === 'cancelled') {
            console.log(`Keeping existing cancelled status for event ${event.name} (ID: ${event.id})`);
            // Keep the existing cancelled one, don't replace
          } else {
            // Neither is cancelled, keep the first one
            console.log(`Keeping first occurrence for event ${event.name} (ID: ${event.id})`);
          }
        }
      });
      
      const uniqueEvents = Array.from(eventMap.values());
      console.log('Final unique events:', uniqueEvents);

      setMyEvents(uniqueEvents);
    } catch (err) {
      console.error('Error fetching my events:', err);
      // Don't show error for my events, just log it
    }
  };

  const signUpForEvent = async (eventId: string) => {
    try {
      if (!user?.id) {
        alert('You must be logged in to sign up for events');
        return;
      }

      setSigningUp(eventId);

      // Find the event details
      const event = events.find(e => e.id === eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const response = await fetch('/api/volunteer-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          volunteerId: user.id,
          eventId: eventId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sign up for event');
      }

      await response.json(); // Consume response

      // Show success notification
      notify({ 
        title: "✓ Successfully Registered!", 
        body: `You've been signed up for "${event.name}". Check your registered events in My Matched Events.`, 
        type: "success" 
      });

      // Add a small delay to ensure database update is complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh both event lists to reflect the change
      await Promise.all([fetchEvents(), fetchMyEvents()]);

      // Switch to "My Events" tab to show the newly registered event
      setActiveTab('my-events');

    } catch (error) {
      console.error('Error signing up for event:', error);
      notify({ 
        title: "Registration Failed", 
        body: error instanceof Error ? error.message : 'Failed to sign up for event. Please try again.', 
        type: "error" 
      });
    } finally {
      setSigningUp(null);
    }
  };

  const handleCheckIn = async (eventId: string) => {
    if (!user?.id) return;

    // Find the event to determine its source
    const event = myEvents.find(e => e.id === eventId);
    if (!event) {
      notify({ 
        title: "Error", 
        body: "Event not found", 
        type: "error" 
      });
      return;
    }

    try {
      setActionLoading(eventId);
      

      
      const response = await fetch(`/api/volunteer-history/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          volunteerId: user.id,
          eventId: eventId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check in');
      }

      notify({ 
        title: "✓ Checked In Successfully!", 
        body: "You have been checked in to the event.", 
        type: "success" 
      });
      await fetchMyEvents(); // Refresh my events

    } catch (error) {
      console.error('Error checking in:', error);
      notify({ 
        title: "Check-in Failed", 
        body: error instanceof Error ? error.message : 'Failed to check in. Please try again.', 
        type: "error" 
      });
    } finally {
      setActionLoading(null);
      setShowConfirmModal(null);
    }
  };

  const handleCancelAssignment = async (eventId: string) => {
    if (!user?.id) return;

    // Find the event to determine its source
    const event = myEvents.find(e => e.id === eventId);
    if (!event) {
      notify({ 
        title: "Error", 
        body: "Event not found", 
        type: "error" 
      });
      return;
    }

    // Check if this is an admin assignment (can't be cancelled by user)
    if (event.source === 'assignments') {
      notify({ 
        title: "Cannot Cancel", 
        body: "This is an admin assignment and cannot be cancelled. Please contact an administrator.", 
        type: "error" 
      });
      setShowConfirmModal(null);
      return;
    }

    try {
      setActionLoading(eventId);
      

      
      const cancelPayload = {
        volunteerId: user.id,
        eventId: eventId
      };
      
      console.log('Sending cancel request with payload:', cancelPayload);
      
      const response = await fetch(`/api/volunteer-history/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(cancelPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Cancel assignment failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });

        // If it's already cancelled, treat it as success and update local state
        const errorMessage = errorData.message || errorData.error || '';
        console.log('Checking error message for "already cancelled":', {
          errorMessage,
          includes: errorMessage.toLowerCase().includes('already cancelled')
        });
        
        if (errorMessage.toLowerCase().includes('already cancelled')) {
          console.log('Event already cancelled on backend, updating local state...');
          
          // Store in localStorage and update local state
          setCancelledEvent(eventId);
          setMyEvents(prevEvents => 
            prevEvents.map(e => 
              e.id === eventId 
                ? { ...e, status: 'cancelled' as const }
                : e
            )
          );
          
          notify({ 
            title: "✓ Assignment Cancelled", 
            body: "This event has been cancelled. Moving it back to available events.", 
            type: "success" 
          });
          
          // DON'T refresh from backend since it has stale data
          // Just refresh events list and switch tab, keeping our local state update
          await fetchEvents();
          setActiveTab('available');
          setActionLoading(null);
          setShowConfirmModal(null);
          return; // Exit early since we handled it
        }

        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Failed to cancel assignment`);
      }

      // Check what the backend actually returned
      const responseData = await response.json();
      console.log('Cancel API Response:', responseData);

      // Store in localStorage and immediately update the local state  
      setCancelledEvent(eventId);
      setMyEvents(prevEvents => 
        prevEvents.map(e => 
          e.id === eventId 
            ? { ...e, status: 'cancelled' as const }
            : e
        )
      );

      notify({ 
        title: "✗ Assignment Cancelled", 
        body: "Your assignment has been cancelled successfully. The event is now available for sign-up again.", 
        type: "success" 
      });
      
      // Only refresh events list, don't refresh myEvents to preserve local state update
      await fetchEvents();
      
      // Switch to "Available Events" tab to show the event is available again
      setActiveTab('available');

    } catch (error) {
      console.error('Error cancelling assignment:', error);
      notify({ 
        title: "Cancellation Failed", 
        body: error instanceof Error ? error.message : 'Failed to cancel assignment. Please try again.', 
        type: "error" 
      });
    } finally {
      setActionLoading(null);
      setShowConfirmModal(null);
    }
  };

  const filteredEvents = events.filter(event => {
    // First filter out events the user is already registered for (but allow cancelled events)
    const isAlreadyRegistered = myEvents.some(myEvent => {
      // Don't consider cancelled events as "registered" - they should appear in available
      // Handle both "cancelled" and "Cancelled" status values
      if (myEvent.status?.toLowerCase() === 'cancelled') return false;
      return myEvent.id === event.id;
    });
    
    if (isAlreadyRegistered) return false;
    
    // Then apply search filter
    return event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.requiredSkills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const filteredMyEvents = myEvents.filter(event => {
    // Debug: Check for cancelled events
    if (event.name?.toLowerCase().includes('tutor') || event.status?.toLowerCase() === 'cancelled') {
      console.log('Filtering myEvents - Event:', {
        name: event.name,
        status: event.status,
        willFilter: event.status?.toLowerCase() === 'cancelled'
      });
    }
    
    // Exclude cancelled events from the list (they should appear in available events)
    // Handle both "cancelled" and "Cancelled" status values
    if (event.status?.toLowerCase() === 'cancelled') return false;
    
    // Apply search filter
    return event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.requiredSkills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CheckedIn':
        return 'Checked In';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'registered':
        return 'Registered';
      case 'assigned':
        return 'Assigned';
      case 'available':
      default:
        return 'Available';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'CheckedIn':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'registered':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'available':
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  // Confirmation Modal Component
  const ConfirmationModal = () => {
    if (!showConfirmModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">
            {showConfirmModal.type === 'checkin' ? 'Check In to Event' : 'Cancel Assignment'}
          </h3>
          <p className="text-gray-600 mb-6">
            {showConfirmModal.type === 'checkin' 
              ? `Are you ready to check in to "${showConfirmModal.eventName}"?`
              : `Are you sure you want to cancel your assignment to "${showConfirmModal.eventName}"?`}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowConfirmModal(null)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={actionLoading === showConfirmModal.eventId}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (showConfirmModal.type === 'checkin') {
                  handleCheckIn(showConfirmModal.eventId);
                } else {
                  handleCancelAssignment(showConfirmModal.eventId);
                }
              }}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                showConfirmModal.type === 'checkin'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              disabled={actionLoading === showConfirmModal.eventId}
            >
              {actionLoading === showConfirmModal.eventId 
                ? 'Processing...' 
                : showConfirmModal.type === 'checkin' 
                  ? 'Check In' 
                  : 'Cancel Assignment'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ConfirmationModal />
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Find Events</h1>
            <p className="text-orange-100 text-lg">
              Discover volunteer opportunities and manage your events
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-8 pt-6">
              <button
                onClick={() => setActiveTab('available')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Available Events ({filteredEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('my-events')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-events'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Matched Events ({filteredMyEvents.length})
              </button>
            </nav>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-200">
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Events
              </label>
              <input
                type="text"
                placeholder="Search by name, location, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && activeTab === 'available' && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                <strong>Error:</strong> {error}
                <button 
                  onClick={fetchEvents}
                  className="ml-4 underline hover:no-underline"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Available Events Tab */}
            {activeTab === 'available' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Available Events</h2>
                  <p className="text-gray-600">Browse and sign up for volunteer opportunities</p>
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events Found</h3>
                    <p className="text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms.' : 'No events are currently available.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
                      >
                        {/* Event Header */}
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                            {event.name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${getUrgencyColor(
                              event.urgency
                            )}`}
                          >
                            {event.urgency} Priority
                          </span>
                        </div>

                        {/* Event Description */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {event.description}
                        </p>

                        {/* Event Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500 w-16">📍</span>
                            <span className="text-gray-700">{event.location}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500 w-16">📅</span>
                            <span className="text-gray-700">{formatDate(event.eventDate)}</span>
                          </div>
                        </div>

                        {/* Required Skills */}
                        {event.requiredSkills && event.requiredSkills.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Skills Required:</p>
                            <div className="flex flex-wrap gap-1">
                              {event.requiredSkills.slice(0, 3).map((skill, index) => (
                                <span
                                  key={index}
                                  className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                              {event.requiredSkills.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{event.requiredSkills.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="pt-4 border-t border-gray-200">
                          <button 
                            onClick={() => signUpForEvent(event.id)}
                            disabled={signingUp === event.id}
                            className={`w-full py-2 px-4 rounded-lg transition-colors duration-200 font-medium ${
                              signingUp === event.id
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-orange-500 text-white hover:bg-orange-600'
                            }`}
                          >
                            {signingUp === event.id ? 'Signing Up...' : 'Sign Up for Event'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Events Tab */}
            {activeTab === 'my-events' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">My Matched Events</h2>
                  <p className="text-gray-600">Events you've signed up for or been assigned to by administrators</p>
                </div>

                {filteredMyEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Matched Events</h3>
                    <p className="text-gray-500 mb-6">
                      {searchTerm ? 'No matched events found for your search.' : 'You haven\'t signed up for any events yet.'}
                    </p>
                    <button
                      onClick={() => setActiveTab('available')}
                      className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
                    >
                      Browse Available Events
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMyEvents.map((event) => (
                      <div
                        key={event.id}
                        className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
                      >
                        {/* Event Header */}
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                            {event.name}
                          </h3>
                          <div className="flex flex-col gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                                event.status || 'registered'
                              )}`}
                            >
                              {getStatusText(event.status || 'registered')}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getUrgencyColor(
                                event.urgency
                              )}`}
                            >
                              {event.urgency} Priority
                            </span>
                          </div>
                        </div>

                        {/* Event Description */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {event.description}
                        </p>

                        {/* Event Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500 w-16">📍</span>
                            <span className="text-gray-700">{event.location}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500 w-16">📅</span>
                            <span className="text-gray-700">{formatDate(event.eventDate)}</span>
                          </div>
                        </div>

                        {/* Required Skills */}
                        {event.requiredSkills && event.requiredSkills.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Skills Required:</p>
                            <div className="flex flex-wrap gap-1">
                              {event.requiredSkills.slice(0, 3).map((skill, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                              {event.requiredSkills.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{event.requiredSkills.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="pt-4 border-t border-gray-200">
                          {event.status === 'completed' ? (
                            <span className="text-green-600 text-sm font-medium">✓ Completed</span>
                          ) : event.status === 'cancelled' ? (
                            <span className="text-red-600 text-sm font-medium">✗ Cancelled</span>
                          ) : event.status === 'CheckedIn' ? (
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-600 text-sm font-medium">✓ Checked In</span>
                              {event.source === 'volunteer-history' ? (
                                <button
                                  onClick={() => setShowConfirmModal({
                                    type: 'cancel',
                                    eventId: event.id,
                                    eventName: event.name
                                  })}
                                  disabled={actionLoading === event.id}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              ) : (
                                <span className="text-xs text-gray-500">Admin Assignment</span>
                              )}
                            </div>
                          ) : event.source === 'assignments' ? (
                            <div className="space-y-2">
                              <span className="text-blue-600 text-sm font-medium">📋 Admin Assignment</span>
                              <button
                                onClick={() => setShowConfirmModal({
                                  type: 'checkin',
                                  eventId: event.id,
                                  eventName: event.name
                                })}
                                disabled={actionLoading === event.id}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === event.id ? 'Processing...' : '✓ Check In'}
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowConfirmModal({
                                  type: 'checkin',
                                  eventId: event.id,
                                  eventName: event.name
                                })}
                                disabled={actionLoading === event.id}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === event.id ? 'Processing...' : '✓ Check In'}
                              </button>
                              <button
                                onClick={() => setShowConfirmModal({
                                  type: 'cancel',
                                  eventId: event.id,
                                  eventName: event.name
                                })}
                                disabled={actionLoading === event.id}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === event.id ? 'Processing...' : '✗ Cancel'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}