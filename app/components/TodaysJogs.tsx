import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, TouchableOpacity } from "react-native";
import CustomButton from "@/app/components/CustomButton";
import { Timestamp } from "firebase/firestore";
import { Circle, Line, Svg } from "react-native-svg";
import "@/";
import { Ionicons } from "@expo/vector-icons";
import InfoPopup from "./InfoPopup";
import Reminder from "../types/Reminder";

interface TodaysJogsProps {
    reminders: any[];
    navigation: any;
    onSelectReminder: (reminder: Reminder) => void;
}

const TodaysJogs: React.FC<TodaysJogsProps> = ({ reminders, navigation, onSelectReminder }) => {
    const [filteredReminders, setFilteredReminders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalSteps, setTotalSteps] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const filterReminders = () => {

            const now = new Date();
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            const todaysReminders = reminders.filter((reminder) => {

                if (!reminder.dueDate) return false;

                const reminderDate = reminder.dueDate instanceof Timestamp
                    ? reminder.dueDate.toDate()
                    : new Date(reminder.dueDate);

                return (
                    (reminder.completeStatus === "upcoming" && !reminder.deleted) && (
                        reminderDate.getTime() >= todayStart.getTime() &&
                        reminderDate.getTime() <= todayEnd.getTime()
                    )
                );
            });
            setLoading(true);

            // Sort by closest due time
            const sortedReminders = todaysReminders.sort((a, b) =>
                new Date(a.dueDate.seconds * 1000).getTime() - new Date(b.dueDate.seconds * 1000).getTime()
            )

            console.log(sortedReminders);


            // accumulate total steps and completed steps via reduce
            const totalSteps: number = sortedReminders.reduce((acc, reminder) => acc + (reminder.steps?.length || 0), 0);

            const completedSteps: number = sortedReminders.reduce(
                (acc, reminder) =>
                    acc +
                    (reminder.steps?.filter((step: any) => step.completed).length || 0),
                0
            );

            const progress: number = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

            setProgress(progress);
            setFilteredReminders(sortedReminders);
            setTotalSteps(totalSteps);
            setLoading(false);
        };

        filterReminders();

    }, [reminders, setFilteredReminders, setLoading]);

    return (
        <View className="justify-center items-center">
            <View className="bg-white p-6 m-2 w-[90%] shadow-md rounded-2xl">
                {loading ? (
                    <ActivityIndicator size="large" color="#EB5A10" />
                ) : (
                    <Text className="font-sf-pro-display-bold text-[20px] text-black opacity-80">
                        🔥 {filteredReminders.length > 0 ? filteredReminders.length : ""} Upcoming
                        {filteredReminders.length === 1 ? " Jog" : " Jogs"}

                    </Text>
                )}

                {filteredReminders.filter((r) => r.isStepBased).length > 0 && (
                    <>
                        <Text className="text-lg font-sf-pro-bold text-primary-500 mt-4 mb-2">Step-Based Jogs</Text>
                        <FlatList
                            data={filteredReminders
                                .filter((reminder) => reminder.isStepBased)
                                .sort((a, b) => {
                                    const progressA =
                                        (a.steps?.filter((s: { completed: boolean }) => s.completed).length || 0) /
                                        (a.steps?.length || 1);
                                    const progressB =
                                        (b.steps?.filter((s: { completed: boolean }) => s.completed).length || 0) /
                                        (b.steps?.length || 1);
                                    return progressB - progressA;
                                })}
                            keyExtractor={(item) => item.id}
                            horizontal={filteredReminders.filter((r) => r.isStepBased).length > 1}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 10 }}
                            renderItem={({ item }) => {
                                const jogTime = new Date(item.dueDate.seconds * 1000).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                });

                                const completedSteps = item.steps?.filter((s: { completed: boolean }) => s.completed).length || 0;
                                const totalSteps = item.steps?.length || 1;
                                const percent = Math.floor((completedSteps / totalSteps) * 100);
                                const percentString = `${percent}%`;
                                const translateX = -percentString.length * 3.5;

                                return (
                                    <TouchableOpacity
                                        onPress={() =>
                                            onSelectReminder(item)
                                        }
                                        className={`bg-white p-4 rounded-lg shadow-sm flex-row justify-between ${filteredReminders.some((r) => r.isStepBased.length > 1 ? "w-64" : "w-full")}  border-2 border-primary-0`}
                                    >
                                        <View>
                                            <Text className="font-sf-pro-bold text-black">{item.title}</Text>
                                            <View className="flex-row items-center mt-1">
                                                <Ionicons name="calendar-outline" size={20} color="#EB5A10" />
                                                <Text className="text-gray-500"> {jogTime}</Text>
                                            </View>
                                        </View>

                                        <Svg height="50" width="50" viewBox="0 0 100 100" className="mt-2 place-self-end">
                                            <Circle cx="50" cy="50" r="40" stroke="#ddd" strokeWidth="8" fill="none" />
                                            <Circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                stroke="#EB5A10"
                                                strokeWidth="8"
                                                fill="none"
                                                strokeDasharray="251.2"
                                                strokeDashoffset={251.2 - (251.2 * completedSteps) / totalSteps}
                                                strokeLinecap="round"
                                            />
                                            <Text
                                                className="absolute text-[10px] font-sf-pro-display-bold text-primary-500"
                                                style={{
                                                    top: "50%",
                                                    left: "50%",
                                                    transform: [
                                                        { translateX },
                                                        { translateY: 17 },
                                                    ],
                                                }}
                                            >
                                                {percentString}
                                            </Text>
                                        </Svg>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </>
                )}

                {filteredReminders.filter((r) => !r.isStepBased).length > 0 && (
                    <>
                        <Text className="text-lg font-sf-pro-bold text-primary-500 mt-6 mb-2">Jogs</Text>
                        <FlatList
                            data={filteredReminders.filter((reminder) => !reminder.isStepBased)
                            .sort((a, b) => a.dueDate.seconds - b.dueDate.seconds)}
                            
                            keyExtractor={(item) => item.id}
                            horizontal={filteredReminders.filter((r) => !r.isStepBased).length > 1}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 10 }}

                            renderItem={({ item }) => {
                                const jogTime = new Date(item.dueDate.seconds * 1000).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                });

                                return (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setTimeout(() => {
                                                onSelectReminder(item);
                                            }, 50);

                                       
                                        }
                                        }
                                        className={`bg-white p-4 rounded-lg border-2 border-[#EB5A10] shadow-sm ${filteredReminders.some((r) => Array.isArray(!r.isStepBased) ? "w-64" : "w-full")}`}
                                        style={{
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.25,
                                            shadowRadius: 3.84,
                                            elevation: 5,
                                        }}
                                    >
                                        <Text className="font-sf-pro-bold text-black">{item.title}</Text>
                                        <View className="flex-row items-center mt-1">
                                            <Ionicons name="calendar-outline" size={20} color="#EB5A10" />
                                            <Text className="text-gray-500"> {jogTime}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </>
                )}
                {filteredReminders.length === 0 && (
                    <View className="flex-row items-start justify-start">

                        <Text className="text-lg font-sf-pro  text-gray-500 mt-4">No upcoming jogs listed today.</Text>
                        <InfoPopup
                            modalTitle="No Jogs listed"
                            title="No Jogs for today"
                            message={'You have no upcoming jogs left for today. Add a new jog to get started. You can add manually a new jog by clicking "My Jogs" on the bottom tab bar, or automatically add jogs via our AI ChatBot by clicking "AI Planner".'}
                            className="ml-1 mt-4"
                        />


                    </View>

                )}


            </View>

        </View>
    );
};

export default TodaysJogs;