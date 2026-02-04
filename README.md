# My Compass App

## Calendar & Scanner Feature

### Dependencies

| Package | Purpose |
| :--- | :--- |
| `react-native-vision-camera` | Camera access and QR code scanning on native devices |
| `jsqr` | QR code decoding for Web / fallback |
| `expo-haptics` | Haptic feedback on scan success and interactions |

### Testing QR Scanning

#### On Simulator / Emulator
The native camera module is not supported in the iOS Simulator or Android Emulator. The app provides a fallback interface:
1. Open the Scanner from the Calendar screen.
2. The view will display "Camera Unavailable".
3. Tap the **Simulate Scan** button to trigger a successful scan event with mock data.

#### Generating a Test QR Code (For Physical Devices)
To test the scanner on a physical device:
1. Use any QR code generator (e.g., [qr-code-generator.com](https://www.qr-code-generator.com/)).
2. Create a QR code containing any text string (e.g., `event_123` or `MOCK_QR_DATA`).
3. Scan the code using the app's scanner.
