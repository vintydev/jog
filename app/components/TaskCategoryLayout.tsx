import React, { ReactNode } from "react";
import { View, ScrollView, Text } from "react-native";

interface TaskCategoryLayoutProps {
  title: string;
  children: ReactNode;
}

const TaskCategoryLayout: React.FC<TaskCategoryLayoutProps> = ({ title, children }) => {
  return (
    <ScrollView className="flex-1 p-5 bg-white">
      <Text className="text-[25px] font-sf-pro-display mb-4">{title}</Text>
      <View>{children}</View>
    </ScrollView>
  );
};

export default TaskCategoryLayout;