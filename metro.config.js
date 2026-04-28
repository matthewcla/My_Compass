const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

if (!Array.prototype.toReversed) {
    Array.prototype.toReversed = function () {
        return [...this].reverse();
    };
}

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Force zustand to use the CommonJS build on web to avoid 'import.meta' syntax errors
    if (platform === 'web' && moduleName.startsWith('zustand')) {
        const path = require('path');
        const zustandRoot = require.resolve('zustand/package.json').replace('package.json', '');
        const subPath = moduleName === 'zustand' ? 'index.js' : moduleName.replace('zustand/', '') + '.js';
        return {
            filePath: path.join(zustandRoot, subPath),
            type: 'sourceFile',
        };
    }

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
