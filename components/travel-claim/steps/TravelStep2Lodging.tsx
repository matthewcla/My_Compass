/**
 * @deprecated This step is no longer used in the 3-step settlement flow.
 * Lodging expenses are now managed inline in request.tsx Step 2.
 * Kept for reference only.
 */
import { ReceiptUploader } from '@/components/travel-claim/ReceiptUploader';
import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Hotel,
  Plus,
  Trash2,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';

export interface LodgingExpense {
  id: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  nightlyRate: number;
  totalCost?: number;
  manualTotalOverride?: boolean;
  receiptUri?: string;
}

export interface TravelStep2Props {
  lodgingExpenses: LodgingExpense[];
  onUpdate: (field: 'lodgingExpenses', value: LodgingExpense[]) => void;
  embedded?: boolean;
}

interface LodgingStepFormData {
  lodgingExpenses: LodgingExpense[];
}

const TLE_DAILY_CAP = 150;

const toDateOnly = (value: string): string => {
  if (!value) return '';
  return value.includes('T') ? value.slice(0, 10) : value;
};

const todayDate = (): string => format(new Date(), 'yyyy-MM-dd');

const buildExpense = (): LodgingExpense => {
  const checkIn = todayDate();
  const checkOut = format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd');
  return {
    id: `lodging-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    hotelName: '',
    checkInDate: checkIn,
    checkOutDate: checkOut,
    nightlyRate: 150,
    totalCost: 150,
    manualTotalOverride: false,
    receiptUri: '',
  };
};

const calculateNights = (checkInDate: string, checkOutDate: string): number => {
  const start = new Date(`${toDateOnly(checkInDate)}T12:00:00`);
  const end = new Date(`${toDateOnly(checkOutDate)}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 1;
  }
  return Math.max(1, differenceInCalendarDays(end, start));
};

const resolveTotalCost = (expense: LodgingExpense): number => {
  const nights = calculateNights(expense.checkInDate, expense.checkOutDate);
  if (expense.manualTotalOverride) {
    return Math.max(0, Number(expense.totalCost || 0));
  }
  return Math.max(0, nights * Number(expense.nightlyRate || 0));
};

const formatMoney = (value: number): string => `$${value.toFixed(2)}`;

interface LodgingExpenseCardProps {
  expense: LodgingExpense;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<LodgingExpense>) => void;
  onDelete: () => void;
}

function LodgingExpenseCard({
  expense,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
}: LodgingExpenseCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const nights = calculateNights(expense.checkInDate, expense.checkOutDate);
  const resolvedTotal = resolveTotalCost(expense);
  const [pickerField, setPickerField] = useState<'checkInDate' | 'checkOutDate' | null>(null);

  const applyDate = (field: 'checkInDate' | 'checkOutDate', value: string) => {
    if (field === 'checkInDate') {
      const normalizedOut = expense.checkOutDate < value
        ? format(addDays(new Date(value), 1), 'yyyy-MM-dd')
        : expense.checkOutDate;

      onUpdate({
        checkInDate: value,
        checkOutDate: normalizedOut,
      });
      return;
    }

    const normalizedOut = value < expense.checkInDate
      ? format(addDays(new Date(expense.checkInDate), 1), 'yyyy-MM-dd')
      : value;

    onUpdate({ checkOutDate: normalizedOut });
  };

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(20).stiffness(180)}
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-inputBackground overflow-hidden"
    >
      <Pressable onPress={onToggle} className="px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center mr-3">
              <Hotel size={18} color={isDark ? '#93c5fd' : '#2563eb'} />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-white font-bold">
                {expense.hotelName.trim() || 'New Lodging Entry'}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {toDateOnly(expense.checkInDate)} to {toDateOnly(expense.checkOutDate)} • {nights} night
                {nights === 1 ? '' : 's'}
              </Text>
            </View>
          </View>

          <View className="items-end ml-3">
            <Text className="text-slate-900 dark:text-white font-extrabold">
              {formatMoney(resolvedTotal)}
            </Text>
            {expanded ? (
              <ChevronUp size={16} color={isDark ? '#cbd5e1' : '#475569'} />
            ) : (
              <ChevronDown size={16} color={isDark ? '#cbd5e1' : '#475569'} />
            )}
          </View>
        </View>
      </Pressable>

      {expanded && (
        <Animated.View
          entering={FadeInDown.duration(180)}
          exiting={FadeOutUp.duration(150)}
          className="px-4 pb-4 gap-3"
        >
          <View>
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Hotel Name
            </Text>
            <TextInput
              value={expense.hotelName}
              onChangeText={(value) => onUpdate({ hotelName: value })}
              placeholder="Navy Lodge San Diego"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white"
            />
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => {
                setPickerField('checkInDate');
                Haptics.selectionAsync().catch(() => undefined);
              }}
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5"
            >
              <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">Check-in</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-900 dark:text-white font-semibold">
                  {toDateOnly(expense.checkInDate)}
                </Text>
                <CalendarIcon size={14} color={isDark ? '#94a3b8' : '#64748b'} />
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                setPickerField('checkOutDate');
                Haptics.selectionAsync().catch(() => undefined);
              }}
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5"
            >
              <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">Check-out</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-900 dark:text-white font-semibold">
                  {toDateOnly(expense.checkOutDate)}
                </Text>
                <CalendarIcon size={14} color={isDark ? '#94a3b8' : '#64748b'} />
              </View>
            </Pressable>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Nightly Rate
              </Text>
              <View className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex-row items-center">
                <DollarSign size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  value={`${expense.nightlyRate || 0}`}
                  onChangeText={(raw) => {
                    const cleaned = raw.replace(/[^0-9.]/g, '');
                    const parsed = Number(cleaned || 0);
                    onUpdate({ nightlyRate: Number.isFinite(parsed) ? parsed : 0 });
                  }}
                  keyboardType="decimal-pad"
                  className="flex-1 text-slate-900 dark:text-white font-semibold ml-1"
                />
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Total Cost
              </Text>
              <View className="flex-row gap-1 mb-1">
                <Pressable
                  onPress={() => onUpdate({ manualTotalOverride: false })}
                  className={`px-2 py-1 rounded-full border ${!expense.manualTotalOverride
                      ? 'bg-blue-50 dark:bg-slate-700 border-blue-500'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <Text
                    className={`text-[11px] font-semibold ${!expense.manualTotalOverride
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-300'
                      }`}
                  >
                    Auto
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    onUpdate({
                      manualTotalOverride: true,
                      totalCost: resolveTotalCost(expense),
                    })
                  }
                  className={`px-2 py-1 rounded-full border ${expense.manualTotalOverride
                      ? 'bg-blue-50 dark:bg-slate-700 border-blue-500'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <Text
                    className={`text-[11px] font-semibold ${expense.manualTotalOverride
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-300'
                      }`}
                  >
                    Manual
                  </Text>
                </Pressable>
              </View>
              <View className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex-row items-center">
                <DollarSign size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  value={`${expense.manualTotalOverride ? expense.totalCost || 0 : resolveTotalCost(expense)}`}
                  onChangeText={(raw) => {
                    const cleaned = raw.replace(/[^0-9.]/g, '');
                    const parsed = Number(cleaned || 0);
                    if (expense.manualTotalOverride) {
                      onUpdate({ totalCost: Number.isFinite(parsed) ? parsed : 0 });
                    }
                  }}
                  editable={!!expense.manualTotalOverride}
                  keyboardType="decimal-pad"
                  className={`flex-1 font-semibold ml-1 ${expense.manualTotalOverride
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                    }`}
                />
              </View>
            </View>
          </View>

          <ReceiptUploader
            onPhotoSelected={(uri) => onUpdate({ receiptUri: uri })}
            existingUri={expense.receiptUri}
            label="Receipt Photo"
          />

          <Pressable
            onPress={onDelete}
            className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-3 py-2.5 flex-row items-center justify-center"
          >
            <Trash2 size={14} color={isDark ? '#fda4af' : '#dc2626'} />
            <Text className="text-red-600 dark:text-red-300 font-semibold ml-2">Delete Entry</Text>
          </Pressable>

          <Modal
            transparent
            animationType="fade"
            visible={!!pickerField}
            onRequestClose={() => setPickerField(null)}
          >
            <View className="flex-1 bg-black/70 justify-end">
              <Pressable className="absolute inset-0" onPress={() => setPickerField(null)} />
              <View className="bg-white dark:bg-slate-800 rounded-t-3xl overflow-hidden">
                <View className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-slate-900 dark:text-white">
                    Select {pickerField === 'checkInDate' ? 'Check-in' : 'Check-out'} Date
                  </Text>
                  <Pressable onPress={() => setPickerField(null)}>
                    <Text className="text-blue-600 dark:text-blue-400 font-semibold">Close</Text>
                  </Pressable>
                </View>
                <Calendar
                  current={pickerField === 'checkInDate' ? expense.checkInDate : expense.checkOutDate}
                  onDayPress={(day: DateData) => {
                    if (!pickerField) return;
                    applyDate(pickerField, day.dateString);
                    setPickerField(null);
                    Haptics.selectionAsync().catch(() => undefined);
                  }}
                  markedDates={{
                    [toDateOnly(expense.checkInDate)]: {
                      selected: true,
                      selectedColor: '#2563eb',
                    },
                    [toDateOnly(expense.checkOutDate)]: {
                      selected: true,
                      selectedColor: '#0ea5e9',
                    },
                  }}
                  theme={{
                    calendarBackground: isDark ? Colors.dark.background : '#ffffff',
                    dayTextColor: isDark ? '#e2e8f0' : '#1e293b',
                    monthTextColor: isDark ? '#f8fafc' : '#0f172a',
                    arrowColor: '#2563eb',
                    todayTextColor: '#2563eb',
                  }}
                />
              </View>
            </View>
          </Modal>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export function TravelStep2Lodging({
  lodgingExpenses,
  onUpdate,
  embedded = false,
}: TravelStep2Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<LodgingExpense[]>(
    lodgingExpenses?.map((entry) => ({
      ...entry,
      checkInDate: toDateOnly(entry.checkInDate || todayDate()),
      checkOutDate: toDateOnly(entry.checkOutDate || format(addDays(new Date(), 1), 'yyyy-MM-dd')),
      nightlyRate: Number(entry.nightlyRate || 0),
      manualTotalOverride: !!entry.manualTotalOverride,
      totalCost: Number(entry.totalCost || 0),
      receiptUri: entry.receiptUri || '',
    })) || [],
  );

  const {
    register,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<LodgingStepFormData>({
    mode: 'onChange',
    defaultValues: {
      lodgingExpenses: lodgingExpenses || [],
    },
  });

  useEffect(() => {
    register('lodgingExpenses', {
      validate: (value) => {
        if (!value || value.length === 0) return 'Add at least one lodging expense.';

        const missingHotel = value.find((entry) => !entry.hotelName.trim());
        if (missingHotel) return 'Each lodging entry needs a hotel name.';

        const badRate = value.find((entry) => Number(entry.nightlyRate || 0) <= 0);
        if (badRate) return 'Nightly rate must be greater than $0.';

        return true;
      },
    });
  }, [register]);

  useEffect(() => {
    const normalized = lodgingExpenses?.map((entry) => ({
      ...entry,
      checkInDate: toDateOnly(entry.checkInDate || todayDate()),
      checkOutDate: toDateOnly(entry.checkOutDate || format(addDays(new Date(), 1), 'yyyy-MM-dd')),
      nightlyRate: Number(entry.nightlyRate || 0),
      manualTotalOverride: !!entry.manualTotalOverride,
      totalCost: Number(entry.totalCost || 0),
      receiptUri: entry.receiptUri || '',
    })) || [];

    setExpenses(normalized);
    setValue('lodgingExpenses', normalized, { shouldValidate: true });
    trigger('lodgingExpenses');
  }, [lodgingExpenses, setValue, trigger]);

  const applyExpenses = (next: LodgingExpense[]) => {
    setExpenses(next);
    setValue('lodgingExpenses', next, { shouldValidate: true });
    trigger('lodgingExpenses');
    onUpdate('lodgingExpenses', next);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((previous) =>
      previous.includes(id)
        ? previous.filter((entryId) => entryId !== id)
        : [...previous, id],
    );
  };

  const handleAddLodging = () => {
    Haptics.selectionAsync().catch(() => undefined);
    const next = [...expenses, buildExpense()];
    applyExpenses(next);
    setExpandedIds((previous) => [...previous, next[next.length - 1].id]);
  };

  const updateEntry = (id: string, patch: Partial<LodgingExpense>) => {
    const next = expenses.map((entry) => {
      if (entry.id !== id) return entry;
      const merged = { ...entry, ...patch };

      if (!merged.manualTotalOverride) {
        merged.totalCost = resolveTotalCost(merged);
      }
      return merged;
    });

    applyExpenses(next);
  };

  const deleteEntry = (id: string) => {
    Haptics.selectionAsync().catch(() => undefined);
    const next = expenses.filter((entry) => entry.id !== id);
    applyExpenses(next);
    setExpandedIds((previous) => previous.filter((entryId) => entryId !== id));
  };

  const summary = useMemo(() => {
    const totalLodging = expenses.reduce(
      (sum, entry) => sum + resolveTotalCost(entry),
      0,
    );
    const totalNights = expenses.reduce(
      (sum, entry) => sum + calculateNights(entry.checkInDate, entry.checkOutDate),
      0,
    );
    const tleCap = totalNights * TLE_DAILY_CAP;
    const reimbursable = Math.min(totalLodging, tleCap);
    const capped = totalLodging > tleCap;

    return {
      totalLodging,
      totalNights,
      tleCap,
      reimbursable,
      capped,
    };
  }, [expenses]);

  return (
    <WizardCard title="Lodging Expenses" scrollable={!embedded} noPadding={true}>
      <View className="gap-5 pt-6 pb-6 px-4 md:px-6">
        <Pressable
          onPress={handleAddLodging}
          className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 px-4 py-3 flex-row items-center justify-center"
        >
          <View className="w-7 h-7 rounded-full bg-blue-600 items-center justify-center mr-2">
            <Plus size={14} color="#ffffff" strokeWidth={3} />
          </View>
          <Text className="text-blue-700 dark:text-blue-300 font-semibold">Add Lodging</Text>
        </Pressable>

        <Animated.View layout={LinearTransition.springify().damping(20).stiffness(180)} className="gap-3">
          {expenses.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 items-center bg-inputBackground">
              <Hotel size={22} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text className="text-slate-600 dark:text-slate-300 font-semibold mt-2">
                No lodging entries yet
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                Add your hotel stays to estimate TLE reimbursement.
              </Text>
            </View>
          ) : (
            expenses.map((expense) => (
              <LodgingExpenseCard
                key={expense.id}
                expense={expense}
                expanded={expandedIds.includes(expense.id)}
                onToggle={() => toggleExpanded(expense.id)}
                onUpdate={(patch) => updateEntry(expense.id, patch)}
                onDelete={() => deleteEntry(expense.id)}
              />
            ))
          )}
        </Animated.View>

        {errors.lodgingExpenses?.message && (
          <View className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-3">
            <Text className="text-red-600 dark:text-red-300 text-xs">
              {errors.lodgingExpenses.message}
            </Text>
          </View>
        )}

        <View className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-inputBackground p-4">
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            Summary
          </Text>

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-slate-600 dark:text-slate-300">Total Lodging</Text>
            <Text className="text-slate-900 dark:text-white font-bold">
              {formatMoney(summary.totalLodging)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-slate-600 dark:text-slate-300">
              TLE Cap ({summary.totalNights} nights × ${TLE_DAILY_CAP})
            </Text>
            <Text className="text-slate-900 dark:text-white font-bold">
              {formatMoney(summary.tleCap)}
            </Text>
          </View>

          <View className="h-px bg-slate-200 dark:bg-slate-700 my-2" />

          <View className="flex-row justify-between items-center">
            <Text className="text-slate-700 dark:text-slate-200 font-semibold">
              Reimbursable
            </Text>
            <Text
              className={`font-extrabold ${summary.capped
                  ? 'text-amber-600 dark:text-amber-300'
                  : 'text-emerald-600 dark:text-emerald-300'
                }`}
            >
              {formatMoney(summary.reimbursable)}
            </Text>
          </View>
        </View>
      </View>
    </WizardCard>
  );
}
