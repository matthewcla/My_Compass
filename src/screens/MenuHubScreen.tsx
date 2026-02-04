import { MenuTile } from '@/components/menu/MenuTile';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Briefcase,
  FileText,
  LogOut,
  Map as MapIcon,
  Search,
  Settings,
  Shield,
  User
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MenuHubScreen() {
  const router = useRouter();

  const handleTilePress = (route: string) => {
    // router.push(route);
    console.log('Navigate to:', route);
  };

  return (
    <View className="flex-1 bg-[#F2F2F7]">
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          className="px-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mb-6 mt-2">
            <Text className="text-3xl font-bold text-slate-900 mb-4">Menu</Text>

            <View className="bg-white rounded-full flex-row items-center px-4 py-3 shadow-sm">
              <Search size={20} color="#94A3B8" />
              <TextInput
                placeholder="Search App..."
                placeholderTextColor="#94A3B8"
                className="flex-1 ml-2 text-base text-slate-900"
              />
            </View>
          </View>

          {/* Hero Card */}
          <LinearGradient
            colors={['#1e3a8a', '#CA8A04']} // Navy Blue (blue-900 approx) to Gold (yellow-600 approx)
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-[24px] p-6 mb-6 h-48 justify-between shadow-md"
          >
            <View>
              <Text className="text-white/80 font-bold uppercase text-xs tracking-wider">
                Overview
              </Text>
              <Text className="text-white font-bold text-2xl mt-1">
                Readiness Status
              </Text>
            </View>

            <View className="self-end bg-white/20 p-3 rounded-full">
              <Shield size={32} color="#FFFFFF" strokeWidth={2} />
            </View>
          </LinearGradient>

          {/* Grid */}
          <View className="flex-row flex-wrap justify-between -mx-2">
            <MenuTile
              label="My Assignment"
              icon={Briefcase}
              onPress={() => handleTilePress('/(career)/assignment')}
            />
            <MenuTile
              label="My PCS"
              icon={MapIcon}
              onPress={() => handleTilePress('/(pcs)')}
              locked
            />
            <MenuTile
              label="My Admin"
              icon={FileText}
              onPress={() => handleTilePress('/(admin)')}
              locked
            />
            <MenuTile
              label="My Profile"
              icon={User}
              onPress={() => handleTilePress('/(profile)')}
            />
            <MenuTile
              label="Profile Settings"
              icon={Settings}
              onPress={() => handleTilePress('/(profile)/settings')}
            />
          </View>

          {/* Footer Action */}
          <TouchableOpacity
            className="mt-8 flex-row items-center justify-center p-4"
            onPress={() => console.log('Log Out')}
          >
            <LogOut size={20} color="#EF4444" />
            <Text className="text-red-500 font-semibold text-lg ml-2">Log Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
