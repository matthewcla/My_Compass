import { useColorScheme } from '@/components/useColorScheme';
import { useSession } from '@/lib/ctx';
import { useCareerStore } from '@/store/useCareerStore';
import { useInboxStore } from '@/store/useInboxStore';
import { useSpotlightStore } from '@/store/useSpotlightStore';
import { useUserStore } from '@/store/useUserStore';
import {
    RankedSpotlightItem,
    SpotlightItem,
    SpotlightScope,
    SpotlightSection
} from '@/types/spotlight';
import { useRouter } from 'expo-router';
import {
    CalendarDays,
    ChevronRight,
    Compass,
    Inbox as InboxIcon,
    Search,
    Settings,
    Sparkles,
    X
} from 'lucide-react-native';
import React from 'react';
import {
    Animated,
    BackHandler,
    Keyboard,
    KeyboardAvoidingView,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SECTION_ORDER: SpotlightSection[] = ['Actions', 'Navigation', 'Settings', 'Calendar', 'Inbox'];
const MAX_RESULTS = 30;
const COMPACT_BREAKPOINT = 900;

const SCOPE_OPTIONS: Array<{ value: SpotlightScope; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'navigation', label: 'Navigation' },
    { value: 'actions', label: 'Actions' },
    { value: 'settings', label: 'Settings' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'inbox', label: 'Inbox' },
];

const normalize = (value: string) => value.trim().toLowerCase();

const fuzzySequenceScore = (value: string, query: string): number => {
    if (!value || !query) return 0;

    let valueIndex = 0;
    let queryIndex = 0;
    let score = 0;

    while (valueIndex < value.length && queryIndex < query.length) {
        if (value[valueIndex] === query[queryIndex]) {
            score += valueIndex > 0 && value[valueIndex - 1] === query[queryIndex - 1] ? 4 : 2;
            queryIndex += 1;
        }
        valueIndex += 1;
    }

    return queryIndex === query.length ? score : 0;
};

const getSectionBaseScore = (section: SpotlightSection): number => {
    switch (section) {
        case 'Actions':
            return 50;
        case 'Navigation':
            return 45;
        case 'Settings':
            return 40;
        case 'Calendar':
            return 35;
        case 'Inbox':
            return 30;
        default:
            return 0;
    }
};

const getFreshnessBoost = (updatedAt?: number): number => {
    if (!updatedAt) return 0;
    const ageInDays = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);
    return Math.max(0, 18 - ageInDays);
};

const matchesScope = (item: SpotlightItem, scope: SpotlightScope): boolean => {
    if (scope === 'all') return true;
    if (scope === 'navigation') return item.section === 'Navigation';
    if (scope === 'actions') return item.section === 'Actions';
    if (scope === 'settings') return item.section === 'Settings';
    if (scope === 'calendar') return item.section === 'Calendar';
    if (scope === 'inbox') return item.section === 'Inbox';
    return true;
};

const rankItem = (item: SpotlightItem, queryTokens: string[], recentIndex: number): number | null => {
    const title = normalize(item.title);
    const subtitle = normalize(item.subtitle || '');
    const keywordText = normalize((item.keywords || []).join(' '));

    if (queryTokens.length === 0) {
        let score = getSectionBaseScore(item.section) + getFreshnessBoost(item.updatedAt);
        if (recentIndex >= 0) {
            score += 150 - recentIndex * 12;
        }
        return score;
    }

    let total = getSectionBaseScore(item.section);
    if (recentIndex >= 0) {
        total += 20 - recentIndex * 2;
    }

    for (const token of queryTokens) {
        let tokenScore = 0;

        if (title === token) tokenScore = Math.max(tokenScore, 200);
        if (title.startsWith(token)) tokenScore = Math.max(tokenScore, 140);
        if (title.includes(token)) tokenScore = Math.max(tokenScore, 105);
        if (subtitle.includes(token)) tokenScore = Math.max(tokenScore, 70);
        if (keywordText.includes(token)) tokenScore = Math.max(tokenScore, 85);

        const fuzzyTitleScore = fuzzySequenceScore(title, token);
        if (fuzzyTitleScore > 0) {
            tokenScore = Math.max(tokenScore, 35 + Math.min(35, fuzzyTitleScore));
        }

        const fuzzyKeywordScore = fuzzySequenceScore(keywordText, token);
        if (fuzzyKeywordScore > 0) {
            tokenScore = Math.max(tokenScore, 20 + Math.min(20, fuzzyKeywordScore));
        }

        if (tokenScore === 0) {
            return null;
        }

        total += tokenScore;
    }

    total += getFreshnessBoost(item.updatedAt);
    return total;
};

const rankSpotlightItems = (
    items: SpotlightItem[],
    query: string,
    scope: SpotlightScope,
    recentItemIds: string[]
): RankedSpotlightItem[] => {
    const queryTokens = normalize(query).split(/\s+/).filter(Boolean);
    const scored: RankedSpotlightItem[] = [];

    for (const item of items) {
        if (!matchesScope(item, scope)) continue;
        const recentIndex = recentItemIds.indexOf(item.id);
        const score = rankItem(item, queryTokens, recentIndex);
        if (score === null) continue;
        scored.push({ ...item, score });
    }

    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if ((b.updatedAt || 0) !== (a.updatedAt || 0)) return (b.updatedAt || 0) - (a.updatedAt || 0);
        return a.title.localeCompare(b.title);
    });

    return scored.slice(0, MAX_RESULTS);
};

const formatEventDate = (value: string): string => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Unknown date';

    return parsed.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

const formatInboxDate = (value: string): string => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Unknown date';

    return parsed.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

const SectionGlyph = ({ section, activeColor }: { section: SpotlightSection; activeColor: string }) => {
    switch (section) {
        case 'Actions':
            return <Sparkles size={14} color={activeColor} strokeWidth={2.3} />;
        case 'Navigation':
            return <Compass size={14} color={activeColor} strokeWidth={2.3} />;
        case 'Settings':
            return <Settings size={14} color={activeColor} strokeWidth={2.3} />;
        case 'Calendar':
            return <CalendarDays size={14} color={activeColor} strokeWidth={2.3} />;
        case 'Inbox':
            return <InboxIcon size={14} color={activeColor} strokeWidth={2.3} />;
        default:
            return null;
    }
};

const HighlightedLabel = ({
    text,
    query,
    className,
    highlightClassName,
}: {
    text: string;
    query: string;
    className: string;
    highlightClassName: string;
}) => {
    const firstToken = normalize(query).split(/\s+/).filter(Boolean)[0];
    if (!firstToken) {
        return <Text className={className}>{text}</Text>;
    }

    const lowered = text.toLowerCase();
    const matchIndex = lowered.indexOf(firstToken);
    if (matchIndex < 0) {
        return <Text className={className}>{text}</Text>;
    }

    const before = text.slice(0, matchIndex);
    const match = text.slice(matchIndex, matchIndex + firstToken.length);
    const after = text.slice(matchIndex + firstToken.length);

    return (
        <Text className={className}>
            {before}
            <Text className={highlightClassName}>{match}</Text>
            {after}
        </Text>
    );
};

export function SpotlightOverlay() {
    const { session } = useSession();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const isOpen = useSpotlightStore((state) => state.isOpen);
    const query = useSpotlightStore((state) => state.query);
    const scope = useSpotlightStore((state) => state.scope);
    const activeIndex = useSpotlightStore((state) => state.activeIndex);
    const recentItemIds = useSpotlightStore((state) => state.recentItemIds);
    const openSource = useSpotlightStore((state) => state.source);
    const close = useSpotlightStore((state) => state.close);
    const setQuery = useSpotlightStore((state) => state.setQuery);
    const setScope = useSpotlightStore((state) => state.setScope);
    const setActiveIndex = useSpotlightStore((state) => state.setActiveIndex);
    const registerRecent = useSpotlightStore((state) => state.registerRecent);

    const messages = useInboxStore((state) => state.messages);
    const fetchMessages = useInboxStore((state) => state.fetchMessages);
    const events = useCareerStore((state) => state.events);
    const fetchEvents = useCareerStore((state) => state.fetchEvents);
    const user = useUserStore((state) => state.user);
    const updateUser = useUserStore((state) => state.updateUser);

    const inputRef = React.useRef<TextInput>(null);
    const rankedItemsRef = React.useRef<RankedSpotlightItem[]>([]);
    const [keyboardVisible, setKeyboardVisible] = React.useState(false);
    const sheetTranslateY = React.useRef(new Animated.Value(0)).current;

    const isCompactViewport = width < COMPACT_BREAKPOINT;
    const useBottomSheetLayout = Platform.OS !== 'web' || isCompactViewport;
    const usesPrimaryEntry = useBottomSheetLayout && openSource === 'primary';
    const usePrimaryDrawerLayout = usesPrimaryEntry;
    const showInlineSheetInput = !usesPrimaryEntry;

    const navigationItems = React.useMemo<SpotlightItem[]>(
        () => [
            {
                id: 'nav:home',
                kind: 'navigation',
                section: 'Navigation',
                title: 'Home Hub',
                subtitle: 'Dashboard and status overview',
                keywords: ['home', 'hub', 'dashboard'],
                run: () => router.push('/(hub)' as any),
            },
            {
                id: 'nav:calendar',
                kind: 'navigation',
                section: 'Navigation',
                title: 'Calendar',
                subtitle: 'Career events and musters',
                keywords: ['events', 'schedule', 'muster'],
                run: () => router.push('/calendar' as any),
            },
            {
                id: 'nav:inbox',
                kind: 'navigation',
                section: 'Navigation',
                title: 'Inbox',
                subtitle: 'Messages and official correspondence',
                keywords: ['messages', 'navadmin', 'alnav'],
                run: () => router.push('/inbox' as any),
            },
            {
                id: 'nav:menu',
                kind: 'navigation',
                section: 'Navigation',
                title: 'Menu Hub',
                subtitle: 'App modules and shortcuts',
                keywords: ['menu', 'modules', 'tools'],
                run: () => router.push('/menu' as any),
            },
            {
                id: 'nav:assignment',
                kind: 'navigation',
                section: 'Navigation',
                title: 'My Assignment',
                subtitle: 'Assignment dashboard and cycle',
                keywords: ['assignment', 'cycle', 'discover'],
                run: () => router.push('/(assignment)' as any),
            },
            {
                id: 'nav:profile-preferences',
                kind: 'navigation',
                section: 'Navigation',
                title: 'Profile Preferences',
                subtitle: 'Duty and region preferences',
                keywords: ['profile', 'preferences', 'regions', 'duty'],
                run: () => router.push('/(profile)/preferences' as any),
            },
        ],
        [router]
    );

    const actionItems = React.useMemo<SpotlightItem[]>(
        () => [
            {
                id: 'action:refresh-inbox',
                kind: 'action',
                section: 'Actions',
                title: 'Refresh Inbox Data',
                subtitle: 'Pull latest correspondence records',
                keywords: ['sync', 'refresh', 'messages'],
                run: async () => {
                    await fetchMessages({ force: true });
                    router.push('/inbox' as any);
                },
            },
            {
                id: 'action:refresh-calendar',
                kind: 'action',
                section: 'Actions',
                title: 'Refresh Calendar Data',
                subtitle: 'Sync career events and musters',
                keywords: ['sync', 'refresh', 'events'],
                run: async () => {
                    await fetchEvents({ force: true });
                    router.push('/calendar' as any);
                },
            },
            {
                id: 'action:new-leave-request',
                kind: 'action',
                section: 'Actions',
                title: 'Start Leave Request',
                subtitle: 'Open leave request wizard',
                keywords: ['leave', 'request', 'admin'],
                run: () => router.push('/leave/request' as any),
            },
        ],
        [fetchEvents, fetchMessages, router]
    );

    const settingsItems = React.useMemo<SpotlightItem[]>(
        () => [
            {
                id: 'setting:privacy-mode',
                kind: 'setting',
                section: 'Settings',
                title: `Privacy Mode (${user?.privacyMode ? 'On' : 'Off'})`,
                subtitle: 'Toggle greeting privacy in Home Hub',
                keywords: ['privacy', 'name', 'rank', 'greeting'],
                run: () => {
                    updateUser({ privacyMode: !(user?.privacyMode ?? false) });
                },
            },
            {
                id: 'setting:preferences',
                kind: 'setting',
                section: 'Settings',
                title: 'Preference Settings',
                subtitle: 'Open duty type and region settings',
                keywords: ['settings', 'preferences', 'profile', 'region', 'duty'],
                run: () => router.push('/(profile)/preferences' as any),
            },
        ],
        [router, updateUser, user?.privacyMode]
    );

    const calendarItems = React.useMemo<SpotlightItem[]>(
        () =>
            events.map((event) => ({
                id: `calendar:${event.eventId}`,
                kind: 'calendar_event' as const,
                section: 'Calendar' as const,
                title: event.title,
                subtitle: `${formatEventDate(event.date)} • ${event.location}`,
                keywords: [
                    event.eventType.replace(/_/g, ' '),
                    event.priority,
                    event.attendanceStatus,
                    event.location,
                ],
                updatedAt: new Date(event.date).getTime(),
                run: () => router.push('/calendar' as any),
            })),
        [events, router]
    );

    const inboxItems = React.useMemo<SpotlightItem[]>(
        () =>
            [...messages]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((message) => ({
                    id: `inbox:${message.id}`,
                    kind: 'inbox_message' as const,
                    section: 'Inbox' as const,
                    title: message.subject,
                    subtitle: `${message.type} • ${formatInboxDate(message.timestamp)}`,
                    keywords: [message.type, message.body],
                    updatedAt: new Date(message.timestamp).getTime(),
                    run: () => router.push(`/inbox/${message.id}` as any),
                })),
        [messages, router]
    );

    const allItems = React.useMemo(
        () => [...actionItems, ...navigationItems, ...settingsItems, ...calendarItems, ...inboxItems],
        [actionItems, navigationItems, settingsItems, calendarItems, inboxItems]
    );

    const rankedItems = React.useMemo(
        () => rankSpotlightItems(allItems, query, scope, recentItemIds),
        [allItems, query, scope, recentItemIds]
    );

    rankedItemsRef.current = rankedItems;

    const groupedSections = React.useMemo(() => {
        const grouped = new Map<SpotlightSection, RankedSpotlightItem[]>(
            SECTION_ORDER.map((section) => [section, []])
        );

        rankedItems.forEach((item) => {
            grouped.get(item.section)?.push(item);
        });

        return SECTION_ORDER.map((section) => ({
            section,
            items: grouped.get(section) || [],
        })).filter((entry) => entry.items.length > 0);
    }, [rankedItems]);

    const rows = React.useMemo(() => {
        const result: Array<
            | { type: 'section'; section: SpotlightSection; id: string }
            | { type: 'item'; item: RankedSpotlightItem; id: string; itemIndex: number }
        > = [];

        let itemIndex = 0;
        groupedSections.forEach(({ section, items }) => {
            result.push({ type: 'section', section, id: `section:${section}` });
            items.forEach((item) => {
                result.push({ type: 'item', item, id: `item:${item.id}`, itemIndex });
                itemIndex += 1;
            });
        });

        return result;
    }, [groupedSections]);

    const executeItem = React.useCallback(
        async (item: RankedSpotlightItem) => {
            registerRecent(item.id);
            close();
            Keyboard.dismiss();
            await Promise.resolve(item.run());
        },
        [close, registerRecent]
    );

    const closeWithKeyboardGuard = React.useCallback(() => {
        if (keyboardVisible) {
            Keyboard.dismiss();
            return;
        }
        close();
    }, [close, keyboardVisible]);

    const panResponder = React.useMemo(
        () =>
            PanResponder.create({
                onMoveShouldSetPanResponder: (_, gesture) =>
                    Math.abs(gesture.dy) > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
                onPanResponderMove: (_, gesture) => {
                    if (gesture.dy > 0) {
                        sheetTranslateY.setValue(gesture.dy);
                    }
                },
                onPanResponderRelease: (_, gesture) => {
                    if (gesture.dy > 110 || gesture.vy > 1.1) {
                        close();
                        return;
                    }

                    Animated.spring(sheetTranslateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        speed: 26,
                        bounciness: 0,
                    }).start();
                },
                onPanResponderTerminate: () => {
                    Animated.spring(sheetTranslateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        speed: 26,
                        bounciness: 0,
                    }).start();
                },
            }),
        [closeWithKeyboardGuard, sheetTranslateY]
    );

    React.useEffect(() => {
        if (!isOpen || !session) return;
        fetchMessages().catch(() => undefined);
        fetchEvents().catch(() => undefined);
    }, [fetchEvents, fetchMessages, isOpen, session]);

    React.useEffect(() => {
        if (!isOpen || !showInlineSheetInput) return;

        const focusInput = () => {
            inputRef.current?.focus();
        };

        const frameId = requestAnimationFrame(focusInput);
        // Mobile can miss the first focus while the sheet animates in; retry a few times.
        const retry1 = setTimeout(focusInput, 90);
        const retry2 = setTimeout(focusInput, 220);
        const retry3 = setTimeout(focusInput, 420);

        return () => {
            cancelAnimationFrame(frameId);
            clearTimeout(retry1);
            clearTimeout(retry2);
            clearTimeout(retry3);
        };
    }, [isOpen, showInlineSheetInput]);

    React.useEffect(() => {
        if (!isOpen || !useBottomSheetLayout) return;

        sheetTranslateY.setValue(usesPrimaryEntry ? -18 : 36);
        Animated.spring(sheetTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            speed: 24,
            bounciness: 0,
        }).start();
    }, [isOpen, sheetTranslateY, useBottomSheetLayout, usesPrimaryEntry]);

    React.useEffect(() => {
        if (Platform.OS === 'web') return;

        const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    React.useEffect(() => {
        if (Platform.OS !== 'android' || !isOpen) return;

        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            if (keyboardVisible) {
                close();
                return true;
            }
            close();
            return true;
        });

        return () => sub.remove();
    }, [close, isOpen, keyboardVisible]);

    React.useEffect(() => {
        if (!isOpen) return;

        if (rankedItems.length === 0) {
            setActiveIndex(0);
            return;
        }

        if (activeIndex > rankedItems.length - 1) {
            setActiveIndex(rankedItems.length - 1);
        }
    }, [activeIndex, isOpen, rankedItems.length, setActiveIndex]);

    React.useEffect(() => {
        if (Platform.OS !== 'web') return;

        const onKeyDown = (event: KeyboardEvent) => {
            const pressedSearchShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';

            if (pressedSearchShortcut) {
                event.preventDefault();
                if (!session) return;
                const spotlight = useSpotlightStore.getState();
                if (spotlight.isOpen) {
                    spotlight.close();
                } else {
                    spotlight.open();
                }
                return;
            }

            const spotlight = useSpotlightStore.getState();
            if (!spotlight.isOpen) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                spotlight.close();
                return;
            }

            const currentItems = rankedItemsRef.current;
            if (currentItems.length === 0) return;

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                spotlight.setActiveIndex(Math.min(spotlight.activeIndex + 1, currentItems.length - 1));
                return;
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                spotlight.setActiveIndex(Math.max(spotlight.activeIndex - 1, 0));
                return;
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                const selected = currentItems[spotlight.activeIndex] || currentItems[0];
                if (selected) {
                    void executeItem(selected);
                }
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [executeItem, session]);

    if (!session || !isOpen) return null;

    const inputBackgroundClass = isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200';
    const mobileCollapsedHeight = Math.min(height * 0.62, height - Math.max(insets.top, 10) - 84);
    const mobileExpandedHeight = Math.min(height * 0.88, height - Math.max(insets.top, 8) - 10);
    const mobileSheetHeight = keyboardVisible ? mobileExpandedHeight : mobileCollapsedHeight;
    const desktopPanelHeight = Math.min(height * 0.82, height - Math.max(insets.top, 12) - 18);

    const runQuickRoute = (route: string) => {
        close();
        router.push(route as any);
    };

    const renderEmptyState = (
        <View className="px-6 py-12 items-center">
            <Text className="text-slate-900 dark:text-white font-semibold mb-2">
                {query ? `No results for "${query}"` : 'Start typing to search'}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-center mb-4">
                Search app navigation, settings, calendar events, and inbox messages.
            </Text>

            {query ? (
                <View className="flex-row flex-wrap justify-center gap-2">
                    <Pressable
                        onPress={() => runQuickRoute('/calendar')}
                        className="px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                        <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Go to Calendar
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => runQuickRoute('/inbox')}
                        className="px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                        <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Open Inbox
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => runQuickRoute('/(profile)/preferences')}
                        className="px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                        <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Search Settings
                        </Text>
                    </Pressable>
                </View>
            ) : null}
        </View>
    );

    const renderResultRows = (
        <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: keyboardVisible ? 14 : 24 }}
        >
            {rows.length === 0
                ? renderEmptyState
                : rows.map((row) => {
                    if (row.type === 'section') {
                        return (
                            <View key={row.id} className="px-4 pt-4 pb-2 flex-row items-center gap-2">
                                <SectionGlyph
                                    section={row.section}
                                    activeColor={isDark ? '#94a3b8' : '#64748b'}
                                />
                                <Text className="text-[11px] font-black uppercase tracking-[1.5px] text-slate-500 dark:text-slate-400">
                                    {row.section}
                                </Text>
                            </View>
                        );
                    }

                    const isActive = row.itemIndex === activeIndex;
                    return (
                        <Pressable
                            key={row.id}
                            onPress={() => {
                                void executeItem(row.item);
                            }}
                            onPressIn={() => setActiveIndex(row.itemIndex)}
                            onHoverIn={() => setActiveIndex(row.itemIndex)}
                            className={`mx-3 mb-1 rounded-2xl border ${isActive
                                ? 'bg-blue-50 dark:bg-blue-900/25 border-blue-200 dark:border-blue-700'
                                : 'bg-transparent border-transparent'
                                }`}
                        >
                            <View className="px-3 py-3 flex-row items-center">
                                <View className="flex-1 mr-3">
                                    <HighlightedLabel
                                        text={row.item.title}
                                        query={query}
                                        className={`text-sm font-semibold ${isActive
                                            ? 'text-blue-900 dark:text-blue-100'
                                            : 'text-slate-900 dark:text-white'
                                            }`}
                                        highlightClassName={isActive ? 'font-black' : 'font-bold text-blue-600'}
                                    />

                                    {row.item.subtitle ? (
                                        <HighlightedLabel
                                            text={row.item.subtitle}
                                            query={query}
                                            className={`text-xs mt-1 ${isActive
                                                ? 'text-blue-700 dark:text-blue-200'
                                                : 'text-slate-500 dark:text-slate-400'
                                                }`}
                                            highlightClassName={isActive ? 'font-semibold' : 'font-semibold text-slate-700 dark:text-slate-200'}
                                        />
                                    ) : null}
                                </View>

                                <ChevronRight
                                    size={16}
                                    color={isActive ? (isDark ? '#93c5fd' : '#1d4ed8') : (isDark ? '#475569' : '#94a3b8')}
                                    strokeWidth={2.5}
                                />
                            </View>
                        </Pressable>
                    );
                })}
        </ScrollView>
    );

    const renderSearchHeader = (showEscHint: boolean, showInput: boolean) => (
        <View className="px-4 pt-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            {showInput ? (
                <View className="flex-row items-center gap-2">
                    <View className={`flex-1 flex-row items-center rounded-2xl border px-3 py-2.5 ${inputBackgroundClass}`}>
                        <Search
                            size={18}
                            color={isDark ? '#94a3b8' : '#64748b'}
                            strokeWidth={2.4}
                            style={{ marginRight: 10 }}
                        />

                        <TextInput
                            ref={inputRef}
                            value={query}
                            onChangeText={(value) => {
                                setQuery(value);
                                setActiveIndex(0);
                            }}
                            placeholder="Search commands, settings, calendar, and inbox..."
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            autoCorrect={false}
                            autoCapitalize="none"
                            returnKeyType="search"
                            className="flex-1 text-slate-900 dark:text-white text-base"
                            style={{ outline: 'none' } as any}
                            accessibilityLabel="Global search input"
                            onSubmitEditing={() => {
                                const selected = rankedItems[activeIndex] || rankedItems[0];
                                if (selected) {
                                    void executeItem(selected);
                                }
                            }}
                        />

                        {showEscHint && Platform.OS === 'web' && (
                            <View className="ml-2 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700">
                                <Text className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Esc
                                </Text>
                            </View>
                        )}
                    </View>

                    <Pressable
                        onPress={close}
                        accessibilityRole="button"
                        accessibilityLabel="Close Spotlight search"
                        className="w-10 h-10 rounded-xl items-center justify-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                        <X size={18} color={isDark ? '#cbd5e1' : '#334155'} strokeWidth={2.5} />
                    </Pressable>
                </View>
            ) : (
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                        <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Spotlight Results
                        </Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Keep typing in the top search bar to refine results.
                        </Text>
                    </View>

                    <Pressable
                        onPress={close}
                        accessibilityRole="button"
                        accessibilityLabel="Close Spotlight search"
                        className="w-10 h-10 rounded-xl items-center justify-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                        <X size={18} color={isDark ? '#cbd5e1' : '#334155'} strokeWidth={2.5} />
                    </Pressable>
                </View>
            )}
        </View>
    );

    const renderScopeRow = (
        <View className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-row items-center gap-3">
            <View className="flex-1 flex-row flex-wrap gap-2">
                {SCOPE_OPTIONS.map((option) => {
                    const isSelected = scope === option.value;
                    return (
                        <Pressable
                            key={option.value}
                            onPress={() => setScope(option.value)}
                            className={`px-3 py-1.5 rounded-full border ${isSelected
                                ? 'bg-blue-600 border-blue-600'
                                : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                                }`}
                        >
                            <Text
                                className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                                    }`}
                            >
                                {option.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <Pressable
                onPress={close}
                hitSlop={8}
                className="w-8 h-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
                accessibilityLabel="Close search results"
                accessibilityRole="button"
            >
                <X size={16} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.5} />
            </Pressable>
        </View>
    );

    const topPassthroughHeight = usesPrimaryEntry ? Math.max(insets.top + 122, 134) : 0;
    const primaryDrawerTop = topPassthroughHeight;

    return (
        <View
            pointerEvents="box-none"
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                zIndex: 200,
            }}
        >
            {!usePrimaryDrawerLayout && (
                <Pressable
                    onPress={closeWithKeyboardGuard}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss search"
                    style={{
                        position: 'absolute',
                        top: topPassthroughHeight,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        backgroundColor: 'rgba(2, 6, 23, 0.58)',
                    }}
                />
            )}

            {useBottomSheetLayout ? (
                usePrimaryDrawerLayout ? (
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{
                            position: 'absolute',
                            top: primaryDrawerTop,
                            right: 0,
                            bottom: 0,
                            left: 0,
                        }}
                    >
                        <Animated.View
                            style={{
                                flex: 1,
                                transform: [{ translateY: sheetTranslateY }],
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                                borderTopWidth: 1,
                                borderRightWidth: 1,
                                borderLeftWidth: 1,
                                borderColor: isDark ? '#1e293b' : '#e2e8f0',
                                backgroundColor: isDark ? '#020617' : '#ffffff',
                                overflow: 'hidden',
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 0,
                                    height: -4,
                                },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 10,
                            }}
                        >
                            {renderScopeRow}
                            {renderResultRows}
                        </Animated.View>
                    </KeyboardAvoidingView>
                ) : (
                    <KeyboardAvoidingView
                        pointerEvents="box-none"
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    >
                        <Animated.View
                            style={{
                                marginTop: 'auto',
                                height: mobileSheetHeight,
                                transform: [{ translateY: sheetTranslateY }],
                                borderTopLeftRadius: 28,
                                borderTopRightRadius: 28,
                                borderWidth: 1,
                                borderColor: isDark ? '#1e293b' : '#e2e8f0',
                                backgroundColor: isDark ? '#020617' : '#ffffff',
                                overflow: 'hidden',
                            }}
                        >
                            <View
                                {...panResponder.panHandlers}
                                className="pt-2 pb-1 items-center"
                                accessibilityLabel="Swipe down to close Spotlight search"
                            >
                                <View className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                <Text className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    Swipe down to close
                                </Text>
                            </View>

                            {renderSearchHeader(false, showInlineSheetInput)}
                            {renderScopeRow}
                            {renderResultRows}

                            {keyboardVisible && (
                                <View
                                    style={{ paddingBottom: Math.max(insets.bottom, 8) }}
                                    className="px-4 py-3 border-t border-slate-200 dark:border-slate-800"
                                >
                                    <Pressable
                                        onPress={close}
                                        className="rounded-xl py-3 items-center bg-slate-900 dark:bg-slate-100"
                                        accessibilityRole="button"
                                        accessibilityLabel="Close search"
                                    >
                                        <Text className="font-semibold text-white dark:text-slate-900">
                                            Close
                                        </Text>
                                    </Pressable>
                                </View>
                            )}
                        </Animated.View>
                    </KeyboardAvoidingView>
                )
            ) : (
                <View
                    style={{
                        flex: 1,
                        paddingTop: Math.max(insets.top, 12) + 12,
                        paddingHorizontal: 12,
                    }}
                >
                    <View
                        className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                        style={{
                            alignSelf: 'center',
                            width: '100%',
                            maxWidth: 760,
                            maxHeight: desktopPanelHeight,
                        }}
                    >
                        {renderSearchHeader(true, true)}
                        {renderScopeRow}
                        {renderResultRows}
                    </View>
                </View>
            )}
        </View>
    );
}
