const { parseISO, isBefore, isAfter, differenceInDays } = require('date-fns');

// Mock data
const requests = [];
const N = 10000;
const from = new Date();
const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

for (let i = 0; i < N; i++) {
    const start = new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 5 * 24 * 60 * 60 * 1000);
    requests.push({
        id: i.toString(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        chargeDays: 0,
        status: 'approved',
        leaveType: 'annual'
    });
}

function originalApproach() {
    let sum = 0;
    for (const req of requests) {
        try {
            const reqStart = parseISO(req.startDate);
            const reqEnd = parseISO(req.endDate);

            if (isBefore(reqEnd, from) || isAfter(reqStart, to)) continue;
            sum++;
        } catch {
            continue;
        }
    }
    return sum;
}

function optimizedApproach() {
    let sum = 0;
    const fromTime = from.getTime();
    const toTime = to.getTime();

    for (const req of requests) {
        try {
            const reqStart = new Date(req.startDate);
            const reqEnd = new Date(req.endDate);
            const reqStartTime = reqStart.getTime();
            const reqEndTime = reqEnd.getTime();

            if (isNaN(reqStartTime) || isNaN(reqEndTime)) continue;

            if (reqEndTime < fromTime || reqStartTime > toTime) continue;
            sum++;
        } catch {
            continue;
        }
    }
    return sum;
}

console.log('Running benchmark...');

console.time('Original (parseISO + date-fns checks)');
const res1 = originalApproach();
console.timeEnd('Original (parseISO + date-fns checks)');

console.time('Optimized (new Date + getTime comparison)');
const res2 = optimizedApproach();
console.timeEnd('Optimized (new Date + getTime comparison)');

console.log(`Results match: ${res1 === res2}`);
