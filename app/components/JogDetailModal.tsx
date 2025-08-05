import React from "react";
import { View, Text, Modal, ScrollView, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Reminder from "@/app/types/Reminder";
import { Timestamp } from "firebase/firestore";

interface ReminderDetailModalProps {
    visible: boolean;
    onClose: () => void;
    reminder: Reminder;
    animationType?: "slide" | "fade" | "none";
    presentationStyle?: "fullScreen" | "pageSheet" | "formSheet" | "overFullScreen" | "overCurrentContext" | "popover";
    transparent?: boolean;
    onRequestClose?: () => void;
}

const ReminderDetailModal: React.FC<ReminderDetailModalProps> = ({ visible, onClose, reminder, animationType, presentationStyle, transparent, onRequestClose  }) => {
    
    const formatDate = (date: Date | Timestamp) =>
        new Date(date instanceof Timestamp ? date.toDate() : date).toLocaleDateString("en-GB", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });

    const formatTime = (date: Date | Timestamp) =>
        new Date(date instanceof Timestamp ? date.toDate() : date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

    const sanitiseStatus = (status: string) => {
        
        if (!status) return "Unknown Status";

        if(status.includes("completed")) return status.split("completed")[1].trim() === "OnTime" ? "Completed on Time" : "Completed Late";
        
        else return status.charAt(0).toUpperCase() + status.slice(1);

    };

    return (
        <Modal visible={visible} transparent animationType="slide" presentationStyle="overFullScreen" onRequestClose={onClose}>
            <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}>

            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xl font-sf-pro-display-bold">Reminder Details</Text>
                       
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="#EB5A10" />
                        </TouchableOpacity>

                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text className="text-lg font-sf-pro-bold mb-1">{reminder.title}</Text>
                        <Text className="text-gray-500 italic mb-3">{reminder.description || "No description provided."}</Text>

                        <View className="mb-4">
                            <Text className="font-sf-pro-bold">Category</Text>
                            <Text className="text-gray-700">{reminder.category}</Text>
                        </View>

                        <View className="mb-4">
                            <Text className="font-sf-pro-bold">Due</Text>
                            <Text className="text-gray-700">
                                {formatDate(reminder.dueDate)} at {formatTime(reminder.dueDate)}
                            </Text>
                        </View>

                        <View className="mb-4">
                            <Text className="font-sf-pro-bold">Status</Text>
                            <Text className="text-gray-700">
                                {sanitiseStatus(reminder.completeStatus)} at {""}
                                {reminder.completedAt ? formatTime(reminder.completedAt) : formatTime(reminder.dueDate)}

                            </Text>
                        </View>

                        {reminder.repeatOption && reminder.repeatOption !== "none" && (
                            <View className="mb-4">
                                <Text className="font-sf-pro-bold">Repeats</Text>
                                <Text className="text-gray-700 capitalize">{reminder.repeatOption}</Text>
                            </View>
                        )}

                        {reminder.reminderEnabled && (
                            <View className="mb-4">
                                <Text className="font-sf-pro-bold">Reminders</Text>
                                {reminder.reminderIntervals?.length ? (
                                    <Text className="text-gray-700">
                                        {reminder.reminderIntervals[0].intervals.join(", ")} mins before
                                    </Text>
                                ) : (
                                    <Text className="text-gray-700">Enabled (single)</Text>
                                )}
                            </View>
                        )}

                       
                        {reminder.isStepBased && reminder.steps?.length ? reminder.steps.length > 0 && (
                            <View className="mb-4">
                                <Text className="font-sf-pro-bold text-lg mb-2">Steps</Text>
                                {reminder.steps?.map((step) => (
                                    <View
                                        key={step.id}
                                        className="bg-gray-100 p-3 mb-2 rounded-xl flex-row justify-between items-center"
                                    >
                                        <View className="flex-1 pr-2">
                                            <Text
                                                className={`font-sf-pro-bold text-sm ${step.completed ? "text-green-600 line-through" : "text-gray-800"
                                                    }`}
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                            >
                                                {step.title}
                                            </Text>
                                            <Text className="text-xs text-gray-600">{formatTime(step.dueDate)}</Text>
                                        </View>
                                        <Ionicons
                                            name={step.completed ? "checkmark-circle" : "ellipse-outline"}
                                            size={20}
                                            color={step.completed ? "#EB5A10" : "#aaa"}
                                        />
                                    </View>
                                ))}
                            </View>
                        ) : (
                            null
                        )}

                        {/* TASKS */}

                        {/* MEDICATIONS */}
                        {reminder.category === "Medication" && reminder.doses?.length ? reminder.doses.length > 0 && (
                            <View className="mb-4">
                                <Text className="font-sf-pro-bold text-lg mb-2">Medication Doses</Text>
                                {reminder.doses.map((dose) => (
                                    <View
                                        key={dose.id}
                                        className="bg-gray-100 p-3 mb-2 rounded-xl"
                                    >
                                        <Text className="font-sf-pro-bold text-sm text-gray-800">{dose.name}</Text>
                                        <Text className="text-gray-600 text-sm mb-1">Dosage: {dose.dosage}</Text>
                                        <Text className="text-xs text-gray-600">
                                            {dose.times.map((t, i) => formatTime(t.time)).join(", ")}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            null
                        )}
                    </ScrollView>
                </View>
            </View>
           
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default ReminderDetailModal;