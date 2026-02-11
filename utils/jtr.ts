import { PCSSegment } from '@/types/pcs';

export const MALT_RATE = 0.21;
export const STD_PER_DIEM = 157;

export const calculateMALT = (miles: number, travelers: number): number => {
  // MALT is typically per vehicle. We assume 1 vehicle for calculation simplicity unless otherwise specified.
  // Travelers count is provided for signature compliance but standard MALT is mileage based.
  return miles * MALT_RATE;
};

export const calculateSegmentEntitlement = (segment: PCSSegment) => {
  // Approximate miles based on authorized travel days (350 miles/day)
  // If authorizedTravelDays is 0, we assume local or no travel distance entitlement for this purpose
  const days = segment.entitlements.authorizedTravelDays || 0;
  const miles = days * 350;

  // Determine travelers based on accompanied status
  // If accompanied, we assume member + 1 dependent (2 travelers) for estimation
  // If unaccompanied, 1 traveler (member only)
  // In a real app, this would come from a more detailed family composition or specific plan
  const travelers = segment.userPlan.isAccompanied ? 2 : 1;

  const malt = calculateMALT(miles, travelers);
  const perDiem = days * STD_PER_DIEM * travelers;

  return { malt, perDiem, days };
};

export const getDLARate = (rank: string | undefined, hasDependents: boolean): number => {
  if (!rank) return 0;

  // Mock DLA Rates (Approximate 2024 values for demo)
  const rates: Record<string, { withDep: number; withoutDep: number }> = {
    'E-1': { withDep: 2633, withoutDep: 2000 },
    'E-2': { withDep: 2633, withoutDep: 2000 },
    'E-3': { withDep: 2633, withoutDep: 2000 },
    'E-4': { withDep: 2633, withoutDep: 2000 },
    'E-5': { withDep: 2633, withoutDep: 2200 },
    'E-6': { withDep: 2800, withoutDep: 2400 },
    'E-7': { withDep: 3000, withoutDep: 2600 },
    'E-8': { withDep: 3200, withoutDep: 2800 },
    'E-9': { withDep: 3400, withoutDep: 3000 },
    'O-1': { withDep: 2500, withoutDep: 2100 },
    'O-2': { withDep: 2700, withoutDep: 2300 },
    'O-3': { withDep: 2900, withoutDep: 2500 },
    'O-4': { withDep: 3200, withoutDep: 2800 },
    'O-5': { withDep: 3500, withoutDep: 3100 },
    'O-6': { withDep: 3800, withoutDep: 3400 },
  };

  // Default fallback if rank not found
  const rate = rates[rank] || { withDep: 2500, withoutDep: 2000 };
  return hasDependents ? rate.withDep : rate.withoutDep;
};
