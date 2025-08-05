"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendQuestionnaireReminder = exports.updateStepCompletionStatus = exports.sendDueNowReminders = exports.updateUserStreaks = exports.setQuestionnaireIsReadyFalse = exports.sendTaskReminder = exports.updateIfOverdue = exports.updateIncompleteSteps = exports.deleteAuthUser = exports.updateReminderStatus = exports.markMissedReminders = exports.deleteUserData = exports.db = void 0;
const logger = __importStar(require("firebase-functions/logger"));
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const sendNotification_1 = __importDefault(require("./utils/sendNotification"));
admin.initializeApp();
exports.db = admin.firestore();
exports.deleteUserData = functions.auth.user().onDelete(async (user) => {
    const uid = user.uid;
    try {
        await exports.db.collection("users").doc(uid).delete();
        logger.info(`User data for user with uid ${uid} has been deleted`);
    }
    catch (error) {
        logger.error(`Error deleting user data for user with uid ${uid}`, error);
    }
});
exports.markMissedReminders = functions.pubsub
    .schedule("every day 00:00") // Runs at midnight
    .timeZone("Europe/London")
    .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const nowDate = new Date(now.toMillis());
    nowDate.setHours(0, 0, 0, 0);
    try {
        const overdueRemindersSnapshot = await exports.db
            .collection("reminders")
            .where("completeStatus", "in", ["overdue", "upcoming"])
            .get();
        if (overdueRemindersSnapshot.empty) {
            console.log("No overdue or upcoming reminders to mark as incomplete.");
            return;
        }
        const batch = exports.db.batch();
        const userMissedCounts = {};
        overdueRemindersSnapshot.forEach((doc) => {
            const reminder = doc.data();
            const dueDate = reminder.dueDate.toMillis();
            if (dueDate < nowDate.getTime()) {
                batch.update(doc.ref, { completeStatus: "incomplete" });
                // Track the count of missed reminders per user
                if (reminder.userId) {
                    if (!userMissedCounts[reminder.userId]) {
                        userMissedCounts[reminder.userId] = 0;
                    }
                    userMissedCounts[reminder.userId]++;
                }
            }
        });
        // Increment missed jogs in user stats
        for (const userId of Object.keys(userMissedCounts)) {
            const userStatsRef = exports.db.collection("userStats").doc(userId);
            batch.set(userStatsRef, {
                jogStats: {
                    jogCompletionRate: {
                        missedJogsTotal: admin.firestore.FieldValue.increment(userMissedCounts[userId]),
                    },
                },
            }, { merge: true });
        }
        await batch.commit();
        console.log("Marked overdue/upcoming reminders as incomplete and updated user stats.");
    }
    catch (error) {
        console.error("Error updating missed reminders:", error);
    }
});
exports.updateReminderStatus = functions.firestore
    .document("reminders/{reminderId}")
    .onUpdate(async (change, context) => {
    if (!change.after.exists) {
        console.log("Document does not exist. Skipping update.");
        return null;
    }
    const reminder = change.after.data();
    const previousReminder = change.before.data();
    if (!reminder || !previousReminder)
        return null;
    console.log("Document exists, processing update...");
    const now = admin.firestore.Timestamp.now();
    const dueDate = reminder.dueDate;
    if (!dueDate)
        return;
    let newStatus = "upcoming";
    const dueDateMillis = dueDate.toMillis();
    const nowMillis = now.toMillis();
    const dueDateObj = new Date(dueDateMillis);
    const nowDateObj = new Date(nowMillis);
    const isNewDay = nowDateObj.getFullYear() > dueDateObj.getFullYear() ||
        nowDateObj.getMonth() > dueDateObj.getMonth() ||
        nowDateObj.getDate() > dueDateObj.getDate();
    const completedOnTime = reminder.completedAt &&
        reminder.completedAt.toMillis() <= dueDateMillis;
    if (reminder.completed) {
        newStatus = completedOnTime ? "completedOnTime" : "completedLate";
    }
    else if (isNewDay) {
        newStatus = "incomplete";
    }
    else if (dueDateMillis < nowMillis) {
        newStatus = "overdue";
    }
    // Only update if the status has changed
    if (reminder.completeStatus !== newStatus) {
        try {
            await exports.db.collection("reminders").doc(context.params.reminderId).update({
                completeStatus: newStatus,
            });
            console.log(`Updated reminder ${context.params.reminderId} to status: ${newStatus}`);
            // Update UserStats based on new status
            const userStatsRef = exports.db.collection("userStats").doc(reminder.userId);
            const batch = exports.db.batch();
            const statFieldToIncrement = {
                completedOnTimeTotal: newStatus === "completedOnTime" ? 1 : 0,
                completedLateTotal: newStatus === "completedLate" ? 1 : 0,
                missedJogsTotal: newStatus === "incomplete" ? 1 : 0,
            };
            // Remove the previous status from stats (only if it was tracked before)
            if (previousReminder.completeStatus && previousReminder.userId === reminder.userId) {
                statFieldToIncrement[previousReminder.completeStatus] = -1;
            }
            batch.set(userStatsRef, {
                jogStats: {
                    jogCompletionRate: {
                        completedOnTimeTotal: admin.firestore.FieldValue.increment(statFieldToIncrement.completedOnTimeTotal),
                        completedLateTotal: admin.firestore.FieldValue.increment(statFieldToIncrement.completedLateTotal),
                        missedJogsTotal: admin.firestore.FieldValue.increment(statFieldToIncrement.missedJogsTotal),
                    },
                },
            }, { merge: true });
            await batch.commit();
            console.log(`Updated UserStats for user ${reminder.userId}`);
        }
        catch (error) {
            console.error(`Error updating reminder status for ${context.params.reminderId}:`, error);
        }
    }
    return;
});
exports.deleteAuthUser = functions.firestore
    .document("users/{userId}")
    .onDelete(async (snap, context) => {
    const uid = context.params.userId;
    try {
        await admin.auth().deleteUser(uid);
        logger.info(`Auth user with uid ${uid} has been deleted`);
    }
    catch (error) {
        logger.error(`Error deleting auth user with uid ${uid}`, error);
    }
});
exports.updateIncompleteSteps = functions.firestore
    .document("reminders/{reminderId}")
    .onUpdate(async (change, context) => {
    const reminderId = context.params.reminderId;
    const before = change.before.data();
    const after = change.after.data();
    // Only proceed if the completeStatus changed to "incomplete"
    if (before.completeStatus === "incomplete" || after.completeStatus !== "incomplete") {
        return null;
    }
    if (!after.steps || !Array.isArray(after.steps)) {
        console.log(` Reminder ${reminderId} has no steps array or is not structured correctly.`);
        return null;
    }
    console.log(` Updating steps for incomplete reminder: ${reminderId}`);
    // Update each step's completion status
    const updatedSteps = after.steps.map((step) => (Object.assign(Object.assign({}, step), { completed: false, completeStatus: "incomplete" })));
    // Write updated steps array back to Firestore
    try {
        await exports.db.collection("reminders").doc(reminderId).update({
            steps: updatedSteps,
        });
        console.log(` Successfully updated steps for incomplete reminder: ${reminderId}`);
    }
    catch (error) {
        console.error(` Error updating steps for incomplete reminder ${reminderId}:`, error);
    }
    return null;
});
// TODO: Implement a minute before dueDate for accuracy
exports.updateIfOverdue = functions.pubsub
    .schedule("every 1 minutes")
    .timeZone("Europe/London")
    .onRun(async () => {
    const nowMillis = admin.firestore.Timestamp.now().toMillis();
    try {
        // Fetch only "upcoming" reminders
        const upcomingRemindersSnapshot = await exports.db
            .collection("reminders")
            .where("completeStatus", "==", "upcoming")
            .get();
        if (upcomingRemindersSnapshot.empty) {
            console.log(" No upcoming reminders to update.");
            return null;
        }
        const batch = exports.db.batch();
        let updatedCount = 0;
        upcomingRemindersSnapshot.forEach((doc) => {
            const reminder = doc.data();
            if (!reminder.dueDate || !reminder.dueDate.toMillis) {
                console.warn(`Reminder ${doc.id} is missing or has invalid dueDate. Skipping.`);
                return;
            }
            const dueDateMillis = reminder.dueDate.toMillis();
            if (dueDateMillis < (nowMillis - 60000)) { // 1 minute before dueDate for accuracy
                batch.update(doc.ref, { completeStatus: "overdue" });
                updatedCount++;
            }
        });
        if (updatedCount > 0) {
            await batch.commit();
            console.log(`Successfully marked ${updatedCount} reminders as overdue.`);
        }
        else {
            console.log("No reminders needed updating.");
        }
    }
    catch (error) {
        console.error("Error updating overdue reminders:", error);
    }
    return null;
});
exports.sendTaskReminder = functions.pubsub
    .schedule("every 1 minutes")
    .timeZone("Europe/London")
    .onRun(async () => {
    console.log("Checking for due reminders...");
    const nowDate = new Date();
    const startOfDay = new Date(nowDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(nowDate.setHours(23, 59, 59, 999));
    const now = admin.firestore.Timestamp.fromDate(new Date());
    try {
        const reminderSnapshot = await exports.db
            .collection("reminders")
            .where("reminderEnabled", "==", true)
            .where("completeStatus", "==", "upcoming")
            .where("dueDate", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
            .where("dueDate", "<=", admin.firestore.Timestamp.fromDate(endOfDay))
            .where("deleted", "==", false)
            .get();
        if (reminderSnapshot.empty) {
            console.log("No reminders due at this time.");
            return null;
        }
        console.log(`Found ${reminderSnapshot.size} due reminders.`);
        const messages = [];
        const batch = exports.db.batch();
        for (const doc of reminderSnapshot.docs) {
            const reminder = doc.data();
            console.log(`Processing reminder: ${doc.id} - ${reminder.title}`);
            // Fetch user data only once per reminder
            const userRef = admin.firestore().collection("users").doc(reminder.userId);
            const userSnapshot = await userRef.get();
            const userDoc = userSnapshot.data();
            if (userDoc === null || userDoc === void 0 ? void 0 : userDoc.isFocusMode) {
                console.warn(`User is in focus mode; not sending reminder ${doc.id}`);
                continue;
            }
            if (!userDoc || !userDoc.expoPushToken) {
                console.warn(`User not found or missing push token for reminder ${doc.id}`);
                continue;
            }
            const dueDate = reminder.dueDate.toDate();
            const nowDate = new Date(now.toMillis());
            let shouldSendNotification = false;
            // Process normal reminders
            if (reminder.reminderIntervals && Array.isArray(reminder.reminderIntervals) && !reminder.isStepBased) {
                for (const intervalObj of reminder.reminderIntervals) {
                    if (!intervalObj || !Array.isArray(intervalObj.intervals))
                        continue;
                    for (const interval of intervalObj.intervals) {
                        const notificationTime = new Date(dueDate);
                        notificationTime.setMinutes(dueDate.getMinutes() - interval - 1); // Adjust time for accuracy
                        const diffInMinutes = Math.floor((nowDate.getTime() - notificationTime.getTime()) / (1000 * 60));
                        console.log(`diffInMinutes: normal - ${diffInMinutes}`);
                        if ((diffInMinutes === 0 && (intervalObj.currentInterval || 0) < (intervalObj.countOfIntervals || 0))) {
                            shouldSendNotification = true;
                            intervalObj.currentInterval = (intervalObj.currentInterval || 0) + 1;
                            console.log(`Sending notification for reminder ${doc.id} at interval ${interval} minutes. Current interval: ${intervalObj.currentInterval}/${intervalObj.countOfIntervals}`);
                            if (intervalObj.currentInterval >= intervalObj.countOfIntervals) {
                                intervalObj.hasTriggered = true;
                            }
                            if (shouldSendNotification) {
                                messages.push({
                                    to: userDoc.expoPushToken,
                                    sound: "default",
                                    title: `jog: ${reminder.title}`,
                                    body: `Your jog "${reminder.title}" is due in ${interval} minutes! Let's go!`,
                                    data: { reminderId: doc.id, userId: reminder.userId },
                                });
                            }
                        }
                    }
                }
            }
            // Process step-based reminders
            if (reminder.isStepBased && reminder.steps && Array.isArray(reminder.steps)) {
                for (const step of reminder.steps) {
                    if (step.completed)
                        continue;
                    const stepDueDate = step.dueDate.toDate();
                    let shouldSendStepNotification = false;
                    for (const intervalObj of reminder.reminderIntervals || []) {
                        if (!intervalObj || !Array.isArray(intervalObj.intervals) || intervalObj.hasTriggered)
                            continue;
                        for (const interval of intervalObj.intervals) {
                            const stepNotificationTime = new Date(stepDueDate);
                            stepNotificationTime.setMinutes(stepDueDate.getMinutes() - interval);
                            const diffInMinutes = Math.floor((nowDate.getTime() - stepNotificationTime.getTime()) / (1000 * 60));
                            console.log(`diffInMinutes: step - ${diffInMinutes}`);
                            if (diffInMinutes === 0 && intervalObj.currentInterval < intervalObj.countOfIntervals) {
                                intervalObj.currentInterval += 1;
                                shouldSendStepNotification = true;
                                console.log(`Sending step notification for reminder ${doc.id} at interval ${interval} minutes. Current interval: ${intervalObj.currentInterval}`);
                                if (intervalObj.currentInterval >= intervalObj.countOfIntervals) {
                                    intervalObj.hasTriggered = true;
                                }
                                if (shouldSendStepNotification) {
                                    messages.push({
                                        to: userDoc.expoPushToken,
                                        sound: "default",
                                        title: `Step: ${step.title} of Reminder: ${reminder.title}`,
                                        body: `This step is due in ${interval} minutes!\nThis reminder has ${intervalObj.countOfIntervals - intervalObj.currentInterval} steps left.`,
                                        data: { reminderId: doc.id, stepId: step.id, userId: reminder.userId },
                                    });
                                }
                            }
                        }
                    }
                }
            }
            if (!shouldSendNotification && !reminder.isStepBased) {
                console.log(`Skipping reminder ${doc.id} as it's not in its notification window.`);
                continue;
            }
            batch.update(doc.ref, { reminderIntervals: reminder.reminderIntervals });
        }
        if (messages && messages.length > 0) {
            console.log("Sending notifications:", JSON.stringify(messages, null, 2));
            const response = await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(messages),
            });
            const result = await response.json();
            console.log("Expo Push API Response:", JSON.stringify(result, null, 2));
            await batch.commit();
        }
        else {
            console.log("No valid push notifications to send.");
        }
        return null;
    }
    catch (error) {
        console.error("Error in sendTaskReminder function:", error);
    }
    return null;
});
exports.setQuestionnaireIsReadyFalse = functions.pubsub
    .schedule("every day 00:00")
    .timeZone("Europe/London")
    .onRun(async () => {
    try {
        const userStatsSnapshot = await exports.db
            .collection("userStats")
            .where("symptomStats.questionnaireReady", "==", true)
            .get();
        if (userStatsSnapshot.empty) {
            console.log("No users with questionnaireReady === true.");
            return null;
        }
        const batch = exports.db.batch();
        userStatsSnapshot.forEach((doc) => {
            batch.update(doc.ref, {
                "symptomStats.questionnaireReady": false,
            });
        });
        await batch.commit();
        console.log(`Updated questionnaireReady to false for ${userStatsSnapshot.size} users.`);
    }
    catch (error) {
        console.error("Error updating questionnaireReady:", error);
    }
    return null;
});
exports.updateUserStreaks = functions.pubsub
    .schedule("every day 23:58")
    .timeZone("Europe/London")
    .onRun(async () => {
    var _a, _b, _c, _d;
    const db = admin.firestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = admin.firestore.Timestamp.fromDate(today);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    const endOfDayTimestamp = admin.firestore.Timestamp.fromDate(endOfDay);
    try {
        const reminderSnapshot = await db
            .collection("reminders")
            .where("dueDate", ">=", startOfDay)
            .where("dueDate", "<=", endOfDayTimestamp)
            .where("deleted", "==", false)
            .get();
        if (reminderSnapshot.empty) {
            console.log("No jogs found for today.");
            return null;
        }
        // Group reminders by userId
        const userJogMap = {};
        reminderSnapshot.forEach((doc) => {
            const data = doc.data();
            const userId = data.userId;
            if (!userId)
                return;
            if (!userJogMap[userId]) {
                userJogMap[userId] = { total: 0, completed: 0 };
            }
            userJogMap[userId].total++;
            if (["completedOnTime", "completedLate"].includes(data.completeStatus)) {
                userJogMap[userId].completed++;
            }
        });
        const batch = db.batch();
        const notificationQueue = [];
        for (const userId of Object.keys(userJogMap)) {
            const { total, completed } = userJogMap[userId];
            const completedAll = total > 0 && total === completed;
            const userStatsRef = db.collection("userStats").doc(userId);
            const userStatsSnap = await userStatsRef.get();
            const userStats = userStatsSnap.exists ? userStatsSnap.data() : null;
            if (!userStats)
                continue;
            const current = (_b = (_a = userStats === null || userStats === void 0 ? void 0 : userStats.jogStats) === null || _a === void 0 ? void 0 : _a.currentStreak) !== null && _b !== void 0 ? _b : 0;
            const best = (_d = (_c = userStats === null || userStats === void 0 ? void 0 : userStats.jogStats) === null || _c === void 0 ? void 0 : _c.bestStreak) !== null && _d !== void 0 ? _d : 0;
            const newStats = {
                jogStats: {
                    currentStreak: completedAll ? current + 1 : 0,
                    previousStreak: current,
                    bestStreak: completedAll ? Math.max(current + 1, best) : best,
                },
            };
            batch.set(userStatsRef, newStats, { merge: true });
            const userSnap = await db.collection("users").doc(userId).get();
            const userData = userSnap.data();
            if (!userData || !userData.expoPushToken || userData.isFocusMode)
                continue;
            const title = "Streak Update!";
            const body = completedAll ?
                `You completed all your jogs today! Your current streak is now ${newStats.jogStats.currentStreak} days in a row!` :
                `You missed a jog today. Your streak is now ${newStats.jogStats.currentStreak}.`;
            notificationQueue.push({
                userId,
                token: userData.expoPushToken,
                title,
                body,
            });
        }
        // Commit after all sets
        await batch.commit();
        // Then send all notifications
        for (const msg of notificationQueue) {
            await (0, sendNotification_1.default)({
                to: msg.token,
                sound: "default",
                title: msg.title,
                body: msg.body,
                data: { type: "streak", userId: msg.userId },
            });
        }
        console.log("Successfully updated streaks for all users.");
    }
    catch (error) {
        console.error("Error updating user streaks:", error);
    }
    return null;
});
exports.sendDueNowReminders = functions.pubsub
    .schedule("every 1 minutes")
    .timeZone("Europe/London")
    .onRun(async () => {
    console.log("Checking for reminders due now...");
    const nowDate = new Date();
    const nowMinutes = Math.floor(nowDate.getTime() / 60000);
    try {
        const reminderSnapshot = await exports.db
            .collection("reminders")
            .where("reminderEnabled", "==", true)
            .where("completeStatus", "==", "upcoming")
            .where("deleted", "==", false)
            .get();
        if (reminderSnapshot.empty) {
            console.log("No upcoming reminders found.");
            return null;
        }
        const messages = [];
        for (const doc of reminderSnapshot.docs) {
            const reminder = doc.data();
            const reminderId = doc.id;
            const userSnapshot = await exports.db.collection("users").doc(reminder.userId).get();
            const userDoc = userSnapshot.data();
            if (!userDoc || userDoc.isFocusMode || !userDoc.expoPushToken) {
                console.warn(`Skipping ${reminderId} - User invalid or in focus mode.`);
                continue;
            }
            // Due now check for normal reminder
            if (!reminder.isStepBased) {
                const dueDate = reminder.dueDate.toDate();
                const dueMinutes = Math.floor(dueDate.getTime() / 60000);
                if (dueMinutes === nowMinutes) {
                    console.log(`Reminder ${reminderId} is due now.`);
                    messages.push({
                        to: userDoc.expoPushToken,
                        sound: "default",
                        title: `Jog: ${reminder.title}`,
                        body: `Your jog "${reminder.title}" is due now!`,
                        data: { reminderId },
                    });
                }
            }
            // Due now check for step-based
            if (reminder.isStepBased && Array.isArray(reminder.steps)) {
                for (const step of reminder.steps) {
                    if (step.completed)
                        continue;
                    const stepDueDate = step.dueDate.toDate();
                    const stepDueMinutes = Math.floor(stepDueDate.getTime() / 60000);
                    if (stepDueMinutes === nowMinutes) {
                        console.log(`Step ${step.id} of reminder ${reminderId} is due now.`);
                        messages.push({
                            to: userDoc.expoPushToken,
                            sound: "default",
                            title: `Step: ${step.title} of jog: ${reminder.title}`,
                            body: "This step is due now.",
                            data: { reminderId, stepId: step.id },
                        });
                    }
                }
            }
        }
        if (messages.length > 0) {
            console.log("Sending due-now notifications:", messages.length);
            const response = await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(messages),
            });
            const result = await response.json();
            console.log("Expo Push API Response:", JSON.stringify(result, null, 2));
        }
        else {
            console.log("No reminders matched current time exactly.");
        }
        return null;
    }
    catch (error) {
        console.error("Error in sendDueNowReminders:", error);
        return null;
    }
});
exports.updateStepCompletionStatus = functions.firestore
    .document("reminders/{reminderId}")
    .onUpdate(async (change, context) => {
    const reminderId = context.params.reminderId;
    const after = change.after.data();
    if (!after || !after.steps || !Array.isArray(after.steps)) {
        console.log(`Reminder ${reminderId} has no steps array or is not structured correctly.`);
        return null;
    }
    // Ensure we're only updating when the reminder is completed
    if (after.completeStatus !== "completedOnTime" && after.completeStatus !== "completedLate") {
        console.log(`Reminder ${reminderId} is not completed yet. Skipping step update.`);
        return null;
    }
    console.log(`Updating steps for reminder: ${reminderId}`);
    const reminderCompletionTime = after.completedAt.toMillis();
    // Update each step's completion status
    const updatedSteps = after.steps.map((step) => {
        if (!step.dueDate)
            return step; // Skip if no dueDate
        const stepDueTime = step.dueDate.toMillis();
        const stepCompletedOnTime = reminderCompletionTime <= stepDueTime;
        return Object.assign(Object.assign({}, step), { completed: true, completeStatus: stepCompletedOnTime ? "completedOnTime" : "completedLate" });
    });
    // Write updated steps array back to Firestore
    try {
        await admin.firestore().collection("reminders").doc(reminderId).update({
            steps: updatedSteps,
        });
        console.log(`Successfully updated steps for reminder: ${reminderId}`);
    }
    catch (error) {
        console.error(`Error updating steps for reminder ${reminderId}:`, error);
    }
    return null;
});
// Send questionnaire reminder to users at a specific time
exports.sendQuestionnaireReminder = functions.pubsub
    .schedule("every 1 minutes")
    .timeZone("Europe/London")
    .onRun(async () => {
    var _a, _b;
    const now = new Date();
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();
    const batch = exports.db.batch();
    try {
        const userStatsSnapshot = await exports.db.collection("userStats").get();
        if (userStatsSnapshot.empty) {
            console.log("No user stats found.");
            return null;
        }
        for (const doc of userStatsSnapshot.docs) {
            const data = doc.data();
            const symptomStats = data.symptomStats;
            const questionnaireTime = (_a = symptomStats === null || symptomStats === void 0 ? void 0 : symptomStats.questionnaireTime) !== null && _a !== void 0 ? _a : null;
            const questionnaireTimeSet = (_b = symptomStats === null || symptomStats === void 0 ? void 0 : symptomStats.questionnaireTimeSet) !== null && _b !== void 0 ? _b : false;
            if (!questionnaireTime || !questionnaireTimeSet) {
                continue;
            }
            const questionnaireDate = questionnaireTime.toDate();
            const isWithinWindow = Math.abs(nowHours * 60 + nowMinutes - (questionnaireDate.getHours() * 60 + questionnaireDate.getMinutes())) <= 1;
            if (isWithinWindow && !symptomStats.questionnaireReady) {
                // Get the user document
                const userSnap = await exports.db.collection("users").doc(data.userId).get();
                const userData = userSnap.data();
                if (!(userData === null || userData === void 0 ? void 0 : userData.expoPushToken)) {
                    console.log(`Missing Expo token for user ${data.userId}`);
                    continue;
                }
                if (userData.isFocusMode) {
                    console.log(`User ${data.userId} is in Focus Mode. Skipping reminder.`);
                    continue;
                }
                console.log(`Sending questionnaire reminder to user ${data.userId}`);
                // Send the push notification
                await (0, sendNotification_1.default)({
                    to: userData.expoPushToken,
                    sound: "default",
                    title: "Your Daily Check-in is ready!",
                    body: "Reflect on your day and track how you're feeling today.",
                    data: { type: "questionnaire", userId: data.userId },
                });
                // Update userStats to mark the questionnaire as ready
                batch.set(exports.db.collection("userStats").doc(data.userId), {
                    symptomStats: {
                        questionnaireReady: true,
                    },
                }, { merge: true });
                console.log(`Questionnaire reminder sent to user ${data.userId}`);
            }
        }
        await batch.commit();
        return null;
    }
    catch (error) {
        console.error("Error sending questionnaire reminders:", error);
    }
    return null;
});
//# sourceMappingURL=index.js.map