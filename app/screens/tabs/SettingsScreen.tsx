import React, { useEffect, useState } from "react";
import { View, Alert, Text } from "react-native";
import CustomButton from "../../components/CustomButton";
import { DrawerScreenProps } from "@react-navigation/drawer";
import useAuth from "@/app/hooks/useAuth";
import AuthService from "@/app/services/AuthService";
import UserService from "@/app/services/UserService";
import { Timestamp } from "firebase/firestore";
import UserStatsService from "@/app/services/UserStatsService";
import useUserStats from "@/app/hooks/useUserStats";
import DatePickerModal from "@/app/components/DatePickerModal";

const SettingsScreen: React.FC<DrawerScreenProps<any>> = () => {
  const [loading, setLoading] = useState(false);
  const [loading_Two, setLoading_Two] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const { user, userData } = useAuth();
  const { userStats } = useUserStats();


  const handleDeleteAccount = () => {
    setLoading_Two(true);

    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account and all of your data?",
      [
        {
          text: "Cancel",
          onPress: () => setLoading_Two(false),
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            await UserService.deleteAccount();
            setLoading_Two(false);
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleTimeSet = async (time: Date) => {
    setSelectedTime(time);

    if (user?.uid && userStats) {
      const updatedStats = {
        ...userStats.symptomStats,
        questionnaireTime: Timestamp.fromDate(time),
        questionnaireTimeSet: true,
      };

      await UserStatsService.updateStats(user.uid, {
        symptomStats: updatedStats,
      });

      Alert.alert(
        "Success",
        `Questionnaire time set for ${time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      );


    }
  };

  return (
    <View className="flex-1 justify-center items-center p-4">
      <CustomButton
        text="Delete Account & Data"
        onPress={handleDeleteAccount}
        isLoading={loading_Two}
        type="primary"
        disabled= {userData?.email ==="testjog@test.com"}
      />

      {userStats?.symptomStats.dailyLogs?.[new Date().toLocaleDateString()]?.completed && (
        <Text className="text-sm font-sf-pro-bold text-gray-500 mt-4">
          Daily questionnaire already completed for today.
        </Text>
      )}
      <CustomButton
        text="Set Check-in Time"
        onPress={() => {
          showPicker ? setShowPicker(false) : setShowPicker(true);
        }}
        isLoading={loading}
        type="secondary"
        disabled={userStats?.symptomStats?.dailyLogs?.[new Date().toLocaleDateString()]?.completed}
      />

      {showPicker && (
        <DatePickerModal
          date={selectedTime}
          setDate={(date) => {
            handleTimeSet(date);
            setShowPicker(false);
          }}
          mode="time"
          title="Set Daily Questionnaire Time"
          confirmText="Save"
          cancelText="Cancel"

          maximumDate={new Date(new Date().setHours(23, 59, 59))}
        />
      )}

      <Text className="text-sm font-sf-pro-bold text-gray-500 mt-4">
        Joined on {userData?.createdAt?.toDate().toLocaleDateString()}
      </Text>
    </View>
  );
};

export default SettingsScreen;