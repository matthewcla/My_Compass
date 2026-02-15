import { GlassView } from '@/components/ui/GlassView';
import { useTravelClaimStore } from '@/store/useTravelClaimStore';
import { useUserId } from '@/store/useUserStore';
import { TravelClaim } from '@/types/travelClaim';
import { formatCurrency } from '@/utils/formatCurrency';
import { format } from 'date-fns';
import { Link, Stack, useRouter } from 'expo-router';
import { Calendar, ChevronRight, FileText, Plus } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { FlatList, Pressable, SafeAreaView, Text, View, useColorScheme } from 'react-native';

export default function TravelClaimHistory() {
  const router = useRouter();
  const userId = useUserId();
  const fetchUserClaims = useTravelClaimStore((state) => state.fetchUserClaims);
  const userClaimIds = useTravelClaimStore((state) => state.userClaimIds);
  const travelClaims = useTravelClaimStore((state) => state.travelClaims);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (userId) {
      fetchUserClaims(userId);
    }
  }, [userId]);

  const claims = userClaimIds
    .map((id) => travelClaims[id])
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleCreate = () => {
    router.push('/travel-claim/request');
  };

  const renderItem = ({ item }: { item: TravelClaim }) => (
    <Link href={`/travel-claim/${item.id}`} asChild>
      <Pressable className="bg-white dark:bg-slate-800 mb-3 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-row items-center gap-2">
            <View className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
            <Text className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              {item.status}
            </Text>
          </View>
          <Text className="text-xs text-slate-400">
            {format(new Date(item.updatedAt), 'MMM d, yyyy')}
          </Text>
        </View>

        <View className="flex-row items-center gap-3 mb-3">
            <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center">
                <FileText size={20} className="text-blue-600 dark:text-blue-400" />
            </View>
            <View>
                <Text className="font-bold text-slate-900 dark:text-white text-base">
                    {item.destinationLocation || 'New Claim'}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {item.travelType.toUpperCase()} • {formatCurrency(item.totalClaimAmount)}
                </Text>
            </View>
        </View>

        <View className="flex-row items-center justify-between border-t border-slate-100 dark:border-slate-700/50 pt-3">
             <View className="flex-row items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                <Text className="text-xs text-slate-500">
                    {item.departureDate ? format(new Date(item.departureDate), 'MMM d') : '--'} - {item.returnDate ? format(new Date(item.returnDate), 'MMM d') : '--'}
                </Text>
             </View>
             <ChevronRight size={16} className="text-slate-300" />
        </View>
      </Pressable>
    </Link>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Stack.Screen options={{
          title: 'My Travel Claims',
          headerLargeTitle: true,
          headerRight: () => (
            <Pressable onPress={handleCreate} className="bg-blue-600 rounded-full p-2">
                <Plus size={20} color="white" />
            </Pressable>
          )
      }} />

      <FlatList
        data={claims}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
            <View className="items-center justify-center py-20">
                <View className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center mb-4">
                    <FileText size={32} className="text-slate-400" />
                </View>
                <Text className="text-slate-500 text-center mb-4">No travel claims found.</Text>
                <Pressable onPress={handleCreate} className="bg-blue-600 px-6 py-3 rounded-full">
                    <Text className="text-white font-semibold">Start New Claim</Text>
                </Pressable>
            </View>
        }
      />
    </View>
  );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'draft': return 'bg-slate-400';
        case 'pending': return 'bg-amber-500';
        case 'approved': return 'bg-emerald-500';
        case 'returned': return 'bg-red-500';
        case 'paid': return 'bg-blue-500';
        default: return 'bg-slate-400';
    }
}
