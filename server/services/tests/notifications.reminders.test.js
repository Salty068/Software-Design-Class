import { describe, it, expect, vi, beforeAll } from "vitest";
import { startReminders } from "../../services/notifications.js";
import { store } from "../../store.memory.js";

beforeAll(() => { vi.useFakeTimers(); });

it("emits reminder ~24h before event", () => {
  // seed minimal
  store.upsertVolunteers([{ id:"rv1", name:"V", location:"L", skills:[] }]);
  store.upsertEvents([{ id:"re1", name:"Event", location:"L", requiredSkills:[], date:new Date(Date.now()+23*3600*1000).toISOString(), urgency:"Low" }]);
  store.addAssignment("rv1","re1");

  startReminders();          // sets setInterval(60_000)
  vi.advanceTimersByTime(61_000);

  const list = store.listNotices("rv1");
  expect(list.some(n => n.title.startsWith("Reminder: Event"))).toBe(true);
});
