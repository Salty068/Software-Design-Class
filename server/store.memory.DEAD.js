import { randomUUID } from "crypto";
/**
 * @typedef {import("./models.js").Volunteer} Volunteer
 * @typedef {import("./models.js").EventItem} EventItem
 * @typedef {import("./models.js").Assignment} Assignment
 * @typedef {import("./models.js").Notice} Notice
 * @typedef {import("./models.js").Profile} Profile
 */
/** @type {Volunteer[]} */ const volunteers = [];
/** @type {EventItem[]} */ const events = [];
/** @type {Assignment[]} */ const assignments = [];
/** @type {Notice[]} */ const notices = [];
/** @type {Map<string, Profile>} */ const profiles = new Map();

export const store = {
  upsertVolunteers(list) {
    list.forEach(v => {
      const i = volunteers.findIndex(x => x.id === v.id);
      i >= 0 ? (volunteers[i] = v) : volunteers.push(v);
    });
  },
  upsertEvents(list) {
    list.forEach(e => {
      const i = events.findIndex(x => x.id === e.id);
      i >= 0 ? (events[i] = e) : events.push(e);
    });
  },
  getVolunteer: id => volunteers.find(v => v.id === id) || null,
  getEvent: id => events.find(e => e.id === id) || null,
  listVolunteers: () => [...volunteers],
  listEvents: () => [...events],
  addAssignment(volunteerId, eventId) {
    const a = { id: randomUUID(), volunteerId, eventId, createdAt: Date.now() };
    assignments.push(a); return a;
  },
  listAssignmentsByVolunteer: id => assignments.filter(a => a.volunteerId === id),

  removeVolunteer(id) {
    const index = volunteers.findIndex(v => v.id === id);
    if (index >= 0) {
      volunteers.splice(index, 1);
    }
  },

  addNotice(volunteerId, p) {
    const n = { id: randomUUID(), volunteerId, createdAt: Date.now(), type: "info", ...p };
    notices.push(n); return n;
  },
  listNotices: id => notices.filter(n => n.volunteerId === id),
  clearNotices(id) {
    for (let i = notices.length - 1; i >= 0; i--) if (notices[i].volunteerId === id) notices.splice(i,1);
  },

  saveProfile(profile) {
    profiles.set(profile.userId, profile);
    return profile;
  },

  getProfile: id => profiles.get(id) || null,

  listProfiles: () => Array.from(profiles.values()),

  deleteProfile(id) {
    const existed = profiles.delete(id);
    return existed;
  },

  clearProfiles() {
    profiles.clear();
  },
};
