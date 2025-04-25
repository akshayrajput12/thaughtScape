# CampusCash PWA Assets

This directory contains assets for the Progressive Web App (PWA) functionality of CampusCash.

## Generating Icons and Splash Screens

We've included web-based tools to help you generate all the necessary icon and splash screen files using Unsplash images.

### Icon Generator

1. Open `/icons/icon-generator.html` in your browser
2. Enter an Unsplash image URL (or use the default)
3. Choose the icon shape (square, circle, or rounded)
4. Add optional overlay text (like app initials)
5. Click "Generate Icons" to preview
6. Click "Download All Icons" to save the files
7. Place the downloaded files in the `/public/icons/` directory

### Splash Screen Generator

1. Open `/splash/splash-generator.html` in your browser
2. Enter an Unsplash image URL for the background
3. Optionally add a logo image URL
4. Enter your app name and tagline
5. Adjust colors and opacity
6. Click "Generate Splash Screens" to preview
7. Click "Download All Splash Screens" to save the files
8. Place the downloaded files in the `/public/splash/` directory

## Required Files

### Icons
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### Splash Screens
- apple-splash-2048-2732.png
- apple-splash-1668-2388.png
- apple-splash-1536-2048.png
- apple-splash-1125-2436.png
- apple-splash-1242-2688.png
- apple-splash-828-1792.png
- apple-splash-750-1334.png
- apple-splash-640-1136.png

## Testing PWA Installation

After generating all the required files:

1. Deploy your application
2. Visit the site on a mobile device
3. For iOS: Use Safari and tap the Share button, then "Add to Home Screen"
4. For Android: Chrome should prompt you to install the app, or use the menu to "Add to Home Screen"

The app should now install as a full PWA rather than just a shortcut.
