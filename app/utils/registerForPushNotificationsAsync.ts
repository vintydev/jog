import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {

    // Check if the app is running on an Android device
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", { // Assign a channel to the notification
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }

    // Check if the app is running on a physical device
    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== "granted") {
            throw new Error("Permission already granted");
        }

        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;

        if (!projectId) {
            throw new Error("Project ID is missing");
        }
        try {
            const pushTokenString = (
                await Notifications.getExpoPushTokenAsync({
                    projectId,
                })
            ).data;
            console.log("Push Token:", pushTokenString);
            return pushTokenString;
        } catch (error) {
            console.error("Error getting push token:", error);
        }
    }else{
        throw new Error("This is not a physical device");
    }
}