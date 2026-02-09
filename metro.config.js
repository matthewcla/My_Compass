const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && moduleName === 'tslib') {
        return {
            filePath: require.resolve('tslib/tslib.js'),
            type: 'sourceFile',
        };
    }
    // react-native-css-interop has no "exports" field and relies on subdirectory
    // package.json files for subpath resolution. The web export bundler doesn't
    // follow that convention, so we resolve these paths explicitly.
    if (moduleName === 'react-native-css-interop/jsx-runtime') {
        return {
            filePath: require.resolve('react-native-css-interop/dist/runtime/jsx-runtime'),
            type: 'sourceFile',
        };
    }
    if (moduleName === 'react-native-css-interop/jsx-dev-runtime') {
        return {
            filePath: require.resolve('react-native-css-interop/dist/runtime/jsx-dev-runtime'),
            type: 'sourceFile',
        };
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
