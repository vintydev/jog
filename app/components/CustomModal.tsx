import React, { useState } from "react";
import { View, Text, Modal } from "react-native";
import CustomButton from "./CustomButton";

interface CustomModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    children: React.ReactNode;
}

const CustomModal: React.FC<CustomModalProps> = ({
    visible,
    onClose,
    title = "Enter Details",
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    children,
}) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white p-6 rounded-t-lg items-center w-full">
                    <Text className="text-lg font-sf-pro-bold mb-4">{title}</Text>

                    {/* Content Passed Inside Modal */}
                    {children}

                    <CustomButton
                        onPress={() => {
                            onConfirm ? onConfirm() :
                            onClose();
                        }}
                        isLoading={false}
                        type="primary"
                        text={confirmText}
                    />

                    <CustomButton
                        onPress={onClose}
                        isLoading={false}
                        type="secondary"
                        text={cancelText}
                    />
                </View>
            </View>
        </Modal>
    );
};

export default CustomModal;