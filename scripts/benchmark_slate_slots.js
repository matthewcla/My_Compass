
const { performance } = require('perf_hooks');

const RUNS = 1000000;
const SLOTS_COUNT = 7;

console.log(`Benchmarking slot rendering strategy with ${RUNS} iterations...`);

// Baseline: Array.from inside the loop
const startBaseline = performance.now();
for (let i = 0; i < RUNS; i++) {
    const slots = Array.from({ length: SLOTS_COUNT });
    slots.map((_, index) => {
        return index * 2; // Simulate some work
    });
}
const endBaseline = performance.now();
const baselineTime = endBaseline - startBaseline;

// Optimization: Static array defined outside
const STATIC_SLOTS = Array.from({ length: SLOTS_COUNT }, (_, i) => i);

const startOptimized = performance.now();
for (let i = 0; i < RUNS; i++) {
    STATIC_SLOTS.map((_, index) => {
        return index * 2; // Simulate same work
    });
}
const endOptimized = performance.now();
const optimizedTime = endOptimized - startOptimized;

console.log(`Baseline (Array.from inside): ${baselineTime.toFixed(4)}ms`);
console.log(`Optimized (Static Array): ${optimizedTime.toFixed(4)}ms`);

const improvement = ((baselineTime - optimizedTime) / baselineTime) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}%`);
