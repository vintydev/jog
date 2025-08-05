import React, { useEffect } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AgeScreen from "../screens/auth/AgeScreen";
import AuthInfoScreen from "../screens/auth/AuthInfoScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import { AuthStackParamList } from "../types/Navigator";
import SignupScreen from "../screens/auth/SignupScreen";
import LandingScreen from "../screens/LandingScreen";
import ADHDInfoScreen from "../screens/auth/ADHDInfoScreen";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, TouchableOpacity, View, Text } from "react-native";
import "../../";
import useAuth from "../hooks/useAuth";
import GenderScreen from "../screens/auth/GenderInfo";
import ADHDInfoScreenResult from "../screens/auth/ADHDInfoScreenResult";
import ADHDInfoScreenResult2 from "../screens/auth/ADHDInfoScreenResult2";
import MedicationInfoScreen from "../screens/auth/MedicationInfoScreen";
import OccupationInfoScreen from "../screens/auth/OccupationInfoScreen";
import MoodInfoScreen from "../screens/auth/MoodInfoScreen";
import MemoryInfoScreen from "../screens/auth/MemoryInfo";
import ConcentrationInfoScreen from "../screens/auth/ConcentrationInfoScreen";
import { useNavigationState } from "@react-navigation/native";
import { Auth } from "firebase-admin/lib/auth/auth";
import QuestionnaireTimeScreen from "../screens/auth/QuestionnaireTimeScreen";

const AuthStack = createStackNavigator<AuthStackParamList>();

const SignupScreens = [
    "Signup", "Age", "GenderInfo", "ADHDInfo", "ADHDInfoResult", "ADHDInfoResult2",
    "MedicationInfo", "OccupationInfo", "MemoryInfo", "ConcentrationInfo", "MoodInfo", "QuestionnaireTime", "AuthInfo"
];

const AuthNavigator = ({ navigation, route }: any) => {
    const { user, userData } = useAuth();

    return (
        <AuthStack.Navigator screenOptions={({ navigation, route }) => {
            const currentStep = SignupScreens.indexOf(route.name);
            const previousStep = currentStep - 1;

            const progress = currentStep / (SignupScreens.length - 1);
            let previousRouteName = "";

            console.log("currentStep", currentStep);
            console.log("previousStep", previousStep);

            



            return {
                headerTitleStyle: {
                    fontFamily: "SF-Pro-Display-Bold",
                    fontSize: 32,
                    color: "#EB5A10"
                },
                headerTitleAlign: "center",
                headerLeft: () => {
                    return (route.name !== "Age" || !userData?.isFromGoogle) ? (
                        navigation.canGoBack() &&
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                    ) : null;
                },

                headerRight: () => (

                    route.name !== "Login" ?
                        <SafeAreaView style={{ marginRight: 15 }}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text style={{ fontFamily: "SF-Pro-Display-Bold", fontSize: 15, color: "#EB5A10" }}>
                                    {Math.floor(progress * 100)}%
                                   
                                </Text>
                            </View>
                        </SafeAreaView>
                        : null
                ),
                headerStyle: {
                    shadowColor: "transparent",
                    elevation: 0,
                }
            };
        }}>

            <AuthStack.Screen name="Landing" component={LandingScreen} />
            <AuthStack.Screen name="Signup" component={SignupScreen} />
            <AuthStack.Screen name="GenderInfo" component={GenderScreen} options={{ headerTitle: "Gender" }} />
            <AuthStack.Screen name="ADHDInfo" component={ADHDInfoScreen} options ={{headerTitle: "About you"}}/>
            <AuthStack.Screen name="ADHDInfoResult" component={ADHDInfoScreenResult} options ={{headerTitle: "About you"}}/>
            <AuthStack.Screen name="ADHDInfoResult2" component={ADHDInfoScreenResult2} options ={{headerTitle: "About you"}}/>
            <AuthStack.Screen name="MedicationInfo" component={MedicationInfoScreen} options ={{headerTitle: "Medication"}}/>
            <AuthStack.Screen name="OccupationInfo" component={OccupationInfoScreen} options ={{headerTitle: "Occupation"}}/>
            <AuthStack.Screen name="MemoryInfo" component={MemoryInfoScreen} options ={{headerTitle: "Your ADHD"}}/>
            <AuthStack.Screen name="ConcentrationInfo" component={ConcentrationInfoScreen} options ={{headerTitle: "Your ADHD"}}/>
            <AuthStack.Screen name="MoodInfo" component={MoodInfoScreen} options ={{headerTitle: "Your ADHD"}}/>
            <AuthStack.Screen name="Login" component={LoginScreen} options ={{headerTitle: "Login"}}/>
            <AuthStack.Screen name="Age" component={AgeScreen} options ={{headerTitle: "Age"}}/>
            <AuthStack.Screen name="QuestionnaireTime" component={QuestionnaireTimeScreen} options ={{headerTitle: "About you"}}/>
            <AuthStack.Screen name="AuthInfo" component={AuthInfoScreen} options ={{headerTitle: "Register"}}/>

        </AuthStack.Navigator>
    );
};

export default AuthNavigator;