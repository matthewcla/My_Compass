import Colors from '@/constants/Colors';
import type { PCSSegment, PCSSegmentMode } from '@/types/pcs';
import * as Haptics from 'expo-haptics';
import {
  Bus,
  Car,
  Check,
  DollarSign,
  MapPin,
  Minus,
  Pencil,
  Plane,
  Plus
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View, useColorScheme } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';

// ─── Props ────────────────────────────────────────────────────────────

export interface TravelStep1Props {
  segments?: PCSSegment[];
  actualMileage: number;
  onSegmentOverride: (segmentId: string, overrides: Partial<PCSSegment>) => void;
  onMileageUpdate: (mileage: number) => void;
  embedded?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────

const MALT_RATE = 0.21;

const MODE_META: Record<string, { label: string; icon: typeof Car; emoji: string }> = {
  POV: { label: 'POV', icon: Car, emoji: '🚗' },
  AIR: { label: 'Air', icon: Plane, emoji: '✈️' },
  MIXED: { label: 'Mixed', icon: MapPin, emoji: '🔀' },
  GOV_VEHICLE: { label: 'Gov Vehicle', icon: Bus, emoji: '🚐' },
};

const ALL_MODES: PCSSegmentMode[] = ['POV', 'AIR', 'MIXED', 'GOV_VEHICLE'];

const formatCurrency = (value: number): string => `$${value.toFixed(2)}`;
const toDateOnly = (value: string): string => {
  if (!value) return '';
  return value.includes('T') ? value.slice(0, 10) : value;
};
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

// ─── Segment Override Tracker ─────────────────────────────────────────

interface SegmentOverrides {
  departureDate?: string;
  arrivalDate?: string;
  mode?: PCSSegmentMode;
}

// ─── Main Component ───────────────────────────────────────────────────

export function TravelStep1TripDetails({
  segments = [],
  actualMileage,
  onSegmentOverride,
  onMileageUpdate,
  embedded = false,
}: TravelStep1Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const themeColors = Colors[colorScheme];

  // Segments the user has explicitly confirmed (collapsed after "Looks Good")
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  // Track local overrides for visual diffing (segmentId -> overrides)
  const [overrides, setOverrides] = useState<Record<string, SegmentOverrides>>({});

  // Local mileage state for immediate UI feedback
  const [localMileage, setLocalMileage] = useState(Math.max(0, actualMileage || 0));

  const maltPreview = localMileage * MALT_RATE;

  // Confirm a segment — collapses it with green badge
  const confirmSegment = useCallback((segmentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    setConfirmedIds((prev) => new Set(prev).add(segmentId));
  }, []);

  // Re-open a confirmed segment for editing
  const reopenSegment = useCallback((segmentId: string) => {
    Haptics.selectionAsync().catch(() => undefined);
    setConfirmedIds((prev) => {
      const next = new Set(prev);
      next.delete(segmentId);
      return next;
    });
  }, []);

  const applyOverride = useCallback(
    (segmentId: string, field: keyof SegmentOverrides, value: string) => {
      setOverrides((prev) => ({
        ...prev,
        [segmentId]: { ...prev[segmentId], [field]: value },
      }));

      // Build the PCSSegment partial patch
      const seg = segments.find((s) => s.id === segmentId);
      if (!seg) return;

      if (field === 'departureDate' || field === 'arrivalDate') {
        onSegmentOverride(segmentId, {
          dates: {
            ...seg.dates,
            ...(field === 'departureDate' ? { projectedDeparture: value } : {}),
            ...(field === 'arrivalDate' ? { projectedArrival: value } : {}),
          },
        });
      } else if (field === 'mode') {
        onSegmentOverride(segmentId, {
          userPlan: { ...seg.userPlan, mode: value as PCSSegmentMode },
        });
      }
    },
    [segments, onSegmentOverride],
  );

  const updateMileage = useCallback(
    (next: number) => {
      const clamped = clamp(next, 0, 10000);
      setLocalMileage(clamped);
      onMileageUpdate(clamped);
    },
    [onMileageUpdate],
  );

  // Determine if a segment has been edited
  const isEdited = useCallback(
    (segmentId: string) => {
      const o = overrides[segmentId];
      return !!o && (o.departureDate !== undefined || o.arrivalDate !== undefined || o.mode !== undefined);
    },
    [overrides],
  );

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <View className={`gap-4 ${embedded ? 'pt-2 pb-2' : 'pt-6 pb-6 px-4'}`}>
      {/* ── Segment Confirmation Cards ── */}
      {segments.length > 0 && (
        <View>
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            Verify Each Segment
          </Text>

          <Animated.View layout={LinearTransition.springify()} className="gap-3">
            {segments.map((seg, idx) => {
              const isConfirmed = confirmedIds.has(seg.id);
              const edited = isEdited(seg.id);
              const segOverrides = overrides[seg.id] || {};

              // Resolve displayed values (override or original)
              const displayDeparture = segOverrides.departureDate ?? toDateOnly(seg.dates.projectedDeparture);
              const displayArrival = segOverrides.arrivalDate ?? toDateOnly(seg.dates.projectedArrival);
              const displayMode = segOverrides.mode ?? seg.userPlan.mode;

              const originalDeparture = toDateOnly(seg.dates.projectedDeparture);
              const originalArrival = toDateOnly(seg.dates.projectedArrival);
              const originalMode = seg.userPlan.mode;

              const modeMeta = MODE_META[displayMode || ''] || { label: displayMode || 'TBD', emoji: '📍' };

              return (
                <Animated.View
                  key={seg.id}
                  entering={FadeInDown.delay(idx * 60)}
                  layout={LinearTransition.springify()}
                >
                  <View
                    className={`bg-white dark:bg-slate-900/80 rounded-2xl border overflow-hidden ${isConfirmed
                        ? 'border-emerald-300 dark:border-emerald-700/50'
                        : 'border-blue-300 dark:border-blue-600/50'
                      }`}
                  >
                    {/* ── Card Header (always visible) ── */}
                    <View className="p-4 pb-2">
                      <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center gap-2">
                          <View className={`w-6 h-6 rounded-full items-center justify-center ${isConfirmed
                              ? 'bg-emerald-100 dark:bg-emerald-900/30'
                              : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                            {isConfirmed ? (
                              <Check size={13} color={isDark ? '#34d399' : '#059669'} strokeWidth={3} />
                            ) : (
                              <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                {idx + 1}
                              </Text>
                            )}
                          </View>
                          <Text className="text-sm font-bold text-slate-900 dark:text-white">
                            {seg.title || seg.location.name}
                          </Text>
                        </View>

                        {/* Badge — only shown after user action */}
                        {isConfirmed && (
                          <View className={`rounded-full px-2 py-0.5 ${edited
                              ? 'bg-amber-100 dark:bg-amber-900/30'
                              : 'bg-emerald-100 dark:bg-emerald-900/30'
                            }`}>
                            <Text className={`text-[10px] font-semibold ${edited
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-emerald-700 dark:text-emerald-400'
                              }`}>
                              {edited ? 'EDITED ✓' : 'CONFIRMED ✓'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {isConfirmed ? (
                      /* ── Collapsed Confirmed State ── */
                      <Pressable onPress={() => reopenSegment(seg.id)} className="px-4 pb-3">
                        <View className="flex-row flex-wrap gap-x-4 gap-y-1 mb-2">
                          <Text className="text-xs text-slate-500 dark:text-slate-400">
                            📍 {seg.location.name}
                          </Text>
                          <Text className="text-xs text-slate-500 dark:text-slate-400">
                            📅 {displayDeparture} → {displayArrival}
                          </Text>
                          <Text className="text-xs text-slate-500 dark:text-slate-400">
                            {modeMeta.emoji} {modeMeta.label}
                          </Text>
                          <Text className="text-xs text-slate-500 dark:text-slate-400">
                            🕐 {seg.entitlements.authorizedTravelDays}d travel
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1 self-end">
                          <Pencil size={11} color={isDark ? '#64748b' : '#94a3b8'} />
                          <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            Tap to edit
                          </Text>
                        </View>
                      </Pressable>
                    ) : (
                      /* ── Expanded Edit State (default) ── */
                      <Animated.View
                        entering={FadeInDown.duration(200)}
                        exiting={FadeOutUp.duration(150)}
                        className="px-4 pb-4 gap-4"
                      >
                        {/* Summary info */}
                        <View className="flex-row flex-wrap gap-x-4 gap-y-1">
                          <Text className="text-xs text-slate-500 dark:text-slate-400">
                            📍 {seg.location.name}
                          </Text>
                          <Text className="text-xs text-slate-500 dark:text-slate-400">
                            🕐 {seg.entitlements.authorizedTravelDays}d authorized travel
                          </Text>
                        </View>

                        {/* Dates */}
                        <View className="gap-2">
                          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Dates
                          </Text>
                          <View className="flex-row gap-3">
                            <View className="flex-1">
                              <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                Departure
                              </Text>
                              <TextInput
                                value={displayDeparture}
                                onChangeText={(v) => applyOverride(seg.id, 'departureDate', v)}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white font-semibold"
                              />
                              {segOverrides.departureDate && segOverrides.departureDate !== originalDeparture && (
                                <Text className="text-[10px] text-slate-400 mt-1 line-through">
                                  Planned: {originalDeparture}
                                </Text>
                              )}
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                Arrival
                              </Text>
                              <TextInput
                                value={displayArrival}
                                onChangeText={(v) => applyOverride(seg.id, 'arrivalDate', v)}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white font-semibold"
                              />
                              {segOverrides.arrivalDate && segOverrides.arrivalDate !== originalArrival && (
                                <Text className="text-[10px] text-slate-400 mt-1 line-through">
                                  Planned: {originalArrival}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>

                        {/* Travel Mode */}
                        <View className="gap-2">
                          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Travel Mode
                          </Text>
                          <View className="flex-row flex-wrap gap-2">
                            {ALL_MODES.map((mode) => {
                              const meta = MODE_META[mode];
                              const Icon = meta.icon;
                              const selected = displayMode === mode;

                              return (
                                <Pressable
                                  key={mode}
                                  onPress={() => {
                                    Haptics.selectionAsync().catch(() => undefined);
                                    applyOverride(seg.id, 'mode', mode);
                                  }}
                                  className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${selected
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-500'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                  <Icon
                                    size={14}
                                    color={selected ? themeColors.tint : (isDark ? '#94a3b8' : '#64748b')}
                                    strokeWidth={2.5}
                                  />
                                  <Text
                                    className={`text-xs font-semibold ${selected
                                      ? 'text-blue-700 dark:text-blue-300'
                                      : 'text-slate-600 dark:text-slate-300'
                                      }`}
                                  >
                                    {meta.label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                          {segOverrides.mode && segOverrides.mode !== originalMode && (
                            <Text className="text-[10px] text-slate-400 line-through">
                              Planned: {originalMode || 'TBD'}
                            </Text>
                          )}
                        </View>

                        {/* "Looks Good" Confirm Button */}
                        <Pressable
                          onPress={() => confirmSegment(seg.id)}
                          className="flex-row items-center justify-center gap-1.5 bg-emerald-600 dark:bg-emerald-500 rounded-lg py-3 mt-1 active:opacity-80"
                        >
                          <Check size={16} color="#ffffff" strokeWidth={2.5} />
                          <Text className="text-sm font-bold text-white">
                            {edited ? 'Save Changes' : 'Looks Good'}
                          </Text>
                        </Pressable>
                      </Animated.View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>
        </View>
      )}

      {/* ── Actual Mileage ── */}
      <View className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center">
              <MapPin size={16} color={themeColors.tint} />
            </View>
            <View>
              <Text className="text-slate-900 dark:text-white font-bold">Actual Mileage</Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400">
                Reconciled from odometer
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => updateMileage(localMileage - 10)}
              className="h-9 w-9 rounded-full border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800 items-center justify-center"
            >
              <Minus size={16} color={isDark ? '#e2e8f0' : '#0f172a'} />
            </Pressable>
            <Pressable
              onPress={() => updateMileage(localMileage + 10)}
              className="h-9 w-9 rounded-full border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800 items-center justify-center"
            >
              <Plus size={16} color={isDark ? '#e2e8f0' : '#0f172a'} />
            </Pressable>
          </View>

          <View className="flex-row items-center">
            <TextInput
              value={`${localMileage}`}
              onChangeText={(next) => {
                const sanitized = next.replace(/[^0-9]/g, '');
                updateMileage(Number(sanitized || 0));
              }}
              keyboardType="number-pad"
              className="text-2xl font-black text-slate-900 dark:text-white min-w-[94px] text-right"
            />
            <Text className="ml-2 text-slate-500 dark:text-slate-400 font-semibold">mi</Text>
          </View>
        </View>
      </View>

      {/* ── MALT Preview ── */}
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
          Based on {localMileage.toLocaleString()} miles × ${MALT_RATE.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}
