import { Ionicons } from "@expo/vector-icons";
import React from "react";
import starAI from "../constants/Images";
import { Image } from "react-native";


export const getTabIcon = (routeName: string, focused: boolean) => {
  
  const color = focused ? "#EB5A10" : "#ccc";

  switch (routeName) {
    case "Home":
      return <Ionicons name="home-outline" size={24} color={color} />;
    case "Profile":
      return <Ionicons name="person-outline" size={24} color={color} />;
    case "Jogs":
      return <Ionicons name="flame-outline" size={24} color={color} />;
    case "Chat Bot":
      return <Image source={starAI.starAI} style={{ width: 24, height: 24, tintColor: color, transform: [{scaleX:-1}] }} />;
    case "Stats":
      return <Ionicons name="stats-chart-outline" size={24} color={color} />;
    
    default:
      return null;
  }
};