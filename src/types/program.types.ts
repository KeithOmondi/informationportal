// types/program.types.ts

export interface Activity {
  _id?: string;
  time: string;
  activity: string;
  facilitator?: string;
}

export interface DaySchedule {
  _id?: string;
  day: string; // e.g., "ONE", "TWO"
  date: string | Date;
  session_chairs?: string[];
  activities: Activity[];
}

export interface ProgramData {
  _id: string;
  event_title: string;
  schedule: DaySchedule[]; // <--- This was likely missing or named differently
  programFileUrl?: string;  // For the PDF download button
  isLocked?: boolean;       // For the lock screen logic
  scheduledRelease?: string; // For the countdown timer
  updatedAt?: string;
}