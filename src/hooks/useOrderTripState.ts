import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { isTripCompleted, isTripInProgress, listTrips } from '../api/trips';
import type { TripRecord } from '../types';

export type DriverTripNextAction = 'loading' | 'unloading' | 'none';

export interface OrderTripState {
  activeTrip: TripRecord | null;
  completedCount: number;
  nextAction: DriverTripNextAction;
  loading: boolean;
  reload: () => Promise<void>;
}

interface UseOrderTripStateOptions {
  enabled?: boolean;
}

export function useOrderTripState(
  orderId: number,
  options: UseOrderTripStateOptions = {}
): OrderTripState {
  const { enabled = true } = options;
  const [activeTrip, setActiveTrip] = useState<TripRecord | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    const trips = await listTrips({ order_id: orderId });
    setActiveTrip(trips.find((trip) => isTripInProgress(trip)) ?? null);
    setCompletedCount(trips.filter((trip) => isTripCompleted(trip)).length);
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;
      let cancelled = false;
      setLoading(true);
      reload()
        .catch(() => {
          if (!cancelled) {
            setActiveTrip(null);
            setCompletedCount(0);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [enabled, reload])
  );

  const nextAction: DriverTripNextAction = activeTrip ? 'unloading' : 'loading';

  return { activeTrip, completedCount, nextAction, loading, reload };
}
