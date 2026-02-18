import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useActiveOrder } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
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
      intensity={75}
      tint={isDark ? 'dark' : 'light'}
      className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10"
    >
      <View className="bg-blue-50/30 dark:bg-blue-900/20 px-4 py-3.5">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 items-center justify-center overflow-hidden mr-3">
            {crestUri && !showCrestFallback ? (
              <Image
                source={{ uri: crestUri }}
                className="w-full h-full"
                resizeMode="cover"
                onError={() => setShowCrestFallback(true)}
              />
            ) : (
              <Building2 size={22} color={isDark ? '#93c5fd' : '#2563eb'} strokeWidth={2.2} />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-slate-500 dark:text-slate-300">
              Gaining Command
            </Text>
            <Text className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
              {gainingCommand.name || 'Command Pending'}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              UIC: {gainingCommand.uic || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <View className="p-4">
        <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-slate-500 dark:text-slate-400">
          Your Sponsor
        </Text>

        {!sponsor ? (
          <Text className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
            No sponsor assigned yet. Contact your detailer for sponsor assignment.
          </Text>
        ) : (
          <>
            <View className="mt-2.5 flex-row items-center">
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
                {callUrl ? (
                  <ContactActionButton
                    label="Call"
                    tone="call"
                    icon={Phone}
                    url={callUrl}
                    isDark={isDark}
                    onPress={handleContactAction}
                  />
                ) : null}

                {textUrl ? (
                  <ContactActionButton
                    label="Text"
                    tone="text"
                    icon={MessageSquare}
                    url={textUrl}
                    isDark={isDark}
                    onPress={handleContactAction}
                  />
                ) : null}

                {emailUrl ? (
                  <ContactActionButton
                    label="Email"
                    tone="email"
                    icon={Mail}
                    url={emailUrl}
                    isDark={isDark}
                    onPress={handleContactAction}
                  />
                ) : null}
              </View>
            ) : (
              <Text className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Sponsor contact info is not available yet.
              </Text>
            )}
          </>
        )}
      </View>
    </GlassView>
  );
}
