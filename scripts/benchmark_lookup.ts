
import { performance } from 'perf_hooks';

// Mock Types
interface Billet {
  id: string;
}

interface Application {
  id: string;
  billetId: string;
  userId: string;
  status: string;
}

const TEST_USER_ID = 'test-user-001';

// Setup Mock Data
const generateData = (numBillets: number, numApplications: number) => {
  const billets: Billet[] = [];
  for (let i = 0; i < numBillets; i++) {
    billets.push({ id: `billet-${i}` });
  }

  const applications: Record<string, Application> = {};
  for (let i = 0; i < numApplications; i++) {
    // Randomly assign applications to billets and users
    const billetId = `billet-${Math.floor(Math.random() * numBillets)}`;
    // 50% chance of being the test user
    const userId = Math.random() > 0.5 ? TEST_USER_ID : `other-user-${i}`;

    const appId = `app-${i}`;
    applications[appId] = {
      id: appId,
      billetId,
      userId,
      status: 'submitted'
    };
  }

  return { billets, applications };
};

const runBenchmark = () => {
  const NUM_BILLETS = 2000;
  const NUM_APPLICATIONS = 1000;
  const { billets, applications } = generateData(NUM_BILLETS, NUM_APPLICATIONS);

  console.log(`Benchmarking with ${NUM_BILLETS} billets and ${NUM_APPLICATIONS} applications.`);

  // --- Baseline: O(N*M) ---
  const startBaseline = performance.now();

  const resultsBaseline = billets.map(billet => {
    const app = Object.values(applications).find(
      (a) => a.billetId === billet.id && a.userId === TEST_USER_ID
    );
    return app?.status;
  });

  const endBaseline = performance.now();
  const timeBaseline = endBaseline - startBaseline;
  console.log(`Baseline (O(N*M)): ${timeBaseline.toFixed(4)} ms`);


  // --- Optimized: O(N) + O(M) ---
  const startOptimized = performance.now();

  // Create lookup map
  const applicationStatusMap = Object.values(applications).reduce((acc, app) => {
    if (app.userId === TEST_USER_ID) {
      acc[app.billetId] = app.status;
    }
    return acc;
  }, {} as Record<string, string>);

  const resultsOptimized = billets.map(billet => {
    return applicationStatusMap[billet.id];
  });

  const endOptimized = performance.now();
  const timeOptimized = endOptimized - startOptimized;
  console.log(`Optimized (Map Lookup): ${timeOptimized.toFixed(4)} ms`);

  // Verify correctness
  const isCorrect = JSON.stringify(resultsBaseline) === JSON.stringify(resultsOptimized);
  console.log(`Results Match: ${isCorrect}`);

  if (!isCorrect) {
      console.error("Mismatch in results!");
      process.exit(1);
  }

  const speedup = timeBaseline / timeOptimized;
  console.log(`Speedup: ${speedup.toFixed(2)}x`);
};

runBenchmark();
