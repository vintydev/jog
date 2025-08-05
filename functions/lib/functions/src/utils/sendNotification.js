"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = require("firebase/firestore");
// eslint-disable-next-line import/no-relative-parent-imports
const FirebaseService_1 = require("../../../app/services/FirebaseService");
/**
 * Sends a push notification to a device using Expo's Push API.
 *
 * @param {NotificationPayload} message - The notification payload to send.
 * @return {Promise<any>} A promise that resolves to the API response.
 */
async function sendNotification(message) {
    var _a;
    try {
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([message]),
        });
        const result = await response.json();
        console.log("Expo Notification Sent:", result);
        // Firestore update: Increment notification total
        const userId = (_a = message.data) === null || _a === void 0 ? void 0 : _a.userId;
        if (userId) {
            const userStatsRef = (0, firestore_1.doc)(FirebaseService_1.db, "userStats", userId); // or "users" if it's in the main users collection
            await (0, firestore_1.updateDoc)(userStatsRef, {
                "appUsageStats.notificationInteractionRate.total": (0, firestore_1.increment)(1),
            });
            console.log(`Notification count incremented for user ${userId}`);
        }
        return result;
    }
    catch (error) {
        console.error("Error sending push notification:", error);
        throw error;
    }
}
exports.default = sendNotification;
//# sourceMappingURL=sendNotification.js.map