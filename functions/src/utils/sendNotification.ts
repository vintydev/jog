

export interface NotificationPayload {
  to: string;
  sound?: string | null;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Sends a push notification to a device using Expo's Push API.
 *
 * @param {NotificationPayload} message - The notification payload to send.
 * @return {Promise<any>} A promise that resolves to the API response.
 */
export default async function sendNotification(message: NotificationPayload): Promise<any> {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify([message]),
    });

    const userId = message.data?.userId;
    if (!userId) {
      console.error("User ID is missing in the notification payload.");
      throw new Error("User ID is required to update notification interaction rate.");
    }

    const result = await response.json();
    console.log("Expo Notification Sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
}

