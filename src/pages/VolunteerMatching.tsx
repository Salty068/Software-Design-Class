import { useEffect, useMemo, useState } from "react";
import { useNotify, useServerNotifications } from "../components/NotificationProvider";

type Volunteer = { id: string; name: string; location: string; skills: string[] };
type EventItem = { id: string; name: string; location: string; requiredSkills: string[]; date: string; urgency: "Low"|"Medium"|"High" };
type Ranked = { event: EventItem; score: number };

export default function VolunteerMatchingDemo() {
  const [vols, setVols] = useState<Volunteer[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [volId, setVolId] = useState<string>("");
  const [ranked, setRanked] = useState<Ranked[]>([]);
  const [eventId, setEventId] = useState("");
  const vol = useMemo(() => vols.find(v => v.id === volId), [volId, vols]);
  const notify = useNotify();

  useServerNotifications(volId || undefined);

  // load volunteers + events once
  useEffect(() => {
    (async () => {
      const [vRes, eRes] = await Promise.all([
        fetch("/api/match/volunteers"),
        fetch("/api/match/events"),
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
      const res = await fetch(`/api/match/volunteer/${encodeURIComponent(volId)}?topN=9999`);
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
    const res = await fetch("/api/match/assign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ volunteerId: volId, eventId }),
    });
    if (!res.ok) { notify({ title: "Assignment failed", body: `HTTP ${res.status}`, type: "error" }); return; }
   
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

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-orange-100">
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
              <select 
                value={volId} 
                onChange={e => setVolId(e.target.value)} 
                disabled={!vols.length}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900"
              >
                {vols.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
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
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-orange-100">
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
              <select 
                value={eventId} 
                onChange={e => setEventId(e.target.value)} 
                disabled={!events.length}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900"
              >
                {rankedFirst.map(id => {
                  const e = events.find(x => x.id === id)!;
                  const sc = scoreById.get(id);
                  return (
                    <option key={id} value={id}>
                      {e.name} • {e.location} • {e.urgency} Priority • {formatDate(e.date)}{typeof sc === "number" ? ` • Match: ${sc}%` : " • No Match Score"}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                disabled={!eventId} 
                onClick={onAssign} 
                className="flex-1 bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-300 disabled:text-gray-500 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Assign Volunteer
              </button>
              <button 
                onClick={() => setEventId("")} 
                className="px-6 py-3 border-2 border-orange-600 text-orange-600 hover:bg-orange-50 rounded-lg font-semibold transition-colors duration-200"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-orange-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Available Events</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{events.length} events</span>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map(e => {
              const sc = scoreById.get(e.id) ?? 0;
              const missing = vol ? e.requiredSkills.filter(s => !vol.skills.includes(s)) : [];
              const ok = vol ? missing.length === 0 && e.location === vol.location : false;
              return (
                <div key={e.id} className={`border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg ${ok ? "border-green-300 bg-green-50" : "border-gray-200 hover:border-orange-300"}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{e.name}</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(e.urgency)}`}>
                        {e.urgency}
                      </span>
                      {typeof sc === "number" && sc > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(sc)}`}>
                          {sc}% Match
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
