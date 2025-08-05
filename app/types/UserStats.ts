import { FieldValue, Timestamp } from "@google-cloud/firestore";
import Reminder from "./Reminder";
import { Conversation } from "./Conversation";
import { User } from "firebase/auth";

export interface UserStats {
    userId: string | null;
    userStatsId: string | null;
    user: User | null;
    isFromGoogle: boolean;
    deviceType: string | null;
    deviceName: string | null;
    deviceOS: string | null;
    deviceModel: string | null;
    buildJoined: string | null;

    deletedConversationCount: FieldValue | number | null;
    focusModeCount: FieldValue | number | null;

    jogStats: {
        totalJogsCreated: FieldValue | number | null;
        totalStepBasedJogsCreated: FieldValue | number | null;
        totalAIJogsCreated: FieldValue | number | null;
        jogCompletionRate: {
            completedOnTimeTotal: FieldValue | number;
            completedLateTotal: FieldValue | number;
            missedJogsTotal: FieldValue | number;
            totalJogsCompleted: FieldValue | number;
        };
        jogCategories: Record<string, FieldValue | number>;
        bestStreak: FieldValue | number;
        currentStreak: FieldValue | number;
        deletedJogCount: FieldValue | number | null;

        dailyJogStats: {
            [date: string]: {
                totalJogsCreated: FieldValue | number | null;
                totalStepBasedJogsCreated: FieldValue | number | null;
                totalAIJogsCreated: FieldValue | number | null;
                jogCompletionRate: {
                    completedOnTimeTotal: FieldValue | number;
                    completedLateTotal: FieldValue | number;
                    missedJogsTotal: FieldValue | number;
                    totalJogsCompleted: FieldValue | number;
                };
                jogCategories: Record<string, FieldValue | number>;
                deletedJogCount: FieldValue | number | null;
            };
        };
    };

    aiChatStats: {
        totalConversations: FieldValue | number;
        totalMessagesSent: FieldValue | number;
        totalMessagesReceived: FieldValue | number;
        avgResponseTime: number; // in minutes
        avgMessagesPerConversation: number;
        avgTimeToCreateAJog: number; // in minutes
        deletedConversationCount: FieldValue | number | null;
    };

    appUsageStats: {
        totalLogins: FieldValue | number;
        totalTimeSpent:  number; 
        totalSessions: FieldValue | number;
        avgTimeSpent: number;
        avgTimeSpentPerSession: number;
        mostActiveTimeOfDay: string;
        mostActiveDayOfWeek: string;
        notificationInteractionRate: {
            [type: string]: {
            acknowledged: number | FieldValue;
            ignored: number | FieldValue;
            total: number | FieldValue;
        }};
        totalNotificationsSent: number | FieldValue;
        totalNotificationsAcknowledged: number | FieldValue;
    };

    symptomStats: {
        questionnaireTime?: Timestamp | null;
        questionnaireTimeSet?: boolean;
        questionnaireReady?: boolean;
        lastQuestionnaireCompleted?: Timestamp | null;  

        initialMemorySeverity?: number | null;
        initialConcentrationSeverity?: number | null;
        initialMoodSeverity?: number | null;

        lastLoggedMemorySeverity?: number | null;
        lastLoggedConcentrationSeverity?: number | null;
        lastLoggedMoodSeverity?: number | null;

        dailyLogs?: {
            [date: string]: {
                symptomSeverity: {
                    memory: number | null;
                    concentration: number | null;
                    mood: number | null;
                };
                summary: string | null;
                advice: string | null;
                submittedAt: Timestamp | null;
                completed: boolean;
                isAI: boolean;
                reminders: Reminder[] | null;
                conversations: Conversation[] | null;
                buildNumber: string | null;
            };
        };
    };

    lastUpdated: Timestamp | null;
    createdAt: Timestamp | null;
}