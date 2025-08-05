import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, TextInput, ActivityIndicator } from "react-native";
import { TaskStackScreenProps } from "@/app/types/Navigator";
import DatePickerModal from "@/app/components/DatePickerModal";
import CustomButton from "@/app/components/CustomButton";
import SelectableButton from "@/app/components/SelectableButton";
import ReminderService from "@/app/services/ReminderService";
import useAuth from "@/app/hooks/useAuth";;
import { Ionicons } from "@expo/vector-icons";
import UserService from "@/app/services/UserService";
import InfoPopup from "@/app/components/InfoPopup";
import { useNotification } from "@/app/contexts/NotificationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import StepModal from "@/app/components/StepModal";



const reminderIntervals = [5, 10, 15, 30, 60];

const AddTaskScheduleScreen: React.FC<TaskStackScreenProps<"AddTaskSchedule">> = ({ navigation, route }) => {
    const { taskDetails } = route.params;
    const { user } = useAuth();
    const userId = user?.uid;
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [repeatEnabled, setRepeatEnabled] = useState(false);
    const [multipleReminders, setMultipleReminders] = useState(false);
    const [selectedIntervals, setSelectedIntervals] = useState<number[]>([]);
    const [repeatOption, setRepeatOption] = useState<"none" | "daily" | "weekly" | "hourly">("none");
    const [loading, setLoading] = useState(false);
    const [doses, setDoses] = useState([{ id: 1, time: new Date() }]);
    const [userMedications, setUserMedications] = useState<{ name: string; dosage: string }[]>([]);
    const [isStepBased, setIsStepBased] = useState(false);
    const [steps, setSteps] = useState<({ id: number; title: string; time: Date }[])>([]);
    let minTime = new Date(date.setHours(0, 0, 0, 0));
    const [stepModalVisible, setStepModalVisible] = useState(false);


    useEffect(() => {

        if (userId) {
            UserService.fetchMedicationByUser(userId).then(setUserMedications);
            console.log("🔍 User Medications:", userMedications);
        }

    }, [userId]);


    const handleDateChange = (selectedDate: Date) => {
        setDate((prevDate) => {
            const updatedDate = new Date(selectedDate);
            updatedDate.setHours(prevDate.getHours(), prevDate.getMinutes());
            setDate(updatedDate);
            console.log("🔍 Selected Date:", updatedDate);
            return updatedDate;
        });
    };

    const handleTimeChange = (selectedTime: Date) => {
        setTime((prevTime) => {
            const updatedTime = new Date(prevTime);
            updatedTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
            setTime(updatedTime);
            console.log("🔍 Selected Time:", updatedTime);
            return updatedTime;
        });
    };


    const handleAddStep = () => {
        setSteps([...steps, { id: steps.length + 1, title: "", time: new Date() }]);
    };

    const handleRemoveStep = (stepId: number) => {
        setSteps(steps.filter((step) => step.id !== stepId));
    };


    const validateMedication = async () => {
        console.log("Running validateMedication");

        // None found, prompt user to add
        if (!userMedications || userMedications.length === 0) {
            console.log("No medications found in user list. Prompting user...");
            showMedicationAlert();
            return;
        }

        // Check if medication exists
        const medicationExists = userMedications.some(
            (med) => med.name === taskDetails.medicationName && med.dosage === taskDetails.dosage
        );

        if (!medicationExists) {
            console.log("Medication not found, prompting user...");
            showMedicationAlert();
        } else {
            console.log("Medication exists, skipping validation.");
        }
    };

    // Separate function for alert to avoid async issues
    const showMedicationAlert = () => {
        Alert.alert(
            "Alert",
            `${taskDetails.medicationName} with the dosage ${taskDetails.dosage} wasn't found in your medication list. \nDo you want to add it for future jogs?`,
            [
                {
                    text: "No",
                    style: "cancel",
                    onPress: () => console.log("User chose NO, skipping medication addition."),
                },
                {
                    text: "Yes",
                    onPress: async () => {
                        console.log("User chose YES, adding medication...");
                        await UserService.addMedicationToUser(userId || "", taskDetails.medicationName || "", taskDetails.dosage || "");
                        console.log("Medication added.");
                    },
                },
            ]
        );
    };


    const handleSaveTask = async () => {
        setLoading(true);

        console.log("doses before saving", doses);


        if (!taskDetails?.title?.trim()) {
            alert("Task title is missing!");
            setLoading(false);
            return;
        }


        if (isStepBased && steps.length <= 1) {
            alert("A step based jog must have more than one step. Please add more steps.");
            setLoading(false);
            return;
        }

        if (taskDetails.category === "Medication" && doses.length === 0) {
            alert("Please add at least one dose to the medication");
            setLoading(false);
            return;
        }


        if (taskDetails.category === "Medication" && userId) {
            await validateMedication();
            console.log("🔍 Selected Doses Before Saving:", doses);

            await ReminderService.createRecurringStepReminders(
                userId || "",
                date,
                taskDetails,
                repeatOption,
                reminderEnabled,
                selectedIntervals,
                null,
                doses.map(dose => ({
                    ...dose,
                    title: taskDetails.title
                })),
            );
            setLoading(false);

            return navigation.reset({
                index: 0,
                routes: [{ name: "TaskList" }],
            });


        } else if (isStepBased) {


            await ReminderService.createRecurringStepReminders(
                userId || "",
                date,
                taskDetails,
                repeatOption,
                reminderEnabled,
                selectedIntervals,
                steps,
            );



        }
        else {
            await ReminderService.createRecurringTaskReminders(
                userId || "",
                taskDetails,
                date,
                time,
                repeatOption,
                reminderEnabled,
                selectedIntervals,
            );
        }

        setLoading(false);
        navigation.reset({
            index: 0,
            routes: [{ name: "TaskList" }],
        });
    };

 

    return (

        <View className="flex-1 bg-gray-100 ">
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="p-5">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-[30px] font-sf-pro-display-bold">Schedule</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={28} color="black" />
                    </TouchableOpacity>
                </View>

                <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6">
                    <View className="flex-row items-center">
                        <Ionicons name="list" size={32} color="black" />
                        <View className="ml-4">
                            <Text className="text-lg font-sf-pro-bold">{taskDetails.title}</Text>
                            <Text className="text-gray-500">{taskDetails.category}</Text>
                        </View>
                    </View>
                </View>
                {/* Select Date Section */}
                <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6">
                    <Text className="text-lg font-sf-pro-bold">Select Date</Text>
                    <DatePickerModal
                        date={date}
                        setDate={handleDateChange}
                        mode="date"
                        title="Pick a Date"
                        maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                        minimumDate={new Date()}

                    />
                </View>

                {taskDetails.category !== "Medication" && (
                    <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6 relative">
                        <View className="flex-row items-center ">
                            <Text className="text-lg font-sf-pro-bold mr-2">Is this jog step-based?</Text>
                            <InfoPopup
                                title=""
                                message={"A step-based jog is a multi-step task where you can specify multiple steps to complete the task. Each step can have its own due time and reminder settings. This is useful for tasks that require multiple steps to complete.\n\nFor example, a task to prepare a meal can have steps like 'Chop vegetables', 'Boil water', 'Cook rice', etc.\n\nExperiment with this feature to create more actionable tasks!"}
                                className="flex-row items-center"
                                modalTitle="What is a step-based jog?"
                            />
                        </View>
                        <Switch value={isStepBased} onValueChange={
                            (value) => {
                                setIsStepBased(value);
                                if (!value) {
                                    setSteps([]);
                                    setStepModalVisible(false);
                                }
                            }
                        } />

                    </View>
                )}

                {/* Select Time or Steps */}
                {!isStepBased && taskDetails.category !== "Medication" && (
                    <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-4">


                        <View>
                            <Text className="text-lg font-sf-pro-bold">Select Time</Text>
                            <DatePickerModal
                                date={time}
                                setDate={handleTimeChange}
                                mode="time"
                                title="Pick a Time"
                                maximumDate={new Date(new Date().setHours(23, 59, 59, 999))} // Restrict to the end of the day
                                minimumDate={
                                    date.toDateString() === new Date().toDateString()
                                        ? new Date()
                                        : new Date(date.setHours(0, 0, 0, 0))}

                            />
                        </View>


                    </View>
                )}

                {taskDetails.category === "Medication" && !isStepBased && (
                    <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6">
                        <Text className="text-lg font-sf-pro-bold mb-2">Medication Doses</Text>
                        {doses.map((dose, index) => {
                            // Define the minimum time allowed for each dose


                            if (date.toDateString() === new Date().toDateString()) {
                                minTime = new Date(); // If today, set minimum to now
                            }

                            if (index > 0) {
                                // Ensure each dose is at least 1 minute after the previous dose
                                minTime = new Date(doses[index - 1].time.getTime() + 60 * 1000);
                            }

                            return (
                                <View key={dose.id} className="flex-row items-center justify-between mb-3">
                                    <DatePickerModal
                                        date={dose.time}
                                        setDate={(selectedDate) => {
                                            setDoses(
                                                doses.map((d, i) => i === index ? { ...d, time: new Date(selectedDate) } : d)
                                            );
                                        }}
                                        mode="time"
                                        title={`Dose ${dose.id}`}
                                        maximumDate={new Date(new Date().setHours(23, 59, 59, 999))}
                                        minimumDate={minTime}
                                    />
                                    {doses.length > 1 && dose.id > 1 && (
                                        <TouchableOpacity onPress={() => setDoses(doses.filter(d => d.id !== dose.id))}>
                                            <Ionicons name="remove-circle-outline" size={28} color="red" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}



                        <TouchableOpacity
                            onPress={() => setDoses([...doses, { id: doses.length + 1, time: new Date(doses[doses.length - 1].time.getTime() + 60 * 1000) }])}
                        >
                            <Text className="text-lg text-primary-0">➕ Add Dose</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {isStepBased ? (() => {

                    // Set the minimum time for the next step
                    // If there are no steps, set it to now
                    const lastStepTime = steps.length > 0
                        ? new Date(steps[steps.length - 1].time.getTime() + 60 * 1000)
                        : new Date();

                    return (
                        <>
                            <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6">
                                <Text className="text-lg font-sf-pro-bold mb-4">Jog Steps</Text>

                                {steps.length === 0 && (
                                    <Text className="text-gray-500 italic">No steps added yet.</Text>
                                )}

                                {steps.map((step, index) => (
                                    <View key={step.id} className="bg-white p-4 rounded-xl shadow-sm mb-3">
                                        <Text className="font-sf-pro-bold text-base text-gray-800 mb-1">
                                            #{index + 1}: {step.title}
                                        </Text>
                                        <Text className="text-sm text-gray-600">
                                            {step.time.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Text>
                                        <Ionicons
                                            name="remove-circle-outline"
                                            size={24}
                                            color="red"
                                            onPress={() => handleRemoveStep(step.id)}
                                            className="absolute top-4 right-2"
                                        />
                                    </View>
                                ))}

                                <TouchableOpacity onPress={() => setStepModalVisible(true)} className="mt-3">
                                    <Text className="text-lg text-primary-0">+ Add Step</Text>
                                </TouchableOpacity>
                            </View>
                        

                            <StepModal
                                visible={stepModalVisible}
                                onClose={() => setStepModalVisible(false)}
                                minTime={lastStepTime}
                                onSave={(title, time) => {
                                    const newStep = { id: steps.length + 1, title, time };
                                    setSteps([...steps, newStep]);
                                }}
                            />
                        </>
                    );
                })() : null}


                {/* Reminder Settings */}
                <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6">
                    <Text className="text-lg font-sf-pro-bold">Remind before?</Text>
                    <View className="flex-row items-center justify-between mt-2">


                        <Switch value={reminderEnabled} onValueChange={(value) => {
                            setReminderEnabled(value);
                            if (!value) {
                                setMultipleReminders(false);
                                setSelectedIntervals([]);
                            }
                        }} />

                    </View>

                    {reminderEnabled && (
                        <View className="mt-4">
                            <Text className="text-lg font-sf-pro-bold mb-2">Remind Me:</Text>
                            <View className="flex-row flex-wrap">
                                {reminderIntervals.map((interval) => (
                                    <SelectableButton
                                        key={interval}
                                        label={`${interval} min before`}
                                        isSelected={selectedIntervals.includes(interval)}
                                        onPress={() => {
                                            if (multipleReminders) {
                                                setSelectedIntervals((prev) =>
                                                    prev.includes(interval)
                                                        ? prev.filter((item) => item !== interval)
                                                        : [...prev, interval]
                                                );
                                            } else {
                                                setSelectedIntervals([interval]);
                                                setMultipleReminders(false);

                                            }
                                        }}
                                    />
                                ))}
                            </View>

                            <View className="flex-row items-center justify-between mt-4">
                                <Text className="text-lg">Multiple Reminders?</Text>
                                <Switch value={multipleReminders} onValueChange={setMultipleReminders} />
                            </View>
                        </View>
                    )}
                </View>


                <View className="bg-gray-100 px-6 p-4 rounded-2xl shadow-md mb-10 ">
                    <Text className="text-lg font-sf-pro-bold">Repeat?</Text>
                    <Switch
                        value={repeatEnabled}
                        onValueChange={(value) => {
                            setRepeatEnabled(value);
                            if (!value) {
                                setRepeatOption("none");
                            }
                        }}

                    />

                    {repeatEnabled && taskDetails.category === "Medication" ? (
                        <View className="mt-2 mb-5">
                            <Text className="text-lg font-sf-pro-bold">Repeat Interval</Text>
                            <View className="flex-auto justify-between mt-2">
                                {["Daily", "Weekly"].map((option) => (
                                    <SelectableButton
                                        key={option}
                                        label={option}
                                        isSelected={repeatOption === option.toLowerCase()}
                                        onPress={() =>
                                            setRepeatOption((prev) =>
                                                prev === option.toLowerCase() ? "none" : (option.toLowerCase() as "daily" | "weekly")
                                            )
                                        }
                                    />
                                ))}
                            </View>
                        </View>
                    ) : (
                        repeatEnabled && taskDetails.category !== "Medication" && (
                            <View className="mt-2 mb-5">
                                <Text className="text-lg font-sf-pro">Repeat Interval</Text>
                                <View className="flex-auto justify-between mt-2">
                                    {(!isStepBased ? ["Daily", "Weekly"] : ["Daily", "Weekly"]).map((option) => (
                                        <SelectableButton
                                            key={option}
                                            label={option}
                                            isSelected={repeatOption === option.toLowerCase()}
                                            onPress={() =>
                                                setRepeatOption((prev) =>
                                                    prev === option.toLowerCase() ? "none" : (option.toLowerCase() as "daily" | "weekly")
                                                )
                                            }
                                        />
                                    ))}
                                </View>
                            </View>
                        )
                    )}


                </View>

                <View className="bg-gray-100 mb-8 rounded-2xl shadow-lg justify-items-end items-center w-auto mx-auto p-6">
                    <CustomButton text="Save Jog" onPress={handleSaveTask} type="primary" isLoading={loading} width={200} />
                </View>

                {loading && (
                    <View className="absolute top-0 left-0 right-0 bottom-0 bg-white opacity-50 justify-center items-center">
                        <ActivityIndicator size="large" color="#EB5A10" />
                    </View>
                )}

                
            </ScrollView >


        </View >
    );
};

export default AddTaskScheduleScreen;