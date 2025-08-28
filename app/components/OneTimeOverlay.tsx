import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Modal, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomButton from "./CustomButton";
import * as Device from "expo-device";

interface OneTimeOverlayProps {
    storageKey: string;
    title: string;
    message: string;
    buttonText?: string;
    onDismiss?: () => void;
}

const OneTimeOverlay: React.FC<OneTimeOverlayProps> = ({ storageKey, title, message, buttonText = "Got it!", onDismiss}) => {
    
    const [visible, setVisible] = useState(false);
    const screenWidth = Dimensions.get("window").width;

    // useeffect for 
    useEffect(() => {

        const devReset = () => {

            console.log("" + __DEV__ ? "Development mode: Resetting overlay" : "Production mode: Overlay reset not allowed");

            // Reset the overlay for development purposes
            if (Device.isDevice && __DEV__) {
                AsyncStorage.removeItem(storageKey);
            }
        };

        devReset();
    }, [storageKey]);   


    useEffect(() => {

        // Check if the overlay has been seen before
        // If not, set it to visible
        const checkIfSeen = async () => {
            const seen = await AsyncStorage.getItem(storageKey);
            if (!seen) setVisible(true);
        };
        checkIfSeen();
    }, []);

    const handleDismiss = async () => {
        await AsyncStorage.setItem(storageKey, "true");
        setVisible(false);
        onDismiss?.();
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={handleDismiss}
                className="flex-1 bg-black/50 justify-center items-center px-6"
            >
                <View className="bg-white rounded-2xl p-6 shadow-lg max-w-sm w-full">
                    <Text className="text-lg font-sf-pro-bold mb-2 text-black text-center">{title}</Text>
                    <Text className="text-sm text-gray-700 text-center mb-4">{message}</Text>
                    <CustomButton
                        text={buttonText}
                        type="primary"
                        onPress={handleDismiss}
                        customStyle={{
                            width: screenWidth * 0.7,
                            alignSelf: "center",
                    
                        }}
                        height={40} isLoading={false}  />
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default OneTimeOverlay;