import prisma from "../server/db.js";
import bcrypt from "bcrypt";
import { demoVols, demoEvents } from "../server/demo_data/volunteer_events.data.js";

const SALT_ROUNDS = 10;

async function clearDatabase() {
  await prisma.notice.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.volunteerHistory.deleteMany();
  await prisma.eventDetails.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.userCredentials.deleteMany();
  await prisma.states.deleteMany();
}

const usStates = [
  { stateCode: "AL", stateName: "Alabama" },
  { stateCode: "AK", stateName: "Alaska" },
  { stateCode: "AZ", stateName: "Arizona" },
  { stateCode: "AR", stateName: "Arkansas" },
  { stateCode: "CA", stateName: "California" },
  { stateCode: "CO", stateName: "Colorado" },
  { stateCode: "CT", stateName: "Connecticut" },
  { stateCode: "DE", stateName: "Delaware" },
  { stateCode: "FL", stateName: "Florida" },
  { stateCode: "GA", stateName: "Georgia" },
  { stateCode: "HI", stateName: "Hawaii" },
  { stateCode: "ID", stateName: "Idaho" },
  { stateCode: "IL", stateName: "Illinois" },
  { stateCode: "IN", stateName: "Indiana" },
  { stateCode: "IA", stateName: "Iowa" },
  { stateCode: "KS", stateName: "Kansas" },
  { stateCode: "KY", stateName: "Kentucky" },
  { stateCode: "LA", stateName: "Louisiana" },
  { stateCode: "ME", stateName: "Maine" },
  { stateCode: "MD", stateName: "Maryland" },
  { stateCode: "MA", stateName: "Massachusetts" },
  { stateCode: "MI", stateName: "Michigan" },
  { stateCode: "MN", stateName: "Minnesota" },
  { stateCode: "MS", stateName: "Mississippi" },
  { stateCode: "MO", stateName: "Missouri" },
  { stateCode: "MT", stateName: "Montana" },
  { stateCode: "NE", stateName: "Nebraska" },
  { stateCode: "NV", stateName: "Nevada" },
  { stateCode: "NH", stateName: "New Hampshire" },
  { stateCode: "NJ", stateName: "New Jersey" },
  { stateCode: "NM", stateName: "New Mexico" },
  { stateCode: "NY", stateName: "New York" },
  { stateCode: "NC", stateName: "North Carolina" },
  { stateCode: "ND", stateName: "North Dakota" },
  { stateCode: "OH", stateName: "Ohio" },
  { stateCode: "OK", stateName: "Oklahoma" },
  { stateCode: "OR", stateName: "Oregon" },
  { stateCode: "PA", stateName: "Pennsylvania" },
  { stateCode: "RI", stateName: "Rhode Island" },
  { stateCode: "SC", stateName: "South Carolina" },
  { stateCode: "SD", stateName: "South Dakota" },
  { stateCode: "TN", stateName: "Tennessee" },
  { stateCode: "TX", stateName: "Texas" },
  { stateCode: "UT", stateName: "Utah" },
  { stateCode: "VT", stateName: "Vermont" },
  { stateCode: "VA", stateName: "Virginia" },
  { stateCode: "WA", stateName: "Washington" },
  { stateCode: "WV", stateName: "West Virginia" },
  { stateCode: "WI", stateName: "Wisconsin" },
  { stateCode: "WY", stateName: "Wyoming" },
];

async function seedStates() {
  for (const s of usStates) {
    await prisma.states.upsert({
      where: { stateCode: s.stateCode },
      update: {},
      create: s,
    });
  }
}

async function seedDemo() {
  console.log("Seeding demo volunteers and events...");

  for (const v of demoVols) {
    await prisma.$transaction(async (tx) => {
      await tx.userCredentials.upsert({
        where: { userId: v.id },
        update: {},
        create: {
          userId: v.id,
          password: await bcrypt.hash("demo123!", SALT_ROUNDS),
        },
      });

      await tx.userProfile.upsert({
        where: { userId: v.id },
        update: {
          fullName: v.name,
          role: v.role || "Volunteer",
          address1: v.location,
          city: v.location,
          state: "TX",
          zipCode: "77001",
          skills: v.skills ?? [],
          preferences: null,
          availability: v.availability ?? [],
        },
        create: {
          userId: v.id,
          fullName: v.name,
          role: v.role || "Volunteer",
          address1: v.location,
          city: v.location,
          state: "TX",
          zipCode: "77001",
          skills: v.skills ?? [],
          preferences: null,
          availability: v.availability ?? [],
        },
      });
    });
  }

  for (const e of demoEvents) {
    await prisma.eventDetails.upsert({
      where: { id: e.id },
      update: {
        eventName: e.name,
        description: e.description ?? e.name,
        location: e.location,
        requiredSkills: e.requiredSkills ?? [],
        urgency: e.urgency ?? "Medium",
        eventDate: new Date(e.date),
      },
      create: {
        id: e.id,
        eventName: e.name,
        description: e.description ?? e.name,
        location: e.location,
        requiredSkills: e.requiredSkills ?? [],
        urgency: e.urgency ?? "Medium",
        eventDate: new Date(e.date),
      },
    });

    await prisma.assignment.create({
      data: {
        volunteerId: demoVols[0].id,
        eventId: e.id,
        createdAtMs: Date.now(),
      },
    });

    await prisma.volunteerHistory.create({
      data: {
        userId: demoVols[0].id,
        eventId: e.id,
        participationStatus: "Completed",
        hoursVolunteered: 2,
        feedback: "Good turnout.",
      },
    });

    await prisma.notice.create({
      data: {
        volunteerId: demoVols[0].id,
        title: "Event Assigned",
        body: `You have been assigned to ${e.name}.`,
        type: "info",
        createdAtMs: Date.now(),
      },
    });
  }

  console.log("Demo volunteers, events, assignments & history seeded.");
}

async function main() {
  try {
    console.log("Clearing database...");
    await clearDatabase();
    console.log("Seeding states...");
    await seedStates();
    console.log("Seeding demo data...");
    await seedDemo();
    console.log("Done.");
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
