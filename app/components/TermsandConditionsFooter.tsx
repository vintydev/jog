import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

const openBrowser = async () => {
    await WebBrowser.openBrowserAsync('https://jog-app-c827d.web.app');
};

const TermsandConditionsFooter = () => {
    return (
        <View className="flex flex-row flex-wrap justify-center items-center px-6 mt-4">
            <Text className="text-center font-sf-pro text-gray-500 text-sm">
                By signing up to this application, you agree to the{' '}
            </Text>
            <TouchableOpacity onPress={openBrowser}>
                <Text className="text-sm text-center font-sf-pro-bold underline text-primary-0">
                    Terms of Service & Privacy Policy
                </Text>
            </TouchableOpacity>

        </View>
    );
};

export default TermsandConditionsFooter;