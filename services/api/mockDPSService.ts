import type { ApiResult } from '@/types/api';
import type {
    DeliveryEstimate,
    DPSMoveConfirmation,
    DPSMoveRequest,
    ExcessWeightEstimate,
    HHGShipmentType,
    PickupWindow,
    PPMIncentiveEstimate,
} from '@/types/pcs';
import type { IDPSService } from './interfaces/IDPSService';

// ─── Constants ─────────────────────────────────────────────────────

/** Industry average cost per lb for excess HHG weight */
const EXCESS_COST_PER_LB = 0.70;

/** GBL cost per cwt (hundred-weight) — used for PPM incentive calc */
const GBL_COST_PER_CWT = 68.50;

/** PPM incentive percentage of what GBL would have cost the government */
const PPM_INCENTIVE_RATE = 0.95;

// ─── Helpers ───────────────────────────────────────────────────────

function addDays(date: Date, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

function randomId(): string {
    return `dps-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Mock Service ──────────────────────────────────────────────────

export const mockDPSService: IDPSService = {

    async getPickupWindows(
        originZip: string,
        estimatedWeight: number,
    ): Promise<ApiResult<PickupWindow[]>> {
        await new Promise((r) => setTimeout(r, 350));

        const now = new Date();
        const windows: PickupWindow[] = Array.from({ length: 5 }, (_, i) => {
            const startOffset = 14 + i * 10;
            return {
                id: `pw-${i + 1}`,
                startDate: addDays(now, startOffset),
                endDate: addDays(now, startOffset + 3),
                isPreferred: i === 1, // Second window is typically best
                capacityLabel: i < 3 ? 'AVAILABLE' : i === 3 ? 'LIMITED' : 'WAITLIST',
            };
        });

        return {
            success: true,
            data: windows,
            meta: { requestId: randomId(), timestamp: new Date().toISOString() },
        };
    },

    async getDeliveryEstimate(
        originZip: string,
        destinationZip: string,
        shipmentType: HHGShipmentType,
    ): Promise<ApiResult<DeliveryEstimate>> {
        await new Promise((r) => setTimeout(r, 300));

        // Transit time varies by shipment type
        const transitDays = shipmentType === 'GBL' ? 21 : 14; // PPM is self-driven
        const now = new Date();

        return {
            success: true,
            data: {
                estimatedDeliveryStart: addDays(now, 28 + transitDays),
                estimatedDeliveryEnd: addDays(now, 28 + transitDays + 5),
                transitDays,
                shipmentType,
            },
            meta: { requestId: randomId(), timestamp: new Date().toISOString() },
        };
    },

    async createMoveRequest(
        request: DPSMoveRequest,
    ): Promise<ApiResult<DPSMoveConfirmation>> {
        await new Promise((r) => setTimeout(r, 600));

        const now = new Date();
        const transitDays = request.shipmentType === 'GBL' ? 21 : 14;

        return {
            success: true,
            data: {
                confirmationNumber: `DPS-${Date.now().toString(36).toUpperCase()}`,
                scheduledPickup: {
                    id: request.requestedPickupWindowId,
                    startDate: addDays(now, 28),
                    endDate: addDays(now, 31),
                    isPreferred: true,
                    capacityLabel: 'AVAILABLE',
                },
                estimatedDelivery: {
                    estimatedDeliveryStart: addDays(now, 28 + transitDays),
                    estimatedDeliveryEnd: addDays(now, 28 + transitDays + 5),
                    transitDays,
                    shipmentType: request.shipmentType,
                },
                createdAt: now.toISOString(),
            },
            meta: { requestId: randomId(), timestamp: new Date().toISOString() },
        };
    },

    async getExcessWeightCost(
        excessLbs: number,
    ): Promise<ApiResult<ExcessWeightEstimate>> {
        await new Promise((r) => setTimeout(r, 200));

        const safeExcess = Math.max(0, excessLbs);
        const totalCost = Math.round(safeExcess * EXCESS_COST_PER_LB * 100) / 100;

        return {
            success: true,
            data: {
                excessLbs: safeExcess,
                costPerLb: EXCESS_COST_PER_LB,
                totalCost,
                warningMessage: safeExcess > 0
                    ? `You are ${safeExcess.toLocaleString()} lbs over your authorized weight. Estimated charge: $${totalCost.toLocaleString()}.`
                    : 'You are within your authorized weight allowance.',
            },
            meta: { requestId: randomId(), timestamp: new Date().toISOString() },
        };
    },

    async getPPMIncentive(
        originZip: string,
        destinationZip: string,
        weightLbs: number,
    ): Promise<ApiResult<PPMIncentiveEstimate>> {
        await new Promise((r) => setTimeout(r, 300));

        // GBL equivalent cost: weight in cwt × rate per cwt
        const cwt = weightLbs / 100;
        const gblCost = Math.round(cwt * GBL_COST_PER_CWT * 100) / 100;
        const incentive = Math.round(gblCost * PPM_INCENTIVE_RATE * 100) / 100;

        return {
            success: true,
            data: {
                gblEquivalentCost: gblCost,
                incentivePercentage: PPM_INCENTIVE_RATE,
                estimatedIncentive: incentive,
                weightMoved: weightLbs,
            },
            meta: { requestId: randomId(), timestamp: new Date().toISOString() },
        };
    },
};
