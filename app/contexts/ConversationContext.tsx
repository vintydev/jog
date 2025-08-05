import React, { createContext, useContext, useEffect, useState } from "react";
import { Conversation } from "@/app/types/Conversation";
import ConversationService from "@/app/services/ConversationService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAuth from "../hooks/useAuth";

interface ConversationContextProps {
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation | null) => void;
  todaysConversations: Conversation[] | null;
  isSendingToAI: boolean;
  setIsSendingToAI: (isSending: boolean) => void;

}

const ConversationContext = createContext<ConversationContextProps | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [todaysConversations, setTodaysConversations] = useState<Conversation[] | null>(null);
  const { user } = useAuth();
  const [isSendingToAI, setIsSendingToAI] = useState(false);

  useEffect(() => {
    if (!user || !user.uid) return;

    let unsubscribe: (() => void) | undefined;

    const fetchConversation = async () => {
      const conversationId = await AsyncStorage.getItem("currentConversationId");

      if (conversationId) {
        const conversation = await ConversationService.getConversationById(conversationId);
        const todaysConversations = await ConversationService.getTodaysConversationsByUserId(user.uid);
        setTodaysConversations(todaysConversations);
        setCurrentConversation(conversation);
      }
    };

    fetchConversation();


    ConversationService.onConversationChange(user.uid, (conversation) => {


      if (conversation.conversationId === currentConversation?.conversationId) {
        setCurrentConversation(conversation);
      }
    }).then((unsub) => {

      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, currentConversation]);

  return (
    <ConversationContext.Provider value={{ currentConversation, setCurrentConversation, todaysConversations, isSendingToAI, setIsSendingToAI }}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within a ConversationProvider");
  }
  return context;
};