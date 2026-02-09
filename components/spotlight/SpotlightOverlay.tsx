import { useColorScheme } from '@/components/useColorScheme';
import { useSession } from '@/lib/ctx';
import { useCareerStore } from '@/store/useCareerStore';
import { useHeaderStore } from '@/store/useHeaderStore';
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
    Settings,
    Sparkles
} from 'lucide-react-native';
import React from 'react';
import {
    Animated,
    BackHandler,
    Easing,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
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
    const BODY_EXPAND_DURATION = 200;
    const TARGET_SCOPE_HEIGHT = 56;

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
    const close = useSpotlightStore((state) => state.close);
    const setQuery = useSpotlightStore((state) => state.setQuery);
    const setScope = useSpotlightStore((state) => state.setScope);
    const setActiveIndex = useSpotlightStore((state) => state.setActiveIndex);
    const registerRecent = useSpotlightStore((state) => state.registerRecent);
    const blurGlobalSearchInput = useHeaderStore((state) => state.blurGlobalSearchInput);
    const globalSearchFrame = useHeaderStore((state) => state.globalSearchFrame);
    const registerGlobalSearchSubmit = useHeaderStore((state) => state.registerGlobalSearchSubmit);
    const registerGlobalSearchDismiss = useHeaderStore((state) => state.registerGlobalSearchDismiss);

    const messages = useInboxStore((state) => state.messages);
    const fetchMessages = useInboxStore((state) => state.fetchMessages);
    const events = useCareerStore((state) => state.events);
    const fetchEvents = useCareerStore((state) => state.fetchEvents);
    const user = useUserStore((state) => state.user);
    const updateUser = useUserStore((state) => state.updateUser);

    const rankedItemsRef = React.useRef<RankedSpotlightItem[]>([]);
    const isClosingRef = React.useRef(false);
    const pendingDismissRef = React.useRef<Promise<void> | null>(null);
    const bodyProgress = React.useRef(new Animated.Value(0)).current;
    const backdropProgress = React.useRef(new Animated.Value(0)).current;

    const isCompactViewport = width < COMPACT_BREAKPOINT;

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

    const dismissSpotlight = React.useCallback((): Promise<void> => {
        if (pendingDismissRef.current) {
            return pendingDismissRef.current;
        }

        blurGlobalSearchInput();
        Keyboard.dismiss();
        bodyProgress.stopAnimation();
        backdropProgress.stopAnimation();

        if (!isOpen) {
            close();
            return Promise.resolve();
        }

        isClosingRef.current = true;

        pendingDismissRef.current = new Promise((resolve) => {
            Animated.parallel([
                Animated.timing(bodyProgress, {
                    toValue: 0,
                    duration: 140,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(backdropProgress, {
                    toValue: 0,
                    duration: 120,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start(() => {
                isClosingRef.current = false;
                pendingDismissRef.current = null;
                close();
                resolve();
            });
        });

        return pendingDismissRef.current;
    }, [backdropProgress, blurGlobalSearchInput, bodyProgress, close, isOpen]);

    const executeItem = React.useCallback(
        async (item: RankedSpotlightItem) => {
            registerRecent(item.id);
            await dismissSpotlight();
            await Promise.resolve(item.run());
        },
        [dismissSpotlight, registerRecent]
    );

    // Fetch data when spotlight opens
    React.useEffect(() => {
        if (!isOpen || !session) return;
        fetchMessages().catch(() => undefined);
        fetchEvents().catch(() => undefined);
    }, [fetchEvents, fetchMessages, isOpen, session]);

    // Open / close animation
    React.useEffect(() => {
        if (!isOpen) {
            bodyProgress.setValue(0);
            backdropProgress.setValue(0);
            isClosingRef.current = false;
            pendingDismissRef.current = null;
            return;
        }

        isClosingRef.current = false;
        pendingDismissRef.current = null;
        bodyProgress.setValue(0);
        backdropProgress.setValue(0);

        const openAnimation = Animated.parallel([
            Animated.timing(backdropProgress, {
                toValue: 1,
                duration: 180,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(bodyProgress, {
                toValue: 1,
                duration: BODY_EXPAND_DURATION,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),
        ]);

        openAnimation.start();

        return () => {
            openAnimation.stop();
        };
    }, [BODY_EXPAND_DURATION, backdropProgress, bodyProgress, isOpen]);

    // Register submit handler
    React.useEffect(() => {
        if (!isOpen) {
            registerGlobalSearchSubmit(null);
            return;
        }
        registerGlobalSearchSubmit(() => {
            const selected = rankedItemsRef.current[activeIndex] || rankedItemsRef.current[0];
            if (selected) void executeItem(selected);
        });
        return () => registerGlobalSearchSubmit(null);
    }, [isOpen, activeIndex, executeItem, registerGlobalSearchSubmit]);

    // Register dismiss handler
    React.useEffect(() => {
        if (!isOpen) {
            registerGlobalSearchDismiss(null);
            return;
        }
        registerGlobalSearchDismiss(() => {
            void dismissSpotlight();
        });
        return () => registerGlobalSearchDismiss(null);
    }, [isOpen, dismissSpotlight, registerGlobalSearchDismiss]);

    // Android back button
    React.useEffect(() => {
        if (Platform.OS !== 'android' || !isOpen) return;

        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            void dismissSpotlight();
            return true;
        });

        return () => sub.remove();
    }, [dismissSpotlight, isOpen]);

    // Cleanup when closed
    React.useEffect(() => {
        if (isOpen) return;
        blurGlobalSearchInput();
        Keyboard.dismiss();
    }, [blurGlobalSearchInput, isOpen]);

    // Active index bounds check
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

    // Web keyboard shortcuts
    React.useEffect(() => {
        if (Platform.OS !== 'web') return;

        const onKeyDown = (event: KeyboardEvent) => {
            const pressedSearchShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';

            if (pressedSearchShortcut) {
                event.preventDefault();
                if (!session) return;
                if (!globalSearchFrame) return; // No search bar visible
                const spotlight = useSpotlightStore.getState();
                if (spotlight.isOpen) {
                    void dismissSpotlight();
                } else {
                    spotlight.open();
                }
                return;
            }

            const spotlight = useSpotlightStore.getState();
            if (!spotlight.isOpen) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                void dismissSpotlight();
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
    }, [dismissSpotlight, executeItem, globalSearchFrame, session]);

    if (!session || !isOpen) return null;

    // Layout calculations
    const dropdownTop = globalSearchFrame ? globalSearchFrame.bottom : insets.top + 100;
    const dropdownLeft = globalSearchFrame ? globalSearchFrame.x : Math.max((width - (isCompactViewport ? width * 0.94 : Math.min(width - 24, 600))) / 2, 12);
    const dropdownWidth = globalSearchFrame ? globalSearchFrame.width : (isCompactViewport ? width * 0.94 : Math.min(width - 24, 600));
    const bodyMaxHeight = Math.max(0, Math.min(height * 0.6, height - dropdownTop - insets.bottom - 16));
    const expandedBodyHeight = TARGET_SCOPE_HEIGHT + bodyMaxHeight;

    const panelBodyHeight = bodyProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, expandedBodyHeight],
    });
    const backdropOpacity = backdropProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });
    const bodyOpacity = bodyProgress.interpolate({
        inputRange: [0, 0.3],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const runQuickRoute = async (route: string) => {
        await dismissSpotlight();
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
                        onPress={() => {
                            void runQuickRoute('/calendar');
                        }}
                        className="px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                        <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Go to Calendar
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            void runQuickRoute('/inbox');
                        }}
                        className="px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                        <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Open Inbox
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            void runQuickRoute('/(profile)/preferences');
                        }}
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
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
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

    const renderFilterChips = (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            style={{ flexGrow: 0 }}
        >
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
        </ScrollView>
    );

    const renderScopeRow = (
        <View className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex-row items-center gap-3">
            {renderFilterChips}
        </View>
    );

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
            {/* Backdrop — dims below search bar */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: dropdownTop,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    opacity: backdropOpacity,
                    backgroundColor: 'rgba(2, 6, 23, 0.58)',
                }}
            >
                <Pressable
                    onPress={() => {
                        void dismissSpotlight();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss search"
                    style={{ flex: 1 }}
                />
            </Animated.View>

            {/* Seam cover: prevents morph flicker while panel height animates from 0 */}
            <View
                style={{
                    position: 'absolute',
                    top: dropdownTop,
                    left: dropdownLeft,
                    width: dropdownWidth,
                    height: 4,
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderLeftWidth: 1,
                    borderRightWidth: 1,
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                }}
            />

            {/* Results dropdown — positioned below search bar */}
            <KeyboardAvoidingView
                pointerEvents="box-none"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                }}
            >
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: dropdownTop,
                        left: dropdownLeft,
                        width: dropdownWidth,
                        height: panelBodyHeight,
                        borderBottomLeftRadius: 24,
                        borderBottomRightRadius: 24,
                        borderWidth: 1,
                        borderTopWidth: 0,
                        borderColor: isDark ? '#1e293b' : '#e2e8f0',
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 12,
                        elevation: 10,
                        overflow: 'hidden',
                    }}
                >
                    <Animated.View style={{ opacity: bodyOpacity, flex: 1 }}>
                        {renderScopeRow}
                        <View style={{ maxHeight: bodyMaxHeight, flex: 1 }}>
                            {renderResultRows}
                        </View>
                    </Animated.View>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
}
