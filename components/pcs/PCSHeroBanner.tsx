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
                intensity={isDark ? 80 : 60}
                tint={isDark ? 'dark' : 'light'}
                className="mx-4 mb-8 rounded-2xl overflow-hidden"
                style={{
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                }}
            >
                {/* ── Top section: Destination + Countdown ── */}
                <View className="bg-slate-900/70 p-5 pb-4">
                    <View className="flex-row items-center mb-2">
                        <MapPin size={16} color="#C9A227" />
                        <Text className="text-xs font-semibold uppercase tracking-widest text-slate-300 ml-2">
                            {homePort || 'Command Location'}
                        </Text>
                    </View>

                    <Text className="text-xl font-black text-white mb-1" numberOfLines={1}>
                        {activeOrder.gainingCommand.name}
                    </Text>

                    <View className="flex-row items-center justify-between mt-2">
                        <Text className="text-sm text-slate-400 font-medium">
                            Report NLT {reportFormatted}
                        </Text>
                        <View
                            className="px-3 py-1 rounded-full border"
                            style={{
                                backgroundColor: `${urgencyColor}15`,
                                borderColor: `${urgencyColor}30`
                            }}
                        >
                            <Text style={{ color: urgencyColor }} className="text-xs font-bold uppercase tracking-wider">
                                {daysRemaining} days
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Sponsor Section ── */}
                <View className="bg-white/40 dark:bg-slate-950/40 px-5 pt-3 pb-3 border-t border-slate-200/50 dark:border-slate-700/50">
                    <View className="flex-row items-center">
                        <View className="w-9 h-9 rounded-full bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 items-center justify-center mr-3">
                            <User size={15} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                        </View>

                        <View className="flex-1 justify-center">
                            {sponsor ? (
                                <>
                                    <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                                        {sponsorDisplayName}
                                    </Text>
                                    <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                                        Command Sponsor
                                    </Text>
                                </>
                            ) : (
                                <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    No sponsor assigned yet
                                </Text>
                            )}
                        </View>

                        {hasContactActions && (
                            <View className="flex-row gap-2">
                                {callUrl ? (
                                    <ScalePressable
                                        onPress={() => handleContactAction(callUrl)}
                                        className="w-9 h-9 rounded-full bg-green-500/10 items-center justify-center border border-green-500/20"
                                        accessibilityRole="button"
                                        accessibilityLabel="Call Sponsor"
                                    >
                                        <Phone size={14} color={isDark ? '#86efac' : '#15803d'} strokeWidth={2.2} />
                                    </ScalePressable>
                                ) : null}
                                {textUrl ? (
                                    <ScalePressable
                                        onPress={() => handleContactAction(textUrl)}
                                        className="w-9 h-9 rounded-full bg-blue-500/10 items-center justify-center border border-blue-500/20"
                                        accessibilityRole="button"
                                        accessibilityLabel="Text Sponsor"
                                    >
                                        <MessageSquare size={14} color={isDark ? '#93c5fd' : '#1d4ed8'} strokeWidth={2.2} />
                                    </ScalePressable>
                                ) : null}
                                {emailUrl ? (
                                    <ScalePressable
                                        onPress={() => handleContactAction(emailUrl)}
                                        className="w-9 h-9 rounded-full bg-slate-500/10 items-center justify-center border border-slate-500/20"
                                        accessibilityRole="button"
                                        accessibilityLabel="Email Sponsor"
                                    >
                                        <Mail size={14} color={isDark ? '#cbd5e1' : '#475569'} strokeWidth={2.2} />
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
