import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.remiolauncher.app",
  appName: "Remio",
  webDir: "dist",
  server: {
    // In production, the app loads the bundled frontend from disk.
    // For development, uncomment the url below and set to your dev machine's IP:
    // url: "http://192.168.x.x:5173",
    androidScheme: "https",
    iosScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#1a1a2e",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#1a1a2e",
    },
  },
};

export default config;
