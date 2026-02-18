
import { formatFileSize } from '@/components/pcs/archive/archiveUtils';
import { ScalePressable } from '@/components/ScalePressable';
import { useColorScheme } from '@/components/useColorScheme';
import { PCSDocument } from '@/types/pcs';
import { FileText, Image as ImageIcon } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface DocumentListItemProps {
    document: PCSDocument;
    onPress: (document: PCSDocument) => void;
}

export function DocumentListItem({ document, onPress }: DocumentListItemProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const getIcon = () => {
        // Simple extension check or category check
        const ext = document.filename.split('.').pop()?.toLowerCase();

        if (['jpg', 'jpeg', 'png', 'heic'].includes(ext || '')) {
            return <ImageIcon size={20} color={isDark ? '#38bdf8' : '#0284c7'} />;
        }
        return <FileText size={20} color={isDark ? '#94a3b8' : '#475569'} />;
    };

    const formattedDate = new Date(document.uploadedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <ScalePressable
            onPress={() => onPress(document)}
            className="flex-row items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-white/5 mb-2"
            accessibilityLabel={`${document.displayName}, ${formatFileSize(document.sizeBytes)}, uploaded ${formattedDate}`}
            accessibilityHint="Double tap to view document"
        >
            <View className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 items-center justify-center border border-blue-100 dark:border-blue-800/30 mr-3">
                {getIcon()}
            </View>

            <View className="flex-1">
                <Text
                    className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5"
                    numberOfLines={1}
                >
                    {document.displayName}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {formattedDate} • {formatFileSize(document.sizeBytes)}
                </Text>
            </View>
        </ScalePressable>
    );
}
