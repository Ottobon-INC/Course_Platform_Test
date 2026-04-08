// @ts-nocheck
export var KEY = "careerProfile";
export function saveProfile(data) {
  const existing = getProfile();
  localStorage.setItem(KEY, JSON.stringify({ ...existing, ...data }));
}
function getProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
  }
  return {
    firstName: "there",
    fullName: "",
    targetRole: "Full Stack Developer",
    skills: [],
    courseIntent: ""
  };
}
var DRAFT_KEY = "profileDraft";
export function saveProfileDraft(draft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}
export function getProfileDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
  }
  return null;
}
