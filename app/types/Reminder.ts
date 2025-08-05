import { Timestamp } from "firebase/firestore"; 


export default interface Reminder {
reminderId: string;
  userId: string;
  conversationId?: string;
  title: string;
  description?: string | null;
  deleted: boolean;
  timeDeleted?: Timestamp;
  completed: boolean;
  completedAt?: Timestamp;
  completeStatus:  
    | "loading" 
    | "completedOnTime" 
    | "completedLate" 
    | "overdue" 
    | "upcoming" 
    | "incomplete";

  createdAt: Timestamp;
  updatedAt: Timestamp;
  updateCount: number;
  dueDate: Timestamp | Date;
  repeatOption?: "none" | "daily" | "weekly" | "hourly" | null;
  category: string;
  reminderEnabled: boolean;
  reminderIntervals?: {
    currentInterval: number;
    countOfIntervals: number;
    intervals: number[];
    hasTriggered: boolean;
  }[] | null;
  expoPushToken?: string;

  isStepBased: boolean; 
  steps?: {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: Timestamp;
    completeStatus: "loading" | "completedOnTime" | "completedLate" | "overdue" | "upcoming" | "incomplete";
    dueDate: Timestamp;
  }[];

  isAI: boolean;

  doses?: { 
    id: string;
    name: string;
    dosage: string;
    times: { time: Timestamp }[];
  }[];
  
}