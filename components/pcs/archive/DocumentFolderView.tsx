
import { groupDocuments } from '@/components/pcs/archive/archiveUtils';
import { DocumentCategorySection } from '@/components/pcs/archive/DocumentCategorySection';
import { PDFViewerModal } from '@/components/pcs/archive/PDFViewerModal';
import { GlassView } from '@/components/ui/GlassView';
import { usePCSArchiveStore, useSelectedHistoricalOrder } from '@/store/usePCSArchiveStore';
import { DocumentCategory, PCSDocument } from '@/types/pcs';
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function DocumentFolderView() {
    const selectedOrder = useSelectedHistoricalOrder();
    const selectOrder = usePCSArchiveStore((s) => s.selectOrder);
    const insets = useSafeAreaInsets();

    const [viewingDocument, setViewingDocument] = useState<PCSDocument | null>(null);

    const categories: { key: DocumentCategory; label: string }[] = [
        { key: 'ORDERS', label: 'Official Orders' },
        { key: 'TRAVEL_VOUCHER', label: 'Travel Vouchers' },
        { key: 'W2', label: 'Tax Forms (W-2)' },
        { key: 'RECEIPT', label: 'Receipts & Expenses' },
        { key: 'OTHER', label: 'Other Documents' },
    ];

    const groupedDocuments = useMemo(() => {
        if (!selectedOrder) return {};
        return groupDocuments(selectedOrder.documents);
    }, [selectedOrder]);

    if (!selectedOrder) {
        return null; // Should probably redirect or show nothing if no order selected
    }

    const handleBack = () => {
        selectOrder(null);
    };

    const totalDocuments = selectedOrder.documents.length;

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900">
            <ScrollView
                contentContainerStyle={{
                    paddingBottom: insets.bottom + 20,
                    paddingTop: insets.top + 10
                }}
                className="flex-1 px-4"
                showsVerticalScrollIndicator={false}
            >
                {/* Navigation / Header */}
                <TouchableOpacity
                    onPress={handleBack}
                    className="flex-row items-center mb-6 py-2"
                    accessibilityLabel="Back to archive grid"
                >
                    <ArrowLeft size={24} className="text-slate-900 dark:text-white mr-2" />
                    <Text className="text-lg font-bold text-slate-900 dark:text-white">Back</Text>
                </TouchableOpacity>

                {/* Move Summary Card */}
                <GlassView className="rounded-2xl p-5 mb-8 border border-slate-200 dark:border-white/10">
                    <View className="mb-4">
                        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                            PCS Move
                        </Text>
                        <Text className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                            {selectedOrder.originCommand}
                        </Text>
                        <View className="flex-row items-center my-1">
                            <View className="h-4 w-0.5 bg-slate-300 dark:bg-slate-600 mx-1.5" />
                            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 italic">to</Text>
                            <View className="h-4 w-0.5 bg-slate-300 dark:bg-slate-600 mx-1.5" />
                        </View>
                        <Text className="text-xl font-bold text-blue-600 dark:text-blue-400 leading-tight">
                            {selectedOrder.gainingCommand}
                        </Text>
                    </View>

                    <View className="flex-row gap-4 flex-wrap">
                        <View className="flex-row items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg">
                            <CalendarDays size={14} className="text-slate-500 dark:text-slate-400" />
                            <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                FY{selectedOrder.fiscalYear}
                            </Text>
                        </View>

                        <View className="flex-row items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg">
                            <MapPin size={14} className="text-slate-500 dark:text-slate-400" />
                            <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {selectedOrder.gainingLocation}
                            </Text>
                        </View>
                    </View>
                </GlassView>

                {/* Content */}
                {categories.map((cat) => {
                    const docs = groupedDocuments[cat.key] || [];
                    return (
                        <DocumentCategorySection
                            key={cat.key}
                            title={cat.label}
                            category={cat.key}
                            documents={docs}
                            onDocumentPress={setViewingDocument}
                        />
                    );
                })}

                {totalDocuments === 0 && (
                    <View className="items-center justify-center py-10">
                        <Text className="text-slate-400 text-center">No documents archived for this move.</Text>
                    </View>
                )}

            </ScrollView>

            {/* PDF Viewer */}
            <PDFViewerModal
                visible={!!viewingDocument}
                document={viewingDocument}
                onClose={() => setViewingDocument(null)}
            />
        </View>
    );
}
