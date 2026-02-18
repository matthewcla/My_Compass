
const assert = require('assert');

const generateMessages = (count) => {
    const messages = [];
    const baseTime = Date.now();
    for (let i = 0; i < count; i++) {
        messages.push({
            id: `msg-${i}`,
            timestamp: new Date(baseTime - Math.floor(Math.random() * 10000000)).toISOString(),
        });
    }
    return messages;
};

const messages = generateMessages(100);

// Old Sort
const sortedOld = [...messages].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
);

// New Sort (String Compare)
const sortedNew = [...messages].sort((a, b) => {
    if (a.timestamp < b.timestamp) return 1;
    if (a.timestamp > b.timestamp) return -1;
    return 0;
});

// Verify
try {
    assert.deepStrictEqual(sortedOld, sortedNew);
    console.log('Verification PASSED: String sort matches Date sort.');
} catch (e) {
    console.error('Verification FAILED');
    // Find first mismatch
    for(let i=0; i<sortedOld.length; i++) {
        if(sortedOld[i].id !== sortedNew[i].id) {
            console.error(`Mismatch at index ${i}:`);
            console.error('Old:', sortedOld[i]);
            console.error('New:', sortedNew[i]);
            break;
        }
    }
    process.exit(1);
}
