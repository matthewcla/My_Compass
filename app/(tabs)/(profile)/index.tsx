import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { PCSDevPanel } from '@/components/pcs/PCSDevPanel';
import { ControlPill, InfoRow, MilestoneRow, SectionCard, TimelineEntry } from '@/components/profile/ProfileHelpers';
import { ScreenGradient } from '@/components/ScreenGradient';
import { useCurrentProfile, useDemoStore } from '@/store/useDemoStore';
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
        case 'AFLOAT': return { label: 'AFLOAT', bg: '#1E40AF', text: '#DBEAFE' };
        case 'OCONUS': return { label: 'OCONUS', bg: '#065F46', text: '#D1FAE5' };
        case 'CONUS': return { label: 'CONUS', bg: '#92400E', text: '#FEF3C7' };
        default: return null;
    }
}

// ═══════════════════════════════════════════════════════════
// PROFILE SCREEN
// ═══════════════════════════════════════════════════════════
export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const user = useCurrentProfile();
    const selectedUser = useDemoStore((s) => s.selectedUser);
    const isDemoMode = useDemoStore((s) => s.isDemoMode);
    const [activeTab, setActiveTab] = useState<'professional' | 'personal'>('professional');
    const scrollRef = useRef<any>(null);

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
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 16 }}>
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
    const renderProfessionalTab = useMemo(() => (
        <View style={{ paddingHorizontal: 16 }}>
            {/* Assignment History (current billet merged as first entry) */}
            <Animated.View entering={FadeInUp.delay(100).duration(300)}>
                <SectionCard
                    title="Assignment History"
                    icon={<Clock size={20} color={isDark ? '#60A5FA' : '#2563EB'} />}
                    isDark={isDark}
                >
                    {assignmentHistory.map((entry, idx) => (
                        <TimelineEntry
                            key={idx}
                            title={entry.title}
                            subtitle={entry.subtitle}
                            dates={entry.dates}
                            type={entry.type}
                            isDark={isDark}
                            isLast={idx === assignmentHistory.length - 1}
                            isCurrent={entry.current}
                        />
                    ))}
                </SectionCard>
            </Animated.View>

            {/* Certifications & NECs (merged NECs + COOL) */}
            <Animated.View entering={FadeInUp.delay(200).duration(300)}>
                <SectionCard
                    title="Certifications & NECs"
                    icon={<Award size={20} color={isDark ? '#6EE7B7' : '#059669'} />}
                    isDark={isDark}
                >
                    {/* NECs */}
                    <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                        Navy Enlisted Classifications
                    </Text>
                    {necs.map((nec) => (
                        <View key={nec.code} style={{
                            flexDirection: 'row', alignItems: 'center', marginBottom: 8,
                            backgroundColor: isDark ? '#0F2847' : '#F0F9FF', padding: 10, borderRadius: 10,
                        }}>
                            <View style={{
                                backgroundColor: isDark ? '#1E3A5F' : '#DBEAFE',
                                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 10,
                            }}>
                                <Text style={{ color: isDark ? '#60A5FA' : '#2563EB', fontSize: 12, fontWeight: '800' }}>{nec.code}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: isDark ? '#E2E8F0' : '#1E293B', fontSize: 13, fontWeight: '500' }}>{nec.name}</Text>
                            </View>
                            <Text style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 11 }}>{nec.earned}</Text>
                        </View>
                    ))}

                    {/* Qualifications */}
                    <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 14, marginBottom: 8 }}>
                        Warfare & Watch Qualifications
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {qualifications.map((qual) => (
                            <View key={qual} style={{
                                backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
                                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                            }}>
                                <Text style={{ color: isDark ? '#6EE7B7' : '#065F46', fontSize: 12, fontWeight: '600' }}>{qual}</Text>
                            </View>
                        ))}
                    </View>

                    {/* COOL Credentials */}
                    <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 14, marginBottom: 8 }}>
                        COOL Civilian Credentials
                    </Text>
                    {coolCredentials.map((cred) => (
                        <View key={cred.name} style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            paddingVertical: 8,
                        }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: isDark ? '#E2E8F0' : '#1E293B', fontSize: 14, fontWeight: '600' }}>{cred.name}</Text>
                                {cred.date && (
                                    <Text style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 12, marginTop: 1 }}>Earned {cred.date}</Text>
                                )}
                            </View>
                            <View style={{
                                backgroundColor: cred.status === 'Earned' ? (isDark ? '#064E3B' : '#ECFDF5') : (isDark ? '#1E3A5F' : '#EFF6FF'),
                                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                            }}>
                                <Text style={{
                                    color: cred.status === 'Earned' ? (isDark ? '#6EE7B7' : '#065F46') : (isDark ? '#60A5FA' : '#2563EB'),
                                    fontSize: 11, fontWeight: '700',
                                }}>{cred.status}</Text>
                            </View>
                        </View>
                    ))}
                </SectionCard>
            </Animated.View>

            {/* Sea/Shore Rotation */}
            <Animated.View entering={FadeInUp.delay(300).duration(300)}>
                <SectionCard
                    title="Sea/Shore Rotation"
                    icon={<Ship size={20} color={isDark ? '#93C5FD' : '#1E40AF'} />}
                    isDark={isDark}
                >
                    {seaShoreRotation.map((rot, idx) => (
                        <View key={idx} style={{
                            flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
                            borderBottomWidth: idx < seaShoreRotation.length - 1 ? 1 : 0,
                            borderBottomColor: isDark ? '#334155' : '#F1F5F9',
                        }}>
                            <View style={{
                                width: 54,
                                backgroundColor: rot.period === 'Sea' ? (isDark ? '#1E40AF' : '#DBEAFE') : (isDark ? '#065F46' : '#ECFDF5'),
                                paddingVertical: 4, borderRadius: 6, alignItems: 'center', marginRight: 12,
                            }}>
                                <Text style={{
                                    color: rot.period === 'Sea' ? (isDark ? '#93C5FD' : '#1E40AF') : (isDark ? '#6EE7B7' : '#065F46'),
                                    fontSize: 11, fontWeight: '800',
                                }}>{rot.period.toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: isDark ? '#E2E8F0' : '#1E293B', fontSize: 14, fontWeight: '500' }}>{rot.station}</Text>
                                <Text style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 12 }}>{rot.dates}</Text>
                            </View>
                            <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: '600' }}>{rot.months}mo</Text>
                        </View>
                    ))}
                </SectionCard>
            </Animated.View>

            {/* Training Record */}
            <Animated.View entering={FadeInUp.delay(400).duration(300)}>
                <SectionCard
                    title="Training Record"
                    icon={<BookOpen size={20} color={isDark ? '#FCD34D' : '#B45309'} />}
                    isDark={isDark}
                >
                    {trainingRecord.map((t, idx) => (
                        <View key={idx} style={{
                            flexDirection: 'row', alignItems: 'flex-start', marginBottom: idx < trainingRecord.length - 1 ? 12 : 0,
                        }}>
                            <View style={{
                                width: 60,
                                backgroundColor: t.type === 'A-School' ? (isDark ? '#92400E' : '#FEF3C7') : (isDark ? '#1E3A5F' : '#EFF6FF'),
                                paddingVertical: 3, borderRadius: 6, alignItems: 'center', marginRight: 10, marginTop: 2,
                            }}>
                                <Text style={{
                                    color: t.type === 'A-School' ? (isDark ? '#FCD34D' : '#92400E') : (isDark ? '#60A5FA' : '#2563EB'),
                                    fontSize: 10, fontWeight: '800',
                                }}>{t.type.toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: isDark ? '#E2E8F0' : '#1E293B', fontSize: 14, fontWeight: '500' }}>{t.school}</Text>
                                <Text style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 12 }}>{t.location} · {t.date}</Text>
                            </View>
                        </View>
                    ))}
                </SectionCard>
            </Animated.View>

            {/* Service Milestones & Validation (merged) */}
            <Animated.View entering={FadeInUp.delay(500).duration(300)}>
                <SectionCard
                    title="Service Milestones"
                    icon={<Calendar size={20} color={isDark ? '#F59E0B' : '#D97706'} />}
                    isDark={isDark}
                >
                    <MilestoneRow label="Projected Rotation Date (PRD)" date={formatDate(user.prd)} daysLeft={prdDays} isDark={isDark} accentColor="#F59E0B" />
                    <MilestoneRow label="Soft EAOS (SEAOS)" date={formatDate(user.seaos)} daysLeft={seaosDays} isDark={isDark} accentColor="#3B82F6" />
                    <MilestoneRow label="End of Active Obligated Service" date={formatDate(user.eaos)} daysLeft={eaosDays} isDark={isDark} accentColor="#EF4444" isLast />

                    {/* Validation status inline */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 10,
                        marginTop: 14, paddingTop: 12,
                        borderTopWidth: 1, borderTopColor: isDark ? '#334155' : '#F1F5F9',
                    }}>
                        <CheckCircle size={14} color={isDark ? '#6EE7B7' : '#059669'} />
                        <View style={{
                            backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
                            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                        }}>
                            <Text style={{ color: isDark ? '#6EE7B7' : '#065F46', fontSize: 11, fontWeight: '700' }}>
                                {(user.syncStatus ?? 'unknown').toUpperCase()}
                            </Text>
                        </View>
                        <Text style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 12 }}>
                            Last sync {formatDate(user.lastSyncTimestamp)}
                        </Text>
                    </View>
                </SectionCard>
            </Animated.View>

            {/* Assignment Preferences — quick link */}
            <Animated.View entering={FadeInUp.delay(600).duration(300)}>
                <Pressable
                    onPress={() => router.push('/(profile)/preferences' as any)}
                    style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#E2E8F0', borderWidth: 1,
                        borderRadius: 14, padding: 16, marginBottom: 12,
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Star size={18} color="#C9A227" />
                        <View>
                            <Text style={{ color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 15, fontWeight: '600' }}>
                                Assignment Preferences
                            </Text>
                            <Text style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 12, marginTop: 1 }}>
                                {user.preferences?.regions?.join(', ') || 'None set'} · {user.preferences?.dutyTypes?.join(', ') || 'None'}
                            </Text>
                        </View>
                    </View>
                    <ChevronRight size={18} color={isDark ? '#475569' : '#94A3B8'} />
                </Pressable>
            </Animated.View>
        </View>
    ), [user, isDark, assignmentHistory, necs, qualifications, coolCredentials, seaShoreRotation, trainingRecord, prdDays, seaosDays, eaosDays]);

    // ─── Personal Tab ────────────────────────────────────
    const renderPersonalTab = useMemo(() => (
        <View style={{ paddingHorizontal: 16 }}>
            {/* About */}
            <Animated.View entering={FadeInUp.delay(100).duration(300)}>
                <SectionCard title="About" icon={<User size={20} color={isDark ? '#60A5FA' : '#2563EB'} />} isDark={isDark}>
                    {user.email && <InfoRow icon={<Mail size={16} color={isDark ? '#64748B' : '#94A3B8'} />} label="Email" value={user.email} isDark={isDark} />}
                    {user.phone && <InfoRow icon={<Phone size={16} color={isDark ? '#64748B' : '#94A3B8'} />} label="Phone" value={user.phone} isDark={isDark} />}
                    <InfoRow
                        icon={<Heart size={16} color={isDark ? '#64748B' : '#94A3B8'} />}
                        label="Marital Status"
                        value={(user.maritalStatus ?? 'N/A').charAt(0).toUpperCase() + (user.maritalStatus ?? 'n/a').slice(1)}
                        isDark={isDark}
                    />
                    <InfoRow
                        icon={<Home size={16} color={isDark ? '#64748B' : '#94A3B8'} />}
                        label="Housing"
                        value={(user.housing?.type ?? 'N/A').replace('_', '-').replace(/\b\w/g, (c) => c.toUpperCase())}
                        isDark={isDark}
                    />
                    {user.bloodType && <InfoRow icon={<Shield size={16} color={isDark ? '#64748B' : '#94A3B8'} />} label="Blood Type" value={user.bloodType} isDark={isDark} />}
                </SectionCard>
            </Animated.View>

            {/* Emergency Contact */}
            {user.emergencyContact && (
                <Animated.View entering={FadeInUp.delay(200).duration(300)}>
                    <SectionCard title="Emergency Contact" icon={<Phone size={20} color={isDark ? '#EF4444' : '#DC2626'} />} isDark={isDark}>
                        <InfoRow icon={<User size={16} color={isDark ? '#64748B' : '#94A3B8'} />} label={user.emergencyContact.relationship} value={user.emergencyContact.name} isDark={isDark} />
                        <InfoRow icon={<Phone size={16} color={isDark ? '#64748B' : '#94A3B8'} />} label="Phone" value={user.emergencyContact.phone} isDark={isDark} />
                    </SectionCard>
                </Animated.View>
            )}

            {/* Current Assignment */}
            {user.dutyStation && (
                <Animated.View entering={FadeInUp.delay(300).duration(300)}>
                    <SectionCard title="Current Assignment" icon={<Briefcase size={20} color={isDark ? '#60A5FA' : '#2563EB'} />} isDark={isDark}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            <View style={{
                                width: 44, height: 44, borderRadius: 8,
                                backgroundColor: isDark ? '#0F2847' : '#EFF6FF',
                                justifyContent: 'center', alignItems: 'center', marginRight: 12,
                            }}>
                                <Ship size={22} color={isDark ? '#60A5FA' : '#2563EB'} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 16, fontWeight: '700' }}>{user.dutyStation.name}</Text>
                                <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 13, marginTop: 2 }}>{user.dutyStation.address}</Text>
                                {user.uic && <Text style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 12, marginTop: 4 }}>UIC: {user.uic}</Text>}
                            </View>
                        </View>
                    </SectionCard>
                </Animated.View>
            )}

            {/* Dependents */}
            {user.dependentDetails && user.dependentDetails.length > 0 && (
                <Animated.View entering={FadeInUp.delay(400).duration(300)}>
                    <SectionCard title="Dependents" icon={<Users size={20} color={isDark ? '#60A5FA' : '#2563EB'} />} isDark={isDark}>
                        {user.dependentDetails.map((dep, idx) => (
                            <View key={dep.id} style={{
                                flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
                                borderBottomWidth: idx < user.dependentDetails!.length - 1 ? 1 : 0,
                                borderBottomColor: isDark ? '#334155' : '#F1F5F9',
                            }}>
                                <View style={{
                                    width: 36, height: 36, borderRadius: 18,
                                    backgroundColor: isDark ? '#0F2847' : '#EFF6FF',
                                    justifyContent: 'center', alignItems: 'center', marginRight: 12,
                                }}>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#60A5FA' : '#2563EB' }}>
                                        {getInitials(dep.name)}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 15, fontWeight: '600' }}>{dep.name}</Text>
                                    <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12, marginTop: 1 }}>
                                        {dep.relationship.charAt(0).toUpperCase() + dep.relationship.slice(1)} · DOB: {formatDate(dep.dob)}
                                    </Text>
                                </View>
                                {dep.efmpEnrolled && (
                                    <View style={{
                                        backgroundColor: isDark ? 'rgba(234, 179, 8, 0.15)' : '#FEF3C7',
                                        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                                    }}>
                                        <Text style={{ color: '#D97706', fontSize: 10, fontWeight: '700' }}>EFMP</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </SectionCard>
                </Animated.View>
            )}
        </View>
    ), [user, isDark]);

    return (
        <ScreenGradient>
            <CollapsibleScaffold
                statusBarShimBackgroundColor={isDark ? '#0f172a' : '#f8fafc'}
                topBar={<View />}
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
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
                        <LinearGradient
                            colors={isDark
                                ? ['#0A1628', '#1E3A5F', '#0F2847']
                                : ['#0A1628', '#1E3A5F', '#2563EB']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ height: 140, position: 'relative' }}
                        >
                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: 'rgba(0,0,0,0.15)' }} />
                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#C9A227' }} />
                        </LinearGradient>

                        {/* ── Avatar ───────────────────────────────────────── */}
                        <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'flex-start', paddingHorizontal: 20, marginTop: -50 }}>
                            <View style={{
                                width: 100, height: 100, borderRadius: 50,
                                backgroundColor: isDark ? '#1E3A5F' : '#0F2847',
                                justifyContent: 'center', alignItems: 'center',
                                borderWidth: 4, borderColor: isDark ? '#0F172A' : '#F8FAFC',
                                shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
                            }}>
                                <Text style={{ color: '#C9A227', fontSize: 32, fontWeight: '800', letterSpacing: 1 }}>
                                    {initials}
                                </Text>
                            </View>
                        </Animated.View>

                        {/* ── Identity Header ──────────────────────────────── */}
                        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
                            <Text style={{ color: isDark ? '#FFFFFF' : '#0F172A', fontSize: 24, fontWeight: '800', letterSpacing: -0.3 }}>
                                {user.displayName}
                            </Text>
                            <Text style={{ color: isDark ? '#CBD5E1' : '#475569', fontSize: 15, fontWeight: '500', marginTop: 3 }}>
                                {user.rank} · {ratingFull || user.rating}
                            </Text>
                            {user.dutyStation && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                    <MapPin size={14} color={isDark ? '#64748B' : '#94A3B8'} />
                                    <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 14, marginLeft: 4, flex: 1 }} numberOfLines={1}>
                                        {user.dutyStation.name}
                                    </Text>
                                    {stationBadge && (
                                        <View style={{ backgroundColor: stationBadge.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 }}>
                                            <Text style={{ color: stationBadge.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
                                                {stationBadge.label}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                <Text style={{ color: isDark ? '#60A5FA' : '#2563EB', fontSize: 13, fontWeight: '600' }}>
                                    {user.dependents ?? 0} dependents
                                </Text>
                                <Text style={{ color: isDark ? '#475569' : '#CBD5E1', marginHorizontal: 8 }}>·</Text>
                                <Text style={{ color: isDark ? '#60A5FA' : '#2563EB', fontSize: 13, fontWeight: '600' }}>
                                    {user.housing?.type?.replace('_', ' ') ?? 'N/A'} housing
                                </Text>
                            </View>
                        </View>

                        {/* ── Horizontal Scrollable Controls ────────────────── */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}
                        >
                            <ControlPill label="Professional" isActive={activeTab === 'professional'} onPress={handleProfessionalPress} isDark={isDark} />
                            <ControlPill label="Personal" isActive={activeTab === 'personal'} onPress={handlePersonalPress} isDark={isDark} />
                            <ControlPill label="Preferences" isActive={false} onPress={handlePreferencesPress} isDark={isDark} disabled />
                            <ControlPill label="Surveys" isActive={false} onPress={handleSurveysPress} isDark={isDark} disabled />
                        </ScrollView>

                        {/* ── Divider ─────────────────────────────────────── */}
                        <View style={{ height: 1, backgroundColor: isDark ? '#1E293B' : '#E2E8F0', marginHorizontal: 20, marginBottom: 16 }} />

                        {/* ── Tab Content ──────────────────────────────────── */}
                        {activeTab === 'professional' ? renderProfessionalTab : renderPersonalTab}

                    </Animated.ScrollView>
                )}
            </CollapsibleScaffold>

            <PCSDevPanel />
        </ScreenGradient>
    );
}
