import type { TripRecord } from '../types';
import { isTripCompleted, isTripInProgress } from '../api/trips';

export interface OrderTripSnapshot {
  activeTrip: TripRecord | null;
  completedCount: number;
  nextAction: 'loading' | 'unloading';
}

export function buildOrderTripMap(trips: TripRecord[]): Map<number, OrderTripSnapshot> {
  const byOrder = new Map<number, TripRecord[]>();
  for (const trip of trips) {
    const orderId = trip.order_id;
    if (orderId == null) continue;
    const list = byOrder.get(orderId) ?? [];
    list.push(trip);
    byOrder.set(orderId, list);
  }

  const result = new Map<number, OrderTripSnapshot>();
  for (const [orderId, orderTrips] of byOrder) {
    const activeTrip = orderTrips.find((trip) => isTripInProgress(trip)) ?? null;
    const completedCount = orderTrips.filter((trip) => isTripCompleted(trip)).length;
    result.set(orderId, {
      activeTrip,
      completedCount,
      nextAction: activeTrip ? 'unloading' : 'loading',
    });
  }
  return result;
}
