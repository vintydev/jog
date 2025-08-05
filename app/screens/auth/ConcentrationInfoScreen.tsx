import { AuthStackScreenProps } from "@/app/types/Navigator";
import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import SelectableButton from "@/app/components/SelectableButton";
import CustomButton from "@/app/components/CustomButton";
import CustomInput from "@/app/components/CustomInput";
import DatePickerModal from "@/app/components/DatePickerModal";
import { SafeAreaView } from "react-native-safe-area-context";
import TermsandConditionsFooter from "@/app/components/TermsandConditionsFooter";
import AuthLayout from "@/app/components/AuthLayout";

const ConcentrationInfoScreen: React.FC<AuthStackScreenProps<"ConcentrationInfo">> = ({ navigation, route }) => {

    const [loading, setLoading] = useState(false);
    const [adhdSeverity, setAdhdSeverity] = useState<number | null>(null);

    const { selections } = route.params;


    const handleNext = () => {

        setLoading(true);

        if (adhdSeverity === null) {
            alert("Please select an option before proceeding.");
            setLoading(false);
            return;
        }


        navigation.navigate("MoodInfo", {
            selections: {
                ...selections,
                concentrationSeverity: adhdSeverity,

            },
        });


        setLoading(false);
    };



    return (

        <AuthLayout>


            <Text className="text-2xl font-sf-pro-bold mb-5 text-center">How would you generally rate your concentration?</Text>

            <SelectableButton
                label="Poor"
                isSelected={adhdSeverity === 1}
                onPress={() => { setAdhdSeverity(1) }}
            />

            <SelectableButton
                label="Fine"
                isSelected={adhdSeverity === 2}
                onPress={() => { setAdhdSeverity(2) }}
            />
            <SelectableButton
                label="Moderate"
                isSelected={adhdSeverity === 3}
                onPress={() => { setAdhdSeverity(3) }}
            />
            <SelectableButton
                label="Very good"
                isSelected={adhdSeverity === 4}
                onPress={() => { setAdhdSeverity(4) }}
            />
            <SelectableButton
                label="Extremely good"
                isSelected={adhdSeverity === 5}
                onPress={() => { setAdhdSeverity(5) }}
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

export default ConcentrationInfoScreen;