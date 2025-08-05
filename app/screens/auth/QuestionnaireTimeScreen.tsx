import React, { useState } from "react";
import {View, Text, StyleSheet, Alert,} from "react-native";
import { AuthStackScreenProps } from "@/app/types/Navigator";
import DatePickerModal from "@/app/components/DatePickerModal";
import CustomButton from "@/app/components/CustomButton";
import AuthLayout from "@/app/components/AuthLayout";
import useAuth from "@/app/hooks/useAuth";
import { Timestamp } from "firebase/firestore";
import InfoPopup from "@/app/components/InfoPopup";
import Constants from "expo-constants";

const QuestionnaireTimeScreen: React.FC<AuthStackScreenProps<"QuestionnaireTime">> = ({ navigation, route }) => {
    const [questionnaireTime, setQuestionnaireTime] = useState<Date | null>(null);
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();
    const { selections } = route.params;

    const handleSave = async () => {
        if (!questionnaireTime) {
            Alert.alert("Missing Time", "Please select a preferred questionnaire time.");
            return;
        }

        setSaving(true);

        try {

            const questionnaireTimestamp = Timestamp.fromDate(questionnaireTime);
      
            // Navigate to the next screen
            navigation.navigate("AuthInfo", {
                selections: {
                    ...selections,
                    questionnaireTime: questionnaireTimestamp,
                },

            });

        } catch (error: any) {
            Alert.alert("Error", error.message || "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AuthLayout>
            <View className="mb-5 flex-row justify-center items-center">
                <Text style={styles.title}>Select your daily check-in time</Text>
                <InfoPopup
                    title="Daily Questionnaire Time"
                    message="Select a time that works best for you. This will be the time you receive your daily check-in to reflect on your symptoms day-to-day, reminded via push notification. You can change this time later in the app settings."
                    modalTitle="Daily Questionnaire Time"
                    icon="information-circle-outline"
                    className="ml-2 mb-6"


                />
            </View>

            <DatePickerModal
                date={questionnaireTime || new Date()}
                setDate={setQuestionnaireTime}
                mode="time"
                title="Select Time"
                confirmText="Set"
                cancelText="Cancel"
                minimumDate={new Date()}
                maximumDate={new Date(new Date().setHours(23, 59))}
            />

            <CustomButton
                text="Save Time and Continue"
                onPress={handleSave}
                isLoading={saving}
                type="secondary"
            />
        </AuthLayout>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
});

export default QuestionnaireTimeScreen;