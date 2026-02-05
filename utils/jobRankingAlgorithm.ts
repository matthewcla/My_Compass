// utils/jobRankingAlgorithm.ts
// Job Preference Bracket Algorithm for My Compass
// Implements March Madness-style bracket system for job ranking

import type { Billet, SwipeDecision } from '@/types/schema';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Decision type for ranking.
 * - like/super/nope: User's swipe decision
 * - forced: Job assigned for ranking when user has no likes (in-cycle requirement)
 */
export type RankingDecision = SwipeDecision | 'forced';

/**
 * A job with its associated user decision.
 */
export interface RankedJob {
    billet: Billet;
    decision: RankingDecision;
}

/**
 * A seeded job with its calculated rank position.
 */
export interface SeededJob {
    seed: number;
    job: RankedJob;
    baseScore: number;
    finalScore: number;
}

/**
 * A bracket matchup pairing two jobs for comparison.
 */
export interface BracketMatchup {
    matchupId: string;
    roundNumber: number;
    higherSeed: SeededJob;
    lowerSeed: SeededJob;
    winner?: SeededJob;
    loser?: SeededJob;
}

/**
 * Result of a bracket round.
 */
export interface BracketRound {
    roundNumber: number;
    matchups: BracketMatchup[];
    byeJob?: SeededJob;
    isComplete: boolean;
}

/**
 * Configuration options for the ranking algorithm.
 */
export interface RankingConfig {
    /** Stochastic weight (0.0 to 1.0). Default: 0.15 */
    stochasticWeight: number;
    /** Bonus for super-liked jobs. Default: 200 */
    superLikeBonus: number;
    /** Bonus for normal liked jobs over forced. Default: 100 */
    likeBonus: number;
    /** Random seed for reproducible results */
    randomSeed?: number;
}

/**
 * State of an active bracket tournament.
 */
export interface BracketState {
    /** Initial seeding */
    seededJobs: SeededJob[];
    /** All rounds */
    rounds: BracketRound[];
    /** Current round number (1-indexed) */
    currentRound: number;
    /** Jobs eliminated with their elimination round */
    eliminationOrder: Array<{ job: SeededJob; eliminatedInRound: number }>;
    /** Final ranking (populated when tournament completes) */
    finalRanking: SeededJob[] | null;
    /** Is the tournament complete? */
    isComplete: boolean;
    /** Total rounds needed */
    totalRounds: number;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG: RankingConfig = {
    stochasticWeight: 0.15,
    superLikeBonus: 200,
    likeBonus: 100,
};

// =============================================================================
// SEEDED RANDOM NUMBER GENERATOR
// =============================================================================

// ES5-compatible multiply (replaces Math.imul)
function imul(a: number, b: number): number {
    const aHi = (a >>> 16) & 0xffff;
    const aLo = a & 0xffff;
    const bHi = (b >>> 16) & 0xffff;
    const bLo = b & 0xffff;
    return (aLo * bLo + (((aHi * bLo + aLo * bHi) << 16) >>> 0)) | 0;
}

// ES5-compatible log2
function log2(x: number): number {
    return Math.log(x) / Math.LN2;
}

function createSeededRandom(seed: number): () => number {
    let state = seed;
    return function (): number {
        state |= 0;
        state = (state + 0x6d2b79f5) | 0;
        let t = imul(state ^ (state >>> 15), 1 | state);
        t = (t + imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function gaussianRandom(random: () => number, mean: number, stdDev: number): number {
    const u1 = random();
    const u2 = random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
}

// =============================================================================
// JOB BRACKET GENERATOR CLASS
// =============================================================================

/**
 * Generates March Madness-style brackets for job preference ranking.
 * Users pick winners each round to determine final ranking.
 */
export class JobBracketGenerator {
    private jobs: RankedJob[];
    private config: RankingConfig;
    private random: () => number;
    private seededJobs: SeededJob[] = [];
    private bracketState: BracketState | null = null;

    constructor(jobs: RankedJob[], config: Partial<RankingConfig> = {}) {
        // Filter out 'nope' decisions - only rank liked/super-liked/forced jobs
        this.jobs = jobs.filter((j) => j.decision !== 'nope');
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.random =
            this.config.randomSeed !== undefined
                ? createSeededRandom(this.config.randomSeed)
                : Math.random;
    }

    // -------------------------------------------------------------------------
    // SCORING METHODS
    // -------------------------------------------------------------------------

    /**
     * Calculate base score for a job.
     * Tier hierarchy: super (200+) > like (100+) > forced (0+)
     */
    private calculateBaseScore(job: RankedJob): number {
        let typeBonus = 0;
        if (job.decision === 'super') {
            typeBonus = this.config.superLikeBonus;
        } else if (job.decision === 'like') {
            typeBonus = this.config.likeBonus;
        }
        // 'forced' gets no bonus, just match score
        return typeBonus + job.billet.compass.matchScore;
    }

    private calculateStochasticScore(baseScore: number): number {
        if (this.config.stochasticWeight === 0) {
            return baseScore;
        }
        const stdDev = baseScore * this.config.stochasticWeight;
        const variation = gaussianRandom(this.random, 0, stdDev);
        return baseScore + variation;
    }

    // -------------------------------------------------------------------------
    // SEEDING METHODS
    // -------------------------------------------------------------------------

    /**
     * Seed all jobs based on their scores.
     */
    seedJobs(): SeededJob[] {
        const scoredJobs = this.jobs.map((job) => {
            const baseScore = this.calculateBaseScore(job);
            const finalScore = this.calculateStochasticScore(baseScore);
            return { job, baseScore, finalScore };
        });

        scoredJobs.sort((a, b) => b.finalScore - a.finalScore);

        this.seededJobs = scoredJobs.map((scored, index) => ({
            seed: index + 1,
            job: scored.job,
            baseScore: scored.baseScore,
            finalScore: scored.finalScore,
        }));

        return this.seededJobs;
    }

    getSeededJobs(): SeededJob[] {
        if (this.seededJobs.length === 0) {
            this.seedJobs();
        }
        return [...this.seededJobs];
    }

    // -------------------------------------------------------------------------
    // BRACKET STATE MANAGEMENT
    // -------------------------------------------------------------------------

    /**
     * Initialize a new bracket tournament.
     * Returns the initial state with first round matchups.
     */
    initializeBracket(): BracketState {
        if (this.seededJobs.length === 0) {
            this.seedJobs();
        }

        const totalRounds = this.seededJobs.length <= 1 ? 0 : Math.ceil(log2(this.seededJobs.length));
        const firstRound = this.createRound(this.seededJobs, 1);

        this.bracketState = {
            seededJobs: [...this.seededJobs],
            rounds: [firstRound],
            currentRound: 1,
            eliminationOrder: [],
            finalRanking: null,
            isComplete: this.seededJobs.length <= 1,
            totalRounds,
        };

        // Handle single job case
        if (this.seededJobs.length === 1) {
            this.bracketState.finalRanking = [...this.seededJobs];
        }

        return this.bracketState;
    }

    /**
     * Get current bracket state.
     */
    getBracketState(): BracketState | null {
        return this.bracketState;
    }

    /**
     * Record user's winner selection for a matchup.
     * Returns updated bracket state.
     */
    selectWinner(matchupId: string, winnerBilletId: string): BracketState {
        if (!this.bracketState) {
            throw new Error('Bracket not initialized. Call initializeBracket() first.');
        }

        const currentRound = this.bracketState.rounds[this.bracketState.currentRound - 1];
        let matchup: BracketMatchup | undefined;
        for (let i = 0; i < currentRound.matchups.length; i++) {
            if (currentRound.matchups[i].matchupId === matchupId) {
                matchup = currentRound.matchups[i];
                break;
            }
        }

        if (!matchup) {
            throw new Error(`Matchup ${matchupId} not found in round ${this.bracketState.currentRound}`);
        }

        if (matchup.winner) {
            throw new Error(`Matchup ${matchupId} already has a winner selected`);
        }

        // Determine winner and loser
        const isHigherSeedWinner = matchup.higherSeed.job.billet.id === winnerBilletId;
        const isLowerSeedWinner = matchup.lowerSeed.job.billet.id === winnerBilletId;

        if (!isHigherSeedWinner && !isLowerSeedWinner) {
            throw new Error(`Billet ${winnerBilletId} is not in matchup ${matchupId}`);
        }

        matchup.winner = isHigherSeedWinner ? matchup.higherSeed : matchup.lowerSeed;
        matchup.loser = isHigherSeedWinner ? matchup.lowerSeed : matchup.higherSeed;

        // Record elimination
        this.bracketState.eliminationOrder.push({
            job: matchup.loser,
            eliminatedInRound: this.bracketState.currentRound,
        });

        // Check if round is complete
        const allMatchupsComplete = currentRound.matchups.every((m) => m.winner);
        if (allMatchupsComplete) {
            currentRound.isComplete = true;
            this.advanceToNextRound();
        }

        return this.bracketState;
    }

    /**
     * Advance to the next round after all matchups are complete.
     */
    private advanceToNextRound(): void {
        if (!this.bracketState) return;

        const currentRound = this.bracketState.rounds[this.bracketState.currentRound - 1];

        // Collect winners and bye job
        const winners: SeededJob[] = currentRound.matchups
            .filter((m) => m.winner)
            .map((m) => m.winner!);

        if (currentRound.byeJob) {
            winners.push(currentRound.byeJob);
        }

        // Check if tournament is complete
        if (winners.length === 1) {
            this.bracketState.isComplete = true;
            this.bracketState.finalRanking = this.calculateFinalRanking(winners[0]);
            return;
        }

        // Create next round
        const nextRoundNumber = this.bracketState.currentRound + 1;
        const nextRound = this.createRound(winners, nextRoundNumber);
        this.bracketState.rounds.push(nextRound);
        this.bracketState.currentRound = nextRoundNumber;
    }

    /**
     * Calculate final ranking based on elimination order.
     */
    private calculateFinalRanking(champion: SeededJob): SeededJob[] {
        if (!this.bracketState) return [champion];

        // Champion is #1, then reverse elimination order
        const ranking: SeededJob[] = [champion];

        // Add eliminated jobs in reverse order (last eliminated = 2nd place, etc.)
        const reversed = [...this.bracketState.eliminationOrder].reverse();
        for (const entry of reversed) {
            ranking.push(entry.job);
        }

        return ranking;
    }

    /**
     * Create a bracket round from participants.
     */
    private createRound(participants: SeededJob[], roundNumber: number): BracketRound {
        const sorted = [...participants].sort((a, b) => a.seed - b.seed);
        const matchups: BracketMatchup[] = [];
        let byeJob: SeededJob | undefined;

        // Handle odd number - middle/lowest seed gets bye
        if (sorted.length % 2 !== 0) {
            const middleIndex = Math.floor(sorted.length / 2);
            byeJob = sorted.splice(middleIndex, 1)[0];
        }

        // Create matchups: #1 vs last, #2 vs second-last, etc.
        const halfPoint = Math.floor(sorted.length / 2);
        for (let i = 0; i < halfPoint; i++) {
            matchups.push({
                matchupId: `r${roundNumber}-m${i + 1}`,
                roundNumber,
                higherSeed: sorted[i],
                lowerSeed: sorted[sorted.length - 1 - i],
            });
        }

        return {
            roundNumber,
            matchups,
            byeJob,
            isComplete: false,
        };
    }

    // -------------------------------------------------------------------------
    // UTILITY METHODS
    // -------------------------------------------------------------------------

    getJobCount(): number {
        return this.jobs.length;
    }

    getSuperLikeCount(): number {
        return this.jobs.filter((j) => j.decision === 'super').length;
    }

    getLikeCount(): number {
        return this.jobs.filter((j) => j.decision === 'like').length;
    }

    getForcedCount(): number {
        return this.jobs.filter((j) => j.decision === 'forced').length;
    }

    getTotalRounds(): number {
        if (this.jobs.length <= 1) return 0;
        return Math.ceil(log2(this.jobs.length));
    }

    getCurrentRound(): BracketRound | null {
        if (!this.bracketState) return null;
        return this.bracketState.rounds[this.bracketState.currentRound - 1] || null;
    }

    getPendingMatchups(): BracketMatchup[] {
        const round = this.getCurrentRound();
        if (!round) return [];
        return round.matchups.filter((m) => !m.winner);
    }
}

// =============================================================================
// FORCED RANKING GENERATOR
// =============================================================================

/**
 * Creates forced rankings for users who haven't liked any jobs but are in-cycle.
 * Uses match score only (no like bonuses) to generate initial seeding.
 */
export function createForcedRankingJobs(billets: Billet[]): RankedJob[] {
    return billets.map((billet) => ({
        billet,
        decision: 'forced' as RankingDecision,
    }));
}

/**
 * Generates a bracket for a user with no likes.
 * Typically used when user is in-cycle and must rank available jobs.
 */
export function createForcedBracket(
    billets: Billet[],
    config: Partial<RankingConfig> = {}
): JobBracketGenerator {
    const forcedJobs = createForcedRankingJobs(billets);
    return new JobBracketGenerator(forcedJobs, config);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a RankedJob from a Billet and decision.
 */
export function createRankedJob(billet: Billet, decision: RankingDecision): RankedJob {
    return { billet, decision };
}

/**
 * Quick-rank jobs without bracket (deterministic order).
 */
export function quickRankJobs(jobs: RankedJob[], config: Partial<RankingConfig> = {}): RankedJob[] {
    const generator = new JobBracketGenerator(jobs, config);
    const seeded = generator.seedJobs();
    return seeded.map((s) => s.job);
}

/**
 * Get the top N jobs by ranking.
 */
export function getTopJobs(
    jobs: RankedJob[],
    count: number,
    config: Partial<RankingConfig> = {}
): RankedJob[] {
    const ranked = quickRankJobs(jobs, config);
    return ranked.slice(0, count);
}

/**
 * Separate jobs by decision type with rankings.
 */
export function separateByDecision(
    jobs: RankedJob[],
    config: Partial<RankingConfig> = {}
): {
    superLiked: SeededJob[];
    normalLiked: SeededJob[];
    forced: SeededJob[];
} {
    const generator = new JobBracketGenerator(jobs, config);
    const seeded = generator.seedJobs();

    return {
        superLiked: seeded.filter((sj) => sj.job.decision === 'super'),
        normalLiked: seeded.filter((sj) => sj.job.decision === 'like'),
        forced: seeded.filter((sj) => sj.job.decision === 'forced'),
    };
}

/**
 * Calculate average match score for a set of jobs.
 */
export function calculateAverageMatchScore(jobs: RankedJob[]): number {
    if (jobs.length === 0) return 0;
    const total = jobs.reduce((sum, job) => sum + job.billet.compass.matchScore, 0);
    return total / jobs.length;
}

// =============================================================================
// SCORING TIER SUMMARY
// =============================================================================
//
// Tier 1: Super-likes (scores 200-300)
//   - Super-like bonus (200) + Match Score (0-100)
//
// Tier 2: Normal likes (scores 100-200)
//   - Like bonus (100) + Match Score (0-100)
//
// Tier 3: Forced rankings (scores 0-100)
//   - Match Score only (0-100)
//
// Guarantees:
//   - Any super-like beats any normal like
//   - Any normal like beats any forced ranking
//   - Within tiers, higher match scores rank higher
//
// =============================================================================
