import React, { useState } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { AuthStackScreenProps } from "../../types/Navigator";
import CustomButton from "@/app/components/CustomButton";
import CustomSelectList from "@/app/components/CustomSelectList";
import AuthLayout from "@/app/components/AuthLayout";
import "../../../";

const GenderScreen: React.FC<AuthStackScreenProps<"GenderInfo">> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);

  const { selections } = route.params;

  const handleNext = () => {
    if (!selectedGender) {
      Alert.alert("Please select a gender before proceeding.");
      return;
    }

    navigation.navigate("ADHDInfo", {
      selections: {
        ...selections,
        gender: selectedGender
      },
    });
  };

  const genderOptions = [
    { key: "Male", value: "Male" },
    { key: "Female", value: "Female" },
    { key: "Non-binary", value: "Non-binary" },
    { key: "Prefer not to say", value: "Prefer not to say" },
  ];

  return (
    <AuthLayout>
      <Text style={styles.title}>What is your Gender?</Text>

      <CustomSelectList
        data={genderOptions}
        setSelected={setSelectedGender}
        placeholder={selectedGender ? selectedGender : "Select your gender"}
        dropdownStyles={{height: genderOptions.length * 40}}
        
      />

      <CustomButton text="Proceed" onPress={handleNext} isLoading={loading} type="secondary" />
    </AuthLayout>
  );
};

export default GenderScreen;

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
});