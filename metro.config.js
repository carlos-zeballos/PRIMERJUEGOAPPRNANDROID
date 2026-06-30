const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Permite importar archivos FLAC como assets de audio
config.resolver.assetExts.push('flac');

module.exports = config;
