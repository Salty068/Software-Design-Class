import { useEffect, useState, useMemo } from "react";
import { useNotify } from "../components/NotificationProvider.tsx";
import { useAuth } from "../contexts/AuthContext.tsx";
import CustomSelect from "../components/CustomSelect.tsx";

type Volunteer = { id: string; name: string; location: string; skills: string[], availability:string[] };
type EventItem = { id: string; name: string; location: string; requiredSkills: string[]; date: string; urgency: "Low"|"Medium"|"High" };
type Ranked = { event: EventItem; score: number };

export default function VolunteerMatchingDemo() {
  const [vols, setVols] = useState<Volunteer[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [volId, setVolId] = useState<string>("");
  const [ranked, setRanked] = useState<Ranked[]>([]);
  const [eventId, setEventId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [lastAssignmentSuccess, setLastAssignmentSuccess] = useState<string | null>(null);
  const vol = useMemo(() => vols.find(v => v.id === volId), [volId, vols]);
  const notify = useNotify();
  const { requireAdmin } = useAuth();

  // Ensure only admins can access this page
  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  // Note: Removed automatic SSE subscription for selected volunteers
  // Admins should only receive notifications for their own actions, not for every volunteer they select

  // load volunteers + events once
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [vRes, eRes] = await Promise.all([
        fetch("/api/match/volunteers", { headers }),
        fetch("/api/match/events", { headers }),
      ]);
      const vData: Volunteer[] = vRes.ok ? await vRes.json() : [];
      const eData: EventItem[] = eRes.ok ? await eRes.json() : [];
      setVols(vData);
      setEvents(eData);
      if (vData.length) setVolId(vData[0].id);
    })();
  }, []);

  // fetch matches for scores and ordering
  useEffect(() => {
    if (!volId) return;
    (async () => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch(`/api/match/volunteer/${encodeURIComponent(volId)}?topN=9999`, { headers });
      const data: Ranked[] = res.ok ? await res.json() : [];
      setRanked(data);
      // default to top scored if exists, otherwise first event
      setEventId(data[0]?.event?.id ?? events[0]?.id ?? "");
    })();
  }, [volId, events]);

  // quick lookup maps
  const scoreById = useMemo(
    () => new Map(ranked.map(r => [r.event.id, r.score])),
    [ranked]
  );
  const rankedIds = useMemo(() => new Set(ranked.map(r => r.event.id)), [ranked]);
  const rankedFirst = useMemo(() => {
    const top = ranked.map(r => r.event.id);
    const rest = events.filter(e => !rankedIds.has(e.id)).map(e => e.id);
    return [...top, ...rest]; // ids ordered: matched first, then others
  }, [ranked, events, rankedIds]);

  const onAssign = async () => {
    if (!eventId || !volId) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      notify({ title: "Authentication required", body: "Please log in", type: "error" });
      return;
    }

    setIsAssigning(true);
    setLastAssignmentSuccess(null);

    try {
      const res = await fetch("/api/match/assign", {
        method: "POST",
        headers: { 
          "content-type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ volunteerId: volId, eventId }),
      });
      
      if (!res.ok) { 
        if (res.status === 409) {
          // Handle duplicate assignment
          const errorData = await res.json();
          notify({ 
            title: "Already Assigned", 
            body: errorData.message || "This volunteer is already assigned to this event", 
            type: "warn" 
          }); 
        } else {
          notify({ title: "Assignment failed", body: `HTTP ${res.status}`, type: "error" }); 
        }
        return; 
      }
      
      // Success
      const selectedVolunteer = vols.find(v => v.id === volId);
      const selectedEvent = events.find(e => e.id === eventId);
      
      notify({ 
        title: "✅ Assignment Successful!", 
        body: `${selectedVolunteer?.name} assigned to "${selectedEvent?.name}"`, 
        type: "success" 
      });

      // Set visual success indicator
      setLastAssignmentSuccess(`${volId}-${eventId}`);
      
      // Clear success indicator after 3 seconds
      setTimeout(() => {
        setLastAssignmentSuccess(null);
      }, 3000);

    } catch (error) {
      notify({ 
        title: "Assignment Error", 
        body: "Network error occurred. Please try again.", 
        type: "error" 
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5efe6' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-60 right-20 w-48 h-48 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-orange-100 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Smart Volunteer Matching
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our intelligent matching system connects volunteers with the perfect opportunities based on skills, location, and availability.
          </p>
        </div>

        {/* Success Banner */}
        {lastAssignmentSuccess && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6 animate-pulse">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-green-800 font-semibold">🎉 Assignment Completed Successfully!</p>
                <p className="text-green-600 text-sm">
                  {vols.find(v => v.id === volId)?.name} has been assigned to "{events.find(e => e.id === eventId)?.name}"
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-lg p-8 mb-8 border border-orange-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Select Volunteer</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Choose Volunteer Profile</label>
              <CustomSelect
                options={vols.map(v => ({
                  value: v.id,
                  label: v.name,
                  subtitle: `${v.location} • ${v.skills.join(', ')}`
                }))}
                value={volId}
                onChange={setVolId}
                placeholder="Select a volunteer..."
                disabled={!vols.length}
              />
            </div>
            
            {vol && (
              <div className="bg-orange-50 rounded-lg p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium text-gray-900">Location: {vol.location}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Skills & Expertise</div>
                  <div className="flex gap-2 flex-wrap">
                    {vol.skills.map(s => (
                      <span key={s} className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                {vol.availability && <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Availability</div>
                  <div className="flex gap-2 flex-wrap">
                    {vol.availability.map(s => (
                      <span key={s} className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div> }
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-lg p-8 mb-8 border border-orange-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Select Event & Assign</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">Choose Event (Sorted by Best Match)</label>
              <CustomSelect
                options={rankedFirst.map(id => {
                  const e = events.find(x => x.id === id)!;
                  const sc = scoreById.get(id);
                  return {
                    value: id,
                    label: e.name,
                    subtitle: `${e.location} • ${e.urgency} Priority • ${formatDate(e.date)}${typeof sc === "number" ? ` • Match Score: ${(sc*10).toFixed(2)}` : " • No Match Score"}`
                  };
                })}
                value={eventId}
                onChange={setEventId}
                placeholder="Select an event..."
                disabled={!events.length}
              />
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                disabled={!eventId || isAssigning} 
                onClick={onAssign} 
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 border ${
                  lastAssignmentSuccess === `${volId}-${eventId}`
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-green-300 text-white' 
                    : isAssigning
                    ? 'bg-gradient-to-r from-orange-400 to-orange-500 border-orange-300 text-white cursor-not-allowed'
                    : !eventId
                    ? 'bg-gradient-to-r from-gray-300 to-gray-400 border-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-orange-300 text-white'
                }`}
              >
                {isAssigning ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Assigning...
                  </>
                ) : lastAssignmentSuccess === `${volId}-${eventId}` ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Assigned Successfully!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Assign Volunteer
                  </>
                )}
              </button>
              <button 
                onClick={() => setEventId("")} 
                className="px-6 py-3 border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-800 hover:text-orange-900 rounded-lg font-semibold transition-all duration-200"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-lg p-8 border border-orange-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Available Events</h2>
            <span className="text-sm text-gray-500 bg-orange-100 px-3 py-1 rounded-full">{events.length} events</span>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map(e => {
              const sc = scoreById.get(e.id) ?? 0;
              
              const missing = vol ? e.requiredSkills.filter(s => !vol.skills.includes(s)) : [];
              const unav = vol ? (vol.availability && vol.availability.some(avail => avail===e.date)) : false;
              const ok = vol ? missing.length === 0 && e.location === vol.location && !unav : false;
              return (
                <div key={e.id} className={`border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg ${ok ? "border-green-300 bg-gradient-to-br from-green-50 to-green-100" : "border-orange-200 bg-gradient-to-br from-white to-orange-50 hover:border-orange-300 hover:to-orange-100"}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{e.name}</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(e.urgency)}`}>
                        {e.urgency}
                      </span>
                      {typeof sc === "number" && sc > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(sc)}`}>
                          {(sc*10).toFixed(2)} Match Score
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {e.location}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(e.date)}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Required Skills</div>
                    <div className="flex gap-1 flex-wrap">
                      {e.requiredSkills.map(s => {
                        const hasSkill = vol?.skills.includes(s);
                        return (
                          <span key={s} className={`text-xs px-2 py-1 rounded-full font-medium ${
                            hasSkill ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                          }`}>
                            {s}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  
                  {ok ? (
                    <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                      </svg>
                      Perfect Match!
                    </div>
                  ) : vol && (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      {e.location !== vol.location && <div>📍 Location mismatch</div>}
                      {missing.length > 0 && <div>🔧 Missing skills: {missing.join(", ")}</div>}
                      {unav && <div>Volunteer is unavailable</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
