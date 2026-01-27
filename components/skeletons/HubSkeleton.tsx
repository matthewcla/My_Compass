import { MotiView } from 'moti';
import { View } from 'react-native';

export function HubSkeleton() {
  return (
    <View className="flex-1 p-4 pt-2.5 gap-4">
      {/* Header Bar */}
      <MotiView
        from={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 1000, loop: true }}
        className="h-12 w-full rounded-lg bg-slate-200 dark:bg-slate-800"
      />
      {/* 3 Gray Rectangles */}
      <MotiView
        from={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 1000, loop: true, delay: 100 }}
        className="h-40 w-full rounded-xl bg-slate-200 dark:bg-slate-800"
      />
      <MotiView
        from={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 1000, loop: true, delay: 200 }}
        className="h-32 w-full rounded-xl bg-slate-200 dark:bg-slate-800"
      />
      <MotiView
        from={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 1000, loop: true, delay: 300 }}
        className="h-32 w-full rounded-xl bg-slate-200 dark:bg-slate-800"
      />
    </View>
  );
}
