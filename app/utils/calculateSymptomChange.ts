import { UserStats } from "@/app/types/UserStats";
import { SymptomKey } from "../screens/tasks/ProgressScreen";
import { Timestamp } from "firebase/firestore";

export function calculateSymptomChange(
    symptomKey: SymptomKey,
    userStats: UserStats | null
): number {
    if (!userStats?.symptomStats?.dailyLogs) return 0;

    // Convert logs to array and sanitize
    const logs = Object.values(userStats.symptomStats.dailyLogs)
        .filter(
            (entry) =>
                entry?.submittedAt &&
                entry?.symptomSeverity?.[symptomKey] !== null &&
                entry?.symptomSeverity?.[symptomKey] !== undefined
        )
        .sort((a, b) => {
            const dateA =
                a.submittedAt instanceof Timestamp
                    ? a.submittedAt.toDate()
                    : new Date(a.submittedAt as any);
            const dateB =
                b.submittedAt instanceof Timestamp
                    ? b.submittedAt.toDate()
                    : new Date(b.submittedAt as any);
            return dateB.getTime() - dateA.getTime();  
        });

    if (logs.length === 0) return 0;

    const latest = logs[0].symptomSeverity[symptomKey];

    if (logs.length === 1) {
        const initialKey = `initial${symptomKey.charAt(0).toUpperCase() + symptomKey.slice(1)}Severity` as keyof UserStats["symptomStats"];
        const initial = userStats.symptomStats[initialKey];

        if (initial == null || latest == null) return 0;
        return Number(latest) - Number(initial);
    }

    const previous = logs[1].symptomSeverity[symptomKey];

    if (latest == null || previous == null) return 0;

    return Number(latest) - Number(previous);
}