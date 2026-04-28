import { create } from 'zustand';

export type BottomSheetState = 0 | 1; // 0: Collapsed, 1: Full

interface BottomSheetStore {
    sheetState: BottomSheetState;
    setSheetState: (state: BottomSheetState) => void;
    // A standard tab bar is 72px. We'll track it here so CollapsibleScaffold can read it.
    tabBarHeight: number;
    setTabBarHeight: (height: number) => void;
}

export const useBottomSheetStore = create<BottomSheetStore>()((set) => ({
    sheetState: 0,
    setSheetState: (state) => set({ sheetState: state }),
    tabBarHeight: 72,
    setTabBarHeight: (height) => set({ tabBarHeight: height }),
}));
