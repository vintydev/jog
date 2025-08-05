import { AuthStackScreenProps } from "@/app/types/Navigator";
import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import SelectableButton from "@/app/components/SelectableButton";
import CustomButton from "@/app/components/CustomButton";
import TermsandConditionsFooter from "@/app/components/TermsandConditionsFooter";
import { A } from "@expo/html-elements";
import AuthLayout from "@/app/components/AuthLayout";

const ADHDInfoScreen: React.FC<AuthStackScreenProps<"ADHDInfo">> = ({ navigation, route }) => {

    const [isDiagnosed, setIsDiagnosed] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);

    const { selections } = route.params;
    console.log(selections);

    const handleNext = () => {

        setLoading(true);

        if (isDiagnosed === null) {
            alert("Please select an option before proceeding.");
            setLoading(false);
            return;
        }

        navigation.navigate("ADHDInfoResult", {
            selections: {
                ...selections,
                adhdDiagnosed: isDiagnosed,
            },
        });

        setLoading(false);
        
    };

    return (
        <AuthLayout>
            <Text className="text-2xl font-sf-pro-bold mb-5 text-center">Are you formally diagnosed with ADHD?</Text>

   
            <SelectableButton
                label="Yes"
                isSelected={isDiagnosed === true}
                onPress={() => setIsDiagnosed(true)}
                selectedColor="#D1FAE5" 
                checkmarkColor="#10B981"
            />

            <SelectableButton
                label="No, but I suspect I have it"
                isSelected={isDiagnosed === false}
                onPress={() => setIsDiagnosed(false)}
                selectedColor="#FECACA" 
                checkmarkColor="#EF4444"
            />

            <CustomButton
                text="Proceed"
                onPress={handleNext}
                isLoading={loading}
                type="secondary"
            />

            </AuthLayout>
    );
};

export default ADHDInfoScreen;