import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ViewStyle } from "@expo/html-elements/build/primitives/View";
import CustomButton from "./CustomButton";

interface InfoPopupProps {
    title?: string;
    modalTitle?: string;
    message: string;
    icon?: string;
    className?: string;

}

const InfoPopup: React.FC<InfoPopupProps> = ({ title, modalTitle, message, icon = "information-circle-outline", className }) => {
    const [visible, setVisible] = useState(false);

    return (
        <View className={className}>
          
            <TouchableOpacity onPress={() => setVisible(true)} className="flex-row items-center">
                <Ionicons name={icon as any} size={24} color="#EB5A10" />
                <Text className="text-lg font-sf-pro-bold text-primary-0"></Text>
            </TouchableOpacity>

          
            <Modal
                animationType="fade"
                transparent
                visible={visible}
                onRequestClose={() => setVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white p-6 items-center rounded-2xl shadow-lg w-11/12 max-w-md mx-auto">
                     
                        <View className="flex-row items-center mb-4">
                            <Ionicons name={icon as any} size={28} color="#EB5A10" />
                            <Text className="text-xl font-sf-pro-bold text-gray-900 ml-2">{modalTitle}</Text>
                        </View>

                       
                        <Text className="text-gray-700 text-base ">{message}</Text>

                        <View className="flex-row justify-center mt-6">
                            <CustomButton
                                text="Got it!"
                                type="primary"
                                onPress={() => setVisible(false)}
                                width={100}
                                height={40}
                                isLoading={false}
                            />

                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default InfoPopup;