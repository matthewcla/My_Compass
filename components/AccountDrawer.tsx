import Colors from '@/constants/Colors';
import { useSession } from '@/lib/ctx';
import { useUser } from '@/store/useUserStore';
import { getShadow } from '@/utils/getShadow';
import { LogOut, Minimize, Settings, UserCircle, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

interface AccountDrawerProps {
    visible: boolean;
    onClose: () => void;
}

export function AccountDrawer({ visible, onClose }: AccountDrawerProps) {
    const { signOut } = useSession();
    const user = useUser();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[colorScheme ?? 'light'];
    const [isPWA, setIsPWA] = useState(false);

    useEffect(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const checkPWA = () => {
                const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
                setIsPWA(isStandalone);
            };
            checkPWA();
        }
    }, []);

    const handleExitFullScreen = () => {
        if (Platform.OS === 'web' && document.exitFullscreen) {
            document.exitFullscreen().catch(err => console.error(err));
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                {/* Backdrop tap to close */}
                <TouchableOpacity className="absolute inset-0" onPress={onClose} activeOpacity={1}>
                    <View className="flex-1 bg-black/30" />
                </TouchableOpacity>

                {/* Drawer Content */}
                <View
                    className="rounded-t-3xl p-5 max-h-[80%]"
                    style={[
                        { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
                        getShadow({
                            shadowColor: '#000',
                            shadowOffset: {
                                width: 0,
                                height: -2,
                            },
                            shadowOpacity: 0.25,
                            shadowRadius: 4,
                            elevation: 5,
                        })
                    ]}
                >
                    {/* Handle/Header */}
                    <View className="items-center mb-5 relative">
                        <View className="w-10 h-1 bg-slate-300 rounded-sm mb-2.5" />
                        <TouchableOpacity onPress={onClose} className="absolute right-0 top-0">
                            <X size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <View className="gap-4">
                        <View className="items-center mb-5">
                            <View className="mb-3">
                                <UserCircle size={64} color={theme.tint} strokeWidth={1} />
                            </View>
                            <Text className="text-xl font-bold mb-1" style={{ color: theme.text }}>{user?.displayName || 'Guest'}</Text>
                            <Text className="text-sm uppercase tracking-[1px]" style={{ color: theme.text, opacity: 0.6 }}>{user?.rank || ''} • {user?.title || ''}</Text>
                        </View>

                        <View className="h-px bg-slate-200 my-2" />

                        {isPWA && (
                            <TouchableOpacity className="flex-row items-center gap-3 py-3 px-4 rounded-xl bg-[rgba(0,0,0,0.03)]" onPress={handleExitFullScreen}>
                                <Minimize size={20} color={theme.text} />
                                <Text className="text-base font-semibold" style={{ color: theme.text }}>Exit Full Screen</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            className="flex-row items-center gap-3 py-3 px-4 rounded-xl bg-[rgba(0,0,0,0.03)]"
                            onPress={() => {
                                onClose();
                                // @ts-ignore
                                router.push('/(profile)/preferences');
                            }}
                        >
                            <Settings size={20} color={theme.text} />
                            <Text className="text-base font-semibold" style={{ color: theme.text }}>Profile Settings</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center gap-3 py-3 px-4 rounded-xl bg-[rgba(0,0,0,0.03)]"
                            onPress={() => {
                                onClose();
                                signOut();
                            }}
                        >
                            <LogOut size={20} color="#ef4444" />
                            <Text className="text-base font-semibold" style={{ color: '#ef4444' }}>Log Out</Text>
                        </TouchableOpacity>
                    </View>
                    {/* Bottom Safe Area Spacer */}
                    <View style={{ height: 40 }} />
                </View>
            </View>
        </Modal>
    );
}
