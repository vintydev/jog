import React, { useState, useEffect } from "react";
import { Pressable, Text, View, Alert, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "./CustomButton";
import ReminderService from "../services/ReminderService";

interface TaskItemProps {
    item: any;
    status: string;
    onPress: () => void;
    onPressComplete: () => void;
    isLoading: boolean;
    textForButton?: string;
    isExpanded?: boolean;
    onToggle?: () => void;
    renderSteps?: React.ReactNode;
}

const TaskItem: React.FC<TaskItemProps> = ({ item, status, onPress, onPressComplete, isLoading, textForButton, isExpanded = false }) => {
    const [expanded, setExpanded] = useState(isExpanded);
    const [steps, setSteps] = useState(item.steps || []);

    console.log(new Date().toLocaleDateString("en-GB", {
        timeZone: "Europe/London",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }));

    useEffect(() => {
        setSteps(item.steps || []);
    }, [item.steps]);

    const handleStepCompletion = async (stepId: string) => {
        const now = new Date();
        const stepIndex = steps.findIndex((step: any) => step.id === stepId);
        if (stepIndex === -1) return;

        const step = steps[stepIndex];
        const isOnTime = new Date(step.dueDate.seconds * 1000) >= now;
        const newStatus = isOnTime ? "completedOnTime" : "completedLate";
        const updatedSteps = steps.map((s: any) =>
            s.id === stepId ? { ...s, completed: true, completeStatus: newStatus } : s
        );

        try {
            await ReminderService.markStepAsCompleted(item.reminderId, stepId);
            setSteps(updatedSteps);
        } catch (error) {
            console.error("Error completing step:", error);
        }
    };

    const handleDeleteStep = (stepId: string) => {
        Alert.alert(
            "Delete Step",
            "Are you sure you want to delete this step? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await ReminderService.deleteStep(item.reminderId, stepId);

                            const updatedSteps = steps.filter((step: any) => step.id !== stepId);
                            setSteps(updatedSteps);

                            // If no steps remain, delete the jog
                            if (updatedSteps.length === 0) {
                                await ReminderService.deleteReminder(item.reminderId);
                                Alert.alert("No steps left", "Jog deleted.");


                            }

                        } catch (error) {
                            console.error("Error deleting step:", error);
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteJog = async () => {
        return new Promise<void>(async (resolve, reject) => {

            Alert.alert(
                "Delete Jog",
                "Are you sure you want to delete this jog? This action cannot be undone.",
                [
                    { text: "Cancel", style: "cancel", onPress: () => resolve() },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                await ReminderService.deleteReminder(item.reminderId);
                                resolve();
                            } catch (error) {
                                console.error("Error deleting jog:", error);
                                reject(error);
                            }
                        },
                    },
                ]
            );
        });
    };

    const allStepsCompleted = steps.length > 0 && steps.every((step: any) => step.completed);

    const statusStyles: Record<string, { color: string; bgColor: string; message: string }> = {
        overdue: { color: "text-primary-0", bgColor: "bg-yellow-100", message: "No worries! You can still do it 💪" },
        upcoming: { color: "text-primary-0", bgColor: "bg-primary-100", message: "Let's go! 🚀" },
        completedOnTime: { color: "text-green-600", bgColor: "bg-green-100", message: "Yoo! You nailed it 🎉" },
        completedLate: { color: "text-red-700", bgColor: "bg-red-100", message: "Well done! We can try earlier tomorrow ❤️‍🔥" },
        incomplete: { color: "text-red-600", bgColor: "bg-gray-200", message: "That's okay! Everyday is a fresh start 🌱" }
    };



    return (
        <TouchableOpacity
            className="bg-white px-6 p-4 rounded-2xl m-2 shadow-xs border border-gray-300 min-h-200 w-[95%] mx-auto"
            onPress={onPress}
            style={{ elevation: 2 }}

        >
            <View className={`flex-row items-center justify-between mb-2 px-4 py-2 rounded-xl ${statusStyles[status]?.bgColor || "bg-gray-100"}`}>
                <View className="flex-row items-center space-x-2">
                    <TouchableOpacity onPress={handleDeleteJog}>
                        <Ionicons name="trash" size={20} color="#EB5A10" />
                    </TouchableOpacity>

                    <Text ellipsizeMode="tail" className={`text-lg font-sf-pro-bold ml-2 ${statusStyles[status]?.color || "text-black"}`}>
                        {item.title.slice(0, 15) + (item.title.length > 15 ? "..." : "")}
                    </Text>
                </View>

                <TouchableOpacity onPress={() => setExpanded(!expanded)} className={`p-2 rounded-full ${isExpanded ? "bg-gray-200" : ""}`}>
                    {item.isStepBased && (
                        <Ionicons
                            name={expanded ? "chevron-up" : "chevron-forward"}
                            size={20}
                            color="#EB5A10"
                            className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}

                        />
                    )}
                </TouchableOpacity>
            </View>

            <Text className="text-sm font-sf-pro text-gray-600 italic mt-1 ml-4">
                {item.description ? item.description : "No description."}
            </Text>

            <View className="flex-row items-center mt-1 bg-gray-50 px-3 py-2 rounded-lg">
                <Ionicons name="calendar-outline" size={20} color="#e74c3c" />
                <Text className="text-md font-sf-pro-bold text-gray-600 ml-1">
                    {new Date(item.dueDate).toLocaleDateString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric"
                    })}
                </Text>
                <Ionicons name="time-outline" size={20} color="#EB5A10" className="ml-4" />
                <Text className="text-md font-sf-pro-bold text-gray-600 ml-1">
                    {new Date(item.dueDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                    })}
                </Text>
            </View>

            {expanded && steps.length > 0 && item.isStepBased && (
                <View className="mt-2">
                    <Text className="text-lg font-sf-pro-bold text-secondary-600 mb-2 border-b pb-1">Steps</Text>

                    {steps.map((step: any) => (
                        <View key={step.id} className="bg-white p-3 rounded-lg border border-gray-300 mb-2">
                            <TouchableOpacity
                                onLongPress={() => !step.completed && handleStepCompletion(step.id)}
                                delayLongPress={300}
                                disabled={isLoading}
                            >
                                <View className="flex-row justify-between items-start flex-wrap gap-y-2">
                                    {/* Step Title */}
                                    <View className="max-w-[45%]">
                                        <Text
                                            className={`text-md font-sf-pro-bold ${step.completed ? "text-green-500 line-through" : "text-gray-700"
                                                }`}
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                        >
                                            <Text> {step.title}</Text>
                                        </Text>
                                        {!step.completed && (
                                            <Text className="text-xs font-sf-pro text-gray-400">Long press to complete</Text>
                                        )}
                                    </View>

                                    {/* Due Time */}
                                    <Text className="text-md font-sf-pro text-gray-700">
                                        {new Date(step.dueDate.seconds * 1000).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                        })}
                                    </Text>

                                    {/* Trash icon */}
                                    <TouchableOpacity onPress={() => handleDeleteStep(step.id)} disabled={isLoading}>
                                        <Ionicons name="trash" size={20} color="#EB5A10" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}


            {((!item.isStepBased && (item.completeStatus === "upcoming" || item.completeStatus === "overdue")) ||
                (item.isStepBased && allStepsCompleted && (item.completeStatus === "upcoming" || item.completeStatus === "overdue"))) && (
                    <View className="flex-row items-center justify-center mt-4">
                        <CustomButton
                            text={textForButton || "Complete"}
                            type="primary"
                            onPress={onPressComplete}
                            width={"50%"}
                            height={40}
                            isLoading={isLoading}
                            disabled={isLoading}
                        />
                    </View>

                )}
        </TouchableOpacity>
    );
};

export default TaskItem;