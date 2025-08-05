import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { TaskStackParamList } from "../types/Navigator";
import TaskListScreen from "@/app/screens/tasks/TaskListScreen";
import AddTaskCategoryScreen from "../screens/tasks/AddTaskCategoryScreen";
import { Ionicons } from "@expo/vector-icons";
import { Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import AddTaskScheduleScreen from "../screens/tasks/AddTaskScheduleScreen";
import ChatBotScreen from "../screens/tasks/ChatBotScreen";
import ChatBotSelectionScreen from "../screens/tasks/ChatBotSelectionScreen";
import { useConversation } from "../contexts/ConversationContext";
import ConversationService from "../services/ConversationService";
import ProgressScreen from "../screens/tasks/ProgressScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TaskStack = createStackNavigator<TaskStackParamList>();

const TaskNavigator = () => {
  const { currentConversation, isSendingToAI } = useConversation();
  const userId = currentConversation?.userId;


  // Handles what happens when the user clicks "Back" from the Chatbot screen
  const handleChatbotExit = async (navigation: any) => {
    if (!currentConversation) return navigation.goBack();

    Alert.alert(
      "Save Conversation?",
      "Would you like to save this conversation before exiting?",
      [
        {
          text: "No, discard",
          style: "destructive",
          onPress: async () => {
            await ConversationService.deleteConversation(currentConversation.conversationId, userId as string),{}
            await AsyncStorage.removeItem("currentConversationId");
            navigation.goBack();
          },
          
        },
        {
          text: "Yes, save",
          onPress: async () => {
            await ConversationService.updateConversationById(currentConversation.conversationId, {
              conversationStatus: "inactive",

              
            });
            await AsyncStorage.removeItem("currentConversationId");
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <TaskStack.Navigator
      initialRouteName="TaskList"
      screenOptions={({ navigation, route }) => ({
        gestureEnabled: isSendingToAI ,
        headerLeft: () => {
          if (!navigation.canGoBack() || (route.name === "ChatBotSelection" || route.name === "TaskList" || route.name ==="WeeklyStats")) return null;
          while(isSendingToAI) {
            return(
              <ActivityIndicator size={24} color="#EB5A10" style={{ marginLeft: 15 }} />
            )
          }

          return (
            <TouchableOpacity
              onPress={() => (route.name === "ChatBot" ? handleChatbotExit(navigation) : navigation.goBack())}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#EB5A10" />
            </TouchableOpacity>
          );
        }
      })}
    >
      <TaskStack.Screen name="TaskList" component={TaskListScreen} options={{headerShown:false}} />
      <TaskStack.Screen name="AddTaskCategory" component={AddTaskCategoryScreen} options={{headerTitle:"Add Jog"}} />
      <TaskStack.Screen name="AddTaskSchedule" component={AddTaskScheduleScreen} options = {{headerTitle:"Confirm Jog"}}/>
      <TaskStack.Screen name="ChatBotSelection" component={ChatBotSelectionScreen} options={{headerShown:false}} />
      <TaskStack.Screen name="ChatBot" component={ChatBotScreen} options={{headerTitle:"Chat", gestureEnabled:false}} />
      <TaskStack.Screen name ="WeeklyStats" component={ProgressScreen} options ={{headerShown:false}}/>
    </TaskStack.Navigator>
  );
};

export default TaskNavigator;