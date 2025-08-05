import { View, Text, Dimensions, FlatList } from "react-native";
import React, { useState } from "react";
import type { TabScreenProps } from "../../types/Navigator";
import { useAuthContext } from "@/app/contexts/AuthContext";
import TodaysJogs from "@/app/components/TodaysJogs";
import WeeklyStats from "@/app/components/WeeklyStats";
import useUserStats from "@/app/hooks/useUserStats";
import useReminders from "@/app/hooks/useReminders";

import { ActivityIndicator } from "react-native";

import QuestionnaireCard from "@/app/components/QuestionnaireCard";
import Reminder from "@/app/types/Reminder";
import JogDetailModal from "@/app/components/JogDetailModal";
import useAuth from "@/app/hooks/useAuth";
import UserStatsService from "@/app/services/UserStatsService";
import Animated, { FadeIn, FadeInUp, FadeOut, LinearTransition } from "react-native-reanimated";



const HomeScreen: React.FC<TabScreenProps<"Home">> = ({ navigation }) => {
  const { userData, user, } = useAuthContext();
  const { loading: userLoading } = useAuth();
  const stats = useUserStats();
  const { reminders } = useReminders();
  const dayOfWeek = new Date().toLocaleDateString("en-GB", { weekday: "long" });
  const hourOfDay = new Date().getHours();
  const { loading } = useAuthContext();
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  console.log("userData", userData);

  const greeting: string =
    (hourOfDay < 12 ? "🌅 Good Morning, " : hourOfDay < 18 ? "☀️ Good Afternoon, " : "🌙 Good Evening, ")

  const sections = [
    {
      key: "greeting", component: () => (
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 20, color: "#", fontFamily: "SF-Pro-Bold", fontWeight: "bold", opacity: 1 }}>
            {greeting}
            <Text style={{ fontSize: 20, color: "#EB5A10", fontWeight: "bold", opacity: 1 }}>
              {userData?.displayName}!
            </Text>
          </Text>
          <Text style={{ fontSize: 32, fontWeight: "bold", color: "#000", marginTop: 4 }}>
            {dayOfWeek}
          </Text>
        </View>
      )
    },
    { key: "todaysJogs", component: () => <TodaysJogs navigation={navigation} reminders={reminders} onSelectReminder={setSelectedReminder} /> },
    {
      key: "userStats", component: () => <WeeklyStats stats={Array.isArray(stats.userStats) ? stats.userStats : []} navigation={navigation} />
    },
    {
      key: "Questionnaire",
      component: () => (
        <QuestionnaireCard />
      ),
    }

  ];

  // if (loading || userLoading) {
  //   console.log("loading")
  //   return (
  //     <View className="flex-1 items-center justify-center gray-100">
  //       <ActivityIndicator
  //         size="large" color="#EB5A10"
  //       >
  //       </ActivityIndicator>
  //       <Text className="text-lg font-sf-pro text-gray-500 mt-2">
  //         Loading...
  //       </Text>
  //     </View>

  //   )
  // }



  return (


    <Animated.View
      entering={FadeInUp.delay(50).duration(350)}
      exiting={FadeOut.duration(50).withCallback(() => { })}
      layout={LinearTransition.springify(100).duration(200).withCallback(() => { })}
      className="flex-1 bg-gray-100"
      style={{
        transform: [{ translateY: 2 }]

      }}


    >

      <Animated.FlatList
        entering={FadeIn.duration(500).withCallback(() => { })}
        exiting={FadeOut.duration(500).withCallback(() => { })}
        layout={LinearTransition.springify(500).duration(500).withCallback(() => { })}

        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => item.component()}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingVertical: 10, flexGrow: 1, paddingBottom: 100 }}
      />

      {selectedReminder && (
        <JogDetailModal
          visible={!!selectedReminder}
          onClose={() => setSelectedReminder(null)}
          reminder={selectedReminder}
        />
      )}

    </Animated.View>

  );
};

export default HomeScreen;