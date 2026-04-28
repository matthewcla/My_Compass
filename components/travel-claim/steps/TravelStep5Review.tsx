import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { TravelClaim } from '@/types/travelClaim';
import { AlertTriangle, Camera, CheckCircle2, FileText, MapPin } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { formatCurrency } from '../../../utils/formatCurrency';

interface TravelStep5Props {
    claim: TravelClaim;
    embedded?: boolean;
    onToggleCertification?: (certified: boolean) => void;
}

export function TravelStep5Review({ claim, embedded = false, onToggleCertification }: TravelStep5Props) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[colorScheme];

    const [isCertified, setIsCertified] = useState(claim.memberCertification || false);

    // --- Calculations ---
    const summary = useMemo(() => {
        let lodgingTotal = 0;
        let lodgingReceipts = 0;
        let maltTotal = claim.maltAmount || 0;
        let perDiemTotal = 0;
        let fuelTollsTotal = 0;
        let fuelTollsReceipts = 0;
        let miscTotal = 0;
        let miscReceipts = 0;
        let warnings: string[] = [];

        // Lodging (TLE)
        const lodgingExpenses = claim.expenses.filter(e => e.expenseType === 'lodging');
        lodgingTotal = lodgingExpenses.reduce((sum, e) => sum + e.amount, 0);
        lodgingReceipts = lodgingExpenses.reduce((count, e) => count + (e.receipts?.length || 0), 0);

        // Check TLE Caps (Simplified warning logic)
        lodgingExpenses.forEach(e => {
            if (e.lodgingDetails && e.lodgingDetails.nightlyRate > e.lodgingDetails.localityMaxRate) {
                warnings.push(`Lodging exceeded cap of $${e.lodgingDetails.localityMaxRate} on ${new Date(e.date).toLocaleDateString()}`);
            }
        });

        // Per Diem (M&IE)
        if (claim.perDiemDays) {
            perDiemTotal = claim.perDiemDays.reduce((sum, day) => sum + day.actualMieAmount, 0);
        }

        // Fuel & Transportation
        const fuelExpenses = claim.expenses.filter(e => ['fuel', 'toll', 'parking', 'rental_car', 'airfare', 'gov_vehicle', 'rail'].includes(e.expenseType));
        fuelTollsTotal = fuelExpenses.reduce((sum, e) => sum + e.amount, 0);
        fuelTollsReceipts = fuelExpenses.reduce((count, e) => count + (e.receipts?.length || 0), 0);

        // Warn about missing fuel receipts if amount > 75 (General rule, though fuel usually requires all)
        fuelExpenses.forEach(e => {
            if (e.amount > 75 && (!e.receipts || e.receipts.length === 0)) {
                warnings.push(`Missing receipt for ${e.expenseType} of ${formatCurrency(e.amount)}`);
            }
        });

        // Misc
        const miscExpenses = claim.expenses.filter(e => e.expenseType === 'misc');
        miscTotal = miscExpenses.reduce((sum, e) => sum + e.amount, 0);
        miscReceipts = miscExpenses.reduce((count, e) => count + (e.receipts?.length || 0), 0);

        const grandTotal = lodgingTotal + maltTotal + perDiemTotal + fuelTollsTotal + miscTotal;
        const totalReceipts = lodgingReceipts + fuelTollsReceipts + miscReceipts;

        return {
            lodgingTotal, lodgingReceipts,
            maltTotal,
            perDiemTotal,
            fuelTollsTotal, fuelTollsReceipts,
            miscTotal, miscReceipts,
            grandTotal,
            totalReceipts,
            warnings
        };
    }, [claim]);

    const handleCertification = () => {
        const newValue = !isCertified;
        setIsCertified(newValue);
        if (onToggleCertification) {
            onToggleCertification(newValue);
        }
    };

    return (
        <WizardCard title="Final Review" scrollable={!embedded}>
            <View className="gap-6 pb-6">

                {/* 1. Trip Summary Card */}
                <View className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <View className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-row justify-between items-center">
                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Trip Summary
                        </Text>
                        {claim.orderNumber && (
                            <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                Order #{claim.orderNumber}
                            </Text>
                        )}
                    </View>
                    <View className="p-4 gap-4">
                        <View className="flex-row items-center gap-3">
                            <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center">
                                <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {claim.travelMode ? claim.travelMode.replace('_', ' ').toUpperCase() : 'TRAVEL'}
                                </Text>
                                <Text className="text-xs text-slate-500 dark:text-slate-400">
                                    {claim.maltMiles ? `${claim.maltMiles} miles authorized` : 'Distance not set'}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row items-center gap-3">
                            <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center">
                                <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {new Date(claim.departureDate).toLocaleDateString()} — {new Date(claim.returnDate).toLocaleDateString()}
                                </Text>
                                <Text className="text-xs text-slate-500 dark:text-slate-400">
                                    {claim.departureLocation} to {claim.destinationLocation}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 2. Expense Breakdown Table */}
                <View className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <View className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Expenses & Entitlements
                        </Text>
                    </View>

                    {/* Header Row */}
                    <View className="flex-row border-b border-slate-100 dark:border-slate-700/50 px-4 py-2 bg-slate-50/50 dark:bg-slate-800/50">
                        <Text className="flex-1 text-xs font-medium text-slate-400">Category</Text>
                        <Text className="w-24 text-right text-xs font-medium text-slate-400">Amount</Text>
                        <Text className="w-16 text-right text-xs font-medium text-slate-400">Receipts</Text>
                    </View>

                    {/* Rows */}
                    <ExpenseRow label="Lodging (TLE)" amount={summary.lodgingTotal} receiptCount={summary.lodgingReceipts} />
                    <ExpenseRow label="MALT (Mileage)" amount={summary.maltTotal} />
                    <ExpenseRow label="Per Diem (M&IE)" amount={summary.perDiemTotal} />
                    <ExpenseRow label="Fuel & Transp." amount={summary.fuelTollsTotal} receiptCount={summary.fuelTollsReceipts} />
                    <ExpenseRow label="Misc. Expenses" amount={summary.miscTotal} receiptCount={summary.miscReceipts} isLast />

                    {/* Total Row */}
                    <View className="flex-row px-4 py-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700 items-center">
                        <Text className="flex-1 text-sm font-bold text-slate-900 dark:text-white uppercase">Total Calculated</Text>
                        <Text className="text-lg font-bold text-green-600 dark:text-green-400 w-32 text-right">
                            {formatCurrency(summary.grandTotal)}
                        </Text>
                        {summary.totalReceipts > 0 && (
                            <View className="flex-row items-center justify-end w-16 gap-1">
                                <Text className="text-xs font-medium text-slate-500">{summary.totalReceipts}</Text>
                                <Camera size={12} className="text-slate-400" />
                            </View>
                        )}
                    </View>
                </View>

                {/* 3. Warnings Section */}
                {summary.warnings.length > 0 && (
                    <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-900/50 p-4">
                        <View className="flex-row items-center gap-2 mb-3">
                            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                            <Text className="text-sm font-bold text-amber-800 dark:text-amber-200">
                                Attention Required
                            </Text>
                        </View>
                        <View className="gap-2">
                            {summary.warnings.map((warning, idx) => (
                                <View key={idx} className="flex-row items-start gap-2">
                                    <View className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5" />
                                    <Text className="text-xs text-amber-900 dark:text-amber-100 flex-1 leading-5">
                                        {warning}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* 4. Certification & Signature */}
                <Pressable
                    onPress={handleCertification}
                    className={`p-4 rounded-xl border-2 transition-all ${isCertified
                        ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-400'
                        : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                        }`}
                >
                    <View className="flex-row items-start gap-3">
                        <View className={`w-6 h-6 rounded border items-center justify-center mt-0.5 ${isCertified ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-500'
                            }`}>
                            {isCertified && <CheckCircle2 size={16} color="white" />}
                        </View>
                        <View className="flex-1">
                            <Text className={`text-sm font-bold mb-1 ${isCertified ? 'text-blue-800 dark:text-blue-200' : 'text-slate-900 dark:text-white'
                                }`}>
                                Member Certification
                            </Text>
                            <Text className={`text-xs leading-5 ${isCertified ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                I certify that this claim is true and correct in accordance with the Joint Travel Regulations (JTR). I understand that there are severe criminal and civil penalties for knowingly presenting a false, fictitious, or fraudulent claim (18 U.S.C. §287; 31 U.S.C. §3729).
                            </Text>
                        </View>
                    </View>
                </Pressable>

            </View>
        </WizardCard>
    );
}

function ExpenseRow({ label, amount, receiptCount = 0, isLast = false }: { label: string, amount: number, receiptCount?: number, isLast?: boolean }) {
    if (amount === 0 && receiptCount === 0) return null; // Hide empty rows? Or show 0? Let's hide for cleaner UI

    return (
        <View className={`flex-row items-center px-4 py-3 ${!isLast ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}>
            <Text className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </Text>
            <Text className="w-24 text-right text-sm text-slate-900 dark:text-white font-semibold">
                {formatCurrency(amount)}
            </Text>
            <View className="w-16 flex-row justify-end items-center gap-1">
                {receiptCount > 0 ? (
                    <>
                        <Text className="text-xs text-slate-500">{receiptCount}</Text>
                        <Camera size={12} className="text-slate-400" />
                    </>
                ) : (
                    <Text className="text-xs text-slate-300 dark:text-slate-600">-</Text>
                )}
            </View>
        </View>
    );
}
