import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Alert, ScrollView } from "react-native";
import { TaskStackScreenProps } from "@/app/types/Navigator";
import CustomButton from "@/app/components/CustomButton";
import TaskCategorySelector from "@/app/components/TaskCategorySelector";
import useAuth from "@/app/hooks/useAuth";;
import CustomSelectList from "@/app/components/CustomSelectList";
import UserService from "@/app/services/UserService";

const AddTaskCategoryScreen: React.FC<TaskStackScreenProps<"AddTaskCategory">> = ({ navigation }) => {
    const [category, setCategory] = useState<string>("Medication");
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [medications, setMedications] = useState<{ name: string; dosage: string }[]>([]);
    const [selectedMedication, setSelectedMedication] = useState<{ name: string; dosage: string } | null>(null);

    const [taskDetails, setTaskDetails] = useState({
        title: "",
        medicationName: "",
        dosage: "",
        notes: "",
    });

    useEffect(() => {
        const fetchMedications = async () => {
            if (user?.uid) {
                await UserService.fetchMedicationByUser(user?.uid).then((meds) => {

                    setMedications(meds);
                });
            }
        }
        fetchMedications();
    }, [user?.uid]);

    const capitaliseFirstLetter = (str: string): string => {

        // Get each word
        let words = str.split(" ");

        // Capitalise each word
        words = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));

        // join the words back together
        return words.join(" ");
    };




    const handleInputChange = (field: string, value: string) => {
        console.log("changes", field, value)
        setTaskDetails((prev) => ({ ...prev, [field]: value }));
    };

    const validateInputs = () => {
        if (!taskDetails.title.trim()) {
            Alert.alert("Missing Title", "Please enter a title for your jog.");
            return false;
        }
        if (category === "Medication" && !selectedMedication && (!taskDetails.medicationName.trim() || !taskDetails.dosage.trim())) {
            Alert.alert("Missing Information", "Please select a medication or enter a new one.");
            return false;
        }

        return true;


    };

    return (
        <View className="flex-1 bg-gray-100">
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }} className="p-5">


                <View className="mb-4 justify-start flex-row ">
                    <Text className="text-[30px] font-sf-pro-display-bold text-black"> Add {category}</Text>
                    <Text className="text-[30px] font-sf-pro-display-bold text-primary-0"> Jog</Text>
                </View>


                <TaskCategorySelector category={category} setCategory={setCategory} />


                <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6">
                    <Text className="text-lg font-sf-pro-bold">Name your Jog</Text>
                    <TextInput
                        className="border p-3 rounded-lg mt-2"
                        placeholder="Enter jog title..."
                        value={
                            category === "Medication" && selectedMedication
                                ? `Take ${taskDetails.medicationName ?? ""} - ${taskDetails.dosage ?? ""}`
                                : taskDetails.title
                        }
                        onChangeText={(value) => {
                    
                            if(category !== "Medication" && selectedMedication) {
                                setTaskDetails((prev) => ({ ...prev, medicationName: "", dosage: "" }));
                                setSelectedMedication(null);
                            }
                            handleInputChange("title", value);
                        }}
                    
                        onBlur={() => {
                            if (category === "Medication" && taskDetails.medicationName && selectedMedication) {
                                handleInputChange(
                                    "title",
                                    `Take ${taskDetails.medicationName} - ${taskDetails.dosage}`
                                );
                            }
                        }}
                        autoCorrect={false}
                        autoCapitalize="sentences"
                        editable={!(category === "Medication" && selectedMedication)} 
                        style={{
                            backgroundColor: category === "Medication" && selectedMedication ? "#E5E7EB" : "#fff",
                            opacity: category === "Medication" && selectedMedication ? 0.5 : 1,
                        }}
                    />
                </View>

                {/* Medication Section */}
                {category === "Medication" && (
                    <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6">
                        <Text className="text-lg font-sf-pro-bold">Medication Details</Text>

                        {/* Select Medication from List */}
                        {medications && medications.length > 0 && (
                            <>
                                <Text className="text-sm text-gray-500 mt-2">Select a previous medication</Text>
                                <View className="flex-row flex-wrap mt-2">
                                    <CustomSelectList
                                        data={medications.map(med => ({
                                            key: `${med.name}-${med.dosage}`,
                                            value: `${med.name + " - " + med.dosage}`
                                        })).sort((a, b) => a.value.localeCompare(b.value))}

                                        setSelected={(val: string) => {

                                            const [medName, medDosage] = val.split("-");
                                            console.log(medName + medDosage)

                                            handleInputChange("medicationName", medName);
                                            handleInputChange("dosage", medDosage);
                                            handleInputChange("title", `Take ${medName} - ${medDosage}`);
                                            setSelectedMedication({ name: medName, dosage: medDosage });


                                        }}
                                        boxStyles={{ borderRadius: 10, borderWidth: 1, borderColor: "#ccc", width: "100%" }}

                                        placeholder={ selectedMedication ? `${selectedMedication.name} - ${selectedMedication.dosage}` : "Select a medication"}


                                    />
                                </View>

                                <Text className="text-sm text-gray-500 m-1 ">or</Text>
                                <View className="border-b-2 border-gray-300 mt-2"></View>
                            </>
                        )}

                        {/* Manual Medication Entry */}
                        <Text className="text-sm text-gray-500 mt-2">Enter a medication</Text>
                        <Text className="text-lg font-sf-pro-bold mt-4">Name</Text>
                        <TextInput
                            className="border p-3 rounded-lg mt-2"
                            placeholder="e.g., Elvanse"
                            value={taskDetails.medicationName}
                            onChangeText={(value) => {
                                setSelectedMedication(null);
                                handleInputChange("medicationName", capitaliseFirstLetter(value));
                            }}
                            autoCorrect={false}
                            editable={!selectedMedication}
                            style={{
                                backgroundColor: selectedMedication ? "#E5E7EB" : "#fff",
                                opacity: selectedMedication ? 0.5 : 1,
                            }}
              
                        />

                        <Text className="text-lg font-sf-pro-bold mt-4">Dosage</Text>
                        <TextInput
                            className="border p-3 rounded-lg mt-2"
                            placeholder="e.g., 30mg"
                            value={taskDetails.dosage}
                            onChangeText={(value) => {

                                handleInputChange("dosage", value);
                            }}
                            autoCorrect={false}
                            editable={!selectedMedication}
                            style={{
                                backgroundColor: selectedMedication ? "#E5E7EB" : "#fff",
                                opacity: selectedMedication ? 0.5 : 1,
                            }}
                        />
                    </View>
                )}

                {/* Notes Section */}
                <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-10">
                    <Text className="text-lg font-sf-pro-bold">Additional Notes (Optional)</Text>
                    <TextInput
                        className="border p-3 rounded-lg mt-2"
                        placeholder="Add any extra details..."
                        value={taskDetails.notes}
                        onChangeText={(value) => handleInputChange("notes", value)}
                        multiline
                    />
                </View>

                <View className="bg-gray-100 rounded-2xl shadow-lg justify-items-end items-center w-auto mx-auto p-6">
                    <CustomButton
                        text="Next"
                        onPress={() => validateInputs() && navigation.navigate("AddTaskSchedule", { taskDetails: { ...taskDetails, category } })}
                        type="primary"
                        isLoading={loading}
                        width={200}
                    />
                </View>

            </ScrollView>



        </View>
    );
};

export default AddTaskCategoryScreen;