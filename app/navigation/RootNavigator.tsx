
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { View, ActivityIndicator, StyleSheet, Modal, TouchableOpacity } from "react-native";
import useAuth from "@/app/hooks/useAuth";;
import TabNavigator from "./TabNavigator";
import AuthNavigator from "./AuthNavigator";
import TaskNavigator from "./TaskNavigator";
import { RootStackParamList } from "../types/Navigator";
import DrawerNavigator from "./DrawerNavigator";
import * as Notifications from "expo-notifications";
import QuestionnaireNavigator from "./QuestionnaireNavigator";
import { Ionicons } from "@expo/vector-icons";
import useAppState from "../hooks/useAppState";
import { useAuthContext } from "../contexts/AuthContext";

import {Text } from "react-native";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,

  }),

});


const RootStack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { user, userData, loading } = useAuth();
  const { isAppInForeground } = useAppState();

  const isSignedUpAndVerified = user?.uid && userData?.isSignedUp && (
    user?.providerData?.some(p => p.providerId === "google.com") || user.emailVerified ||
    user?.email === "testjog@test.com"
  );

  if (loading) {
    return (
      <View style={{ backgroundColor: "#fff", flex: 1, justifyContent: "center", alignItems: "center", opacity: 0.4 }}>
        <ActivityIndicator size="large" color="#EB5A10" style={{ opacity: 1.0 }} />
        <Text style={{ fontFamily: "SF-Pro-Display-Bold", fontSize: 20, color: "#EB5A10", marginTop: 10 }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator


      screenOptions={{

        headerTitleStyle: {
          fontFamily: "SF-Pro-Display-Bold",
          fontSize: 32,
          color: "#EB5A10",
        },
        headerTitleAlign: "center",
        headerStyle: {
          shadowColor: "transparent",

        },

      }}
    >

      {// If the user is signed in and has completed the sign-up process, show the DrawerNavigator. Otherwise, show the AuthNavigator.
      }
      {isSignedUpAndVerified ? (
        <RootStack.Screen name="Drawer" component={DrawerNavigator} options={{ headerShown: false }} />
      ) : (
        <RootStack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ headerShown: false }}

        />
      )}

      <RootStack.Screen
        name="Questionnaire"
        component={QuestionnaireNavigator}
        options={({ navigation }) => ({
          headerShown: true,
          headerTitle: "Daily Check-in",
          presentation: "modal",
          headerLeft: () =>
            navigation.canGoBack() ? (
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 20 }}>
                <Ionicons name="arrow-back" size={24} color="#EB5A10" />
              </TouchableOpacity>
            ) : null,
        })}
      />

      <RootStack.Screen name="Tasks" component={TaskNavigator} options={{ headerShown: false }} />

      <RootStack.Screen name="Tab" component={TabNavigator} options={{ headerShown: false }} />



    </RootStack.Navigator>
  );
};

export default RootNavigator;

const styles = StyleSheet.create({
  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    opacity: 0.8,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
});