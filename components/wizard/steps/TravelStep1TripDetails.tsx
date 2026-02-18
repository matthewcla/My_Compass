import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { usePCSStore } from '@/store/usePCSStore';
import { addDays, eachDayOfInterval, format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Bus, CalendarDays, Car, DollarSign, MapPin, Minus, Plane, Plus } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, Pressable, ScrollView, Text, TextInput, View, useColorScheme } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

interface TravelStep1Props {
  pcsOrderId?: string;
  startDate: string;
  endDate: string;
  travelMode?: 'POV' | 'AIR' | 'MIXED' | 'GOV_VEHICLE';
  originZip: string;
  destinationZip: string;
  estimatedMileage: number;
  actualMileage: number;
  onUpdate: (field: string, value: any) => void;
  embedded?: boolean;
}

interface TravelStep1FormData {
  pcsOrderId: string;
  startDate: string;
  endDate: string;
  travelMode: 'POV' | 'AIR' | 'MIXED' | 'GOV_VEHICLE' | '';
  originZip: string;
  destinationZip: string;
  actualMileage: number;
}

const MALT_RATE = 0.21;
const ZIP_REGEX = /^\d{5}$/;

const toDateOnly = (value: string): string => {
  if (!value) return '';
  return value.includes('T') ? value.slice(0, 10) : value;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

// Offline-safe ZIP mileage estimator to avoid remote calls in wizard flow.
const estimateMileageFromZips = (originZip: string, destinationZip: string): number => {
  if (!ZIP_REGEX.test(originZip) || !ZIP_REGEX.test(destinationZip)) {
    return 0;
  }

  const originRegion = Number(originZip.slice(0, 3));
  const destinationRegion = Number(destinationZip.slice(0, 3));
  const originLocal = Number(originZip.slice(3, 5));
  const destinationLocal = Number(destinationZip.slice(3, 5));

  const regionalDelta = Math.abs(originRegion - destinationRegion) * 3.8;
  const localDelta = Math.abs(originLocal - destinationLocal) * 1.2;

  return clamp(Math.round(regionalDelta + localDelta + 35), 25, 4500);
};

const formatCurrency = (value: number): string => `$${value.toFixed(2)}`;

const TRAVEL_MODE_OPTIONS = [
  {
    id: 'POV',
    label: 'POV',
    subtitle: 'Personal vehicle',
    icon: Car,
  },
  {
    id: 'AIR',
    label: 'Air',
    subtitle: 'Commercial flight',
    icon: Plane,
  },
  {
    id: 'MIXED',
    label: 'Mixed',
    subtitle: 'Multiple modes',
    icon: MapPin,
  },
  {
    id: 'GOV_VEHICLE',
    label: 'Gov Vehicle',
    subtitle: 'Command vehicle',
    icon: Bus,
  },
] as const;

export function TravelStep1TripDetails({
  pcsOrderId,
  startDate,
  endDate,
  travelMode,
  originZip,
  destinationZip,
  estimatedMileage,
  actualMileage,
  onUpdate,
  embedded = false,
}: TravelStep1Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const themeColors = Colors[colorScheme];
  const activeOrder = usePCSStore((state) => state.activeOrder);
  const [showOrderPicker, setShowOrderPicker] = useState(false);

  const {
    register,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<TravelStep1FormData>({
    mode: 'onChange',
    defaultValues: {
      pcsOrderId: pcsOrderId ?? activeOrder?.orderNumber ?? '',
      startDate: toDateOnly(startDate),
      endDate: toDateOnly(endDate),
      travelMode: travelMode ?? '',
      originZip,
      destinationZip,
      actualMileage: Math.max(0, actualMileage || 0),
    },
  });

  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');
  const watchedOriginZip = watch('originZip');
  const watchedDestinationZip = watch('destinationZip');
  const watchedActualMileage = watch('actualMileage');
  const watchedTravelMode = watch('travelMode');
  const watchedOrderId = watch('pcsOrderId');
  const lastMileagePushed = useRef<number | null>(null);

  useEffect(() => {
    register('pcsOrderId', {
      required: 'PCS order is required.',
    });
    register('startDate', {
      required: 'Start date is required.',
    });
    register('endDate', {
      required: 'End date is required.',
      validate: (value) => {
        if (!watchedStartDate || !value) return true;
        return value >= watchedStartDate || 'End date must be on/after start date.';
      },
    });
    register('travelMode', {
      required: 'Select a travel mode.',
    });
  }, [register, watchedStartDate]);

  useEffect(() => {
    setValue('startDate', toDateOnly(startDate), { shouldValidate: true });
  }, [setValue, startDate]);

  useEffect(() => {
    setValue('endDate', toDateOnly(endDate), { shouldValidate: true });
  }, [setValue, endDate]);

  useEffect(() => {
    setValue('originZip', originZip, { shouldValidate: true });
  }, [originZip, setValue]);

  useEffect(() => {
    setValue('destinationZip', destinationZip, { shouldValidate: true });
  }, [destinationZip, setValue]);

  useEffect(() => {
    setValue('actualMileage', Math.max(0, actualMileage || 0), {
      shouldValidate: true,
    });
  }, [actualMileage, setValue]);

  useEffect(() => {
    setValue('travelMode', travelMode ?? '', { shouldValidate: true });
  }, [setValue, travelMode]);

  useEffect(() => {
    const nextOrder = pcsOrderId ?? activeOrder?.orderNumber ?? '';
    if (nextOrder) {
      setValue('pcsOrderId', nextOrder, { shouldValidate: true });
    }
  }, [activeOrder?.orderNumber, pcsOrderId, setValue]);

  useEffect(() => {
    if (!watchedStartDate || !watchedEndDate) return;
    if (watchedEndDate < watchedStartDate) {
      const nextEnd = format(addDays(new Date(watchedStartDate), 1), 'yyyy-MM-dd');
      setValue('endDate', nextEnd, { shouldValidate: true });
      onUpdate('endDate', nextEnd);
    }
  }, [watchedEndDate, watchedStartDate, setValue, onUpdate]);

  const estimatedMileageFromZips = useMemo(
    () => estimateMileageFromZips(watchedOriginZip, watchedDestinationZip),
    [watchedOriginZip, watchedDestinationZip],
  );

  useEffect(() => {
    if (!estimatedMileageFromZips) return;
    if (lastMileagePushed.current === estimatedMileageFromZips) return;
    lastMileagePushed.current = estimatedMileageFromZips;
    onUpdate('estimatedMileage', estimatedMileageFromZips);
  }, [estimatedMileageFromZips, onUpdate]);

  const displayedEstimatedMileage = estimatedMileageFromZips || estimatedMileage || 0;
  const maltPreview = watchedActualMileage * MALT_RATE;

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    const start = watchedStartDate;
    const end = watchedEndDate;

    const rangeColor = isDark ? Colors.dark.navyLight : '#DBEAFE';
    const rangeTextColor = isDark ? '#FFFFFF' : themeColors.tint;

    if (start && end) {
      const startDateValue = new Date(`${start}T12:00:00`);
      const endDateValue = new Date(`${end}T12:00:00`);

      if (startDateValue <= endDateValue) {
        const range = eachDayOfInterval({
          start: startDateValue,
          end: endDateValue,
        });

        range.forEach((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          let mark: any = { color: rangeColor, textColor: rangeTextColor };

          if (dayKey === start) {
            mark = {
              ...mark,
              startingDay: true,
              color: themeColors.tint,
              textColor: '#ffffff',
            };
          }

          if (dayKey === end) {
            mark = {
              ...mark,
              endingDay: true,
              color: themeColors.tint,
              textColor: '#ffffff',
            };
          }

          marks[dayKey] = mark;
        });
      }
    } else if (start) {
      marks[start] = {
        startingDay: true,
        endingDay: true,
        color: themeColors.tint,
        textColor: '#ffffff',
      };
    }

    return marks;
  }, [isDark, themeColors.tint, watchedEndDate, watchedStartDate]);

  const handleDayPress = (day: DateData) => {
    Haptics.selectionAsync().catch(() => undefined);

    if (watchedStartDate && watchedEndDate) {
      setValue('startDate', day.dateString, { shouldValidate: true });
      setValue('endDate', '', { shouldValidate: true });
      onUpdate('startDate', day.dateString);
      onUpdate('endDate', '');
      trigger(['startDate', 'endDate']);
      return;
    }

    if (!watchedStartDate) {
      setValue('startDate', day.dateString, { shouldValidate: true });
      onUpdate('startDate', day.dateString);
      trigger('startDate');
      return;
    }

    if (day.dateString < watchedStartDate) {
      setValue('startDate', day.dateString, { shouldValidate: true });
      onUpdate('startDate', day.dateString);
      trigger('startDate');
      return;
    }

    setValue('endDate', day.dateString, { shouldValidate: true });
    onUpdate('endDate', day.dateString);
    trigger('endDate');
  };

  const updateActualMileage = (nextValue: number) => {
    const clamped = clamp(nextValue, 0, 10000);
    setValue('actualMileage', clamped, { shouldValidate: true });
    onUpdate('actualMileage', clamped);
    trigger('actualMileage');
  };

  const setTravelMode = (mode: 'POV' | 'AIR' | 'MIXED' | 'GOV_VEHICLE') => {
    Haptics.selectionAsync().catch(() => undefined);
    setValue('travelMode', mode, { shouldValidate: true });
    onUpdate('travelMode', mode);
    trigger('travelMode');
  };

  const errorMessages = useMemo(() => {
    const messages: string[] = [];

    if (errors.pcsOrderId?.message) messages.push(errors.pcsOrderId.message);
    if (errors.startDate?.message) messages.push(errors.startDate.message);
    if (errors.endDate?.message) messages.push(errors.endDate.message);
    if (errors.travelMode?.message) messages.push(errors.travelMode.message);
    if (errors.originZip?.message) messages.push(errors.originZip.message);
    if (errors.destinationZip?.message) messages.push(errors.destinationZip.message);
    if (errors.actualMileage?.message) messages.push(errors.actualMileage.message);

    return messages;
  }, [errors]);

  return (
    <WizardCard title="Trip Details" scrollable={!embedded} noPadding={true}>
      <View className="gap-6 pt-6 pb-6 px-4 md:px-6">
        <View>
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            PCS Order
          </Text>
          <Pressable
            onPress={() => {
              setShowOrderPicker(true);
              Haptics.selectionAsync().catch(() => undefined);
            }}
            className="bg-inputBackground p-4 rounded-xl border border-slate-200 dark:border-slate-700 active:scale-[0.99]"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  {watchedOrderId || 'Select PCS order'}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {activeOrder
                    ? `${activeOrder.gainingCommand.name} • NLT ${toDateOnly(activeOrder.reportNLT)}`
                    : 'No active order found'}
                </Text>
              </View>
              <Text className="text-blue-600 dark:text-blue-400 font-semibold">Choose</Text>
            </View>
          </Pressable>
          {errors.pcsOrderId?.message && (
            <Text className="text-red-500 text-xs mt-2">{errors.pcsOrderId.message}</Text>
          )}
        </View>

        <View>
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            Date Range
          </Text>
          <View className="bg-cardBackground dark:bg-black rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
            <Calendar
              key={colorScheme}
              current={watchedStartDate || undefined}
              onDayPress={handleDayPress}
              markingType="period"
              markedDates={markedDates}
              theme={{
                calendarBackground: isDark ? themeColors.background : '#ffffff',
                textSectionTitleColor: isDark ? '#94a3b8' : '#b6c1cd',
                selectedDayBackgroundColor: themeColors.tint,
                selectedDayTextColor: '#ffffff',
                todayTextColor: themeColors.tint,
                dayTextColor: isDark ? '#e2e8f0' : '#2d4150',
                textDisabledColor: isDark ? '#334155' : '#d9e1e8',
                arrowColor: themeColors.tint,
                monthTextColor: isDark ? '#f8fafc' : '#1e293b',
                textDayFontWeight: '600',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '500',
              }}
            />
          </View>
          <View className="flex-row items-center justify-between mt-3 px-1">
            <Pressable
              onPress={() => {
                setValue('startDate', '', { shouldValidate: true });
                setValue('endDate', '', { shouldValidate: true });
                onUpdate('startDate', '');
                onUpdate('endDate', '');
              }}
            >
              <Text className="text-xs text-slate-500 mb-1">Start Date</Text>
              <Text
                className={`font-bold ${watchedStartDate ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                  }`}
              >
                {watchedStartDate || 'Select'}
              </Text>
            </Pressable>
            <View className="items-end">
              <Text className="text-xs text-slate-500 mb-1">End Date</Text>
              <Text
                className={`font-bold ${watchedEndDate ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                  }`}
              >
                {watchedEndDate || 'Select'}
              </Text>
            </View>
          </View>
          {(errors.startDate?.message || errors.endDate?.message) && (
            <View className="mt-2">
              {errors.startDate?.message && (
                <Text className="text-red-500 text-xs">{errors.startDate.message}</Text>
              )}
              {errors.endDate?.message && (
                <Text className="text-red-500 text-xs">{errors.endDate.message}</Text>
              )}
            </View>
          )}
        </View>

        <View>
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            Travel Mode
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {TRAVEL_MODE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = watchedTravelMode === option.id;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => setTravelMode(option.id)}
                  className={`w-[48%] rounded-2xl border p-3 ${selected
                      ? 'bg-blue-50 dark:bg-slate-800 border-blue-500 dark:border-blue-500'
                      : 'bg-inputBackground border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <View className="flex-row items-start justify-between">
                    <View
                      className={`w-9 h-9 rounded-full items-center justify-center ${selected
                          ? 'bg-blue-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                    >
                      <Icon
                        size={18}
                        color={selected ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
                        strokeWidth={2.5}
                      />
                    </View>
                    {selected && <View className="w-2 h-2 rounded-full bg-blue-500 mt-1" />}
                  </View>
                  <Text
                    className={`font-bold mt-3 ${selected
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-200'
                      }`}
                  >
                    {option.label}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {option.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {errors.travelMode?.message && (
            <Text className="text-red-500 text-xs mt-2">{errors.travelMode.message}</Text>
          )}
        </View>

        <View className="gap-3">
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Mileage
          </Text>

          <View className="bg-inputBackground border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center mr-2">
                <MapPin size={16} color={themeColors.tint} />
              </View>
              <Text className="text-slate-900 dark:text-white font-bold">
                Auto Mileage Estimate
              </Text>
            </View>

            <View className="flex-row gap-3">
              <Controller
                control={control}
                name="originZip"
                rules={{
                  required: 'Origin ZIP is required.',
                  pattern: {
                    value: ZIP_REGEX,
                    message: 'Origin ZIP must be 5 digits.',
                  },
                }}
                render={({ field: { value } }) => (
                  <View className="flex-1">
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Origin ZIP
                    </Text>
                    <TextInput
                      value={value}
                      onChangeText={(next) => {
                        const normalized = next.replace(/[^0-9]/g, '').slice(0, 5);
                        setValue('originZip', normalized, { shouldValidate: true });
                        onUpdate('originZip', normalized);
                      }}
                      keyboardType="number-pad"
                      maxLength={5}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white"
                      placeholder="00000"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    />
                  </View>
                )}
              />

              <Controller
                control={control}
                name="destinationZip"
                rules={{
                  required: 'Destination ZIP is required.',
                  pattern: {
                    value: ZIP_REGEX,
                    message: 'Destination ZIP must be 5 digits.',
                  },
                }}
                render={({ field: { value } }) => (
                  <View className="flex-1">
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Destination ZIP
                    </Text>
                    <TextInput
                      value={value}
                      onChangeText={(next) => {
                        const normalized = next.replace(/[^0-9]/g, '').slice(0, 5);
                        setValue('destinationZip', normalized, { shouldValidate: true });
                        onUpdate('destinationZip', normalized);
                      }}
                      keyboardType="number-pad"
                      maxLength={5}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white"
                      placeholder="00000"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    />
                  </View>
                )}
              />
            </View>

            {(errors.originZip?.message || errors.destinationZip?.message) && (
              <View className="mt-2">
                {errors.originZip?.message && (
                  <Text className="text-red-500 text-xs">{errors.originZip.message}</Text>
                )}
                {errors.destinationZip?.message && (
                  <Text className="text-red-500 text-xs">{errors.destinationZip.message}</Text>
                )}
              </View>
            )}

            <View className="mt-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-3">
              <Text className="text-xs text-slate-500 dark:text-slate-300 mb-1">
                Estimated
              </Text>
              <Text className="text-xl font-extrabold text-blue-700 dark:text-blue-300">
                {displayedEstimatedMileage.toLocaleString()} mi
              </Text>
            </View>
          </View>

          <Controller
            control={control}
            name="actualMileage"
            rules={{
              required: 'Actual mileage is required.',
              min: {
                value: 0,
                message: 'Actual mileage cannot be negative.',
              },
            }}
            render={({ field: { value } }) => (
              <View className="bg-inputBackground border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-900 dark:text-white font-bold">
                    Actual Mileage
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Reconciled from odometer
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() => updateActualMileage((value || 0) - 10)}
                      className="h-9 w-9 rounded-full border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800 items-center justify-center"
                    >
                      <Minus size={16} color={isDark ? '#e2e8f0' : '#0f172a'} />
                    </Pressable>
                    <Pressable
                      onPress={() => updateActualMileage((value || 0) + 10)}
                      className="h-9 w-9 rounded-full border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800 items-center justify-center"
                    >
                      <Plus size={16} color={isDark ? '#e2e8f0' : '#0f172a'} />
                    </Pressable>
                  </View>

                  <View className="flex-row items-center">
                    <TextInput
                      value={`${value || 0}`}
                      onChangeText={(next) => {
                        const sanitized = next.replace(/[^0-9]/g, '');
                        updateActualMileage(Number(sanitized || 0));
                      }}
                      keyboardType="number-pad"
                      className="text-2xl font-black text-slate-900 dark:text-white min-w-[94px] text-right"
                    />
                    <Text className="ml-2 text-slate-500 dark:text-slate-400 font-semibold">
                      mi
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
          {errors.actualMileage?.message && (
            <Text className="text-red-500 text-xs">{errors.actualMileage.message}</Text>
          )}
        </View>

        <View className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4">
          <View className="flex-row items-center mb-1.5">
            <View className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center mr-2">
              <DollarSign size={15} color={themeColors.tint} />
            </View>
            <Text className="text-slate-700 dark:text-slate-200 font-semibold text-sm">
              MALT Preview
            </Text>
          </View>
          <Text className="text-2xl font-black text-blue-700 dark:text-blue-300">
            Estimated MALT: {formatCurrency(maltPreview)}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Based on {(watchedActualMileage || 0).toLocaleString()} miles × ${MALT_RATE.toFixed(2)}
          </Text>
        </View>

        {errorMessages.length > 0 && (
          <View className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl p-3">
            {errorMessages.map((message, index) => (
              <Text key={`${message}-${index}`} className="text-red-600 dark:text-red-400 text-xs mb-1">
                • {message}
              </Text>
            ))}
          </View>
        )}
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={showOrderPicker}
        onRequestClose={() => setShowOrderPicker(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <Pressable className="absolute inset-0" onPress={() => setShowOrderPicker(false)} />
          <View className="bg-white dark:bg-slate-800 rounded-t-3xl max-h-[65%] overflow-hidden">
            <View className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <CalendarDays size={18} color={themeColors.tint} />
                <Text className="ml-2 text-lg font-bold text-slate-900 dark:text-white">
                  Select PCS Order
                </Text>
              </View>
              <Pressable onPress={() => setShowOrderPicker(false)}>
                <Text className="text-blue-600 dark:text-blue-400 font-semibold">Close</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
              {activeOrder ? (
                <Pressable
                  onPress={() => {
                    setValue('pcsOrderId', activeOrder.orderNumber, {
                      shouldValidate: true,
                    });
                    onUpdate('pcsOrderId', activeOrder.orderNumber);
                    setShowOrderPicker(false);
                    trigger('pcsOrderId');
                    Haptics.selectionAsync().catch(() => undefined);
                  }}
                  className={`rounded-xl border p-4 ${watchedOrderId === activeOrder.orderNumber
                      ? 'bg-blue-50 dark:bg-slate-700 border-blue-500 dark:border-blue-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <Text
                    className={`font-bold text-base ${watchedOrderId === activeOrder.orderNumber
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-900 dark:text-white'
                      }`}
                  >
                    {activeOrder.orderNumber}
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                    {activeOrder.gainingCommand.name} • Report NLT {toDateOnly(activeOrder.reportNLT)}
                  </Text>
                </Pressable>
              ) : (
                <View className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <Text className="text-slate-600 dark:text-slate-300 text-sm">
                    No active PCS order found in local store.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </WizardCard>
  );
}
