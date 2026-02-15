import { PCSStep1Dates } from '@/components/pcs/wizard/PCSStep1Dates';
import { PCSStep2Mode } from '@/components/pcs/wizard/PCSStep2Mode';
import { PCSStep3Itinerary } from '@/components/pcs/wizard/PCSStep3Itinerary';
import { PCSStep4Review } from '@/components/pcs/wizard/PCSStep4Review';
import { PCSWizardStatusBar } from '@/components/pcs/wizard/PCSWizardStatusBar';
import Colors from '@/constants/Colors';
import { useHeaderStore } from '@/store/useHeaderStore';
import { usePCSStore } from '@/store/usePCSStore';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const TOTAL_STEPS = 4;

export default function PCSWizardScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const currentDraft = usePCSStore((state) => state.currentDraft);
  const commitSegment = usePCSStore((state) => state.commitSegment);
  const setHeaderVisible = useHeaderStore((state) => state.setVisible);

  // Hide Global Header
  useFocusEffect(
    useCallback(() => {
      setHeaderVisible(false);
      return () => setHeaderVisible(true);
    }, [setHeaderVisible])
  );

  // --- State ---
  const [activeStep, setActiveStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const scrollViewRef = useRef<any>(null);
  const sectionCoords = useRef<number[]>([]);

  // --- Scroll Handling ---
  const handleSectionLayout = (index: number, event: LayoutChangeEvent) => {
    const layout = event.nativeEvent.layout;
    sectionCoords.current[index] = layout.y;
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    const triggerPoint = scrollY + (layoutHeight * 0.3);

    let newActive = 0;
    for (let i = 0; i < TOTAL_STEPS; i++) {
      const sectionTop = sectionCoords.current[i] || 0;
      if (triggerPoint >= sectionTop) {
        newActive = i;
      }
    }
    if (newActive !== activeStep) {
      setActiveStep(newActive);
    }
  };

  const scrollToSection = (index: number) => {
    const y = sectionCoords.current[index];
    if (y !== undefined) {
      scrollViewRef.current?.scrollTo({ y, animated: true });
    }
  };

  // --- Validation ---
  const validateStep = (stepIndex: number): boolean => {
    if (!currentDraft) return false;
    switch (stepIndex) {
      case 0: // Dates
        return !!(currentDraft.dates?.projectedDeparture && currentDraft.dates?.projectedArrival);
      case 1: // Mode
        return currentDraft.userPlan?.mode !== null;
      case 2: // Itinerary — always valid (stops are optional)
        return true;
      case 3: // Review — always valid if prior steps are valid
        return true;
      default:
        return true;
    }
  };

  const stepErrors = useMemo(() => {
    const errors: number[] = [];
    for (let i = 0; i < activeStep; i++) {
      if (!validateStep(i)) {
        errors.push(i);
      }
    }
    return errors;
  }, [activeStep, currentDraft]);

  // --- Submit ---
  const handleCommit = () => {
    if (!currentDraft) return;

    if (!validateStep(0)) {
      Alert.alert('Required', 'Please select checkout dates (Step 1).');
      scrollToSection(0);
      return;
    }
    if (!validateStep(1)) {
      Alert.alert('Required', 'Please select a travel mode (Step 2).');
      scrollToSection(1);
      return;
    }

    commitSegment(currentDraft.id);

    // Success Celebration
    setShowSuccess(true);
    setTimeout(() => {
      router.dismissAll();
      router.push('/(tabs)/(pcs)/pcs');
    }, 2500);
  };

  const handleExit = () => {
    router.back();
  };

  if (!currentDraft) return null;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {isDark && (
        <LinearGradient
          colors={['#0f172a', '#020617']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      )}
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View className="flex-1">
          {/* Header: StatusBar */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className="bg-white/95 dark:bg-slate-900/95 sticky top-0 z-10 px-4 py-2"
          >
            <View className="flex-row items-start justify-between mb-1">
              <View className="flex-1">
                <Text
                  style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5 }}
                  className="text-slate-400 dark:text-gray-500 ml-8 mb-0"
                >
                  PHASE 3
                </Text>
                <Text
                  style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}
                  className="text-slate-900 dark:text-white ml-8 mb-1"
                >
                  PCS Travel Plan
                </Text>
              </View>
              <Pressable
                onPress={handleExit}
                className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
              >
                <ChevronLeft size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
              </Pressable>
            </View>
            <PCSWizardStatusBar
              currentStep={activeStep}
              onStepPress={scrollToSection}
              errorSteps={stepErrors}
            />
          </Animated.View>

          {/* Main Scroll Feed */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
          >
            <Animated.ScrollView
              entering={FadeInDown.delay(200).springify()}
              ref={scrollViewRef}
              className="flex-1"
              contentContainerClassName="px-4 pt-4 pb-56"
              onScroll={handleScroll}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {/* 1. Dates */}
              <View onLayout={(e) => handleSectionLayout(0, e)} className="mb-6">
                <PCSStep1Dates embedded={true} />
              </View>

              {/* 2. Mode */}
              <View onLayout={(e) => handleSectionLayout(1, e)} className="mb-6">
                <PCSStep2Mode embedded={true} />
              </View>

              {/* 3. Itinerary */}
              <View onLayout={(e) => handleSectionLayout(2, e)} className="mb-6">
                <PCSStep3Itinerary embedded={true} />
              </View>

              {/* 4. Review */}
              <View onLayout={(e) => handleSectionLayout(3, e)} className="mb-6">
                <PCSStep4Review embedded={true} />
              </View>
            </Animated.ScrollView>
          </KeyboardAvoidingView>

          {/* Floating Footer */}
          <View
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="pt-4 px-4">
              {/* HUD Summary */}
              <View className="flex-row justify-between mb-3">
                <View className="items-center flex-1">
                  <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mode</Text>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">
                    {currentDraft.userPlan.mode || '—'}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">Stops</Text>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">
                    {currentDraft.userPlan.stops?.length || 0}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">Destination</Text>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                    {currentDraft.location.name}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                {/* Commit Button */}
                <Pressable
                  onPress={handleCommit}
                  disabled={!validateStep(0) || !validateStep(1)}
                  className={`flex-1 h-14 rounded-xl flex-row items-center justify-center ${validateStep(0) && validateStep(1)
                    ? 'bg-emerald-600 active:bg-emerald-700'
                    : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                >
                  <Check size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Save & Close
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Success Celebration Overlay */}
      {showSuccess && (
        <Animated.View
          entering={FadeIn}
          className="absolute inset-0 z-50 items-center justify-center"
        >
          <BlurView
            intensity={40}
            tint="dark"
            className="absolute inset-0 items-center justify-center bg-black/40"
          >
            <Animated.View entering={ZoomIn.delay(200).springify()}>
              <Check size={100} color="white" strokeWidth={2.5} />
            </Animated.View>
            <Animated.Text entering={FadeInUp.delay(500)} className="text-white text-3xl font-bold mt-8 tracking-tight">
              Segment Saved!
            </Animated.Text>
            <Animated.Text entering={FadeInUp.delay(600)} className="text-blue-100 text-lg mt-3 text-center">
              Your travel plan has been{'\n'}committed to your PCS orders.
            </Animated.Text>
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
}
