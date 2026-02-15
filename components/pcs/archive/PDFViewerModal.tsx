import { GlassView } from '@/components/ui/GlassView';
import { PCSDocument } from '@/types/pcs';
import { BlurView } from 'expo-blur';
import * as Sharing from 'expo-sharing';
import { Share as ShareIcon, X } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Pdf from 'react-native-pdf';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

interface PDFViewerModalProps {
    visible: boolean;
    document: PCSDocument | null;
    onClose: () => void;
}

export function PDFViewerModal({ visible, document, onClose }: PDFViewerModalProps) {
    if (!visible || !document) return null;

    const handleShare = async () => {
        if (!document.localUri) return;

        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(document.localUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Share ${document.displayName}`,
                    UTI: 'com.adobe.pdf',
                });
            } else {
                alert('Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Error sharing PDF:', error);
        }
    };

    const renderContent = () => {
        if (Platform.OS === 'web') {
            return (
                <View style={styles.webContainer}>
                    <iframe
                        src={document.localUri}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title={document.displayName}
                    />
                </View>
            );
        }

        return (
            <Pdf
                source={{ uri: document.localUri, cache: true }}
                onLoadComplete={(numberOfPages, filePath) => {
                    console.log(`Number of pages: ${numberOfPages}`);
                }}
                onPageChanged={(page, numberOfPages) => {
                    console.log(`Current page: ${page}`);
                }}
                onError={(error) => {
                    console.log(error);
                }}
                onPressLink={(uri) => {
                    console.log(`Link pressed: ${uri}`);
                }}
                style={styles.pdf}
                trustAllCerts={false}
            />
        );
    };

    return (
        <Modal
            animationType="none"
            transparent
            visible={visible}
            onRequestClose={onClose}
        >
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={styles.container}
            >
                <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

                <GlassView className="absolute top-12 left-4 right-4 z-50 rounded-full flex-row items-center justify-between p-2 px-4 border border-white/20">
                    <View className="flex-1">
                        <Text className="text-white font-semibold truncate" numberOfLines={1}>
                            {document.displayName}
                        </Text>
                        <Text className="text-white/60 text-xs">
                            {document.category.replace('_', ' ')}
                        </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                            onPress={handleShare}
                            className="w-10 h-10 items-center justify-center rounded-full bg-white/10"
                        >
                            <ShareIcon size={20} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onClose}
                            className="w-10 h-10 items-center justify-center rounded-full bg-white/10"
                        >
                            <X size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </GlassView>

                <Animated.View
                    entering={SlideInDown.springify().damping(15)}
                    exiting={SlideOutDown}
                    style={styles.contentContainer}
                >
                    {renderContent()}
                </Animated.View>

            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        paddingTop: 100, // Space for header
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        backgroundColor: 'transparent',
    },
    webContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
    }
});
