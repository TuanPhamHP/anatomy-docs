// The key's shape, shared by the build and the page (inlined there), so the copy
// cut while the page runs is the same polygon the build draws.
// Local plan coordinates: the bow is centred on the origin, the blade runs along +x,
// its notched back edge faces -y (toward the tracer and the cutter) at y = -4.5.

export const BOW_R = 9;
export const BLADE = { from: 12, to: 50, back: -4.5, spine: 4.5 };
export const KEY_T = 1.4;
// Five cuts of the master: position along the blade and depth into the back edge.
export const CUTS = [
  { x: 17, d: 2.2 },
  { x: 24, d: 0.8 },
  { x: 31, d: 3.0 },
  { x: 38, d: 1.4 },
  { x: 45, d: 2.6 },
];
const FLAT = 0.7;

// How deep the bitting is at x along the blade, which is how far the carriage
// moves toward the tracer when the tracer sits there.
export function depthAt(x) {
  let depth = 0;
  for (const cut of CUTS) depth = Math.max(depth, Math.min(cut.d, cut.d - (Math.abs(x - cut.x) - FLAT)));
  return Math.max(0, depth);
}

// The key's outline as a ring. Cuts lying beyond `cutFrom` along the blade are
// cut; the rest of the back edge is still straight, as on a blank.
export function keyRing(cutFrom = -Infinity) {
  const { from, to, back, spine } = BLADE;
  const ring = [];
  const join = Math.asin(6.5 / BOW_R);
  for (let i = 0; i <= 28; i++) {
    const a = join + (i / 28) * (Math.PI * 2 - 2 * join);
    ring.push([BOW_R * Math.cos(a), BOW_R * Math.sin(a)]);
  }
  ring.push([8, -6.5], [from, -6.5], [from, back]);
  for (const cut of CUTS) {
    const a = cut.x - FLAT - cut.d;
    const b = cut.x + FLAT + cut.d;
    if (b <= cutFrom) continue;
    if (a >= cutFrom) {
      ring.push([a, back], [cut.x - FLAT, back + cut.d], [cut.x + FLAT, back + cut.d], [b, back]);
    } else {
      // The cutter is inside this cut: the part past it is cut, the part before it isn't yet.
      const at = cutFrom;
      ring.push([at, back], [at, back + depthAt(at)]);
      if (at < cut.x - FLAT) ring.push([cut.x - FLAT, back + cut.d]);
      if (at < cut.x + FLAT) ring.push([cut.x + FLAT, back + cut.d]);
      ring.push([b, back]);
    }
  }
  ring.push([to, back], [to + 4, -1], [to + 4, 1.5], [to, spine], [from, spine], [from, 6.5], [8, 6.5]);
  return ring;
}

// The hole in the bow, where a key ring would go.
export const HOLE = { x: -5.5, r: 1.8 };

// One key as a solid lying flat at (ox, oy, z). K is the kit: the iso-kit module
// at build time, and the same functions inlined in the page.
export function keySvg(K, P, ox, oy, z, cutFrom, tone = "hi") {
  const ring = keyRing(cutFrom).map(([x, y]) => [ox + x, oy + y]);
  const paths = K.extrude(ring, z, KEY_T, P, { convex: false });
  const circle = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return K.iso([ox + HOLE.x + HOLE.r * Math.cos(a), oy + HOLE.r * Math.sin(a), z + KEY_T], P);
  });
  const hole = K.pathOf(circle, true);
  return K.solidSvg(paths, { tone, crease: "lo", lit: tone === "lit", inner: `<path class="dp-hole" d="${hole}"/><path class="iso-line" data-tone="lo" d="${hole}"/>` });
}
