import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React from 'react';
import { StyleSheet, View } from 'react-native';

// ---------------------------------------------------------------------------
// HIGH-FIDELITY HUB SKELETON
// ---------------------------------------------------------------------------
// Mirrors exact layout of Hub dashboard cards to prevent layout shift.
// Uses staggered entry animations for cinematic bridge from StartupAnimation.
// ---------------------------------------------------------------------------

const ANIMATION_DELAY_BASE = 0;
const ANIMATION_DELAY_INCREMENT = 100;
const ANIMATION_DURATION = 400;
const SHIMMER_DURATION = 1500;

interface SkeletonBlockProps {
  index: number;
  height: number;
  children?: React.ReactNode;
  className?: string;
  style?: object;
}

/**
 * Animated skeleton block with staggered entry and shimmer effect
 */
function SkeletonBlock({ index, height, children, style }: SkeletonBlockProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.9)';
  const shimmerColors = isDark
    ? ['transparent', 'rgba(255,255,255,0.05)', 'transparent'] as const
    : ['transparent', 'rgba(255,255,255,0.4)', 'transparent'] as const;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: ANIMATION_DURATION,
        delay: ANIMATION_DELAY_BASE + (index * ANIMATION_DELAY_INCREMENT),
      }}
      style={[
        {
          height,
          borderRadius: 12,
          backgroundColor: bgColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {/* Shimmer Effect */}
      <MotiView
        from={{ translateX: -200 }}
        animate={{ translateX: 400 }}
        transition={{
          type: 'timing',
          duration: SHIMMER_DURATION,
          loop: true,
          delay: index * 200,
        }}
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { width: 200 }]}
        />
      </MotiView>
      {children}
    </MotiView>
  );
}

export function HubSkeleton() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const textPlaceholderBg = isDark ? 'rgba(71, 85, 105, 0.6)' : 'rgba(203, 213, 225, 0.8)';
  const accentBg = isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.3)';

  return (
    <View className="flex-1 p-4 pt-2.5 gap-6">

      {/* ====== StatusCard Skeleton ====== */}
      {/* Compact banner with left border accent (~45px) */}
      <SkeletonBlock
        index={0}
        height={45}
        style={{
          borderLeftWidth: 4,
          borderLeftColor: isDark ? '#60a5fa' : '#2563eb',
          borderRadius: 0,
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
        }}
      >
        <View className="flex-row items-center justify-between h-full px-3">
          <View className="flex-row items-center gap-2.5">
            {/* Icon placeholder */}
            <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: textPlaceholderBg }} />
            <View>
              {/* Title placeholder */}
              <View style={{ width: 80, height: 10, borderRadius: 4, backgroundColor: textPlaceholderBg, marginBottom: 4 }} />
              {/* Subtitle placeholder */}
              <View style={{ width: 120, height: 8, borderRadius: 4, backgroundColor: textPlaceholderBg }} />
            </View>
          </View>
          {/* Badge placeholder */}
          <View style={{ width: 60, height: 20, borderRadius: 10, backgroundColor: accentBg }} />
        </View>
      </SkeletonBlock>

      {/* ====== DiscoveryCard Skeleton ====== */}
      {/* Hero card with gradient background (~300px) */}
      <SkeletonBlock
        index={1}
        height={280}
        style={{
          borderRadius: 16,
        }}
      >
        <LinearGradient
          colors={['#1e293b', '#020617']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View className="p-5 flex-1 justify-between">
          {/* Header */}
          <View className="flex-row justify-between items-start">
            <View>
              <View style={{ width: 140, height: 20, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 8 }} />
              <View style={{ width: 180, height: 12, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            </View>
            {/* Icon placeholder */}
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </View>

          {/* Large number + Button */}
          <View>
            <View className="flex-row items-center gap-3 mb-6">
              {/* Big number */}
              <View style={{ width: 80, height: 48, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' }} />
              <View>
                <View style={{ width: 100, height: 12, borderRadius: 4, backgroundColor: 'rgba(52, 211, 153, 0.3)', marginBottom: 4 }} />
                <View style={{ width: 80, height: 10, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)' }} />
              </View>
            </View>
            {/* CTA Button placeholder */}
            <View style={{ width: '100%', height: 52, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.9)' }} />
          </View>
        </View>
      </SkeletonBlock>

      {/* ====== StatsCard Skeleton ====== */}
      {/* Glass card with donut chart and 3 action boxes (~120px) */}
      <SkeletonBlock
        index={2}
        height={120}
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.5)',
        }}
      >
        <View className="p-5 flex-1 justify-between">
          {/* Header row */}
          <View className="flex-row justify-between items-start">
            <View>
              <View style={{ width: 80, height: 8, borderRadius: 4, backgroundColor: textPlaceholderBg, marginBottom: 6 }} />
              <View className="flex-row items-baseline gap-1">
                <View style={{ width: 32, height: 20, borderRadius: 4, backgroundColor: textPlaceholderBg }} />
                <View style={{ width: 70, height: 10, borderRadius: 4, backgroundColor: textPlaceholderBg }} />
              </View>
            </View>
            {/* Mini donut placeholder */}
            <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 4, borderColor: textPlaceholderBg, backgroundColor: 'transparent' }} />
          </View>

          {/* 3 Action boxes */}
          <View className="flex-row gap-4">
            <View style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: isDark ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 241, 242, 0.9)' }} />
            <View style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 246, 255, 0.9)' }} />
            <View style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(241, 245, 249, 0.9)' }} />
          </View>
        </View>
      </SkeletonBlock>

      {/* ====== LeaveCard Skeleton ====== */}
      {/* Glass card with corner accent (~80px) */}
      <SkeletonBlock
        index={3}
        height={80}
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.5)',
        }}
      >
        {/* Corner accent */}
        <View style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 16,
          height: 16,
          backgroundColor: '#f59e0b',
          borderBottomLeftRadius: 12,
          zIndex: 10,
        }} />

        <View className="p-5 flex-row items-center justify-between h-full">
          <View>
            <View style={{ width: 90, height: 10, borderRadius: 4, backgroundColor: textPlaceholderBg, marginBottom: 8 }} />
            <View className="flex-row items-baseline gap-1.5">
              <View style={{ width: 40, height: 28, borderRadius: 6, backgroundColor: textPlaceholderBg }} />
              <View style={{ width: 80, height: 14, borderRadius: 4, backgroundColor: textPlaceholderBg }} />
            </View>
          </View>
          {/* Pending request placeholder */}
          <View style={{ width: 110, height: 44, borderRadius: 8, backgroundColor: isDark ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 247, 237, 0.9)' }} />
        </View>
      </SkeletonBlock>
    </View>
  );
}
