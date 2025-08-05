import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Dimensions } from "react-native";
import OpenAIService from "@/app/services/OpenAIService/OpenAIService";
import { useAuthContext } from "@/app/contexts/AuthContext";
import CustomButton from "@/app/components/CustomButton";
import { Timestamp } from "firebase/firestore";
import ConversationService from "@/app/services/ConversationService";
import { Conversation } from "@/app/types/Conversation";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useConversation } from "@/app/contexts/ConversationContext";
import { useFocusEffect } from "expo-router";
import AIPrompts from "@/app/constants/AIPrompts";
import UserStatsService from "@/app/services/UserStatsService";

interface ChatBotScreenProps {
  route: any;
}

const ChatBotScreen: React.FC<ChatBotScreenProps> = ({ route }: any) => {
  const { user } = useAuthContext();
  const userId = user?.uid;
  const [userInput, setUserInput] = useState("");
  const { currentConversation, setCurrentConversation } = useConversation();
  const [loading, setLoading] = useState(false);
  const [isJogSession, setIsJogSession] = useState(false);
  const conversationId = route?.params?.conversationId || route?.params?.id;
  const { isSendingToAI, setIsSendingToAI } = useConversation();
  const navigation = useNavigation();

  // Reference to the navigation object
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch the conversation based on the passed conversationId
  useEffect(() => {
    if (!userId || !conversationId) return;

    const fetchConversation = async () => {
      const convo = await ConversationService.getConversationById(conversationId);
      if (convo) {
        setCurrentConversation(convo);
        setIsJogSession(convo.conversationType === "Plan jogs for me today");
      }
    };

    fetchConversation();
  }, [userId, loading]);

  // Scroll to the end of the chat when new messages are added
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: false });
  }, [currentConversation?.messages.length]);


  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || !currentConversation || !conversationId || !user?.uid) return;

    setLoading(true);
    setIsSendingToAI(true);

    try {


      const jogPlanningMessages = [
        { role: "system", content: AIPrompts.JOG_PLANNING_START },
        ...(currentConversation.messages || []).map(msg => ({
          role: msg.role,
          content: msg.text,
        })),
        { role: "user", content: userInput },
      ];

      const response = await OpenAIService.generatePlan(
        JSON.stringify(jogPlanningMessages),
        conversationId,
        user
      );

      console.log("AI Response (Jog Planning):", response);

      const userMessage = { role: "user", text: userInput, date: new Date() };
      const botMessage = { role: "bot", text: response, date: new Date() };

      const updatedConversation: Conversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, userMessage, botMessage],
        updatedAt: Timestamp.now(),
        conversationId,
        userId: user.uid,
        conversationType: currentConversation.conversationType || "",
        isPreviousConversation: currentConversation.isPreviousConversation || false,
        createdAt: currentConversation.createdAt || Timestamp.now(),
      };

      setCurrentConversation(updatedConversation);
      setUserInput("");

      await ConversationService.updateConversationById(conversationId, updatedConversation);
      await UserStatsService.updateAIChatStats(user.uid, conversationId, updatedConversation);

    } catch (error) {
      console.error("OpenAI API Error:", error);
      const fallbackBotMessage = {
        role: "bot",
        text: "Sorry, I'm having trouble understanding you right now. Can you please try again?",
        date: new Date(),
      };

      const fallbackUserMessage = { role: "user", text: userInput, date: new Date() };

      const fallbackConversation: Conversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, fallbackUserMessage, fallbackBotMessage],
        updatedAt: Timestamp.now(),
      };

      setCurrentConversation(fallbackConversation);
      await ConversationService.updateConversationById(conversationId, fallbackConversation);

    } finally {
      setLoading(false);
      setIsSendingToAI(false);
    }
  }, [userInput, currentConversation, conversationId, user]);

  return (
    <View className="flex-1 p-4 bg-gray-100">
      {currentConversation ? (
        <>
          <ScrollView ref={scrollViewRef} scrollEnabled={true} showsVerticalScrollIndicator={false} className="flex-1">
            {currentConversation?.messages.map((msg, index) => (

              <View key={index} className={`p-3 rounded-lg my-2 ${msg.role === "user" ? "bg-primary-100 self-end" : "bg-gray-200 self-start"}`}>
                <Text>{msg.text}</Text>
              </View>
            ))}
          </ScrollView>



          <KeyboardAvoidingView className={"justify-self-center w-[full] bg-gray-100 p-5 rounded-2xl shadow-md mb-8"}

            behavior="padding"
            enabled={true}
            keyboardVerticalOffset={Dimensions.get("window").height * 0.1}

          >
            <TextInput
              className="border p-3 rounded-lg bg-gray-100"
              placeholder="Type your message..."
              value={userInput}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              multiline
              numberOfLines={2}
          
              onChange={(e) => {
                
                if (e.nativeEvent.text.length > 500) {
                  setUserInput(userInput.slice(0, 500));
                  alert("Message too long. Please keep it under 500 characters.");
                }
                else{
                  setUserInput(e.nativeEvent.text);
                }

              }}
              
            />
            <CustomButton text="Send" onPress={handleSendMessage} isLoading={loading} type="primary" customStyle={{ width: "100%" }} disabled={!!!userInput} />

          </KeyboardAvoidingView>

        </>
      ) : (
        <ActivityIndicator size="large" color="#EB5A10" />
      )}
    </View> 
  );
};

export default ChatBotScreen;