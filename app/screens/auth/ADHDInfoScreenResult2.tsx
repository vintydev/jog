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

const ADHDInfoScreenResult2: React.FC<AuthStackScreenProps<"ADHDInfoResult2">> = ({ navigation, route }) => {

    const [loading, setLoading] = useState(false);

    const [lengthWaiting, setLengthWaiting] = useState<string | null>(null);
    const [isDiagnosedPrivately, setIsDiagnosedPrivately] = useState<boolean | null>(null);

    const { selections } = route.params;
    const isDiagnosed = selections.adhdDiagnosed;

    console.log(selections);

    const handleNext = () => {

        setLoading(true);

        if (isDiagnosed && isDiagnosedPrivately === null) {
            alert("Please select an option");
            setLoading(false);
            return;
        }
        if (!isDiagnosed && lengthWaiting === null) {
            alert("Please select an option");
            setLoading(false);
            return;
        }


        navigation.navigate("MedicationInfo", {
            selections: {
                ...selections,
                isDiagnosedPrivately: isDiagnosedPrivately,
                lengthWaiting: lengthWaiting,

            },
        });

        setLoading(false);
    };

    return (
        <>

            {isDiagnosed ? (
                <AuthLayout>

                    <Text className="text-2xl font-sf-pro-bold mb-5 text-center">Were you diagnosed privately?</Text>

                    <SelectableButton
                        label="Yes"
                        isSelected={isDiagnosedPrivately === true}
                        onPress={() => setIsDiagnosedPrivately(true)}
                        selectedColor="#D1FAE5"
                        checkmarkColor="#10B981"
                    />
                    <SelectableButton
                        label="No"
                        isSelected={isDiagnosedPrivately === false}
                        onPress={() => setIsDiagnosedPrivately(false)}
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

            ) : (
                <>
                    <AuthLayout>

                    <Text className="text-2xl font-sf-pro-bold mb-5 text-center">How long have you been waiting?</Text>

                    <SelectableButton
                        label="Less than a month"
                        isSelected={lengthWaiting === "Less than a month"}
                        onPress={() => setLengthWaiting("Less than a month")}

                    />

                    <SelectableButton
                        label="A few months"
                        isSelected={lengthWaiting === "A few months"}
                        onPress={() => setLengthWaiting("A few months")}


                    />
                    <SelectableButton
                        label="A year"
                        isSelected={lengthWaiting === "A year"}
                        onPress={() => setLengthWaiting("A year")}

                    />

                    <SelectableButton
                        label="More than a year"
                        isSelected={lengthWaiting === "More than a year"}
                        onPress={() => setLengthWaiting("More than a year")}
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

export default ADHDInfoScreenResult2;