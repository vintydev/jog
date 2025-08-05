import { UserStats } from "@/app/types/UserStats";
import { Timestamp } from "firebase/firestore";

export function getLatestSymptomInsights(userStats: UserStats | null) {
  if (!userStats?.symptomStats?.dailyLogs) return null;

  const logsArray = Object.values(userStats.symptomStats.dailyLogs)
    .filter(log => !!log?.submittedAt)
    .sort((a, b) => {
      const dateA = (a.submittedAt as Timestamp)?.toDate?.() ?? new Date(0);
      const dateB = (b.submittedAt as Timestamp)?.toDate?.() ?? new Date(0);
      return dateB.getTime() - dateA.getTime(); // newest first
    });

  const latest = logsArray[0];
  const previous = logsArray[1];

  const formatDate = (ts?: Timestamp) =>
    ts?.toDate?.().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }) ?? null;

  return {
    advice: latest?.advice || "",
    summary: latest?.summary || "",
    date: formatDate(latest?.submittedAt as Timestamp),
    latestCheckInDate: formatDate(latest?.submittedAt as Timestamp),
    previousCheckInDate: formatDate(previous?.submittedAt as Timestamp),
  };
}