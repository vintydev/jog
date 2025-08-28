import "./global.css";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import * as Updates from "expo-updates";
import { AppAction } from "./app/types/AppAction";
import { AppState } from "./app/types/AppState";
import AppContent from "./app/components/AppContent";
import AppProviders from "./app/components/AppProviders";
import Constants from "expo-constants";

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'UPDATE_CHECKING':
      return { ...state, updateStatus: 'checking', updateError: undefined };
    case 'UPDATE_DOWNLOADING':
      return { ...state, updateStatus: 'downloading', updateError: undefined };
    case 'UPDATE_READY':
      return { ...state, updateStatus: 'ready', updateError: undefined };
    case 'UPDATE_ERROR':
      return { ...state, updateStatus: 'error', updateError: action.error };
    case 'FONTS_LOADED':
      return { ...state, fontsLoaded: action.loaded };
    case 'APP_READY':
      return { ...state, appIsReady: action.ready };
    default:
      return state;
  }
}

const initialState: AppState = {
  updateStatus: 'idle',
  fontsLoaded: false,
  appIsReady: false,
};

const FONT_CONFIG = {
  "Sura-Bold": require("./app/assets/fonts/Sura-Bold.ttf"),
  "Sura-Regular": require("./app/assets/fonts/Sura-Regular.ttf"),
  "SF-Pro": require("./app/assets/fonts/SF-Pro.ttf"),
  "SF-Pro-Text-Bold": require("./app/assets/fonts/SF-Pro-Text-Bold.otf"),
  "SF-Pro-Text-Regular": require("./app/assets/fonts/SF-Pro-Text-Regular.otf"),
  "SF-Pro-Display-Black": require("./app/assets/fonts/SF-Pro-Display-Black.otf"),
  "SF-Pro-Display-Bold": require("./app/assets/fonts/SF-Pro-Display-Bold.otf"),
  "SF-Pro-Display-Regular": require("./app/assets/fonts/SF-Pro-Display-Regular.otf"),
}

SplashScreen.preventAutoHideAsync();
NavigationBar.setBackgroundColorAsync("#00000000");

const App: React.FC = () => {

  const [state, dispatch] = useReducer(appReducer, initialState);
  const [fontsLoaded] = useFonts(FONT_CONFIG);

  const isDev = __DEV__ || !Constants.isDevice;

  const checkForUpdate = useCallback(async () => {
    
    if (isDev) {
      console.log("Skipping EAS update check in development mode");
      dispatch({ type: 'UPDATE_READY' });
      return; // Early return in development mode
    }

    try {
      dispatch({ type: 'UPDATE_CHECKING' });
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        dispatch({ type: 'UPDATE_DOWNLOADING' });
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
        dispatch({ type: 'UPDATE_READY' });
        return;
      }

      dispatch({ type: 'UPDATE_READY' });
    }
    catch (e: any) {
      console.error("EAS update check failed:", e);
      dispatch({ type: 'UPDATE_ERROR', error: e?.message || 'Unknown error' });
    }

  }, []);

  useEffect(() => {
    dispatch({ type: 'FONTS_LOADED', loaded: fontsLoaded });
  }, [fontsLoaded, state.fontsLoaded]);

  useEffect(() => {
    const isUpdateComplete = ['ready', 'error'].includes(state.updateStatus);
    if (isUpdateComplete && state.fontsLoaded && !state.appIsReady) {
      dispatch({ type: 'APP_READY', ready: fontsLoaded });
    }

  }, [state.updateStatus, state.fontsLoaded, state.appIsReady]);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);


  if (!state.appIsReady) {
    return null;
  }

  return (
    <AppProviders>
      <NavigationContainer onReady={SplashScreen.hideAsync}>
        <AppContent />
      </NavigationContainer>
    </AppProviders>

  );
};

export default App;