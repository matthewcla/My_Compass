import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useActiveOrder, usePCSStore } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ChevronRight, Mail, MapPin, MessageSquare, Phone, User, Zap } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Linking, Platform, Pressable, Text, useColorScheme, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

/**
 * PCS Hero Banner — "Where Am I?"
 *
 * Glanceable card answering a Sailor's three key PCS questions:
 * 1. Where am I going, when do I report, and who is my sponsor?
 * 2. Am I on track? (progress %)
 * 3. What's my next action?
 */
export function PCSHeroBanner() {
    const activeOrder = useActiveOrder();
    const checklist = usePCSStore((s) => s.checklist);
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const stats = useMemo(() => {
        if (!activeOrder || checklist.length === 0) return null;

        const completed = checklist.filter((c) => c.status === 'COMPLETE').length;
        const total = checklist.length;
        const progress = total > 0 ? completed / total : 0;

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

        // Next action: first incomplete item (prefer items with actionRoute)
        const nextAction = checklist
            .filter((c) => c.status !== 'COMPLETE')
            .sort((a, b) => {
                if (a.actionRoute && !b.actionRoute) return -1;
                if (!a.actionRoute && b.actionRoute) return 1;
                return 0;
            })[0] ?? null;

        return { completed, total, progress, daysRemaining, reportFormatted, nextAction };
    }, [activeOrder, checklist]);

    if (!stats || !activeOrder) return null;

    const { completed, total, progress, daysRemaining, reportFormatted, nextAction } = stats;
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
        const r = sponsor?.rank?.trim();
        if (!n && !r) return 'Sponsor';
        return [r, n].filter(Boolean).join(' ');
    }, [sponsor?.name, sponsor?.rank]);

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
                className="mx-4 mb-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
            >
                {/* ── Top section: Destination + Countdown ── */}
                <View className="bg-[#0A1628] p-5 pb-4">
                    <View className="flex-row items-center mb-2">
                        <MapPin size={16} color="#C9A227" />
                        <Text className="text-xs font-semibold uppercase tracking-widest text-slate-400 ml-2">
                            PCS Destination
                        </Text>
                    </View>

                    <Text className="text-xl font-black text-white mb-1" numberOfLines={1}>
                        {activeOrder.gainingCommand.name}
                    </Text>

                    {homePort && (
                        <Text className="text-sm text-slate-400 font-medium mb-1" numberOfLines={1}>
                            {homePort}
                        </Text>
                    )}

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
                                        className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 items-center justify-center"
                                        accessibilityRole="button"
                                        accessibilityLabel="Call Sponsor"
                                    >
                                        <Phone size={14} color={isDark ? '#86efac' : '#15803d'} strokeWidth={2.2} />
                                    </ScalePressable>
                                ) : null}
                                {textUrl ? (
                                    <ScalePressable
                                        onPress={() => handleContactAction(textUrl)}
                                        className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 items-center justify-center"
                                        accessibilityRole="button"
                                        accessibilityLabel="Text Sponsor"
                                    >
                                        <MessageSquare size={14} color={isDark ? '#93c5fd' : '#1d4ed8'} strokeWidth={2.2} />
                                    </ScalePressable>
                                ) : null}
                                {emailUrl ? (
                                    <ScalePressable
                                        onPress={() => handleContactAction(emailUrl)}
                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
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

                {/* ── Progress bar section ── */}
                <View className="px-5 pt-4 pb-3">
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {completed} of {total} tasks complete
                        </Text>
                        <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {Math.round(progress * 100)}%
                        </Text>
                    </View>

                    {/* Track */}
                    <View className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <View
                            className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                            style={{ width: `${Math.round(progress * 100)}%` }}
                        />
                    </View>
                </View>

                {/* ── Next Action CTA ── */}
                {nextAction && (
                    <Pressable
                        onPress={() => {
                            if (nextAction.actionRoute) {
                                router.push(nextAction.actionRoute as any);
                            }
                        }}
                        className="mx-5 mb-4 mt-1 flex-row items-center bg-blue-50 dark:bg-blue-900/30 rounded-xl px-4 py-3 border border-blue-100 dark:border-blue-800/50"
                    >
                        <Zap size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
                        <Text
                            className="flex-1 text-sm font-semibold text-blue-700 dark:text-blue-300 ml-2"
                            numberOfLines={1}
                        >
                            {nextAction.label}
                        </Text>
                        {nextAction.actionRoute && (
                            <ChevronRight size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
                        )}
                    </Pressable>
                )}
            </GlassView>
        </Animated.View>
    );
}
