import { useColorScheme } from '@/components/useColorScheme';
import { BookOpen, HelpCircle, Lightbulb } from 'lucide-react-native';
import { MotiView } from 'moti';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const OnboardingCard = () => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const theme = {
        card: isDark ? '#1C1C1E' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#0F172A',
        subText: isDark ? '#94A3B8' : '#64748B',
        border: isDark ? '#27272A' : '#F1F5F9',
        iconBg: isDark ? '#27272A' : '#F1F5F9',
        icon: isDark ? '#E2E8F0' : '#475569',
    };

    const handlePress = (item: string) => {
        if (__DEV__) {
            console.log(`Navigate to ${item}`);
        }
        // Navigation logic can be added here later
    };

    const items = [
        { label: 'Tips & Tricks', icon: Lightbulb, id: 'tips' },
        { label: 'How-to Guide', icon: BookOpen, id: 'howto' },
        { label: 'FAQ', icon: HelpCircle, id: 'faq' },
    ];

    return (
        <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border }
            ]}
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Get Started</Text>
                <Text style={[styles.subtitle, { color: theme.subText }]}>
                    Learn how to make the most of your app experience.
                </Text>
            </View>

            <View style={styles.content}>
                {items.map((item, index) => (
                    <TouchableOpacity
                        key={item.id}
                        onPress={() => handlePress(item.id)}
                        style={[
                            styles.item,
                            { backgroundColor: theme.iconBg },
                            index !== items.length - 1 && { marginRight: 12 }
                        ]}
                        activeOpacity={0.7}
                    >
                        <item.icon size={20} color={theme.icon} />
                        <Text style={[styles.itemLabel, { color: theme.text }]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    item: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    itemLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default OnboardingCard;
