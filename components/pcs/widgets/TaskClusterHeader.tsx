import { LinearGradient } from 'expo-linear-gradient';
import { ClipboardCheck, HeartPulse, MapPin, Truck, UserCheck } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

export type TaskClusterType = 'admin' | 'medical' | 'logistics' | 'operations' | 'checkin';

interface TaskClusterHeaderProps {
    type: TaskClusterType;
    title: string;
    isDark?: boolean;
}

export function TaskClusterHeader({ type, title, isDark = true }: TaskClusterHeaderProps) {
    const config = {
        admin: {
            colors: isDark ? ['rgba(79,70,229,0.15)', 'transparent'] : ['rgba(79,70,229,0.05)', 'transparent'],
            icon: <ClipboardCheck size={16} color={isDark ? '#818CF8' : '#4F46E5'} />,
            border: 'border-indigo-500/30 dark:border-indigo-400/20',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            text: 'text-indigo-700 dark:text-indigo-300'
        },
        medical: {
            colors: isDark ? ['rgba(20,184,166,0.15)', 'transparent'] : ['rgba(20,184,166,0.05)', 'transparent'],
            icon: <HeartPulse size={16} color={isDark ? '#2DD4BF' : '#0D9488'} />,
            border: 'border-teal-500/30 dark:border-teal-400/20',
            bg: 'bg-teal-50 dark:bg-teal-900/20',
            text: 'text-teal-700 dark:text-teal-300'
        },
        logistics: {
            colors: isDark ? ['rgba(245,158,11,0.15)', 'transparent'] : ['rgba(245,158,11,0.05)', 'transparent'],
            icon: <Truck size={16} color={isDark ? '#FBBF24' : '#D97706'} />,
            border: 'border-amber-500/30 dark:border-amber-400/20',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            text: 'text-amber-700 dark:text-amber-400'
        },
        operations: {
            colors: isDark ? ['rgba(59,130,246,0.15)', 'transparent'] : ['rgba(59,130,246,0.05)', 'transparent'],
            icon: <MapPin size={16} color={isDark ? '#60A5FA' : '#2563EB'} />,
            border: 'border-blue-500/30 dark:border-blue-400/20',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            text: 'text-blue-700 dark:text-blue-400'
        },
        checkin: {
            colors: isDark ? ['rgba(16,185,129,0.15)', 'transparent'] : ['rgba(16,185,129,0.05)', 'transparent'],
            icon: <UserCheck size={16} color={isDark ? '#34D399' : '#059669'} />,
            border: 'border-emerald-500/30 dark:border-emerald-400/20',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            text: 'text-emerald-700 dark:text-emerald-400'
        }
    };

    const style = config[type];

    return (
        <View className={`mt-4 mb-2 flex-row items-center overflow-hidden rounded-[12px] border ${style.border} ${style.bg}`}>
            <LinearGradient
                colors={style.colors as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View className="p-2.5 px-3 flex-row items-center gap-2.5">
                <View className="opacity-90">{style.icon}</View>
                <Text className={`text-[12px] font-[800] uppercase tracking-widest ${style.text}`}>
                    {title}
                </Text>
            </View>
        </View>
    );
}
