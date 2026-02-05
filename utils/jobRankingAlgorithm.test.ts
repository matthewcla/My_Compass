// utils/jobRankingAlgorithm.test.ts
// Test suite for Job Ranking Bracket Algorithm

import type { Billet } from '@/types/schema';
import {
    JobBracketGenerator,
    createRankedJob,
    createForcedBracket,
    createForcedRankingJobs,
    quickRankJobs,
    separateByDecision,
    type RankedJob,
    type RankingDecision,
    type BracketState,
} from './jobRankingAlgorithm';

// =============================================================================
// MOCK BILLET FACTORY
// =============================================================================

function createMockBillet(id: string, title: string, matchScore: number): Billet {
    return {
        id,
        title,
        uic: 'UIC-' + id,
        location: 'Test Location',
        payGrade: 'E-6',
        compass: {
            matchScore,
            contextualNarrative: `Test narrative for ${title}`,
        },
        advertisementStatus: 'confirmed_open',
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    };
}

function createTestJobs(configs: Array<{ id: string; title: string; score: number; decision: RankingDecision }>): RankedJob[] {
    return configs.map(({ id, title, score, decision }) => ({
        billet: createMockBillet(id, title, score),
        decision,
    }));
}

// =============================================================================
// TEST SCENARIOS
// =============================================================================

/**
 * Test Case 1: All Super-Likes
 * User has super-liked multiple jobs, ranking by match score within super tier
 */
function testAllSuperLikes(): void {
    console.log('\n========== TEST: All Super-Likes ==========');

    const jobs = createTestJobs([
        { id: '1', title: 'Job A', score: 95, decision: 'super' },
        { id: '2', title: 'Job B', score: 88, decision: 'super' },
        { id: '3', title: 'Job C', score: 92, decision: 'super' },
        { id: '4', title: 'Job D', score: 75, decision: 'super' },
    ]);

    const bracket = new JobBracketGenerator(jobs, { stochasticWeight: 0, randomSeed: 42 });
    const seeded = bracket.seedJobs();

    console.log('Seeding (deterministic):');
    seeded.forEach((s) => {
        console.log(`  #${s.seed}: ${s.job.billet.title} (${s.job.billet.compass.matchScore}%) - Score: ${s.baseScore}`);
    });

    // Verify order: A(95) > C(92) > B(88) > D(75)
    const expectedOrder = ['Job A', 'Job C', 'Job B', 'Job D'];
    const actualOrder = seeded.map((s) => s.job.billet.title);
    console.log('\nExpected:', expectedOrder.join(' > '));
    console.log('Actual:  ', actualOrder.join(' > '));
    console.log('PASS:', JSON.stringify(expectedOrder) === JSON.stringify(actualOrder));
}

/**
 * Test Case 2: All Normal Likes
 * User has only normal-liked jobs
 */
function testAllNormalLikes(): void {
    console.log('\n========== TEST: All Normal Likes ==========');

    const jobs = createTestJobs([
        { id: '1', title: 'Job A', score: 85, decision: 'like' },
        { id: '2', title: 'Job B', score: 90, decision: 'like' },
        { id: '3', title: 'Job C', score: 70, decision: 'like' },
    ]);

    const bracket = new JobBracketGenerator(jobs, { stochasticWeight: 0 });
    const seeded = bracket.seedJobs();

    console.log('Seeding:');
    seeded.forEach((s) => {
        console.log(`  #${s.seed}: ${s.job.billet.title} (${s.job.billet.compass.matchScore}%) - Score: ${s.baseScore}`);
    });

    // Score = 100 (like bonus) + match score
    // B: 190, A: 185, C: 170
    const expectedOrder = ['Job B', 'Job A', 'Job C'];
    const actualOrder = seeded.map((s) => s.job.billet.title);
    console.log('\nExpected:', expectedOrder.join(' > '));
    console.log('Actual:  ', actualOrder.join(' > '));
    console.log('PASS:', JSON.stringify(expectedOrder) === JSON.stringify(actualOrder));
}

/**
 * Test Case 3: Mixed Super-Likes and Normal Likes
 * Verifies super-likes always rank above normal likes
 */
function testMixedLikes(): void {
    console.log('\n========== TEST: Mixed Super-Likes and Normal Likes ==========');

    const jobs = createTestJobs([
        { id: '1', title: 'Super Low Match', score: 50, decision: 'super' },
        { id: '2', title: 'Like High Match', score: 99, decision: 'like' },
        { id: '3', title: 'Super High Match', score: 95, decision: 'super' },
        { id: '4', title: 'Like Low Match', score: 60, decision: 'like' },
    ]);

    const bracket = new JobBracketGenerator(jobs, { stochasticWeight: 0 });
    const seeded = bracket.seedJobs();

    console.log('Seeding:');
    seeded.forEach((s) => {
        console.log(`  #${s.seed}: ${s.job.billet.title} (${s.job.decision}) - Score: ${s.baseScore}`);
    });

    // Super High: 295, Super Low: 250, Like High: 199, Like Low: 160
    // Super jobs should ALWAYS be above Like jobs
    const superJobs = seeded.filter((s) => s.job.decision === 'super');
    const likeJobs = seeded.filter((s) => s.job.decision === 'like');

    const allSupersAboveLikes = superJobs.every((sup) => likeJobs.every((like) => sup.seed < like.seed));

    console.log('\nAll super-likes rank above all normal likes:', allSupersAboveLikes);
    console.log('PASS:', allSupersAboveLikes);
}

/**
 * Test Case 4: Forced Rankings (No Likes - In Cycle)
 * User hasn't liked anything but must rank for cycle
 */
function testForcedRankings(): void {
    console.log('\n========== TEST: Forced Rankings (No Likes) ==========');

    const billets = [
        createMockBillet('1', 'Job A', 85),
        createMockBillet('2', 'Job B', 92),
        createMockBillet('3', 'Job C', 78),
        createMockBillet('4', 'Job D', 88),
    ];

    const bracket = createForcedBracket(billets, { stochasticWeight: 0 });
    const seeded = bracket.seedJobs();

    console.log('Forced Seeding (by match score only):');
    seeded.forEach((s) => {
        console.log(`  #${s.seed}: ${s.job.billet.title} (${s.job.billet.compass.matchScore}%) - Decision: ${s.job.decision}`);
    });

    // All should be 'forced' decision type
    const allForced = seeded.every((s) => s.job.decision === 'forced');
    // Order should be: B(92) > D(88) > A(85) > C(78)
    const expectedOrder = ['Job B', 'Job D', 'Job A', 'Job C'];
    const actualOrder = seeded.map((s) => s.job.billet.title);

    console.log('\nAll jobs marked as forced:', allForced);
    console.log('Expected order:', expectedOrder.join(' > '));
    console.log('Actual order:  ', actualOrder.join(' > '));
    console.log('PASS:', allForced && JSON.stringify(expectedOrder) === JSON.stringify(actualOrder));
}

/**
 * Test Case 5: Mixed with Forced Rankings
 * Some likes, some forced (edge case)
 */
function testMixedWithForced(): void {
    console.log('\n========== TEST: Mixed Likes with Forced ==========');

    const jobs = createTestJobs([
        { id: '1', title: 'Forced High', score: 99, decision: 'forced' },
        { id: '2', title: 'Like Low', score: 50, decision: 'like' },
        { id: '3', title: 'Super Low', score: 30, decision: 'super' },
    ]);

    const bracket = new JobBracketGenerator(jobs, { stochasticWeight: 0 });
    const seeded = bracket.seedJobs();

    console.log('Seeding:');
    seeded.forEach((s) => {
        console.log(`  #${s.seed}: ${s.job.billet.title} (${s.job.decision}, ${s.job.billet.compass.matchScore}%) - Score: ${s.baseScore}`);
    });

    // Super Low: 230, Like Low: 150, Forced High: 99
    // Tier order: super > like > forced
    const expectedOrder = ['Super Low', 'Like Low', 'Forced High'];
    const actualOrder = seeded.map((s) => s.job.billet.title);

    console.log('\nExpected:', expectedOrder.join(' > '));
    console.log('Actual:  ', actualOrder.join(' > '));
    console.log('PASS:', JSON.stringify(expectedOrder) === JSON.stringify(actualOrder));
}

/**
 * Test Case 6: Complete Bracket Tournament (User Picks Winners)
 * Simulates a full bracket with user selections
 */
function testCompleteBracket(): void {
    console.log('\n========== TEST: Complete Bracket Tournament ==========');

    const jobs = createTestJobs([
        { id: '1', title: 'Job A', score: 95, decision: 'super' },
        { id: '2', title: 'Job B', score: 88, decision: 'super' },
        { id: '3', title: 'Job C', score: 75, decision: 'like' },
        { id: '4', title: 'Job D', score: 65, decision: 'like' },
    ]);

    const bracket = new JobBracketGenerator(jobs, { stochasticWeight: 0 });
    const state = bracket.initializeBracket();

    console.log('Initial State:');
    console.log('  Total Jobs:', state.seededJobs.length);
    console.log('  Total Rounds:', state.totalRounds);
    console.log('  Current Round:', state.currentRound);

    console.log('\nSeeding:');
    state.seededJobs.forEach((s) => {
        console.log(`  #${s.seed}: ${s.job.billet.title}`);
    });

    // Round 1 matchups
    const round1 = state.rounds[0];
    console.log('\nRound 1 Matchups:');
    round1.matchups.forEach((m) => {
        console.log(`  ${m.matchupId}: ${m.higherSeed.job.billet.title} vs ${m.lowerSeed.job.billet.title}`);
    });

    // Simulate user picks: Always pick higher seed
    console.log('\nSimulating user picks (higher seed always wins)...');

    let currentState = state;
    let roundNum = 1;

    while (!currentState.isComplete) {
        const pendingMatchups = bracket.getPendingMatchups();

        if (pendingMatchups.length === 0) {
            console.log(`  Round ${roundNum} complete, advancing...`);
            roundNum++;
            continue;
        }

        for (const matchup of pendingMatchups) {
            // User picks the higher seed
            const winnerId = matchup.higherSeed.job.billet.id;
            console.log(`  User picks: ${matchup.higherSeed.job.billet.title} over ${matchup.lowerSeed.job.billet.title}`);
            currentState = bracket.selectWinner(matchup.matchupId, winnerId);
        }
    }

    console.log('\nTournament Complete!');
    console.log('Final Ranking:');
    currentState.finalRanking?.forEach((s, idx) => {
        console.log(`  ${idx + 1}. ${s.job.billet.title}`);
    });

    // Verify champion is Job A (highest seed that won all)
    const champion = currentState.finalRanking?.[0];
    console.log('\nPASS:', champion?.job.billet.title === 'Job A');
}

/**
 * Test Case 7: Odd Number of Jobs (Bye Handling)
 */
function testOddNumberBye(): void {
    console.log('\n========== TEST: Odd Number of Jobs (Bye) ==========');

    const jobs = createTestJobs([
        { id: '1', title: 'Job A', score: 95, decision: 'super' },
        { id: '2', title: 'Job B', score: 85, decision: 'super' },
        { id: '3', title: 'Job C', score: 75, decision: 'super' },
        { id: '4', title: 'Job D', score: 65, decision: 'like' },
        { id: '5', title: 'Job E', score: 55, decision: 'like' },
    ]);

    const bracket = new JobBracketGenerator(jobs, { stochasticWeight: 0 });
    const state = bracket.initializeBracket();

    const round1 = state.rounds[0];
    console.log('Round 1:');
    console.log('  Matchups:', round1.matchups.length);
    round1.matchups.forEach((m) => {
        console.log(`    ${m.higherSeed.job.billet.title} (#${m.higherSeed.seed}) vs ${m.lowerSeed.job.billet.title} (#${m.lowerSeed.seed})`);
    });

    if (round1.byeJob) {
        console.log(`  Bye: ${round1.byeJob.job.billet.title} (#${round1.byeJob.seed})`);
    }

    console.log('\nPASS:', round1.byeJob !== undefined && round1.matchups.length === 2);
}

/**
 * Test Case 8: Single Job (No Bracket Needed)
 */
function testSingleJob(): void {
    console.log('\n========== TEST: Single Job ==========');

    const jobs = createTestJobs([{ id: '1', title: 'Only Job', score: 80, decision: 'super' }]);

    const bracket = new JobBracketGenerator(jobs, { stochasticWeight: 0 });
    const state = bracket.initializeBracket();

    console.log('Total Rounds:', state.totalRounds);
    console.log('Is Complete:', state.isComplete);
    console.log('Final Ranking:', state.finalRanking?.map((s) => s.job.billet.title));

    console.log('\nPASS:', state.isComplete && state.totalRounds === 0 && state.finalRanking?.length === 1);
}

/**
 * Test Case 9: Two Jobs (Single Matchup)
 */
function testTwoJobs(): void {
    console.log('\n========== TEST: Two Jobs ==========');

    const jobs = createTestJobs([
        { id: '1', title: 'Job A', score: 90, decision: 'super' },
        { id: '2', title: 'Job B', score: 80, decision: 'like' },
    ]);

    const bracket = new JobBracketGenerator(jobs, { stochasticWeight: 0 });
    const state = bracket.initializeBracket();

    console.log('Round 1 Matchups:', state.rounds[0].matchups.length);

    // User picks Job B (the underdog)
    const updatedState = bracket.selectWinner('r1-m1', '2');

    console.log('User picked Job B');
    console.log('Is Complete:', updatedState.isComplete);
    console.log('Final Ranking:', updatedState.finalRanking?.map((s) => s.job.billet.title));

    // Job B should be #1 since user picked it
    console.log('\nPASS:', updatedState.finalRanking?.[0].job.billet.title === 'Job B');
}

/**
 * Test Case 10: Stochastic Variation
 * Verify randomness affects seeding
 */
function testStochasticVariation(): void {
    console.log('\n========== TEST: Stochastic Variation ==========');

    const jobs = createTestJobs([
        { id: '1', title: 'Job A', score: 80, decision: 'like' },
        { id: '2', title: 'Job B', score: 80, decision: 'like' },
        { id: '3', title: 'Job C', score: 80, decision: 'like' },
        { id: '4', title: 'Job D', score: 80, decision: 'like' },
    ]);

    // Run multiple times with different seeds
    const results: string[][] = [];

    for (let seed = 1; seed <= 5; seed++) {
        const bracket = new JobBracketGenerator(jobs, { stochasticWeight: 0.3, randomSeed: seed });
        const seeded = bracket.seedJobs();
        results.push(seeded.map((s) => s.job.billet.title));
    }

    console.log('Results with different seeds (stochastic=0.3):');
    results.forEach((r, i) => {
        console.log(`  Seed ${i + 1}: ${r.join(' > ')}`);
    });

    // Check if we got at least some variation
    const uniqueResults = new Set(results.map((r) => r.join(',')));
    console.log('\nUnique orderings:', uniqueResults.size);
    console.log('PASS:', uniqueResults.size > 1);
}

/**
 * Test Case 11: Large Bracket (16 jobs)
 */
function testLargeBracket(): void {
    console.log('\n========== TEST: Large Bracket (16 Jobs) ==========');

    const jobConfigs: Array<{ id: string; title: string; score: number; decision: RankingDecision }> = [];
    for (let i = 1; i <= 16; i++) {
        const decision: RankingDecision = i <= 4 ? 'super' : i <= 10 ? 'like' : 'forced';
        jobConfigs.push({
            id: String(i),
            title: `Job ${i}`,
            score: 100 - i * 5,
            decision,
        });
    }

    const jobs = createTestJobs(jobConfigs);
    const bracket = new JobBracketGenerator(jobs, { stochasticWeight: 0 });
    const state = bracket.initializeBracket();

    console.log('Total Jobs:', state.seededJobs.length);
    console.log('Total Rounds:', state.totalRounds);
    console.log('Round 1 Matchups:', state.rounds[0].matchups.length);

    // Count by type
    const byType = separateByDecision(jobs, { stochasticWeight: 0 });
    console.log('\nBy Decision Type:');
    console.log('  Super-liked:', byType.superLiked.length);
    console.log('  Normal-liked:', byType.normalLiked.length);
    console.log('  Forced:', byType.forced.length);

    // Verify 4 rounds for 16 jobs
    console.log('\nPASS:', state.totalRounds === 4 && state.rounds[0].matchups.length === 8);
}

// =============================================================================
// RUN ALL TESTS
// =============================================================================

export function runAllTests(): void {
    console.log('===============================================');
    console.log('   JOB RANKING ALGORITHM - TEST SUITE');
    console.log('===============================================');

    testAllSuperLikes();
    testAllNormalLikes();
    testMixedLikes();
    testForcedRankings();
    testMixedWithForced();
    testCompleteBracket();
    testOddNumberBye();
    testSingleJob();
    testTwoJobs();
    testStochasticVariation();
    testLargeBracket();

    console.log('\n===============================================');
    console.log('   ALL TESTS COMPLETE');
    console.log('===============================================\n');
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runAllTests();
}
