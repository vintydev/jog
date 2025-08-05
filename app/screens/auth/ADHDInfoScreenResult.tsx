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

const ADHDInfoScreenResult: React.FC<AuthStackScreenProps<"ADHDInfoResult">> = ({ navigation, route }) => {

    const [loading, setLoading] = useState(false);
    const [dateDiagnosed, setDateDiagnosed] = useState<string | null>(null);
    const [isWaiting, setIsWaiting] = useState<boolean | null>(null);

    const { selections } = route.params;
    const isDiagnosed = selections.adhdDiagnosed;

    const handleYearInput = (text: string) => {
        const sanitisedText = text.replace(/[^0-9]/g, "");

        if (sanitisedText.length <= 4) {
            setDateDiagnosed(sanitisedText);
        }

    };

    console.log(selections);

    const handleNext = () => {
        setLoading(true);

        const updatedSelections = {
            ...selections,
            dateDiagnosed: dateDiagnosed,
            isWaiting: isWaiting
        };

        if (isDiagnosed) {
            if (!dateDiagnosed || dateDiagnosed.length !== 4) {
                alert("Please enter a valid 4-digit year before proceeding.");
                setLoading(false);
                return;
            }

            const year = parseInt(dateDiagnosed, 10);
            const currentYear = new Date().getFullYear();

            if (year < 1900 || year > currentYear) {
                alert(`Please enter a year between 1900 and ${currentYear}.`);
                setLoading(false);
                return;
            }
        }

        if (!isDiagnosed && isWaiting === null) {
            alert("Please select an option before proceeding.");
            setLoading(false);
            return;
        }

        let targetRoute: string = "";

        if (isDiagnosed) {
            targetRoute = "ADHDInfoResult2";
        } else if (isWaiting === false) {
            targetRoute = "MedicationInfo";
        } else {
            targetRoute = "ADHDInfoResult2";
        }

        // Navigate to route based on conditions
        if (targetRoute) {
            navigation.navigate(targetRoute as any, { selections: updatedSelections, });
        } else {
            alert("Please complete the required fields before proceeding");
        }

        setLoading(false);

    };

    return (

        <>
            {isDiagnosed ? (
                <AuthLayout>
                    <Text className="text-2xl font-sf-pro-bold mb-5 text-center">What year were you diagnosed?</Text>
                    <CustomInput
                        value={dateDiagnosed ? dateDiagnosed : ""}
                        onChangeText={(text) => handleYearInput(text)}
                        placeholder="Enter Year"
                        onPress={() => { }}
                        editable={true}
                        keyboardType="numeric"
                        maxLength={4}
                    />
                    <Text className="text-sm text-gray-500 mb-5 text-center">An estimate is fine!</Text>
                    <CustomButton
                        text="Proceed"
                        onPress={handleNext}
                        isLoading={loading}
                        type="secondary"
                    />
                </AuthLayout>
            ) : (
                <>
                    <AuthLayout>
                        <Text className="text-2xl font-sf-pro-bold mb-5 text-center">Are you on a waiting list to get diagnosed?</Text>
                        <SelectableButton
                            label="Yes"
                            isSelected={isWaiting === true}
                            onPress={() => setIsWaiting(true)}
                            selectedColor="#D1FAE5"
                            checkmarkColor="#10B981"
                        />
                        <SelectableButton
                            label="No"
                            isSelected={isWaiting === false}
                            onPress={() => setIsWaiting(false)}
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
                </>
            )}
        </>


    );
};

export default ADHDInfoScreenResult;