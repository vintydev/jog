import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    ReactNode
} from "react";

import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";
import UserStatsService from "../services/UserStatsService";
import { increment } from "firebase/firestore";
import { UserStats } from "../types/UserStats";
import { useAuthContext } from "./AuthContext";

// Define the structure of the context
interface NotificationContextType {
    expoPushToken: string | null;  // Stores the Expo push token for push notifications
    notification: Notifications.Notification | null;  // Stores the most recent notification
    setNotification: (notification: Notifications.Notification) => void;  // Function to update notification state
    setExpoPushToken: (token: string) => void;  // Function to update Expo push token
    error: Error | null;  // Stores any error that occurs during push notification registration
}

// Create the Notification Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);


// Custom hook to consume the NotificationContext
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
}

//  Define the props for the NotificationProvider component
interface NotificationProviderProps {
    children: ReactNode;  // The child components that will have access to this context
}

//  Create the Notification Provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    // State to store the Expo push token
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

    // State to store the most recent notification
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);

    // State to store any errors that occur
    const [error, setError] = useState<Error | null>(null);

    //  Refs to store event listeners for notifications
    const notificationListener = useRef<Notifications.EventSubscription>();
    const responseListener = useRef<Notifications.EventSubscription>();

    //  Effect to register for push notifications and set up listeners
    useEffect(() => {
        //  Request permission and get Expo push token
        registerForPushNotificationsAsync()
            .then((token) => {
                setExpoPushToken(token ?? null);  // Save the token if available
            })
            .catch((error) => {
                setError(error);  // Handle errors if registration fails
            });

        //  Listen for incoming notifications while the app is running
        notificationListener.current =
            Notifications.addNotificationReceivedListener((notification) => {
                console.log("Notification received", notification);
                setNotification(notification);  // Update the state when a notification is received
            });

        //  Listen for when the user interacts with a notification
        responseListener.current =
            Notifications.addNotificationResponseReceivedListener(async (response) => {
                console.log(
                    "Notification response received:",
                    JSON.stringify(response, null, 2),
                    JSON.stringify(response.notification.request.content.data)
                );

                const userId = response.notification.request.content.data.userId;
                const type = response.notification.request.content.data.type;
                console.log("User ID from notification:", userId);
                if (!userId) return; if (!type) return;


                await UserStatsService.updateStats(
                    userId,
                    {
                        appUsageStats: {
                            notificationInteractionRate: {
                                [type]: {
                                    acknowledged: increment(1),
                                },
                                totalNotificationsAcknowledged: increment(1),
                            },
                        },
                    } as unknown as Partial<UserStats>)


            });

        //  Listen for when the user interacts with a notification



        //  Cleanup function: Remove event listeners when the component unmounts
        return () => {

            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
                notificationListener.current = undefined;  // Ensure cleanup
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
                responseListener.current = undefined;  // Ensure cleanup
            }
        };
    }, []);

    // Provide the notification state and functions to the context
    return (
        <NotificationContext.Provider value={{
            expoPushToken,
            notification,
            setNotification,
            setExpoPushToken,
            error
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;