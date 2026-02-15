
const { performance } = require('perf_hooks');

// Mock data generation
const generateApplications = (count) => {
    const applications = {};
    const statuses = ['draft', 'submitted', 'confirmed', 'withdrawn', 'declined'];

    for (let i = 0; i < count; i++) {
        const id = `app-${i}`;
        applications[id] = {
            id,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            // Add other fields to simulate object size/complexity, though not strictly used in logic
            billetId: `billet-${i}`,
            userId: 'user-1',
            createdAt: new Date().toISOString()
        };
    }
    return applications;
};

const runBenchmark = () => {
    const ITERATIONS = 10000;
    const APP_COUNT = 1000; // Large enough to show measurable difference

    const applications = generateApplications(APP_COUNT);

    console.log(`Benchmarking with ${APP_COUNT} applications and ${ITERATIONS} iterations...`);

    // Baseline: Two filters (Simulated based on previous implementation)
    const startBaseline = performance.now();
    let baselineDraftTotal = 0;
    let baselineSubmittedTotal = 0;

    for (let i = 0; i < ITERATIONS; i++) {
        // Simulating the original implementation:
        // const draftCount = Object.values(applications).filter(app => app.status === 'draft').length;
        // const submittedCount = Object.values(applications).filter(app => ['submitted', 'confirmed'].includes(app.status)).length;

        const draftCount = Object.values(applications).filter(app => app.status === 'draft').length;
        const submittedCount = Object.values(applications).filter(app =>
            ['submitted', 'confirmed'].includes(app.status)
        ).length;

        baselineDraftTotal += draftCount;
        baselineSubmittedTotal += submittedCount;
    }
    const endBaseline = performance.now();

    // Optimization: Single loop (Current implementation)
    const startOpt = performance.now();
    let optDraftTotal = 0;
    let optSubmittedTotal = 0;

    for (let i = 0; i < ITERATIONS; i++) {
        let draftCount = 0;
        let submittedCount = 0;
        Object.values(applications).forEach(app => {
            if (app.status === 'draft') {
                draftCount++;
            } else if (['submitted', 'confirmed'].includes(app.status)) {
                submittedCount++;
            }
        });

        optDraftTotal += draftCount;
        optSubmittedTotal += submittedCount;
    }
    const endOpt = performance.now();

    console.log(`Baseline Time (2x Filter): ${(endBaseline - startBaseline).toFixed(2)}ms`);
    console.log(`Optimized Time (1x Loop): ${(endOpt - startOpt).toFixed(2)}ms`);

    const improvement = ((endBaseline - startBaseline) - (endOpt - startOpt)) / (endBaseline - startBaseline) * 100;
    console.log(`Improvement: ${improvement.toFixed(2)}%`);

    if (baselineDraftTotal !== optDraftTotal || baselineSubmittedTotal !== optSubmittedTotal) {
        console.error('ERROR: Result mismatch!');
        process.exit(1);
    } else {
        console.log('Verification: Results match.');
    }
};

runBenchmark();
