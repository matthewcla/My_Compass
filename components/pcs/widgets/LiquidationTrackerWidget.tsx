import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { usePCSStore } from '@/store/usePCSStore';
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
      className="rounded-2xl overflow-hidden mx-4 mb-8"
      style={{
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
      }}
    >
      {/* Header */}
      <View className="bg-slate-900/70 p-5 pb-4">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-xl bg-white/10 dark:bg-slate-800/60 border border-slate-200/20 items-center justify-center mr-3">
            <DollarSign size={22} color={isDark ? '#6ee7b7' : '#059669'} strokeWidth={2.2} />
          </View>
          <View className="flex-1">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-slate-300">
              NPPSC Liquidation
            </Text>
            <Text className="mt-0.5 text-base font-bold text-white">
              {statusMessage.title}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="bg-white/40 dark:bg-slate-950/40 px-5 pt-4 pb-4 border-t border-slate-200/50 dark:border-slate-700/50">
        {/* Horizontal Stepper */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between">
            {liquidation.steps.map((step, index) => {
              const isCompleted = index < currentIndex || step.completedDate;
              const isCurrent = index === currentIndex;
              const isPending = !isCompleted && !isCurrent;

              const stepBgColor = isCompleted
                ? 'bg-green-500'
                : isCurrent
                  ? 'bg-blue-500'
                  : 'bg-slate-200/50 dark:bg-slate-700/50';

              const connectorBgColor = isCompleted
                ? 'bg-green-500'
                : 'bg-slate-200/50 dark:bg-slate-700/50';

              return (
                <React.Fragment key={step.status}>
                  {/* Step Circle */}
                  <View className="items-center" style={{ flex: 1 }}>
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${stepBgColor}`}
                    >
                      {isCompleted ? (
                        <Check size={18} color="#ffffff" strokeWidth={3} />
                      ) : isCurrent ? (
                        <Clock size={18} color="#ffffff" strokeWidth={2.5} />
                      ) : (
                        <Text className="text-sm font-bold text-slate-400 dark:text-slate-400">
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    <Text className="mt-2 text-[10px] font-semibold text-center text-slate-600 dark:text-slate-300 w-24 absolute top-10">
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
        <View className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200 dark:border-slate-700/60 mt-6">
          <Text className="text-sm leading-5 text-slate-700 dark:text-slate-300">
            {statusMessage.description}
          </Text>
        </View>

        {/* Estimated Payment Date */}
        {liquidation.estimatedPaymentDate && liquidation.currentStatus !== 'PAID' && (
          <View className="mt-3 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
            <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Estimated Payment
            </Text>
            <Text className="text-base font-bold text-blue-700 dark:text-blue-300">
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
          <View className="mt-3 bg-green-500/10 rounded-lg p-3 border border-green-500/20">
            <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Payment Amount
            </Text>
            <Text className="text-2xl font-bold text-green-700 dark:text-green-300">
              ${liquidation.actualPaymentAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        )}
      </View>
    </GlassView>
  );
}
