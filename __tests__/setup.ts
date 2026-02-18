// Jest setup for My Compass tests
// Mocks native modules that don't work in Node environment

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
    EventEmitter: jest.fn().mockImplementation(() => ({
        addListener: jest.fn(),
        removeAllListeners: jest.fn(),
        emit: jest.fn(),
    })),
    NativeModulesProxy: {},
    requireNativeModule: jest.fn(),
    requireOptionalNativeModule: jest.fn(),
    Platform: { OS: 'ios' },
}));

// Mock expo-sqlite with in-memory storage
const mockRows: Record<string, any[]> = {};

jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue({
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
        getFirstAsync: jest.fn().mockResolvedValue(null),
        getAllAsync: jest.fn().mockResolvedValue([]),
    }),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn().mockResolvedValue(null),
        setItem: jest.fn().mockResolvedValue(undefined),
        removeItem: jest.fn().mockResolvedValue(undefined),
        multiGet: jest.fn().mockResolvedValue([]),
        multiSet: jest.fn().mockResolvedValue(undefined),
        clear: jest.fn().mockResolvedValue(undefined),
    },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    selectionAsync: jest.fn(),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
    NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn().mockResolvedValue(null),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
    __esModule: true,
    default: {
        expoConfig: {
            extra: {},
        },
    },
}));

// Mock the storage service with an in-memory implementation
// This provides a working storage layer for store tests
const billetStore: Record<string, any> = {};
const applicationStore: Record<string, any> = {};
const decisionStore: Record<string, Record<string, string>> = {};
const leaveRequestStore: Record<string, any> = {};

jest.mock('@/services/storage', () => ({
    storage: {
        saveBillet: jest.fn().mockImplementation(async (billet: any) => {
            billetStore[billet.id] = billet;
        }),
        getBilletCount: jest.fn().mockImplementation(async () => Object.keys(billetStore).length),
        getPagedBillets: jest.fn().mockImplementation(async (limit: number, offset: number) => {
            const all = Object.values(billetStore);
            return all.slice(offset, offset + limit);
        }),
        saveApplication: jest.fn().mockImplementation(async (app: any) => {
            applicationStore[app.id] = app;
        }),
        saveApplications: jest.fn().mockImplementation(async (apps: any[]) => {
            apps.forEach(app => { applicationStore[app.id] = app; });
        }),
        deleteApplication: jest.fn().mockImplementation(async (id: string) => {
            delete applicationStore[id];
        }),
        getUserApplications: jest.fn().mockImplementation(async (_userId: string) => {
            return Object.values(applicationStore);
        }),
        saveAssignmentDecision: jest.fn().mockImplementation(async (userId: string, billetId: string, decision: string) => {
            if (!decisionStore[userId]) decisionStore[userId] = {};
            decisionStore[userId][billetId] = decision;
        }),
        removeAssignmentDecision: jest.fn().mockImplementation(async (userId: string, billetId: string) => {
            if (decisionStore[userId]) {
                delete decisionStore[userId][billetId];
            }
        }),
        getAssignmentDecisions: jest.fn().mockImplementation(async (userId: string) => {
            return decisionStore[userId] || {};
        }),
        saveLeaveRequest: jest.fn().mockImplementation(async (req: any) => {
            leaveRequestStore[req.id] = req;
        }),
        deleteLeaveRequest: jest.fn().mockImplementation(async (id: string) => {
            delete leaveRequestStore[id];
        }),
        getUserLeaveRequests: jest.fn().mockImplementation(async () => Object.values(leaveRequestStore)),
        getLeaveDefaults: jest.fn().mockResolvedValue(null),
        saveLeaveDefaults: jest.fn().mockResolvedValue(undefined),
        saveLeaveBalance: jest.fn().mockResolvedValue(undefined),
        getCareerEvents: jest.fn().mockResolvedValue([]),
        saveCareerEvents: jest.fn().mockResolvedValue(undefined),
        getInboxMessages: jest.fn().mockResolvedValue([]),
        saveInboxMessages: jest.fn().mockResolvedValue(undefined),
        updateInboxMessageReadStatus: jest.fn().mockResolvedValue(undefined),
        saveUser: jest.fn().mockResolvedValue(undefined),
        getUser: jest.fn().mockResolvedValue(null),
    },
}));

// Mock encryption
jest.mock('@/lib/encryption', () => ({
    encryptData: jest.fn((data: string) => data),
    decryptData: jest.fn((data: string) => data),
}));

// Clear in-memory stores between tests
beforeEach(() => {
    Object.keys(billetStore).forEach(k => delete billetStore[k]);
    Object.keys(applicationStore).forEach(k => delete applicationStore[k]);
    Object.keys(decisionStore).forEach(k => delete decisionStore[k]);
    Object.keys(leaveRequestStore).forEach(k => delete leaveRequestStore[k]);
});
