
const { performance } = require('perf_hooks');

const mockSegment = {
  id: 'seg-123',
  type: 'INTERMEDIATE',
  title: 'Intermediate Stop',
  location: {
    name: 'NAS Pensacola',
    uic: '54321',
    zip: '32508',
    type: 'DUTY_STATION',
  },
  dates: {
    projectedArrival: '2023-01-01',
    projectedDeparture: '2023-01-05',
    nlt: '2023-01-10',
  },
  entitlements: {
    authorizedTravelDays: 5,
    proceedDays: 2,
    leaveDays: 10,
  },
  userPlan: {
    mode: 'POV',
    isAccompanied: true,
    stops: [
      {
        id: 'stop-1',
        location: 'Hotel A',
        arrivalDate: '2023-01-02',
        departureDate: '2023-01-03',
        reason: 'LEISURE',
      },
      {
        id: 'stop-2',
        location: 'Hotel B',
        arrivalDate: '2023-01-03',
        departureDate: '2023-01-04',
        reason: 'OFFICIAL',
      },
    ],
  },
  status: 'PLANNING',
};

const mockSegmentNoStops = {
  ...mockSegment,
  userPlan: {
    mode: 'POV',
    isAccompanied: true,
    // stops is undefined
  }
};

function jsonClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function cloneSegment(segment) {
  return {
    ...segment,
    location: { ...segment.location },
    dates: { ...segment.dates },
    entitlements: { ...segment.entitlements },
    userPlan: {
      ...segment.userPlan,
      stops: segment.userPlan.stops ? segment.userPlan.stops.map(stop => ({ ...stop })) : [], // Initialize to empty array if undefined, matching logic in store
    },
  };
}

function runBenchmark(name, fn, iterations) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn(mockSegment);
  }
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(4)} ms`);
}

function runBenchmarkNoStops(name, fn, iterations) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn(mockSegmentNoStops);
  }
  const end = performance.now();
  console.log(`${name} (No Stops): ${(end - start).toFixed(4)} ms`);
}


const ITERATIONS = 100000;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

runBenchmark('JSON.parse(JSON.stringify)', jsonClone, ITERATIONS);
runBenchmark('cloneSegment (Manual)', cloneSegment, ITERATIONS);

console.log(`\nRunning benchmark (No Stops) with ${ITERATIONS} iterations...`);
runBenchmarkNoStops('JSON.parse(JSON.stringify)', jsonClone, ITERATIONS);
runBenchmarkNoStops('cloneSegment (Manual)', cloneSegment, ITERATIONS);
