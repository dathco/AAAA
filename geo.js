// ============================================================
// Geo-Hilfen (reine Mathematik, kein DOM, keine Karten-Library).
// Liefert Koordinaten als [lon, lat] — passend zu GeoJSON/MapLibre.
// ============================================================

const DEG = Math.PI / 180;
const EARTH_KM = 6371;

// Grosskreis-Distanz zwischen zwei Punkten (Haversine, km)
function distanceKm(aLon, aLat, bLon, bLat) {
  const dLat = (bLat - aLat) * DEG;
  const dLon = (bLon - aLon) * DEG;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * DEG) * Math.cos(bLat * DEG) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * EARTH_KM * Math.asin(Math.sqrt(h)));
}

// Punkt auf dem Grosskreis a -> b im Anteil t (0..1); a,b = [lon,lat]
function greatCirclePoint(a, b, t) {
  const toXYZ = ([lon, lat]) => {
    const l = lon * DEG, p = lat * DEG;
    return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
  };
  const A = toXYZ(a), B = toXYZ(b);
  let dot = Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]));
  const om = Math.acos(dot);
  let x, y, z;
  if (om < 1e-6) {
    [x, y, z] = A;
  } else {
    const s1 = Math.sin((1 - t) * om) / Math.sin(om);
    const s2 = Math.sin(t * om) / Math.sin(om);
    x = s1 * A[0] + s2 * B[0];
    y = s1 * A[1] + s2 * B[1];
    z = s1 * A[2] + s2 * B[2];
  }
  return [Math.atan2(y, x) / DEG, Math.asin(Math.max(-1, Math.min(1, z))) / DEG];
}

// Stuetzpunkte entlang des Grosskreises a -> b (fuer eine gebogene Linie)
function greatCircleArc(a, b, n = 64) {
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(greatCirclePoint(a, b, i / n));
  return pts;
}

// Kleinkreis: alle Punkte im Abstand radiusKm um center=[lon,lat].
// Ergibt den Reichweiten-Ring. null, wenn groesser als die halbe Erde.
function reachCircle(center, radiusKm, n = 96) {
  const ang = radiusKm / EARTH_KM;
  if (ang >= Math.PI) return null;
  const lo1 = center[0] * DEG, la1 = center[1] * DEG;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const b = (i / n) * 2 * Math.PI;
    const la2 = Math.asin(Math.sin(la1) * Math.cos(ang) + Math.cos(la1) * Math.sin(ang) * Math.cos(b));
    const lo2 = lo1 + Math.atan2(
      Math.sin(b) * Math.sin(ang) * Math.cos(la1),
      Math.cos(ang) - Math.sin(la1) * Math.sin(la2)
    );
    pts.push([lo2 / DEG, la2 / DEG]);
  }
  return pts;
}

// Anfangs-Peilung (Kompasskurs in Grad) von a nach b; a,b = [lon,lat]
function bearingDeg(a, b) {
  const la1 = a[1] * DEG, la2 = b[1] * DEG;
  const dLon = (b[0] - a[0]) * DEG;
  const y = Math.sin(dLon) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLon);
  return (Math.atan2(y, x) / DEG + 360) % 360;
}
