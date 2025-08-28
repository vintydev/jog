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
exports.verifyTestUserEmail = exports.sendMorningNotification = exports.updateNotificationInteractionRate = exports.sendQuestionnaireReminder = exports.updateStepCompletionStatus = exports.sendDueNowReminders = exports.updateUserStreaks = exports.setQuestionnaireIsReadyFalse = exports.sendTaskReminder = exports.updateIfOverdue = exports.updateIncompleteSteps = exports.deleteAuthUser = exports.updateReminderStatus = exports.markMissedReminders = exports.sendHourlyJogCreation = exports.sendQuestionnaireSetReminder = exports.deleteUserData = void 0;
const logger = __importStar(require("firebase-functions/logger"));
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const sendNotification_1 = __importDefault(require("./utils/sendNotification"));
admin.initializeApp();
const db = admin.firestore();
exports.deleteUserData = functions.auth.user().onDelete(async (user) => {
    const uid = user.uid;
    try {
        await db.collection("users").doc(uid).delete();
        await db.collection("userStats").doc(uid).delete();
        const remindersSnapshot = await db.collection("reminders").where("userId", "==", uid).get();
        const deletePromises = remindersSnapshot.docs.map((doc) => doc.ref.delete());
        await Promise.all(deletePromises);
        const conversationSnapshot = await db.collection("conversations").where("userId", "==", uid).get();
        const deleteConversationPromises = conversationSnapshot.docs.map((doc) => doc.ref.delete());
        await Promise.all(deleteConversationPromises);
        logger.info(`User data for user with uid ${uid} and stats has been deleted`);
    }
    catch (error) {
        logger.error(`Error deleting user data for user with uid ${uid}`, error);
    }
});
exports.sendQuestionnaireSetReminder = functions.pubsub
    .schedule("every day 10:00")
    .timeZone("Europe/London")
    .onRun(async () => {
    try {
        const userStatsSnapshot = await db.collection("userStats").get();
        if (userStatsSnapshot.empty) {
            console.log("No userStats documents found.");
            return null;
        }
        await Promise.all(userStatsSnapshot.docs.map(async (docSnap) => {
            var _a;
            const data = docSnap.data();
            const questionnaireTimeSet = (_a = data === null || data === void 0 ? void 0 : data.symptomStats) === null || _a === void 0 ? void 0 : _a.questionnaireTimeSet;
            if (questionnaireTimeSet === true) {
                console.log(`User ${docSnap.id} has already set their questionnaire time.`);
                return;
            }
            else {
                const userId = docSnap.id;
                const userRef = db.collection("users").doc(userId);
                const userSnapshot = await userRef.get();
                const userDoc = userSnapshot.data();
                if (!userDoc || !userDoc.expoPushToken) {
                    console.warn(`User not found or missing push token for user ${userId}`);
                    return;
                }
                const message = {
                    to: userDoc.expoPushToken,
                    sound: "default",
                    title: "Check-in Time Not Set!",
                    body: "Don't forget to set your check-in time! You can do this in settings.",
                    data: { type: "questionnaireSet", userId },
                };
                await (0, sendNotification_1.default)(message);
                await (0, exports.updateNotificationInteractionRate)(userId, "questionnaireSet");
            }
        }));
        console.log("Successfully sent questionnaire set reminders to users.");
    }
    catch (error) {
        console.error("Error sending questionnaire set reminders:", error);
    }
    return null;
});
exports.sendHourlyJogCreation = functions.pubsub
    .schedule("every hour")
    .timeZone("Europe/London")
    .onRun(async () => {
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour === 12 || currentHour === 15 || currentHour === 17) {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const startOfDayTimestamp = admin.firestore.Timestamp.fromDate(startOfDay);
        const db = admin.firestore();
        const usersSnapshot = await db.collection("users").get();
        const messages = [];
        for (const doc of usersSnapshot.docs) {
            const userId = doc.id;
            const userData = doc.data();
            if (!(userData === null || userData === void 0 ? void 0 : userData.expoPushToken) || (userData === null || userData === void 0 ? void 0 : userData.isFocusMode))
                continue;
            const remindersTodaySnap = await db
                .collection("reminders")
                .where("userId", "==", userId)
                .where("createdAt", ">=", startOfDayTimestamp)
                .where("deleted", "==", false)
                .limit(1)
                .get();
            if (remindersTodaySnap.empty) {
                messages.push({
                    to: userData.expoPushToken,
                    sound: "default",
                    title: "Stay Consistent!",
                    body: "You haven't planned a jog yet today. Add one now to stay on track!",
                    data: { type: "jogCreationReminder", userId },
                });
            }
        }
        for (const message of messages) {
            await (0, sendNotification_1.default)(message);
            await (0, exports.updateNotificationInteractionRate)(message.data.userId, "jogCreationReminder");
            console.log(`Sent jog creation reminder to ${message.data.userId}`);
        }
        console.log(`Hourly jog creation reminders sent to ${messages.length} users.`);
        return null;
    }
    else {
        console.log("Not the right hour for jog creation reminders. Skipping.");
        return null;
    }
});
exports.markMissedReminders = functions.pubsub
    .schedule("every day 23:59") // Runs at midnight
    .timeZone("Europe/London")
    .onRun(async () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of the day
    const yesterdayStart = new Date(today);
    yesterdayStart.setHours(0, 0, 0, 0); // Set to start of the day
    const startOfYesterday = admin.firestore.Timestamp.fromDate(yesterdayStart);
    const startOfToday = admin.firestore.Timestamp.fromDate(today);
    try {
        const overdueRemindersSnapshot = await db
            .collection("reminders")
            .where("completeStatus", "in", ["overdue", "upcoming"])
            .where("dueDate", ">=", startOfYesterday)
            .where("dueDate", "<", startOfToday)
            .get();
        if (overdueRemindersSnapshot.empty) {
            console.log("No overdue or upcoming reminders from yesterday to mark.");
            return;
        }
        const batch = db.batch();
        const userMissedCounts = {};
        overdueRemindersSnapshot.forEach((doc) => {
            const reminder = doc.data();
            batch.update(doc.ref, { completeStatus: "incomplete" });
            if (reminder.userId) {
                userMissedCounts[reminder.userId] = (userMissedCounts[reminder.userId] || 0) + 1;
            }
        });
        // Update each user's missed jog stats
        for (const userId of Object.keys(userMissedCounts)) {
            const userStatsRef = db.collection("userStats").doc(userId);
            batch.set(userStatsRef, {
                jogStats: {
                    jogCompletionRate: {
                        missedJogsTotal: admin.firestore.FieldValue.increment(userMissedCounts[userId]),
                    },
                },
            }, { merge: true });
        }
        await batch.commit();
        console.log("Marked missed reminders and updated user stats.");
    }
    catch (error) {
        console.error("Error marking missed reminders:", error);
    }
});
exports.updateReminderStatus = functions.firestore
    .document("reminders/{reminderId}")
    .onUpdate(async (change, context) => {
    if (!change.after.exists) {
        console.log("Document does not exist. Skipping update.");
        return null;
    }
    const today = new Date().toLocaleDateString("en-GB", {
        timeZone: "Europe/London",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
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
    const completedOnTime = reminder.completedAt &&
        reminder.completedAt.toMillis() <= dueDateMillis;
    if (reminder.completed) {
        newStatus = completedOnTime ? "completedOnTime" : "completedLate";
    }
    else if (dueDateMillis < nowMillis) {
        newStatus = "overdue";
    }
    // Only update if the status has changed
    if (reminder.completeStatus !== newStatus) {
        try {
            await db.collection("reminders").doc(context.params.reminderId).update({
                completeStatus: newStatus,
            });
            console.log(`Updated reminder ${context.params.reminderId} to status: ${newStatus}`);
            // Update UserStats based on new status
            const userStatsRef = db.collection("userStats").doc(reminder.userId);
            const batch = db.batch();
            const statFieldToIncrement = {
                completedOnTimeTotal: newStatus === "completedOnTime" ? 1 : 0,
                completedLateTotal: newStatus === "completedLate" ? 1 : 0,
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
                    },
                    dailyJogStats: {
                        [today]: {
                            jogCompletionRate: {
                                completedOnTimeTotal: admin.firestore.FieldValue.increment(statFieldToIncrement.completedOnTimeTotal),
                                completedLateTotal: admin.firestore.FieldValue.increment(statFieldToIncrement.completedLateTotal),
                            },
                        },
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
        await db.collection("reminders").doc(reminderId).update({
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
        const upcomingRemindersSnapshot = await db
            .collection("reminders")
            .where("completeStatus", "==", "upcoming")
            .get();
        if (upcomingRemindersSnapshot.empty) {
            console.log(" No upcoming reminders to update.");
            return null;
        }
        const batch = db.batch();
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
        const reminderSnapshot = await db
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
        const batch = db.batch();
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
                                    body: `Your jog "${reminder.title}" is due in ${interval} minutes! Complete it early in My Jogs.`,
                                    data: { reminderId: doc.id, userId: reminder.userId, type: "reminder" },
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
                                    if (reminder.category === "Medication") {
                                        messages.push({
                                            to: userDoc.expoPushToken,
                                            sound: "default",
                                            title: `${reminder.title}`,
                                            body: `Dose ${step.id} of ${reminder.steps.length} is due in ${interval} minutes! Complete it early in My Jogs.`,
                                            data: { reminderId: doc.id, stepId: step.id, userId: reminder.userId, type: "reminder" },
                                        });
                                    }
                                    else {
                                        messages.push({
                                            to: userDoc.expoPushToken,
                                            sound: "default",
                                            title: `${reminder.title}`,
                                            body: `Your step ${step.title} is due in ${interval} minutes! This reminder has ${intervalObj.countOfIntervals - intervalObj.currentInterval} steps left. Complete it early in My Jogs.`,
                                            data: { reminderId: doc.id, stepId: step.id, userId: reminder.userId, type: "reminder" },
                                        });
                                    }
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
            try {
                for (const message of messages) {
                    if (!message.data.userId) {
                        console.error("User ID is missing in the notification payload.");
                        continue;
                    }
                    await (0, sendNotification_1.default)(message);
                    await (0, exports.updateNotificationInteractionRate)(message.data.userId, "reminder");
                }
            }
            catch (error) {
                console.error("Error sending notifications:", error);
            }
            finally {
                console.log("All notifications sent successfully.");
            }
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
        const snapshot = await db.collection("userStats").get();
        if (snapshot.empty) {
            console.log("No userStats documents found.");
            return null;
        }
        const updatePromises = snapshot.docs.map(async (docSnap) => {
            var _a;
            const data = docSnap.data();
            const questionnaireReady = (_a = data === null || data === void 0 ? void 0 : data.symptomStats) === null || _a === void 0 ? void 0 : _a.questionnaireReady;
            if (questionnaireReady === true) {
                try {
                    await docSnap.ref.update({
                        "symptomStats.questionnaireReady": false,
                    });
                    console.log(`Reset questionnaireReady for ${docSnap.id}`);
                }
                catch (error) {
                    console.error(`Error updating userStats ${docSnap.id}:`, error);
                }
            }
        });
        await Promise.allSettled(updatePromises);
        console.log("Finished processing userStats for questionnaire reset.");
    }
    catch (error) {
        console.error("Unexpected error in setQuestionnaireIsReadyFalse:", error);
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
            const { completed } = userJogMap[userId];
            const userStatsRef = db.collection("userStats").doc(userId);
            const userStatsSnap = await userStatsRef.get();
            const userStats = userStatsSnap.exists ? userStatsSnap.data() : null;
            if (!userStats)
                continue;
            const current = (_b = (_a = userStats === null || userStats === void 0 ? void 0 : userStats.jogStats) === null || _a === void 0 ? void 0 : _a.currentStreak) !== null && _b !== void 0 ? _b : 0;
            const best = (_d = (_c = userStats === null || userStats === void 0 ? void 0 : userStats.jogStats) === null || _c === void 0 ? void 0 : _c.bestStreak) !== null && _d !== void 0 ? _d : 0;
            const completedAny = completed > 0;
            const newStats = {
                jogStats: {
                    currentStreak: completedAny ? current + 1 : 0,
                    previousStreak: current,
                    bestStreak: completedAny ? Math.max(current + 1, best) : best, // Finds the highest out of current or their best
                },
            };
            batch.set(userStatsRef, newStats, { merge: true });
            const userSnap = await db.collection("users").doc(userId).get();
            const userData = userSnap.data();
            if (!userData || !userData.expoPushToken || userData.isFocusMode)
                continue;
            const title = "🔥 Streak Update!";
            const body = completedAny ?
                `Nice work! You completed a jog today. Your current streak is now ${newStats.jogStats.currentStreak} days in a row.` :
                "You didn't complete any jogs today. Your streak has been reset.";
            notificationQueue.push({
                userId,
                token: userData.expoPushToken,
                title,
                body,
            });
        }
        await batch.commit();
        try {
            for (const msg of notificationQueue) {
                await (0, sendNotification_1.default)({
                    to: msg.token,
                    sound: "default",
                    title: msg.title,
                    body: msg.body,
                    data: { type: "streak", userId: msg.userId },
                });
                await (0, exports.updateNotificationInteractionRate)(msg.userId, "streak");
            }
        }
        catch (error) {
            console.error("Error sending notifications:", error);
        }
        console.log("Successfully updated streaks based on jog completions.");
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
        const reminderSnapshot = await db
            .collection("reminders")
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
            const userSnapshot = await db.collection("users").doc(reminder.userId).get();
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
                        title: `${reminder.title}`,
                        body: "Your jog is due now! Complete it in My Jogs.",
                        data: { reminderId, userId: reminder.userId, type: "reminder" },
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
                        if (reminder.category === "Medication") {
                            messages.push({
                                to: userDoc.expoPushToken,
                                sound: "default",
                                title: `${reminder.title}`,
                                body: `Dose ${step.id} of ${reminder.steps.length} is due now. Complete it in My Jogs`,
                                data: { reminderId, stepId: step.id, userId: reminder.userId, type: "reminder" },
                            });
                        }
                        else {
                            messages.push({
                                to: userDoc.expoPushToken,
                                sound: "default",
                                title: `${reminder.title}`,
                                body: `Step ${step.title} is due now! Complete it in My Jogs.`,
                                data: { reminderId, stepId: step.id, userId: reminder.userId, type: "reminder" },
                            });
                        }
                    }
                }
            }
        }
        if (messages.length > 0) {
            console.log("Sending due-now notifications:", messages.length);
            try {
                for (const message of messages) {
                    if (!message.data.userId) {
                        console.error("User ID is missing in the notification payload.");
                        continue;
                    }
                    await (0, sendNotification_1.default)(message);
                    await (0, exports.updateNotificationInteractionRate)(message.data.userId, "reminder");
                }
            }
            catch (error) {
                console.error("Error sending notifications:", error);
            }
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
    var _a, _b, _c, _d;
    const batch = db.batch();
    try {
        const userStatsSnapshot = await db.collection("userStats").get();
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
                console.log(`Skipping user ${data.userId || doc.id}: Questionnaire time not set.`);
                continue;
            }
            const questionnaireDate = questionnaireTime.toDate();
            // Convert both times to total minutes since midnight
            const questionnaireMinutes = questionnaireDate.getHours() * 60 + questionnaireDate.getMinutes();
            const nowDate = new Date();
            const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
            // Ensure it's exactly the scheduled minute
            const isWithinWindow = nowMinutes === questionnaireMinutes;
            const todayKey = new Date().toLocaleDateString("en-GB", { timeZone: "Europe/London" });
            const alreadyCompleted = ((_d = (_c = symptomStats === null || symptomStats === void 0 ? void 0 : symptomStats.dailyLogs) === null || _c === void 0 ? void 0 : _c[todayKey]) === null || _d === void 0 ? void 0 : _d.completed) === true;
            if (!isWithinWindow || alreadyCompleted) {
                // Skip if outside the time window or already completed
                console.log(`Skipping user ${data.userId || doc.id}: ${!isWithinWindow ? "Outside time window" : "Already completed at time"}`);
                console.log(`User ${data.userId || doc.id}: questionnaireTimeSet=${questionnaireTimeSet} | alreadyCompleted=${alreadyCompleted} time window=${isWithinWindow} | questionnaireTime=${questionnaireTime.toDate()} | now=${nowDate} | questionnaireMinutes=${questionnaireMinutes} | nowMinutes=${nowMinutes}`);
                if (alreadyCompleted) {
                    console.log(`User ${data.userId || doc.id}: Already completed questionnaire today.`);
                }
                continue;
            }
            const userSnap = await db.collection("users").doc(data.userId).get();
            const userData = userSnap.data();
            if (!(userData === null || userData === void 0 ? void 0 : userData.expoPushToken)) {
                console.log(`User ${data.userId}: No expo token`);
                continue;
            }
            try {
                if (userData.isFocusMode) {
                    console.log(`User ${data.userId} Notification: Skipped due to Focus Mode. Will still update stats.`);
                }
                else {
                    await (0, sendNotification_1.default)({
                        to: userData.expoPushToken,
                        sound: "default",
                        title: "Your Daily Check-in is ready!",
                        body: "Reflect on your day and track how you're feeling today.",
                        data: { type: "questionnaireReady", userId: data.userId },
                    });
                    await (0, exports.updateNotificationInteractionRate)(data.userId, "questionnaireReady");
                    console.log(`Sent questionnaire reminder to ${data.userId}`);
                }
            }
            catch (err) {
                console.error(`Failed to send notification to ${data.userId}:`, err);
                continue;
            }
            batch.set(db.collection("userStats").doc(data.userId), {
                symptomStats: {
                    questionnaireReady: true,
                    lastQuestionnaireTime: admin.firestore.FieldValue.serverTimestamp(),
                },
            }, { merge: true });
        }
        await batch.commit();
        console.log("Batch committed successfully.");
        return null;
    }
    catch (error) {
        console.error("Error sending questionnaire reminders:", error);
        return null;
    }
});
// Helper functions
/**
 * Update user's notification interaction stats.
 * @param {string} userId  - User's Firestore UID.
 * @param {string} type - Type of interaction (e.g., "reminder", "morningReminder").
 * @return {Promise<void>} - A promise that resolves when the update is complete.
 */
const updateNotificationInteractionRate = async (userId, type) => {
    const userStatsRef = db.collection("userStats").doc(userId);
    try {
        await userStatsRef.set({
            appUsageStats: {
                notificationInteractionRate: {
                    [type]: {
                        total: admin.firestore.FieldValue.increment(1),
                    },
                    totalNotificationsSent: admin.firestore.FieldValue.increment(1),
                },
            },
        }, { merge: true });
        console.log(`Incremented notificationInteractionRate. for ${userId}`);
    }
    catch (err) {
        console.error(`Failed to update interaction rate for ${userId}:`, err);
    }
};
exports.updateNotificationInteractionRate = updateNotificationInteractionRate;
exports.sendMorningNotification = functions.pubsub
    .schedule("every day 08:00")
    .timeZone("Europe/London")
    .onRun(async () => {
    const usersRef = db.collection("users");
    const goodMorningMessages = [
        "Try starting your day with a jog!",
        "Time for a jog?",
        "How about a jog to kickstart your day?",
        "In a rush? Why not use AI to plan your jogs today!",
        "Try planning ahead with the manual planner!",
        "Don't forget to plan your jogs for today!",
        "What's your plans for today? Add them to jog!",
    ];
    const randomMessage = goodMorningMessages[Math.floor(Math.random() * goodMorningMessages.length)];
    try {
        const usersSnapshot = await usersRef.where("expoPushToken", "!=", null).get();
        if (usersSnapshot.empty) {
            console.log("No users with expoPushToken found.");
            return;
        }
        const messages = [];
        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.expoPushToken) {
                messages.push({
                    to: userData.expoPushToken,
                    sound: "default",
                    title: "Good Morning!",
                    body: `${randomMessage}`,
                    data: { type: "morningReminder", userId: doc.id },
                });
            }
        });
        // Send notifications
        for (const message of messages) {
            await (0, sendNotification_1.default)(message);
            await (0, exports.updateNotificationInteractionRate)(message.data.userId, "morningReminder");
            console.log(`Sent morning notification to ${message.data.userId}`);
        }
        console.log("Morning notifications sent successfully.");
    }
    catch (error) {
        console.error("Error sending morning notifications:", error);
    }
    return null;
});
exports.verifyTestUserEmail = functions.https.onCall(async (data) => {
    const { uid, email } = data;
    try {
        // Get user by UID or email
        let userRecord;
        if (uid) {
            userRecord = await admin.auth().getUser(uid);
        }
        else if (email) {
            userRecord = await admin.auth().getUserByEmail(email);
        }
        else {
            throw new Error("Must provide either uid or email.");
        }
        // Update emailVerified status
        await admin.auth().updateUser(userRecord.uid, {
            emailVerified: true,
        });
        return { success: true, message: `User ${userRecord.uid} email marked as verified.` };
    }
    catch (error) {
        console.error("Failed to verify user email:", error);
        return { success: false, message: error instanceof Error ? error.message : String(error) };
    }
});
//# sourceMappingURL=index.js.map