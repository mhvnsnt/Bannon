const fs = require('fs');
let code = fs.readFileSync('capacitor.config.ts', 'utf8');

code = code.replace("appName: 'CODEDUMMY',", "appName: 'Logic Visualizer (CODEDUMMY)',");

// Add App Store compliance routing details (e.g. disable local files)
if (!code.includes("plugins: {")) {
    code = code.replace(
        "webDir: 'dist'",
        "webDir: 'dist',\n  plugins: {\n    CapacitorHttp: { enabled: true },\n    LocalNotifications: { iconColor: '#488AFF' },\n    // Disable raw filesystem execution for App Store compliance\n    Filesystem: { disabled: true }\n  }"
    );
}

fs.writeFileSync('capacitor.config.ts', code);
console.log("Patched capacitor.config.ts");
