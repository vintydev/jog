import React, { useRef, useEffect } from "react";
import { Pressable, Text, Animated, ViewStyle, TextStyle } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import * as Haptics from "expo-haptics";

interface SelectableButtonProps {
    label: string;
    isSelected: boolean;
    onPress: () => void;
    value?: string;
    selectedColor?: string;
    unselectedColor?: string;
    selectedBorderColour?: string;
    unselectedBorderColour?: string;
    checkmarkColor?: string;
    style?: ViewStyle;
    textStyle?: TextStyle;
}


const SelectableButton: React.FC<SelectableButtonProps> = ({
    label,
    isSelected,
    onPress,
    value,
    selectedColor = "#D1FAE5",
    unselectedColor = "#E5E5E5",
    checkmarkColor = "#EB5A10",
    selectedBorderColour = "#EB5A10",
    unselectedBorderColour = "#E5E5E5",
    style,
    textStyle,
}) => {


    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };
    // Animated value for background color transition
    const animValue = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animValue, {
            toValue: isSelected ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isSelected]);

    // Interpolate background color based on selection
    const bgColour = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [unselectedColor, selectedColor],
    });

    const borderColour = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [unselectedBorderColour, selectedBorderColour],
    });

    return (
        <Animated.View style={[{ backgroundColor: bgColour, borderRadius: 10, marginBottom: 12, borderColor: borderColour, borderWidth: 2, }, style]}>
            <Pressable onPress={handlePress} className="w-80 h-12 flex-row items-center px-4 ">
                <Icon
                    name="check"
                    size={20}
                    color={isSelected ? checkmarkColor : "transparent"}
                    style={{ marginRight: 12 }}
                />
                <Text className={`text-lg ${isSelected ? "text-black font-sf-pro-bold " : "text-gray-600"}`} style={textStyle}>
                    {label}
                </Text>
            </Pressable>
        </Animated.View>
    );
};

export default SelectableButton;