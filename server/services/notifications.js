import { EventEmitter } from "events";
import { store } from "../store.memory.js";

export const bus = new EventEmitter(); // emits: notice:<volId>

export function notify(volunteerId, { title, body, type = "info" }) {
  const n = store.addNotice(volunteerId, { title, body, type });
  bus.emit(`notice:${volunteerId}`, n);
  return n;
}

export function startReminders() {
  setInterval(() => {
    const now = Date.now();
    for (const v of store.listVolunteers()) {
      for (const a of store.listAssignmentsByVolunteer(v.id)) {
        const ev = store.getEvent(a.eventId);
        if (!ev) continue;
        const t = new Date(ev.date).getTime();
        const diff = t - now;
        if (diff > 0 && diff < 24*3600*1000) {
          notify(v.id, { title: `Reminder: ${ev.name} tomorrow`, body: `${ev.location} • ${ev.date}`, type: "warn" });
        }
      }
    }
  }, 60_000);
}
