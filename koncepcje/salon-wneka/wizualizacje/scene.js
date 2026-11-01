import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const Q = new URLSearchParams(location.search);
const CONCEPT = Q.get('c') || '1', VIEW = Q.get('v') || 'main', INTER = Q.get('i') === '1';
const W = +(Q.get('w') || innerWidth), H = +(Q.get('h') || innerHeight);
let rnd = (() => { let s = 12345; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const pick = a => a[Math.floor(rnd() * a.length)];
const NICHE = 102, COL = 531, WIN = 553, BEAM0 = 394, BEAM1 = 419, HN = 290, HR = 550;

// ---------------- textures ----------------
function cv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function noiseFill(g, w, h, base, amp, n = 6000, sz = 2) { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { const v = (rnd() - .5) * amp; g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`; g.fillRect(rnd() * w, rnd() * h, sz, sz); } }
const T = {};
T.floor = cv(2048, 2048, (g, w, h) => { // 4m x 4m, deski 18 cm
  const pw = w / (400 / 18); g.fillStyle = '#d6b48a'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += pw) { let y = -rnd() * 400; while (y < h) { const L = (120 + rnd() * 110) / 400 * h; const c = [205 + rnd() * 22, 170 + rnd() * 20, 125 + rnd() * 18];
    g.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; g.fillRect(x, y, pw, L);
    for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(120,85,50,${.05 + rnd() * .08})`; g.lineWidth = .6 + rnd(); g.beginPath(); const xx = x + rnd() * pw; g.moveTo(xx, y); g.bezierCurveTo(xx + rnd() * 6 - 3, y + L / 3, xx + rnd() * 6 - 3, y + 2 * L / 3, xx + rnd() * 4 - 2, y + L); g.stroke(); }
    g.fillStyle = 'rgba(90,60,35,.35)'; g.fillRect(x, y, pw, 1.5); y += L; } g.fillStyle = 'rgba(90,60,35,.35)'; g.fillRect(x, 0, 1.5, h); }
}); T.floor.wrapS = T.floor.wrapT = THREE.RepeatWrapping;
T.oak = cv(512, 512, (g, w, h) => { g.fillStyle = '#c9a477'; g.fillRect(0, 0, w, h); for (let k = 0; k < 220; k++) { g.strokeStyle = `rgba(${pick(['110,75,40', '150,110,70', '235,205,165'])},${.06 + rnd() * .12})`; g.lineWidth = .5 + rnd() * 1.6; g.beginPath(); const y = rnd() * h; g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x / 70 + k) * 4 + rnd() * 2); g.stroke(); } });
T.oak.wrapS = T.oak.wrapT = THREE.RepeatWrapping;
T.cane = cv(256, 256, (g, w, h) => { g.fillStyle = '#7d6a52'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e2cfa8'; g.lineWidth = 3.2; const s = 16;
  for (let i = -w; i < 2 * w; i += s) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke(); }
  g.fillStyle = '#3a2f24'; for (let x = s / 2; x < w; x += s) for (let y = s / 2; y < h; y += s) { g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); } });
T.cane.wrapS = T.cane.wrapT = THREE.RepeatWrapping;
T.boucle = cv(512, 512, (g, w, h) => { noiseFill(g, w, h, '#efeae1', .18, 26000, 3); for (let i = 0; i < 5000; i++) { g.strokeStyle = `rgba(160,150,135,${rnd() * .18})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 1.5 + rnd() * 2, 0, 6); g.stroke(); } });
T.boucle.wrapS = T.boucle.wrapT = THREE.RepeatWrapping;
T.linen = cv(512, 512, (g, w, h) => { noiseFill(g, w, h, '#e9e0d1', .08, 9000, 2); for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(150,130,100,${rnd() * .06})`; g.fillRect(0, y, w, 1); } });
T.linen.wrapS = T.linen.wrapT = THREE.RepeatWrapping;
T.rug = cv(1024, 1024, (g, w, h) => { noiseFill(g, w, h, '#ece6da', .12, 40000, 3); g.strokeStyle = 'rgba(170,155,130,.35)'; g.lineWidth = 5; for (let y = 20; y < h; y += 48) for (let x = 20; x < w; x += 48) { g.beginPath(); g.arc(x + (y / 48 % 2) * 24, y, 15, 0, 7); g.stroke(); } });
T.garden = cv(2048, 1024, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#dfeef6'); gr.addColorStop(.6, '#f4f7f2'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.fillStyle = '#5b4a36'; g.fillRect(rnd() * w, h * .45, 6 + rnd() * 8, h * .4); }
  for (let i = 0; i < 2600; i++) { const x = rnd() * w, y = h * (.04 + rnd() * .72), r = 14 + rnd() * 46; const c = pick(['#4d7a35', '#5f8f3e', '#78a84f', '#93bf62', '#a9cf78', '#3d6a2c', '#86b55a']); g.fillStyle = c; g.globalAlpha = .55 + rnd() * .45; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  g.globalAlpha = 1; const gg = g.createLinearGradient(0, h * .78, 0, h); gg.addColorStop(0, '#7fae4e'); gg.addColorStop(1, '#5e8f37'); g.fillStyle = gg; g.fillRect(0, h * .8, w, h * .2); });
function photoTex(kind) { return cv(256, 320, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); const a = 200 + rnd() * 40 | 0; gr.addColorStop(0, `rgb(${a},${a},${a})`); gr.addColorStop(1, `rgb(${a - 70},${a - 70},${a - 70})`); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (kind === 0) { g.fillStyle = '#2c2c2c'; g.beginPath(); g.ellipse(w / 2, h * .42, 46, 58, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(w / 2, h * 1.02, 110, 120, 0, 0, 7); g.fill(); g.fillStyle = '#bdbdbd'; g.beginPath(); g.ellipse(w / 2, h * .45, 30, 40, 0, 0, 7); g.fill(); }
  else if (kind === 1) { g.fillStyle = '#555'; g.fillRect(0, h * .62, w, h * .38); g.fillStyle = '#1e1e1e'; g.beginPath(); g.moveTo(w * .3, h * .62); g.lineTo(w * .5, h * .5); g.lineTo(w * .7, h * .62); g.fill(); }
  else { g.fillStyle = '#333'; g.beginPath(); g.moveTo(0, h * .7); g.lineTo(w * .35, h * .35); g.lineTo(w * .6, h * .6); g.lineTo(w * .8, h * .45); g.lineTo(w, h * .7); g.lineTo(w, h); g.lineTo(0, h); g.fill(); g.fillStyle = '#777'; g.fillRect(0, h * .78, w, h * .22); }
  noiseFill(g, w, h, 'rgba(0,0,0,0)', .12, 3000, 1); }); }

// ---------------- materials ----------------
const M = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .85, metalness: 0 }, o));
const mat = {
  wall: M({ color: '#f0e7da', roughness: .95 }), wall2: M({ color: '#ece2d3', roughness: .95 }),
  floor: M({ map: T.floor, roughness: .55 }), oak: M({ map: T.oak, color: '#ecdcc6', roughness: .6 }), oakD: M({ map: T.oak, color: '#c9a682', roughness: .6 }),
  black: M({ color: '#1c1c1c', roughness: .55 }), blackG: M({ color: '#0b0b0b', roughness: .18, metalness: .2 }),
  brass: M({ color: '#c9a050', metalness: 1, roughness: .32 }), cane: M({ map: T.cane, roughness: .8 }),
  boucle: M({ map: T.boucle, roughness: 1 }), linen: M({ map: T.linen, roughness: 1 }), rug: M({ map: T.rug, roughness: 1 }),
  white: M({ color: '#f4f1ec', roughness: .5 }), cer: M({ color: '#e8e2d8', roughness: .7 }), pp: M({ color: '#f7f5f0', roughness: .9 }),
  glass: new THREE.MeshPhysicalMaterial({ color: '#dfeaee', transparent: true, opacity: .08, roughness: 0, metalness: 0, depthWrite: false }),
  garden: new THREE.MeshBasicMaterial({ map: T.garden, color: '#ffffff' }), screen: M({ color: '#101214', roughness: .12, metalness: .3 }),
  glow: new THREE.MeshStandardMaterial({ color: '#fff6e0', emissive: '#fff1d0', emissiveIntensity: 2.5 }),
  leaf: M({ color: '#6f7f55', roughness: .8 }), flower: M({ color: '#f7f3ea', roughness: .9 }), shade: M({ color: '#f3ede2', roughness: 1, side: THREE.DoubleSide, emissive: '#3a2e1c', emissiveIntensity: .0 }),
};
mat.oak.map = T.oak.clone(); mat.oak.map.needsUpdate = true;

// ---------------- scene helpers (plan cm -> world m: X=-x, Y=h, Z=y) ----------------
const scene = new THREE.Scene(); scene.background = new THREE.Color('#e9f0f2');
const ROOT = new THREE.Group(); scene.add(ROOT); let CUR = ROOT;
function B(x0, x1, y0, y1, h0, h1, m, o = {}) {
  const sx = Math.abs(x1 - x0) / 100, sy = (h1 - h0) / 100, sz = Math.abs(y1 - y0) / 100;
  const g = o.r ? new RoundedBoxGeometry(sx, sy, sz, 3, Math.min(o.r, sx / 2.01, sy / 2.01, sz / 2.01)) : new THREE.BoxGeometry(sx, sy, sz);
  const me = new THREE.Mesh(g, m); me.position.set(-(x0 + x1) / 200, (h0 + h1) / 200, (y0 + y1) / 200);
  me.castShadow = o.cast !== false; me.receiveShadow = true; (o.parent || CUR).add(me); return me;
}
function uvScale(mesh, s) { const uv = mesh.geometry.attributes.uv; const p = mesh.geometry.attributes.position; const n = mesh.geometry.attributes.normal;
  for (let i = 0; i < uv.count; i++) { const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)); const X = p.getX(i) + mesh.position.x, Y = p.getY(i) + mesh.position.y, Z = p.getZ(i) + mesh.position.z;
    let u, v; if (ny > .5) { u = X; v = Z; } else if (nx > .5) { u = Z; v = Y; } else { u = X; v = Y; } uv.setXY(i, u * s, v * s); } uv.needsUpdate = true; return mesh; }
function cyl(x, y, h0, h1, r, m, seg = 24, r2) { const g = new THREE.CylinderGeometry(r / 100, (r2 ?? r) / 100, (h1 - h0) / 100, seg); const me = new THREE.Mesh(g, m); me.position.set(-x / 100, (h0 + h1) / 200, y / 100); me.castShadow = true; me.receiveShadow = true; CUR.add(me); return me; }
function sph(x, y, h, r, m, sy = 1) { const me = new THREE.Mesh(new THREE.SphereGeometry(r / 100, 24, 16), m); me.scale.y = sy; me.position.set(-x / 100, h / 100, y / 100); me.castShadow = true; me.receiveShadow = true; CUR.add(me); return me; }
function rodBetween(a, b, r, m) { const A = new THREE.Vector3(-a[0] / 100, a[2] / 100, a[1] / 100), Bv = new THREE.Vector3(-b[0] / 100, b[2] / 100, b[1] / 100); const L = A.distanceTo(Bv);
  const me = new THREE.Mesh(new THREE.CylinderGeometry(r / 100, r / 100, L, 10), m); me.position.copy(A).add(Bv).multiplyScalar(.5); me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), Bv.clone().sub(A).normalize()); me.castShadow = true; CUR.add(me); return me; }
function plane(x, y, h, w, hh, m, rotY = 0) { const me = new THREE.Mesh(new THREE.PlaneGeometry(w / 100, hh / 100), m); me.position.set(-x / 100, h / 100, y / 100); me.rotation.y = rotY; me.receiveShadow = true; CUR.add(me); return me; }

// books as instances
const BOOKC = ['#d9cbb5', '#bfae96', '#8c7b6b', '#ede6da', '#a79a86', '#6f675e', '#c9b79c', '#e2d6c2', '#9a8b77', '#f2eee6', '#556052', '#b9a487', '#3f3a35', '#d4c3a6', '#8f7f69'];
let BOOKS = [];
function shelf(axis, a0, a1, h, depth, maxH, wallPos = 0, dir = 1) { // axis 'y': along plan y, books from wall x=wallPos..; axis 'x': along x, wall at y=wallPos
  let a = a0 + 1.5 + rnd() * 4;
  while (a < a1 - 3) {
    const r = rnd();
    if (r < .08 && a1 - a > 22) { const rr = 7 + rnd() * 4; const p = axis === 'y' ? [wallPos + dir * depth * .5, a + rr] : [a + rr, wallPos + dir * depth * .5]; if (rnd() < .5) sph(p[0], p[1], h + rr * 1.05, rr, rnd() < .5 ? mat.white : mat.cer, 1.1); else cyl(p[0], p[1], h, h + Math.min(maxH - 4, 18 + rnd() * 10), rr * .7, mat.cer, 24, rr * .9); a += 2 * rr + 3; continue; }
    if (r < .14 && a1 - a > 26) { let hh = h; for (let k = 0; k < 3 + (rnd() * 3 | 0); k++) { const th = 2.5 + rnd() * 2, len = 20 + rnd() * 5; BOOKS.push({ axis, a: a + 1, len, w: 15 + rnd() * 5, h: hh, th, wallPos, dir, flat: true }); hh += th; } a += 28; continue; }
    if (r < .2) { a += 3 + rnd() * 10; continue; }
    const run = 4 + (rnd() * 10 | 0); const hb = Math.min(maxH - 3, 19 + rnd() * 12);
    for (let k = 0; k < run && a < a1 - 3; k++) { const th = 2 + rnd() * 3.2; const hk = Math.min(maxH - 2, hb + (rnd() - .5) * 5); BOOKS.push({ axis, a, len: th, w: Math.min(depth - 2, 15 + rnd() * 7), h, th: hk, wallPos, dir }); a += th + .15; }
    if (rnd() < .3 && a < a1 - 6) { const th = 2.5; BOOKS.push({ axis, a: a + 1, len: th, w: 18, h, th: Math.min(maxH - 2, 24), wallPos, dir, lean: true }); a += 7; }
  }
}
function flushBooks() {
  const g = new THREE.BoxGeometry(1, 1, 1); const im = new THREE.InstancedMesh(g, M({ roughness: .75 }), BOOKS.length); im.castShadow = true; im.receiveShadow = true;
  const o = new THREE.Object3D(); const c = new THREE.Color();
  BOOKS.forEach((b, i) => { let sx, sy, sz, x, y; const hcen = b.h + (b.flat ? b.th / 2 : b.th / 2);
    if (b.flat) { sy = b.th; if (b.axis === 'y') { sx = b.w; sz = b.len; x = b.wallPos + b.dir * (b.w / 2 + 1); y = b.a + b.len / 2; } else { sz = b.w; sx = b.len; y = b.wallPos + b.dir * (b.w / 2 + 1); x = b.a + b.len / 2; } }
    else { sy = b.th; if (b.axis === 'y') { sx = b.w; sz = b.len; x = b.wallPos + b.dir * (b.w / 2 + 1); y = b.a + b.len / 2; } else { sz = b.w; sx = b.len; y = b.wallPos + b.dir * (b.w / 2 + 1); x = b.a + b.len / 2; } }
    o.position.set(-x / 100, hcen / 100, y / 100); o.scale.set(sx / 100, sy / 100, sz / 100); o.rotation.set(0, 0, 0);
    if (b.lean) { if (b.axis === 'y') o.rotation.x = .18; else o.rotation.z = .18; }
    o.updateMatrix(); im.setMatrixAt(i, o.matrix); c.set(pick(BOOKC)); im.setColorAt(i, c); });
  CUR.add(im); BOOKS = [];
}
function frameRect(x0, x1, y, h0, h1, t = 2.2, d = 1.6, m = mat.wall2, axis = 'x') { // moulding rectangle on wall
  if (axis === 'x') { B(x0, x1, y, y + d, h0, h0 + t, m); B(x0, x1, y, y + d, h1 - t, h1, m); B(x0, x0 + t, y, y + d, h0, h1, m); B(x1 - t, x1, y, y + d, h0, h1, m); }
  else { B(y, y + d, x0, x1, h0, h0 + t, m); B(y, y + d, x0, x1, h1 - t, h1, m); B(y, y + d, x0, x0 + t, h0, h1, m); B(y, y + d, x1 - t, x1, h0, h1, m); } }
function photoFrame(x, h0, w, hh, kind, y = 0) { B(x - w / 2, x + w / 2, y, y + 3, h0, h0 + hh, mat.black); B(x - w / 2 + 3, x + w / 2 - 3, y + 3, y + 3.3, h0 + 3, h0 + hh - 3, mat.pp);
  const p = plane(x, y + 3.5, h0 + hh / 2, w - 18, hh - 18, M({ map: photoTex(kind), roughness: .5 })); }
function sconceTV(x, h) { B(x - 20, x + 20, 3, 7, h - 2, h + 2, mat.black); B(x - 2, x + 2, 0, 9, h - 1, h + 1, mat.black); B(x - 1.5, x + 1.5, 0, 2, h - 5, h + 6, mat.brass);
  const s = new THREE.SpotLight('#ffd9a0', 6, 3, .9, .7, 2); s.position.set(-x / 100, (h - 4) / 100, .1); s.target.position.set(-x / 100, (h - 120) / 100, .02); CUR.add(s, s.target); }
function vaseFlowers(x, y, h, s = 1) { sph(x, y, h + 12 * s, 13 * s, mat.cer, .95); for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, r = rnd() * 16 * s; sph(x + Math.cos(a) * r, y + Math.sin(a) * r, h + 28 * s + rnd() * 12 * s, (4 + rnd() * 3) * s, i % 3 ? mat.flower : mat.leaf, .8); } }
function lamp(x, y, h) { sph(x, y, h + 14, 13, mat.cer, 1.1); cyl(x, y, h + 26, h + 30, 2, mat.brass); const sh = cyl(x, y, h + 30, h + 52, 13, mat.shade, 32, 22); sh.material = mat.shade;
  const l = new THREE.PointLight('#ffd7a0', 1.2, 4, 2); l.position.set(-x / 100, (h + 38) / 100, y / 100); CUR.add(l); }

// ---------------- architecture ----------------
function architecture() {
  const fl = B(-360, 600, -20, 1060, -10, 0, mat.floor); uvScale(fl, .25);
  // walls
  B(-45, 0, -45, BEAM0, 0, 330, mat.wall);             // zachodnia – ściana wnęki
  B(-25, 0, BEAM0, BEAM1, 0, 330, mat.wall);            // słup 25x25 przy podciągu
  B(-45, 0, 645, 1060, 0, 330, mat.wall);              // zachodnia jadalni (za otworem)
  // OTWÓR do korytarza / holu 0.3.1 (y 419..645, bez drzwi) + hol za nim
  B(-340, -25, 394, 419, 0, 330, mat.wall); B(-370, -340, 394, 670, 0, 330, mat.wall); B(-340, -45, 645, 670, 0, 330, mat.wall);
  B(-370, 0, 394, 670, HN, 330, mat.wall);
  B(-340, -260, 380, 419.5, 0, 205, M({ color: '#e4dacb', roughness: .9 })); B(-150, -70, 380, 419.5, 0, 205, M({ color: '#e4dacb', roughness: .9 }));
  { const hl = new THREE.PointLight('#ffe6c4', 1.2, 4, 2); hl.position.set(1.8, 2.6, 5.3); CUR.add(hl); }
  B(-45, 556, -45, 0, 0, HR, mat.wall);               // południowa (TV)
  B(76, 102, -45, BEAM1, HN, HR, mat.wall);           // ściana łazienki nad wnęką
  B(-45, 600, BEAM0, BEAM1, 280, HR + 20, mat.wall);   // podciąg + ściana nad nim
  B(-45, 600, -45, BEAM0, HR, HR + 25, mat.wall);      // strop pustki
  B(-45, 102, -45, BEAM0, HN, 330, mat.wall);          // strop nad wnęką
  B(-45, 600, BEAM1, 1060, HN, 330, mat.wall);         // strop jadalni
  B(-45, 600, 1040, 1080, 0, 330, mat.wall);           // ściana płn. jadalni
  B(COL, 580, -45, 0, 0, HR + 20, mat.wall); B(COL, 580, BEAM0, 528, 0, HR + 20, mat.wall); // słupy
  // wschód jadalni z oknem O2 (y 527..853, h 0..240)
  B(553, 590, 528, 1060, 240, 330, mat.wall); B(553, 590, 853, 1060, 0, 240, mat.wall);
  // W1 – szprosy czarne
  const fx = 553;
  for (const y of [8, 103, 197, 291, 386]) B(fx - 3, fx + 5, y - 3, y + 3, 0, 542, mat.black);
  for (const h of [0, 262, 539]) B(fx - 3, fx + 5, 5, 389, h, h + 4, mat.black);
  B(fx, fx + 30, -5, BEAM0, 542, HR + 20, mat.wall);
  const gl = plane(fx + 1, 197, 271, 380, 540, mat.glass, Math.PI / 2); gl.castShadow = false;
  for (const y of [530, 690, 850]) B(fx - 3, fx + 5, y - 3, y + 3, 0, 240, mat.black);
  B(fx - 3, fx + 5, 527, 853, 236, 240, mat.black);
  // ogród
  const gd = plane(1500, 300, 450, 3600, 1200, mat.garden, Math.PI / 2); gd.castShadow = false; gd.receiveShadow = false;
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(20, 40), M({ color: '#7fae50', roughness: 1 })); lawn.rotation.x = -Math.PI / 2; lawn.position.set(-10.2, -0.02, 3); lawn.receiveShadow = true; CUR.add(lawn);
  // gzyms
  B(102, 553, 0, 12, HR - 12, HR, mat.wall2); B(102, 115, 0, BEAM0, HR - 12, HR, mat.wall2);
  // zasłony
  for (const [y0, y1] of [[2, 70], [324, 392]]) { const g = new THREE.PlaneGeometry((y1 - y0) / 100, 5.4, 60, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 55) * .035);
    const c = new THREE.Mesh(g, M({ map: T.linen, color: '#efe6d6', roughness: 1, side: THREE.DoubleSide })); c.rotation.y = Math.PI / 2; c.position.set(-(WIN - 14) / 100, 2.72, (y0 + y1) / 200); c.castShadow = true; c.receiveShadow = true; CUR.add(c); }
  B(WIN - 20, WIN - 16, 0, BEAM0, 538, 541, mat.black); // karnisz
  // portal wnęki
  B(96, 108, -2, BEAM0, 280, 292, mat.wall2); B(96, 108, 0, 8, 0, 292, mat.wall2);
  // listwy na ścianie nad wnęką
  frameRect(30, 364, 102, 330, 520, 2.2, 1.6, mat.wall2, 'y');
  // ściana TV – pas centralny + ramki
  const cx = 316.5; B(cx - 110, cx + 110, 0, 2.5, 0, HR, mat.wall2); frameRect(cx - 98, cx + 98, 2.5, 12, HR - 22);
  for (const [a, b] of [[114, cx - 124], [cx + 124, 522]]) { frameRect(a, b, 0, 315, HR - 25); }
  // listwa przypodłogowa
  B(102, 531, 0, 2, 0, 10, mat.wall2); B(0, 2, 0, 1040, 0, 10, mat.wall2);
  // żyrandol
  const hz = 345, cxz = 316, cyz = 200; cyl(cxz, cyz, hz, HR, .8, mat.black, 8);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, R = 55 + (i % 2) * -18; const px = cxz + Math.cos(a) * R, py = cyz + Math.sin(a) * R;
    rodBetween([cxz, cyz, hz], [px, py, hz], .9, mat.black); cyl(px, py, hz, hz + 6, 2.2, mat.black); cyl(px, py, hz + 6, hz + 32 + (i % 2) * 12, 2.6, mat.glow, 16); }
  cyl(cxz, cyz, hz - 6, hz + 4, 3, mat.black);
  const cl = new THREE.PointLight('#ffe0b0', 3, 6, 2); cl.position.set(-cxz / 100, (hz + 20) / 100, cyz / 100); CUR.add(cl);
}

// ---------------- jadalnia (pierwszy plan, jak na zdjęciu) ----------------
function chair(x, y, rot) { const g = new THREE.Group(); const prev = CUR; CUR = g;
  B(-24, 24, -24, 24, 44, 52, mat.boucle, { r: 3 }); B(-24, 24, 18, 26, 52, 92, mat.boucle, { r: 3 });
  for (const [a, b] of [[-22, -22], [22, -22], [-22, 22], [22, 22]]) rodBetween([a, b, 0], [a, b, 44], 1.4, mat.brass);
  rodBetween([-24, 0, 62], [-24, 22, 62], 1.2, mat.brass); rodBetween([24, 0, 62], [24, 22, 62], 1.2, mat.brass);
  CUR = prev; g.position.set(-x / 100, 0, y / 100); g.rotation.y = rot; g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); CUR.add(g); }
function dining() {
  const t = B(236, 336, 540, 840, 72, 76, mat.oak); uvScale(t, 1); for (const [x, y] of [[240, 544], [332, 544], [240, 836], [332, 836]]) B(x - 4, x + 4, y - 4, y + 4, 0, 72, mat.oak);
  for (const y of [590, 665, 740, 805]) { chair(212, y, -Math.PI / 2); chair(360, y, Math.PI / 2); }
  vaseFlowers(286, 640, 76, 1.1);
}

// ---------------- KONCEPCJA 1 ----------------
function concept1() {
  // ściana TV
  B(196, 436, 0, 45, 0, 58, mat.black); for (const x of [276, 356]) B(x - .3, x + .3, 45, 45.3, 4, 54, mat.blackG);
  B(233, 399, 3, 6, 95, 190, mat.blackG); B(235, 397, 6, 6.3, 97, 188, mat.screen);
  lamp(225, 22, 58); sph(410, 22, 64, 6, mat.cer); B(380, 420, 10, 34, 58, 64, mat.oak);
  for (const x of [166, 467]) { photoFrame(x, 232, 48, 58, 0); photoFrame(x, 164, 48, 58, x > 300 ? 2 : 1); photoFrame(x, 96, 48, 58, x > 300 ? 0 : 2); sconceTV(x, 302); }
  // biblioteka
  const towers = [[0, 63.5], [63.5, 127], [267, 330.5], [330.5, 394]];
  for (const [a, b] of towers) {
    B(0, 42, a + .5, b - .5, 0, 10, mat.wall2); // cokół
    B(0, 45, a, b, 10, 85, mat.wall); const m = (a + b) / 2;
    for (const [p, q] of [[a + 1.5, m - .3], [m + .3, b - 1.5]]) { B(45, 47, p, q, 12, 83, mat.wall2); const c = B(47, 47.5, p + 5, q - 5, 17, 78, mat.cane); c.material = mat.cane; uvScale(c, 2.2); sph(48.5, (p < m ? q - 4 : p + 4), 58, 1.4, mat.brass); }
    B(0, 46, a, b, 85, 88, mat.wall2);
    B(0, 36, a, a + 2, 88, HN, mat.wall); B(0, 36, b - 2, b, 88, HN, mat.wall);
    for (const h of [135, 182, 229]) B(0, 34, a + 2, b - 2, h, h + 2.5, mat.wall);
    for (const [h, mh] of [[88, 47], [137.5, 44], [184.5, 44], [231.5, 44]]) shelf('y', a + 2, b - 2, h, 34, mh, 0, 1);
    // kinkiet biblioteczny
    B(30, 38, m - 15, m + 15, 270, 273, mat.brass); rodBetween([30, m, 271], [22, m, 280], .7, mat.brass);
    const s = new THREE.SpotLight('#ffd49a', 2.2, 2.4, 1.0, .8, 2); s.position.set(-.34, 2.66, m / 100); s.target.position.set(-.1, 1.4, m / 100); CUR.add(s, s.target);
  }
  // ława
  B(0, 55, 127, 267, 0, 8, mat.wall2); for (const [p, q] of [[128, 196.5], [197.5, 266]]) { B(0, 55, p, q, 8, 40, mat.oak); B(55, 56, (p + q) / 2 - 7, (p + q) / 2 + 7, 26, 28, mat.brass); }
  B(0, 56, 127, 267, 40, 50, mat.boucle, { r: 4 }); B(0, 10, 127, 267, 50, 120, mat.linen, { r: 3 });
  for (let i = 0; i < 4; i++) B(10, 13, 130 + i * 34.5, 163 + i * 34.5, 52, 118, mat.linen, { r: 2 });
  B(12, 26, 138, 178, 50, 90, mat.boucle, { r: 7 }); B(12, 26, 222, 258, 50, 86, M({ color: '#c8b398', roughness: 1 }), { r: 7 });
  for (const h of [178, 230]) { B(0, 30, 127, 267, h, h + 2.5, mat.wall); shelf('y', 128, 266, h + 2.5, 28, 42, 0, 1); }
  B(0, 3, 197, 199, 140, 150, mat.brass); rodBetween([2, 198, 145], [22, 210, 148], .6, mat.brass); cyl(24, 212, 138, 150, 5, mat.brass, 16, 7);
  const rl = new THREE.SpotLight('#ffd6a0', 3, 2, .9, .7, 2); rl.position.set(-.24, 1.38, 2.12); rl.target.position.set(-.3, .4, 1.9); CUR.add(rl, rl.target);
  // półki ściana krótka
  B(45, 102, 0, 30, 0, 10, mat.wall2); B(45, 102, 0, 30, 10, 85, mat.wall); B(45, 102, 30, 31, 12, 83, mat.cane);
  for (const h of [85, 132, 179, 226]) { B(45, 102, 0, 30, h, h + 2.5, mat.wall); shelf('x', 46, 101, h + 2.5, 28, 44, 0, 1); }
  B(100, 102, 0, 30, 85, HN, mat.wall);
  // szyna + drabina
  rodBetween([42, 2, 252], [42, 392, 252], 1, mat.brass);
  for (const yy of [342, 382]) rodBetween([78, yy, 0], [44, yy, 254], 1.8, mat.oak);
  for (let k = 1; k < 9; k++) { const t = k / 9; const x = 78 + (44 - 78) * t; rodBetween([x, 342, t * 254], [x, 382, t * 254], 1.3, mat.oak); }
  // oprawy sufitowe
  for (const y of [60, 197, 334]) cyl(70, y, HN - 1, HN, 4, mat.glow, 16);
  flushBooks();
  // salon: narożnik (bez zmian) + konsola za sofą jak na zdjęciu
  sofa(152, 496, 317, 418, 396, 496, 141, 317, 'N', 'E');
  B(204, 352, 182, 300, 0, 4, mat.oakD); const ct = B(204, 352, 182, 300, 34, 40, mat.oak); uvScale(ct, 1); for (const [x, y] of [[208, 186], [348, 186], [208, 296], [348, 296]]) B(x - 3, x + 3, y - 3, y + 3, 4, 34, mat.oak);
  vaseFlowers(250, 230, 40, .8); B(290, 330, 220, 250, 40, 46, M({ color: '#d9cbb5' }));
  B(150, 510, 110, 405, 0, 1.2, mat.rug).material = mat.rug;
  // konsola za sofą
  B(180, 450, 422, 462, 76, 80, mat.oak); B(180, 450, 422, 462, 20, 23, mat.oak); for (const [x, y] of [[183, 425], [447, 425], [183, 459], [447, 459]]) B(x - 2, x + 2, y - 2, y + 2, 0, 76, mat.oak);
  lamp(420, 442, 80); vaseFlowers(220, 442, 80, .9); B(290, 340, 428, 456, 80, 86, mat.cer); B(280, 330, 430, 454, 23, 33, M({ color: '#cbb89c' }));
}
function sofa(x0, x1, y0, y1, lx0, lx1, ly0, ly1, back1, back2) {
  // część długa (x0..x1, y0..y1) z oparciem po stronie back1; noga (lx0..lx1, ly0..ly1) z oparciem back2
  B(x0, x1, y0, y1, 0, 12, mat.black, {}); B(lx0, lx1, ly0, ly1, 0, 12, mat.black);
  const part = (a0, a1, b0, b1, bk) => { B(a0, a1, b0, b1, 12, 40, mat.boucle, { r: 4 });
    if (bk === 'N') B(a0, a1, b1 - 22, b1, 40, 78, mat.boucle, { r: 8 }); if (bk === 'E') B(a1 - 22, a1, b0, b1, 40, 78, mat.boucle, { r: 8 });
    if (bk === 'W') B(a0, a0 + 22, b0, b1, 40, 78, mat.boucle, { r: 8 }); if (bk === 'S') B(a0, a1, b0, b0 + 22, 40, 78, mat.boucle, { r: 8 }); };
  part(x0, x1, y0, y1, back1); part(lx0, lx1, ly0, ly1, back2);
  // poduszki siedziska
  if (back1 === 'N') for (let x = x0 + 2; x < x1 - 60; x += 84) B(x, Math.min(x + 82, x1 - (back2 === 'E' ? 24 : 2)), y0 + 2, y1 - 22, 40, 50, mat.boucle, { r: 6 });
  if (back1 === 'E') for (let y = y0 + 2; y < y1 - 60; y += 84) B(x0 + 2, x1 - 22, y, Math.min(y + 82, y1 - 2), 40, 50, mat.boucle, { r: 6 });
  // poduszki dekoracyjne
  const pc = [M({ color: '#d8ccb8', roughness: 1 }), mat.boucle, M({ color: '#bca78c', roughness: 1 })];
  if (back1 === 'N') { B(x0 + 10, x0 + 52, y1 - 34, y1 - 20, 50, 92, pc[0], { r: 8 }); B(x0 + 50, x0 + 92, y1 - 34, y1 - 20, 50, 88, pc[1], { r: 8 }); B(x1 - 70, x1 - 26, y1 - 36, y1 - 22, 50, 92, pc[2], { r: 8 }); }
  if (back1 === 'E') { B(x1 - 36, x1 - 22, y0 + 12, y0 + 54, 50, 92, pc[0], { r: 8 }); B(x1 - 36, x1 - 22, y0 + 52, y0 + 94, 50, 88, pc[2], { r: 8 }); B(x1 - 36, x1 - 22, y1 - 60, y1 - 16, 50, 92, pc[1], { r: 8 }); }
}

// ---------------- KONCEPCJA 2 ----------------
function concept2() {
  // okładzina dębowa wnęki
  const bw = B(0, 2, 0, BEAM0, 0, HN, mat.oak); uvScale(bw, 1.2); const ew = B(0, NICHE, 0, 2, 0, HN, mat.oak); uvScale(ew, 1.2);
  for (let x = 2; x < NICHE; x += 7) B(x, x + 4, 0, BEAM0, HN - 5, HN, mat.oak);
  const nl = new THREE.PointLight('#ffe2bc', 1.2, 3, 2); nl.position.set(-.6, 2.2, 1.97); CUR.add(nl);
  B(0, NICHE, 0, BEAM0, HN - 6, HN - 5, M({ color: '#9a7a58', roughness: .9 }), { cast: false });
  for (const [a, b] of [[0, 92], [302, 394]]) {
    B(0, 40, a, b, 0, 8, mat.black); B(0, 40, a, b, 8, 86, mat.oak); const m = (a + b) / 2;
    for (const [p, q] of [[a + 1.5, m - .3], [m + .3, b - 1.5]]) { const c = B(40, 40.6, p + 4, q - 4, 12, 82, mat.cane); uvScale(c, 2.2); B(40.6, 41.2, p + 1, p + 4, 12, 82, mat.oak); }
    B(0, 40, a, b, 86, 90, mat.oakD); B(0, 40, a, b, 90, 160, mat.oakD); const sp = B(40, 40.6, a + 5, b - 5, 94, 156, mat.cane); uvScale(sp, 2.2);
    B(0, 40, a, b, 160, 163, mat.oakD); B(0, 36, a, a + 2.5, 163, HN, mat.oak); B(0, 36, b - 2.5, b, 163, HN, mat.oak);
    for (const h of [212, 252]) B(0, 34, a + 2, b - 2, h, h + 2.5, mat.oakD);
    for (const [h, mh] of [[163, 46], [214.5, 36], [254.5, 32]]) shelf('y', a + 3, b - 3, h, 32, mh, 0, 1);
  }
  for (let y = 93; y < 301; y += 2.6) B(2, 4.5, y, y + 1.9, 0, HN - 6, mat.oak, { cast: false });
  // TV 85 + podświetlenie
  B(4.5, 5.5, 102, 292, 61, 169, mat.glow, { cast: false }).material = new THREE.MeshStandardMaterial({ color: '#ffe9c4', emissive: '#ffd99a', emissiveIntensity: 1.4 });
  B(5.5, 9, 102.5, 291.5, 61, 169, mat.blackG); B(9, 9.3, 104, 290, 63, 167, mat.screen);
  // konsola podwieszana
  B(4.5, 42, 104, 290, 20, 52, mat.black); B(42, 42.4, 150, 244, 26, 46, M({ color: '#2b2b2b', roughness: 1 }));
  for (const y of [166, 228]) B(42, 42.3, y - .3, y + .3, 22, 50, mat.blackG);
  for (const y of [46, 348]) cyl(78, y, HN - 6.5, HN - 5.5, 9, mat.white, 24);
  for (const y of [140, 254]) cyl(70, y, HN - 7, HN - 6, 4, mat.glow, 16);
  const l2 = new THREE.SpotLight('#ffd49a', 3, 3, .8, .8, 2); l2.position.set(-.7, 2.8, 1.97); l2.target.position.set(-.05, 1.5, 1.97); CUR.add(l2, l2.target);
  flushBooks();
  // ściana galeryjna (płd.)
  B(236, 396, 0, 40, 0, 52, mat.black); for (const x of [289, 343]) B(x - .3, x + .3, 40, 40.3, 4, 48, mat.blackG);
  const cx = 316.5; B(cx - 62, cx + 62, 3, 6, 92, 247, mat.black); B(cx - 59, cx + 59, 6, 6.3, 95, 244, mat.pp);
  plane(cx, 6.5, 169.5, 96, 128, M({ map: photoTex(2), roughness: .5 }));
  B(cx - 32, cx + 32, 4, 12, 254, 258, mat.brass); B(cx - 2, cx + 2, 0, 6, 256, 262, mat.brass);
  const pl = new THREE.SpotLight('#ffd9a0', 4, 3, .9, .8, 2); pl.position.set(-cx / 100, 2.52, .14); pl.target.position.set(-cx / 100, 1.4, 0); CUR.add(pl, pl.target);
  for (const x of [166, 467]) { photoFrame(x, 232, 48, 58, 0); photoFrame(x, 164, 48, 58, x > 300 ? 2 : 1); photoFrame(x, 96, 48, 58, x > 300 ? 0 : 2); sconceTV(x, 302); }
  sph(270, 20, 64, 9, mat.cer); B(330, 370, 8, 32, 52, 58, mat.oak); vaseFlowers(360, 20, 58, .7);
  // narożnik do wnęki: długa część x355..455 oparcie E; szezlong x255..355 y290..390 oparcie N
  sofa(355, 455, 90, 390, 255, 355, 290, 390, 'E', 'N');
  const ct = B(205, 320, 145, 260, 34, 40, mat.oak, { r: 6 }); uvScale(ct, 1); B(225, 300, 165, 240, 0, 34, mat.oak, { r: 4 });
  vaseFlowers(240, 200, 40, .75); B(270, 305, 215, 245, 40, 46, M({ color: '#d9cbb5' }));
  const rg = B(150, 470, 70, 350, 0, 1.2, mat.rug);

}

// ---------------- build ----------------
architecture(); dining();
const G1 = new THREE.Group(), G2 = new THREE.Group(); ROOT.add(G1, G2);
if (INTER || CONCEPT === '1') { CUR = G1; concept1(); } if (INTER || CONCEPT === '2') { CUR = G2; concept2(); } CUR = ROOT;
G1.visible = CONCEPT !== '2'; G2.visible = CONCEPT === '2'; window.G1 = G1; window.G2 = G2;

// ---------------- lights ----------------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = +(Q.get('exp') || .85); document.body.appendChild(renderer.domElement);
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = +(Q.get('env') || .22);
RectAreaLightUniformsLib.init();
const sky = new THREE.RectAreaLight('#dfe9f2', +(Q.get('sky') || 1.6), 3.9, 5.4); sky.position.set(-5.5, 2.7, 1.97); sky.lookAt(0, 2.7, 1.97); scene.add(sky);
const sky2 = new THREE.RectAreaLight('#dfe9f2', 1.0, 3.2, 2.4); sky2.position.set(-5.52, 1.2, 6.9); sky2.lookAt(0, 1.2, 6.9); scene.add(sky2);
const hemi = new THREE.HemisphereLight('#f6efe4', '#b89a74', .25); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe2b8', +(Q.get('sun') || 7)); sun.position.set(-15, 8.2, 5.2); sun.target.position.set(-2.2, 0, 1.0); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(INTER ? 2048 : 4096, INTER ? 2048 : 4096); const sc = sun.shadow.camera; sc.left = -8; sc.right = 8; sc.top = 8; sc.bottom = -8; sc.near = 1; sc.far = 40; sun.shadow.bias = -0.0003; sun.shadow.normalBias = .02;
// liście drzew przed oknem – rzucają cień jak na zdjęciu referencyjnym
const leafTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 1024);
  g.fillStyle = '#fff'; for (let i = 0; i < 900; i++) { const x = rnd() * 1024, y = rnd() * 1024; g.save(); g.translate(x, y); g.rotate(rnd() * 6.28); g.beginPath(); g.ellipse(0, 0, 10 + rnd() * 16, 5 + rnd() * 7, 0, 0, 7); g.fill(); g.restore(); }
  g.strokeStyle = '#fff'; g.lineWidth = 5; for (let i = 0; i < 25; i++) { g.beginPath(); g.moveTo(rnd() * 1024, rnd() * 1024); g.lineTo(rnd() * 1024, rnd() * 1024); g.stroke(); }
  const t = new THREE.CanvasTexture(c); return t; })();
const goboMat = new THREE.MeshBasicMaterial({ alphaMap: leafTex, transparent: false, alphaTest: .5, side: THREE.DoubleSide, colorWrite: false, depthWrite: false });
for (const [px, pz, sz] of [[-8.2, 3.0, 4.5], [-8.6, 0.2, 3.5], [-8.0, 5.8, 3]]) { const gb = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz * 1.2), goboMat); gb.position.set(px, 4.6, pz); gb.rotation.y = Math.PI / 2 + .3; gb.castShadow = true; scene.add(gb); }

// ---------------- camera ----------------
const VIEWS = {
  main:   { pos: [330, 525, 160], look: [330, 0], up: 41, down: 33 },
  niche1: { pos: [515, 120, 140], look: [0, 235], up: 30, down: 26 },
  niche2: { pos: [535, 240, 132], look: [0, 197], up: 28, down: 24 },
  wide:   { pos: [40, 600, 150], look: [420, 60], up: 38, down: 32 },
};
const vk = VIEW === 'niche' ? (CONCEPT === '1' ? 'niche1' : 'niche2') : VIEW; const V = VIEWS[vk];
const d2r = Math.PI / 180, tu = Math.tan(V.up * d2r), td = Math.tan(V.down * d2r), tm = Math.max(tu, td);
const fh = H * 2 * tm / (tu + td);
const cam = new THREE.PerspectiveCamera(2 * Math.atan(tm) / d2r, W / fh, .05, 80);
cam.position.set(-V.pos[0] / 100, V.pos[2] / 100, V.pos[1] / 100); cam.lookAt(-V.look[0] / 100, V.pos[2] / 100, V.look[1] / 100);
if (!INTER) cam.setViewOffset(W, fh, 0, fh / 2 - tu / tm * fh / 2, W, H); else { cam.aspect = W / H; cam.fov = 60; }
cam.updateProjectionMatrix();

const comp = new EffectComposer(renderer); comp.addPass(new RenderPass(scene, cam));
const ao = new GTAOPass(scene, cam, W, H); ao.updateGtaoMaterial({ radius: .35, distanceExponent: 1.5, thickness: 1, scale: 1.1 }); ao.blendIntensity = .85; comp.addPass(ao);
comp.addPass(new OutputPass());
if (INTER) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.fov = 62; cam.updateProjectionMatrix(); comp.setSize(innerWidth, innerHeight);
  const ctl = new OrbitControls(cam, renderer.domElement); ctl.enableDamping = true; ctl.maxDistance = 5; ctl.minDistance = .3; ctl.maxPolarAngle = Math.PI * .62;
  const PRE = { salon: [[-3.3, 1.6, 5.25], [-3.0, 1.5, 1.5]], wneka: [[-5.15, 1.4, 1.2], [-0.6, 1.4, 2.3]], okno: [[-0.6, 1.6, 3.6], [-4.5, 1.7, 1.2]], gora: [[-4.8, 4.8, 4.0], [-2.5, 0.6, 1.8]] };
  const go = k => { const [p, t] = PRE[k]; cam.position.set(...p); ctl.target.set(...t); ctl.update(); dirty = 3; };
  let dirty = 3; ctl.addEventListener('change', () => dirty = 2);
  window.__setConcept = c => { G1.visible = c === '1'; G2.visible = c === '2'; dirty = 3; };
  window.__go = go; go('salon');
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); comp.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); dirty = 3; });
  const loop = () => { requestAnimationFrame(loop); ctl.update(); if (dirty > 0) { comp.render(); dirty--; } }; loop(); window.__ready && window.__ready();
} else { comp.render(); comp.render(); window.__done = true; }
