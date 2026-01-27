import { BlurView } from 'expo-blur';
import { Tabs, router, usePathname } from 'expo-router';
import { Anchor, CircleUser, FileText, Home, Map, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountDrawer } from '@/components/AccountDrawer';
import { useColorScheme } from '@/components/useColorScheme';
import { WebHeader } from '@/components/WebHeader';
import Colors from '@/constants/Colors';

const SIDEBAR_WIDTH = 280;

export default function TabLayout() {
    const { width } = useWindowDimensions();
    const colorScheme = useColorScheme();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const [accountDrawerVisible, setAccountDrawerVisible] = useState(false);

    const isMobile = width < 768;

    // Icons mapping for the sidebar
    const navItems = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Assign', href: '/assignments', icon: Anchor },
        { name: 'PCS', href: '/pcs', icon: Map },
        { name: 'Admin', href: '/admin', icon: FileText },
        { name: 'Profile', href: '/profile', icon: User },
    ];

    // Common Tabs Screen Definitions to reuse
    // We render these inside the specific layout containers
    const GlassBackground = () => (
        <BlurView intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
    );

    // Common Tabs Screen Definitions to reuse
    // We render these inside the specific layout containers


    // Desktop Sidebar Component
    const Sidebar = () => (
        <View style={{ width: SIDEBAR_WIDTH, height: '100%' }}>
            {/* Glassmorphism Background */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
                <BlurView
                    intensity={40}
                    tint={colorScheme === 'dark' ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {/* Sidebar Content */}
            <View style={{ flex: 1, padding: 24, paddingTop: insets.top + 24 }}>
                {/* Header / Logo Area */}
                <View style={{ marginBottom: 32, paddingHorizontal: 12 }}>
                    <Text style={{ fontSize: 24, fontWeight: '700', color: Colors[colorScheme ?? 'light'].text, letterSpacing: -0.5 }}>
                        My Compass
                    </Text>
                </View>

                {/* Navigation Items */}
                <View style={{ gap: 8 }}>
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                            <Pressable
                                key={item.name}
                                onPress={() => router.push(item.href as any)}
                                style={({ hovered, pressed }) => [
                                    {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 12,
                                        paddingHorizontal: 16,
                                        borderRadius: 12, // rounded-md equivalent/slightly nicer
                                        gap: 12,
                                        backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : (hovered ? 'rgba(148, 163, 184, 0.1)' : 'transparent'),
                                    }
                                ]}
                            >
                                <Icon
                                    size={24}
                                    color={isActive ? Colors[colorScheme ?? 'light'].systemBlue : Colors[colorScheme ?? 'light'].labelSecondary}
                                    strokeWidth={isActive ? 2 : 1.5}
                                />
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: isActive ? '600' : '500',
                                    color: isActive ? Colors[colorScheme ?? 'light'].systemBlue : Colors[colorScheme ?? 'light'].labelSecondary
                                }}>
                                    {item.name}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {/* Footer / Version */}
            <View style={{ padding: 24, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }}>
                <Pressable
                    onPress={() => setAccountDrawerVisible(true)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}
                >
                    <CircleUser size={24} color={Colors[colorScheme ?? 'light'].text} />
                    <Text style={{ fontWeight: '600', color: Colors[colorScheme ?? 'light'].text }}>Account Settings</Text>
                </Pressable>
                <Text style={{ fontSize: 12, color: Colors[colorScheme ?? 'light'].labelSecondary }}>v1.0.0 (Web Desktop)</Text>
            </View>
        </View>
    );

    if (isMobile) {
        // Mobile Web Layout - similar to Native
        return (
            <>
                <AccountDrawer
                    visible={accountDrawerVisible}
                    onClose={() => setAccountDrawerVisible(false)}
                />
                <View style={{ flex: 1, paddingBottom: insets.bottom }}>
                    <Tabs
                        screenOptions={{
                            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                            tabBarShowLabel: false,
                            headerShown: false,
                            tabBarStyle: {
                                position: 'absolute',
                                borderTopWidth: 0,
                                elevation: 0,
                                shadowOpacity: 0,
                                height: 80, // Slightly taller for better touch area with absolute
                                paddingBottom: 20, // Adjust for Home Indicator usually
                            },
                            tabBarBackground: () => <GlassBackground />,
                        }}>
                        <Tabs.Screen
                            name="index"
                            options={{
                                title: 'Home',
                                // tabBarLabel: 'Home', // Optional if title is enough, but consistently nice
                                tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={1.5} />,
                            }}
                        />
                        <Tabs.Screen
                            name="assignments/index"
                            options={{
                                title: 'Assign',
                                tabBarLabel: 'Assign',
                                headerTitle: 'My Assignment',
                                tabBarIcon: ({ color }) => <Anchor size={24} color={color} strokeWidth={1.5} />,
                            }}
                        />
                        <Tabs.Screen
                            name="pcs/index"
                            options={{
                                title: 'PCS',
                                tabBarLabel: 'PCS',
                                headerTitle: 'My PCS',
                                tabBarIcon: ({ color }) => <Map size={24} color={color} strokeWidth={1.5} />,
                            }}
                        />
                        <Tabs.Screen
                            name="admin/index"
                            options={{
                                title: 'Admin',
                                tabBarLabel: 'Admin',
                                headerTitle: 'My Admin',
                                tabBarIcon: ({ color }) => <FileText size={24} color={color} strokeWidth={1.5} />,
                            }}
                        />
                        <Tabs.Screen
                            name="profile/index"
                            options={{
                                title: 'Profile',
                                tabBarLabel: 'Profile',
                                headerTitle: 'My Profile',
                                tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={1.5} />,
                            }}
                        />
                        <Tabs.Screen
                            name="settings_placeholder"
                            options={{
                                title: 'Account',
                                tabBarLabel: '',
                                headerShown: false,
                                tabBarIcon: ({ color }) => <CircleUser size={24} color={color} strokeWidth={1.5} />,
                            }}
                            listeners={() => ({
                                tabPress: (e) => {
                                    e.preventDefault();
                                    setAccountDrawerVisible(true);
                                },
                            })}
                        />
                    </Tabs>
                </View>
            </>
        );
    }

    // Desktop Web Layout
    return (
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colorScheme === 'dark' ? '#000' : Colors.light.systemGray6 }}>
            <Sidebar />
            {/* Main Content Area */}
            <View style={{ flex: 1 }}>
                <AccountDrawer
                    visible={accountDrawerVisible}
                    onClose={() => setAccountDrawerVisible(false)}
                />
                <Tabs
                    screenOptions={{
                        header: () => <WebHeader />,
                        headerShown: true,
                        // Hide the tab bar on desktop since we have the sidebar
                        tabBarStyle: { display: 'none' },
                    }}
                >
                    <Tabs.Screen
                        name="index"
                        options={{
                            title: 'Home',
                        }}
                    />
                    <Tabs.Screen
                        name="assignments/index"
                        options={{
                            title: 'Assign',
                            tabBarLabel: 'Assign',
                            headerTitle: 'My Assignment',
                            tabBarIcon: ({ color }) => <Anchor size={24} color={color} strokeWidth={1.5} />,
                        }}
                    />
                    <Tabs.Screen
                        name="pcs/index"
                        options={{
                            title: 'PCS',
                            tabBarLabel: 'PCS',
                            headerTitle: 'My PCS',
                            tabBarIcon: ({ color }) => <Map size={24} color={color} strokeWidth={1.5} />,
                        }}
                    />
                    <Tabs.Screen
                        name="admin/index"
                        options={{
                            title: 'Admin',
                            tabBarLabel: 'Admin',
                            headerTitle: 'My Admin',
                            tabBarIcon: ({ color }) => <FileText size={24} color={color} strokeWidth={1.5} />,
                        }}
                    />
                    <Tabs.Screen
                        name="profile/index"
                        options={{
                            title: 'Profile',
                            tabBarLabel: 'Profile',
                            headerTitle: 'My Profile',
                            tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={1.5} />,
                        }}
                    />
                </Tabs>
            </View>
        </View>
    );
}
