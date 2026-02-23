export const mockStorage = new Map<string, string>();
export const setItemCalls = { count: 0 };

const AsyncStorage = {
    setItem: async (key: string, value: string) => {
        setItemCalls.count++;
        // Simulate serialization/IO overhead
        await new Promise(resolve => setTimeout(resolve, 5));
        mockStorage.set(key, value);
    },
    getItem: async (key: string) => {
        return mockStorage.get(key) || null;
    },
    removeItem: async (key: string) => {
        mockStorage.delete(key);
    },
    clear: async () => {
        mockStorage.clear();
    },
    getAllKeys: async () => {
        return Array.from(mockStorage.keys());
    }
};

export default AsyncStorage;
