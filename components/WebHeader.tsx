import { BlurView } from 'expo-blur';
import { Bell, Compass, LogOut, Search, User as UserIcon } from 'lucide-react-native';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from './useColorScheme';

import Colors from '@/constants/Colors';
import { useSession } from '@/lib/ctx';
import { useCurrentProfile } from '@/store/useDemoStore';
import { getShadow } from '@/utils/getShadow';

/**
 * WebHeader Component
 * 
 * Top navigation bar for the web interface.
 * - Desktop: Search bar + Notifications + Enhanced Profile (No Logo, assuming Sidebar).
 * - Mobile: Logo + Simple Profile.
 * - Common: Glassmorphism background.
 */
export function WebHeader() {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const profile = useCurrentProfile();
    const rank = profile?.rank;
    const displayName = profile?.displayName;
    const { signOut } = useSession();
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];

    const handleLogout = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: signOut
                }
            ]
        );
    };

    const handleAlert = () => {
        Alert.alert("Notifications", "No new alerts at this time.");
    };

    const isMobile = width < 768;

    return (
        <View style={{
            zIndex: 50,
            height: 70 + (isMobile ? insets.top : 0),
            paddingTop: isMobile ? insets.top : 0,
        }}>
            {/* Glass Background */}
            <View style={[StyleSheet.absoluteFill, {
                backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : themeColors.background
            }]}>
                <BlurView
                    intensity={50}
                    tint={colorScheme === 'dark' ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <View style={{
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingVertical: 12, // Center vertically in the fixed height
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(0,0,0,0.05)'
            }}>

                {/* LEFT SECTION */}
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {isMobile ? (
                        /* Mobile: Show Logo */
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{
                                width: 36, height: 36, borderRadius: 10,
                                backgroundColor: Colors.light.tint,
                                alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Compass size={22} color="white" strokeWidth={2} />
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: themeColors.text }}>
                                My Compass
                            </Text>
                        </View>
                    ) : (
                        /* Desktop: Show Search Bar */
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: themeColors.systemGray6, // slate-100/70
                            borderRadius: 100, // pill 
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            width: 380,
                            gap: 10
                        }}>
                            <Search size={18} color={themeColors.labelSecondary} />
                            <TextInput
                                placeholder="Search commands, billets, or people..."
                                placeholderTextColor={themeColors.labelSecondary}
                                style={{
                                    flex: 1,
                                    fontSize: 14,
                                    color: themeColors.text,
                                    outlineStyle: 'none' // Web only
                                } as any}
                            />
                            {/* Visual Hint */}
                            <View style={{
                                paddingHorizontal: 6, paddingVertical: 2,
                                backgroundColor: themeColors.background, borderRadius: 4,
                                borderWidth: 1, borderColor: themeColors.tabIconDefault
                            }}>
                                <Text style={{ fontSize: 10, color: themeColors.labelSecondary, fontWeight: '600' }}>⌘ K</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* RIGHT SECTION */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>

                    {/* Notification Bell (Desktop & Mobile) */}
                    <Pressable
                        onPress={handleAlert}
                        style={({ hovered }: { hovered?: boolean }) => ({
                            width: 40, height: 40, borderRadius: 20,
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: hovered ? 'rgba(0,0,0,0.05)' : 'transparent'
                        })}>
                        <Bell size={20} color={themeColors.labelSecondary} strokeWidth={2} />
                        {/* Dot */}
                        <View style={{
                            position: 'absolute', top: 10, right: 10,
                            width: 8, height: 8, borderRadius: 4,
                            backgroundColor: themeColors.status.error, borderWidth: 1.5, borderColor: themeColors.background
                        }} />
                    </Pressable>

                    {/* Profile */}
                    <Pressable
                        onPress={() => {
                            // Navigate to profile
                        }}
                        style={({ hovered }: { hovered?: boolean }) => ({
                            flexDirection: 'row', alignItems: 'center', gap: 10,
                            padding: 6, paddingRight: 12,
                            borderRadius: 30, // pill
                            backgroundColor: hovered ? 'rgba(0,0,0,0.05)' : 'transparent',
                            transition: 'all 0.2s'
                        })}
                    >
                        <View style={{
                            height: 36, width: 36, borderRadius: 18,
                            backgroundColor: themeColors.systemGray6,
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: 2, borderColor: themeColors.background, ...getShadow({ shadowColor: 'black', shadowOpacity: 0.05, shadowRadius: 2 })
                        }}>
                            {/* Initials fallback */}
                            <UserIcon size={18} color={themeColors.labelSecondary} strokeWidth={2} />
                        </View>

                        {/* Enhanced Text for Desktop, minimal for Mobile */}
                        {!isMobile && (
                            <View>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: themeColors.text }}>
                                    {displayName || 'Guest'}
                                </Text>
                                <Text style={{ fontSize: 11, fontWeight: '500', color: themeColors.labelSecondary }}>
                                    {rank || 'No Rank'}
                                </Text>
                            </View>
                        )}
                    </Pressable>

                    {/* Logout Button */}
                    <Pressable
                        onPress={handleLogout}
                        style={({ hovered }: { hovered?: boolean }) => ({
                            width: 40, height: 40, borderRadius: 20,
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: hovered ? 'rgba(220, 38, 38, 0.1)' : 'transparent'
                        })}
                    >
                        {({ hovered }: { hovered?: boolean }) => (
                            <LogOut
                                size={20}
                                color={hovered ? themeColors.status.error : themeColors.labelSecondary}
                                strokeWidth={2}
                            />
                        )}
                    </Pressable>
                </View>
            </View>
        </View>
    );
}
