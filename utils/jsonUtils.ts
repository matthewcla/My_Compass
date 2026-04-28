export const safeJsonParse = (jsonString: string | null): any => {
    if (!jsonString) return null;
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn('Failed to parse JSON safely:', error);
        return null;
    }
};
