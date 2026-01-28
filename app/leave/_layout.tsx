import { Stack } from 'expo-router';

export default function LeaveLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="request"
                options={{
                    headerShown: true, // Allow Global Header to pass through (controlled by _layout above or global config)
                    headerTitle: '', // Let GlobalHeader handle content via store
                    headerTransparent: true, // We render our own via GlobalHeader usually
                    // Removing modal presentation to feel like "Zero Latency" flow
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    headerTitle: 'Leave Detail',
                    presentation: 'card',
                }}
            />
            <Stack.Screen
                name="history"
                options={{
                    headerTitle: 'Leave History',
                }}
            />
        </Stack>
    );
}
