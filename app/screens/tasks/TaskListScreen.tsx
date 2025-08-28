import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, Pressable, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import ReminderService from "../../services/ReminderService";
import useAuth from "@/app/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import useReminders from "../../hooks/useReminders";
import TaskItem from "../../components/TaskItem";
import Reminder from "@/app/types/Reminder";
import { Timestamp } from "firebase/firestore";
import OneTimeOverlay from "@/app/components/OneTimeOverlay";
import useDevToolbox from "@/app/hooks/useDevToolbox";
import ReminderDetailModal from "@/app/components/JogDetailModal";
import { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

interface TaskListLayoutProps {
    navigation: any;
}

const TaskListLayout: React.FC<TaskListLayoutProps> = ({ navigation }) => {
    const { user, loading: userLoading } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { reminders, loading: reminderLoading } = useReminders();
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [taskBeingUpdated, setTaskBeingUpdated] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
    const overlayResetFlag = useDevToolbox();
    const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
    const [touchableOpacityDisabled, setTouchableOpacityDisabled] = useState(false);
    const [visible, setVisible] = useState(false);


    // Toggle section visibility
    const toggleSection = (status: string) => {
        setExpandedSections((prev) => ({ ...prev, [status]: !prev[status] }));
    };


    useEffect(() => {
        if (selectedReminder) {
            setTimeout(() => {
                setVisible(true);
            }, 30);
        } else {
            setVisible(false);
        }
    }, [selectedReminder]);

    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);


    useEffect(() => {
        if (!user) return;

        const now = new Date();

        // Helper function to process reminders
        const processReminders = (reminders: Reminder[]) => {
            return reminders.map((reminder) => ({
                ...reminder,
                dueDate: reminder.dueDate instanceof Timestamp
                    ? reminder.dueDate.toDate()
                    : new Date(reminder.dueDate),
            }));
        };

        // Helper function to filter today's reminders
        const filterTodaysReminders = (reminders: Reminder[]) => {
            return reminders.filter((reminder) =>
                (reminder.dueDate instanceof Date ? reminder.dueDate : reminder.dueDate.toDate()).toLocaleDateString() === selectedDate.toLocaleDateString() && !reminder.deleted
            );
        };

        // Subscribe to Firestore updates
        const unsubscribe = ReminderService.observeReminders(user.uid, (reminders) => {
            let processedReminders = processReminders(reminders);
            let tasksToday = filterTodaysReminders(processedReminders);
         

            // Sort reminders by due date
            const sortedReminders = tasksToday.sort((a, b) => {
                const dateA = a.dueDate instanceof Date ? a.dueDate : a.dueDate.toDate();
                const dateB = b.dueDate instanceof Date ? b.dueDate : b.dueDate.toDate();
                return dateA.getTime() - dateB.getTime();
            });

            setTasks(sortedReminders);
            setLoading(false);

        });


        // Cleanup function
        return () => {
            unsubscribe.then((unsub) => unsub && unsub());
        };

    }, [user?.uid, selectedDate, reminderLoading]);

    const markTaskAsComplete = async (taskId: string) => {

        if (!taskId) return;

        setTaskBeingUpdated(taskId);

        try {
            await ReminderService.markTaskAsCompleted(taskId);
        } catch (error) {
            console.error("Error marking task as completed:", error);

        }
        finally {

            setTimeout(() => setLoading(false), 1000);
            setTaskBeingUpdated(null);

        }
    };

    const taskCategories = [
        { title: "❤️‍🔥 Overdue Jogs", status: "overdue", color: "text-primary-0", bgColor: "bg-yellow-100", message: "No worries! You can still do it late " },
        { title: "🔥 Upcoming Jogs", status: "upcoming", color: "text-primary-0", bgColor: "bg-primary-100", message: "Let's go!" },
        { title: "Completed on Time", status: "completedOnTime", color: "text-green-600", bgColor: "bg-green-100", message: "Yoo! You nailed it 🎉" },
        { title: "Completed Late", status: "completedLate", color: "text-red-700", bgColor: "bg-red-100", message: "Well done! We can try earlier tomorrow." },
        { title: "Missed Jogs", status: "incomplete", color: "text-red-600", bgColor: "bg-gray-200", message: "That's okay! Everyday is a fresh start 🌱" },
    ];

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const isScrolling = offsetY !== 0;
        const anyExpanded = Object.values(expandedSections).some(Boolean);

        // Disable if scrolling AND a section is expanded
        if (isScrolling && anyExpanded) {
            setTouchableOpacityDisabled(true);

            // Clear any previous timeout
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            // Re-enable after 1s
            scrollTimeoutRef.current = setTimeout(() => {
                setTouchableOpacityDisabled(false);
            }, 1000);
        }
    };

    
    return (
        <Animated.View
            entering={FadeInUp.delay(50).duration(350)}
            exiting={FadeIn.duration(50)}
            layout={LinearTransition.springify()}
            className="flex-1 bg-gray-100"
        >

            <View className="flex-1 bg-gray-100 mt-4">
                <View className="flex-1 bg-gray-100 px-5">

                 

                    < ScrollView 
                        
                        onScroll={handleScroll}

                        showsVerticalScrollIndicator={false}

                        contentContainerStyle={{ paddingBottom: Object.keys(expandedSections).some(key => expandedSections[key]) ? reminders.length * 12 : 0 }} keyboardShouldPersistTaps="handled">

                        <View className="flex-row justify-between items-center px-2 mb-4">
                            <TouchableOpacity
                                onPress={() => setDatePickerVisible(!datePickerVisible)}
                                className="flex-row items-center space-x-2"
                                activeOpacity={0.7}
                            >
                                {selectedDate.toDateString() === new Date().toDateString() ? (
                                    <View className="flex-row items-center space-x-1">
                                        <Text className="text-[30px] font-sf-pro-display-bold text-primary-0">
                                            {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                                        </Text>
                                        <View className="bg-primary-0 px-2 py-1 rounded-full ml-2">
                                            <Text className="text-white text-xs font-sf-pro-bold">Today</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <Text className="text-[30px] font-sf-pro-display-bold text-gray-700">
                                        {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                                    </Text>
                                )}

                                <Ionicons
                                    name={datePickerVisible ? "chevron-down" : "chevron-forward"}
                                    size={24}
                                    color="000"
                                />
                            </TouchableOpacity>

                            {/* {tasks.some((task) => task.completeStatus === "upcoming" || task.completeStatus === "overdue") && !datePickerVisible && (
                                <TouchableOpacity onPress={handleFireTouch} className="p-2">
                                    <Ionicons name={"checkmark-outline"} size={28} color="#EB5A10" />
                                </TouchableOpacity>
                            )} */}
                        </View>


                        {datePickerVisible && (
                            <View className="mb-4">
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="date"

                                    onChange={(_, date) => date && setSelectedDate(date)}
                                    maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                                />
                            </View>
                        )}

                        {tasks.length === 0 && !datePickerVisible ? (
                            <View className="flex-1 justify-center items-center mt-40 ">
                                <Text className="text-gray-500 text-lg text-center">No jogs were found for this date.</Text>

                            </View>
                        ) : (
                            taskCategories.map(({ title, status, message }) => {
                                const filteredTasks: Reminder[] = tasks.filter((task) => task.completeStatus === status);
                                console.log("Filtered Tasks", filteredTasks);
                                if (filteredTasks.length === 0) return null;

                                let countOfStatus: number = filteredTasks.length;
                                let countOfComplete: number = 0;

                                const isExpanded = expandedSections[status];

                                // get the count of completed tasks today
                                if (status === "completedOnTime") {
                                    countOfComplete = tasks.filter(task => task.completeStatus === "completedOnTime").length;
                                } else if (status === "completedLate") {
                                    countOfComplete = tasks.filter(task => task.completeStatus === "completedLate").length;
                                }

                                return (
                                    <View key={status} className="border-b w-full border-gray-200 p-4 mt-1">
                                        <View className="p-3 rounded-xl bg-white shadow-sm flex-row justify-between items-center mb-2">


                                            <View>
                                                <Text className={`font-sf-pro-text-bold text-[20px] `}>{(status === "upcoming" || status === "overdue" && countOfStatus > 0 ? `${title} (${countOfStatus})` : title)}</Text>
                                                <Text className="text-gray-700 text-sm">{(status === "completedOnTime" || status === "completedLate") ? `${countOfComplete} total Jogs. ${message}` : message}</Text>

                                            </View>

                                            <TouchableOpacity
                                                onPress={() => toggleSection(status)}
                                                className={`flex-row items-center justify-center ${isExpanded ? "bg-primary-100" : "bg-gray-100"} rounded-full p-2`}
                                                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}
                                                activeOpacity={0.8}
                                                disabled={loading}
                                            >


                                                <Ionicons className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                                                    name={isExpanded ? "chevron-up" : "chevron-forward"}
                                                    size={24}
                                                    color="#EB5A10"
                                                />


                                            </TouchableOpacity>
                                        </View>

                                        {/* Expanded Task List */}
                                        {
                                            isExpanded && (
                                                <View
                                                    className="bg-gray-100 rounded-2xl p-4 mx-auto w-[97%]"
                                                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}
                                                >
                                                    <FlatList
                                                        data={filteredTasks}
                                                        keyExtractor={(item) => item.reminderId}
                                                        extraData={taskBeingUpdated} // Re-render list when taskBeingUpdated changes
                                                        renderItem={({ item }) => (
                                                            <TaskItem
                                                                item={item}
                                                                status={status}
                                                                onPress={() => {
                                                                    setTimeout(() => {
                                                                        setSelectedReminder(JSON.parse(JSON.stringify(item)));
                                                                    }, 50);

                                                                    console.log(item + " selected" + item.completedAt);
                                                                }}
                                                                onPressComplete={() => markTaskAsComplete(item.reminderId)}
                                                                isLoading={taskBeingUpdated === item.reminderId}
                                                                textForButton={
                                                                    item.completeStatus === "overdue"
                                                                        ? "Complete Late"
                                                                        : (item.dueDate instanceof Date ? item.dueDate : item.dueDate.toDate()).toLocaleDateString() === new Date().toLocaleDateString() && status === "upcoming"
                                                                            ? "Complete"
                                                                            : "Complete Early"
                                                                }

                                                            />

                                                        )}
                                                        scrollEnabled={false}

                                                    />

                                                </View>
                                            )
                                        }


                                    </View>
                                );
                            })
                        )}

                    </ScrollView>

                    {loading || userLoading || reminderLoading || taskBeingUpdated && (
                        <View className="absolute top-0 left-0 right-0 bottom-0 bg-white opacity-50 justify-center items-center">
                            <ActivityIndicator size="large" color="#EB5A10" />
                        </View>
                    )}


                    <TouchableOpacity
                        onPress={() => navigation.navigate("AddTaskCategory")}
                        className={`absolute bottom-32 right-10 w-20 h-20 rounded-full items-center justify-center shadow-md ${touchableOpacityDisabled ? "bg-gray-300 opacity-20" : "bg-primary-0"}`}
                        activeOpacity={0.8}
                        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}
                        disabled={touchableOpacityDisabled}
                    >
                        <Ionicons name="add" size={32} color="white" />
                    </TouchableOpacity>



                </View>
            </View>

            <View className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 shadow-sm">
                <Text className="text-center text-gray-500 text-sm">Swipe left to delete jogs</Text>
                {selectedReminder && visible && (
                    <ReminderDetailModal
                        visible={!!selectedReminder}
                        onClose={() => setSelectedReminder(null)}
                        reminder={selectedReminder}
                        onRequestClose={() => setSelectedReminder(null)}
                    />
                )}
            </View>

            {/* Overlay for Manual Jog Planner */}

            <OneTimeOverlay
                key={`manualOverlay-${overlayResetFlag}`}
                storageKey={`manualJogHintShown`}
                title="Manual Jog Planner"
                message="The manual jog planner allows you to add jogs manually. You can also set reminders for them. To create a jog, tap the '+' button in the bottom right corner."
            />

        </Animated.View >

    );
};

export default TaskListLayout;