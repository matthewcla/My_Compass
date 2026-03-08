import { useSession } from '@/lib/ctx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

/**
 * AC-8: DoD Notice and Consent Banner
 *
 * Displayed every session after authentication and before app access.
 * Required by NIST SP 800-53 AC-8 and DISA Mobile App SRG.
 *
 * Text is standardized DoD boilerplate per DoD CIO policy.
 * No back gesture — gestureEnabled: false is set in _layout.tsx.
 */
export default function ConsentScreen() {
    const { acknowledgeConsent } = useSession();
    const insets = useSafeAreaInsets();

    return (
        <View
            className="flex-1 bg-[#0A1628]"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            <Animated.View entering={FadeIn.duration(400)} className="flex-1 px-6 pt-8">

                {/* Header */}
                <View className="items-center mb-6">
                    <Text className="text-amber-400 font-bold text-xs tracking-[3px] uppercase mb-2">
                        U.S. Department of Defense
                    </Text>
                    <Text className="text-white font-bold text-xl text-center">
                        Notice and Consent
                    </Text>
                    <View className="mt-3 h-px w-16 bg-amber-400/60" />
                </View>

                {/* Banner Body */}
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 24 }}
                >
                    <View className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <Text className="text-white/90 text-sm leading-6">
                            You are accessing a U.S. Government (USG) Information System (IS) that is provided for USG-authorized use only.
                        </Text>

                        <Text className="text-white/90 text-sm leading-6 mt-4">
                            By using this IS (which includes any device attached to this IS), you consent to the following conditions:
                        </Text>

                        <View className="mt-4 gap-3">
                            {CONSENT_ITEMS.map((item, index) => (
                                <View key={index} className="flex-row gap-3">
                                    <Text className="text-amber-400 text-sm font-bold mt-0.5">
                                        {index + 1}.
                                    </Text>
                                    <Text className="flex-1 text-white/80 text-sm leading-6">
                                        {item}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Classification notice */}
                    <View className="mt-4 px-4 py-3 bg-amber-400/10 border border-amber-400/30 rounded-xl">
                        <Text className="text-amber-300 text-xs text-center leading-5">
                            This system may contain Controlled Unclassified Information (CUI).
                            Handle all data in accordance with applicable DoD policies and your
                            security classification guide.
                        </Text>
                    </View>
                </ScrollView>

                {/* Acknowledge Button */}
                <Animated.View entering={FadeInDown.delay(300).springify()} className="pt-4">
                    <Pressable
                        onPress={acknowledgeConsent}
                        accessibilityRole="button"
                        accessibilityLabel="I acknowledge and accept the terms of this notice"
                        className="bg-amber-400 rounded-2xl py-4 items-center active:bg-amber-500"
                    >
                        <Text className="text-[#0A1628] font-bold text-base tracking-wide">
                            I Acknowledge
                        </Text>
                    </Pressable>

                    <Text className="text-white/30 text-xs text-center mt-3">
                        Unauthorized use of this system is prohibited and may result in criminal prosecution.
                    </Text>
                </Animated.View>

            </Animated.View>
        </View>
    );
}

const CONSENT_ITEMS = [
    'The USG routinely intercepts and monitors communications on this IS for purposes including, but not limited to, penetration testing, COMSEC monitoring, network operations and defense, personnel misconduct (PM), law enforcement (LE), and counterintelligence (CI) investigations.',
    'At any time, the USG may inspect and seize data stored on this IS.',
    'Communications using, or data stored on, this IS are not private, are subject to routine monitoring, interception, and search, and may be disclosed or used for any USG-authorized purpose.',
    'This IS includes security measures (e.g., authentication and access controls) to protect USG interests — not for your personal benefit or privacy.',
    'Notwithstanding the above, using this IS does not constitute consent to PM, LE, or CI investigative searching or monitoring of the content of privileged communications or data (including work product) that are related to personal representation or services by attorneys, psychotherapists, or clergy, and their assistants. Such communications and work product are private and confidential.',
];
