
interface Billet {
    id: string;
    [key: string]: any;
}

const MOCK_BILLETS: Billet[] = [
    {
        id: 'b1-uss-ford',
        title: 'OPERATIONS OFFICER',
    },
    {
        id: 'b2-uni-washington',
        title: 'NROTC INSTRUCTOR',
    },
    {
        id: 'b3-pentagon',
        title: 'JUNIOR STAFF OFFICER',
    },
];

// Mocking the 'set' function from zustand
const set = (state: any) => {
    // No-op for benchmark
};

async function fetchBilletsBaseline() {
    const start = Date.now();
    set({ isSyncingBillets: true });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Convert array to record for store
    const billetRecord: Record<string, Billet> = {};
    MOCK_BILLETS.forEach((billet) => {
        billetRecord[billet.id] = billet;
    });

    set({
        billets: billetRecord,
        lastBilletSyncAt: new Date().toISOString(),
        isSyncingBillets: false,
    });
    const end = Date.now();
    console.log(`Baseline Execution Time: ${(end - start).toFixed(2)} ms`);
}

async function fetchBilletsOptimized() {
    const start = Date.now();
    set({ isSyncingBillets: true });

    // Simulate API delay - REMOVED
    // await new Promise((resolve) => setTimeout(resolve, 800));

    // Convert array to record for store
    const billetRecord: Record<string, Billet> = {};
    MOCK_BILLETS.forEach((billet) => {
        billetRecord[billet.id] = billet;
    });

    set({
        billets: billetRecord,
        lastBilletSyncAt: new Date().toISOString(),
        isSyncingBillets: false,
    });
    const end = Date.now();
    console.log(`Optimized Execution Time: ${(end - start).toFixed(2)} ms`);
}

async function run() {
    console.log('Running Baseline...');
    await fetchBilletsBaseline();
    console.log('Running Optimized...');
    await fetchBilletsOptimized();
}

run();
