import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, TouchableOpacity, Platform } from "react-native";
import CustomInput from "../../components/CustomInput";
import CustomButton from "../../components/CustomButton";
import { AuthSelections, AuthStackScreenProps } from "../../types/Navigator";
import AuthService from "../../services/AuthService";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons"; 

import UserService from "@/app/services/UserService";
import useAuth from "@/app/hooks/useAuth";
import { useNotification } from "@/app/contexts/NotificationContext";
import UserStatsService from "@/app/services/UserStatsService";
import Constants from "expo-constants";


const AuthInfoScreen: React.FC<AuthStackScreenProps<"AuthInfo">> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

  const { user, userData } = useAuth();
  const { expoPushToken } = useNotification();

  const { selections } = route.params;

  const buildNumber: string = Platform.OS === "ios"
      ? Constants?.expoConfig?.ios?.buildNumber ?? "unknown"
      : Constants?.expoConfig?.android?.version ?? Constants?.expoConfig?.ios?.buildNumber ?? "unknown";

  const openBrowser = async () => {
    await WebBrowser.openBrowserAsync('https://jog-app-c827d.web.app');
  };

  const handleSignUp = async () => {
    setLoading(true);

    try {
      if (!acceptedTerms) {
        Alert.alert("Terms Not Accepted", "You must accept the Terms and Services to proceed.");
        return;
      }

      if (!selections.isFromGoogle) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
          Alert.alert("Invalid Email", "Please enter a valid email address.");
          return;
        }

        if (password !== confirmPassword) {
          Alert.alert("Password Mismatch", "Passwords do not match.");
          return;
        }
      }

      if (username.length < 6) {
        Alert.alert("Invalid Username", "Username must be at least 6 characters long.");
        return;
      }

      if (selections.isFromGoogle) {
        if (!user) {
          Alert.alert("Error", "User information is not available.");
          return;
        }

        await UserService.updateUserInformation(user.uid as string, {
          ...selections,
          username,
          email: user.email ?? "",
          password: "",
        });

        await UserStatsService.updateStats(user.uid as string, {
          buildJoined: buildNumber,
          symptomStats: {
            questionnaireTime: selections.questionnaireTime,
            questionnaireTimeSet: true,
            initialConcentrationSeverity: selections.concentrationSeverity,
            initialMemorySeverity: selections.moodSeverity,
            initialMoodSeverity: selections.memorySeverity,
          },
        });

        Alert.alert("Success", "You have successfully signed up!");
        return;
      }

      const userInfo: AuthSelections = {
        ...selections,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        
      };

      const userCredential = await AuthService.signUp(userInfo, expoPushToken ?? "");
      const userAuth = userCredential?.user;

      if (userAuth) {
        Alert.alert("Success", "An email verification has been sent. Please verify your email address before logging in.", [
          {
            text: "OK",
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              }),
          },
        ]);
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Sign-Up Failed", error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleConfirmation = () => {
    Alert.alert("Confirm Submission", "Are you sure you want to submit your information?", [
      { text: "Cancel", style: "cancel" },
      { text: "Submit", onPress: handleSignUp },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={100}
      className="flex-1 justify-center items-center p-5 bg-white"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <Text style={styles.title}>Authentication Information</Text>

      <CustomInput
        label="Username"
        value={username.trim()}
        onChangeText={setUsername}
        placeholder="Enter username"
        icon={<Ionicons name="person-outline" size={20} color="gray" />}
      />

      {selections.isFromGoogle ? (
        <>
          <View className="flex-row items-center mt-3">
            <TouchableOpacity onPress={() => setAcceptedTerms((prev) => !prev)} className="mr-2">
              <Ionicons
                name={acceptedTerms ? "checkbox-outline" : "square-outline"}
                size={24}
                color={acceptedTerms ? "#EB5A10" : "gray"}
              />
            </TouchableOpacity>

            <Text className="text-sm text-center mt-2 mb-2">
              I accept the{" "}
              <Text
                className="underline text-primary-0 font-semibold"
                onPress={openBrowser}
              >
                {"Terms of Service"}
              </Text>
            </Text>
          </View>

          <CustomButton text="Sign Up" onPress={handleSignUp} isLoading={loading} type="primary" />

          <Text style={{ marginTop: 10, color: "gray" }}>
            You signed up with Google. Please confirm your submission. You can change this later.
          </Text>

          
        </>
      ) : (
        <>
          <CustomInput
            label="Email"
            value={email.trim()}
            onChangeText={setEmail}
            placeholder="Enter email"
            keyboardType="email-address"
            icon={<Ionicons name="mail-outline" size={20} color="gray" />}
          />
          <CustomInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
            icon={<Ionicons name="lock-closed-outline" size={20} color="gray" />}
          />
          <CustomInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            secureTextEntry
            icon={<Ionicons name="shield-checkmark-outline" size={20} color="gray" />}
          />
          <View className="flex-row items-center mt-3">
            <TouchableOpacity onPress={() => setAcceptedTerms((prev) => !prev)} className="mr-2">
              <Ionicons
                name={acceptedTerms ? "checkbox-outline" : "square-outline"}
                size={24}
                color={acceptedTerms ? "#EB5A10" : "gray"}
              />
            </TouchableOpacity>

            <Text className="text-sm text-center mt-2 mb-2">
              I accept the{" "}
              <Text
                className="underline text-primary-0 font-semibold"
                onPress={openBrowser}
              >
                {"Terms of Service"}
              </Text>
            </Text>
          </View>

          <CustomButton text="Sign Up" onPress={handleSignUp} isLoading={loading} type="primary" />
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
});

export default AuthInfoScreen;