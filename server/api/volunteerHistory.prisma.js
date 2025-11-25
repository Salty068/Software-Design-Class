import prisma from "../db.js";
import { ensureVolunteerPayload, generateId, PARTICIPATION_STATUSES } from "../shared.js";

const parseFeedback = (value) => {
  try {
    return JSON.parse(value || "{}");
  } catch (_) {
    return {};
  }
};

const mapHistory = (row) => {
  const extra = parseFeedback(row.feedback);
  return {
    id: row.id,
    volunteerId: row.userId,
    volunteerName: extra.volunteerName || "",
    assignment: extra.assignment || "",
    location: extra.location || "",
    eventDate:
      extra.eventDate ||
      (row.event ? row.event.eventDate.toISOString().slice(0, 10) : ""),
    status: row.participationStatus,
    hours: row.hoursVolunteered ?? 0,
  };
};

async function ensureProfile(volunteerId, name) {
  if (!volunteerId) return "unknown-volunteer";
  const existing = await prisma.userProfile.findUnique({ where: { userId: volunteerId } });
  if (existing) {
    return volunteerId;
  }

  await prisma.userProfile.create({
    data: {
      userId: volunteerId,
      fullName: name || volunteerId,
      address1: "Unknown",
      city: "Unknown",
      state: "NA",
      zipCode: "00000",
      skills: [],
      preferences: "",
      availability: [],
    },
  });

  return volunteerId;
}

async function ensureEvent(extra) {
  if (extra.assignment) {
    const found = await prisma.eventDetails.findFirst({
      where: { eventName: extra.assignment },
    });
    if (found) return found.id;
  }

  const created = await prisma.eventDetails.create({
    data: {
      eventName: extra.assignment || "Untitled Event",
      description: extra.assignment || "Volunteer assignment",
      location: extra.location || "Unknown",
      requiredSkills: [],
      urgency: "Low",
      eventDate: new Date(`${extra.eventDate || "2099-01-01"}T00:00:00.000Z`),
    },
  });
  return created.id;
}

export async function listVolunteerHistory() {
  const rows = await prisma.volunteerHistory.findMany({
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapHistory);
}

export async function addVolunteerHistory(payload) {
  const safe = ensureVolunteerPayload(payload);
  const extra = {
    volunteerName: safe.volunteerName,
    assignment: safe.assignment,
    location: safe.location,
    eventDate: safe.eventDate,
  };
  const userId = await ensureProfile(safe.volunteerId, safe.volunteerName);
  const eventId = await ensureEvent(extra);

  const created = await prisma.volunteerHistory.create({
    data: {
      id: generateId("vol-history"),
      userId,
      eventId,
      participationStatus: safe.status,
      hoursVolunteered: safe.hours,
      feedback: JSON.stringify(extra),
    },
    include: { event: true },
  });

  return mapHistory(created);
}

export async function resetVolunteerHistory(seed = []) {
  await prisma.volunteerHistory.deleteMany({});

  for (const item of seed) {
    const safe = ensureVolunteerPayload(item);
    const extra = {
      volunteerName: safe.volunteerName,
      assignment: safe.assignment,
      location: safe.location,
      eventDate: safe.eventDate,
    };

    const userId = await ensureProfile(safe.volunteerId, safe.volunteerName);
    const eventId = await ensureEvent(extra);

    await prisma.volunteerHistory.create({
      data: {
        id: item?.id || generateId("vol-history"),
        userId,
        eventId,
        participationStatus: PARTICIPATION_STATUSES.includes(safe.status) ? safe.status : "Registered",
        hoursVolunteered: safe.hours,
        feedback: JSON.stringify(extra),
      },
    });
  }
}

export { PARTICIPATION_STATUSES };
