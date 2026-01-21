// Web-specific storage implementation
// SQLite is not available on web, so we use a stub/localStorage implementation

import {
    Application,
    Billet,
    LeaveRequest,
} from '@/types/schema';

export const initDatabase = async () => {
    console.log('Using web storage (localStorage). SQLite not available on web.');
};

export const getDB = async (): Promise<any> => {
    throw new Error('SQLite is not supported on web. Use localStorage or IndexedDB.');
};

// =============================================================================
// BILLET SERVICE (Web Stubs - using localStorage)
// =============================================================================

const BILLETS_KEY = 'my_compass_billets';

export const saveBillet = async (billet: Billet): Promise<void> => {
    const billets = await getAllBillets();
    const index = billets.findIndex((b) => b.id === billet.id);
    if (index >= 0) {
        billets[index] = billet;
    } else {
        billets.push(billet);
    }
    localStorage.setItem(BILLETS_KEY, JSON.stringify(billets));
};

export const getBillet = async (id: string): Promise<Billet | null> => {
    const billets = await getAllBillets();
    return billets.find((b) => b.id === id) || null;
};

export const getAllBillets = async (): Promise<Billet[]> => {
    const data = localStorage.getItem(BILLETS_KEY);
    return data ? JSON.parse(data) : [];
};

// =============================================================================
// APPLICATION SERVICE (Web Stubs - using localStorage)
// =============================================================================

const APPLICATIONS_KEY = 'my_compass_applications';

export const saveApplication = async (app: Application): Promise<void> => {
    const apps = await getAllApplications();
    const index = apps.findIndex((a) => a.id === app.id);
    if (index >= 0) {
        apps[index] = app;
    } else {
        apps.push(app);
    }
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
};

export const getApplication = async (id: string): Promise<Application | null> => {
    const apps = await getAllApplications();
    return apps.find((a) => a.id === id) || null;
};

export const getUserApplications = async (userId: string): Promise<Application[]> => {
    const apps = await getAllApplications();
    return apps.filter((a) => a.userId === userId);
};

const getAllApplications = async (): Promise<Application[]> => {
    const data = localStorage.getItem(APPLICATIONS_KEY);
    return data ? JSON.parse(data) : [];
};

// =============================================================================
// LEAVE REQUEST SERVICE (Web Stubs - using localStorage)
// =============================================================================

const LEAVE_REQUESTS_KEY = 'my_compass_leave_requests';

export const saveLeaveRequest = async (request: LeaveRequest): Promise<void> => {
    const requests = await getAllLeaveRequests();
    const index = requests.findIndex((r) => r.id === request.id);
    if (index >= 0) {
        requests[index] = request;
    } else {
        requests.push(request);
    }
    localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));
};

export const getLeaveRequest = async (id: string): Promise<LeaveRequest | null> => {
    const requests = await getAllLeaveRequests();
    return requests.find((r) => r.id === id) || null;
};

export const getUserLeaveRequests = async (userId: string): Promise<LeaveRequest[]> => {
    const requests = await getAllLeaveRequests();
    return requests.filter((r) => r.userId === userId);
};

const getAllLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const data = localStorage.getItem(LEAVE_REQUESTS_KEY);
    return data ? JSON.parse(data) : [];
};
