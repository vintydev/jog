// Learn more https://docs.expo.io/guides/customizing-metro

// This file is used to configure the Metro bundler for the proj
const { getDefaultConfig } = require('expo/metro-config');
const {withNativeWind} = require('nativewind/metro');
// Call getDefaultConfig with the root of proj 
const defaultConfig = getDefaultConfig(__dirname);



// Export the config
module.exports = withNativeWind(defaultConfig, {input: './global.css'});