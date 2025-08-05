import "./global.css";
import React, { useEffect, useState } from "react";
import RootNavigator from "./app/navigation/RootNavigator";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { NotificationProvider } from "./app/contexts/NotificationContext";
import { ConversationProvider } from "./app/contexts/ConversationContext";
import { AuthProvider } from "./app/contexts/AuthContext";
import { SplashScreen } from "expo-router";
import { View, StatusBar, Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";

SplashScreen.preventAutoHideAsync();
NavigationBar.setBackgroundColorAsync("#00000000");

const App: React.FC = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const [updateChecked, setUpdateChecked] = useState(false);

  const [fontsLoaded] = useFonts({
    "Sura-Bold": require("./app/assets/fonts/Sura-Bold.ttf"),
    "Sura-Regular": require("./app/assets/fonts/Sura-Regular.ttf"),
    "SF-Pro": require("./app/assets/fonts/SF-Pro.ttf"),
    "SF-Pro-Text-Bold": require("./app/assets/fonts/SF-Pro-Text-Bold.otf"),
    "SF-Pro-Text-Regular": require("./app/assets/fonts/SF-Pro-Text-Regular.otf"),
    "SF-Pro-Display-Black": require("./app/assets/fonts/SF-Pro-Display-Black.otf"),
    "SF-Pro-Display-Bold": require("./app/assets/fonts/SF-Pro-Display-Bold.otf"),
    "SF-Pro-Display-Regular": require("./app/assets/fonts/SF-Pro-Display-Regular.otf"),
  });

  //  wait for fonts after update check
  useEffect(() => {
    if (updateChecked && fontsLoaded) {
      setAppIsReady(true);
    }
  }, [updateChecked, fontsLoaded]);

  if (!appIsReady) return null;

  return (
    <NotificationProvider>
      <ConversationProvider>
        <AuthProvider>
          <NavigationContainer onReady={SplashScreen.hideAsync}>
            <View style={{ flex: 1 }}>
              {Platform.OS === "android" && (
                <StatusBar
                  barStyle="light-content"
                  backgroundColor="transparent"
                  translucent
                />
              )} 
              <RootNavigator />
            </View>
          </NavigationContainer>
        </AuthProvider>
      </ConversationProvider>
    </NotificationProvider>
  );
};

export default App;