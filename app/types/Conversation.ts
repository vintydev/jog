import { Timestamp } from "firebase/firestore";

export interface Conversation {
 

    conversationId: string;
    userId: string;
    title?: string;
    messages: {
        createdAt?: any;
        text: string;
        date: Timestamp | Date 
        role: string;
    }[];
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
    conversationType : string;
    conversationStatus? : string;
    isPreviousConversation : boolean;
    threadId? : string;
    deletedAt? : Timestamp | Date;
    deleted? : boolean;
    jogPlanningStarted? : boolean;
}