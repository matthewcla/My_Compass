
import { DocumentListItem } from '@/components/pcs/archive/DocumentListItem';
import { ScalePressable } from '@/components/ScalePressable';
import { useColorScheme } from '@/components/useColorScheme';
import { DocumentCategory, PCSDocument } from '@/types/pcs';
import { Camera, ChevronDown, ChevronRight, File, FileSpreadsheet, Receipt, ScrollText } from 'lucide-react-native';
import React, { useState } from 'react';
import { LayoutAnimation, Text, View } from 'react-native';

interface DocumentCategorySectionProps {
    title: string;
    category: DocumentCategory;
    documents: PCSDocument[];
    onDocumentPress: (document: PCSDocument) => void;
}

export function DocumentCategorySection({
    title,
    category,
    documents,
    onDocumentPress,
}: DocumentCategorySectionProps) {
    // If no documents, we might still want to show the section if we want to show "No documents"
    // But typically in folder views, if it's empty, we might skip it or show it empty.
    // The plan said "Empty state text when no documents in category", so we show it.

    const [isExpanded, setIsExpanded] = useState(true);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    const getCategoryIcon = () => {
        const props = { size: 20, color: isDark ? '#94a3b8' : '#475569' };
        switch (category) {
            case 'ORDERS': return <ScrollText {...props} />;
            case 'TRAVEL_VOUCHER': return <Receipt {...props} />;
            case 'W2': return <FileSpreadsheet {...props} />;
            case 'RECEIPT': return <Camera {...props} />;
            case 'OTHER': default: return <File {...props} />;
        }
    };

    return (
        <View className="mb-6">
            <ScalePressable
                onPress={toggleExpand}
                className="flex-row items-center justify-between mb-3 px-1"
                accessibilityRole="header"
                accessibilityLabel={`${title}, ${documents.length} documents`}
            >
                <View className="flex-row items-center gap-2">
                    {getCategoryIcon()}
                    <Text className="text-base font-bold text-slate-800 dark:text-slate-100">
                        {title}
                    </Text>
                    <View className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-1">
                        <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {documents.length}
                        </Text>
                    </View>
                </View>
                <View>
                    {isExpanded ? (
                        <ChevronDown size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                    ) : (
                        <ChevronRight size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                    )}
                </View>
            </ScalePressable>

            {isExpanded && (
                <View>
                    {documents.length === 0 ? (
                        <View className="p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 items-center">
                            <Text className="text-sm text-slate-400 dark:text-slate-500 italic">
                                No documents found in this category
                            </Text>
                        </View>
                    ) : (
                        documents.map((doc) => (
                            <DocumentListItem
                                key={doc.id}
                                document={doc}
                                onPress={onDocumentPress}
                            />
                        ))
                    )}
                </View>
            )}
        </View>
    );
}
