import prisma from "../server/db.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
const DEMO_PASSWORD = "demo123!";
const LOCATION_DOWNTOWN = "Downtown Houston, TX";
const LOCATION_UPTOWN = "Uptown Houston, TX";

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
  { stateCode: "WY", stateName: "Wyoming" }
];

async function seedStates() {
  for (const s of usStates) {
    await prisma.states.upsert({
      where: { stateCode: s.stateCode },
      update: {},
      create: s
    });
  }
}

const availableSkills = [
  "Event Planning",
  "Fundraising",
  "Marketing & Social Media",
  "Graphic Design",
  "Photography",
  "Videography",
  "Writing & Content Creation",
  "Public Speaking",
  "Teaching & Tutoring",
  "Mentoring",
  "Administrative Support",
  "Data Entry",
  "Customer Service",
  "Community Outreach",
  "Food Service",
  "Cooking",
  "Childcare",
  "Elder Care",
  "Pet Care",
  "Construction & Repair",
  "Gardening & Landscaping",
  "Environmental Conservation",
  "Medical & Healthcare",
  "First Aid & CPR",
  "Translation & Interpretation",
  "IT & Tech Support",
  "Web Development",
  "Legal Assistance",
  "Accounting & Finance",
  "Sports & Fitness Coaching"
];

function pickSkills(indexes) {
  return indexes.map(i => availableSkills[i]).filter(Boolean);
}

function dateStr(offset) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-US");
}

function dateObj(offset) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

const demoVolunteers = [
  {
    email: "alice.volunteer@example.com",
    fullName: "Alice Johnson",
    zipCode: "77001",
    location: LOCATION_DOWNTOWN,
    skills: pickSkills([0, 2, 6]),
    preferences: "Prefers outdoor events and community engagement.",
    availability: [dateStr(1), dateStr(4), dateStr(10)]
  },
  {
    email: "bob.volunteer@example.com",
    fullName: "Bob Smith",
    zipCode: "77002",
    location: LOCATION_DOWNTOWN,
    skills: pickSkills([14, 15, 12]),
    preferences: "Enjoys working at food drives and serving meals.",
    availability: [dateStr(2), dateStr(7), dateStr(14)]
  },
  {
    email: "carol.volunteer@example.com",
    fullName: "Carol Davis",
    zipCode: "77003",
    location: LOCATION_UPTOWN,
    skills: pickSkills([11, 26, 25]),
    preferences: "Comfortable with tech-heavy and admin tasks.",
    availability: [dateStr(3), dateStr(6)]
  }
];

const demoOrganizers = [
  {
    email: "olivia.organizer@example.com",
    fullName: "Olivia Martinez",
    zipCode: "77004",
    location: LOCATION_DOWNTOWN,
    skills: pickSkills([0, 13, 2]),
    preferences: "Leads community campaigns and large events.",
    availability: [dateStr(1), dateStr(2), dateStr(3), dateStr(4), dateStr(5)]
  },
  {
    email: "oscar.organizer@example.com",
    fullName: "Oscar Lee",
    zipCode: "77005",
    location: LOCATION_UPTOWN,
    skills: pickSkills([1, 13, 28]),
    preferences: "Focuses on fundraising and sponsor relationships.",
    availability: [dateStr(5), dateStr(10), dateStr(15)]
  }
];

const demoEvents = [
  {
    id: "event-park-cleanup",
    eventName: "Community Park Cleanup",
    description: "Park maintenance and cleanup.",
    location: LOCATION_DOWNTOWN,
    requiredSkills: pickSkills([20, 21, 13]),
    urgency: "High",
    eventDate: dateObj(3)
  },
  {
    id: "event-food-drive",
    eventName: "Weekend Food Drive",
    description: "Food sorting and distribution.",
    location: LOCATION_DOWNTOWN,
    requiredSkills: pickSkills([14, 15, 12]),
    urgency: "Medium",
    eventDate: dateObj(7)
  },
  {
    id: "event-tech-clinic",
    eventName: "Neighborhood Tech Help Clinic",
    description: "Basic tech support for residents.",
    location: LOCATION_UPTOWN,
    requiredSkills: pickSkills([25, 26, 11]),
    urgency: "Low",
    eventDate: dateObj(10)
  }
];

async function seedDemo() {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  for (const v of demoVolunteers) {
    await prisma.$transaction(async tx => {
      await tx.userCredentials.upsert({
        where: { userId: v.email },
        update: { password: hashedPassword },
        create: {
          userId: v.email,
          password: hashedPassword
        }
      });

      const profileData = {
        userId: v.email,
        role: "Volunteer",
        fullName: v.fullName,
        address1: v.location,
        address2: null,
        city: v.location,
        state: "TX",
        zipCode: v.zipCode,
        skills: v.skills,
        preferences: v.preferences,
        availability: v.availability
      };

      await tx.userProfile.upsert({
        where: { userId: v.email },
        update: profileData,
        create: profileData
      });
    });
  }

  for (const o of demoOrganizers) {
    await prisma.$transaction(async tx => {
      await tx.userCredentials.upsert({
        where: { userId: o.email },
        update: { password: hashedPassword },
        create: {
          userId: o.email,
          password: hashedPassword
        }
      });

      const profileData = {
        userId: o.email,
        role: "Organizer",
        fullName: o.fullName,
        address1: o.location,
        address2: null,
        city: o.location,
        state: "TX",
        zipCode: o.zipCode,
        skills: o.skills,
        preferences: o.preferences,
        availability: o.availability
      };

      await tx.userProfile.upsert({
        where: { userId: o.email },
        update: profileData,
        create: profileData
      });
    });
  }

  const primaryVolunteerEmail = demoVolunteers[0].email;

  for (const e of demoEvents) {
    await prisma.eventDetails.upsert({
      where: { id: e.id },
      update: {
        eventName: e.eventName,
        description: e.description,
        location: e.location,
        requiredSkills: e.requiredSkills,
        urgency: e.urgency,
        eventDate: e.eventDate
      },
      create: {
        id: e.id,
        eventName: e.eventName,
        description: e.description,
        location: e.location,
        requiredSkills: e.requiredSkills,
        urgency: e.urgency,
        eventDate: e.eventDate
      }
    });

    await prisma.assignment.create({
      data: {
        volunteerId: primaryVolunteerEmail,
        eventId: e.id,
        createdAtMs: Math.floor(Date.now() / 1000)
      }
    });

    await prisma.volunteerHistory.create({
      data: {
        userId: primaryVolunteerEmail,
        eventId: e.id,
        participationStatus: "Completed",
        hoursVolunteered: 2,
        feedback: "Great engagement."
      }
    });

    await prisma.notice.create({
      data: {
        volunteerId: primaryVolunteerEmail,
        title: "Event Assigned",
        body: `You have been assigned to ${e.eventName}.`,
        type: "info",
        createdAtMs: Math.floor(Date.now() / 1000)
      }
    });
  }
}

async function main() {
  try {
    await clearDatabase();
    await seedStates();
    await seedDemo();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
