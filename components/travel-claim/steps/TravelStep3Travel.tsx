/**
 * @deprecated This step is no longer used in the 3-step settlement flow.
 * Travel expenses are now managed inline in request.tsx Step 2.
 * Kept for reference only.
 */
import { WizardCard } from '@/components/wizard/WizardCard';
import { Expense } from '@/types/travelClaim';
import { Fuel, ParkingCircle, Ticket } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View, useColorScheme } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

export interface TravelStep3Props {
  transportationExpenses: Expense[];
  onUpdate: (field: 'transportationExpenses', value: Expense[]) => void;
  embedded?: boolean;
}

const formatMoney = (value: number): string => `$${value.toFixed(2)}`;

export function TravelStep3Travel({
  transportationExpenses,
  onUpdate,
  embedded = false,
}: TravelStep3Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [expenses, setExpenses] = useState<Expense[]>(
    transportationExpenses || []
  );

  useEffect(() => {
    setExpenses(transportationExpenses || []);
  }, [transportationExpenses]);

  const addExpense = (type: 'fuel' | 'toll' | 'parking') => {
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      claimId: 'temp',
      expenseType: type,
      amount: 0,
      date: new Date().toISOString(),
      description: '',
      receipts: [],
    };
    const next = [...expenses, newExpense];
    setExpenses(next);
    onUpdate('transportationExpenses', next);
  };

  const updateExpense = (id: string, patch: Partial<Expense>) => {
    const next = expenses.map(e => e.id === id ? { ...e, ...patch } : e);
    setExpenses(next);
    onUpdate('transportationExpenses', next);
  };

  const removeExpense = (id: string) => {
    const next = expenses.filter(e => e.id !== id);
    setExpenses(next);
    onUpdate('transportationExpenses', next);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fuel': return <Fuel size={20} color={isDark ? '#93c5fd' : '#2563eb'} />;
      case 'toll': return <Ticket size={20} color={isDark ? '#fcd34d' : '#d97706'} />;
      case 'parking': return <ParkingCircle size={20} color={isDark ? '#86efac' : '#16a34a'} />;
      default: return <Fuel size={20} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fuel': return 'Fuel';
      case 'toll': return 'Toll';
      case 'parking': return 'Parking';
      default: return type;
    }
  };

  return (
    <WizardCard title="Travel Expenses" scrollable={!embedded} noPadding={true}>
      <View className="p-4 gap-4">

        {/* Add Buttons */}
        <View className="flex-row gap-3">
          <AddButton
            label="Fuel"
            icon={<Fuel size={16} color="white" />}
            onPress={() => addExpense('fuel')}
            color="bg-blue-600"
          />
          <AddButton
            label="Toll"
            icon={<Ticket size={16} color="white" />}
            onPress={() => addExpense('toll')}
            color="bg-amber-600"
          />
          <AddButton
            label="Parking"
            icon={<ParkingCircle size={16} color="white" />}
            onPress={() => addExpense('parking')}
            color="bg-green-600"
          />
        </View>

        {/* List */}
        <Animated.View layout={LinearTransition.springify()} className="gap-3">
          {expenses.length === 0 ? (
            <View className="p-6 items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <Text className="text-slate-400 dark:text-slate-500 text-center">No travel expenses added.</Text>
            </View>
          ) : (
            expenses.map((expense, index) => (
              <Animated.View
                key={expense.id}
                entering={FadeInDown.delay(index * 100)}
                className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 items-center justify-center shadow-sm">
                      {getTypeIcon(expense.expenseType)}
                    </View>
                    <Text className="font-semibold text-slate-700 dark:text-slate-200">
                      {getTypeLabel(expense.expenseType)}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeExpense(expense.id)}>
                    <Text className="text-xs text-red-500 font-medium">Remove</Text>
                  </Pressable>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-xs text-slate-500 mb-1">Amount</Text>
                    <TextInput
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-bold"
                      keyboardType="decimal-pad"
                      value={expense.amount.toString()}
                      onChangeText={(t) => updateExpense(expense.id, { amount: parseFloat(t) || 0 })}
                    />
                  </View>
                  <View className="flex-[2]">
                    <Text className="text-xs text-slate-500 mb-1">Description (Optional)</Text>
                    <TextInput
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                      value={expense.description}
                      onChangeText={(t) => updateExpense(expense.id, { description: t })}
                      placeholder="e.g. Shell Station"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </Animated.View>

      </View>
    </WizardCard>
  );
}

function AddButton({ label, icon, onPress, color }: any) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${color} active:opacity-90`}
    >
      {icon}
      <Text className="text-white font-semibold text-sm">{label}</Text>
    </Pressable>
  )
}
