import { Link, Slot, usePathname } from 'expo-router';
import { Anchor, FileText, Map, User } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

const NAV_ITEMS = [
    {
        name: 'Assignments',
        href: '/assignments',
        icon: Anchor,
    },
    {
        name: 'Admin',
        href: '/admin',
        icon: FileText,
    },
    {
        name: 'PCS',
        href: '/pcs',
        icon: Map,
    },
    {
        name: 'Profile',
        href: '/profile',
        icon: User,
    },
];

export default function TabLayout() {
    const pathname = usePathname();

    return (
        <View className="flex-1 flex-row h-full" style={{ flex: 1, flexDirection: 'row', height: '100%' }}>
            {/* Sidebar */}
            <View className="w-64 border-r border-gray-200 bg-white pt-6" style={{ width: 256, borderRightWidth: 1, borderRightColor: '#E5E7EB', backgroundColor: 'white', paddingTop: 24 }}>
                <View className="px-6 mb-8">
                    <Text className="text-xl font-bold text-slate-900">My Compass</Text>
                </View>

                <View className="flex-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                            <Link key={item.href} href={item.href as any} asChild>
                                <Pressable
                                    className={`flex-row items-center px-6 py-3 space-x-3 mb-1 ${isActive
                                        ? 'bg-blue-50 border-r-4 border-blue-600'
                                        : 'hover:bg-gray-50'
                                        }`}>
                                    <Icon
                                        size={22}
                                        color={isActive ? '#2563EB' : '#64748B'} // blue-600 : slate-500
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                    <Text
                                        className={`text-base ${isActive
                                            ? 'font-semibold text-blue-700'
                                            : 'font-medium text-slate-600'
                                            }`}>
                                        {item.name}
                                    </Text>
                                </Pressable>
                            </Link>
                        );
                    })}
                </View>

                <View className="p-4 border-t border-gray-100">
                    <Text className="text-xs text-center text-gray-400">
                        v1.0.0 (Web)
                    </Text>
                </View>
            </View>

            {/* Main Content Area */}
            <View className="flex-1 bg-gray-50">
                <Slot />
            </View>
        </View>
    );
}
