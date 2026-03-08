import { ScalePressable } from '@/components/ScalePressable';
import { TaskClusterHeader } from '@/components/pcs/widgets/TaskClusterHeader';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useDemoStore } from '@/store/useDemoStore';
import { useActiveOrder, usePCSStore } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    MapPin,
    MessageSquare,
    Phone,
    Shirt,
    User
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';

// ─── Reporting Instructions (Day-1 Tips) ───────────────────────

const REPORT_TIPS = [
    'Bring the original copy of your orders',
    'Report in dress uniform',
    'Have your military ID / CAC ready',
    "Know your sponsor's contact info",
];

export function ArrivalBriefingWidget() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const activeOrder = useActiveOrder();
    const checklist = usePCSStore((s) => s.checklist);
    const router = useRouter();

    const [instructionsExpanded, setInstructionsExpanded] = useState(false);
    const [instructionsHeight, setInstructionsHeight] = useState(0);

    const isDemoMode = useDemoStore((s) => s.isDemoMode);
    const demoTimeline = useDemoStore((s) => s.demoTimelineOverride);

    if (!activeOrder) return null;

    const {
        name,
        quarterdeckPhone,
        quarterdeckLocation,
    } = activeOrder.gainingCommand;

    const sponsor = activeOrder.sponsor;
    const hasLocation = quarterdeckLocation?.latitude && quarterdeckLocation?.longitude;
    const hasSponsor = sponsor?.phone || sponsor?.email;

    const daysSinceArrival = useMemo(() => {
        if (isDemoMode && demoTimeline && demoTimeline.daysOnStation > 0) {
            return demoTimeline.daysOnStation;
        }
        if (!activeOrder?.reportNLT) return null;
        const report = new Date(activeOrder.reportNLT);
        if (Number.isNaN(report.getTime())) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        report.setHours(0, 0, 0, 0);
        const diff = Math.floor((today.getTime() - report.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff + 1);
    }, [activeOrder?.reportNLT, isDemoMode, demoTimeline]);

    // Pull directly from the `CHECK_IN` category driven by dynamic store data
    const checkinTasks = useMemo(() => {
        return checklist.filter(task => task.category === 'CHECK_IN');
    }, [checklist]);

    const nextAction = checkinTasks.find((task) => task.status !== 'COMPLETE');
    const allComplete = checkinTasks.length > 0 && checkinTasks.every(t => t.status === 'COMPLETE');

    const displayUniform = useMemo(() => {
        const month = new Date().getMonth(); // 0-indexed
        // Oct(9)–Mar(2) = Blues, Apr(3)–Sep(8) = Whites
        return month >= 3 && month <= 8 ? 'Service Dress Whites' : 'Service Dress Blues';
    }, []);

    // ── Handlers ──────────────────────────────────────────────────

    const handleMapPress = async () => {
        if (!hasLocation) return;
        if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);

        const { latitude, longitude } = quarterdeckLocation!;
        const url = Platform.select({
            ios: `maps:?q=${latitude},${longitude}`,
            android: `geo:${latitude},${longitude}`,
            web: `https://maps.google.com/?q=${latitude},${longitude}`,
        });
        try { if (url) await Linking.openURL(url); } catch { }
    };

    const handlePhonePress = async (phone: string) => {
        if (!phone) return;
        if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        try { await Linking.openURL(`tel:${phone}`); } catch { }
    };

    const handleEmailPress = async (email: string) => {
        if (!email) return;
        if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        try { await Linking.openURL(`mailto:${email}?subject=${encodeURIComponent('My Check-In')}`); } catch { }
    };

    const insturctionsStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(instructionsExpanded ? instructionsHeight : 0, { duration: 300 }),
            opacity: withTiming(instructionsExpanded ? 1 : 0, { duration: 250 }),
            marginTop: withTiming(instructionsExpanded ? 8 : 0, { duration: 300 }),
        };
    }, [instructionsExpanded, instructionsHeight]);

    const chevronStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: withTiming(instructionsExpanded ? '90deg' : '0deg', { duration: 300 }) }]
        };
    });


    return (
        <Animated.View entering={FadeInDown.delay(100).springify()}>
            <GlassView
                intensity={80}
                tint={isDark ? "dark" : "light"}
                className="rounded-[24px] overflow-hidden mx-4 mb-6 shadow-sm dark:shadow-none bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/10"
            >
                {/* Header Area - Converted to Premium Slate/Blue */}
                <View className="px-5 py-4 border-b border-black/5 dark:border-white/5 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                        <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-100 dark:bg-blue-900/50">
                            <MapPin size={20} color={isDark ? '#60A5FA' : '#2563EB'} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Welcome Aboard
                            </Text>
                            <Text className="text-lg font-black tracking-tight text-slate-900 dark:text-white" numberOfLines={1}>
                                {name || 'Your New Command'}
                            </Text>
                        </View>
                    </View>

                    {daysSinceArrival !== null && (
                        <View className="bg-slate-500/10 px-3 py-1.5 rounded-[12px] border border-slate-500/20">
                            <Text className="text-[11px] font-black tracking-wide text-slate-600 dark:text-slate-400 uppercase">
                                Day {daysSinceArrival}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Body Area */}
                <View className="px-5 py-5 gap-6">

                    {/* MICRO-GRID: Compressed Reference Data (Moved to top) */}
                    <View>
                        {/* Uniform Row (Full Width) */}
                        {displayUniform && (
                            <View className="mb-2 bg-white/40 dark:bg-slate-800/40 rounded-[16px] p-3 mx-0 border border-black/5 dark:border-white/5 flex-row items-center">
                                <View className="w-10 h-10 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-700 mr-3 border border-slate-200 dark:border-slate-600">
                                    <Shirt size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-0.5">Uniform of the Day</Text>
                                    <Text className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">{displayUniform}</Text>
                                </View>
                            </View>
                        )}

                        {/* Sponsor Row (Full Width) */}
                        {hasSponsor && (
                            <View className="mb-2 bg-white/40 dark:bg-slate-800/40 rounded-[16px] p-3 border border-black/5 dark:border-white/5 flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1 pr-2">
                                    <View className="w-10 h-10 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-700 mr-3 border border-slate-200 dark:border-slate-600">
                                        <User size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-0.5">Command Sponsor</Text>
                                        <Text className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight" numberOfLines={1}>
                                            {sponsor?.name || 'Assigned Sponsor'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Communications Block */}
                                <View className="flex-row gap-2">
                                    {sponsor?.phone && (
                                        <ScalePressable
                                            onPress={() => handlePhonePress(sponsor.phone!)}
                                            className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 items-center justify-center shadow-sm"
                                            accessibilityRole="button"
                                        >
                                            <Phone size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
                                        </ScalePressable>
                                    )}
                                    {sponsor?.phone && (
                                        <ScalePressable
                                            onPress={() => {
                                                if (Platform.OS !== 'web') {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
                                                }
                                                Linking.openURL(`sms:${sponsor.phone}`).catch(() => undefined);
                                            }}
                                            className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 items-center justify-center shadow-sm"
                                            accessibilityRole="button"
                                        >
                                            <MessageSquare size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
                                        </ScalePressable>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Navigation / Location Rows (Full Width) */}
                        <View className="gap-2">
                            {hasLocation && (
                                <ScalePressable
                                    onPress={handleMapPress}
                                    className="bg-white/40 dark:bg-slate-800/40 rounded-[16px] p-3 border border-black/5 dark:border-white/5 flex-row items-center"
                                >
                                    <View className="w-10 h-10 rounded-full items-center justify-center bg-emerald-500/10 dark:bg-emerald-900/30 mr-3 border border-emerald-500/20 dark:border-emerald-700/50">
                                        <MapPin size={18} color={isDark ? '#34D399' : '#059669'} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 mb-0.5" numberOfLines={1}>Navigate</Text>
                                        <Text className="text-[15px] font-bold text-emerald-800 dark:text-emerald-300 leading-tight">Quarterdeck</Text>
                                    </View>
                                </ScalePressable>
                            )}

                            {quarterdeckPhone && (
                                <ScalePressable
                                    onPress={() => handlePhonePress(quarterdeckPhone)}
                                    className="bg-white/40 dark:bg-slate-800/40 rounded-[16px] p-3 border border-black/5 dark:border-white/5 flex-row items-center"
                                >
                                    <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-500/10 dark:bg-blue-900/30 mr-3 border border-blue-500/20 dark:border-blue-700/50">
                                        <Phone size={18} color={isDark ? '#60A5FA' : '#2563EB'} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-0.5" numberOfLines={1}>Call Quarterdeck</Text>
                                        <Text className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">{quarterdeckPhone}</Text>
                                    </View>
                                </ScalePressable>
                            )}
                        </View>
                    </View>

                    {/* Reporting Instructions (Modal Isolation/Expandable Pattern) */}
                    <View>
                        <ScalePressable
                            onPress={() => setInstructionsExpanded(!instructionsExpanded)}
                            className="flex-row items-center justify-between p-3 bg-white/40 dark:bg-slate-800/40 rounded-[16px] border border-black/5 dark:border-white/5"
                        >
                            <View className="flex-row items-center text-slate-700 dark:text-slate-300">
                                <ClipboardList size={16} color={isDark ? '#94a3b8' : '#64748b'} className="mr-2" />
                                <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                                    View Reporting Procedures
                                </Text>
                            </View>
                            <Animated.View style={chevronStyle}>
                                <ChevronRight size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                            </Animated.View>
                        </ScalePressable>

                        <Animated.View style={[insturctionsStyle, { overflow: 'hidden' }]}>
                            <View
                                onLayout={(e) => setInstructionsHeight(e.nativeEvent.layout.height)}
                                className="absolute top-0 left-0 right-0 bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 shadow-sm"
                            >
                                <View style={{ gap: 12 }}>
                                    {REPORT_TIPS.map((tip, i) => (
                                        <View key={i} className="flex-row items-start">
                                            <View className="w-5 h-5 rounded-full bg-blue-500/20 items-center justify-center mr-3 mt-0.5">
                                                <Text className="text-[10px] font-black text-blue-700 dark:text-blue-300">{i + 1}</Text>
                                            </View>
                                            <Text className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 flex-1 leading-5">
                                                {tip}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </Animated.View>
                    </View>


                    {/* Next Action Hook - Reverted to Action/Blue Slate Gradient */}
                    {nextAction ? (
                        <TouchableOpacity
                            onPress={() => {
                                if (nextAction.actionRoute) {
                                    router.push(nextAction.actionRoute as any);
                                }
                            }}
                            activeOpacity={0.7}
                            className="rounded-[20px] overflow-hidden border border-blue-500/20 dark:border-blue-400/30 shadow-sm"
                        >
                            <LinearGradient
                                colors={isDark ? ['rgba(59,130,246,0.15)', 'rgba(37,99,235,0.05)'] : ['rgba(219,234,254,0.6)', 'rgba(191,219,254,0.3)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View className="flex-row items-center justify-between p-4">
                                    <View className="flex-row items-center gap-4 flex-1">
                                        <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 items-center justify-center shadow-inner">
                                            <ArrowRight size={22} color={isDark ? '#60A5FA' : '#2563EB'} strokeWidth={2.5} />
                                        </View>
                                        <View className="flex-1 pr-4">
                                            <Text className="text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">
                                                Next Action Required
                                            </Text>
                                            <Text className="text-slate-900 dark:text-slate-100 text-[15px] font-bold leading-tight tracking-tight" numberOfLines={2}>
                                                {nextAction.label}
                                            </Text>
                                        </View>
                                    </View>
                                    <ArrowRight size={20} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2.5} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : allComplete ? (
                        <View className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 flex-row items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-800/30">
                            <CheckCircle2 size={16} color={isDark ? '#34D399' : '#059669'} />
                            <Text className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">All check-in tasks completed!</Text>
                        </View>
                    ) : null}

                    {/* Task Cluster Component (Sitting below the critical metadata) */}
                    {checkinTasks.length > 0 && (
                        <View>
                            <TaskClusterHeader
                                type="checkin"
                                title="REPORTING CHECKLIST"
                                isDark={isDark}
                            />
                            <View className="bg-white/40 dark:bg-slate-800/40 rounded-[16px] overflow-hidden border border-black/5 dark:border-white/5">
                                {checkinTasks.map((task, idx) => (
                                    <ScalePressable
                                        key={task.id}
                                        disabled={!task.actionRoute}
                                        onPress={() => {
                                            if (task.actionRoute) {
                                                router.push(task.actionRoute as any);
                                            }
                                        }}
                                        className={`flex-row items-center py-3 px-3 ${idx < checkinTasks.length - 1 ? 'border-b border-slate-200/50 dark:border-slate-700/50' : ''}`}
                                    >
                                        <View className={`w-8 h-8 rounded-full items-center justify-center border ${task.status === 'COMPLETE' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200/50 dark:border-emerald-700/50' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200/50 dark:border-blue-700/50'}`}>
                                            {task.status === 'COMPLETE' ? (
                                                <CheckCircle2 size={16} color={isDark ? '#34D399' : '#059669'} />
                                            ) : (
                                                <ChevronRight size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
                                            )}
                                        </View>
                                        <View className="flex-1 ml-3">
                                            <Text className={`text-[14px] font-semibold ${task.status === 'COMPLETE' ? 'text-emerald-700 dark:text-emerald-400 line-through opacity-70' : 'text-slate-700 dark:text-slate-300'}`} numberOfLines={1}>
                                                {task.label}
                                            </Text>
                                            {task.helpText && task.status !== 'COMPLETE' && (
                                                <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>{task.helpText}</Text>
                                            )}
                                        </View>
                                    </ScalePressable>
                                ))}
                            </View>
                        </View>
                    )}

                </View>
            </GlassView>
        </Animated.View>
    );
}
