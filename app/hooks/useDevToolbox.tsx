import { useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useDevToolbox() {

    const [overlayResetFlag, setOverLayResetFlag] = useState(false);


    const [devActions] = useState([
        {
            label: "Reset Manual Jog Hint",
            action: async () => {
                await AsyncStorage.removeItem("manualJogHintShown");
                setOverLayResetFlag(((prev ) => !prev));
                Alert.alert("DevToolbox", "Manual jog overlay reset!");
            },
        },
        {
            label: "Clear All AsyncStorage",
            action: async () => {
                await AsyncStorage.clear();
                Alert.alert("DevToolbox", "All AsyncStorage cleared!");
            },
        },
    ]);

    return { devActions };
}