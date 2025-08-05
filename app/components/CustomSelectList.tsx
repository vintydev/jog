import React from "react";
import { StyleProp, ViewStyle, TextStyle, StyleSheet } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";

interface CustomSelectListProps {
  data: { key: string; value: string }[];
  setSelected: (val: string) => void;
  placeholder?: string;
  boxStyles?: StyleProp<ViewStyle>;
  dropdownStyles?: StyleProp<ViewStyle>;
  dropdownTextStyles?: StyleProp<TextStyle>;
  inputStyles?: StyleProp<TextStyle>;
  search?: boolean;
  defaultOption?: { key: string; value: string };
  className?: string;
}

const CustomSelectList: React.FC<CustomSelectListProps> = ({
  data,
  setSelected,
  placeholder = "Select an option",
  boxStyles,
  inputStyles,
  dropdownStyles,
  dropdownTextStyles,
  search = false,
  defaultOption,

}) => {
  return (
    <SelectList
      setSelected={(val: any) => {
        console.log("Selected item:", val); // Debugging
        setSelected(val);
      }}
      data={data}
      placeholder={placeholder}
      search={search}
      defaultOption={defaultOption}
      inputStyles={StyleSheet.flatten([
        {
          color: "white",
          fontSize: 16,
          fontWeight: "bold",
          textAlign: "center",
          fontFamily: "Sura-Bold",
        },
        inputStyles,
      ])}
      boxStyles={StyleSheet.flatten([
        {
          position: "relative",
          borderWidth: 1,
          borderColor: "#EB5A10",
          width: "80%",
          height: "auto",
          marginBottom: 16,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
          backgroundColor: "#EB5A10",
        },
        boxStyles,
      ])}
      dropdownStyles={StyleSheet.flatten([
        {
          left: 0,
          right: 0,
          borderWidth: 1,
          borderColor: "#EB5A10",
          borderRadius: 8,
          backgroundColor: "white",
          zIndex: 1000,
        },
        dropdownStyles,
      ])}
      dropdownTextStyles={StyleSheet.flatten([
        {
          color: "black",
        },
        dropdownTextStyles,
      ]
      )}

    />
  );
};

export default CustomSelectList;