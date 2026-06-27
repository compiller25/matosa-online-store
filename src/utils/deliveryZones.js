/**
 * Delivery zones for Matosa Online Shopping.
 *
 * Two tiers:
 *   FREE — within 1000m of the store (distance-based, no polygon needed)
 *   ZONE — inside the KML coverage polygon, charged 1000 TZS
 *   OUTSIDE — beyond coverage, we contact the customer
 */

// Store location (from KML marker)
const STORE = { lat: -6.75344166666667, lon: 39.1569416666667 };

// Free delivery radius in meters
const FREE_RADIUS_M = 1000;

/**
 * Haversine distance in meters between two [lat, lon] points.
 */
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Point-in-polygon using ray casting algorithm.
 */
function pointInPolygon(lat, lon, polygon) {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    const intersect =
      yi > lon !== yj > lon &&
      lat < ((xj - xi) * (lon - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Coverage polygon from KML — coordinates are [lat, lon]
const COVERAGE_POLYGON = [
  [-6.7407822, 39.1490023],
  [-6.7425295, 39.1493027],
  [-6.7440638, 39.1488307],
  [-6.7460242, 39.1483586],
  [-6.7480273, 39.1484015],
  [-6.7495189, 39.1483586],
  [-6.7514367, 39.1482728],
  [-6.753184, 39.1485732],
  [-6.7544199, 39.1484873],
  [-6.7561246, 39.1493027],
  [-6.7576162, 39.1498177],
  [-6.758426, 39.1503756],
  [-6.758085, 39.1510623],
  [-6.7584686, 39.1524785],
  [-6.7577015, 39.1532939],
  [-6.7582555, 39.1540234],
  [-6.7583407, 39.154753],
  [-6.7559542, 39.1548388],
  [-6.7557411, 39.1565125],
  [-6.7535676, 39.1563409],
  [-6.7541642, 39.1577141],
  [-6.7538659, 39.1588729],
  [-6.7527152, 39.1587441],
  [-6.7519055, 39.1585295],
  [-6.7508827, 39.1581433],
  [-6.7500303, 39.1577571],
  [-6.7488796, 39.1573708],
  [-6.7480699, 39.1572421],
  [-6.7471749, 39.1575425],
  [-6.7455554, 39.1574137],
  [-6.7446178, 39.157285],
  [-6.7439785, 39.1563838],
  [-6.7431262, 39.1559546],
  [-6.7420607, 39.1556971],
  [-6.7408248, 39.1554825],
  [-6.7398872, 39.1553109],
  [-6.7395036, 39.1545813],
  [-6.7396315, 39.1538947],
  [-6.7397593, 39.153208],
  [-6.740095, 39.1524356],
  [-6.7396262, 39.1513198],
  [-6.7398393, 39.1499036],
  [-6.7407822, 39.1490023],
];

const FREE_ZONE = {
  key: "free",
  name: "Free Zone",
  nameSw: "Eneo la Bure",
  feeTZS: 0,
  color: "#22C55E",
};

const PAID_ZONE = {
  key: "zone",
  name: "Delivery Zone",
  nameSw: "Eneo la Uwasilishaji",
  feeTZS: 1000,
  color: "#F59E0B",
};

// Single zone exported for map display in LocationPickerModal
export const DELIVERY_ZONES = [
  {
    key: "coverage",
    name: "Delivery Coverage",
    nameSw: "Eneo la Uwasilishaji",
    feeTZS: null,
    color: "#F59E0B",
    coords: COVERAGE_POLYGON,
  },
];

export const OUTSIDE_ZONE = {
  key: "outside",
  name: "Outside Delivery Area",
  nameSw: "Nje ya Eneo la Uwasilishaji",
  feeTZS: null,
};

/**
 * Detect zone for a given coordinate.
 *  1. Check distance from store — if < 1000m, return FREE zone
 *  2. Check if inside coverage polygon — if yes, return PAID zone
 *  3. Otherwise — outside
 */
export function detectZone(lat, lon) {
  const dist = haversineMeters(lat, lon, STORE.lat, STORE.lon);

  if (dist <= FREE_RADIUS_M) {
    return { ...FREE_ZONE, distanceM: Math.round(dist) };
  }

  if (pointInPolygon(lat, lon, COVERAGE_POLYGON)) {
    return { ...PAID_ZONE, distanceM: Math.round(dist) };
  }

  return OUTSIDE_ZONE;
}
