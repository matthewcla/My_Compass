import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { VerifiedBadge } from '@/components/icons/VerifiedBadge';
import { PCSDevPanel } from '@/components/pcs/PCSDevPanel';
import { ControlPill, InfoRow, MilestoneRow, SectionCard, TimelineEntry } from '@/components/profile/ProfileHelpers';
import { ProfileTimelineTab } from '@/components/profile/ProfileTimelineTab';
import { ScreenGradient } from '@/components/ScreenGradient';
import { DemoUser } from '@/constants/DemoData';
import { useCurrentProfile, useDemoStore } from '@/store/useDemoStore';
import { useProfileTimelineStore } from '@/store/useProfileTimelineStore';
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
    const user = useCurrentProfile();
    const selectedUser = useDemoStore((s) => s.selectedUser);
    const isDemoMode = useDemoStore((s) => s.isDemoMode);
    const [activeTab, setActiveTab] = useState<'professional' | 'personal' | 'timeline'>('professional');
    const loadTimeline = useProfileTimelineStore((s) => s.loadTimeline);
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
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#94A3B8', fontSize: 16 }}>
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
        <View style={{ paddingHorizontal: 16 }}>
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
                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                                Personal Awards
                            </Text>
                            <View style={{ backgroundColor: '#000000', borderWidth: 1, borderColor: '#334155', borderRadius: 0 }}>
                                {personalAwards.map((award, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: idx < personalAwards.length - 1 ? 1 : 0, borderBottomColor: '#334155' }}>
                                        <Award size={16} color="#C9A227" style={{ marginRight: 12 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '600' }}>{award.name}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                                            {award.count && award.count > 1 ? (
                                                <Text style={{ color: '#F59E0B', fontSize: 14, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>x{award.count}</Text>
                                            ) : null}
                                            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{formatDate(award.date)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {unitAwards.length > 0 && (
                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                                Unit Awards
                            </Text>
                            <View style={{ backgroundColor: '#000000', borderWidth: 1, borderColor: '#334155', borderRadius: 0 }}>
                                {unitAwards.map((award, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: idx < unitAwards.length - 1 ? 1 : 0, borderBottomColor: '#334155' }}>
                                        <Flag size={16} color="#60A5FA" style={{ marginRight: 12 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '600' }}>{award.name}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                                            {award.count && award.count > 1 ? (
                                                <Text style={{ color: '#60A5FA', fontSize: 14, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>x{award.count}</Text>
                                            ) : null}
                                            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{formatDate(award.date)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {campaignAwards.length > 0 && (
                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                                Campaign Medals
                            </Text>
                            <View style={{ backgroundColor: '#000000', borderWidth: 1, borderColor: '#334155', borderRadius: 0 }}>
                                {campaignAwards.map((award, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: idx < campaignAwards.length - 1 ? 1 : 0, borderBottomColor: '#334155' }}>
                                        <Shield size={16} color="#EF4444" style={{ marginRight: 12 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '600' }}>{award.name}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                                            {award.count && award.count > 1 ? (
                                                <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>x{award.count}</Text>
                                            ) : null}
                                            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{formatDate(award.date)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {serviceAwards.length > 0 && (
                        <View>
                            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                                Service Awards
                            </Text>
                            <View style={{ backgroundColor: '#000000', borderWidth: 1, borderColor: '#334155', borderRadius: 0 }}>
                                {serviceAwards.map((award, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: idx < serviceAwards.length - 1 ? 1 : 0, borderBottomColor: '#334155' }}>
                                        <Star size={16} color="#6EE7B7" style={{ marginRight: 12 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '600' }}>{award.name}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                                            {award.count && award.count > 1 ? (
                                                <Text style={{ color: '#6EE7B7', fontSize: 14, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>x{award.count}</Text>
                                            ) : null}
                                            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{formatDate(award.date)}</Text>
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
                    <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                        Navy Enlisted Classifications
                    </Text>
                    {necs.map((nec) => (
                        <View key={nec.code} style={{
                            flexDirection: 'row', alignItems: 'center', marginBottom: 8,
                            backgroundColor: '#1E293B', padding: 10, borderRadius: 0,
                        }}>
                            <View style={{
                                backgroundColor: '#334155',
                                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 0, marginRight: 10,
                            }}>
                                <Text style={{ color: '#F1F5F9', fontSize: 12, fontWeight: '800' }}>{nec.code}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: '500' }}>{nec.name}</Text>
                            </View>
                            <Text style={{ color: '#64748B', fontSize: 11 }}>{nec.earned}</Text>
                        </View>
                    ))}

                    {/* Qualifications */}
                    <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 14, marginBottom: 8 }}>
                        Warfare & Watch Qualifications
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {qualifications.map((qual) => (
                            <View key={qual} style={{
                                backgroundColor: '#1E293B',
                                borderWidth: 1, borderColor: '#334155',
                                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 0,
                            }}>
                                <Text style={{ color: '#F1F5F9', fontSize: 12, fontWeight: '600' }}>{qual}</Text>
                            </View>
                        ))}
                    </View>

                    {/* COOL Credentials */}
                    <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 14, marginBottom: 8 }}>
                        COOL Civilian Credentials
                    </Text>
                    {coolCredentials.map((cred) => (
                        <View key={cred.name} style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            paddingVertical: 8,
                        }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '600' }}>{cred.name}</Text>
                                {cred.date && (
                                    <Text style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>Earned {cred.date}</Text>
                                )}
                            </View>
                            <View style={{
                                backgroundColor: cred.status === 'Earned' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                borderWidth: cred.status === 'Earned' ? 0 : 1,
                                borderColor: cred.status === 'Earned' ? 'transparent' : '#334155',
                                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 0,
                            }}>
                                <Text style={{
                                    color: cred.status === 'Earned' ? '#F8FAFC' : '#94A3B8',
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
                    icon={<Ship size={20} color="#94A3B8" />}
                >
                    {seaShoreRotation.map((rot, idx) => (
                        <View key={idx} style={{
                            flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
                            borderBottomWidth: idx < seaShoreRotation.length - 1 ? 1 : 0,
                            borderBottomColor: '#334155',
                        }}>
                            <View style={{
                                width: 54,
                                backgroundColor: '#1E293B',
                                borderWidth: 1, borderColor: '#334155',
                                paddingVertical: 4, borderRadius: 0, alignItems: 'center', marginRight: 12,
                            }}>
                                <Text style={{
                                    color: '#E2E8F0',
                                    fontSize: 11, fontWeight: '800',
                                }}>{rot.period.toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '500' }}>{rot.station}</Text>
                                <Text style={{ color: '#64748B', fontSize: 12 }}>{rot.dates}</Text>
                            </View>
                            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>{rot.months}mo</Text>
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
                        <View key={idx} style={{
                            flexDirection: 'row', alignItems: 'flex-start', marginBottom: idx < trainingRecord.length - 1 ? 12 : 0,
                        }}>
                            <View style={{
                                width: 60,
                                backgroundColor: '#1E293B',
                                borderWidth: 1, borderColor: '#334155',
                                paddingVertical: 3, borderRadius: 0, alignItems: 'center', marginRight: 10, marginTop: 2,
                            }}>
                                <Text style={{
                                    color: '#CBD5E1',
                                    fontSize: 10, fontWeight: '800',
                                }}>{t.type.toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '500' }}>{t.school}</Text>
                                <Text style={{ color: '#64748B', fontSize: 12 }}>{t.location} · {t.date}</Text>
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
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 10,
                        marginTop: 14, paddingTop: 12,
                        borderTopWidth: 1, borderTopColor: '#334155',
                    }}>
                        <CheckCircle size={14} color="#6EE7B7" />
                        <View style={{
                            backgroundColor: '#064E3B',
                            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 0,
                        }}>
                            <Text style={{ color: '#6EE7B7', fontSize: 11, fontWeight: '700' }}>
                                {(user.syncStatus ?? 'unknown').toUpperCase()}
                            </Text>
                        </View>
                        <Text style={{ color: '#64748B', fontSize: 12 }}>
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
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        borderColor: 'rgba(51, 65, 85, 0.5)',
                        borderWidth: 1,
                        borderRadius: 0, padding: 16, marginBottom: 12,
                        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 2,
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Star size={18} color="#C9A227" />
                        <View>
                            <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '600' }}>
                                Assignment Preferences
                            </Text>
                            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>
                                {user.preferences?.regions?.join(', ') || 'None set'} · {user.preferences?.dutyTypes?.join(', ') || 'None'}
                            </Text>
                        </View>
                    </View>
                    <ChevronRight size={18} color="#475569" />
                </Pressable>
            </Animated.View>
        </View>
    );
    }, [user, assignmentHistory, necs, qualifications, coolCredentials, seaShoreRotation, trainingRecord, prdDays, seaosDays, eaosDays, demoUser?.awards]);

    // ─── Personal Tab ────────────────────────────────────
    const renderPersonalTab = useMemo(() => (
        <View style={{ paddingHorizontal: 16 }}>
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
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            <View style={{
                                width: 44, height: 44, borderRadius: 0,
                                backgroundColor: '#0F2847',
                                justifyContent: 'center', alignItems: 'center', marginRight: 12,
                            }}>
                                <Ship size={22} color="#60A5FA" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#F1F5F9', fontSize: 16, fontWeight: '700' }}>{user.dutyStation.name}</Text>
                                <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>{user.dutyStation.address}</Text>
                                {user.uic && <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>UIC: {user.uic}</Text>}
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
                            <View key={dep.id} style={{
                                flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
                                borderBottomWidth: idx < user.dependentDetails!.length - 1 ? 1 : 0,
                                borderBottomColor: '#334155',
                            }}>
                                <View style={{
                                    width: 36, height: 36, borderRadius: 0,
                                    backgroundColor: '#0F2847',
                                    justifyContent: 'center', alignItems: 'center', marginRight: 12,
                                }}>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#60A5FA' }}>
                                        {getInitials(dep.name)}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '600' }}>{dep.name}</Text>
                                    <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 1 }}>
                                        {dep.relationship.charAt(0).toUpperCase() + dep.relationship.slice(1)} · DOB: {formatDate(dep.dob)}
                                    </Text>
                                </View>
                                {dep.efmpEnrolled && (
                                    <View style={{
                                        backgroundColor: 'rgba(234, 179, 8, 0.15)',
                                        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 0,
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
    ), [user]);

    return (
        <ScreenGradient>
            <CollapsibleScaffold
                statusBarShimBackgroundColor={'#0f172a'}
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
                        <View style={{ height: 140, position: 'relative', backgroundColor: '#000000' }}>
                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: 'rgba(255,255,255,0.02)' }} />
                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#C9A227' }} />
                        </View>

                        {/* ── Avatar ───────────────────────────────────────── */}
                        <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'flex-start', paddingHorizontal: 20, marginTop: -50 }}>
                            <View style={{
                                width: 100, height: 100, borderRadius: 50,
                                backgroundColor: '#1E3A5F',
                                justifyContent: 'center', alignItems: 'center',
                                borderWidth: 4, borderColor: '#0F172A',
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
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: -0.3 }}>
                                    {user.displayName}
                                </Text>
                                <VerifiedBadge size={22} />
                            </View>
                            <Text style={{ color: '#CBD5E1', fontSize: 15, fontWeight: '500', marginTop: 3 }}>
                                {user.rank} · {ratingFull || user.rating}
                            </Text>
                            {user.dutyStation && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                    <MapPin size={14} color="#64748B" />
                                    <Text style={{ color: '#94A3B8', fontSize: 14, marginLeft: 4, flex: 1 }} numberOfLines={1}>
                                        {user.dutyStation.name}
                                    </Text>
                                    {stationBadge && (
                                        <View style={{ backgroundColor: stationBadge.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 0, marginLeft: 8 }}>
                                            <Text style={{ color: stationBadge.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
                                                {stationBadge.label}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                <Text style={{ color: '#60A5FA', fontSize: 13, fontWeight: '600' }}>
                                    {user.dependents ?? 0} dependents
                                </Text>
                                <Text style={{ color: '#475569', marginHorizontal: 8 }}>·</Text>
                                <Text style={{ color: '#60A5FA', fontSize: 13, fontWeight: '600' }}>
                                    {user.housing?.type?.replace('_', ' ') ?? 'N/A'} housing
                                </Text>
                            </View>
                        </View>

                        {/* ── Horizontal Scrollable Controls ────────────────── */}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
                            >
                                <ControlPill label="Professional" isActive={activeTab === 'professional'} onPress={handleProfessionalPress} />
                                <ControlPill label="Personal" isActive={activeTab === 'personal'} onPress={handlePersonalPress} />
                                <ControlPill label="Timeline" isActive={activeTab === 'timeline'} onPress={handleTimelinePress} />
                                <ControlPill label="Preferences" isActive={false} onPress={handlePreferencesPress} disabled />
                                <ControlPill label="Surveys" isActive={false} onPress={handleSurveysPress} disabled />
                            </ScrollView>
                        </View>

                        {/* ── Divider ─────────────────────────────────────── */}
                        <View style={{ height: 1, backgroundColor: '#1E293B', marginHorizontal: 20, marginBottom: 16 }} />

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
