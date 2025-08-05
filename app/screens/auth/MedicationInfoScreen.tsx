import { AuthStackScreenProps } from "@/app/types/Navigator";
import React, { useState } from "react";
import { View, Text, FlatList } from "react-native";
import SelectableButton from "@/app/components/SelectableButton";
import CustomButton from "@/app/components/CustomButton";
import CustomInput from "@/app/components/CustomInput";
import AuthLayout from "@/app/components/AuthLayout";
import Ionicons from "react-native-vector-icons/Ionicons";
import CustomModal from "@/app/components/CustomModal";

const MedicationInfoScreen: React.FC<AuthStackScreenProps<"MedicationInfo">> = ({ navigation, route }) => {
    const [loading, setLoading] = useState(false);
    const [takesMedication, setTakesMedication] = useState<boolean | null>(null);
    const [medications, setMedications] = useState<{ name: string; dosage: string }[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [medName, setMedName] = useState("");
    const [medDosage, setMedDosage] = useState("");

    const { selections } = route.params;

    const addMedication = () => {
        if (!medName.trim() || !medDosage.trim()) {
            alert("Please enter both medication name and dosage.");
            return;
        }

        setMedications([...medications, { name: medName.trim(), dosage: medDosage.trim() }]);
        setMedName("");
        setMedDosage("");
        setModalVisible(false);
    };

    const removeMedication = (index: number) => {
        setMedications((prevMedications) => prevMedications.filter((_, i) => i !== index));
    };

    const handleNext = () => {
        setLoading(true);

        if (takesMedication === null) {
            alert("Please select an option");
            setLoading(false);
            return;
        }

        navigation.navigate("OccupationInfo", {
            selections: {
                ...selections,
                isMedicated: takesMedication,
                medications
            },
        });

        setLoading(false);
    };

    return (
        <AuthLayout>
            <View className="flex-1 justify-center items-center px-4">
                <Text className="text-2xl font-sf-pro-bold  text-center">
                    Do you take medication or supplements for ADHD?{"\n"}
                </Text>
                <Text className="text-sm mb-5 text-center text-gray-500">
                    You can change this later in settings.
                </Text>

                <SelectableButton
                    selectedColor="#D1FAE5"
                    checkmarkColor="#10B981"
                    label="Yes"
                    isSelected={takesMedication === true}
                    onPress={() => { setTakesMedication(true); }}
                />
                <SelectableButton
                    selectedColor="#FECACA"
                    checkmarkColor="#EF4444"
                    label="No"
                    isSelected={takesMedication === false}
                    onPress={() => { setTakesMedication(false); setMedications([]); }}
                />

                <CustomButton
                    text="Proceed"
                    onPress={handleNext}
                    isLoading={loading}
                    type="secondary"

                />
            </View>


        </AuthLayout>
    );
};

export default MedicationInfoScreen;