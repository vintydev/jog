import React, { useState } from "react";
import { View, TextInput, Alert, ScrollView, StatusBar, SafeAreaView, Text, Animated } from "react-native";
import CustomButton from "../../components/CustomButton";
import { AuthStackScreenProps } from "../../types/Navigator";
import * as WebBrowser from "expo-web-browser";
import AuthService from "../../services/AuthService";
import { Ionicons } from "@expo/vector-icons";
import "../../../";
import useAuth from "@/app/hooks/useAuth";

WebBrowser.maybeCompleteAuthSession();

const LoginScreen: React.FC<AuthStackScreenProps<"Login">> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [hasForgotPassword, setHasForgotPassword] = useState(false);
  const [shakeAnim] = useState(new Animated.Value(0)); // Shake animation for errors
  const {user, userData} = useAuth();
  console.log(userData);
  console.log(user);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await AuthService.signIn(email.trim(), password.trim());
      Alert.alert("Success", "You have successfully logged in.");
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Failed", error.message || "An error occurred while logging in.");
      if (error.code === "auth/invalid-credential") {
        setHasForgotPassword(true);
        triggerShake();
      } else {
        setHasForgotPassword(false);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;

    }

    Alert.alert("Alert", "Are you sure you want to reset your password?", [
      {
        text: "Cancel",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel",
      },
      { text: "OK", onPress: async () => await AuthService.changePassword(email.trim()) },
    ]);
  };




  const handleResendEmail = async () => {
    setResendLoading(true);
    if (!email || !password) {
      Alert.alert("Error", "Please enter the email address and password you used to sign up with then try again.");
      setResendLoading(false);
      return;
    }
    await AuthService.resendVerificationEmail(email.trim(), password.trim());
    setResendLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerClassName="flex-1 justify-center items-center px-6">


        <View className="items-center mb-6">
          <Ionicons name="log-in-outline" size={64} color="#EB5A10" />
          <Text className="text-3xl font-sf-pro-bold text-center mt-2">Welcome Back</Text>
          <Text className="text-gray-500 text-center mt-1">Log in to continue your jogs!</Text>
        </View>


        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }} className="w-full">
          <TextInput
            className="w-full p-4 mb-3 border border-gray-300 rounded-lg  bg-gray-100"
            placeholder="Email"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            
          />
          <TextInput
            className="w-full p-4 mb-4 border border-gray-300 rounded-lg  bg-gray-100"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </Animated.View>


        {hasForgotPassword && (
          <View className="w-full items-center">


            <Text className=" text-gray-500 underline mb-2 text-center" onPress={() => handleForgotPassword()}>
              Forgot Password?
            </Text>

          </View>
        )}


        <CustomButton text="Login" onPress={handleLogin} isLoading={loading} type="primary" />

        {/* Resend Verification Email */}
        <CustomButton text="Resend Verification Email" onPress={handleResendEmail} type="secondary" isLoading={resendLoading} />

        {/* Sign Up Link */}
        <Text className="text-center mt-4 text-gray-500">
          Don't have an account? {" "}
          <Text className="text-black font-sf-pro-bold underline" onPress={() => navigation.navigate("Signup")}>
            Sign up
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;