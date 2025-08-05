import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { DrawerActions, NavigationContainer } from "@react-navigation/native";
import { View, Image, TouchableOpacity, Text } from "react-native";

// Import screens
import HomeScreen from "../screens/tabs/HomeScreen";
import SettingsScreen from "../screens/tabs/SettingsScreen";
import { Ionicons } from "@expo/vector-icons";
import ProfileScreen from "../screens/tabs/ProfileScreen";
import TabNavigator from "./TabNavigator";
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useAuthContext } from "../contexts/AuthContext";
import AuthService from "../services/AuthService";
import { canGoBack } from "expo-router/build/global-state/routing";
import useUserStats from "../hooks/useUserStats";
import images from "@/app/constants/Images"
import InfoPopup from "../components/InfoPopup";
import FeedbackScreen from "../screens/tabs/FeedbackScreen";

const Drawer = createDrawerNavigator();


const DrawerContent = ({ navigation }: DrawerContentComponentProps) => {
    const { user, userData } = useAuthContext();
    const { userStats } = useUserStats();


    return (
        <View className="flex-1 bg-white pt-20">

            <View className="items-center pb-4 mb-4">
                <Image
                    source={{ uri: user?.photoURL || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" }}
                    className={userData?.isFromGoogle ? "w-24 h-24 rounded-full border-primary-0 border-2 mb-2" : "w-24 h-24 rounded-full border-primary-0 border-2 mb-2"}
                />

                {user?.photoURL && userData?.isFromGoogle ?
                    <InfoPopup
                        title="Profile Picture"
                        modalTitle="Profile Picture"
                        message="Your profile picture is from Google. This picture isn't saved or visible to us. It is used for display purposes only."
                        className="absolute top-0 right-12 mr-2"

                    />
                    : null}

                <View className="flex-row items-center">
                    <Text className="text-lg font-sf-pro-bold">@{userData?.displayName || "User Name"}</Text>
                </View>
                <View className="flex-row items-center">

                    <Text className="text-sm text-gray-500">Current Streak:</Text>
                </View>
                <TouchableOpacity>

                </TouchableOpacity>

                {
                    (userStats?.jogStats.currentStreak && Number(userStats.jogStats.currentStreak) > 0 ?
                        <Text className="text-sm text-gray-500"> 🔥 {Number(userStats.jogStats.currentStreak).toString()}</Text>

                        :
                        <Text className="text-sm text-gray-500"> 🔥 0</Text>
                    )
                }
            </View >


            <TouchableOpacity onPress={() => navigation.navigate("Profile")} className="flex-row items-center p-4">
                <Ionicons name="person" size={24} color="#EB5A10" />
                <Text className="text-lg font-sf-pro-bold ml-4">Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Settings")} className="flex-row items-center p-4">
                <Ionicons name="settings" size={24} color="#EB5A10" />
                <Text className="text-lg font-sf-pro-bold  ml-4">Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Feedback")} className="flex-row items-center p-4">
                <Ionicons name="chatbubble" size={24} color="#EB5A10" />
                <Text className="text-lg font-sf-pro-bold ml-4">Feedback</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => user && AuthService.logOut(user.uid)} className="flex-row items-center p-4">
                <Ionicons name="log-out" size={24} color="#EB5A10" />
                <Text className="text-lg font-sf-pro-bold ml-4">Logout</Text>
            </TouchableOpacity>





        </View >
    );
};

const DrawerNavigator = () => {
    return (
        <Drawer.Navigator drawerContent={(props) => <DrawerContent {...props} />}
            initialRouteName="DrawerHome"
            screenOptions={({ route, navigation }) => ({
                headerShown: false,
                drawerActiveTintColor: "#EB5A10",
                drawerInactiveTintColor: "#8C8E98",
                drawerLabelStyle: {
                    fontSize: 16,
                    fontFamily: "SF-Pro-Display-Regular",
                },
                drawerStyle: {
                    backgroundColor: "#f0f0f0",
                    width: 240,
                },

                headerLeft: () => (
                    navigation.canGoBack() ?
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{ marginLeft: 20 }}
                        >
                            <Ionicons name="arrow-back" size={32} color="#EB5A10" />
                        </TouchableOpacity>
                        :
                        <TouchableOpacity
                            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                            style={{ marginLeft: 20 }}
                        >
                            <Ionicons name="menu" size={32} color="#EB5A10" />
                        </TouchableOpacity>
                ),


            })}
        >
            <Drawer.Screen name="DrawerHome" component={TabNavigator} />
            <Drawer.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true }} />
            <Drawer.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true }} />
            <Drawer.Screen name="Feedback" component={FeedbackScreen} options={{ headerShown: true }} />

        </Drawer.Navigator>
    );
}

export default DrawerNavigator;
