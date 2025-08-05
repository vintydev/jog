"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
async function sendNotification(message) {
    try {
        const response = await (0, node_fetch_1.default)("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([message]),
        });
        const result = await response.json();
        console.log("Expo Notification Sent:", result);
        return result;
    }
    catch (error) {
        console.error("Error sending push notification:", error);
        throw error;
    }
}
exports.sendNotification = sendNotification;
//# sourceMappingURL=sendNotification.js.map