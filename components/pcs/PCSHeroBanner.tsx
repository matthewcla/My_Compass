import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useActiveOrder } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';

import { Mail, MapPin, MessageSquare, Phone, User } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Linking, Platform, Text, useColorScheme, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

/**
 * PCS Hero Banner — "Where Am I?"
 *
 * Glanceable card answering a Sailor's key PCS question:
 * Where am I going, when do I report, and who is my sponsor?
 */
export function PCSHeroBanner() {
    const activeOrder = useActiveOrder();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const stats = useMemo(() => {
        if (!activeOrder) return null;

        // Days until report NLT
        const reportDate = new Date(activeOrder.reportNLT);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        reportDate.setHours(0, 0, 0, 0);
        const diffMs = reportDate.getTime() - today.getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        // Format report date
        const reportFormatted = reportDate.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

        return { daysRemaining, reportFormatted };
    }, [activeOrder]);

    if (!stats || !activeOrder) return null;

    const { daysRemaining, reportFormatted } = stats;
    const sponsor = activeOrder.sponsor ?? null;
    const homePort = activeOrder.gainingCommand.homePort;

    // Sponsor contact helpers
    const sanitizePhone = (v?: string) => (v?.trim() || '').replace(/[^+\d]/g, '');
    const phone = sanitizePhone(sponsor?.phone);
    const email = (sponsor?.email || '').trim();
    const callUrl = phone ? `tel:${phone}` : '';
    const textUrl = phone ? `sms:${phone}` : '';
    const emailUrl = email ? `mailto:${email}` : '';
    const hasContactActions = Boolean(callUrl || textUrl || emailUrl);

    const sponsorDisplayName = useMemo(() => {
        const n = sponsor?.name?.trim();
        if (!n) return 'Sponsor';
        return n;
    }, [sponsor?.name]);

    const handleContactAction = async (url: string) => {
        if (!url) return;
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        }
        try {
            await Linking.openURL(url);
        } catch {
            // Ignore Linking failures
        }
    };

    // Urgency color: green → amber → red
    const urgencyColor =
        daysRemaining > 60
            ? isDark ? '#4ADE80' : '#16A34A'
            : daysRemaining > 21
                ? isDark ? '#FBBF24' : '#D97706'
                : isDark ? '#F87171' : '#DC2626';

    return (
        <Animated.View entering={FadeIn.duration(400).delay(100)}>
            <GlassView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                className="mx-4 mb-8 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
            >
                {/* ── Top section: Destination + Countdown ── */}
                <View className="bg-[#0A1628] p-5 pb-4">
                    <View className="flex-row items-center mb-2">
                        <MapPin size={16} color="#C9A227" />
                        <Text className="text-xs font-semibold uppercase tracking-widest text-slate-400 ml-2">
                            {homePort || 'Command Location'}
                        </Text>
                    </View>

                    <Text className="text-xl font-black text-white mb-1" numberOfLines={1}>
                        {activeOrder.gainingCommand.name}
                    </Text>



                    <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-slate-400 font-medium">
                            Report NLT {reportFormatted}
                        </Text>
                        <View
                            className="px-3 py-1 rounded-full"
                            style={{ backgroundColor: `${urgencyColor}20` }}
                        >
                            <Text style={{ color: urgencyColor }} className="text-sm font-bold">
                                {daysRemaining} days
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Sponsor Section ── */}
                <View className="px-5 pt-3 pb-2 border-b border-slate-200/30 dark:border-slate-700/30">
                    <View className="flex-row items-center">
                        <View className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center mr-2.5">
                            <User size={14} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                        </View>

                        {sponsor ? (
                            <View className="flex-1">
                                <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                                    {sponsorDisplayName}
                                </Text>
                                <Text className="text-xs text-slate-500 dark:text-slate-400">
                                    Command Sponsor
                                </Text>
                            </View>
                        ) : (
                            <View className="flex-1">
                                <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    No sponsor assigned yet
                                </Text>
                            </View>
                        )}

                        {hasContactActions && (
                            <View className="flex-row gap-1.5">
                                {callUrl ? (
                                    <ScalePressable
                                        onPress={() => handleContactAction(callUrl)}
                                        className="w-9 h-9 rounded-full bg-green-50 dark:bg-green-900/20 items-center justify-center"
                                        accessibilityRole="button"
                                        accessibilityLabel="Call Sponsor"
                                    >
                                        <Phone size={15} color={isDark ? '#86efac' : '#15803d'} strokeWidth={2.2} />
                                    </ScalePressable>
                                ) : null}
                                {textUrl ? (
                                    <ScalePressable
                                        onPress={() => handleContactAction(textUrl)}
                                        className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 items-center justify-center"
                                        accessibilityRole="button"
                                        accessibilityLabel="Text Sponsor"
                                    >
                                        <MessageSquare size={15} color={isDark ? '#93c5fd' : '#1d4ed8'} strokeWidth={2.2} />
                                    </ScalePressable>
                                ) : null}
                                {emailUrl ? (
                                    <ScalePressable
                                        onPress={() => handleContactAction(emailUrl)}
                                        className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                                        accessibilityRole="button"
                                        accessibilityLabel="Email Sponsor"
                                    >
                                        <Mail size={15} color={isDark ? '#cbd5e1' : '#475569'} strokeWidth={2.2} />
                                    </ScalePressable>
                                ) : null}
                            </View>
                        )}
                    </View>
                </View>

            </GlassView>
        </Animated.View>
    );
}
