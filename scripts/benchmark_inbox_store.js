
const ITERATIONS = 1000;
const LIST_SIZE = 500;

// Mock data generator
const generateMessages = (count) => {
    const messages = [];
    const baseTime = Date.now();
    for (let i = 0; i < count; i++) {
        messages.push({
            id: `msg-${i}`,
            timestamp: new Date(baseTime - i * 1000000).toISOString(),
            isRead: false,
            isPinned: false
        });
    }
    return messages;
};

const messages = generateMessages(LIST_SIZE);

// Old implementation
const sortByNewest_Old = (a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

const clipMessages_Old = (msgs) =>
    [...msgs].sort(sortByNewest_Old).slice(0, LIST_SIZE);

// New implementation 1: String Compare
const sortByNewest_String = (a, b) => {
    if (a.timestamp < b.timestamp) return 1;
    if (a.timestamp > b.timestamp) return -1;
    return 0;
};

const clipMessages_String = (msgs) =>
    [...msgs].sort(sortByNewest_String).slice(0, LIST_SIZE);

// New implementation 2: Date.parse
const sortByNewest_Parse = (a, b) =>
    Date.parse(b.timestamp) - Date.parse(a.timestamp);

const clipMessages_Parse = (msgs) =>
    [...msgs].sort(sortByNewest_Parse).slice(0, LIST_SIZE);


console.log(`Running benchmark with ${ITERATIONS} iterations on list of ${LIST_SIZE} items...`);

// Benchmark Old Sort
const startOld = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    clipMessages_Old([...messages]); // copy to sort
}
const endOld = performance.now();
const durationOld = endOld - startOld;

// Benchmark String Sort
const startString = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    clipMessages_String([...messages]);
}
const endString = performance.now();
const durationString = endString - startString;

// Benchmark Parse Sort
const startParse = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    clipMessages_Parse([...messages]);
}
const endParse = performance.now();
const durationParse = endParse - startParse;


console.log(`Old (new Date): ${durationOld.toFixed(2)}ms`);
console.log(`String Compare: ${durationString.toFixed(2)}ms`);
console.log(`Date.parse: ${durationParse.toFixed(2)}ms`);
