import { AuthStackScreenProps } from "@/app/types/Navigator";
import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import SelectableButton from "@/app/components/SelectableButton";
import CustomButton from "@/app/components/CustomButton";
import TermsandConditionsFooter from "@/app/components/TermsandConditionsFooter";
import AuthLayout from "@/app/components/AuthLayout";

const OccupationInfoScreen: React.FC<AuthStackScreenProps<"OccupationInfo">> = ({ navigation, route }) => {

    const [employabilityStatus, setEmployabilityStatus] = useState<string | null>(null);
    const [isStudent, setIsStudent] = useState<boolean>(false);

    const [loading, setLoading] = useState(false);

    const { selections } = route.params;

    console.log(selections);

    const handleNext = () => {

        setLoading(true);

        if (employabilityStatus === null) {
            alert("Please select an employment status before proceeding.");
            setLoading(false);
            return;
        }

        navigation.navigate("MemoryInfo", {
            selections: {
                ...selections,
                employabilityStatus: employabilityStatus,
                isStudent: isStudent,
            },
        });



        setLoading(false);

    };

    return (

        <AuthLayout>

            <Text className="text-2xl font-sf-pro-bold mb-5 text-center">Do you work or study?</Text>
            <Text className="text-sm mb-5 text-gray-500">Select any that apply</Text>

            <SelectableButton
                label="Full-time"
                isSelected={employabilityStatus === "Full-time"}
                onPress={() => setEmployabilityStatus("Full-time")}

            />

            <SelectableButton
                label="Part-time"
                isSelected={employabilityStatus === "Part-time"}
                onPress={() => setEmployabilityStatus("Part-time")}

            />
            <SelectableButton
                label="Unemployed"
                isSelected={employabilityStatus === "Unemployed"}
                onPress={() => setEmployabilityStatus("Unemployed")}


            />


            <SelectableButton
                label="Student"
                isSelected={isStudent === true}
                onPress={() => setIsStudent((prev) => !prev)}

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


export default OccupationInfoScreen;