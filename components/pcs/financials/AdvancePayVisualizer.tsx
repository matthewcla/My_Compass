import { useCurrentProfile } from '@/store/useDemoStore';
import { calculateAdvancePayAmortization } from '@/utils/financialMath';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

const CHART_HEIGHT = 180;

const formatCurrency = (value: number): string =>
  `$${Math.round(value).toLocaleString()}`;

type MonthOption = 1 | 2 | 3;
type RepaymentOption = 12 | 24;

const shouldShowTick = (month: number, repaymentTerm: number): boolean => {
  if (month === 0 || month === 1 || month === repaymentTerm) {
    return true;
  }

  return repaymentTerm === 24 ? month % 6 === 0 : month % 3 === 0;
};

interface AdvancePayVisualizerProps {
  monthsRequested?: number;
  onMonthsRequestedChange?: (value: number) => void;
  repaymentTerm?: number;
  onRepaymentTermChange?: (value: number) => void;
}

export const AdvancePayVisualizer = ({
  monthsRequested: externalMonths,
  onMonthsRequestedChange,
  repaymentTerm: externalTerm,
  onRepaymentTermChange,
}: AdvancePayVisualizerProps = {}) => {
  const user = useCurrentProfile();
  const BASE_PAY = user?.financialProfile?.basePay || 3800;

  const [internalMonths, setInternalMonths] = useState<MonthOption>(2);
  const [internalTerm, setInternalTerm] = useState<RepaymentOption>(12);

  const monthsRequested = (externalMonths as MonthOption) ?? internalMonths;
  const repaymentTerm = (externalTerm as RepaymentOption) ?? internalTerm;

  const handleMonthsChange = (val: MonthOption) => {
    if (onMonthsRequestedChange) {
      onMonthsRequestedChange(val);
    } else {
      setInternalMonths(val);
    }
  };

  const handleTermChange = (val: RepaymentOption) => {
    if (onRepaymentTermChange) {
      onRepaymentTermChange(val);
    } else {
      setInternalTerm(val);
    }
  };

  const amortization = useMemo(
    () =>
      calculateAdvancePayAmortization(BASE_PAY, monthsRequested, repaymentTerm as 12 | 24),
    [monthsRequested, repaymentTerm, BASE_PAY],
  );

  const originalNetPay = amortization[0]?.originalNetPay ?? 0;
  const debtDeduction = amortization[0]?.deductionAmount ?? 0;
  const projectedNetPay = amortization[0]?.projectedNetPay ?? 0;
  const totalAdvance = BASE_PAY * monthsRequested;

  const chartRows = useMemo(() => {
    if (!amortization.length) {
      return [];
    }

    return [
      {
        monthIndex: 0,
        originalNetPay,
        deductionAmount: 0,
        projectedNetPay: originalNetPay,
      },
      ...amortization,
    ];
  }, [amortization, originalNetPay]);

  const barWidth = repaymentTerm === 24 ? 14 : 18;

  return (
    <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <Text className="text-slate-900 text-lg font-extrabold">
        Advance Pay Impact Visualizer
      </Text>
      <Text className="text-slate-500 text-sm mt-1 mb-5">
        See how repayment deductions change each LES.
      </Text>

      {/* Controls: Months Requested */}
      <View className="mb-5">
        <Text className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
          Months Requested
        </Text>
        <View className="flex-row gap-2">
          {[1, 2, 3].map((option) => {
            const typedOption = option as MonthOption;
            const isSelected = monthsRequested === typedOption;

            return (
              <Pressable
                key={option}
                onPress={() => handleMonthsChange(typedOption)}
                // Changed Blue-600 to Slate-900/Blue-900 (Navy Theme)
                className={`px-4 py-2.5 rounded-full border ${isSelected
                    ? 'bg-slate-900 border-slate-900'
                    : 'bg-slate-100 border-slate-200 active:bg-slate-200'
                  }`}
                accessibilityRole="button"
                accessibilityLabel={`Set months requested to ${option}`}
              >
                <Text
                  className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-700'
                    }`}
                >
                  {option} Month{option > 1 ? 's' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Controls: Repayment Term */}
      <View className="mb-5">
        <Text className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
          Repayment Term
        </Text>
        <View className="flex-row gap-2">
          {([12, 24] as const).map((option) => {
            const isSelected = repaymentTerm === option;

            return (
              <Pressable
                key={option}
                onPress={() => handleTermChange(option)}
                // Keep Slate-900 for consistency or maybe Amber-500 if we want to differentiate? 
                // Let's stick to Slate-900 for primary controls to be clean Navy style.
                className={`px-4 py-2.5 rounded-full border ${isSelected
                    ? 'bg-slate-900 border-slate-900'
                    : 'bg-slate-100 border-slate-200 active:bg-slate-200'
                  }`}
                accessibilityRole="button"
                accessibilityLabel={`Set repayment term to ${option} months`}
              >
                <Text
                  className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-700'
                    }`}
                >
                  {option} Months
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Summary Card */}
      <View className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-5">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-slate-500 text-xs uppercase font-semibold tracking-wider">
            Advance Total
          </Text>
          <Text className="text-slate-900 text-base font-bold">
            {formatCurrency(totalAdvance)}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-slate-500 text-xs uppercase font-semibold tracking-wider">
            Debt Deduction
          </Text>
          {/* Changed Red to Slate-600 or maybe Blue-900? Let's use Slate-600 for neutral deduction per user request for less standard colors */}
          <Text className="text-slate-600 text-base font-bold">
            -{formatCurrency(debtDeduction)}/mo
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-slate-500 text-xs uppercase font-semibold tracking-wider">
            Projected Net Pay
          </Text>
          {/* Changed Emerald to Amber-600 (Gold/Bronze) for positive cashflow */}
          <Text className="text-amber-600 text-base font-bold">
            {formatCurrency(projectedNetPay)}/mo
          </Text>
        </View>
      </View>

      {/* Visualizer Chart */}
      <View className="rounded-2xl border border-slate-200 bg-white p-3">
        <Text className="text-slate-800 font-semibold text-sm mb-3">
          Projected LES Over Repayment
        </Text>

        {/* Legend */}
        <View className="flex-row items-center gap-4 mb-3">
          <View className="flex-row items-center">
            {/* Gold dot for Net Pay */}
            <View className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-2" />
            <Text className="text-slate-600 text-xs">Projected net pay</Text>
          </View>
          <View className="flex-row items-center">
            {/* Slate dot for Deduction */}
            <View className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-2" />
            <Text className="text-slate-600 text-xs">Debt deduction</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 8 }}
        >
          <View className="flex-row items-end">
            {chartRows.map((row) => {
              const projectedHeight =
                originalNetPay > 0
                  ? (row.projectedNetPay / originalNetPay) * CHART_HEIGHT
                  : 0;
              const debtHeight =
                originalNetPay > 0
                  ? (row.deductionAmount / originalNetPay) * CHART_HEIGHT
                  : 0;
              const isBaseline = row.monthIndex === 0;

              return (
                <View
                  key={row.monthIndex}
                  className="items-center"
                  style={{ marginRight: 8, width: barWidth + 4 }}
                >
                  <View
                    className="rounded-t-md rounded-b-sm border border-slate-200 overflow-hidden bg-slate-100"
                    style={{ height: CHART_HEIGHT, width: barWidth }}
                  >
                    <View className="w-full h-full flex-col-reverse">
                      {/* Projected Net Pay Bar - Gold */}
                      <Animated.View
                        layout={LinearTransition.springify().damping(15)}
                        className={`w-full ${isBaseline ? 'bg-amber-300' : 'bg-amber-400'
                          }`}
                        style={{ height: projectedHeight }}
                      />
                      {/* Debt Deduction Bar - Slate/Grey */}
                      <Animated.View
                        layout={LinearTransition.springify().damping(15)}
                        className="w-full bg-slate-400"
                        style={{ height: debtHeight }}
                      />
                    </View>
                  </View>
                  <Text className="text-[10px] text-slate-500 mt-1 h-3">
                    {shouldShowTick(row.monthIndex, repaymentTerm)
                      ? isBaseline
                        ? 'Now'
                        : `${row.monthIndex}`
                      : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};


