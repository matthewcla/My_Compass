import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useSession } from '@/lib/ctx';
import { Bell, LogOut } from 'lucide-react-native';
import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

/**
 * Header Controls Component
 * 
 * Provides "Alert" (Notifications) and "Log Out" controls.
 * Compliant with "Zero Trust" (confirm logging out) and RN Primitives.
 */
export function HeaderControls() {
    const { signOut } = useSession();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const handleLogout = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: () => {
                        // "Return the app to the log in screen"
                        // signOut() clears session, AuthGuard handles the rest.
                        signOut();
                    }
                }
            ]
        );
    };

    const handleAlert = () => {
        // "Add an alert function"
        Alert.alert("Notifications", "No new alerts at this time.");
    };

    return (
        <View style={styles.container}>
            <Pressable onPress={handleAlert} accessibilityLabel="Notifications" hitSlop={8}>
                {({ pressed }) => (
                    <Bell
                        color={colors.text}
                        size={24}
                        style={{ opacity: pressed ? 0.7 : 1 }}
                    />
                )}
            </Pressable>

            <Pressable onPress={handleLogout} accessibilityLabel="Sign Out" hitSlop={8}>
                {({ pressed }) => (
                    <LogOut
                        color={colors.text}
                        size={24}
                        style={{ opacity: pressed ? 0.7 : 1 }}
                    />
                )}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginRight: 16,
    }
});
