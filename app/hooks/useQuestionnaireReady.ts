import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import useUserStats from "./useUserStats";

export default function useQuestionnaireReady() {
  const { userStats } = useUserStats();
  const [questionnaireIsReady, setQuestionnaireIsReady] = useState(false);
  const [formattedTime, setFormattedTime] = useState("");
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (!userStats) return;

    const questionnaireTimestamp = userStats.symptomStats?.questionnaireTime;

    const questionnaireSet =
      userStats.symptomStats?.questionnaireTimeSet &&
      questionnaireTimestamp instanceof Timestamp;

    const now = new Date();
    const questionnaireDate = questionnaireSet ? questionnaireTimestamp.toDate() : null;

    let isTimeReached = false;

    if (questionnaireDate) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const questionnaireMinutes = questionnaireDate.getHours() * 60 + questionnaireDate.getMinutes();
      isTimeReached = nowMinutes >= questionnaireMinutes;
    }

    setFormattedTime(
      questionnaireDate ? questionnaireDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
        : ""
    );

    const todayKey = new Date().toLocaleDateString();
    const completed = userStats.symptomStats?.dailyLogs?.[todayKey]?.completed === true;
    setAlreadyCompleted(completed);

    console.log("Questionnaire Set:", questionnaireSet);
    console.log("Questionnaire Date:", questionnaireDate);
    console.log("Is Time Reached:", isTimeReached);
    console.log("Already Completed:", completed);
    console.log("Questionnaire Is Ready:", !!(isTimeReached && questionnaireSet && !completed));

    setQuestionnaireIsReady(!!(isTimeReached && questionnaireSet && !completed));

    setLoading(false);
  }, [userStats]);

  return {
    questionnaireIsReady,
    formattedTime,
    alreadyCompleted,
    loading,
  };
}