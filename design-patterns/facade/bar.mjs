// The program bar's body: a flat bar that runs out of the facade's port. Its
// left part is always inside the cabinet, so the visible body is rebuilt from
// the port face to the bar's moving end. The build calls this for the static
// pose and the page inlines this file to call it every frame; `k` is the kit.

export const BAR = { y: 0, d: 8, z0: 4.4, z1: 8.4, face: -114, end: 118, rack: [-150, -82] };

export function barBodySvg(k, P, s) {
  const x0 = BAR.face;
  const x1 = BAR.end - s;
  // Rack teeth on the front face, fixed to the bar: the drive inside the cabinet
  // pulls the bar in by them, so they disappear into the port as it moves.
  const teeth = [];
  for (let t = BAR.rack[0]; t <= BAR.rack[1]; t += 2) {
    const x = t - s;
    if (x > x0 + 0.8) teeth.push(k.segment([x, BAR.y + BAR.d, BAR.z0], [x, BAR.y + BAR.d, BAR.z1 - 0.3], P));
  }
  const plan = { x: x0, y: BAR.y, w: x1 - x0, d: BAR.d, r: 0.6 };
  return k.solidSvg(k.slabOf(plan, BAR.z0, BAR.z1 - BAR.z0, P, 3, 0.3), { tone: "mid", inner: k.lineSvg(teeth.join(""), { tone: "lo" }) });
}
