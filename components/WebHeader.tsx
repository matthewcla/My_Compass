import { BlurView } from 'expo-blur';
import { Bell, Compass, Search, User as UserIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useUserDisplayName, useUserRank } from '@/store/useUserStore';

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
    const rank = useUserRank();
    const displayName = useUserDisplayName();

    const isMobile = width < 768;

    return (
        <View style={{
            zIndex: 50,
            height: 70 + (isMobile ? insets.top : 0),
            paddingTop: isMobile ? insets.top : 0,
        }}>
            {/* Glass Background */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}>
                <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
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
                                <Compass size={22} color="#FFF" strokeWidth={2} />
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B' }}>
                                My Compass
                            </Text>
                        </View>
                    ) : (
                        /* Desktop: Show Search Bar */
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'rgba(241, 245, 249, 0.7)', // slate-100/70
                            borderRadius: 100, // pill 
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            width: 380,
                            gap: 10
                        }}>
                            <Search size={18} color="#94A3B8" />
                            <TextInput
                                placeholder="Search commands, billets, or people..."
                                placeholderTextColor="#94A3B8"
                                style={{
                                    flex: 1,
                                    fontSize: 14,
                                    color: '#0F172A',
                                    outlineStyle: 'none' // Web only
                                } as any}
                            />
                            {/* Visual Hint */}
                            <View style={{
                                paddingHorizontal: 6, paddingVertical: 2,
                                backgroundColor: '#FFF', borderRadius: 4,
                                borderWidth: 1, borderColor: '#E2E8F0'
                            }}>
                                <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600' }}>⌘ K</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* RIGHT SECTION */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>

                    {/* Notification Bell (Desktop & Mobile) */}
                    <Pressable style={({ hovered }: { hovered?: boolean }) => ({
                        width: 40, height: 40, borderRadius: 20,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: hovered ? 'rgba(0,0,0,0.05)' : 'transparent'
                    })}>
                        <Bell size={20} color="#64748B" strokeWidth={2} />
                        {/* Dot */}
                        <View style={{
                            position: 'absolute', top: 10, right: 10,
                            width: 8, height: 8, borderRadius: 4,
                            backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#FFF'
                        }} />
                    </Pressable>

                    {/* Profile */}
                    <Pressable
                        onPress={() => {
                            console.log('Navigate to profile');
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
                            backgroundColor: '#E2E8F0',
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2
                        }}>
                            {/* Initials fallback */}
                            <UserIcon size={18} color="#64748B" strokeWidth={2} />
                        </View>

                        {/* Enhanced Text for Desktop, minimal for Mobile */}
                        {!isMobile && (
                            <View>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E293B' }}>
                                    {displayName || 'Guest'}
                                </Text>
                                <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B' }}>
                                    {rank || 'No Rank'}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                </View>
            </View>
        </View>
    );
}
