import React, { useEffect, useRef } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, TextStyle, ViewStyle, Dimensions, Animated } from "react-native";
import * as Haptics from 'expo-haptics';

interface CustomButtonProps {
  onPress: () => void;
  text: string;
  icon?: any;
  iconName?: string;
  isLoading: boolean;
  type: "primary" | "secondary";
  textStyle?: TextStyle;
  width?: number | string;
  height?: number;
  customStyle?: ViewStyle;
  disabled?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  onPress,
  text,
  icon,
  iconName,
  isLoading,
  type,
  width = "70%",
  height = 50,
  customStyle,
  textStyle,
  disabled = false
}) => {
  const calculatedWidth: number = typeof width === "string" && width.endsWith("%")
    ? (Dimensions.get("window").width * parseFloat(width) / 100)
    : typeof width === "number"
      ? width
      : parseFloat(width);

  // Animated value for fade effect
  const fadeAnim = useRef(new Animated.Value(disabled ? 0.5 : 1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: disabled ? 0.5 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [disabled]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={isLoading || disabled}
        activeOpacity={0.6}
        style={[
          styles.button,
          {
            backgroundColor: type === "primary" ? "#EB5A10" : "#FFFFFF",
            borderColor: type === "secondary" ? "#EB5A10" : "transparent",
            width: calculatedWidth,
            height,
          },
          type === "secondary" && styles.secondaryButton as ViewStyle,
          customStyle as ViewStyle,
          disabled && { backgroundColor: "#ccc" }
        ]}
      >
        <View style={styles.contentWrapper}>
          {isLoading ? (
            <ActivityIndicator color={type === "primary" ? "#fff" : "#EB5A10"} />
          ) : (
            <>
              {icon && (
                <Image
                  source={icon}
                  style={{
                    width: 40,
                    height: 40,
                    marginRight: 6,
                    tintColor: iconName === "googleLogo" ? "#FFFFFF" : undefined,
                  }}
                  resizeMode="contain"
                />
              )}
              <Text
                style={{
                  color: textStyle?.color ? textStyle.color : type === "primary" ? "#FFFFFF" : "#EB5A10",
                  fontSize: 16,
                  fontFamily: "Sura-Bold",
                }}
              >
                {text}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  secondaryButton: {
    borderWidth: 2,
  },
  contentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignContent: "center",
    minHeight: 30,
    minWidth: 25,
  },
});

export default CustomButton;