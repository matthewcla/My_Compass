import AsyncStorage from '@react-native-async-storage/async-storage';
import { Compass } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = 'sandbox_explained';

interface SandboxExplainerModalProps {
    /** Should be set to true when user toggles to Sandbox mode */
    trigger: boolean;
    onDismiss: () => void;
}

/**
 * First-time explainer modal for Sandbox mode.
 * Only shows once — persists dismissal to AsyncStorage.
 */
export function SandboxExplainerModal({ trigger, onDismiss }: SandboxExplainerModalProps) {
    const [visible, setVisible] = useState(false);
    const [alreadySeen, setAlreadySeen] = useState(true);

    // Check if the user has already seen this
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then(value => {
            setAlreadySeen(value === 'true');
        });
    }, []);

    // Show when triggered and not already seen
    useEffect(() => {
        if (trigger && !alreadySeen) {
            setVisible(true);
        }
    }, [trigger, alreadySeen]);

    const dismiss = useCallback(() => {
        setVisible(false);
        setAlreadySeen(true);
        AsyncStorage.setItem(STORAGE_KEY, 'true');
        onDismiss();
    }, [onDismiss]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={dismiss}
        >
            <Pressable
                className="flex-1 bg-black/60 items-center justify-center px-8"
                onPress={dismiss}
            >
                <View
                    className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-slate-200 dark:border-slate-700"
                    onStartShouldSetResponder={() => true}
                >
                    {/* Icon */}
                    <View className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 items-center justify-center self-center mb-4">
                        <Compass size={28} color="#A855F7" />
                    </View>

                    <Text className="text-xl font-black text-slate-900 dark:text-white text-center mb-3">
                        Sandbox Mode
                    </Text>

                    <Text className="text-sm text-slate-600 dark:text-slate-400 text-center leading-5 mb-5">
                        Explore billets outside your current rank to plan your career path.{'\n\n'}
                        Your swipes here are exploratory only — they won't affect your real preferences or slate.{'\n\n'}
                        <Text className="text-slate-500 dark:text-slate-500 text-xs italic">
                            This data helps CNPC understand sailor interest across the fleet.
                        </Text>
                    </Text>

                    <TouchableOpacity
                        onPress={dismiss}
                        className="bg-purple-600 py-3.5 rounded-xl items-center"
                    >
                        <Text className="text-white font-bold text-base">Got It</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
}
