import { View, Text, Pressable, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCalendarStore, CalendarEvent } from '@/store/useCalendarStore';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { format } from 'date-fns';
import { QrCode, CheckCircle, MapPin } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import React, { useCallback } from 'react';

export default function CalendarScreen() {
  const router = useRouter();
  const events = useCalendarStore((state) => state.getEvents());
  const isAttended = useCalendarStore((state) => state.isAttended);
  const attendance = useCalendarStore((state) => state.attendance);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  useScreenHeader(
    'Career Events',
    'Important Dates & Deadlines',
    {
      icon: QrCode,
      onPress: () => router.push('/(calendar)/scan'),
    },
    'large'
  );

  const renderItem = useCallback(({ item }: { item: CalendarEvent }) => {
    const attended = isAttended(item.id);
    const eventDate = new Date(item.date);
    const isToday = eventDate.toDateString() === new Date().toDateString();

    return (
      <View className="mx-4 mb-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">
                    {item.type.replace(/_/g, ' ')}
                </Text>
                <Text className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
                    {item.title}
                </Text>
            </View>
             {attended ? (
                <CheckCircle size={24} color={Colors.green[500]} />
             ) : (
                 // Show QR button if today and not attended
                 isToday && item.type === 'career_event' ? (
                     <Pressable onPress={() => router.push('/(calendar)/scan')}>
                         <QrCode size={24} color={theme.text} />
                     </Pressable>
                 ) : null
             )}
        </View>

        <View className="flex-row items-center mt-2">
            <Text className="text-slate-500 dark:text-slate-400 font-medium">
                {format(eventDate, 'MMMM d, yyyy')}
            </Text>
        </View>

        <View className="flex-row items-center mt-1 gap-1">
            <MapPin size={14} color={Colors.gray[500]} />
            <Text className="text-slate-500 dark:text-slate-400 text-sm flex-1">
                {item.location}
            </Text>
        </View>

        <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Text className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {item.description}
            </Text>
        </View>

        {item.isMandatory && (
             <View className="mt-3 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg self-start">
                 <Text className="text-red-600 dark:text-red-400 text-xs font-semibold">
                     MANDATORY ATTENDANCE
                 </Text>
             </View>
        )}
      </View>
    );
  }, [isAttended, theme, router, colorScheme, attendance]);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-black">
      <FlashList
        data={events}
        extraData={attendance}
        renderItem={renderItem}
        // @ts-expect-error FlashList strict typing issue with estimatedItemSize
        estimatedItemSize={200}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
      />
    </View>
  );
}
