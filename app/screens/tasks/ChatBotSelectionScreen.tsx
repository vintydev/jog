import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Animated as Animated2, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import ConversationService from "@/app/services/ConversationService";
import type { Conversation } from "@/app/types/Conversation";
import useAuth from "@/app/hooks/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useConversation } from "@/app/contexts/ConversationContext";
import CustomButton from "@/app/components/CustomButton";
import { Image } from "react-native";
import starAI from "@/app/constants/Images";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp, FadeIn, Layout, LinearTransition } from 'react-native-reanimated';

const ChatBotSelectionScreen: React.FC = () => {
  const { user, userData, loading: userLoading } = useAuth();
  const userId = user?.uid;
  const navigation = useNavigation();
  const {currentConversation, setCurrentConversation, todaysConversations } = useConversation();
  const [pastConversations, setPastConversations] = useState<Conversation[]>([]);

  const [showActiveConversations, setShowActiveConversations] = useState(true);
  const [showSavedConversations, setShowSavedConversations] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Get the conversations
    const fetchConversations = async () => {

      const allConversations = (await ConversationService.getAllConversations(userId)).filter(convo => (!convo.deleted)) || [];

      setPastConversations(allConversations);

    };

    // Call the fetchConversations function
    fetchConversations();

    // Unsubscribe from the conversation listener if the component unmounts
    const unsubscribe = ConversationService.onConversationChange(userId, (conversation) => {
      if (conversation.conversationStatus) {
        setPastConversations((prev) => [...prev, conversation]);
      }
    }
    ).then((unsub) => {
      return unsub;
    }
    );

    return () => {
      unsubscribe
    };
  }, [userId, currentConversation, todaysConversations, pastConversations]);

  // If the user swipes back auto save the conversation
  useFocusEffect(
    useCallback(() => {
      const saveConversationOnSwipe = async () => {

        const conversationId = await AsyncStorage.getItem("currentConversationId");
        if (conversationId && currentConversation) {

          console.log("Saving conversation on swipe back...");
          await ConversationService.updateConversationById(conversationId, {
            ...currentConversation,
            conversationStatus: pastConversations.some(convo => convo.conversationStatus === "active" 
              && convo.conversationId !== currentConversation.conversationId)
              ? "inactive" : "active"
          }).then(() => {
            console.log("Conversation saved successfully.");
          }).catch((error) => {
            console.error("Error saving conversation:", error);

          });

        }
      };

      saveConversationOnSwipe();
    }, [currentConversation])
  );


  // Start a new conversation
  const handleStartNewConversation = async (conversationType: string) => {

    if (!userId) return;

    if (pastConversations.some(convo => convo.conversationStatus === "active" && !convo.deleted))
      return Alert.alert("Active Conversation", "Please finish or delete your current conversation before starting a new one.");

    const newConversation: Conversation = {
      conversationId: "",
      userId: userId || "",
      conversationType,
      messages: [{
        role: "bot",
        text: conversationType === "Plan jogs for me today"
          ? `Hey ${userData?.displayName}! Let's plan your day. What do you need to do today?`
          : `Great! Let's ${conversationType.toLowerCase()}.`,
        date: new Date(),
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
      conversationStatus: "active",
      isPreviousConversation: false,
      deleted: false,
      // Add any other required properties from Conversation type here
    };

    const createdConversationId = await ConversationService.createConversation(userId || "", newConversation);

    await AsyncStorage.setItem("currentConversationId", createdConversationId);
    navigation.navigate("Tasks", { screen: "ChatBot", params: { conversationId: createdConversationId } } );
  };

  // Continue a past conversation
  const handleContinueConversation = async (conversation: Conversation) => {
    await ConversationService.updateConversation(conversation.conversationId, {
      ...conversation,
      conversationStatus: conversation.conversationStatus === "inactive" ? "active" : conversation.conversationStatus,
    });

    await AsyncStorage.setItem("currentConversationId", conversation.conversationId);
    setCurrentConversation(conversation);
    setShowActiveConversations(false); setShowSavedConversations(false);

    navigation.navigate("Tasks", { screen: "ChatBot", params: { conversationId: conversation.conversationId } });
    
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!conversationId) return;
    if (!userId) return;
    try {
      setShowActiveConversations(false); setShowSavedConversations(false);

      Alert.alert(
        "Delete Conversation",
        "Are you sure you want to delete this conversation?",
        [
          {
            text: "Cancel",
            onPress: () => console.log("Cancel Pressed"),
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              await ConversationService.deleteConversation(conversationId, userId);
              setPastConversations((prev) => prev.filter((convo) => convo.conversationId !== conversationId));

              if (currentConversation?.conversationId === conversationId) {
                setCurrentConversation(null);
                await AsyncStorage.removeItem("currentConversationId");

              }
            },
          },
        ]
      )

    }
    catch (error) {
      console.error("Error deleting conversation:", error);
    }
    finally {

      setShowActiveConversations(true); setShowSavedConversations(true);

    }
  };


  const handleDeleteAllConversations = async () => {
    setShowActiveConversations(false); setShowSavedConversations(false);
    Alert.alert(
      "Delete All Conversations",
      "Are you sure you want to delete all conversations?", [
      {
        text: "Cancel",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: async () => {
          await ConversationService.deleteAllConversations(userId || "");
          setPastConversations([]);
          setCurrentConversation(null);
          await AsyncStorage.removeItem("currentConversationId");
        },
      },
    ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {!userLoading ? (
        <Animated.View
          entering={FadeInUp.delay(50).duration(350)}
          exiting={FadeIn.duration(50)}
          layout={LinearTransition.springify()}
          className="flex-1 bg-gray-100 px-6 pt-4"
        >

          <ScrollView className="flex-grow mb-4" contentContainerStyle={{ paddingBottom: 400, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            
              >


            <>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="font-sf-pro-display-bold text-[30px]"><Text className="font-sf-pro-display-bold text-[30px] text-primary-0">{userData?.displayName}'</Text>s chats</Text>
                {pastConversations.length > 1 && (
                  <TouchableOpacity onPress={handleDeleteAllConversations} className="p-2">
                    <Ionicons name="trash-bin" size={26} color="#EB5A10" />
                  </TouchableOpacity>

                )}
              </View>


              {pastConversations
              .filter(convo => !convo.deleted)
              .some(convo => convo.conversationStatus === "active") && (
                <View className="bg-white p-6 m-2 justify-center shadow-sm rounded-2xl">

                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-[20px] font-sf-pro-bold">🔥 Active Conversation</Text>
                    <TouchableOpacity
                      onPress={() => setShowActiveConversations(!showActiveConversations)}
                      className={`flex-row items-center justify-center ${showActiveConversations ? "bg-primary-100" : "bg-gray-100"} rounded-full p-2`}
                      style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}
                      activeOpacity={0.8}

                    >

                      <Ionicons name={showActiveConversations ? "chevron-up" : "chevron-forward"} size={24} color="#EB5A10" className={`transition-transform duration-300 ${showActiveConversations ? "rotate-180" : ""}`} />
                    </TouchableOpacity>

                  </View>

                  {showActiveConversations && (
                    pastConversations.filter(convo => convo.conversationStatus === "active" && convo.deleted === false)
                    .map((convo, index) => (
                      <Animated.View key={index} layout={LinearTransition.springify()} className="mb-2">
                        <TouchableOpacity
                          onPress={() => handleContinueConversation(convo)}
                          className="p-4 bg-gray-100 rounded-xl shadow-sm flex-row justify-between items-center mb-2"
                        >
                          <View>
                            <Text className="text-base font-sf-pro-bold text-gray-800">{convo.title || "Untitled"}</Text>
                            <Text className="text-xs text-gray-600">
                              {new Date(convo.createdAt instanceof Date ? convo.createdAt : convo.createdAt.toDate()).toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                              {" at "}{new Date(convo.createdAt instanceof Date ? convo.createdAt : convo.createdAt.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => handleDeleteConversation(convo.conversationId)}>
                            <Ionicons name="trash" size={24} color="#EB5A10" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      </Animated.View>
                    ))
                  )}
                </View>
              )}

              {/* Expandable Saved Conversations */}
              {pastConversations
              .filter(convo => !convo.deleted)
              .some(convo => convo.conversationStatus === "inactive") && (
                <View className="bg-white p-6 m-2 justify-center shadow-sm rounded-2xl">


                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-[20px] font-sf-pro-bold">Saved Conversations</Text>

                    <TouchableOpacity
                      onPress={() => setShowSavedConversations(!showSavedConversations)}
                      className={`flex-row items-center justify-center ${showSavedConversations ? "bg-primary-100" : "bg-gray-100"} rounded-full p-2`}
                      style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}
                      activeOpacity={0.8}

                    >

                      <Ionicons name={showSavedConversations ? "chevron-up" : "chevron-forward"} size={24} color="#EB5A10" className={`transition-transform duration-300 ${showSavedConversations ? "rotate-180" : ""}`} />



                    </TouchableOpacity>
                  </View>

                  {showSavedConversations && (
                    pastConversations.filter(convo => convo.conversationStatus === "inactive" && convo.deleted === false)
                    .map((convo, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleContinueConversation(convo)}
                        className="p-4 bg-gray-100 rounded-xl shadow-sm mb-2 flex-row justify-between items-center"
                      >
                        <View>
                          <Text className="text-base font-sf-pro-bold text-gray-800">{convo.title || "Untitled"}</Text>
                          <Text className="text-xs text-gray-500">
                            {new Date(convo.createdAt instanceof Date ? convo.createdAt : convo.createdAt.toDate()).toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            {" at "}{new Date(convo.createdAt instanceof Date ? convo.createdAt : convo.createdAt.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteConversation(convo.conversationId)}>
                          <Ionicons name="trash" size={24} color="#EB5A10" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {/* Fixed Start New Conversation Section (Now in ScrollView) */}
              <View className="bg-white absolute bottom-24 left-5 right-5 p-5 rounded-2xl shadow-md mt-4 ">
                <View className="flex-row items-center mb-4">
                  <Text className="text-[20px] font-sf-pro-display-bold text-black">Plan Jogs with our</Text>
                  <Text className="text-[25px] font-sf-pro-display-bold text-primary-0"> AI Chat</Text>
                  <Image
                    source={starAI.starAI}
                    style={{ width: 15, height: 15, tintColor: "#EB5A10", marginLeft: 2, transform: [{ scaleX: -1 }], marginBottom: 20 }}
                  />
                </View>
                <Text className="text-[15px] font-sf-pro-black mb-4">
                  Let AI help you structure your day effectively. Start a new session now!
                </Text>
                <CustomButton
                  text="Start a New Conversation"
                  onPress={() => handleStartNewConversation("Plan jogs for me today")}
                  isLoading={false}
                  type="primary"
                  customStyle={{ width: "100%" }}
                />
              </View>

              {(pastConversations.length === 0 || !pastConversations) && (
                <View className="flex-1 justify-center items-center">
                  <Text className="text-center text-lg text-gray-500">No conversations found.</Text>
                </View>
              )}

            </>



          </ScrollView>

        </Animated.View >
      ) : (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EB5A10" />
          <Text className="text-lg text-gray-500 mt-2">Loading...</Text>
        </View>
      )}
    </SafeAreaView >
  );
};

export default ChatBotSelectionScreen;