import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DatePickerModal from "./DatePickerModal";
import CustomButton from "./CustomButton";

interface StepModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (title: string, time: Date) => void;
    minTime?: Date;
}

const StepModal: React.FC<StepModalProps> = ({ visible, onClose, onSave, minTime }) => {
    const [title, setTitle] = useState("");
    const [time, setTime] = useState<Date>(minTime || new Date());

    const handleSave = () => {

        if (!title || !time) alert("Please fill in all fields.");
        if (title.trim()) {
            onSave(title, time);
            setTitle("");
            setTime(minTime || new Date());
            onClose();
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 justify-center items-center bg-black/50 px-6">
                <View className="bg-white rounded-2xl p-5 w-full max-w-md shadow-lg">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-sf-pro-bold text-black">New Step</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="gray" />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        placeholder="Step title"
                        value={title}
                        onChangeText={setTitle}
                        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base bg-gray-50"
                    />

                    <DatePickerModal
                        date={time}
                        setDate={setTime}
                        mode="time"
                        title="Pick Time"
                        maximumDate={new Date(new Date().setHours(23, 59, 59, 999))}
                        minimumDate={minTime || new Date()}
                    />

                    <CustomButton
                        onPress={
                            handleSave
                        }
                        isLoading={false}
                        type="secondary"
                        text="Save"
                        customStyle={{ marginTop: 10, width: "100%" }}
                    />

                </View>
            </View>
        </Modal>
    );
};

export default StepModal;