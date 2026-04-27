import avatarImage from '@/assets/avatar.png';

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

export const ASSIGNMENTS_DATA = [
  {
    id: 1,
    courseName: "Full Stack Web Development",
    courseSlug: "full-stack-web-development",
    title: "Build a Portfolio with React",
    deadline: "Oct 30, 2025",
    status: "Pending",
    type: "Project",
    description: "Create a fully responsive portfolio using React and Tailwind CSS."
  },
  {
    id: 2,
    courseName: "UI/UX Design Mastery",
    courseSlug: "ui-ux-design-mastery",
    title: "High-Fidelity Wireframes",
    deadline: "Oct 25, 2025",
    status: "Under Review",
    type: "Homework",
    description: "Complete the mobile app wireframes for the travel booking app."
  },
  {
    id: 3,
    courseName: "Advanced JavaScript (Frontend)",
    courseSlug: "advanced-javascript",
    title: "Async/Await Quiz",
    deadline: "Oct 20, 2025",
    status: "Approved",
    type: "Quiz",
    description: "Multiple choice questions on asynchronous programming."
  },
  {
    id: 4,
    courseName: "React & Next.js Mastery",
    courseSlug: "react-nextjs-mastery",
    title: "Next.js API Routes",
    deadline: "Nov 05, 2025",
    status: "Pending",
    type: "Project",
    description: "Implement server-side logic using Next.js internal API routing."
  },
  {
    id: 5,
    courseName: "Full Stack Web Development",
    courseSlug: "full-stack-web-development",
    title: "Database Normalization Task",
    deadline: "Oct 18, 2025",
    status: "Submitted",
    type: "Homework",
    description: "Normalize the given schema to 3rd Normal Form."
  }
];

export const SETTINGS_NOTIFICATION_LABELS = [
  "Email notifications",
  "Course updates",
  "Assignment reminders",
  "Announcements",
  "Messages"
];
