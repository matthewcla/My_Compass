import {
    computeCollapseDelta,
    computeCollapseDistanceFromScrollY,
    computeMinContentHeightForCollapse,
    computeDiffClampValue,
    computeProgressiveReservedBottomInset,
    computeRequiredCollapseTravel,
    computeReservedBottomInset,
    computeTabBarTranslateY,
    isCollapsedAtThreshold,
} from '@/components/navigation/collapseMath';

describe('collapseMath', () => {
    it('applies diff-clamp updates with bounds and direction changes', () => {
        let clamped = 0;

        clamped = computeDiffClampValue(clamped, 90, 120);
        expect(clamped).toBe(90);

        clamped = computeDiffClampValue(clamped, -50, 120);
        expect(clamped).toBe(40);

        clamped = computeDiffClampValue(clamped, 200, 120);
        expect(clamped).toBe(120);

        clamped = computeDiffClampValue(clamped, -200, 120);
        expect(clamped).toBe(0);
    });

    it('scales and caps per-frame collapse delta', () => {
        expect(computeCollapseDelta(0)).toBe(0);
        expect(computeCollapseDelta(10)).toBeCloseTo(1.2);
        expect(computeCollapseDelta(200)).toBe(4);
        expect(computeCollapseDelta(-200)).toBe(-4);
    });

    it('maps absolute scroll depth to bounded collapse distance', () => {
        expect(
            computeCollapseDistanceFromScrollY({
                currentScrollY: 40,
                maxDistance: 80,
                activationOffset: 80,
                multiplier: 0.3,
            })
        ).toBe(0);

        expect(
            computeCollapseDistanceFromScrollY({
                currentScrollY: 180,
                maxDistance: 80,
                activationOffset: 80,
                multiplier: 0.3,
            })
        ).toBeCloseTo(30);

        expect(
            computeCollapseDistanceFromScrollY({
                currentScrollY: 1000,
                maxDistance: 80,
                activationOffset: 80,
                multiplier: 0.3,
            })
        ).toBe(80);
    });

    it('produces smooth progressive values for sequential scroll positions', () => {
        const maxDistance = 48;
        const results: number[] = [];

        for (let scrollY = 0; scrollY <= 400; scrollY += 50) {
            const collapse = computeCollapseDistanceFromScrollY({
                currentScrollY: scrollY,
                maxDistance,
                activationOffset: 80,
                multiplier: 0.28,
            });
            results.push(collapse);
        }

        // scrollY: 0, 50, 100, 150, 200, 250, 300, 350, 400
        expect(results[0]).toBe(0);             // below activation
        expect(results[1]).toBe(0);             // below activation
        expect(results[2]).toBeCloseTo(5.6);    // (100-80)*0.28
        expect(results[3]).toBeCloseTo(19.6);   // (150-80)*0.28
        expect(results[4]).toBeCloseTo(33.6);   // (200-80)*0.28
        expect(results[5]).toBeCloseTo(47.6);   // (250-80)*0.28
        expect(results[6]).toBe(48);            // clamped to maxDistance
        expect(results[7]).toBe(48);            // clamped
        expect(results[8]).toBe(48);            // clamped
    });

    it('produces monotonically increasing values for increasing scroll positions', () => {
        const maxDistance = 72;
        let prev = 0;

        for (let scrollY = 0; scrollY <= 500; scrollY += 1) {
            const value = computeCollapseDistanceFromScrollY({
                currentScrollY: scrollY,
                maxDistance,
            });
            expect(value).toBeGreaterThanOrEqual(prev);
            prev = value;
        }
    });

    it('returns 0 for scroll positions within the activation dead zone', () => {
        expect(computeCollapseDistanceFromScrollY({ currentScrollY: 0, maxDistance: 80 })).toBe(0);
        expect(computeCollapseDistanceFromScrollY({ currentScrollY: 79, maxDistance: 80 })).toBe(0);
        expect(computeCollapseDistanceFromScrollY({ currentScrollY: 80, maxDistance: 80 })).toBe(0);
    });

    it('begins collapsing just past the activation offset', () => {
        const result = computeCollapseDistanceFromScrollY({ currentScrollY: 81, maxDistance: 80 });
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(1); // (81-80)*0.28 = 0.28
    });

    it('forces tab bar visible when overscrolling at top', () => {
        const nextTranslateY = computeTabBarTranslateY({
            currentTranslateY: 65,
            deltaY: -10,
            currentScrollY: -4,
            maxHeight: 80,
        });

        expect(nextTranslateY).toBe(0);
    });

    it('clamps tab bar translation to measured runtime max height', () => {
        const nextTranslateY = computeTabBarTranslateY({
            currentTranslateY: 30,
            deltaY: 70,
            currentScrollY: 320,
            maxHeight: 64,
        });

        expect(nextTranslateY).toBe(64);
    });

    it('switches reserved inset to collapsed inset at threshold', () => {
        const maxHeight = 84;
        const collapsedInset = 20;

        expect(isCollapsedAtThreshold(83.6, maxHeight)).toBe(true);
        expect(isCollapsedAtThreshold(60, maxHeight)).toBe(false);

        expect(
            computeReservedBottomInset({
                translateY: 83.6,
                maxHeight,
                collapsedInset,
            })
        ).toBe(collapsedInset);

        expect(
            computeReservedBottomInset({
                translateY: 40,
                maxHeight,
                collapsedInset,
            })
        ).toBe(maxHeight);
    });

    it('shrinks reserved inset progressively while tab bar hides', () => {
        const maxHeight = 84;
        const collapsedInset = 20;

        expect(
            computeProgressiveReservedBottomInset({
                translateY: 0,
                maxHeight,
                collapsedInset,
            })
        ).toBe(84);

        expect(
            computeProgressiveReservedBottomInset({
                translateY: 30,
                maxHeight,
                collapsedInset,
            })
        ).toBe(54);

        expect(
            computeProgressiveReservedBottomInset({
                translateY: 120,
                maxHeight,
                collapsedInset,
            })
        ).toBe(20);
    });

    it('computes required collapse travel from header and tab bar travel', () => {
        expect(
            computeRequiredCollapseTravel({
                scrollableHeaderHeight: 64,
                tabBarMaxHeight: 72,
                tabBarCollapsedInset: 20,
            })
        ).toBe(64);

        expect(
            computeRequiredCollapseTravel({
                scrollableHeaderHeight: 30,
                tabBarMaxHeight: 72,
                tabBarCollapsedInset: 20,
            })
        ).toBe(52);
    });

    it('computes min content height target for short-list compensation', () => {
        expect(
            computeMinContentHeightForCollapse({
                viewportHeight: null,
                requiredCollapseTravel: 60,
            })
        ).toBeNull();

        expect(
            computeMinContentHeightForCollapse({
                viewportHeight: 700,
                requiredCollapseTravel: 60,
            })
        ).toBe(760);
    });
});
