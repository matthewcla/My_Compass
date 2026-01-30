import { Stack } from 'expo-router';

export default function LeaveLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="request"
                options={{
                    headerShown: false,
                    presentation: 'card',
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
