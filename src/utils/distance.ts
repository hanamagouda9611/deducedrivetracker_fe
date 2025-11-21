// utils/distance.ts
export type LatLngSimple = { lat: number; lng: number; timestamp?: number; heading?: number };

export function calculateDistance(track: LatLngSimple[]): number {
  if (!track || track.length < 2) return 0;
  let totalDist = 0;
  for (let i = 1; i < track.length; i++) {
    const R = 6371; // km
    const dLat = (track[i].lat - track[i - 1].lat) * Math.PI / 180;
    const dLon = (track[i].lng - track[i - 1].lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(track[i - 1].lat * Math.PI / 180) *
      Math.cos(track[i].lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDist += R * c;
  }
  return totalDist;
}
