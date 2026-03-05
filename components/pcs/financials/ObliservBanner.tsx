import { ScalePressable } from '@/components/ScalePressable';
import { usePCSStore } from '@/store/usePCSStore';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { CheckCircle2, TriangleAlert } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, Text, View, useColorScheme } from 'react-native';

interface ObliservBannerProps {
  variant?: 'full' | 'widget';
}

export const ObliservBanner = ({ variant = 'full' }: ObliservBannerProps) => {
  const obliserv = usePCSStore((state) => state.financials.obliserv);
  const checkObliserv = usePCSStore((state) => state.checkObliserv);
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // Re-evaluate OBLISERV on mount (persisted store may have stale state)
  useEffect(() => { checkObliserv(); }, [checkObliserv]);

  // ── Dismiss state for "clear" acknowledgement ──────────
  const [dismissed, setDismissed] = useState(false);

  // ── Determine state ─────────────────────────────────────
  const state: 'required' | 'clear' =
    obliserv.required && obliserv.status !== 'COMPLETE'
      ? 'required'
      : 'clear';

  // If clear and user acknowledged, hide entirely
  if (state === 'clear' && dismissed) return null;

  const hapticTap = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAcknowledge = () => {
    hapticTap();
    setDismissed(true);
  };

  // ═════════════════════════════════════════════════════════
  // FULL VARIANT
  // ═════════════════════════════════════════════════════════
  if (variant === 'full') {
    // ── REQUIRED ──────────────────────────────────────────
    if (state === 'required') {
      return (
        <BlurView
          intensity={80}
          tint={isDark ? "dark" : "light"}
          style={{
            borderRadius: 14, padding: 16, marginBottom: 16, overflow: 'hidden',
            borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(220,38,38,0.2)',
            backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(254,242,242,0.6)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <TriangleAlert size={18} color="#DC2626" />
            <Text style={{
              fontWeight: '700', fontSize: 14, marginLeft: 8,
              color: isDark ? '#FCA5A5' : '#991B1B',
            }}>
              Action Required: OBLISERV
            </Text>
          </View>
          <Text style={{
            fontSize: 13, lineHeight: 18,
            color: isDark ? '#FCA5A5' : '#7F1D1D', marginBottom: 16,
          }}>
            Your EAOS does not extend 36 months past your report date. You must extend or reenlist before orders can execute.
          </Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ScalePressable
              style={{
                flex: 1, backgroundColor: isDark ? 'rgba(220,38,38,0.2)' : 'rgba(220,38,38,0.1)',
                borderRadius: 10, paddingVertical: 12, alignItems: 'center',
                borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.4)' : 'rgba(220,38,38,0.3)',
              }}
              onPress={() => {
                hapticTap();
                router.push('/pcs-wizard/obliserv-request?intent=reenlist' as any);
              }}
              accessibilityRole="button"
              accessibilityLabel="Intend to Reenlist"
            >
              <Text style={{ color: isDark ? '#FECACA' : '#B91C1C', fontWeight: '700', fontSize: 14 }}>
                Intend to Reenlist
              </Text>
            </ScalePressable>

            <ScalePressable
              style={{
                flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                borderRadius: 10, paddingVertical: 12, alignItems: 'center',
                borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.15)',
              }}
              onPress={() => {
                hapticTap();
                router.push('/pcs-wizard/obliserv-request?intent=extend' as any);
              }}
              accessibilityRole="button"
              accessibilityLabel="Intend to Extend"
            >
              <Text style={{ color: isDark ? '#FCA5A5' : '#DC2626', fontWeight: '700', fontSize: 14 }}>
                Intend to Extend
              </Text>
            </ScalePressable>
          </View>
        </BlurView>
      );
    }

    // ── CLEAR ─────────────────────────────────────────────
    return (
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={{
          borderRadius: 14, padding: 16, marginBottom: 16, overflow: 'hidden',
          borderWidth: 1, borderColor: isDark ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.2)',
          backgroundColor: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(240,253,244,0.6)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <CheckCircle2 size={18} color="#22C55E" />
          <Text style={{
            fontWeight: '700', fontSize: 14, marginLeft: 8,
            color: isDark ? '#86EFAC' : '#166534',
          }}>
            OBLISERV Clear
          </Text>
        </View>
        <Text style={{
          fontSize: 13, lineHeight: 18, marginTop: 6, marginBottom: 12,
          color: isDark ? '#86EFAC' : '#14532D',
        }}>
          Your EAOS extends beyond the required service date. No action needed.
        </Text>
        <ScalePressable
          onPress={handleAcknowledge}
          accessibilityRole="button"
          accessibilityLabel="Acknowledge OBLISERV Clear"
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(220,252,231,0.5)',
            borderRadius: 10, paddingVertical: 10,
            borderWidth: 1, borderColor: isDark ? 'rgba(34,197,94,0.3)' : 'rgba(187,247,208,0.8)',
          }}
        >
          <CheckCircle2 size={16} color={isDark ? '#86EFAC' : '#16A34A'} />
          <Text style={{
            fontWeight: '700', fontSize: 14, marginLeft: 6,
            color: isDark ? '#86EFAC' : '#166534',
          }}>
            Acknowledge
          </Text>
        </ScalePressable>
      </BlurView>
    );
  }

  // ═════════════════════════════════════════════════════════
  // WIDGET VARIANT
  // ═════════════════════════════════════════════════════════

  // ── REQUIRED (widget) ───────────────────────────────────
  if (state === 'required') {
    return (
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={{
          borderRadius: 16, padding: 12, overflow: 'hidden',
          borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(254,202,202,0.8)',
          backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(254,242,242,0.6)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(254,226,226,0.8)',
            borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(254,202,202,0.5)',
          }}>
            <TriangleAlert size={18} color={isDark ? '#FCA5A5' : '#DC2626'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', fontSize: 14, color: isDark ? '#FCA5A5' : '#991B1B' }}>
              OBLISERV Required
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? 'rgba(252,165,165,0.8)' : 'rgba(153,27,27,0.8)' }}>
              Extension or reenlistment needed
            </Text>
          </View>
          <ScalePressable
            style={{
              backgroundColor: isDark ? 'rgba(220,38,38,0.2)' : 'rgba(220,38,38,0.1)',
              paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
              borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.4)' : 'rgba(220,38,38,0.3)',
            }}
            onPress={() => {
              hapticTap();
              router.push('/pcs-wizard/obliserv-check' as any);
            }}
            accessibilityRole="button"
            accessibilityLabel="Resolve OBLISERV"
          >
            <Text style={{ color: isDark ? '#FECACA' : '#B91C1C', fontWeight: '700', fontSize: 13 }}>
              Resolve
            </Text>
          </ScalePressable>
        </View>
      </BlurView>
    );
  }

  // ── CLEAR (widget) ──────────────────────────────────────
  return (
    <BlurView
      intensity={80}
      tint={isDark ? "dark" : "light"}
      style={{
        borderRadius: 16, padding: 12, overflow: 'hidden',
        borderWidth: 1, borderColor: isDark ? 'rgba(34,197,94,0.25)' : 'rgba(187,247,208,0.8)',
        backgroundColor: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(240,253,244,0.6)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(220,252,231,0.8)',
          borderWidth: 1, borderColor: isDark ? 'rgba(34,197,94,0.2)' : 'rgba(187,247,208,0.5)',
        }}>
          <CheckCircle2 size={18} color={isDark ? '#86EFAC' : '#16A34A'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 14, color: isDark ? '#86EFAC' : '#166534' }}>
            OBLISERV Clear
          </Text>
          <Text style={{ fontSize: 12, color: isDark ? 'rgba(134,239,172,0.8)' : 'rgba(22,101,52,0.8)' }}>
            No additional service required
          </Text>
        </View>
        <ScalePressable
          style={{
            backgroundColor: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.1)',
            paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
            borderWidth: 1, borderColor: isDark ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.2)',
          }}
          onPress={handleAcknowledge}
          accessibilityRole="button"
          accessibilityLabel="Acknowledge OBLISERV Clear"
        >
          <CheckCircle2 size={16} color={isDark ? '#86EFAC' : '#16A34A'} />
        </ScalePressable>
      </View>
    </BlurView>
  );
};
