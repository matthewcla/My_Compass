
const ITERATIONS = 100000;
const SAMPLE_DATE = '2023-10-25T14:30:00Z';

function formatDTG_Original(dateString: string) {
    try {
        const date = new Date(dateString);
        const dd = date.getUTCDate().toString().padStart(2, '0');
        const hh = date.getUTCHours().toString().padStart(2, '0');
        const mm = date.getUTCMinutes().toString().padStart(2, '0');
        const mon = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
        const yy = date.getUTCFullYear().toString().slice(-2);
        return `${dd}${hh}${mm}Z ${mon} ${yy}`;
    } catch (e) {
        return '';
    }
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function formatDTG_Optimized(dateString: string) {
    try {
        const date = new Date(dateString);
        const dd = date.getUTCDate().toString().padStart(2, '0');
        const hh = date.getUTCHours().toString().padStart(2, '0');
        const mm = date.getUTCMinutes().toString().padStart(2, '0');
        const mon = MONTHS[date.getUTCMonth()];
        const yy = date.getUTCFullYear().toString().slice(-2);
        return `${dd}${hh}${mm}Z ${mon} ${yy}`;
    } catch (e) {
        return '';
    }
}

function runBenchmark() {
    console.log(`Running benchmark with ${ITERATIONS} iterations...`);

    const startOriginal = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        formatDTG_Original(SAMPLE_DATE);
    }
    const endOriginal = performance.now();
    const durationOriginal = endOriginal - startOriginal;

    const startOptimized = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        formatDTG_Optimized(SAMPLE_DATE);
    }
    const endOptimized = performance.now();
    const durationOptimized = endOptimized - startOptimized;

    console.log(`Original: ${durationOriginal.toFixed(2)}ms`);
    console.log(`Optimized: ${durationOptimized.toFixed(2)}ms`);
    console.log(`Improvement: ${(durationOriginal / durationOptimized).toFixed(2)}x faster`);

    // Verify output correctness
    const originalOutput = formatDTG_Original(SAMPLE_DATE);
    const optimizedOutput = formatDTG_Optimized(SAMPLE_DATE);
    if (originalOutput !== optimizedOutput) {
        console.error(`ERROR: Output mismatch! Original: '${originalOutput}', Optimized: '${optimizedOutput}'`);
        process.exit(1);
    } else {
        console.log(`Verification: Output matches ('${originalOutput}')`);
    }
}

runBenchmark();
