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
  const tileBg = isDark ? '#1E293B' : '#FFFFFF';
  const tileBorder = isDark ? '#334155' : '#E2E8F0';

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

      {/* ====== 2×2 MenuTile Grid Skeleton ====== */}
      {/* Row 1 */}
      <View className="flex-row justify-between">
        {[1, 2].map((i) => (
          <SkeletonBlock
            key={i}
            index={i}
            height={0}
            style={{
              width: '47%',
              aspectRatio: 1,
              height: undefined,
              borderRadius: 24,
              backgroundColor: tileBg,
              borderWidth: 1,
              borderColor: tileBorder,
            }}
          >
            <View className="p-3 flex-1 justify-between">
              {/* Icon bubble */}
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF' }} />
              {/* Label */}
              <View>
                <View style={{ width: 90, height: 14, borderRadius: 6, backgroundColor: textPlaceholderBg, marginBottom: 4 }} />
                <View style={{ width: 60, height: 10, borderRadius: 4, backgroundColor: textPlaceholderBg }} />
              </View>
            </View>
          </SkeletonBlock>
        ))}
      </View>

      {/* Row 2 */}
      <View className="flex-row justify-between" style={{ marginTop: -8 }}>
        {[3, 4].map((i) => (
          <SkeletonBlock
            key={i}
            index={i}
            height={0}
            style={{
              width: '47%',
              aspectRatio: 1,
              height: undefined,
              borderRadius: 24,
              backgroundColor: tileBg,
              borderWidth: 1,
              borderColor: tileBorder,
            }}
          >
            <View className="p-3 flex-1 justify-between">
              {/* Icon bubble */}
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? '#334155' : '#F1F5F9' }} />
              {/* Label */}
              <View>
                <View style={{ width: 80, height: 14, borderRadius: 6, backgroundColor: textPlaceholderBg, marginBottom: 4 }} />
                <View style={{ width: 50, height: 10, borderRadius: 4, backgroundColor: textPlaceholderBg }} />
              </View>
            </View>
          </SkeletonBlock>
        ))}
      </View>

      {/* ====== LeaveCard Skeleton ====== */}
      {/* Glass card with corner accent (~80px) */}
      <SkeletonBlock
        index={5}
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
