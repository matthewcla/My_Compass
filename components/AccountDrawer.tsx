import Colors from '@/constants/Colors';
import { useSession } from '@/lib/ctx';
import { useUser } from '@/store/useUserStore';
import { LogOut, Settings, UserCircle, X } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

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

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Backdrop tap to close */}
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
                </TouchableOpacity>

                {/* Drawer Content */}
                <View style={[styles.drawer, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                    {/* Handle/Header */}
                    <View style={styles.header}>
                        <View style={styles.handle} />
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <View style={styles.userInfo}>
                            <View style={styles.avatarPlaceholder}>
                                <UserCircle size={64} color={theme.tint} strokeWidth={1} />
                            </View>
                            <Text style={[styles.userName, { color: theme.text }]}>{user?.displayName || 'Guest'}</Text>
                            <Text style={[styles.userRank, { color: theme.text, opacity: 0.6 }]}>{user?.rank || ''} • {user?.title || ''}</Text>
                        </View>

                        <View style={styles.separator} />

                        <TouchableOpacity style={styles.menuItem}>
                            <Settings size={20} color={theme.text} />
                            <Text style={[styles.menuText, { color: theme.text }]}>Profile Settings</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => {
                            onClose();
                            signOut();
                        }}>
                            <LogOut size={20} color="#ef4444" />
                            <Text style={[styles.menuText, { color: '#ef4444' }]}>Log Out</Text>
                        </TouchableOpacity>
                    </View>
                    {/* Bottom Safe Area Spacer */}
                    <View style={{ height: 40 }} />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    drawer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        maxHeight: '80%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#cbd5e1',
        borderRadius: 2,
        marginBottom: 10,
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        top: 0,
    },
    content: {
        gap: 16,
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarPlaceholder: {
        marginBottom: 12,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    userRank: {
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    separator: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    menuText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
