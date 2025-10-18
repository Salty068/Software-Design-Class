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

  return (
    <div className="max-w-4x1 mx-auto p-6 space-y-8">
      <h1 className="text-2x1 font-bold">Volunteer Matching</h1>

      <div className="space-y-2">
        <label className="block">Volunteer</label>
        <select value={volId} className="bg-white" onChange={e => setVolId(e.target.value)} disabled={!vols.length}>
          {vols.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        {vol && (
          <div>
            <div>Location: {vol.location}</div>
            <div className="flex gap-2 flex-wrap">
              {vol.skills.map(s => <span key={s} className="text-xs px-2 py-0.5 border rounded">{s}</span>)}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block">Event:</label>
        <select className="bg-white" value={eventId} onChange={e => setEventId(e.target.value)} disabled={!events.length}>
          {rankedFirst.map(id => {
            const e = events.find(x => x.id === id)!;
            const sc = scoreById.get(id);
            return (
              <option key={id} value={id}>
                {e.name} • {e.location} • {e.urgency} • {e.date}{typeof sc === "number" ? ` • score ${sc}` : " • not matched"}
              </option>
            );
          })}
        </select>
      </div>

      <div className="flex gap-3">
        <button disabled={!eventId} onClick={onAssign} className="px-3 py-1 border rounded">Assign</button>
        <button onClick={() => setEventId("")} className="px-3 py-1 border rounded">Clear</button>
      </div>

      <section>
        <h2>All Events</h2>
        <div className="grid gap-3">
          {events.map(e => {
            const sc = scoreById.get(e.id) ?? 0;
            const missing = vol ? e.requiredSkills.filter(s => !vol.skills.includes(s)) : [];
            const ok = vol ? missing.length === 0 && e.location === vol.location : false;
            return (
              <div key={e.id} className={`border rounded-lg p-3 ${ok ? "border-green-400" : "border-gray-200"}`}>
                <div className="font-medium">{e.name}</div>
                <div>{e.location} • {e.urgency} • {e.date} • score {sc}</div>
                <div className="flex gap-2 flex-wrap">
                  {e.requiredSkills.map(s => <span key={s} className="text-xs px-2 py-0.5 border rounded">{s}</span>)}
                </div>
                {!ok && vol && (
                  <div className="text-xs mt-1 opacity-70">
                    {e.location !== vol.location && <span>Location mismatch. </span>}
                    {missing.length > 0 && <span>Missing: {missing.join(", ")}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
