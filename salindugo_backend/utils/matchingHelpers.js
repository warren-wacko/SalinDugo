// utils/matching.js
export const COMPATIBLE_RECIPIENTS = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

// donors that can give to a recipient blood type (inverse)
export const COMPATIBLE_DONORS = (() => {
  const map = {};
  Object.entries(COMPATIBLE_RECIPIENTS).forEach(([donor, recipients]) => {
    recipients.forEach((r) => {
      map[r] = map[r] || [];
      map[r].push(donor);
    });
  });
  return map;
})();

// simple haversine distance in kilometers
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v === null || v === undefined))
    return Number.POSITIVE_INFINITY;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// urgency sort weight (higher = more urgent)
export const URGENCY_WEIGHT = {
  emergency: 100,
  critical: 90,
  high: 70,
  medium: 50,
  low: 10,
  routine: 5,
  default: 20,
};
