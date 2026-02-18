import { LockKeyhole } from 'lucide-react-native';
import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

// ─── Section Card ────────────────────────────────────────
interface SectionCardProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isDark: boolean;
}

export const SectionCard = memo(function SectionCard({ title, icon, children, isDark }: SectionCardProps) {
    return (
        <View style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderColor: isDark ? '#334155' : '#E2E8F0', borderWidth: 1,
            borderRadius: 16, padding: 20, marginBottom: 12,
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                {icon}
                <Text style={{ color: isDark ? '#F1F5F9' : '#0F172A', fontWeight: '700', fontSize: 17, marginLeft: 10 }}>
                    {title}
                </Text>
            </View>
            {children}
        </View>
    );
});

// ─── Info Row ────────────────────────────────────────────
interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    isDark: boolean;
}

export const InfoRow = memo(function InfoRow({ icon, label, value, isDark }: InfoRowProps) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
            <View style={{ width: 28, alignItems: 'center', marginTop: 1 }}>{icon}</View>
            <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: '500', marginBottom: 1 }}>{label}</Text>
                <Text style={{ color: isDark ? '#E2E8F0' : '#1E293B', fontSize: 15, fontWeight: '500' }}>{value}</Text>
            </View>
        </View>
    );
});

// ─── Milestone Row ───────────────────────────────────────
interface MilestoneRowProps {
    label: string;
    date: string;
    daysLeft: number | null;
    isDark: boolean;
    accentColor: string;
    isLast?: boolean;
}

export const MilestoneRow = memo(function MilestoneRow({ label, date, daysLeft, isDark, accentColor, isLast }: MilestoneRowProps) {
    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingVertical: 12, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: isDark ? '#334155' : '#F1F5F9',
        }}>
            <View style={{ flex: 1 }}>
                <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    {label}
                </Text>
                <Text style={{ color: isDark ? '#E2E8F0' : '#1E293B', fontSize: 16, fontWeight: '600', marginTop: 2 }}>{date}</Text>
            </View>
            {daysLeft !== null && daysLeft > 0 && (
                <View style={{ backgroundColor: accentColor + '18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: accentColor, fontSize: 12, fontWeight: '700' }}>{daysLeft}d</Text>
                </View>
            )}
        </View>
    );
});

// ─── Timeline Entry ──────────────────────────────────────
function getStationTypeBadge(type?: string) {
    switch (type) {
        case 'AFLOAT': return { label: 'AFLOAT', bg: '#1E40AF', text: '#DBEAFE' };
        case 'OCONUS': return { label: 'OCONUS', bg: '#065F46', text: '#D1FAE5' };
        case 'CONUS': return { label: 'CONUS', bg: '#92400E', text: '#FEF3C7' };
        default: return null;
    }
}

interface TimelineEntryProps {
    title: string;
    subtitle: string;
    dates: string;
    type: 'AFLOAT' | 'CONUS' | 'OCONUS';
    isDark: boolean;
    isLast?: boolean;
    isCurrent?: boolean;
}

export const TimelineEntry = memo(function TimelineEntry({ title, subtitle, dates, type, isDark, isLast, isCurrent }: TimelineEntryProps) {
    const badge = getStationTypeBadge(type);
    return (
        <View style={{ flexDirection: 'row', marginBottom: isLast ? 0 : 4 }}>
            <View style={{ width: 28, alignItems: 'center' }}>
                <View style={{
                    width: isCurrent ? 12 : 10, height: isCurrent ? 12 : 10, borderRadius: 6,
                    backgroundColor: isCurrent ? '#C9A227' : (isDark ? '#60A5FA' : '#2563EB'),
                    marginTop: 4,
                    ...(isCurrent ? { borderWidth: 2, borderColor: '#C9A22740' } : {}),
                }} />
                {!isLast && (
                    <View style={{ width: 2, flex: 1, backgroundColor: isDark ? '#334155' : '#E2E8F0', marginTop: 2 }} />
                )}
            </View>
            <View style={{ flex: 1, paddingBottom: isLast ? 0 : 16, marginLeft: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 15, fontWeight: isCurrent ? '700' : '600', flex: 1 }}>
                        {title}
                    </Text>
                    {badge && (
                        <View style={{ backgroundColor: badge.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ color: badge.text, fontSize: 9, fontWeight: '800', letterSpacing: 0.3 }}>{badge.label}</Text>
                        </View>
                    )}
                </View>
                <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 13, marginTop: 1 }}>{subtitle}</Text>
                <Text style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 12, marginTop: 2 }}>{dates}</Text>
            </View>
        </View>
    );
});

// ─── Control Pill ────────────────────────────────────────
interface ControlPillProps {
    label: string;
    isActive: boolean;
    onPress: () => void;
    isDark: boolean;
    disabled?: boolean;
}

export const ControlPill = memo(function ControlPill({ label, isActive, onPress, isDark, disabled }: ControlPillProps) {
    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            style={{
                paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, marginRight: 8,
                flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: isActive
                    ? (isDark ? '#1E3A5F' : '#FFFFFF')
                    : (isDark ? '#0F172A80' : '#F1F5F980'),
                borderWidth: 1.5,
                borderColor: isActive ? '#C9A227' : (isDark ? '#334155' : '#E2E8F0'),
                ...(isActive ? {
                    shadowColor: '#C9A227', shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15, shadowRadius: 3, elevation: 2,
                } : {}),
            }}
        >
            <Text style={{
                color: isActive ? '#C9A227' : (isDark ? '#94A3B8' : '#64748B'),
                fontSize: 13, fontWeight: isActive ? '700' : '600',
            }}>
                {label}
            </Text>
            {disabled && <LockKeyhole size={12} color={isDark ? '#64748B' : '#94A3B8'} />}
        </Pressable>
    );
});
