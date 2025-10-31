import prisma from "../db.js";
import { ensureEventPayload, EVENT_URGENCY_OPTIONS, generateId, toUniqueSkills } from "../shared.js";

export { EVENT_URGENCY_OPTIONS };

const mapEvent = (row) => ({
  id: row.id,
  name: row.eventName,
  description: row.description,
  location: row.location,
  requiredSkills: toUniqueSkills(Array.isArray(row.requiredSkills) ? row.requiredSkills : []),
  urgency: row.urgency,
  eventDate: row.eventDate.toISOString().slice(0, 10),
});

const toEventData = (safe) => ({
  eventName: safe.name,
  description: safe.description,
  location: safe.location,
  requiredSkills: safe.requiredSkills,
  urgency: safe.urgency,
  eventDate: new Date(`${safe.eventDate}T00:00:00.000Z`),
});

export async function listEvents() {
  const rows = await prisma.eventDetails.findMany({ orderBy: { eventDate: "desc" } });
  return rows.map(mapEvent);
}

export async function createEvent(payload) {
  const safe = ensureEventPayload(payload);
  const created = await prisma.eventDetails.create({ data: toEventData(safe) });
  return mapEvent(created);
}

export async function updateEvent(id, payload) {
  const safe = ensureEventPayload(payload);
  const updated = await prisma.eventDetails.update({ where: { id }, data: toEventData(safe) });
  return mapEvent(updated);
}

export async function deleteEvent(id) {
  await prisma.eventDetails.delete({ where: { id } });
}

export async function resetEvents(seed = []) {
  const rows = seed.map((item) => {
    const safe = ensureEventPayload(item);
    const id = item?.id ? String(item.id) : generateId("event");
    return { id, ...toEventData(safe) };
  });

  await prisma.volunteerHistory.deleteMany({});
  await prisma.eventDetails.deleteMany({});

  for (const data of rows) {
    await prisma.eventDetails.create({ data });
  }
}
