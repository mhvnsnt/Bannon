import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.codedummy.app',
  appName: 'Logic Visualizer (CODEDUMMY)',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: { enabled: true },
    LocalNotifications: { iconColor: '#488AFF' },
    // Disable raw filesystem execution for App Store compliance
    Filesystem: { disabled: true }
  }
};

export default config;
