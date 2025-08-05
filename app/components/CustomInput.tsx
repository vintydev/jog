import React from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";

interface CustomInputProps extends TextInputProps {
  label?: string;
  containerStyle?: any;
  inputStyle?: any;
  placeholder?: string;
  width?: string | number;
  icon?: React.ReactNode;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  containerStyle,
  inputStyle,
  width = 250,
  icon,
  ...props
}) => {
  const inputWidth = typeof width === "string" ? parseInt(width) : width;

  return (
    <View
      className="items-center mb-3"
      style={[{ width: inputWidth }, containerStyle]}
    >
      {label && (
        <Text className="text-base font-bold mb-1 text-center">{label}</Text>
      )}

      <View
        className="flex-row items-center rounded-md border border-gray-300 bg-white px-3 py-3"
        style={{ width: inputWidth }}
      >
        {icon && <View className="mr-2">{icon}</View>}

        <TextInput
          className="flex-1 text-base text-left"
          style={inputStyle}
          autoCapitalize="none"
          secureTextEntry={label?.toLowerCase().includes("password")}
          {...props}
          placeholderTextColor="#EB5A10"
        />
      </View>
    </View>
  );
};

export default CustomInput;