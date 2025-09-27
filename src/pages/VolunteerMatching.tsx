import { useEffect, useMemo, useState } from "react";

type Volunteer = { id: string; name: string; location: string; skills: string[] };
type EventItem = { id: string; name: string; location: string; requiredSkills: string[]; date: string; urgency: "Low"|"Medium"|"High" };

const demoVols: Volunteer[] = [
  { id: "v1", name: "Yusuf Y", location: "UH", skills: ["Tutoring", "Computer Science", "Math"] },
  { id: "v2", name: "Sir Isaac Newton", location: "Midtown",  skills: ["Cooking", "Driving", "Logistics", "Baby Care"] },
  { id: "v3", name: "Einstein Awesome", location: "Downtown", skills: ["Childcare","Teaching","CPR"] },
];

const demoEvents: EventItem[] = [
  { id:"e1", name:"Food Bank Shift", location:"Midtown",  requiredSkills:["Cooking"], date:"2025-10-12", urgency:"Medium" },
  { id:"e2", name:"After-School Tutor", location:"UH", requiredSkills:["Tutoring","Computer Science"], date:"2025-10-14", urgency:"Low" },
  { id:"e3", name:"Marathon First-Aid", location:"Downtown", requiredSkills:["First Aid","CPR"], date:"2025-10-20", urgency:"High" },
  { id:"e4", name:"Warehouse Logistics", location:"Downtown", requiredSkills:["Logistics"], date:"2025-10-09", urgency:"Medium" },
];

function matchEvents(v: Volunteer, all: EventItem[]) {
  return all.filter(e => e.location === v.location && e.requiredSkills.every(s => v.skills.includes(s)));
}

function VolunteerMatchingDemo() {
  const [volId, setVolId] = useState(demoVols[0].id);
  const vol = useMemo(() => demoVols.find(v => v.id === volId)!, [volId]);
  const matches = useMemo(() => matchEvents(vol, demoEvents), [vol]);
  const [eventId, setEventId] = useState("");

  useEffect(() => setEventId(matches[0]?.id ?? ""), [matches]);

  return (
    <div className="
        max-w-4x1 mx-auto p-6
        space-y-8
    ">
      <h1 className="text-2x1 font-bold">Volunteer Matching</h1>

      <div className="space-y-2">
        <label className="block">Volunteer</label>
        <select value={volId} className="bg-white" onChange={e => setVolId(e.target.value)}>
          {demoVols.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <div >
          <div >Location: {vol.location}</div>
          <div >
            {vol.skills.map(s => <span key={s}>{s}</span>)}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block">Matched Event:</label>
        <select className="bg-white" value={eventId} onChange={e => setEventId(e.target.value)} disabled={!matches.length}>
          {matches.length ? matches.map(e =>
            <option key={e.id} value={e.id}>{e.name} • {e.location} • {e.urgency} • {e.date}</option>
          ) : <option value="">No matches</option>}
        </select>
      </div>

      <div >
        <button
          disabled={!eventId}
          onClick={() => {
            const ev = demoEvents.find(e => e.id === eventId)!;
            alert(`${vol.name} → ${ev.name} (${ev.date})`);
          }}
        >
          Assign
        </button>
        <button onClick={() => setEventId("")}>Clear</button>
      </div>

      <section>
        <h2 >All Events</h2>
        <div>
          {demoEvents.map(e => {
            const missing = e.requiredSkills.filter(s => !vol.skills.includes(s));
            const ok = missing.length === 0 && e.location === vol.location;
            return (
              <div key={e.id} className={`border rounded-lg p-3 ${ok ? "border-green-400" : "border-gray-200"}`}>
                <div>{e.name}</div>
                <div>{e.location} • {e.urgency} • {e.date}</div>
                <div>
                  {e.requiredSkills.map(s => <span key={s}>{s}</span>)}
                </div>
                {!ok && (
                  <div>
                    {e.location !== vol.location && <span>Location mismatch</span>}
                    {missing.length > 0 && <span>Missing skills: {missing.join(", ")}</span>}
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

export default VolunteerMatchingDemo
