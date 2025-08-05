import React, { useEffect, useLayoutEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getTabIcon } from "../constants/Icons";
import HomeScreen from "../screens/tabs/HomeScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Alert, TouchableOpacity } from "react-native";
import { DrawerActions } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { TabStackParamList } from "../types/Navigator";
import TaskNavigator from "./TaskNavigator";
import UserService from "../services/UserService";
import useAuth from "@/app/hooks/useAuth";;
import QuestionnaireNavigtator from "@/app/navigation/QuestionnaireNavigator"
import UserStatsService from "../services/UserStatsService";
import { increment } from "firebase/firestore";
import ProgressStatsScreen from "@/app/screens/tasks/ProgressScreen";
import { useAuthContext } from "../contexts/AuthContext";

const Tab = createBottomTabNavigator<TabStackParamList>();

const TabNavigator = () => {

  const { user, userData, loading: userLoading } = useAuth();

  const [focussed, setIsFocussed] = useState(userData?.isFocusMode ?? false);

  useEffect(() => {
    
    if (userData?.isFocusMode !== undefined) {
      setIsFocussed(userData.isFocusMode);
    }
  }
    , [userData?.isFocusMode]);


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route, navigation }) => ({
          tabBarIcon: ({ focused }) => getTabIcon(route.name, focused),
          tabBarActiveTintColor: "#EB5A10",
          tabBarStyle: {
            position: "absolute",
            left: 15,
            right: 15,
            height: 75,

            borderRadius: 25,
            backgroundColor: "#fff",
            shadowColor: "#8C8E98",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
            borderTopWidth: 0.2,

          },
          headerLeft: () => (

            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{ marginLeft: 20 }}
            >
              <Ionicons name="menu" size={32} color="#EB5A10" />
            </TouchableOpacity>
          ),
          headerRight: () => (

            
              <TouchableOpacity
                onPress={async () => {
                  if (!user) {
                    return;
                  }

                  const nextFocusModeState = !focussed;

                  try {
                    await UserService.updateData(user?.uid, { isFocusMode: nextFocusModeState });

                    if (nextFocusModeState) {
                      Alert.alert("Focus Mode", "Focus Mode enabled! You will no longer receive push notifications. To disable, press the moon icon again.");
                      setIsFocussed(true);
                      UserStatsService.updateStats(user?.uid, { focusModeCount: increment(1) });
                    } else {
                      Alert.alert("Focus Mode", "Focus Mode disabled!");
                      setIsFocussed(false);
                    }
                  }
                  catch (error) {
                    console.error("Error updating focus mode:", error);
                    setIsFocussed(!nextFocusModeState);
                    Alert.alert("Error", "Failed to update focus mode. Please try again.");
                  }


                }}
                style={{ marginRight: 20 }}

              >
                <Ionicons name={focussed ? "moon" : "moon-outline"} size={20} color="#EB5A10" />

              </TouchableOpacity>
          ),
          gestureEnabled: true,
        })}
      >
        <Tab.Screen
          name="Home"
          options={{
            headerShown: true,
            headerTitle: "jog",
            headerTitleStyle: {
              bottom: 2,
              fontSize: 32,
              color: "#EB5A10",
              fontFamily: "SF-Pro-Display-Bold",

            },
            headerStyle: {
              backgroundColor: "#fff",
              borderBottomColor: "",
              borderBottomWidth: 0.1,
            },
          }}
        >
          {({ navigation, route }) => <HomeScreen navigation={navigation} route={route} />}
        </Tab.Screen>

        <Tab.Screen
          name="AI Planner"
          options={{
            headerShown: true,
            tabBarIcon: ({ focused }) => getTabIcon("Chat Bot", focused),
          }}
          component={TaskNavigator}
          initialParams={{ screen: "ChatBotSelection" }}
        />
        <Tab.Screen
          name="My Jogs"
          options={{ headerShown: true, tabBarIcon: ({ focused }) => getTabIcon("Jogs", focused) }}
          component={TaskNavigator}
        />

        <Tab.Screen
          name="My Stats"
          options={{ headerShown: true, tabBarIcon: ({ focused }) => getTabIcon("Stats", focused) }}
          component={ProgressStatsScreen}

        />


      </Tab.Navigator>
    </GestureHandlerRootView>
  );
};

export default TabNavigator;