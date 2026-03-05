import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { Briefcase, Compass } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TileProps {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    onPress: () => void;
    isDark: boolean;
}

function MenuTile({ title, subtitle, icon, color, onPress, isDark }: TileProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[
                styles.tile,
                {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                }
            ]}
        >
            <View style={[styles.iconContainer, { backgroundColor: isDark ? `${color}20` : `${color}15` }]}>
                {icon}
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>
                    {title}
                </Text>
                <Text style={[styles.subtitle, { color: isDark ? '#A1A1AA' : '#64748B' }]} numberOfLines={1}>
                    {subtitle}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export function CommandCenterTiles() {
    const isDark = useColorScheme() === 'dark';
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                <MenuTile
                    title="My Career"
                    subtitle="Pipelines & Strategy"
                    icon={<Compass size={24} color={isDark ? '#C9A227' : '#B89222'} strokeWidth={2} />}
                    color="#C9A227"
                    onPress={() => router.push('/(career)' as any)}
                    isDark={isDark}
                />
                <MenuTile
                    title="My Admin"
                    subtitle="Forms & SeaBag"
                    icon={<Briefcase size={24} color={isDark ? '#60A5FA' : '#2563EB'} strokeWidth={2} />}
                    color={isDark ? '#60A5FA' : '#2563EB'}
                    onPress={() => router.push('/(admin)' as any)}
                    isDark={isDark}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingBottom: 24,
    },
    grid: {
        flexDirection: 'row',
        gap: 12,
    },
    tile: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        borderWidth: StyleSheet.hairlineWidth,
        minHeight: 100, // Meets Apple HIG minimums
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    textContainer: {
        justifyContent: 'flex-end',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '500',
    }
});
