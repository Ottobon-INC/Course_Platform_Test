export type MyCoursesData = {
  id: number;
  title: string;
  desc: string;
  tag: string;
  progress: number;
  lastAccess: string;
  icon: string;
  btnText: string;
  tagStyle?: string;
  btnStyle?: string;
  btnColor?: string;
};

export const INITIAL_COURSES_DATA: MyCoursesData[] = [
  { id: 1, title: 'JavaScript Deep Dive', desc: 'Advanced patterns and architecture for modern JS apps.', tag: 'Cohort', progress: 75, lastAccess: 'Last accessed 9 hours ago', icon: '/assets/js.png', btnText: 'Resume' },
  { id: 2, title: 'SQL Fundamentals', desc: 'Building robust database foundations for scalable applications.', tag: 'On-demand', progress: 60, lastAccess: 'Last accessed 9 hours ago', icon: '/assets/sql.png', btnText: 'Start' },
  { id: 3, title: 'Intro to HTML/CSS', desc: 'Mastering the basics of web structure and styling.', tag: 'Workshop', progress: 20, lastAccess: 'Last accessed 9 hours ago', icon: '/assets/html5.png', btnText: 'View', btnStyle: 'transparent', btnColor: 'text-orange-primary border-orange-primary' },
  { id: 4, title: 'AI Project Cohort', desc: 'Build AI Chatbot - Full-Stack App with modern technologies.', tag: 'Cohort', progress: 65, lastAccess: 'Last accessed 1 day ago', icon: '/assets/js.png', btnText: 'Resume' },
  { id: 5, title: 'Career Planning Workshop', desc: 'Strategy for landing your dream role in tech.', tag: 'Workshop', progress: 0, lastAccess: 'Not started yet', icon: '/assets/recommended.png', btnText: 'Start' },
  { id: 6, title: 'Data Science FinTech', desc: 'Analyze financial data and build prediction models.', tag: 'Cohort', progress: 45, lastAccess: 'Last accessed 2 days ago', icon: '/assets/python.png', btnText: 'Resume' },
  { id: 7, title: 'UI/UX Masterclass', desc: 'Master modern design principles and user experience research.', tag: 'Workshop', progress: 85, lastAccess: 'Last accessed 3 hours ago', icon: '/assets/uiux.png', btnText: 'View', tagStyle: 'text-[#10B981] bg-[#ECFDF5]', btnStyle: 'transparent', btnColor: 'text-orange-primary border-orange-primary' },
  { id: 8, title: 'Intro to HTML/CSS', desc: 'Semantic web and accessibility best practices.', tag: 'Upcoming', progress: 10, lastAccess: 'Last accessed 9 hours ago', icon: '/assets/html5.png', btnText: 'View', tagStyle: 'text-blue-600 bg-blue-50', btnStyle: 'transparent', btnColor: 'text-orange-primary border-orange-primary' },
];

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
  { id: 1, user: 'David Kim', avatar: '/assets/avatar.png', action: 'Completed "Advanced React" course', timestamp: '2 hours ago' },
  { id: 2, user: 'Sarah Lee', avatar: '/assets/avatar.png', action: 'Earned "Quiz Master" badge', timestamp: '5 hours ago' },
  { id: 3, user: 'Kenjiro Tanaka', avatar: '/assets/avatar.png', action: 'Submitted "Final Project"', timestamp: 'Yesterday' },
  { id: 4, user: 'Mana Kazai', avatar: '/assets/avatar.png', action: 'Started "Data Science" course', timestamp: '2 days ago' },
  { id: 5, user: 'Alex Johnson', avatar: '/assets/avatar.png', action: 'Scored 95% in Weekly Quiz', timestamp: '3 days ago' },
];

export const SETTINGS_NOTIFICATION_LABELS = [
  "Email notifications",
  "Course updates",
  "Assignment reminders",
  "Announcements",
  "Messages"
];
