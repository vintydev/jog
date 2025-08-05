import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from "react-native";
import DatePickerModal from "../../components/DatePickerModal";
import CustomButton from "../../components/CustomButton";
import { AuthSelections, AuthStackScreenProps } from "../../types/Navigator";
import { getAuth } from "firebase/auth";
import AuthService from "@/app/services/AuthService";
import AuthLayout from "@/app/components/AuthLayout";
import useAuth from "@/app/hooks/useAuth";

const AgeScreen: React.FC<AuthStackScreenProps<"Age">> = ({ navigation, route }) => {
  const auth = getAuth();
  const { user } = useAuth();

  const [date, setDate] = useState<Date | null>(null);
  const [isGoogle, setIsGoogle] = useState<boolean>(false);
  const [proceedLoading, setProceedLoading] = useState(false); // For Proceed button
  const [logoutLoading, setLogoutLoading] = useState(false);   // For Logout button

  // Minimum date is 18 years
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);

  useEffect(() => {
    if (user) {
      const providerData = user.providerData;
      const isSignedInWithGoogle = providerData.some(
        (provider) => provider.providerId === "google.com"
      );

      setIsGoogle(isSignedInWithGoogle);
      console.log("User signed in with Google:", isSignedInWithGoogle);
    }
  }, [user]);

  const handleNext = async () => {
    if (!date) {
      Alert.alert("Missing Information", "Please select a valid date of birth.");
      return;
    }
    if (date > maxDate) {
      Alert.alert("Invalid Date", "You must be at least 18 years old to use this app.");
      return;
    }

    setProceedLoading(true); // Start loading for Proceed button

    const selections: AuthSelections = {
      isFromGoogle: isGoogle,
      date: date,
      gender: null,
      adhdDiagnosed: null,
      dateDiagnosed: null,
      isWaiting: null,
      isDiagnosedPrivately: null,
      lengthWaiting: null,
      isMedicated: null,
      medications: [],
      employabilityStatus: null,
      isStudent: null,
      memorySeverity: null,
      concentrationSeverity: null,
      moodSeverity: null,
      username: '',
      email: '',
      password: '',
      questionnaireTime: null,
    };

    navigation.navigate("GenderInfo", {
      selections: {
        ...selections,
        isFromGoogle: isGoogle,
        date: date,
      },
    });

    setTimeout(() => {
      setProceedLoading(false); // Stop loading after navigation
    }, 1000);
  };

  const handleLogout = async () => {
    setLogoutLoading(true); // Start loading for Logout button

    try {

      Alert.alert(
        "Logout",
        "Are you sure you want to log out?",
        [
          {
            text: "Cancel",
            onPress: () => setLogoutLoading(false),
            style: "cancel",
          },
          {
            text: "OK",
            onPress: async () => {
              await auth.signOut();
              navigation.goBack();
            },
          },
        ]
      );


    } catch (error: any) {
      Alert.alert("Error", error.message);

    } finally {
      setLogoutLoading(false);
    }
  };

  return (

    <AuthLayout>

      <Text style={styles.title}>What is your Date of Birth?</Text>

      <DatePickerModal
        date={date || new Date()}
        setDate={setDate}
        mode="date"
        maximumDate={maxDate}
        title="Select Date"
        confirmText="Done"
        cancelText="Cancel"
 
        
      />

      <CustomButton
        text="Proceed"
        onPress={handleNext}
        isLoading={proceedLoading}
        type="secondary"
      />

      {user ? (
        <>

          <Text style={styles.orText}>or</Text>

          <CustomButton
            text="Log out"
            onPress={handleLogout}
            isLoading={logoutLoading}
            type="secondary"
          />
        </>

      ) : null}

    </AuthLayout>



  );
};

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

export default AgeScreen;