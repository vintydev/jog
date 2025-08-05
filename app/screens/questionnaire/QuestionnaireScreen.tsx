import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TextInput, Switch, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from "react-native";
import { Timestamp } from "firebase/firestore";
import Reminder from "@/app/types/Reminder";
import { UserStats } from "@/app/types/UserStats";
import CustomButton from "@/app/components/CustomButton";
import SelectableButton from "@/app/components/SelectableButton";
import QuestionStep from "@/app/types/QuestionStep";
import OpenAIService from "@/app/services/OpenAIService/OpenAIService";
import useReminders from "@/app/hooks/useReminders";
import useUserStats from "@/app/hooks/useUserStats";
import { ActivityIndicator } from "react-native";
import UserStatsService from "@/app/services/UserStatsService";
import { QuestionnaireScreenProps, RootStackParamList } from "@/app/types/Navigator";
import InfoPopup from "@/app/components/InfoPopup";
import Images from "@/app/constants/Images";
import { useConversation } from "@/app/contexts/ConversationContext";
import Constants from "expo-constants";

const QuestionnaireScreen: React.FC<QuestionnaireScreenProps<"QuestionnaireTest">> = ({ navigation }) => {
  const today = Timestamp.now();
  const [loading, setLoading] = useState(false);
  const [aiSteps, setAiSteps] = useState<QuestionStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const todaysReminders: Reminder[] = useReminders({ today }).reminders;
  const { userStats } = useUserStats();
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [hasLoadedAI, setHasLoadedAI] = useState(false);
  const [useAIQuestions, setUseAIQuestions] = useState(false);
  const [normalSteps, setNormalSteps] = useState<QuestionStep[]>([])
  const todaysConversations = useConversation().todaysConversations;
  const buildNumber: string = Platform.OS === "ios"
    ? Constants?.expoConfig?.ios?.buildNumber ?? "unknown"
    : Constants?.expoConfig?.android?.version ?? Constants?.expoConfig?.ios?.buildNumber ?? "unknown";



  useEffect(() => {
    return () => {
      setAiSteps([]);
      setCurrentIndex(-1);
      setAnswers({});
      setHasLoadedAI(false);
    };
  }, []);

  const loadAIFlow = async () => {

    if (!userStats || !todaysReminders || hasLoadedAI) return;

    try {
      setLoading(true);

      // Generate symptom questions
      const steps = await OpenAIService.generateSymptomQuestions(userStats, todaysReminders);
      console.log("AI Steps:", steps);

      // Generate summary and advice
      const text = await OpenAIService.generateDailySummaryAndAdvice(
        todaysReminders,
        answers,
        userStats
      );

      console.log("AI Summary:", text.summary);
      console.log("AI Advice:", text.recommendations);

      const dailySummary: QuestionStep = {
        id: "dailySummary",
        question: text.summary,
        type: "text",
      };

      const dailyAdvice: QuestionStep = {
        id: "advice",
        question: text.recommendations,
        type: "text",
      };

      // Set everything at once
      setAiSteps([dailySummary, ...steps, dailyAdvice]);
      setAiSummary(text.summary);
      setAiAdvice(text.recommendations);
      setHasLoadedAI(true);
    } catch (e) {
      console.error("Failed to load AI questionnaire/summary:", e);
    } finally {
      setLoading(false);
    }
  };




  const steps = useAIQuestions ? aiSteps : normalSteps;
  const currentStep = useMemo(() => steps[currentIndex], [steps, currentIndex]);

  const handleAnswerChange = (text: string) => {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: text }));
  };

  const handleAnswerChangeSlider = (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: value }));
  };

  const handleNext = async () => {
    try {
      console.log("Current Step:", currentStep);
      console.log("Current Index:", currentIndex);
      if (currentIndex < steps.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {

        if (!useAIQuestions)
          setCurrentIndex((prev) => prev + 1);

      }
    } catch (e) {
      console.log(e);
    }
  };

  const scaleOptions = useMemo(() => [
    { label: "Poor", value: 1 },
    { label: "Fine", value: 2 },
    { label: "Moderate", value: 3 },
    { label: "Very good", value: 4 },
    { label: "Extremely good", value: 5 },
  ], []);

  const renderScaleButtons = (selected: number | undefined) =>
    scaleOptions.map(({ label, value }) => (
      <SelectableButton
        key={value}
        label={label}
        isSelected={selected === value}
        onPress={() => handleAnswerChangeSlider(value)}
        selectedColor="#D1FAE5"
        unselectedColor="#E5E5E5"
        checkmarkColor="#EB5A10"
        selectedBorderColour="#EB5A10"
        unselectedBorderColour="#E5E5E5"
        style={{ marginBottom: 12 }}
      />
    ));

  const handleSubmit = async () => {

    if (!userStats) return;
    console.log("All answers:", answers);

    if (!userStats) return;

    const memory = typeof answers["memory"] === "number" ? (answers["memory"] as number) : 0;
    const concentration = typeof answers["concentration"] === "number" ? (answers["concentration"] as number) : 0;
    const mood = typeof answers["mood"] === "number" ? (answers["mood"] as number) : 0;

    const filteredAnswers = Object.fromEntries(
      Object.entries(answers).filter(
        ([key]) => !["dailySummary", "advice"].includes(key)
      )
    );

    const dailyLog = {
      [today.toDate().toLocaleDateString()]: {
        symptomSeverity: {
          concentration,
          memory,
          mood,
        },
        submittedAt: today,
        completed: true,
        reminders: todaysReminders,
        conversations: todaysConversations,
        ...filteredAnswers,
        summary: aiSummary,
        advice: aiAdvice,
        isAI: useAIQuestions,
        buildNumber: buildNumber,
      },
    };

    await UserStatsService.updateStats(userStats.userId as string, {
      symptomStats: {
        ...userStats.symptomStats,
        lastLoggedConcentrationSeverity: concentration,
        lastLoggedMemorySeverity: memory,
        lastLoggedMoodSeverity: mood,
        dailyLogs: {
          ...userStats.symptomStats.dailyLogs,
          ...dailyLog,
        },
      },
    });

    setCurrentIndex(steps.length); // Triggers the congratulations screen
  }


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} >
        <ScrollView className="bg-gray-100 pt-10 px-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-1 justify-between"
        >
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#EB5A10" />
              <Text className="text-lg font-sf-pro text-center text-gray-600 mt-4">
                Creating your end-of-day check-in...
              </Text>
            </View>
          ) : currentIndex === -1 ? (

            // Start Screen
            <View className="bg-gray-100 mb-20 justify-center items-center flex-1">
              <Text className="text-3xl font-sf-pro-display-bold text-center text-black mb-2">
                Your end of day check-in is ready!
              </Text>

              <CustomButton
                text="Begin"
                onPress={() => {
                  if (useAIQuestions) {
                    loadAIFlow()
                      .then(() => setCurrentIndex(0))
                      .catch((error) => console.error("Error loading AI questionnaire:", error));
                  } else {
                    setNormalSteps([
                      { id: "memory", question: "How was your memory today?", type: "scale" },
                      { id: "concentration", question: "How was your concentration today?", type: "scale" },
                      { id: "mood", question: "How was your mood today?", type: "scale" },
                    ]);
                    setCurrentIndex(0);
                  }
                }}
                isLoading={false}
                disabled={false}
                type="primary"
              />

              <View className="flex-row items-center mt-4">
                <Text className="text-lg font-sf-pro-display-bold text-center mr-2">
                  Use AI-Powered Questions?
                </Text>
                <InfoPopup
                  title="AI-Powered Questions"
                  modalTitle="AI-Powered Questions"
                  message="This feature uses AI to generate a personalised experience based on your daily activities and previous symptoms. It may take a moment to load. Continued use of this feature will help improve the AI's understanding of your completion patterns."
                />
              </View>

              <Switch
                value={useAIQuestions}
                onValueChange={() => setUseAIQuestions((prev) => !prev)}
                trackColor={{ false: "#767577", true: "#EB5A10" }}
                thumbColor={useAIQuestions ? "#fff" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                className="mb-4"
                style={{ backgroundImage: Images.starAI }}

              />
            </View>
          ) : useAIQuestions && currentIndex === 0 ? (
            <View className="flex-1">
              <Text className="text-3xl font-sf-pro-display-bold text-center justify-center text-black mb-4">
                Your Day in Jogs
              </Text>
              <ScrollView className={`mb-6 p-4 rounded-2xl shadow-md bg-white`} style={{ maxHeight: steps[0].question.length > 100 ? "60%" : steps[0].question.length > 50 ? "40%" : "20%" }}>
                <Text className={`text-lg text-gray-800`} >{steps[0].question}</Text>
              </ScrollView>
              <View className="flex flex-col justify-center items-center">
                <CustomButton text="Continue" onPress={() => setCurrentIndex(1)} isLoading={false} type="primary" />
              </View>
            </View>
          ) : (!useAIQuestions && currentIndex < steps.length) || (useAIQuestions && currentIndex < steps.length - 1) ? (
            <View className="flex-1">
              <Text className="text-3xl font-sf-pro-display-bold text-center text-black mb-2">
                End of Day Check-In
              </Text>
              <Text className="text-lg font-semibold text-center text-gray-600 mb-4">
                Step {useAIQuestions ? currentIndex : currentIndex + 1} of {steps.length - (useAIQuestions ? 2 : 0)}
              </Text>

              <View className="flex-1 pt-2 px-4">
                <View className="mb-6 p-4 rounded-2xl shadow bg-white">
                  <Text className="font-semibold text-lg mb-2 text-gray-800">{currentStep.question}</Text>
                </View>

                <View key={currentStep.id}>
                  {currentStep.type === "scale" ? (
                    renderScaleButtons(
                      typeof answers[currentStep.id] === "number" ? (answers[currentStep.id] as number) : undefined
                    )
                  ) : (
                    <View className="mb-6 p-4 rounded-2xl shadow bg-white">
                      <TextInput
                        className="border border-gray-300 rounded-xl p-2 text-base bg-white"
                        placeholder="Type your answer here..."
                        multiline
                        value={answers[currentStep.id] !== undefined ? String(answers[currentStep.id]) : ""}
                        onChangeText={handleAnswerChange}
                        style={{ minHeight: 100 }}
                      />
                    </View>
                  )}
                </View>

                <View className="flex flex-col justify-center items-center">

                  {!useAIQuestions && currentIndex === steps.length - 1 ? (
                    <CustomButton
                      text="Finish"
                      onPress={handleSubmit}
                      isLoading={false}
                      type="primary"
                    />
                  ) :

                    <CustomButton
                      text="Next"
                      onPress={handleNext}
                      isLoading={false}
                      disabled={answers[currentStep.id] === undefined}
                      type="primary"
                    />
                  }
                  <CustomButton
                    text="Back"
                    onPress={() => setCurrentIndex((prev) => prev - 1)}
                    isLoading={false}
                    disabled={currentIndex === 0}
                    type="secondary"
                    customStyle={{ marginTop: 12 }}
                  />

                </View>
              </View>
            </View>
          ) : useAIQuestions && currentIndex === steps.length - 1 ? (
            <View className="flex-1">
              <Text className="text-3xl font-sf-pro-display-bold text-center text-black mb-4">
                Advice for Tomorrow
              </Text>
              <ScrollView className="mb-6 p-4 rounded-2xl shadow bg-white max-h-[60%]">
                <Text className="text-lg text-gray-800">{currentStep.question}</Text>
              </ScrollView>

              <View className="justify-center items-center">
                <CustomButton
                  text="Finish"
                  onPress={handleSubmit}
                  isLoading={false}
                  type="primary"
                />
                <CustomButton
                  text="Back"
                  onPress={() => setCurrentIndex((prev) => prev - 1)}
                  isLoading={false}
                  type="secondary"
                  customStyle={{ marginTop: 12 }}
                />
              </View>
            </View>
          ) : currentIndex === steps.length ? (
            <View className="flex-1 justify-center items-center bg-gray-100">
              <Text className="text-3xl font-sf-pro-display-bold text-center text-black mb-4">
                You've completed your check-in!
              </Text>
              <Text className="text-lg text-gray-700 text-center px-6">
                Great job taking time to reflect. Your responses have been saved and you're all set for tomorrow.
              </Text>

              <CustomButton
                text="Back to Home"
                onPress={() => navigation.goBack()}
                isLoading={false}
                type="primary"
                customStyle={{ marginTop: 12 }}
              />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default QuestionnaireScreen;