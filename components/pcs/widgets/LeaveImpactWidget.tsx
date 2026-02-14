import { LeaveImpactHUD } from '@/components/wizard/LeaveImpactHUD';
import { usePCSStore } from '@/store/usePCSStore';
import { useUserStore } from '@/store/useUserStore';

/**
 * Wrapper that injects PCS currentDraft data into the props-driven
 * LeaveImpactHUD component. Returns null when no segment is being planned.
 */
export function LeaveImpactWidget() {
    const currentDraft = usePCSStore((state) => state.currentDraft);
    const user = useUserStore((state) => state.user);

    if (!currentDraft) return null;

    // Derive leave impact from the draft segment's entitlements
    const chargeableDays = currentDraft.entitlements?.leaveDays ?? 0;
    const authorizedTravelDays = currentDraft.entitlements?.authorizedTravelDays ?? 0;
    const proceedDays = currentDraft.entitlements?.proceedDays ?? 0;

    // TODO: Pull actual leave balance from user store when available
    const availableOnDeparture = (user as any)?.leaveBalance ?? 30;
    const remainingOnReturn = availableOnDeparture - chargeableDays;
    const isOverdraft = remainingOnReturn < 0;
    const isUnchargeable = chargeableDays === 0;

    return (
        <LeaveImpactHUD
            chargeableDays={chargeableDays}
            availableOnDeparture={availableOnDeparture}
            remainingOnReturn={remainingOnReturn}
            isOverdraft={isOverdraft}
            isUnchargeable={isUnchargeable}
        />
    );
}
