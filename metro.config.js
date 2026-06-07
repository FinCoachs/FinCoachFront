const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Stub le fichier manquant dans expo-notifications 56.0.16
// (unregisterForNotificationsAsync a été supprimé mais index.js l'exporte encore)
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === './unregisterForNotificationsAsync') {
    return {
      filePath: path.resolve(
        __dirname,
        'node_modules/expo-notifications/build/unregisterForNotificationsAsync.js',
      ),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) return originalResolveRequest(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
