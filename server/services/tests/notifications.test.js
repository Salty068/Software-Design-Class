import { describe, it, expect } from "vitest";
import { notify, bus } from "../notifications.js";
import { store } from "../../store.memory.js";
import { demoVols, demoEvents } from "../../demo_data/volunteer_events.data.js";

store.upsertVolunteers(demoVols);
store.upsertEvents(demoEvents);

it("notify() adds a notice to the store", () => {
  const volId = demoVols[0].id;
  const n = notify(volId, { title: "Test notice", body: "hello" });
  const list = store.listNotices(volId);
  expect(list.some(x => x.id === n.id)).toBe(true);
});

it("notify() emits on the bus", async () => {
  const volId = demoVols[0].id;
  const p = new Promise(resolve => {
    const topic = `notice:${volId}`;
    const handler = (n) => { bus.off(topic, handler); resolve(n); };
    bus.on(topic, handler);
  });
  const sent = notify(volId, { title: "Bus notice" });
  const got = await p;
  expect(got.id).toBe(sent.id);
});
