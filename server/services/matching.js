const jaccard = (a, b) => {
  const A = new Set(a), B = new Set(b);
  const inter = [...A].filter(x => B.has(x)).length;
  const union = new Set([...A, ...B]).size || 1;
  return inter / union;
};

export function score(vol, ev) {
  const sSkills = jaccard(vol.skills, ev.requiredSkills);
  const sLoc = vol.location === ev.location ? 1 : 0;
  const days = (new Date(ev.date).getTime() - Date.now()) / 86400000;
  const sTime = Number((days < 0 ? 0 : days <= 1 ? 1 : days <= 7 ? 0.8 : 0.5).toFixed(3));
  let wUrg = ev.urgency === "High" ? 1 : ev.urgency === "Medium" ? 0.6 : 0.3;
  if (sSkills === 0 && sLoc === 0){ wUrg = 0};
  return +(0.6*sSkills + 0.2*sLoc + 0.2*sTime*wUrg).toFixed(4);
}
