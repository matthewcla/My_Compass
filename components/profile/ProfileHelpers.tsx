import { LockKeyhole } from 'lucide-react-native';
import React, { memo } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

// ─── Section Card ────────────────────────────────────────
interface SectionCardProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

export const SectionCard = memo(function SectionCard({ title, icon, children }: SectionCardProps) {
    return (
        <View className="bg-white dark:bg-slate-800 border-t border-navyGold p-5 mb-3" style={{
            shadowColor: '#C9A227', shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
        }}>
            <View className="flex-row items-center mb-3.5">
                {icon}
                <Text className="text-slate-900 dark:text-slate-100 font-bold text-[17px] ml-2.5">
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
}

export const InfoRow = memo(function InfoRow({ icon, label, value }: InfoRowProps) {
    return (
        <View className="flex-row items-start mb-2.5">
            <View className="w-7 items-center mt-[1px]">{icon}</View>
            <View className="flex-1 ml-2">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-[1px]">{label}</Text>
                <Text className="text-slate-800 dark:text-slate-200 text-[15px] font-medium">{value}</Text>
            </View>
        </View>
    );
});

// ─── Milestone Row ───────────────────────────────────────
interface MilestoneRowProps {
    label: string;
    date: string;
    daysLeft: number | null;
    accentColor: string;
    isLast?: boolean;
}

export const MilestoneRow = memo(function MilestoneRow({ label, date, daysLeft, accentColor, isLast }: MilestoneRowProps) {
    return (
        <View className={`flex-row items-center justify-between py-3 ${isLast ? '' : 'border-b border-slate-200 dark:border-slate-700'}`}>
            <View className="flex-1">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    {label}
                </Text>
                <Text className="text-slate-800 dark:text-slate-200 text-base font-semibold mt-0.5" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{date}</Text>
            </View>
            {daysLeft !== null && daysLeft > 0 && (
                <View className="px-2.5 py-1" style={{ backgroundColor: accentColor + '18' }}>
                    <Text className="text-xs font-bold" style={{ color: accentColor, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{daysLeft}d</Text>
                </View>
            )}
        </View>
    );
});

// ─── Timeline Entry ──────────────────────────────────────
function getStationTypeBadge(type?: string) {
    switch (type) {
        case 'AFLOAT': return { label: 'AFLOAT', bgClass: 'bg-slate-800 dark:bg-slate-700', textClass: 'text-slate-50' };
        case 'OCONUS': return { label: 'OCONUS', bgClass: 'bg-slate-600 dark:bg-slate-500', textClass: 'text-slate-100' };
        case 'CONUS': return { label: 'CONUS', bgClass: 'bg-slate-400 dark:bg-slate-300', textClass: 'text-slate-900' };
        default: return null;
    }
}

interface TimelineEntryProps {
    title: string;
    subtitle: string;
    dates: string;
    type: 'AFLOAT' | 'CONUS' | 'OCONUS';
    isLast?: boolean;
    isCurrent?: boolean;
}

export const TimelineEntry = memo(function TimelineEntry({ title, subtitle, dates, type, isLast, isCurrent }: TimelineEntryProps) {
    const badge = getStationTypeBadge(type);
    return (
        <View className={`flex-row ${isLast ? 'mb-0' : 'mb-1'}`}>
            <View className="w-7 items-center">
                <View className={`mt-1 ${isCurrent ? 'w-3 h-3 bg-navyGold border-2 border-navyGold/25' : 'w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400'}`} />
                {!isLast && (
                    <View className="w-[2px] flex-1 bg-slate-200 dark:bg-slate-700 mt-0.5" />
                )}
            </View>
            <View className={`flex-1 ml-2 ${isLast ? 'pb-0' : 'pb-4'}`}>
                <View className="flex-row items-center gap-2">
                    <Text className={`text-slate-900 dark:text-slate-100 text-[15px] flex-1 ${isCurrent ? 'font-bold' : 'font-semibold'}`}>
                        {title}
                    </Text>
                    {badge && (
                        <View className={`px-1.5 py-0.5 ${badge.bgClass}`}>
                            <Text className={`text-[9px] font-extrabold tracking-widest ${badge.textClass}`}>{badge.label}</Text>
                        </View>
                    )}
                </View>
                <Text className="text-slate-500 dark:text-slate-400 text-[13px] mt-[1px]">{subtitle}</Text>
                <Text className="text-slate-600 dark:text-slate-500 text-xs mt-0.5" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{dates}</Text>
            </View>
        </View>
    );
});

// ─── Control Pill ────────────────────────────────────────
interface ControlPillProps {
    label: string;
    isActive: boolean;
    onPress: () => void;
    disabled?: boolean;
}

export const ControlPill = memo(function ControlPill({ label, isActive, onPress, disabled }: ControlPillProps) {
    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            className={`px-5 py-3 mr-2 flex-row items-center gap-1.5 border-[1.5px] ${
                isActive 
                    ? 'bg-slate-100 dark:bg-white/10 border-navyGold' 
                    : 'bg-transparent border-slate-200 dark:border-slate-700'
            }`}
            style={isActive ? {
                shadowColor: '#C9A227', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
            } : {}}
        >
            <Text className={`text-[13px] ${isActive ? 'text-navyGold font-bold' : 'text-slate-500 dark:text-slate-400 font-semibold'}`}>
                {label}
            </Text>
            {disabled && <LockKeyhole size={12} color="#64748B" />}
        </Pressable>
    );
});
