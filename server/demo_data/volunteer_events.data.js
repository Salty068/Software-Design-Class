// @ts-check
/** @typedef {import("../models.js").Volunteer} Volunteer */
/** @typedef {import("../models.js").EventItem} EventItem */

/** @type {Volunteer[]} */
export const demoVols = [
  { id:"v1", name:"Yusuf Y", location:"UH", skills:["Tutoring","Computer Science","Math"] },
  { id:"v2", name:"Sir Isaac Newton", location:"Midtown", skills:["Cooking","Driving","Logistics","Baby Care"] },
  { id:"v3", name:"Einstein Awesome", location:"Downtown", skills:["Childcare","Teaching","CPR"] },
];

/** @type {EventItem[]} */
export const demoEvents = [
  { id:"e1", name:"Food Bank Shift", location:"Midtown", requiredSkills:["Cooking"], date:"2025-10-12", urgency:"Medium" },
  { id:"e2", name:"After-School Tutor", location:"UH", requiredSkills:["Tutoring","Computer Science"], date:"2025-10-14", urgency:"Low" },
  { id:"e3", name:"Marathon First-Aid", location:"Downtown", requiredSkills:["First Aid","CPR"], date:"2025-10-20", urgency:"High" },
  { id:"e4", name:"Warehouse Logistics", location:"Downtown", requiredSkills:["Logistics"], date:"2025-10-09", urgency:"Medium" },
];
