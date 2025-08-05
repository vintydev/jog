import React, { useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, Animated, Easing } from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

interface TaskCategorySelectorProps {
    category: string;
    setCategory: (category: string) => void;
}

// Category icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
    General: <MaterialCommunityIcons name="format-list-bulleted" size={28} color="black" />,
    Work: <MaterialCommunityIcons name="briefcase" size={28} color="black" />,
    Personal: <Ionicons name="person" size={28} color="black" />,
    Health: <MaterialCommunityIcons name="heart-pulse" size={28} color="black" />,
    Study: <FontAwesome5 name="book" size={28} color="black" />,
    Finance: <MaterialCommunityIcons name="bank" size={28} color="black" />,
    Medication: <Ionicons name="medkit" size={50} color="black" />,

};

const TaskCategorySelector: React.FC<TaskCategorySelectorProps> = ({ category, setCategory }) => {
    const baseCategories = Object.keys(categoryIcons);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300, 
            easing: Easing.inOut(Easing.ease), 
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fadeAnim }} className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6 ">
            <Text className="text-lg font-sf-pro-bold text-left mb-4">Select a Category</Text>
            <View className="flex-wrap flex-row justify-between">
                
                {baseCategories.map((item) => {
                    const isSelected = category === item;

                    
                   
                    return (
            
                        <TouchableOpacity
                            key={item}
                            onPress={() => {
                               
                                Animated.sequence([
                                    Animated.timing(scaleAnim, {
                                        toValue: 1.15,
                                        duration: 100, 
                                        useNativeDriver: true,
                                    }),
                                    Animated.timing(scaleAnim, {
                                        toValue: 1,
                                        duration: 100,
                                        useNativeDriver: true,
                                    }),
                                ]).start();

                                setCategory(item);
                            }}
                            style={{
                                transform: [{ scale: isSelected ? scaleAnim : 1 }],
                            }}
                            className={` ${item === "Medication" ? "w-full" : "w-[30%]"} p-4 rounded-xl items-center justify-center mb-4 ${
                                isSelected ? "bg-primary-100 border-2 border-primary-0" : "bg-white"
                            } shadow-sm`}
                        >
                            {React.cloneElement(categoryIcons[item] as React.ReactElement, {
                                color: isSelected ? "#EB5A10" : "black",
                            })}
                            <Text className={`text-sm font-semibold mt-2 ${isSelected ? "text-primary-500" : "text-gray-600"}`}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Animated.View>
    );
};

export default TaskCategorySelector;