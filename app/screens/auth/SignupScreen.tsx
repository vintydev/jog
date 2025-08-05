import React, { useState } from "react";
import { View, TextInput, Alert, ScrollView, StatusBar, SafeAreaView, Text, KeyboardAvoidingView, Platform } from "react-native";
import CustomButton from "../../components/CustomButton";
import { AuthStackScreenProps } from "../../types/Navigator";
import * as WebBrowser from "expo-web-browser";
import { StyleSheet } from "react-native";
import AuthLayout from "@/app/components/AuthLayout";

WebBrowser.maybeCompleteAuthSession();

const SignupScreen: React.FC<AuthStackScreenProps<"Signup">> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    setLoading(true);

    navigation.navigate("Age");
    setLoading(false);

  }
  return (
    <AuthLayout>


      {/* Header Section */}
      <Text className="text-4xl font-sf-pro-display-black mt-3 p-6" style={{ textAlign: "center" }}>
        Let's get started!
      </Text>

      <Text className="text-[24px] font-sf-pro-display-bold text-center mb-6">
        First, are you 18 years or older?
      </Text>

      <CustomButton
        text="Yes, proceed"
        onPress={handleNext}
        isLoading={loading}
        type="primary"
      />

      <CustomButton
        text="No, go back"
        onPress={() => navigation.goBack()}
        isLoading={false}
        type="secondary"
      />

    </AuthLayout>

  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  orText: { fontSize: 14, textAlign: "center", marginVertical: 10 },
  footer: {
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
    alignItems: "center",
  },
});