import { useMemo } from "react";
import { UserStats } from "@/app/types/UserStats";
import QuestionStep from "@/app/types/QuestionStep";
import Reminder from "../types/Reminder";

export const useDailyQuestionnaireSteps = (
  userStats: UserStats | null,
  todaysReminders: Reminder[] | null,
  today: string
): QuestionStep[] => {
  return useMemo(() => {
    const steps: QuestionStep[] = [];

    if (!userStats || !userStats.symptomStats) return steps;
    if (!todaysReminders) return steps;

    const { symptomStats, jogStats } = userStats;

    const capitalise = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

    const getSeverity = (symptom: "concentration" | "memory" | "mood"): number => {
      const lastLogged = symptomStats[`lastLogged${capitalise(symptom)}Severity` as keyof typeof symptomStats];
      const initial = symptomStats[`initial${capitalise(symptom)}Severity` as keyof typeof symptomStats];
      return (lastLogged ?? initial ?? 0) as number;
    };

    const shouldAsk = (symptom: "concentration" | "memory" | "mood") => {
      const severity = getSeverity(symptom);
      return severity >= 0  
    };

    // Symptom-related questions
    if (shouldAsk("concentration")) {
      steps.push({
        id: "concentration",
        question: "How would you rate your focus today?",
        type: "scale",

      });
    }

    if (shouldAsk("memory")) {
      steps.push({
        id: "memory",
        question: "How would you rate your memory today?",
        type: "scale",
    
      });
    }

    if (shouldAsk("mood")) {
      steps.push({
        id: "mood",
        question: "How would you rate your mood today?",
        type: "scale",
      });
    }

  
    // Reminder-specific questions
    todaysReminders.forEach((reminder) => {
      if (
        reminder.completeStatus === "incomplete" ||
        reminder.completeStatus === "overdue"
      ) {
        steps.push({
          id: `why-${reminder.reminderId}`,
          question: `You didn't complete "${reminder.title}" that was due at ${
            (reminder.dueDate instanceof Date ? reminder.dueDate : reminder.dueDate.toDate()).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "numeric",
            })
          } — do you remember why?`,
          type: "text",
          subtitle: "If you don't remember, just enter 'I don't know' or something similar.",
        });
      }

      if (reminder.completed && reminder.completedAt) {
        steps.push({
          id: `after-${reminder.reminderId}`,
          question: `How did you feel after completing "${reminder.title}"?`,
          type: "text",
        });
      }
    });

    // Final reflection
    steps.push({
      id: "reflection",
      question: "Anything else you'd like to reflect on today?",
      type: "text",
    });

    // Fallback check-in if no data-driven questions exist
    if (steps.length === 0) {
      steps.push({
        id: "basicCheckIn",
        question: "How did your day go?",
        type: "text",
      });
    }

    return steps;
  }, [userStats, todaysReminders, today]);
};