import React from "react";
import { View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CustomButton from "./CustomButton";
import useQuestionnaireReady from "@/app/hooks/useQuestionnaireReady";
import { ActivityIndicator } from "react-native";
import InfoPopup from "./InfoPopup";

const QuestionnaireCard = () => {
    const navigation = useNavigation();
    const { questionnaireIsReady, formattedTime, alreadyCompleted, loading } = useQuestionnaireReady();

    return (
        <View className="bg-white p-5 rounded-2xl shadow-md w-[90%] mx-auto">
            {loading ? (
                <ActivityIndicator size="large" color="#EB5A10" />
            ) : (
                <>
                    <View className="flex-row items-center mb-2">
                        <Text className="text-[20px] font-sf-pro-display-bold">
                            End of Day Check-in
                        </Text>
                        <InfoPopup
                            title="End of Day Check-in"
                            message="This is a daily check-in to help you reflect on your day and track your progress. You can set your preferred time in settings. You will be notified via push notification when it's ready."
                            icon="information-circle-outline"
                            className="ml-2"
                            modalTitle="End of Day Check-in Info"
                        />
                    </View>


                    {!formattedTime ? (
                        <Text className="text-[15px] font-sf-pro text-black m-2">
                            You haven't set your preferred end of day check-in time yet. Please set it in settings.
                        </Text>
                    ) : alreadyCompleted ? (
                        <Text className="text-[13px] font-sf-pro text-black m-2">
                            Thank you for completing today's check-in!
                        </Text>
                    ) : (
                        <>
                            <Text className="text-[15px] font-sf-pro text-black m-2">
                                Your check-in is scheduled at{" "}
                                <Text className="font-sf-pro-bold">{formattedTime}</Text>.{" "}
                                {questionnaireIsReady
                                    ? "In fact, it's ready now!"
                                    : "We will send a notification when it's ready."}
                            </Text>

                            <CustomButton
                                text="Start Check-in"
                                onPress={() =>
                                    navigation.navigate("Questionnaire", {
                                        screen: "QuestionnaireTest",
                                    })
                                }
                                isLoading={false}
                                type="primary"
                                disabled={!questionnaireIsReady}
                                customStyle={{
                                    width: "100%",
                                    opacity: questionnaireIsReady ? 1 : 0.5,
                                }}
                            />
                        </>
                    )}
                </>
            )}
        </View>
    );
};

export default QuestionnaireCard;