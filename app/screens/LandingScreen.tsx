import { View, StatusBar, ScrollView, Text, Image, Alert, SafeAreaView, Pressable, ActivityIndicator, Platform } from "react-native";
import * as NavigationBar from 'expo-navigation-bar';
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { AuthStackScreenProps } from "../types/Navigator";
import images from "../constants/Images";
import CustomButton from "../components/CustomButton";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AuthService from "../services/AuthService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeRedirectUri } from "expo-auth-session";

import { GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from "@env";
import { useNotification } from "../contexts/NotificationContext";
import Constants from "expo-constants";

import useAuth from "../hooks/useAuth";

import { getFunctions, httpsCallable } from "firebase/functions";

WebBrowser.maybeCompleteAuthSession();



const LandingScreen: React.FC<AuthStackScreenProps<"Landing">> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const { user, userData, loading: userLoading } = useAuth();
  const { expoPushToken } = useNotification();

  // Holds mutable values between renders
  const hasRedirected = useRef(false);


  const buildNumber: string = Platform.OS === "ios"
  
    ? Constants?.expoConfig?.ios?.buildNumber ?? "unknown"
    : Constants?.expoConfig?.android?.version ?? Constants?.expoConfig?.ios?.buildNumber ?? "unknown";

  const [activeIndex, setActiveIndex] = useState<number>(0);

  const carouselItems = [
    {
      type: "image",
      image: images.jogMascot,
    },
    {
      title: "Rest your ADHD brain",
      description: "Break your daily tasks into 'jogs' — small structured tasks that keep you focussed and moving.",
    },
    {
      title: "Step-based reminders",
      description: "Split bigger, overwhelming tasks into manageable steps with timed reminders for each part.",
    },
    {
      title: "End-of-day check-ins",
      description: "Reflect on your mood, memory, and concentration to track your ADHD trends over time at a time that suits you.",
    },
  ];

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    redirectUri: makeRedirectUri({
      scheme: 'org.name.jog',
    }),
  });

  useEffect(() => {
    if (
      userData?.isFromGoogle && user && userData?.isSignedUp === false && !hasRedirected.current) {
      hasRedirected.current = true;
      alert("Welcome! Please complete your profile to continue.");
      navigation.navigate("Age");
    }
  }, [userData, user]);

  useEffect(() => {
    if (!user || !userData) {
      hasRedirected.current = false;
    }
  }, [user, userData]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const handleGoogleSignIn = async () => {
      if (response?.type === "success") {
        try {
          const { authentication } = response;

          const googleResponse = await AuthService.signInWithGoogle(response, expoPushToken ?? "");

          if (!googleResponse?.user) throw new Error("Google sign-in failed");

          await AsyncStorage.setItem("user", JSON.stringify(googleResponse.user));


          if (authentication?.accessToken) {
            await AsyncStorage.setItem("googleAccessToken", authentication.accessToken);
          } else {
            throw new Error("Authentication access token is undefined");
          }

          // // Redirect immediately
          // const userRef = await getDoc(doc(db, "users", googleResponse.user.uid));
          // const isSignedUp = userRef.data()?.isSignedUp;

          // if (!isSignedUp) {
          //   navigation.navigate("Age");
          // }

          setLoading(false);
        } catch (error: any) {
          setLoading(false);
          Alert.alert("Google Sign-In Failed", error.message || "Unable to sign in with Google.");
        }
      } else if (response?.type === "error") {
        setLoading(false);
        Alert.alert("Google Sign-In Failed", "An error occurred during sign-in.");
      }
    };

    handleGoogleSignIn();
  }, [response]);

  return (

    <View className="flex-1 bg-[#FFDBB2] relative">
    

      <View style={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingTop: 20 }}>
        <View className="items-center justify-between w-auto mb-8">
          <View className="flex-row items-center">
            <Text className="text-7xl font-sf-pro-display-bold text-primary-0">jog</Text>
            <Image source={images.starAI} style={{ width: 25, height: 25, tintColor: "#EB5A10", marginBottom: 50 }} />
          </View>
          <View className="flex-row items-center">
            <Text className="text-2xl font-sf-pro-display text-black">your personal</Text>
            <Text className="text-2xl font-sf-pro-display-bold text-primary-0"> ADHD </Text>
            <Text className="text-2xl font-sf-pro-display text-black">memory jogger</Text>

          </View>
        </View>


        <View className="mb-10 w-full h-80">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            className="w-full h-full"
            onScroll={(event) => {
              const contentOffsetX = event.nativeEvent.contentOffset.x;
              const index = Math.floor(contentOffsetX / event.nativeEvent.layoutMeasurement.width); // Calculate the index based on the scroll position
              setActiveIndex(index);
            }}
          >
            {carouselItems.map((item, index) => (
              <View
                key={index}
                className="w-[100vw] justify-center items-center px-6"
              >

                {item.type === "image" ? (
                  <Image
                    source={item.image}
                    className="w-72 h-80"
                    resizeMode="contain"
                  />

                ) : (
                  <>
                    <Text className="text-xl font-sf-pro-display-bold text-primary-0 mb-2 text-center">
                      {item.title}
                    </Text>
                    <Text className="text-base font-sf-pro text-black text-center">
                      {item.description}
                    </Text>
                  </>
                )}


              </View>




            ))


            }


          </ScrollView>


          <View className="flex-row justify-center items-center mt-4">
            {carouselItems.map((_, i) => (
              <View
                key={i}
                className={`w-2 h-2 rounded-full mx-1 ${i === activeIndex ? "bg-primary-0" : "bg-gray-300"}`}
              />
            ))}
          </View>


        </View>



          <CustomButton
            onPress={async () => {
              setLoading(true);
              try {
                const result = await promptAsync();
                if (!result || result.type !== "success") {
                  setLoading(false);
                  Alert.alert("Google Sign-In Failed", "Unable to sign in with Google.");
                }
              } catch (error: any) {
                setLoading(false);
                Alert.alert("Google Sign-In Failed", error.message || "Unable to sign in with Google.");
              }
            }}
            text="Sign in with Google"
            icon={images.googleLogo}
            iconName="googleLogo"
            isLoading={loading}
            type="primary"
          />



        <CustomButton
          onPress={() => navigation.navigate("Signup")}
          text="Join with email"
          isLoading={false}
          type="secondary"
        />

        <Pressable className="flex-row mt-2" onPress={() => navigation.navigate("Login")}>
          <Text className="text-primary-black font-sf-pro text-s">Already with us? </Text>
          <Text className="text-black underline font-sf-pro-bold text-s">Sign in</Text>
        </Pressable>
      </View>



      <View className="absolute bottom-0 w-full h-24 items-center justify-center">
        <Text className="text-[12px] font-sf-pro-italic text-primary-0">beta release: {buildNumber}</Text>
      </View>
    </View>
  );
};

export default LandingScreen;