import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

const MENU_ITEMS = [
  { label: 'Home Hub', route: '/(hub)/dashboard' },
  { label: 'My Assignment', route: '/(assignment)/assignments' },
  { label: 'My PCS', route: '/(pcs)/orders' },
  { label: 'My Admin', route: '/(admin)/requests' },
  { label: 'My Profile', route: '/(profile)/preferences' },
];

export default function AppDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DrawerContentScrollView {...props} scrollEnabled={true} contentContainerStyle={{ paddingTop: 0 }}>
      <View className="flex-1 bg-white dark:bg-slate-900 min-h-screen">
        {/* Header */}
        <View className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pt-16">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome, User
          </Text>
        </View>

        {/* Menu Items */}
        <View className="p-4 gap-2">
          {MENU_ITEMS.map((item) => {
            // Clean route for comparison (remove groups)
            const cleanRoute = item.route.replace(/\/\([^)]+\)/g, '');
            // pathname usually comes clean (e.g. /dashboard)

            const isActive = pathname === cleanRoute || (cleanRoute !== '/' && pathname.startsWith(cleanRoute));

            return (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.route as any)}
                className={`p-4 rounded-xl flex-row items-center ${isActive
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : 'active:bg-slate-50 dark:active:bg-slate-900'
                  }`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  className={`text-base font-medium ${isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300'
                    }`}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </DrawerContentScrollView>
  );
}
