import { doc, getDoc, setDoc, Timestamp, addDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../services/FirebaseService";
import Reminder from "../types/Reminder";
import { Time } from "@expo/html-elements";
import * as Notifications from "expo-notifications";
import { useNotification } from "../contexts/NotificationContext";
import UserStatsService from "./UserStatsService";
import getToday from "../constants/today";

export default class ReminderService {


    static async getReminderById(reminderId: string): Promise<Reminder | null> {
        if (!reminderId) throw new Error("Reminder ID is missing.");
        try {
            const reminderRef = doc(db, "reminders", reminderId);
            const reminderDoc = await getDoc(reminderRef);
            if (reminderDoc.exists()) {
                return reminderDoc.data() as Reminder;
            }
            return null;
        } catch (error) {
            console.error("Error fetching reminder:", error);
            return null;
        }
    }

    static async getRemindersByUserId(userId: string): Promise<Reminder[] | null> {
        if (!userId) throw new Error("User ID is missing.");
        try {
            const remindersRef = collection(db, "reminders");
            const q = query(remindersRef, where("userId", "==", userId), where("deleted", "==", false));
            const querySnapshot = await getDocs(q);
            const reminders: Reminder[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                reminders.push({
                    reminderId: doc.id,
                    userId: data.userId,
                    title: data.title,
                    category: data.category,
                    description: data.description,
                    repeatOption: data.repeatOption,
                    completed: data.completed,
                    createdAt: data.createdAt,
                    deleted: data.deleted,
                    completeStatus: data.completeStatus,
                    updatedAt: data.updatedAt,
                    updateCount: data.updateCount,
                    dueDate: data.dueDate,
                    reminderEnabled: data.reminderEnabled,
                    reminderIntervals: data.reminderIntervals,
                    isStepBased: data.isStepBased,
                    steps: data.steps,
                    doses: data.doses,
                    isAI: data.isAI,
                } as Reminder);
            });
            return reminders;
        } catch (error) {
            console.error("Error fetching reminders:", error);
            return null;
        }
    }


    static async observeReminders(userId: string, callback: (reminders: Reminder[]) => void) {

        try {
            if (!userId) throw new Error("No user ID provided.");
            const observer = query(collection(db, "reminders"), where("userId", "==", userId));
            const unsubscribe = onSnapshot(observer, (snapshot) => {
                const reminders = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        reminderId: doc.id,
                        userId: data.userId,
                        title: data.title,
                        category: data.category,
                        description: data.description,
                        repeatOption: data.repeatOption,
                        completed: data.completed,
                        completedAt: data.completedAt,
                        timeDeleted: data.timeDeleted,
                        conversationId: data.conversationId,
                        createdAt: data.createdAt,
                        deleted: data.deleted,
                        completeStatus: data.completeStatus,
                        updatedAt: data.updatedAt,
                        updateCount: data.updateCount,
                        dueDate: data.dueDate,
                        reminderEnabled: data.reminderEnabled,
                        reminderIntervals: data.reminderIntervals,
                        isStepBased: data.isStepBased,
                        steps: data.steps,
                        doses: data.doses,
                        isAI: data.isAI,

                    } as Reminder;
                });
                callback(reminders as Reminder[]);
            });

            return unsubscribe;
        } catch (error) {
            console.error("Error observing reminders:", error);
        }

    }




    static async addReminder(userId: string, reminder: Reminder) {
        try {
            if (!userId) throw new Error("No user ID provided.");
            if (!reminder) throw new Error("No reminder data provided.");

            console.log("📝 Adding reminder:", reminder);

            const docRef = await addDoc(collection(db, "reminders"), reminder);
            await setDoc(docRef, { reminderId: docRef.id || null }, { merge: true });

            // Update user stats
            await UserStatsService.updateJogStatsToday(userId, reminder, { isCreating: true });

            console.log(" Reminder added successfully with ID:", docRef.id);
        } catch (error) {
            console.error("Error adding reminder:", error);
        }
    }

    static async combineDateAndTime(date: Date, time: Date): Promise<Timestamp> {

        if (!date || !time) throw new Error("Date or time is missing.");
        const combinedDate = new Date(date);
        combinedDate.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
        console.log("Combined date and time:", combinedDate);
        return Timestamp.fromDate(combinedDate);

    }

    static async updateReminderStatus(taskId: string, status: string) {
        try {

            if (!taskId) throw new Error("Task ID is missing.");
            if (!status) throw new Error("Task status is missing.");

            const taskRef = doc(db, "reminders", taskId);
            const taskSnap = await getDoc(taskRef);

            if (!taskSnap.exists()) throw new Error(`Task with ID ${taskId} not found in Firestore!`);

            await setDoc(taskRef, { completeStatus: status }, { merge: true });
            const taskData = taskSnap.data();

            await UserStatsService.updateJogStatsToday(taskData.userId, { completeStatus: taskData.completeStatus });
            console.log("Task status updated successfully from" + taskSnap.data().completeStatus + " to " + status);


        } catch (error) {
            console.error("Error updating task status:", error);
        }
    }

    // For AI Jogs
    static async createReminder(reminder: Reminder) {
        try {
            if (!reminder) throw new Error("No reminder data provided.");

            console.log("Adding reminder:", reminder);

            const docRef = await addDoc(collection(db, "reminders"), reminder);
            await setDoc(docRef, { reminderId: docRef.id }, { merge: true });
            await UserStatsService.updateJogStatsToday(reminder.userId, reminder);

            console.log("Reminder added successfully with ID:", docRef.id);
        } catch (error) {
            console.error("Error adding reminder:", error);
        }
    }


    static async createRecurringTaskReminders(
        userId: string,
        taskDetails: any,
        date: Date,
        time: Date,
        repeatOption: "none" | "daily" | "weekly" | "hourly",
        reminderEnabled: boolean,
        selectedIntervals: number[],
    ) {
        if (!userId) throw new Error("No user ID provided.");
        if (!taskDetails) throw new Error("No task details provided.");

        console.log("🔁 Creating recurring task reminders:", taskDetails);

        const remindersToAdd: Reminder[] = [];
        let occurrences = repeatOption === "hourly" ? 24 :
            repeatOption === "daily" ? 7 :
                repeatOption === "weekly" ? 4 : 1;

        let currentDate = new Date(date);

        for (let i = 0; i < occurrences; i++) {
            let reminderDueDate = new Date(currentDate);
            let reminderRef = doc(collection(db, "reminders"));
            let reminderId = reminderRef.id;


            if (repeatOption === "hourly") reminderDueDate.setHours(date.getHours() + i);
            else if (repeatOption === "daily") reminderDueDate.setDate(date.getDate() + i);
            else if (repeatOption === "weekly") reminderDueDate.setDate(date.getDate() + i * 7);

            remindersToAdd.push({
                reminderId,
                userId,
                title: taskDetails.title,
                category: taskDetails.category,
                description: taskDetails.notes || null,
                repeatOption,
                completed: false,
                deleted: false,
                createdAt: Timestamp.fromDate(new Date()),
                completeStatus: "loading" as "loading" | "completedOnTime" | "completedLate" | "overdue" | "upcoming" | "incomplete",
                updatedAt: Timestamp.fromDate(new Date()),
                updateCount: 0,
                dueDate: await this.combineDateAndTime(reminderDueDate, time),
                reminderEnabled,
                reminderIntervals: reminderEnabled ? [{ intervals: selectedIntervals, hasTriggered: false, currentInterval: 0, countOfIntervals: selectedIntervals.length }] : null,
                isStepBased: false,
                isAI: false,

            });

            currentDate = new Date(reminderDueDate);
        }

        try {
            for (const reminder of remindersToAdd) {
                await ReminderService.addReminder(userId, reminder);
            }
            console.log("All recurring task reminders added successfully.");
        } catch (error) {
            console.error("Error saving recurring task reminders:", error);
        }
    }

    static async createRecurringMedicationReminders(
        userId: string,
        taskDetails: any,
        date: Date,
        doses: any[],
        repeatOption: "none" | "daily" | "weekly" | "hourly",
        reminderEnabled: boolean,
        selectedIntervals: number[],
    ) {
        if (!userId) throw new Error("No user ID provided.");
        if (!taskDetails || !doses || doses.length === 0) throw new Error("Invalid medication details provided.");

        console.log("💊 Creating recurring medication reminders:", taskDetails);

        // Determine the number of occurrences based on repeat option
        let occurrences = 1;
        if (repeatOption === "hourly") occurrences = 24;
        else if (repeatOption === "daily") occurrences = 7;
        else if (repeatOption === "weekly") occurrences = 4;

        const remindersToAdd: Reminder[] = [];

        let addedCount = 0;

        // Iterate through each dose and schedule reminders accordingly
        for (const dose of doses) {

            let reminderDueDate = new Date(date);


            for (let i = 0; i < occurrences; i++) {
                let reminderRef = doc(collection(db, "reminders"));
                let reminderId = reminderRef.id;

                if (repeatOption === "hourly") dose.time.setHours(date.getHours() + i);
                else if (repeatOption === "daily") reminderDueDate.setDate(date.getDate() + i);
                else if (repeatOption === "weekly") reminderDueDate.setDate(date.getDate() + i * 7);

                const combinedDueDate: Timestamp = await this.combineDateAndTime(reminderDueDate, dose.time);

                // Create a reminder for this specific dose at this time
                remindersToAdd.push({
                    reminderId: "",
                    userId,
                    title: taskDetails.title,
                    category: taskDetails.category,
                    description: taskDetails.notes || null,
                    repeatOption,
                    completed: false,
                    completeStatus: "loading" as "loading" | "completedOnTime" | "completedLate" | "overdue" | "upcoming" | "incomplete",
                    createdAt: Timestamp.fromDate(new Date()),
                    updatedAt: Timestamp.fromDate(new Date()),
                    deleted: false,
                    updateCount: 0,
                    dueDate: combinedDueDate,
                    reminderEnabled,
                    reminderIntervals: reminderEnabled ? [{ intervals: selectedIntervals, hasTriggered: false, currentInterval: 0, countOfIntervals: selectedIntervals.length }] : null,
                    doses: [{
                        id: dose.id,
                        name: taskDetails.medicationName,
                        dosage: taskDetails.dosage,
                        times: [{ time: combinedDueDate }]
                    }],
                    isStepBased: false,
                    isAI: false,

                });

                addedCount += 1;
            }
        }

        // Save all reminders in Firestore
        try {
            for (const reminder of remindersToAdd) {

                await ReminderService.addReminder(userId, reminder);
            }
            console.log("tadded", addedCount);
            console.log("All recurring medication reminders added successfully.");
        } catch (error) {
            console.error("Error saving recurring medication reminders:", error);
        }

    }

    static async createRecurringStepReminders(
        userId: string,
        date: Date,
        taskDetails: any,
        repeatOption: "none" | "daily" | "weekly" | "hourly",
        reminderEnabled: boolean,
        selectedIntervals: number[],
        steps: any[] | null,
        doses?: any[]
    ) {
        console.log("🚶‍♂️ Creating recurring step reminders:", taskDetails);

        if (!userId) throw new Error("No user ID provided.");
        if (!taskDetails || (!steps && !doses)) throw new Error("Invalid task details provided.");

        try {
            const remindersToAdd: Reminder[] = [];
            let occurrences =
                repeatOption === "hourly" ? 24 :
                    repeatOption === "daily" ? 7 :
                        repeatOption === "weekly" ? 4 : 1;

            let currentDate = new Date(date);

            for (let i = 0; i < occurrences; i++) {
                let reminderDueDate = new Date(currentDate); // Ensure a fresh date each iteration
                let reminderRef = doc(collection(db, "reminders"));
                let reminderId = reminderRef.id;

                // Handle Step-Based Reminders
                if (steps && steps.length > 0) {
                    const stepList = steps.map((step) => ({
                        id: step.id,
                        title: step.title,
                        completeStatus: "loading" as "loading" | "completedOnTime" | "completedLate" | "overdue" | "upcoming" | "incomplete",
                        dueDate: step.time
                            ? Timestamp.fromDate(new Date(reminderDueDate.setHours(step.time.getHours(), step.time.getMinutes())))
                            : Timestamp.fromDate(reminderDueDate),
                        completed: false,
                    }));

                    remindersToAdd.push({
                        reminderId,
                        userId,
                        title: taskDetails.title,
                        category: taskDetails.category || "General",
                        description: taskDetails.notes || null,
                        deleted: false,
                        repeatOption: repeatOption,
                        completed: false,
                        createdAt: Timestamp.fromDate(new Date()),
                        completeStatus: "loading" as "loading" | "completedOnTime" | "completedLate" | "overdue" | "upcoming" | "incomplete",
                        updatedAt: Timestamp.fromDate(new Date()),
                        updateCount: 0,
                        dueDate: Timestamp.fromDate(reminderDueDate),
                        reminderEnabled,
                        reminderIntervals: reminderEnabled
                            ? [{ intervals: selectedIntervals || [], hasTriggered: false, currentInterval: 0, countOfIntervals: (selectedIntervals?.length || 1) * (steps.length || 1) }]
                            : null,
                        isStepBased: steps.length > 1,
                        steps: stepList,
                        isAI: false,
                    });

                    console.log(`📌 Step-Based Reminder Added for ${reminderDueDate.toISOString()}`);
                }

                // Handle Dose-Based Reminders (Medication)
                if (doses && doses.length > 0) {
                    let doseReminderDueDate = new Date(reminderDueDate); // Fresh date for doses

                    const doseList = doses.map((dose) => ({
                        id: dose.id,
                        title: dose.title || "Unnamed Dose",
                        completed: false,
                        completeStatus: "loading" as "loading" | "completedOnTime" | "completedLate" | "overdue" | "upcoming" | "incomplete",
                        dueDate: dose.time
                            ? Timestamp.fromDate(new Date(doseReminderDueDate.setHours(dose.time.getHours(), dose.time.getMinutes())))
                            : Timestamp.fromDate(doseReminderDueDate),
                    }));

                    remindersToAdd.push({
                        reminderId,
                        userId,
                        title: taskDetails.title || "Unnamed Task",
                        category: taskDetails.category || "Medication",
                        description: taskDetails.notes || null,
                        deleted: false,
                        repeatOption: repeatOption,
                        completed: false,
                        createdAt: Timestamp.fromDate(new Date()),
                        completeStatus: "loading",
                        updatedAt: Timestamp.fromDate(new Date()),
                        updateCount: 0,
                        dueDate: Timestamp.fromDate(doseReminderDueDate),
                        reminderEnabled,
                        reminderIntervals: reminderEnabled
                            ? [{ intervals: selectedIntervals || [], hasTriggered: false, currentInterval: 0, countOfIntervals: (selectedIntervals?.length || 1) * (doses.length || 1) }]
                            : null,
                        isStepBased: doses.length > 1,
                        steps: doseList,
                        isAI: false,
                    });

                    console.log(`💊 Dose-Based Reminder Added for ${doseReminderDueDate.toISOString()}`);
                }

                // Increment date safely for next occurrence
                if (repeatOption === "hourly") currentDate.setHours(currentDate.getHours() + 1);
                else if (repeatOption === "daily") currentDate.setDate(currentDate.getDate() + 1);
                else if (repeatOption === "weekly") currentDate.setDate(currentDate.getDate() + 7);
            }

            console.log("Final Reminders to Add:", remindersToAdd);

            for (const reminder of remindersToAdd) {
                await ReminderService.addReminder(userId, reminder);
            }
            console.log("All recurring step & dose reminders added successfully.");
        } catch (error) {
            console.error(" Error saving recurring step reminders:", error);
        }
    }



    static async markTaskAsCompleted(taskId: string) {
        try {
            if (!taskId) throw new Error("Task ID is undefined!");

            // Fetch the task before updating
            const taskRef = doc(db, "reminders", taskId);
            const taskSnap = await getDoc(taskRef);

            if (!taskSnap.exists()) {
                throw new Error(`Task with ID ${taskId} not found in Firestore!`);
            }

            // Update task as completed
            await setDoc(taskRef, { completed: true, completedAt: Timestamp.now() }, { merge: true });

            await UserStatsService.updateJogStatsToday(taskSnap.data().userId, { completed: true });


            console.log("Task marked as completed:", taskId + "from " + taskSnap.data().reminderId);
        } catch (error) {
            console.error("Error marking task as completed:", error);
        }
    }

    static async markStepAsCompleted(taskId: string, stepId: string) {
        try {
            if (!taskId || !stepId) throw new Error("Task or step ID is missing.");

            // Fetch the task before updating
            const taskRef = doc(db, "reminders", taskId);
            const taskSnap = await getDoc(taskRef);
            if (!taskSnap.exists()) throw new Error(`Task with ID ${taskId} not found in Firestore!`);

            const stepIndex = taskSnap.data().steps.findIndex((step: any) => step.id === stepId);
            if (stepIndex === -1) throw new Error(`Step with ID ${stepId} not found in task ${taskId}!`);

            // Update the step as completed
            const steps = taskSnap.data().steps;
            steps[stepIndex] = { ...steps[stepIndex], completed: true };
            await setDoc(taskRef, { steps }, { merge: true });

            console.log("Step marked as completed: ", stepId + "from " + taskSnap.data().reminderId);

        }
        catch (error) {
            console.error("Error marking step as completed:", error);
        }
    }

    static async deleteReminder(reminderId: string) {
        try {
            if (!reminderId) throw new Error("No reminder ID provided.");

            const reminderRef = doc(db, "reminders", reminderId);

            const reminderSnap = await getDoc(reminderRef);

            if (!reminderSnap.exists()) throw new Error(`Reminder with ID ${reminderId} not found in Firestore!`);

            const userId = reminderSnap.data().userId;

            await setDoc(reminderRef, { deleted: true, timeDeleted: Timestamp.now() }, { merge: true });
            await UserStatsService.updateJogStatsToday(userId, { deleted: true });


            console.log("Reminder deleted successfully:", reminderId);
        } catch (error) {
            console.error("Error deleting reminder:", error);
        }
    }

    static async deleteStep(reminderId: string, stepId: string) {
        try {
            if (!reminderId || !stepId) throw new Error("Reminder or step ID is missing.");

            const reminderRef = doc(db, "reminders", reminderId);
            const reminderSnap = await getDoc(reminderRef);
            if (!reminderSnap.exists()) throw new Error(`Reminder with ID ${reminderId} not found in Firestore!`);

            const updatedSteps = reminderSnap.data().steps.filter((step: any) => step.id !== stepId);
            await setDoc(reminderRef, { steps: updatedSteps }, { merge: true });

            console.log("Step deleted successfully: ", stepId);
        } catch (error) {
            console.error("Error deleting step:", error);
        }
    }

}