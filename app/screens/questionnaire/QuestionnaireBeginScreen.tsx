
import React, { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { QuestionnaireScreenProps, QuestionnaireStackParamList } from "../../types/Navigator";
import useAuth from "@/app/hooks/useAuth";
import CustomButton from "../../components/CustomButton";
import QuestionnaireLayout from "../../components/QuestionnaireLayout";
import useUserStats from "@/app/hooks/useUserStats";
import QuestionComponent from "@/app/components/QuestionComponent";
import { useDailyQuestionnaireSteps } from "@/app/hooks/useQuestionnaireSteps";
import useReminders from "@/app/hooks/useReminders";
import Reminder from "@/app/types/Reminder";

const QuestionnaireScreen: React.FC<QuestionnaireScreenProps<"Questionnaire">> = ({ navigation }) => {

  const { user, userData } = useAuth();
  const {reminders} = useReminders();
  const { userStats, todaysLog } = useUserStats();
  const [loading, setLoading] = useState(false);
  const [questionnaireStep, setQuestionnaireStep] = useState(0);
  const today = new Date().toLocaleDateString();
  const [answers, setAnswers] = useState({});

  // get todays reminders only
  
  const todaysReminders: Reminder[] = useMemo(() => {
    if (!reminders || !Array.isArray(reminders)) return [];
  
    return reminders.filter((reminder: Reminder) => {
      const dueDate = reminder.dueDate instanceof Date
        ? reminder.dueDate
        : reminder.dueDate.toDate();
      return dueDate.toLocaleDateString() === today;
    });
  }, [reminders, today]);
  
  
  // Get dynamic steps
  const dynamicSteps = useDailyQuestionnaireSteps(userStats, todaysReminders, today);

  // Get current step from index
  const currentStep = dynamicSteps[questionnaireStep];
 
  return (
    <QuestionnaireLayout>
      <QuestionComponent
        question={currentStep.question || ""}
        type={currentStep.type}
        subtitle={currentStep.subtitle}
        onNext={(answer) => {
          setQuestionnaireStep((prev) => prev + 1),
          setAnswers((prev: any) => ({ ...prev, [currentStep.id]: answer }));
        }
      }
      />
    </QuestionnaireLayout>
  );

}

export default QuestionnaireScreen;

