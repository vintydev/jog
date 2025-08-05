import React, { useState, useMemo } from "react";
import { View, Text, Modal, Pressable, Platform } from "react-native";
import DateTimePicker, { Event } from "@react-native-community/datetimepicker";
import CustomButton from "./CustomButton";

interface DatePickerModalProps {
    date: Date;
    setDate: (date: Date) => void;
    mode?: "date" | "time" | "datetime";
    minimumDate?: Date;
    maximumDate?: Date;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    display?: "spinner" | "default" | "calendar" | "clock";
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
    date = new Date(),
    setDate,
    mode = "date",
    minimumDate,
    maximumDate,
    title = "Select Date",
    confirmText = "Done",
    cancelText = "Cancel",
    display = "default",
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [tempDate, setTempDate] = useState(date);

    const [showAndroidPicker, setShowAndroidPicker] = useState(false);
    const [hasChanged, setHasChanged] = useState(false);



    const handleDateChange = (_: any, selectedDate?: Date) => {

        if (selectedDate) {
            setTempDate(selectedDate);

            if (Platform.OS === "android") {
                // On Android, apply immediately and close picker
                setDate(selectedDate ?? minimumDate);
                setShowAndroidPicker(false);
            } else {
                // On iOS, let user confirm manually in modal
                setHasChanged(true);
            }
        } else if (Platform.OS === "android") {
            setShowAndroidPicker(false);
        }
    };

    const openPicker = () => {
        setTempDate(date);

        if (Platform.OS === "android") {
            setShowAndroidPicker(true);
        } else {
            setModalVisible(true);
        }
    };

    return (
        <View>
            <Pressable
                className="p-3 bg-primary-0 rounded-lg items-center"
                onPress={openPicker}
            >
                <Text className="text-lg font-sf-pro-bold text-white">
                    {date ? date.toLocaleString([],
                        mode === "time"
                            ? { hour: "2-digit", minute: "2-digit", hour12: true }
                            : { year: "numeric", month: "long", day: "numeric" }
                    )
                        : minimumDate?.toLocaleString([],
                            mode === "time"
                                ? { hour: "2-digit", minute: "2-digit", hour12: true }
                                : { year: "numeric", month: "long", day: "numeric" }
                        ) || "Select Date"
                    }

                </Text>

            </Pressable>

            {/* Android */}
            {Platform.OS === "android" && showAndroidPicker && (
                <DateTimePicker
                    value={date}
                    mode={mode}
                    display={display}
                    onChange={handleDateChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                />
            )}

            {/* iOS */}
            {Platform.OS === "ios" && (
                <Modal visible={modalVisible} transparent animationType="slide">
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white p-6 rounded-t-lg items-center">
                            <Text className="text-lg font-sf-pro-bold mb-4">{title}</Text>

                            <DateTimePicker
                                value={tempDate}
                                mode={mode}
                                display={display}
                                onChange={handleDateChange}

                                minimumDate={minimumDate}
                                maximumDate={maximumDate}
                            />

                            <View className="flex-row justify-between mt-4 px-10">
                                <CustomButton
                                    onPress={() => setModalVisible(false)}
                                    isLoading={false}
                                    type="secondary"
                                    text={cancelText}
                                    width="40%"
                                />
                                <CustomButton
                                    onPress={() => {
                                        setDate(hasChanged ? tempDate : minimumDate ?? new Date());
                                        setModalVisible(false);
                                        setHasChanged(false);
                                    }}
                                    isLoading={false}
                                    type="primary"
                                    text={confirmText}
                                    width="40%"
                                />
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

export default DatePickerModal;