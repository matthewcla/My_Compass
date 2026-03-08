import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useActiveOrder } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Mail, MessageSquare, Phone, User } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Platform, Text, View } from 'react-native';

export interface GainingCommandCardProps {
  variant?: 'widget';
}

interface SponsorContact {
  name?: string;
  rank?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}

interface ActiveOrderWithContact {
  gainingCommand: {
    name?: string;
    uic?: string;
    crestUrl?: string;
  };
  sponsor?: SponsorContact | null;
}

type ActionTone = 'call' | 'text' | 'email';

interface ContactActionButtonProps {
  label: string;
  tone: ActionTone;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  url: string;
  isDark: boolean;
  onPress: (url: string) => void;
}

const sanitizePhone = (value?: string): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.replace(/[^+\d]/g, '');
};

const sanitizeEmail = (value?: string): string => {
  if (!value) return '';
  return value.trim();
};

function ContactActionButton({
  label,
  tone,
  icon: Icon,
  url,
  isDark,
  onPress,
}: ContactActionButtonProps) {
  const styleByTone: Record<ActionTone, { container: string; iconColor: string; text: string }> = {
    call: {
      container:
        'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40',
      iconColor: isDark ? '#86efac' : '#15803d',
      text: 'text-green-700 dark:text-green-300',
    },
    text: {
      container:
        'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40',
      iconColor: isDark ? '#93c5fd' : '#1d4ed8',
      text: 'text-blue-700 dark:text-blue-300',
    },
    email: {
      container:
        'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
      iconColor: isDark ? '#cbd5e1' : '#475569',
      text: 'text-slate-700 dark:text-slate-200',
    },
  };

  const toneStyle = styleByTone[tone];

  return (
    <ScalePressable
      onPress={() => onPress(url)}
      className={`flex-1 items-center rounded-lg border px-3 py-2.5 ${toneStyle.container}`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon size={16} color={toneStyle.iconColor} strokeWidth={2.2} />
      <Text className={`mt-1 text-xs font-semibold ${toneStyle.text}`}>{label}</Text>
    </ScalePressable>
  );
}

export function GainingCommandCard({ variant = 'widget' }: GainingCommandCardProps) {
  void variant;

  const activeOrder = useActiveOrder();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  if (!activeOrder) {
    return null;
  }

  const orderWithContact = activeOrder as unknown as ActiveOrderWithContact;
  const gainingCommand = orderWithContact.gainingCommand || {};
  const sponsor = orderWithContact.sponsor ?? null;

  const crestUri = (gainingCommand.crestUrl || '').trim();
  const sponsorPhotoUri = (sponsor?.photoUrl || '').trim();

  const [showCrestFallback, setShowCrestFallback] = useState(false);
  const [showSponsorFallback, setShowSponsorFallback] = useState(false);

  useEffect(() => {
    setShowCrestFallback(false);
  }, [crestUri]);

  useEffect(() => {
    setShowSponsorFallback(false);
  }, [sponsorPhotoUri]);

  const sponsorDisplayName = useMemo(() => {
    const sponsorName = sponsor?.name?.trim();
    if (!sponsorName) return 'Sponsor';
    return sponsorName;
  }, [sponsor?.name]);

  const phone = sanitizePhone(sponsor?.phone);
  const email = sanitizeEmail(sponsor?.email);
  const callUrl = phone ? `tel:${phone}` : '';
  const textUrl = phone ? `sms:${phone}` : '';
  const emailUrl = email ? `mailto:${email}` : '';
  const hasContactActions = Boolean(callUrl || textUrl || emailUrl);

  const handleContactAction = async (url: string) => {
    if (!url) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }

    try {
      await Linking.openURL(url);
    } catch {
      // Ignore Linking failures to avoid breaking widget flow.
    }
  };

  return (
    <GlassView
      intensity={80}
      tint={isDark ? 'dark' : 'light'}
      className="rounded-[24px] overflow-hidden mx-4 mb-6 shadow-sm border border-black/5 dark:border-white/10"
    >
      <LinearGradient
        colors={isDark ? ['rgba(59,130,246,0.15)', 'transparent'] : ['rgba(59,130,246,0.08)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View className="p-5">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-4 flex-1">
            <View className="w-[52px] h-[52px] rounded-full bg-blue-500/10 dark:bg-blue-900/40 items-center justify-center border-[1.5px] border-blue-500/20 dark:border-blue-800/60 shadow-sm overflow-hidden">
              {crestUri && !showCrestFallback ? (
                <Image
                  source={{ uri: crestUri }}
                  className="w-full h-full"
                  resizeMode="cover"
                  onError={() => setShowCrestFallback(true)}
                />
              ) : (
                <Building2 size={26} color={isDark ? '#60A5FA' : '#2563EB'} />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={1}>{gainingCommand.name || 'Command Pending'}</Text>
              <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={1}>UIC: {gainingCommand.uic || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
          <Text className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Your Sponsor
          </Text>

          {!sponsor ? (
            <Text className="text-sm leading-5 text-slate-600 dark:text-slate-300">
              No sponsor assigned yet. Contact your detailer for sponsor assignment.
            </Text>
          ) : (
            <>
              <View className="flex-row items-center bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60">
                <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center overflow-hidden mr-3">
                  {sponsorPhotoUri && !showSponsorFallback ? (
                    <Image
                      source={{ uri: sponsorPhotoUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                      onError={() => setShowSponsorFallback(true)}
                    />
                  ) : (
                    <User size={18} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-base font-bold text-slate-900 dark:text-white">
                    {sponsorDisplayName}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Command Sponsor
                  </Text>
                </View>
              </View>

              {hasContactActions ? (
                <View className="mt-3 flex-row gap-2">
                  {callUrl && (
                    <ContactActionButton
                      label="Call"
                      tone="call"
                      icon={Phone}
                      url={callUrl}
                      isDark={isDark}
                      onPress={handleContactAction}
                    />
                  )}
                  {textUrl && (
                    <ContactActionButton
                      label="Text"
                      tone="text"
                      icon={MessageSquare}
                      url={textUrl}
                      isDark={isDark}
                      onPress={handleContactAction}
                    />
                  )}
                  {emailUrl && (
                    <ContactActionButton
                      label="Email"
                      tone="email"
                      icon={Mail}
                      url={emailUrl}
                      isDark={isDark}
                      onPress={handleContactAction}
                    />
                  )}
                </View>
              ) : (
                <Text className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Sponsor contact info is not available yet.
                </Text>
              )}
            </>
          )}
        </View>
      </View>
    </GlassView>
  );
}
