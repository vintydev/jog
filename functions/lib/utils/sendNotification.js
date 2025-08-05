"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        const userId = (_a = message.data) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            console.error("User ID is missing in the notification payload.");
            throw new Error("User ID is required to update notification interaction rate.");
        }
        const result = await response.json();
        console.log("Expo Notification Sent:", result);
        return result;
    }
    catch (error) {
        console.error("Error sending push notification:", error);
        throw error;
    }
}
exports.default = sendNotification;
//# sourceMappingURL=sendNotification.js.map