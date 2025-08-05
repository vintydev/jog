import React, { ReactNode } from "react";
import { View, ScrollView } from "react-native";

interface BottomButtonLayoutProps {
  children: ReactNode;
  buttonComponent: ReactNode;
}

const BottomButtonLayout: React.FC<BottomButtonLayoutProps> = ({ children, buttonComponent }) => {
  return (
    <View className="flex-1 bg-white relative p-4">

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>



      
    </View>
  );
};

export default BottomButtonLayout;