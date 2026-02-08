export const COLLAPSED_EPSILON = 0.5;
export const INSET_UPDATE_THRESHOLD = 2;
export const COLLAPSE_ACTIVATION_OFFSET = 80;
export const COLLAPSE_DELTA_SCALE = 0.12;
export const MAX_COLLAPSE_DELTA_PER_FRAME = 4;
export const COLLAPSE_SCROLL_MULTIPLIER = 0.28;
export const clamp = (value: number, min: number, max: number): number => {
    if (!Number.isFinite(value)) {
        return min;
    }

    if (value < min) {
        return min;
    }

    if (value > max) {
        return max;
    }

    return value;
};

export const computeDiffClampValue = (currentValue: number, deltaY: number, maxValue: number): number => {
    if (!Number.isFinite(deltaY) || !Number.isFinite(maxValue) || maxValue <= 0) {
        return 0;
    }

    return clamp(currentValue + deltaY, 0, maxValue);
};

export const computeCollapseDelta = (deltaY: number): number => {
    if (!Number.isFinite(deltaY)) {
        return 0;
    }

    return clamp(
        deltaY * COLLAPSE_DELTA_SCALE,
        -MAX_COLLAPSE_DELTA_PER_FRAME,
        MAX_COLLAPSE_DELTA_PER_FRAME
    );
};

export const computeCollapseDistanceFromScrollY = (args: {
    currentScrollY: number;
    maxDistance: number;
    activationOffset?: number;
    multiplier?: number;
}): number => {
    const {
        currentScrollY,
        maxDistance,
        activationOffset = COLLAPSE_ACTIVATION_OFFSET,
        multiplier = COLLAPSE_SCROLL_MULTIPLIER,
    } = args;

    if (!Number.isFinite(currentScrollY) || !Number.isFinite(maxDistance) || maxDistance <= 0) {
        return 0;
    }

    const effectiveActivation = Number.isFinite(activationOffset) ? activationOffset : 0;
    const effectiveMultiplier = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
    const collapseDistance = (currentScrollY - effectiveActivation) * effectiveMultiplier;

    return clamp(collapseDistance, 0, maxDistance);
};

export const computeTabBarTranslateY = (args: {
    currentTranslateY: number;
    deltaY: number;
    currentScrollY: number;
    maxHeight: number;
}): number => {
    const { currentTranslateY, deltaY, currentScrollY, maxHeight } = args;
    if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
        return 0;
    }

    if (currentScrollY <= 0) {
        return 0;
    }

    return clamp(currentTranslateY + deltaY, 0, maxHeight);
};

export const isCollapsedAtThreshold = (
    translateY: number,
    maxHeight: number,
    epsilon: number = COLLAPSED_EPSILON
): boolean => {
    if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
        return false;
    }

    return translateY >= maxHeight - epsilon;
};

export const computeReservedBottomInset = (args: {
    translateY: number;
    maxHeight: number;
    collapsedInset: number;
    epsilon?: number;
}): number => {
    const { translateY, maxHeight, collapsedInset, epsilon } = args;
    if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
        return Math.max(collapsedInset, 0);
    }

    return isCollapsedAtThreshold(translateY, maxHeight, epsilon)
        ? clamp(collapsedInset, 0, maxHeight)
        : maxHeight;
};

export const computeProgressiveReservedBottomInset = (args: {
    translateY: number;
    maxHeight: number;
    collapsedInset: number;
}): number => {
    const { translateY, maxHeight, collapsedInset } = args;
    if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
        return Math.max(collapsedInset, 0);
    }

    return clamp(maxHeight - translateY, clamp(collapsedInset, 0, maxHeight), maxHeight);
};

export const computeRequiredCollapseTravel = (args: {
    scrollableHeaderHeight: number;
    tabBarMaxHeight: number;
    tabBarCollapsedInset: number;
}): number => {
    const { scrollableHeaderHeight, tabBarMaxHeight, tabBarCollapsedInset } = args;
    const headerTravel = Math.max(Number.isFinite(scrollableHeaderHeight) ? scrollableHeaderHeight : 0, 0);
    const tabTravel = Math.max((Number.isFinite(tabBarMaxHeight) ? tabBarMaxHeight : 0) - (Number.isFinite(tabBarCollapsedInset) ? tabBarCollapsedInset : 0), 0);
    return Math.max(headerTravel, tabTravel);
};

export const computeMinContentHeightForCollapse = (args: {
    viewportHeight: number | null;
    requiredCollapseTravel: number;
}): number | null => {
    const { viewportHeight, requiredCollapseTravel } = args;
    if (viewportHeight === null || !Number.isFinite(viewportHeight) || viewportHeight <= 0) {
        return null;
    }

    const safeTravel = Math.max(Number.isFinite(requiredCollapseTravel) ? requiredCollapseTravel : 0, 0);
    return Math.round(viewportHeight + safeTravel);
};
