import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
} from "react-native";
import { useAuthContext } from "@/app/contexts/AuthContext";
import CustomButton from "@/app/components/CustomButton";
import SelectableButton from "@/app/components/SelectableButton";
import UserService from "@/app/services/UserService";

const FeedbackScreen: React.FC = () => {
  const [feedbackType, setFeedbackType] = useState<"feature" | "bug">("feature");
  const [feedbackText, setFeedbackText] = useState("");
  const { user } = useAuthContext();

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      Alert.alert("Missing Feedback", "Please enter your feedback before submitting.");
      return;
    }

    await UserService.sendFeedback(user?.uid as string, feedbackType, feedbackText);

    Alert.alert("Thank you!", "Your feedback has been submitted.");
    setFeedbackText("");
    setFeedbackType("feature");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          className="bg-gray-100 px-4 pt-10"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-1 justify-between"
        >
          <View className="mb-6">
            <Text className="text-3xl font-sf-pro-display-bold text-center text-black mb-4">
              Send us your thoughts
            </Text>
            <Text className="text-base text-center text-gray-600 mb-6">
              Select a category and let us know what you think!
            </Text>

            <View className="mb-6">
              <Text className="font-semibold text-base mb-2 text-gray-800">Feedback Type</Text>
              <View className="space-y-2">
                <SelectableButton
                  label="Feature Suggestion"
                  isSelected={feedbackType === "feature"}
                  onPress={() => setFeedbackType("feature")}
                  selectedColor="#D1FAE5"
                  unselectedColor="#E5E5E5"
                  checkmarkColor="#EB5A10"
                  selectedBorderColour="#EB5A10"
                  unselectedBorderColour="#E5E5E5"
                />
                <SelectableButton
                  label="Bug Report"
                  isSelected={feedbackType === "bug"}
                  onPress={() => setFeedbackType("bug")}
                  selectedColor="#FECACA"
                  unselectedColor="#E5E5E5"
                  checkmarkColor="#B91C1C"
                  selectedBorderColour="#B91C1C"
                  unselectedBorderColour="#E5E5E5"
                />
              </View>
            </View>

            <View className="mb-6 p-4 rounded-2xl shadow bg-white">
              <Text className="font-semibold text-base mb-2 text-gray-800">Your Feedback</Text>
              <TextInput
                className="border border-gray-300 rounded-xl p-3 text-base bg-white"
                placeholder={`Describe your ${feedbackType === "feature" ? "feature suggestion" : "bug report. Please be descriptive (what screen, what feature, what happened before triggering the bug) etc"}...`}
                multiline
                value={feedbackText}
                onChangeText={setFeedbackText}
                style={{ minHeight: 120 }}
                maxLength={750}
              />
            </View>
          </View>

          <View className="absolute bottom-8 left-0 right-0 items-center justify-center">
            <CustomButton
              text="Submit Feedback"
              onPress={handleSubmit}
              isLoading={false}
              type="primary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default FeedbackScreen;