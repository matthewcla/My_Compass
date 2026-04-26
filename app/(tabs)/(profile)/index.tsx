import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { VerifiedBadge } from '@/components/icons/VerifiedBadge';
import { PCSDevPanel } from '@/components/pcs/PCSDevPanel';
import { ControlPill, InfoRow, MilestoneRow, SectionCard, TimelineEntry } from '@/components/profile/ProfileHelpers';
import { ProfileTimelineTab } from '@/components/profile/ProfileTimelineTab';
import { ScreenGradient } from '@/components/ScreenGradient';
import { ScreenHeader } from '@/components/ScreenHeader';
import { DemoUser } from '@/constants/DemoData';
import { useCurrentProfile, useDemoStore } from '@/store/useDemoStore';
import { useProfileTimelineStore } from '@/store/useProfileTimelineStore';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import {
    Award,
    BookOpen,
    Briefcase,
    Calendar,
    CheckCircle,
    ChevronRight,
    Clock,
    Flag,
    Heart,
    Home,
    Mail,
    MapPin,
    Phone,
    Shield,
    Ship,
    Star,
    User,
    Users
} from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
    useColorScheme,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Helpers ─────────────────────────────────────────────
function formatDate(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso?: string): number | null {
    if (!iso) return null;
    const now = new Date();
    const target = new Date(iso);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function getRatingFullName(rating?: string): string {
    const lookup: Record<string, string> = {
        IT: 'Information Systems Technician', ET: 'Electronics Technician',
        CTN: 'Cryptologic Technician (Networks)', CTR: 'Cryptologic Technician (Collection)',
        IS: 'Intelligence Specialist', OS: 'Operations Specialist',
        GM: 'Gunner\'s Mate', BM: 'Boatswain\'s Mate', HM: 'Hospital Corpsman',
        YN: 'Yeoman', PS: 'Personnel Specialist', LS: 'Logistics Specialist',
        FC: 'Fire Controlman', MM: 'Machinist\'s Mate', EM: 'Electrician\'s Mate', DC: 'Damage Controlman',
    };
    return rating ? lookup[rating] ?? rating : '';
}

function getStationTypeBadge(type?: string) {
    switch (type) {
        case 'AFLOAT': return { label: 'AFLOAT', containerClass: 'bg-blue-100 dark:bg-blue-900/60', textClass: 'text-blue-700 dark:text-blue-100' };
        case 'OCONUS': return { label: 'OCONUS', containerClass: 'bg-emerald-100 dark:bg-emerald-900/60', textClass: 'text-emerald-700 dark:text-emerald-100' };
        case 'CONUS': return { label: 'CONUS', containerClass: 'bg-amber-100 dark:bg-amber-900/60', textClass: 'text-amber-700 dark:text-amber-100' };
        default: return null;
    }
}

// ═══════════════════════════════════════════════════════════
// PROFILE SCREEN
// ═══════════════════════════════════════════════════════════
export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const user = useCurrentProfile();
    const selectedUser = useDemoStore((s) => s.selectedUser);
    const isDemoMode = useDemoStore((s) => s.isDemoMode);
    const [activeTab, setActiveTab] = useState<'professional' | 'personal' | 'timeline'>('professional');
    const loadTimeline = useProfileTimelineStore((s) => s.loadTimeline);
    const scrollRef = useRef<any>(null);
    const colorScheme = useColorScheme() ?? 'light';

    // Scroll to top whenever this tab gains focus
    useFocusEffect(
        useCallback(() => {
            const ref = scrollRef.current;
            if (!ref) return;
            if (ref.scrollTo) {
                ref.scrollTo({ y: 0, animated: false });
            } else if (ref.getNode?.()?.scrollTo) {
                ref.getNode().scrollTo({ y: 0, animated: false });
            } else if (ref.getScrollResponder?.()?.scrollTo) {
                ref.getScrollResponder().scrollTo({ y: 0, animated: false });
            }
        }, [])
    );

    // Memoized callbacks for ControlPill
    const handleProfessionalPress = useCallback(() => setActiveTab('professional'), []);
    const handlePersonalPress = useCallback(() => setActiveTab('personal'), []);
    const handleTimelinePress = useCallback(() => {
        setActiveTab('timeline');
        // Load timeline from the current demo user data
        const demoData = isDemoMode ? selectedUser : null;
        if (demoData) {
            loadTimeline(demoData as DemoUser);
        }
    }, [isDemoMode, selectedUser, loadTimeline]);
    const handlePreferencesPress = useCallback(() => router.push('/(profile)/preferences' as any), []);
    const handleSurveysPress = useCallback(() => router.push('/(profile)/surveys' as any), []);

    // Career data — from DemoUser when demo mode, empty otherwise
    const demoUser = isDemoMode ? selectedUser : null;
    const assignmentHistory = useMemo(() => demoUser?.assignmentHistory ?? [], [demoUser?.assignmentHistory]);
    const necs = useMemo(() => demoUser?.necs ?? [], [demoUser?.necs]);
    const qualifications = useMemo(() => demoUser?.qualifications ?? [], [demoUser?.qualifications]);
    const coolCredentials = useMemo(() => demoUser?.coolCredentials ?? [], [demoUser?.coolCredentials]);
    const seaShoreRotation = useMemo(() => demoUser?.seaShoreRotation ?? [], [demoUser?.seaShoreRotation]);
    const trainingRecord = useMemo(() => demoUser?.trainingRecord ?? [], [demoUser?.trainingRecord]);

    if (!user) {
        return (
            <ScreenGradient>
                <View className="flex-1 justify-center items-center">
                    <Text className="text-slate-500 dark:text-slate-400 text-base">
                        Please sign in to view your profile.
                    </Text>
                </View>
            </ScreenGradient>
        );
    }

    const initials = useMemo(() => getInitials(user.displayName), [user.displayName]);
    const ratingFull = useMemo(() => getRatingFullName(user.rating), [user.rating]);
    const stationBadge = useMemo(() => getStationTypeBadge(user.dutyStation?.type), [user.dutyStation?.type]);

    const prdDays = useMemo(() => daysUntil(user.prd), [user.prd]);
    const seaosDays = useMemo(() => daysUntil(user.seaos), [user.seaos]);
    const eaosDays = useMemo(() => daysUntil(user.eaos), [user.eaos]);

    // ─── Professional Tab ────────────────────────────────
    const renderProfessionalTab = useMemo(() => {
        const awards = demoUser?.awards || [];
        const personalAwards = awards.filter(a => a.type === 'Personal').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const unitAwards = awards.filter(a => a.type === 'Unit').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const campaignAwards = awards.filter(a => a.type === 'Campaign').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const serviceAwards = awards.filter(a => a.type === 'Service').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
        <View className="px-4">
            {/* Assignment History (current billet merged as first entry) */}
            <Animated.View entering={FadeInUp.delay(100).duration(300)}>
                <SectionCard
                    title="Assignment History"
                    icon={<Clock size={20} color="#60A5FA" />}
                >
                    {assignmentHistory.map((entry, idx) => (
                        <TimelineEntry
                            key={idx}
                            title={entry.title}
                            subtitle={entry.subtitle}
                            dates={entry.dates}
                            type={entry.type}
                            isLast={idx === assignmentHistory.length - 1}
                            isCurrent={entry.current}
                        />
                    ))}
                </SectionCard>
            </Animated.View>

            {/* Awards & Decorations */}
            <Animated.View entering={FadeInUp.delay(150).duration(300)}>
                <SectionCard
                    title="Awards & Decorations"
                    icon={<Award size={20} color="#F5A524" />}
                >
                    {personalAwards.length > 0 && (
                        <View className="mb-3">
                            <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold tracking-widest uppercase mb-2">
                                Personal Awards
                            </Text>
                            <View className="bg-white dark:bg-black border border-slate-200 dark:border-slate-700">
                                {personalAwards.map((award, idx) => (
                                    <View key={idx} className={`flex-row items-center p-3 ${idx < personalAwards.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
                                        <Award size={16} color="#C9A227" className="mr-3" />
                                        <View className="flex-1">
                                            <Text className="text-slate-900 dark:text-slate-200 text-[14px] font-semibold">{award.name}</Text>
                                        </View>
                                        <View className="items-end ml-3">
                                            {award.count && award.count > 1 ? (
                                                <Text className="text-amber-600 dark:text-amber-500 text-[14px] font-extrabold" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>x{award.count}</Text>
                                            ) : null}
                                            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{formatDate(award.date)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {unitAwards.length > 0 && (
                        <View className="mb-3">
                            <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold tracking-widest uppercase mb-2">
                                Unit Awards
                            </Text>
                            <View className="bg-white dark:bg-black border border-slate-200 dark:border-slate-700">
                                {unitAwards.map((award, idx) => (
                                    <View key={idx} className={`flex-row items-center p-3 ${idx < unitAwards.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
                                        <Flag size={16} color="#60A5FA" className="mr-3" />
                                        <View className="flex-1">
                                            <Text className="text-slate-900 dark:text-slate-200 text-[14px] font-semibold">{award.name}</Text>
                                        </View>
                                        <View className="items-end ml-3">
                                            {award.count && award.count > 1 ? (
                                                <Text className="text-blue-600 dark:text-blue-400 text-[14px] font-extrabold" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>x{award.count}</Text>
                                            ) : null}
                                            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{formatDate(award.date)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {campaignAwards.length > 0 && (
                        <View className="mb-3">
                            <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold tracking-widest uppercase mb-2">
                                Campaign Medals
                            </Text>
                            <View className="bg-white dark:bg-black border border-slate-200 dark:border-slate-700">
                                {campaignAwards.map((award, idx) => (
                                    <View key={idx} className={`flex-row items-center p-3 ${idx < campaignAwards.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
                                        <Shield size={16} color="#EF4444" className="mr-3" />
                                        <View className="flex-1">
                                            <Text className="text-slate-900 dark:text-slate-200 text-[14px] font-semibold">{award.name}</Text>
                                        </View>
                                        <View className="items-end ml-3">
                                            {award.count && award.count > 1 ? (
                                                <Text className="text-red-600 dark:text-red-500 text-[14px] font-extrabold" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>x{award.count}</Text>
                                            ) : null}
                                            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{formatDate(award.date)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {serviceAwards.length > 0 && (
                        <View>
                            <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold tracking-widest uppercase mb-2">
                                Service Awards
                            </Text>
                            <View className="bg-white dark:bg-black border border-slate-200 dark:border-slate-700">
                                {serviceAwards.map((award, idx) => (
                                    <View key={idx} className={`flex-row items-center p-3 ${idx < serviceAwards.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
                                        <Star size={16} color="#6EE7B7" className="mr-3" />
                                        <View className="flex-1">
                                            <Text className="text-slate-900 dark:text-slate-200 text-[14px] font-semibold">{award.name}</Text>
                                        </View>
                                        <View className="items-end ml-3">
                                            {award.count && award.count > 1 ? (
                                                <Text className="text-emerald-600 dark:text-emerald-400 text-[14px] font-extrabold" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>x{award.count}</Text>
                                            ) : null}
                                            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{formatDate(award.date)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </SectionCard>
            </Animated.View>

            {/* Certifications & NECs (merged NECs + COOL) */}
            <Animated.View entering={FadeInUp.delay(200).duration(300)}>
                <SectionCard
                    title="Certifications & NECs"
                    icon={<Award size={20} color="#6EE7B7" />}
                >
                    {/* NECs */}
                    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold tracking-widest uppercase mb-2">
                        Navy Enlisted Classifications
                    </Text>
                    {necs.map((nec) => (
                        <View key={nec.code} className="flex-row items-center mb-2 bg-slate-50 dark:bg-slate-800 p-2.5">
                            <View className="bg-slate-200 dark:bg-slate-700 px-2 py-1 mr-2.5">
                                <Text className="text-slate-900 dark:text-slate-100 text-xs font-extrabold">{nec.code}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-700 dark:text-slate-300 text-[13px] font-medium">{nec.name}</Text>
                            </View>
                            <Text className="text-slate-500 dark:text-slate-400 text-[11px]">{nec.earned}</Text>
                        </View>
                    ))}

                    {/* Qualifications */}
                    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold tracking-widest uppercase mt-3.5 mb-2">
                        Warfare & Watch Qualifications
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                        {qualifications.map((qual) => (
                            <View key={qual} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1">
                                <Text className="text-slate-900 dark:text-slate-100 text-xs font-semibold">{qual}</Text>
                            </View>
                        ))}
                    </View>

                    {/* COOL Credentials */}
                    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold tracking-widest uppercase mt-3.5 mb-2">
                        COOL Civilian Credentials
                    </Text>
                    {coolCredentials.map((cred) => (
                        <View key={cred.name} className="flex-row items-center justify-between py-2">
                            <View className="flex-1">
                                <Text className="text-slate-900 dark:text-slate-200 text-[14px] font-semibold">{cred.name}</Text>
                                {cred.date && (
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Earned {cred.date}</Text>
                                )}
                            </View>
                            <View className={`px-2 py-1 ${cred.status === 'Earned' ? 'bg-slate-900 dark:bg-zinc-900 border-0' : 'bg-transparent border border-slate-300 dark:border-slate-700'}`}>
                                <Text className={`text-[11px] font-bold ${cred.status === 'Earned' ? 'text-white dark:text-slate-50' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {cred.status}
                                </Text>
                            </View>
                        </View>
                    ))}
                </SectionCard>
            </Animated.View>

            {/* Sea/Shore Rotation */}
            <Animated.View entering={FadeInUp.delay(300).duration(300)}>
                <SectionCard
                    title="Sea/Shore Rotation"
                    icon={<Ship size={20} color="#94A3B8" />}
                >
                    {seaShoreRotation.map((rot, idx) => (
                        <View key={idx} className={`flex-row items-center py-2.5 ${idx < seaShoreRotation.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
                            <View className="w-[54px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1 items-center mr-3">
                                <Text className="text-slate-900 dark:text-slate-200 text-[11px] font-extrabold">{rot.period.toUpperCase()}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 dark:text-slate-200 text-[14px] font-medium">{rot.station}</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-xs">{rot.dates}</Text>
                            </View>
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{rot.months}mo</Text>
                        </View>
                    ))}
                </SectionCard>
            </Animated.View>

            {/* Training Record */}
            <Animated.View entering={FadeInUp.delay(400).duration(300)}>
                <SectionCard
                    title="Training Record"
                    icon={<BookOpen size={20} color="#94A3B8" />}
                >
                    {trainingRecord.map((t, idx) => (
                        <View key={idx} className={`flex-row items-start ${idx < trainingRecord.length - 1 ? 'mb-3' : ''}`}>
                            <View className="w-[60px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-[3px] items-center mr-2.5 mt-0.5">
                                <Text className="text-slate-700 dark:text-slate-300 text-[10px] font-extrabold">{t.type.toUpperCase()}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 dark:text-slate-200 text-[14px] font-medium">{t.school}</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-xs">{t.location} · {t.date}</Text>
                            </View>
                        </View>
                    ))}
                </SectionCard>
            </Animated.View>

            {/* Service Milestones & Validation (merged) */}
            <Animated.View entering={FadeInUp.delay(500).duration(300)}>
                <SectionCard
                    title="Service Milestones"
                    icon={<Calendar size={20} color="#F59E0B" />}
                >
                    <MilestoneRow label="Projected Rotation Date (PRD)" date={formatDate(user.prd)} daysLeft={prdDays} accentColor="#F59E0B" />
                    <MilestoneRow label="Soft EAOS (SEAOS)" date={formatDate(user.seaos)} daysLeft={seaosDays} accentColor="#3B82F6" />
                    <MilestoneRow label="End of Active Obligated Service" date={formatDate(user.eaos)} daysLeft={eaosDays} accentColor="#EF4444" isLast />

                    {/* Validation status inline */}
                    <View className="flex-row items-center gap-2.5 mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <CheckCircle size={14} color="#10B981" />
                        <View className="bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1">
                            <Text className="text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                                {(user.syncStatus ?? 'unknown').toUpperCase()}
                            </Text>
                        </View>
                        <Text className="text-slate-500 dark:text-slate-400 text-xs">
                            Last sync {formatDate(user.lastSyncTimestamp)}
                        </Text>
                    </View>
                </SectionCard>
            </Animated.View>

            {/* Assignment Preferences — quick link */}
            <Animated.View entering={FadeInUp.delay(600).duration(300)}>
                <Pressable
                    onPress={() => router.push('/(profile)/preferences' as any)}
                    className="flex-row items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 mb-3 shadow-apple-sm dark:shadow-none"
                >
                    <View className="flex-row items-center gap-2.5">
                        <Star size={18} color="#C9A227" />
                        <View>
                            <Text className="text-slate-900 dark:text-slate-100 text-[15px] font-semibold">
                                Assignment Preferences
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                {user.preferences?.regions?.join(', ') || 'None set'} · {user.preferences?.dutyTypes?.join(', ') || 'None'}
                            </Text>
                        </View>
                    </View>
                    <ChevronRight size={18} color="#94A3B8" />
                </Pressable>
            </Animated.View>
        </View>
    );
    }, [user, assignmentHistory, necs, qualifications, coolCredentials, seaShoreRotation, trainingRecord, prdDays, seaosDays, eaosDays, demoUser?.awards]);

    // ─── Personal Tab ────────────────────────────────────
    const renderPersonalTab = useMemo(() => (
        <View className="px-4">
            {/* About */}
            <Animated.View entering={FadeInUp.delay(100).duration(300)}>
                <SectionCard title="About" icon={<User size={20} color="#60A5FA" />}>
                    {user.email && <InfoRow icon={<Mail size={16} color="#64748B" />} label="Email" value={user.email} />}
                    {user.phone && <InfoRow icon={<Phone size={16} color="#64748B" />} label="Phone" value={user.phone} />}
                    <InfoRow
                        icon={<Heart size={16} color="#64748B" />}
                        label="Marital Status"
                        value={(user.maritalStatus ?? 'N/A').charAt(0).toUpperCase() + (user.maritalStatus ?? 'n/a').slice(1)}
                    />
                    <InfoRow
                        icon={<Home size={16} color="#64748B" />}
                        label="Housing"
                        value={(user.housing?.type ?? 'N/A').replace('_', '-').replace(/\b\w/g, (c) => c.toUpperCase())}
                    />
                    {user.bloodType && <InfoRow icon={<Shield size={16} color="#64748B" />} label="Blood Type" value={user.bloodType} />}
                </SectionCard>
            </Animated.View>

            {/* Emergency Contact */}
            {user.emergencyContact && (
                <Animated.View entering={FadeInUp.delay(200).duration(300)}>
                    <SectionCard title="Emergency Contact" icon={<Phone size={20} color="#EF4444" />}>
                        <InfoRow icon={<User size={16} color="#64748B" />} label={user.emergencyContact.relationship} value={user.emergencyContact.name} />
                        <InfoRow icon={<Phone size={16} color="#64748B" />} label="Phone" value={user.emergencyContact.phone} />
                    </SectionCard>
                </Animated.View>
            )}

            {/* Current Assignment */}
            {user.dutyStation && (
                <Animated.View entering={FadeInUp.delay(300).duration(300)}>
                    <SectionCard title="Current Assignment" icon={<Briefcase size={20} color="#60A5FA" />}>
                        <View className="flex-row items-start">
                            <View className="w-11 h-11 bg-blue-50 dark:bg-[#0F2847] justify-center items-center mr-3">
                                <Ship size={22} className="text-blue-600 dark:text-blue-400" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 dark:text-slate-100 text-base font-bold">{user.dutyStation.name}</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-[13px] mt-0.5">{user.dutyStation.address}</Text>
                                {user.uic && <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">UIC: {user.uic}</Text>}
                            </View>
                        </View>
                    </SectionCard>
                </Animated.View>
            )}

            {/* Dependents */}
            {user.dependentDetails && user.dependentDetails.length > 0 && (
                <Animated.View entering={FadeInUp.delay(400).duration(300)}>
                    <SectionCard title="Dependents" icon={<Users size={20} color="#60A5FA" />}>
                        {user.dependentDetails.map((dep, idx) => (
                            <View key={dep.id} className={`flex-row items-center py-2.5 ${idx < user.dependentDetails!.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
                                <View className="w-9 h-9 bg-blue-50 dark:bg-[#0F2847] justify-center items-center mr-3">
                                    <Text className="text-[14px] font-bold text-blue-600 dark:text-blue-400">
                                        {getInitials(dep.name)}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-900 dark:text-slate-100 text-[15px] font-semibold">{dep.name}</Text>
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                        {dep.relationship.charAt(0).toUpperCase() + dep.relationship.slice(1)} · DOB: {formatDate(dep.dob)}
                                    </Text>
                                </View>
                                {dep.efmpEnrolled && (
                                    <View className="bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5">
                                        <Text className="text-amber-600 dark:text-amber-500 text-[10px] font-bold">EFMP</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </SectionCard>
                </Animated.View>
            )}
        </View>
    ), [user]);

    return (
        <ScreenGradient>
            <CollapsibleScaffold
                statusBarShimBackgroundColor={colorScheme === 'dark' ? Colors.gradient.dark[0] : Colors.gradient.light[0]}
                topBar={
                    <View className="bg-surface-container-lowest dark:bg-background border-b border-outline-variant dark:border-surface-border">
                        <ScreenHeader title="" subtitle="" showWebMenu={true} withSafeArea={Platform.OS !== 'web'} />
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {({
                    onScroll, onScrollBeginDrag, onScrollEndDrag,
                    onLayout, onContentSizeChange,
                    scrollEnabled, scrollEventThrottle, contentContainerStyle,
                }) => (
                    <Animated.ScrollView
                        ref={scrollRef}
                        onScroll={onScroll}
                        onScrollBeginDrag={onScrollBeginDrag}
                        onScrollEndDrag={onScrollEndDrag}
                        onLayout={onLayout}
                        onContentSizeChange={onContentSizeChange}
                        scrollEnabled={scrollEnabled}
                        scrollEventThrottle={scrollEventThrottle}
                        contentContainerStyle={contentContainerStyle}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* ── Cover Banner ─────────────────────────────────── */}
                        <View className="h-[95px] relative overflow-hidden bg-slate-200 dark:bg-slate-800">
                            <View className="absolute bottom-0 left-0 right-0 h-[20px] bg-white dark:bg-slate-900" />
                            <View className="absolute bottom-0 left-0 right-0 h-[3px] bg-navyGold" />
                        </View>

                        {/* ── Avatar ───────────────────────────────────────── */}
                        <View className="px-4" style={{ position: 'relative', zIndex: 20, elevation: 10 }}>
                            <Animated.View entering={FadeIn.duration(300)} className="items-start" style={{ marginTop: -50 }}>
                                <View className="w-[100px] h-[100px] rounded-full justify-center items-center bg-white dark:bg-slate-900 border-[2px] border-navyBlue dark:border-blue-400 shadow-apple-md">
                                    <Text className="text-navyGold text-[32px] font-extrabold tracking-widest">
                                        {initials}
                                    </Text>
                                </View>
                            </Animated.View>
                        </View>

                        {/* ── Identity Header ──────────────────────────────── */}
                        <View className="px-4 mt-3">
                            <View className="flex-row items-center gap-1.5">
                                <Text className="text-slate-900 dark:text-white text-[24px] font-extrabold tracking-tight">
                                    {user.displayName}
                                </Text>
                                <VerifiedBadge size={22} />
                            </View>
                            <Text className="text-slate-600 dark:text-slate-300 text-[15px] font-medium mt-[3px]">
                                {user.rank} · {ratingFull || user.rating}
                            </Text>
                            {user.dutyStation && (
                                <View className="flex-row items-center mt-1.5">
                                    <MapPin size={14} color="#64748B" />
                                    <Text className="text-slate-500 dark:text-slate-400 text-[14px] ml-1 flex-1" numberOfLines={1}>
                                        {user.dutyStation.name}
                                    </Text>
                                    {stationBadge && (
                                        <View className={`px-2 py-0.5 ml-2 ${stationBadge.containerClass}`}>
                                            <Text className={`text-[10px] font-extrabold tracking-wider ${stationBadge.textClass}`}>
                                                {stationBadge.label}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                            <View className="flex-row items-center mt-2">
                                <Text className="text-blue-600 dark:text-blue-300 text-[13px] font-semibold">
                                    {user.dependents ?? 0} dependents
                                </Text>
                                <Text className="text-slate-400 dark:text-slate-500 mx-2">·</Text>
                                <Text className="text-blue-600 dark:text-blue-300 text-[13px] font-semibold">
                                    {user.housing?.type?.replace('_', ' ') ?? 'N/A'} housing
                                </Text>
                            </View>
                        </View>

                        {/* ── Horizontal Scrollable Controls ────────────────── */}
                        <View className="flex-row items-center">
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}
                            >
                                <ControlPill label="Professional" isActive={activeTab === 'professional'} onPress={handleProfessionalPress} />
                                <ControlPill label="Personal" isActive={activeTab === 'personal'} onPress={handlePersonalPress} />
                                <ControlPill label="Timeline" isActive={activeTab === 'timeline'} onPress={handleTimelinePress} />
                                <ControlPill label="Preferences" isActive={false} onPress={handlePreferencesPress} disabled />
                                <ControlPill label="Surveys" isActive={false} onPress={handleSurveysPress} disabled />
                            </ScrollView>
                        </View>

                        {/* ── Divider ─────────────────────────────────────── */}
                        <View className="h-[1px] bg-slate-200 dark:bg-slate-800 mx-5 mb-4" />

                        {/* ── Tab Content ──────────────────────────────────── */}
                        {activeTab === 'timeline'
                            ? <ProfileTimelineTab />
                            : activeTab === 'professional'
                                ? renderProfessionalTab
                                : renderPersonalTab
                        }

                    </Animated.ScrollView>
                )}
            </CollapsibleScaffold>

            <PCSDevPanel />
        </ScreenGradient>
    );
}
