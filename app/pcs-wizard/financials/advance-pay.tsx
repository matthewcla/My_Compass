import { AdvancePayVisualizer } from '@/components/pcs/financials/AdvancePayVisualizer';
import { useCurrentProfile } from '@/store/useDemoStore';
import { usePCSStore } from '@/store/usePCSStore';
import { useRouter } from 'expo-router';
import { AlertCircle, Calendar, Check, ChevronLeft, Clock, DollarSign, Minus, Plus } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdvancePayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const user = useCurrentProfile();
  const BASE_PAY = user?.financialProfile?.basePay || 3800;
  const payGrade = user?.financialProfile?.payGrade || 'E-6';

  const { financials, resetPCS } = usePCSStore(); // Accessing store, though we only update on save
  // Ideally we might want to load existing values if editing, but for now we start fresh or from default

  const [amountMonths, setAmountMonths] = useState(1);
  const [repaymentMonths, setRepaymentMonths] = useState(12);
  const [timing, setTiming] = useState<'EARLY' | 'STANDARD' | 'LATE'>('STANDARD');

  const [repaymentJustification, setRepaymentJustification] = useState('');
  const [timingJustification, setTimingJustification] = useState('');

  const totalAmount = useMemo(() => BASE_PAY * amountMonths, [amountMonths]);
  const monthlyDeduction = useMemo(() => totalAmount / repaymentMonths, [totalAmount, repaymentMonths]);

  // Validation
  const isRepaymentJustificationRequired = repaymentMonths > 12;
  const isTimingJustificationRequired = timing !== 'STANDARD';

  const canSubmit = useMemo(() => {
    if (isRepaymentJustificationRequired && !repaymentJustification.trim()) return false;
    if (isTimingJustificationRequired && !timingJustification.trim()) return false;
    return true;
  }, [isRepaymentJustificationRequired, repaymentJustification, isTimingJustificationRequired, timingJustification]);

  const handleGenerateRequest = () => {
    usePCSStore.setState(state => ({
      financials: {
        ...state.financials,
        advancePay: {
          requested: true,
          amount: totalAmount,
          months: amountMonths,
          repaymentMonths,
          repaymentJustification: isRepaymentJustificationRequired ? repaymentJustification : null,
          timing,
          timingJustification: isTimingJustificationRequired ? timingJustification : null,
          justification: null, // Legacy field
        }
      }
    }));
    router.back();
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pb-2 px-4 shadow-sm z-10"
      >
        <View className="flex-row items-start justify-between mb-1 mt-2">
          <View className="flex-1">
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5 }} className="text-slate-400 dark:text-gray-500">
              PHASE 2
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }} className="text-slate-900 dark:text-white">
              Advance Basic Pay
            </Text>
          </View>
          <Pressable onPress={() => router.back()} className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
            <ChevronLeft size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
          </Pressable>
        </View>

        <View className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex-row items-start gap-3">
          <InfoIcon size={20} color={isDark ? '#60a5fa' : '#2563eb'} style={{ marginTop: 2 }} />
          <Text className="flex-1 text-sm text-blue-800 dark:text-blue-200 font-medium leading-5">
            Based on your {payGrade} Basic Pay of <Text className="font-bold">${BASE_PAY.toLocaleString()}</Text>.
            Request up to 3 months of pay to cover immediate PCS expenses.
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Amount Section */}
          <View className="mb-8">
            <SectionLabel icon={<DollarSign size={18} color={isDark ? '#94a3b8' : '#64748b'} />} label="Amount Requested" />

            <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <Text className="text-3xl font-black text-slate-900 dark:text-white text-center mb-6">
                ${totalAmount.toLocaleString()}
              </Text>

              <View className="flex-row gap-3">
                {[1, 2, 3].map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setAmountMonths(m)}
                    className={`flex-1 py-3 rounded-xl border-2 items-center justify-center ${amountMonths === m
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <Text className={`font-bold ${amountMonths === m ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                      {m} Month{m > 1 ? 's' : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Repayment Section */}
          <View className="mb-8">
            <SectionLabel icon={<Calendar size={18} color={isDark ? '#94a3b8' : '#64748b'} />} label="Repayment Period" />

            <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <View className="flex-row justify-between items-baseline mb-6">
                <Text className="text-slate-500 dark:text-slate-400 font-medium">Monthly Deduction</Text>
                <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                  ${Math.ceil(monthlyDeduction).toLocaleString()}<Text className="text-sm font-normal text-slate-500 dark:text-slate-400">/mo</Text>
                </Text>
              </View>

              {/* Custom Slider Control */}
              <View className="flex-row items-center gap-4 mb-2">
                <Pressable
                  onPress={() => setRepaymentMonths(Math.max(12, repaymentMonths - 1))}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700"
                >
                  <Minus size={20} color={isDark ? '#e2e8f0' : '#334155'} />
                </Pressable>

                <View className="flex-1">
                  <View className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${((repaymentMonths - 12) / 12) * 100}%` }}
                    />
                  </View>
                  <Text className="text-center mt-2 font-bold text-slate-900 dark:text-white">
                    {repaymentMonths} Months
                  </Text>
                </View>

                <Pressable
                  onPress={() => setRepaymentMonths(Math.min(24, repaymentMonths + 1))}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700"
                >
                  <Plus size={20} color={isDark ? '#e2e8f0' : '#334155'} />
                </Pressable>
              </View>
            </View>

            {isRepaymentJustificationRequired && (
              <View className="mt-4">
                <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                  Justification for Extended Repayment <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={repaymentJustification}
                  onChangeText={setRepaymentJustification}
                  placeholder="Explain why you need more than 12 months..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-white h-24 text-base"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>

          {/* Timing Section */}
          <View className="mb-8">
            <SectionLabel icon={<Clock size={18} color={isDark ? '#94a3b8' : '#64748b'} />} label="Payment Timing" />

            <View className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-row mb-4">
              {(['EARLY', 'STANDARD', 'LATE'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTiming(t)}
                  className={`flex-1 py-2.5 rounded-lg items-center justify-center ${timing === t ? 'bg-white dark:bg-slate-700 shadow-sm' : ''
                    }`}
                >
                  <Text className={`text-xs font-bold ${timing === t ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                    {t === 'EARLY' ? 'Early (Pre)' : t === 'LATE' ? 'Late (Post)' : 'Standard'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {isTimingJustificationRequired && (
              <View>
                <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                  Justification for Non-Standard Timing <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={timingJustification}
                  onChangeText={setTimingJustification}
                  placeholder="Explain why standard timing doesn't work..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-white h-24 text-base"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>

          <View className="mb-8">
            <AdvancePayVisualizer
              monthsRequested={amountMonths}
              onMonthsRequestedChange={setAmountMonths}
              repaymentTerm={repaymentMonths}
              onRepaymentTermChange={setRepaymentMonths}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Action */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4"
      >
        <Pressable
          onPress={handleGenerateRequest}
          disabled={!canSubmit}
          className={`w-full py-4 rounded-xl flex-row items-center justify-center gap-2 ${canSubmit ? 'bg-blue-600 active:bg-blue-700' : 'bg-slate-200 dark:bg-slate-800'
            }`}
        >
          <Text className={`font-bold text-lg ${canSubmit ? 'text-white' : 'text-slate-400 dark:text-slate-600'}`}>
            Generate Request
          </Text>
          {canSubmit && <Check size={20} color="white" strokeWidth={3} />}
        </Pressable>
      </View>
    </View>
  );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <View className="flex-row items-center gap-2 mb-3 ml-1">
      {icon}
      <Text className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </Text>
    </View>
  );
}

function InfoIcon(props: any) {
  return (
    <View className="bg-blue-100 dark:bg-blue-900 rounded-full p-0.5">
      <AlertCircle {...props} />
    </View>
  )
}
