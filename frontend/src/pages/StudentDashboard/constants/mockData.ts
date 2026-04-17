import avatarImage from '@/assets/avatar.png';

export const ANALYSIS_SCORE_EVOLUTION = [
  { name: 'Jun', score: 20 },
  { name: 'Jul', score: 35 },
  { name: 'Aug', score: 45 },
  { name: 'Sep', score: 60 },
  { name: 'Oct', score: 70 },
  { name: 'Nov', score: 78 },
  { name: 'Dec', score: 85 },
];

export const ANALYSIS_PERFORMANCE = [
  { name: 'C1', score: 45 },
  { name: 'C2', score: 60 },
  { name: 'C3', score: 75 },
  { name: 'D4', score: 50 },
  { name: 'C5', score: 80 },
  { name: 'E6', score: 65 },
];

export const ANALYSIS_SKILL_DATA = [
  { subject: 'Frontend', A: 45, B: 70 },
  { subject: 'Backend', A: 70, B: 45 },
  { subject: 'AI', A: 30, B: 60 },
];

export const FEEDBACK_COURSES = [
  "Advanced JavaScript (Frontend)",
  "Full Stack Web Development",
  "React & Next.js Mastery",
  "UI/UX Design Fundamentals"
];

export const FEEDBACK_HISTORY = [
  { course: "Intro to UX Design", rating: 5, date: "Oct 12, 2025", preview: "Preview: text Learn above nconmandation, text text and skills ovvaciations about thise…" },
  { course: "Intro to UX Design", rating: 5, date: "Oct 12, 2025", preview: "Preview: text Learn above nconmandation, text text and skills ovvaciations about thise…" },
  { course: "Intro to UX Design", rating: 5, date: "Oct 12, 2025", preview: "Preview: text Learn above nconmandation, text text and skills ovvaciations about thise…" }
];

export type LeaderboardRow = {
  rank: string;
  rankClass: string;
  name: string;
  score: string;
  progress: number | null;
  progressText?: string;
  isCurrentUser: boolean;
  opacity: number;
  nameColor: string;
  avatar: string;
  streak: number;
  movement: 'up' | 'down' | 'neutral';
  badges: string[];
};

export type ActivityItemType = {
  id: number;
  user: string;
  avatar: string;
  action: string;
  timestamp: string;
};

export const RECENT_ACTIVITIES: ActivityItemType[] = [
  { id: 1, user: 'David Kim', avatar: avatarImage, action: 'Completed "Advanced React" course', timestamp: '2 hours ago' },
  { id: 2, user: 'Sarah Lee', avatar: avatarImage, action: 'Earned "Quiz Master" badge', timestamp: '5 hours ago' },
  { id: 3, user: 'Kenjiro Tanaka', avatar: avatarImage, action: 'Submitted "Final Project"', timestamp: 'Yesterday' },
  { id: 4, user: 'Mana Kazai', avatar: avatarImage, action: 'Started "Data Science" course', timestamp: '2 days ago' },
  { id: 5, user: 'Alex Johnson', avatar: avatarImage, action: 'Scored 95% in Weekly Quiz', timestamp: '3 days ago' },
];

export const SETTINGS_NOTIFICATION_LABELS = [
  "Email notifications",
  "Course updates",
  "Assignment reminders",
  "Announcements",
  "Messages"
];
