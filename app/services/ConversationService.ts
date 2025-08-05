import { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, limit, getDocs, Timestamp, deleteDoc, onSnapshot, increment } from "firebase/firestore";
import { Conversation } from "../types/Conversation";
import { db } from "./FirebaseService";
import UserStatsService from "./UserStatsService";

class ConversationService {

    static async getEveryConversation(): Promise<Conversation[]> {
        try {
            const conversations: Conversation[] = [];
            const conversationsRef = collection(db, "conversations");
            const q = query(conversationsRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                conversations.push(doc.data() as Conversation);
            });
            return conversations;
        } catch (error) {
            console.error("Error fetching conversations:", error);
            return [];
        }
    }
    

    // Update Conversation
    static async getConversationByUserId(userId: string): Promise<Conversation | null> {
        if (!userId) throw new Error("User ID is missing.");
        try {
            const conversationsRef = collection(db, "conversations");
            const q = query(conversationsRef, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(1));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data() as Conversation;
            }
            return null;
        } catch (error) {
            console.error("Error fetching conversation:", error);
            return null;
        }
    }

    static async getTodaysConversationsByUserId(userId: string): Promise<Conversation[] | null> {
        if (!userId) throw new Error("User ID is missing.");

        const todaysDate = new Date();
        todaysDate.setHours(0, 0, 0, 0);
        const todaysTimestamp = Timestamp.fromDate(todaysDate);

        const conversations: Conversation[] = [];
        try {
            const conversationsRef = collection(db, "conversations");
            const q = query(conversationsRef, where("userId", "==", userId), where("createdAt", ">=", todaysTimestamp), orderBy("createdAt", "desc"));
            const querySnapshot = getDocs(q);
            querySnapshot.then((snapshot) => {
                snapshot.forEach((doc) => {
                    conversations.push(doc.data() as Conversation);
                });
            });
            return conversations;

        }
        catch (error) {
            console.error("Error fetching conversation:", error);
            return null;
        }

    }

    static async getConversationById(conversationId: string): Promise<Conversation | null> {
        if (!conversationId) throw new Error("Conversation ID is missing.");
        try {
            const conversationRef = doc(db, "conversations", conversationId);

            const conversationDoc = await getDoc(conversationRef);
            if (conversationDoc.exists()) {
                return conversationDoc.data() as Conversation;
            }
            return null;
        } catch (error) {
            console.error("Error fetching conversation:", error);
            return null;
        }
    }

    static async getAllConversations(userId: string): Promise<Conversation[]> {

        if (!userId) throw new Error("User ID is missing.");

        try {

            const conversations: Conversation[] = [];

            const conversationsRef = collection(db, "conversations");

            const q = query(conversationsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));

            const querySnapshot = await getDocs(q);

            querySnapshot.forEach((doc) => {
                conversations.push(doc.data() as Conversation);
            });

            return conversations;

        } catch (error) {
            console.error("Error fetching conversations:", error);
            return [];
        }
    }

    static async updateConversationById(conversationId: string, updatedData: Partial<Conversation>): Promise<void> {
        if (!conversationId) throw new Error("Conversation ID is missing.");
        try {

            const conversation = await this.getConversationById(conversationId);
            updatedData.conversationId = conversation?.conversationId;

            if (!conversation) throw new Error("Conversation not found.");

            const conversationRef = doc(db, "conversations", conversation.conversationId);

            await updateDoc(conversationRef, updatedData);


            console.log("Conversation updated successfully.");
        } catch (error) {
            console.error("Error updating conversation:", error);
        }
    }


    static async updateConversation(userId: string, updatedData: Partial<Conversation>): Promise<void> {
        if (!userId) throw new Error("User ID is missing.");

        console.log("Updating conversation with data:", updatedData);

        try {
            const conversation = await this.getConversationById(updatedData.conversationId || "");
            updatedData.conversationId = conversation?.conversationId;
            if (!conversation) throw new Error("Conversation not found.");

            const conversationRef = doc(db, "conversations", conversation.conversationId);
            await updateDoc(conversationRef, updatedData);


            console.log("Conversation updated successfully.");


        } catch (error) {
            console.error("Error updating conversation:", error);
        }
    }

    static async deleteAllConversations(userId: string): Promise<void> {
        if (!userId) throw new Error("User ID is missing.");
        try {
            const conversations = (await this.getAllConversations(userId)).filter((conversation) => !conversation.deleted);
            conversations.forEach(async (conversation) => {
                await this.deleteConversation(conversation.conversationId, userId);
            });
            console.log("All conversations deleted successfully.");
        } catch (error) {
            console.error("Error deleting conversations:", error);
        }
    }

    static async createConversation(userId: string, newConversation: Conversation): Promise<string> {
        if (!userId) throw new Error("User ID is missing.");
        try {
            const conversationRef = doc(collection(db, "conversations"));
            const conversationId = conversationRef.id;

            await setDoc(conversationRef, {
                ...newConversation,
                conversationId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                deleted: false,
            });

            console.log("Conversation created successfully with ID:", conversationId);
            return conversationId;
        } catch (error) {
            console.error("Error creating conversation:", error);
            return "";
        }
    }

    static async deleteConversation(conversationId: string, userId: string): Promise<void> {
        if (!conversationId) throw new Error("Conversation ID is missing.");
        if (!userId) throw new Error("User ID is missing.");
        try {
            const conversationRef = doc(db, "conversations", conversationId);


            await setDoc(conversationRef, {
                deleted: true,
                deletedAt: Timestamp.now(),
            }, { merge: true }).then(async () => {
                await UserStatsService.updateStats(userId, {
                    deletedConversationCount: increment(1),
                }).catch((error) => {
                    console.error("Error updating user stats:", error);
                });
            });

            console.log("Conversation deleted successfully.");
        } catch (error) {
            console.error("Error deleting conversation:", error);
        }

        
    }

    static async onConversationChange(userId: string, callback: (conversation: Conversation) => void): Promise<() => void> {
        if (!userId) throw new Error("User ID is missing.");

        const conversationsRef = collection(db, "conversations");
        const q = query(conversationsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));


        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            querySnapshot.docChanges().forEach((change) => {
                if (change.type === "modified") {
                    callback(change.doc.data() as Conversation);
                }
            });
        });

        return unsubscribe;
    }

}

export default ConversationService;