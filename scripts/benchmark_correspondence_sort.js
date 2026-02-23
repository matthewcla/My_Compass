
const { performance } = require('perf_hooks');

// Generate a large array of objects with timestamps
const generateData = (count) => {
    const data = [];
    const now = Date.now();
    for (let i = 0; i < count; i++) {
        // Random time within the last year
        const timestamp = new Date(now - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString();
        data.push({
            id: i,
            timestamp: timestamp,
            payload: `Message ${i}`
        });
    }
    return data;
};

const runBenchmark = () => {
    const COUNT = 10000;
    const ITERATIONS = 100;

    console.log(`Generating ${COUNT} items...`);
    const originalData = generateData(COUNT);

    // Warmup
    [...originalData].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Test Old Implementation
    let start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        const data = [...originalData]; // Copy to avoid testing sort on already sorted array (though Timsort handles it well, we want consistent input)
        // Actually, sorting an already sorted array is faster, so we should shuffle or just copy.
        // But for meaningful comparison, we should sort the SAME data every time.
        // Sort in place on the copy.
        data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    let end = performance.now();
    const oldTime = end - start;
    console.log(`Old implementation (new Date()): ${oldTime.toFixed(2)}ms for ${ITERATIONS} iterations`);

    // Test New Implementation
    start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        const data = [...originalData];
        data.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
    end = performance.now();
    const newTime = end - start;
    console.log(`New implementation (localeCompare): ${newTime.toFixed(2)}ms for ${ITERATIONS} iterations`);

    // Test Alternative New Implementation (Lexicographical > <)
    start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        const data = [...originalData];
        // Descending: b > a ? 1 : -1
        // But equality? b > a ? 1 : (b < a ? -1 : 0)
        data.sort((a, b) => (b.timestamp > a.timestamp ? 1 : (b.timestamp < a.timestamp ? -1 : 0)));
    }
    end = performance.now();
    const newTime2 = end - start;
    console.log(`New implementation (direct string compare): ${newTime2.toFixed(2)}ms for ${ITERATIONS} iterations`);

    console.log(`Improvement (localeCompare): ${(oldTime / newTime).toFixed(2)}x faster`);
    console.log(`Improvement (direct compare): ${(oldTime / newTime2).toFixed(2)}x faster`);
};

runBenchmark();
