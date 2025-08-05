import { addDoc, collection, doc, getDoc, getDocs, increment, orderBy, query, setDoc, Timestamp, where } from "firebase/firestore";
import { db } from "./FirebaseService";
import UserService from "./UserService";
import { User } from "../types/User";
import { UserStats } from "../types/UserStats";
import Reminder from "../types/Reminder";
import { Conversation } from "../types/Conversation";
import { Float } from "react-native/Libraries/Types/CodegenTypes";
import ConversationService from "./ConversationService";
import { Platform } from "react-native";
import * as Device from "expo-device";
import ReminderService from "./ReminderService";



class UserStatsService {

    static async getUserStats(userId: string): Promise<UserStats | null> {
        if (!userId) {
            throw new Error("User ID is missing.");
        }
        try {
            const userStatsRef = doc(db, "userStats", userId);
            const userStatsDoc = await getDoc(userStatsRef);
            if (userStatsDoc.exists()) {
                return userStatsDoc.data() as UserStats;    
            }
            return null;
        } catch (error) {
            console.error("Error fetching user stats:", error);
            return null;
        }
    }

    
    // Initialise UserStats
    static async initialiseUserStats(userId: string, questionnaireTime?: Timestamp, buildNumber?: string): Promise<void> {

        const user = await UserService.getUser(userId);
        if (!user) {
            throw new Error("User not found");
        }

        const userStatsRef = doc(db, "userStats", userId);
        const userStatsDoc = await getDoc(userStatsRef);

        
        if (!userStatsDoc.exists()) {
            await setDoc(userStatsRef, {
                userId: userId,
                userStatsId: userId,
                isFromGoogle: user.isFromGoogle,
                deletedConversationCount: 0,
                deviceType: Platform.OS,
                deviceName: Device.deviceName,
                deviceOS: `${Device.osName} ${Device.osVersion}`,
                deviceModel: Device.modelName,
                buildJoined: buildNumber ?? null,

                jogStats: {
                    totalJogsCreated: 0,
                    totalStepBasedJogsCreated: 0,
                    totalAIJogsCreated: 0,
                    jogCompletionRate: {
                        completedOnTimeTotal: 0,
                        completedLateTotal: 0,
                        missedJogsTotal: 0,
                        totalJogsCompleted: 0,
                      
                    },
                    jogCategories: {},
                    bestStreak: 0,
                    currentStreak: 0,
                    dailyJogStats: {},
                    deletedJogCount: 0,
                },

                aiChatStats: {
                    totalConversations: 0,
                    totalMessagesSent: 0,
                    totalMessagesReceived: 0,
                    avgResponseTime: 0,
                    avgMessagesPerConversation: 0,
                    avgTimeToCreateAJog: 0,
                },
                appUsageStats: {
                    totalLogins: 0,
                    totalTimeSpent: 0,
                    totalSessions: 0,
                    avgTimeSpent: 0,
                    avgTimeSpentPerSession: 0,
                    mostActiveTimeOfDay: "",
                    mostActiveDayOfWeek: "",
                    notificationInteractionRate: {
                        type: {
                            acknowledged: 0,
                            ignored: 0,
                            total: 0,
                        },
                        totalNotificationsAcknowledged: 0,
                        totalNotificationsSent: 0,

                    }
                },
                symptomStats: {
                    questionnaireTime: questionnaireTime ?? null,
                    questionnaireTimeSet: questionnaireTime ?? false,
                    questionnaireReady: false,
                    initialMemorySeverity: user.symptomInfo.initialMemorySeverity,
                    initialConcentrationSeverity: user.symptomInfo.initialConcentrationSeverity,
                    initialMoodSeverity: user.symptomInfo.initialMoodSeverity,
                    lastLoggedMemorySeverity: null,
                    lastLoggedConcentrationSeverity: null,
                    lastLoggedMoodSeverity: null,
                    lastQuestionnaireCompleted: null,
                    dailyLogs: {},
                },
                createdAt: user.createdAt,
                lastUpdated: user.createdAt,
                
            }, { merge: true });
        }

    }

    static async updateStats(userId: string, userStats: Partial<UserStats>): Promise<void> {
        if (!userId || !userStats) {
            throw new Error("Invalid user ID or user stats");
        }

        // call initialiseUserStats if user stats is not initialised
        const userStatsRef = doc(db, "userStats", userId);
        const userStatsDoc = await getDoc(userStatsRef);
        
        if (!userStatsDoc.exists()) {
            await this.initialiseUserStats(userId);
        }

        try{
   
            const userStatsRef = doc(db, "userStats", userId);

            await setDoc(userStatsRef, {...userStats, lastUpdated: Timestamp.now()}, {  merge: true }); 
            console.log("User stats updated successfully. with the user stats of ", userStats);
        }
        catch(error){
            console.error("Error updating user stats:", error);
        }
    }

    // Update Jog Stats overall
    static async updateJogStats(userId: string, reminder: Partial<Reminder>, options?: {isCreating: boolean}): Promise<void> {

        if (!userId || !reminder) {
            throw new Error("Invalid user ID or reminder");
        }

        try {
            const userStatsRef = doc(db, "userStats", userId);
            const userStatsDoc = await getDoc(userStatsRef);

            if (!userStatsDoc.exists()) {
                await this.initialiseUserStats(userId);
            }

            const updatedJogStats: Partial<UserStats["jogStats"]> = {
                totalJogsCreated: reminder.completeStatus === "upcoming" || reminder.completeStatus === "loading" ? increment(1) : increment(0),
                totalStepBasedJogsCreated: increment(reminder.isStepBased ? 1 : 0),
                totalAIJogsCreated: increment(reminder.isAI ? 1 : 0),
                jogCompletionRate: {
                    completedOnTimeTotal: reminder.completeStatus === "completedOnTime" ? increment(1) : increment(0),
                    completedLateTotal: reminder.completeStatus === "completedLate" ? increment(1) : increment(0),
                    missedJogsTotal: reminder.completeStatus === "overdue" ? increment(1) : increment(0),
                    totalJogsCompleted: reminder.completed ? increment(1) : increment(0),
                },
                jogCategories: {
                    [String(reminder.category)]: reminder.completeStatus === "upcoming" || reminder.completeStatus === "loading" ? increment(1) : increment(0),
                },
                deletedJogCount: reminder.deleted ? increment(1) : increment(0),
             
            };

            await setDoc(userStatsRef, {
                jogStats: updatedJogStats,
            }, { merge: true });
        }
        catch (error) {
            console.error("Error updating jog stats:", error);
        }

    }

    // Update todays stats
    static async updateJogStatsToday(userId: string, reminder: Partial<Reminder>, options?: {isCreating?: boolean}): Promise<void> {
        if (!userId || !reminder) {
            throw new Error("Invalid user ID or reminder");
        }


        try{
            const userStatsRef = doc(db, "userStats", userId);
            const userStatsDoc = await getDoc(userStatsRef);

            if (!userStatsDoc.exists()) {
                await this.initialiseUserStats(userId);
                
            }

    
            console.log(" the reminder ", reminder);

            const today = new Date().toLocaleDateString();
            const updatedJogStats: Partial<UserStats["jogStats"]["dailyJogStats"]> = {
                [today]: {
                    totalJogsCreated: options?.isCreating ? increment(1): increment(0),
                    totalStepBasedJogsCreated: increment(reminder.isStepBased ? 1 : 0),
                    totalAIJogsCreated: increment(reminder.isAI ? 1 : 0),
                    jogCompletionRate: {
                        completedOnTimeTotal: reminder.completeStatus === "completedOnTime" ? increment(1) : increment(0),
                        completedLateTotal: reminder.completeStatus === "completedLate" ? increment(1) : increment(0),
                        missedJogsTotal: reminder.completeStatus === "overdue" ? increment(1) : increment(0),
                        totalJogsCompleted: reminder.completed ? increment(1) : increment(0),
                    },
                    jogCategories: {
                        [String(reminder.category)]: reminder.completeStatus === "upcoming" || reminder.completeStatus === "loading" ? increment(1) : increment(0),
                    },
                    deletedJogCount: reminder.deleted ? increment(1) : increment(0),
              
                },
            };

            await setDoc(userStatsRef, {
                jogStats: {
                    dailyJogStats: updatedJogStats,
                }
            }, { merge: true });
        }
        catch(error){
            console.error("Error updating jog stats today:", error
            );
        }
        finally{
            await this.updateJogStats(userId, reminder);
        }
    }

    static async updateAIChatStats(userId: string, conversationId: string, conversation: Partial<Conversation>): Promise<void> {

        console.log("Updating AI chat stats...");

        if (!userId || !conversationId || !conversation) {
            throw new Error("Invalid user ID, conversation ID, messages sent, messages received, or time to create a jog");
        }


        const userStatsRef = doc(db, "userStats", userId);
        const userStatsDoc = await getDoc(userStatsRef);

        // Fetch Required Data First
        const totalConversations = await this.conversationsTotal(userId);
        let totalMessages = (await this.messagesTotal(userId)).totalMessages;
        let countOfEachConversation = (await this.messagesTotal(userId)).countOfEachConversation;
        const avgJogTime = await this.calculateAverageJogCreationTime(conversationId);

        // Calculate Average Response Time
        const conversationResponseTime = await this.averageResponseTime(
            (conversation.messages ?? []).map(message => ({
                ...message,
                date: message.date instanceof Timestamp ? message.date : Timestamp.fromDate(message.date),
            }))
        );
        const previousAvgResponseTime = userStatsDoc.data()?.aiChatStats?.avgResponseTime || 0;
        const avgResponseTime = (previousAvgResponseTime + conversationResponseTime) / 2;

        // get total messages in
        
        const updatedTotalMessages = totalMessages;
        const avgMessagesPerConversation = Array.isArray(countOfEachConversation) && countOfEachConversation.length > 0 
            ? updatedTotalMessages / countOfEachConversation.length 
            : 0;
        

        console.log("Updated Total Messages:", updatedTotalMessages);
        console.log("Total Conversations:", totalConversations);
        console.log("Computed avgMessagesPerConversation:", avgMessagesPerConversation);


        // Calculate Average Time to Create a Jog
        const previousAvgJogTime = userStatsDoc.data()?.aiChatStats?.avgTimeToCreateAJog || 0;
        const avgTimeToCreateAJog = (previousAvgJogTime + avgJogTime) / 2;




        try {
            const userStatsRef = doc(db, "userStats", userId);
            const userStatsDoc = await getDoc(userStatsRef);


            if (!userStatsDoc.exists()) {
                await this.initialiseUserStats(userId);
            }

            // 📌 Update Firestore
            await setDoc(userStatsRef, {
                aiChatStats: {
                    totalConversations,
                    totalMessagesSent: increment(1),
                    totalMessagesReceived: increment(1),
                    avgResponseTime,
                    avgMessagesPerConversation,
                    avgTimeToCreateAJog,
                },
            }, { merge: true });

            console.log("AI chat stats updated successfully.");
        }
        catch (error) {
            console.error("Error updating AI chat stats:", error);
        }
    }

    


    private static async messagesTotal(userId: string): Promise<{ totalMessages: number; countOfEachConversation: number[] }> {
        try {
            // Reference the "conversations" collection
            const conversationsRef = collection(db, "conversations");

            // Query all conversations that belong to the user
            const userConversationsQuery = query(conversationsRef, where("userId", "==", userId));
            const querySnapshot = await getDocs(userConversationsQuery);

            let totalMessages = 0;
            let countOfEachConversation: number[] = [];

            // Iterate over each conversation & count messages and push to array the count of each messages per conversation
            querySnapshot.forEach(doc => {
                const conversationData = doc.data();
                const messages = conversationData.messages || [];
                totalMessages += messages.length;
                countOfEachConversation.push(messages.length);
            });



            return { totalMessages, countOfEachConversation };
        } catch (error) {
            console.error("Error fetching total messages:", error);
            return { totalMessages: 0, countOfEachConversation: [] };
        }
    }

    private static async conversationsTotal(userId: string): Promise<number> {
        try {
            const conversationsRef = collection(db, "conversations");
            const userConversationsQuery = query(conversationsRef, where("userId", "==", userId));
            const querySnapshot = await getDocs(userConversationsQuery);

            console.log("Getting total convesations form user id", userId);
            console.log("Total conversations", querySnapshot.docs.length);

            return querySnapshot.docs.length;
        } catch (error) {
            console.error("Error fetching global messages:", error);
            return 0;
        }
    }

    // get all conversations
    static async getAllConversations(userId: string): Promise<Conversation[]> {
        if (!userId) {
            throw new Error("User ID is missing.");
        }

        try {
            const conversationsRef = collection(db, "conversations");
            const q = query(conversationsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data() as Conversation);
        } catch (error) {
            console.error("Error fetching conversations:", error);
            return [];
        }
    }




    private static async averageResponseTime(messages: { date: Timestamp; role: string }[]): Promise<number> {

        const userMessages = messages.filter(m => m.role === "user").sort((a, b) => a.date.toMillis() - b.date.toMillis());

        if (userMessages.length < 2) return 0; // Not enough data to compute

        let totalResponseTime = 0;
        let responseCount = 0;

        for (let i = 1; i < userMessages.length; i++) {
            const prevMessage = userMessages[i - 1];
            const currentMessage = userMessages[i];

            const timeDiff = currentMessage.date.toMillis() - prevMessage.date.toMillis(); // Difference in minutes
            totalResponseTime += timeDiff;
            responseCount++;
        }

        return responseCount > 0 ? totalResponseTime / responseCount : 0;
    }

    private static async calculateAverageJogCreationTime(conversationId: string): Promise<number> {
        try {
            const conversation = await ConversationService.getConversationById(conversationId);
            if (!conversation || !conversation.messages) return 0;

            let jogTimings: number[] = [];

            for (let i = 0; i < conversation.messages.length; i++) {
                const message = conversation.messages[i];

                // If the user initiates a jog request
                if (message.role === "user") {
                    let jogStartTime = message.date instanceof Timestamp ? message.date.toMillis() : new Date(message.date).getTime();

                    // Find the next AI response that confirms jog creation
                    for (let j = i + 1; j < conversation.messages.length; j++) {
                        const aiMessage = conversation.messages[j];

                        if (aiMessage.role === "bot" && aiMessage.text.toLowerCase().includes("jog scheduled")) {
                            let jogEndTime = aiMessage.date instanceof Timestamp ? aiMessage.date.toMillis() : new Date(aiMessage.date).getTime();
                            let timeTaken = jogEndTime - jogStartTime;
                            jogTimings.push(timeTaken);
                            break;
                        }
                    }
                }
            }

            // Compute the average time in seconds
            if (jogTimings.length === 0) return 0;

            const averageTime = jogTimings.reduce((a, b) => a + b, 0) / jogTimings.length;
            return averageTime / 1000; // Convert ms to seconds
        } catch (error) {
            console.error("Error calculating average jog creation time:", error);
            return 0;
        }
    }

  


}

export default UserStatsService;