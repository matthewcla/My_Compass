import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { usePCSStore } from '@/store/usePCSStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Clock, DollarSign } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

const STATUS_MESSAGES = {
  NOT_STARTED: {
    title: 'Not Started',
    description: 'Submit your travel claim to begin liquidation tracking.',
  },
  SUBMITTED: {
    title: 'Claim Submitted',
    description: 'Your DD 1351-2 has been received and is queued for review.',
  },
  CPPA_REVIEW: {
    title: 'CPPA Review',
    description: 'Command Pay and Personnel Administrator is reviewing your claim for accuracy and completeness.',
  },
  NPPSC_AUDIT: {
    title: 'NPPSC Audit',
    description: 'Navy Personnel and Pay Support Center is conducting final audit before payment authorization.',
  },
  PAID: {
    title: 'Payment Complete',
    description: 'Your travel claim has been paid. Funds should appear in your account within 1-2 business days.',
  },
};

export function LiquidationTrackerWidget() {
  const liquidation = usePCSStore((state) => state.financials.liquidation);
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const currentIndex = useMemo(() => {
    if (!liquidation) return -1;
    return liquidation.steps.findIndex((s) => s.status === liquidation.currentStatus);
  }, [liquidation]);

  const statusMessage = useMemo(() => {
    if (!liquidation) return STATUS_MESSAGES.NOT_STARTED;
    return STATUS_MESSAGES[liquidation.currentStatus] || STATUS_MESSAGES.NOT_STARTED;
  }, [liquidation]);

  // Hide widget if not started
  if (!liquidation || liquidation.currentStatus === 'NOT_STARTED') {
    return null;
  }

  return (
    <GlassView
      intensity={80}
      tint={isDark ? 'dark' : 'light'}
      className="rounded-[24px] overflow-hidden mx-4 mb-6 shadow-sm border border-black/5 dark:border-white/10"
    >
      <LinearGradient
        colors={isDark ? ['rgba(16,185,129,0.15)', 'transparent'] : ['rgba(16,185,129,0.08)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View className="p-5">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-4 flex-1">
            <View className="w-[52px] h-[52px] rounded-full bg-emerald-500/10 dark:bg-emerald-900/40 items-center justify-center border-[1.5px] border-emerald-500/20 dark:border-emerald-800/60 shadow-sm">
              <DollarSign size={26} color={isDark ? '#34D399' : '#10B981'} />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>NPPSC Liquidation</Text>
              <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={1}>{statusMessage.title}</Text>
            </View>
          </View>
        </View>

        <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-5">
          {/* Horizontal Stepper */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between">
              {liquidation.steps.map((step, index) => {
                const isCompleted = index < currentIndex || step.completedDate;
                const isCurrent = index === currentIndex;
                const isPending = !isCompleted && !isCurrent;

                const stepBgColor = isCompleted
                  ? 'bg-emerald-500'
                  : isCurrent
                    ? 'bg-blue-500'
                    : 'bg-slate-200 dark:bg-slate-700/80';

                const connectorBgColor = isCompleted
                  ? 'bg-emerald-500'
                  : 'bg-slate-200 dark:bg-slate-700/80';

                return (
                  <React.Fragment key={step.status}>
                    {/* Step Circle */}
                    <View className="items-center" style={{ flex: 1 }}>
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center shadow-sm border border-black/5 dark:border-white/10 ${stepBgColor}`}
                      >
                        {isCompleted ? (
                          <Check size={18} color="#ffffff" strokeWidth={3} />
                        ) : isCurrent ? (
                          <Clock size={18} color="#ffffff" strokeWidth={2.5} />
                        ) : (
                          <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">
                            {index + 1}
                          </Text>
                        )}
                      </View>
                      <Text className="mt-2 text-[10px] uppercase tracking-wider font-bold text-center text-slate-500 dark:text-slate-400 w-24 absolute top-10">
                        {step.label}
                      </Text>
                    </View>

                    {/* Connector Line */}
                    {index < liquidation.steps.length - 1 && (
                      <View
                        className={`h-[3px] ${connectorBgColor}`}
                        style={{ flex: 1, marginTop: -22, marginHorizontal: -10, zIndex: -1 }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* Status Message */}
          <View className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 mt-8 shadow-sm">
            <Text className="text-[13px] font-semibold leading-5 text-slate-700 dark:text-slate-300">
              {statusMessage.description}
            </Text>
          </View>

          {/* Estimated Payment Date */}
          {liquidation.estimatedPaymentDate && liquidation.currentStatus !== 'PAID' && (
            <View className="mt-3 bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 shadow-sm flex-row items-center justify-between">
              <Text className="text-[11px] font-bold uppercase tracking-[1.2px] text-blue-700 dark:text-blue-400 mb-1">
                Estimated Payment
              </Text>
              <Text className="text-base font-black text-blue-800 dark:text-blue-300 tracking-tight">
                {new Date(liquidation.estimatedPaymentDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}

          {/* Actual Payment Amount (when paid) */}
          {liquidation.currentStatus === 'PAID' && liquidation.actualPaymentAmount && (
            <View className="mt-3 bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 shadow-sm flex-row items-center justify-between">
              <Text className="text-[11px] font-bold uppercase tracking-[1.2px] text-emerald-700 dark:text-emerald-400 mb-1">
                Payment Amount
              </Text>
              <Text className="text-xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                ${liquidation.actualPaymentAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          )}
        </View>
      </View>
    </GlassView>
  );
}
