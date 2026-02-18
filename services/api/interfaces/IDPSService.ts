import type { ApiResult } from '@/types/api';
import type {
    DeliveryEstimate,
    DPSMoveConfirmation,
    DPSMoveRequest,
    ExcessWeightEstimate,
    HHGShipmentType,
    NTSStorageConfirmation,
    NTSStorageRequest,
    PickupWindow,
    PPMIncentiveEstimate,
    StorageFacility,
} from '@/types/pcs';

/**
 * Service interface for dps.move.mil API interactions.
 *
 * Defense Personal Property System (DPS) handles the scheduling and
 * management of household goods shipments during a PCS.
 * Production: CAC/ECA-authenticated REST API at dps.move.mil
 * Current: Mock service with realistic demo data.
 */
export interface IDPSService {
    /** Retrieve available pickup date windows for a given origin and weight. */
    getPickupWindows(
        originZip: string,
        estimatedWeight: number,
    ): Promise<ApiResult<PickupWindow[]>>;

    /** Estimate delivery timeline based on origin, destination, and shipment type. */
    getDeliveryEstimate(
        originZip: string,
        destinationZip: string,
        shipmentType: HHGShipmentType,
    ): Promise<ApiResult<DeliveryEstimate>>;

    /** Submit a move request to DPS for scheduling. */
    createMoveRequest(
        request: DPSMoveRequest,
    ): Promise<ApiResult<DPSMoveConfirmation>>;

    /** Calculate excess weight charges for lbs over the authorized allowance. */
    getExcessWeightCost(
        excessLbs: number,
    ): Promise<ApiResult<ExcessWeightEstimate>>;

    /** Estimate the PPM incentive for self-moving a given weight. */
    getPPMIncentive(
        originZip: string,
        destinationZip: string,
        weightLbs: number,
    ): Promise<ApiResult<PPMIncentiveEstimate>>;

    /** Get available government storage facilities near a zip code. */
    getStorageFacilities(
        zip: string,
    ): Promise<ApiResult<StorageFacility[]>>;

    /** Submit an NTS storage request. */
    createStorageRequest(
        request: NTSStorageRequest,
    ): Promise<ApiResult<NTSStorageConfirmation>>;
}

