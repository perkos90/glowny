import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const Q = new URLSearchParams(window.__Q ?? location.search);
const CONCEPT = Q.get('c') || '1', VIEW = Q.get('v') || 'main', INTER = Q.get('i') === '1';
const W = +(Q.get('w') || innerWidth), H = +(Q.get('h') || innerHeight);
let rnd = (() => { let s = 12345; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const pick = a => a[Math.floor(rnd() * a.length)];
const HOUSE_MODE = Q.get('house') === '1';
const ASSET = window.__ASSET || './';
const NICHE = 102, COL = 531, WIN = 553, BEAM0 = 394, BEAM1 = 419, HN = 290; let HR = HOUSE_MODE ? 595 : 550;

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
for (const k in mat) mat[k].name = k;
const EXPORT = Q.get('export') === '1';

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
const BOOKMATS = {};
function flushBooks() {
  if (EXPORT) { const g = new THREE.BoxGeometry(1, 1, 1);
    BOOKS.forEach(b => { const col = pick(BOOKC); const m = BOOKMATS[col] || (BOOKMATS[col] = Object.assign(M({ color: col, roughness: .75 }), { name: 'book_' + col.slice(1) }));
      const me = new THREE.Mesh(g, m); let sx, sy, sz, x, y; sy = b.th;
      if (b.axis === 'y') { sx = b.w; sz = b.len; x = b.wallPos + b.dir * (b.w / 2 + 1); y = b.a + b.len / 2; } else { sz = b.w; sx = b.len; y = b.wallPos + b.dir * (b.w / 2 + 1); x = b.a + b.len / 2; }
      me.position.set(-x / 100, (b.h + b.th / 2) / 100, y / 100); me.scale.set(sx / 100, sy / 100, sz / 100); if (b.lean) { if (b.axis === 'y') me.rotation.x = .18; else me.rotation.z = .18; } CUR.add(me); });
    BOOKS = []; return; }
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
  B(-370, -45, 394, 670, HN, 330, mat.wall); B(-45, 0, BEAM1, 645, HN, 330, mat.wall);
  B(-340, -260, 380, 419.5, 0, 205, M({ color: '#e4dacb', roughness: .9 })); B(-150, -70, 380, 419.5, 0, 205, M({ color: '#e4dacb', roughness: .9 }));
  { const hl = new THREE.PointLight('#ffe6c4', 1.2, 4, 2); hl.position.set(1.8, 2.6, 5.3); CUR.add(hl); }
  B(-45, 556, -45, 0, 0, HR, mat.wall);               // południowa (TV)
  B(76, 102, -45, BEAM0, 330, HR, mat.wall);           // ściana łazienki nad wnęką
  B(-45, 600, BEAM0, BEAM1, 280, HR + 20, mat.wall);   // podciąg + ściana nad nim
  B(-45, 600, -45, BEAM0, HR, HR + 25, mat.wall);      // strop pustki
  B(-45, 102, -45, BEAM0, HN, 330, mat.wall);          // strop nad wnęką
  B(0, 600, BEAM1, 1060, HN, 330, mat.wall);         // strop jadalni
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
  livingDetails();
}
function livingDetails() {
  // gzyms
  B(102, 553, 0, 12, HR - 12, HR, mat.wall2); B(102, 115, 0, BEAM0, HR - 12, HR, mat.wall2);
  // zasłony
  for (const [y0, y1] of [[2, 70], [324, 392]]) { const g = new THREE.PlaneGeometry((y1 - y0) / 100, (HR - 12) / 100, 60, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 55) * .035);
    const c = new THREE.Mesh(g, M({ map: T.linen, color: '#efe6d6', roughness: 1, side: THREE.DoubleSide })); c.rotation.y = Math.PI / 2; c.position.set(-(WIN - 14) / 100, (HR - 12) / 200, (y0 + y1) / 200); c.castShadow = true; c.receiveShadow = true; CUR.add(c); }
  B(WIN - 20, WIN - 16, 0, BEAM0, HR - 12, HR - 9, mat.black); // karnisz
  // portal wnęki
  B(96, 108, -2, BEAM0, 280, 292, mat.wall2); B(96, 108, 0, 8, 0, 292, mat.wall2);
  // listwy na ścianie nad wnęką
  if (!/^[rpcm]/.test(String(CONCEPT))) frameRect(30, 364, 102, 330, 520, 2.2, 1.6, mat.wall2, 'y');
  // ściana TV – pas centralny + ramki
  const cx = 316.5; B(cx - 110, cx + 110, 0, 2.5, 0, HR, mat.wall2); frameRect(cx - 98, cx + 98, 2.5, 12, HR - 22);
  for (const [a, b] of [[114, cx - 124], [cx + 124, 522]]) { frameRect(a, b, 0, 315, HR - 25); }
  // listwa przypodłogowa
  B(102, 531, 0, 2, 0, 10, mat.wall2); B(0, 2, 0, 1040, 0, 10, mat.wall2);
  // żyrandol
  if (/^[rpcm]/.test(String(CONCEPT))) return;
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
// ======================= NOWOCZESNA KLASYKA – seria 2 =======================
mat.mocha = M({ color: '#7b6150', roughness: .6, name: 'mocha' }); mat.mochaL = M({ color: '#8d725f', roughness: .6, name: 'mochaL' });
function mouldPanel(x, y0, y1, h0, h1, m, inset = 9) { frameRect(y0, y1, x, h0, h1, 3, 2.2, m, 'y'); frameRect(y0 + inset, y1 - inset, x, h0 + inset, h1 - inset, 1.6, 1.4, m, 'y'); }
function aboveBoiserie(m, layout = 'tall') { // fryz + gzyms + płyciny na antresoli
  B(100, 108, -4, BEAM0 + 4, HN, 334, m); B(108, 112, -4, BEAM0 + 4, 326, 334, m); B(112, 115, -4, BEAM0 + 4, 330, 334, m);
  B(100, 112, -6, BEAM0 + 6, HR - 16, HR, m); B(112, 116, -6, BEAM0 + 6, HR - 8, HR - 2, m);
  const cols = layout === 'tall' ? [[16, 118], [138, 256], [276, 378]] : [[16, 186], [208, 378]];
  for (const [a, b] of cols) { mouldPanel(102, a, b, 350, 470, m); mouldPanel(102, a, b, 488, HR - 32, m); }
}
// M1: paryska (Haussmann) – biel + czarne detale, stalowe drzwi witryn
function conceptM1() {
  livingStd(); tvSouth();
  B(0, 1.5, 0, BEAM0, 0, HN, mat.wall2); mouldPanel(1.5, 120, 274, 110, 270, mat.wall2);
  const st = M({ color: '#141414', roughness: .35, metalness: .4 });
  for (const [a, b] of [[4, 116], [278, 390]]) { B(0, 45, a, b, 0, 255, mat.wall2); B(0, 1, a + 3, b - 3, 90, 250, M({ color: '#d8d0c4' }));
    B(0, 45, a + 3, b - 3, 88, 92, mat.calac); for (const h of [140, 192]) { B(0, 40, a + 4, b - 4, h, h + 1.2, M({ color: '#e6efee', roughness: .05, transparent: true, opacity: .4 })); shelf('y', a + 6, b - 6, h + 1.2, 30, 46, 0, 1); } shelf('y', a + 6, b - 6, 92, 30, 44, 0, 1);
    const m = (a + b) / 2; for (const [p, q] of [[a + 2, m - .5], [m + .5, b - 2]]) { B(44, 46, p, q, 92, 95, st); B(44, 46, p, q, 247, 250, st); B(44, 46, p, p + 2.5, 92, 250, st); B(44, 46, q - 2.5, q, 92, 250, st); for (const h of [143, 195]) B(44, 46, p, q, h - .8, h + .8, st); B(44.8, 45.2, p + 2.5, q - 2.5, 95, 247, mat.glass); }
    for (const [p, q] of [[a + 2, m - .5], [m + .5, b - 2]]) { B(45, 46.5, p, q, 6, 86, mat.wall2); frameRect(p + 6, q - 6, 46.5, 12, 80, 1.6, 1.2, mat.wall2, 'y'); B(46.5, 48, p < m ? q - 8 : p + 6, p < m ? q - 6 : p + 8, 50, 70, st); } B(0, 47, a, b, 255, HN, mat.wall2); }
  B(4, 46, 140, 254, 0, 78, mat.black); for (const y of [178, 216]) B(46, 46.3, y - .3, y + .3, 4, 76, mat.blackG); B(2, 48, 136, 258, 78, 82, mat.calac);
  { const fr = new THREE.Mesh(new THREE.TorusGeometry(.42, .02, 10, 48), st); fr.rotation.y = Math.PI / 2; fr.position.set(-.03, 1.62, 1.97); CUR.add(fr); const mi = new THREE.Mesh(new THREE.CircleGeometry(.41, 48), mat.mirror); mi.rotation.y = -Math.PI / 2; mi.position.set(-.025, 1.62, 1.97); CUR.add(mi); }
  lamp(20, 160, 82); vaseFlowers(20, 236, 82, .6); flushBooks();
  portalClassic(); aboveBoiserie(mat.wall2); for (const y of [67, 197, 327]) B(102, 104, y - 20, y + 20, HR - 34, HR - 30, M({ color: '#141414' }));
  chandelierTiers(316, 200, HR, HR - 190);
}
// M2: TV jak obraz w boazerii + kasetonowy sufit wnęki z ukrytym LED
function conceptM2() {
  livingStd(); southGallery();
  B(0, 1.5, 0, BEAM0, 0, HN, mat.wall2); for (const [a, b] of [[14, 110], [284, 380]]) mouldPanel(1.5, a, b, 20, 270, mat.wall2);
  mouldPanel(1.5, 120, 274, 20, 70, mat.wall2); B(1.5, 6, 104, 290, 88, 200, mat.wall2); frameRect(104, 290, 6, 88, 200, 5, 3, mat.gilt, 'y');
  B(4, 7, 107, 287, 91, 197, mat.blackG); B(7, 7.3, 109, 285, 93, 195, mat.screen);
  for (let x = 0; x < NICHE; x += 34) for (let y = 0; y < BEAM0; y += 49.25) { B(x, x + 34, y, y + 3, HN - 14, HN, mat.wall2); B(x, x + 3, y, y + 49.25, HN - 14, HN, mat.wall2); }
  B(0, NICHE, 0, BEAM0, HN - 1, HN, mat.wall2, { cast: false }); ledStrip(0, NICHE, 2, BEAM0 - 2, HN - 15, HN - 14);
  B(4, 45, 30, 364, 0, 30, mat.wall2); B(2, 47, 26, 368, 30, 34, mat.trav); for (const y of [80, 314]) { sph(22, y, 50, 14, mat.cer, 1.1); } cyl(22, 140, 34, 64, 6, mat.black, 24, 9); vaseFlowers(22, 250, 34, .6);
  for (const y of [40, 354]) { B(1.5, 3.5, y - 4, y + 4, 190, 212, mat.gilt); rodBetween([3.5, y, 205], [14, y, 205], .6, mat.gilt); cyl(14, y, 200, 216, 6, mat.shade, 20, 8); const l = new THREE.PointLight('#ffd6a0', 1.2, 2.2, 2); l.position.set(-.14, 2.0, y / 100); CUR.add(l); }
  portalClassic(); aboveBoiserie(mat.wall2); chandelierTiers(316, 200, HR, HR - 190);
}
// M3: ryflowane kolumny + łuk z tynku (nowoczesny portal) + trawertyn
function conceptM3() {
  livingStd(); southGallery();
  const pl = mat.plaster; B(0, 1.5, 0, BEAM0, 0, HN, mat.micro);
  // ściana frontowa z łukiem (x 92..102)
  const cx = 197, r = 150; B(92, 102, -2, 47, 0, HN, pl); B(92, 102, 347, BEAM0 + 2, 0, HN, pl);
  for (let i = 0; i < 220; i++) { const a = Math.PI * (i + .5) / 220; const yy = cx - r * Math.cos(a), zz = 150 + r * Math.sin(a); const ww = Math.PI * r / 220 + 1.2; B(92, 102, yy - ww / 2, yy + ww / 2, zz, HN, pl); }
  // kolumny ryflowane
  for (const y of [22, 372]) { cyl(112, y, 0, 6, 24, pl, 32); cyl(112, y, 6, HN + 30, 18, pl, 40); for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; const g = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, (HN + 18) / 100, 8), pl); g.position.set(-(112 + Math.cos(a) * 17.2) / 100, (HN + 24) / 200 + .03, (y + Math.sin(a) * 17.2) / 100); g.castShadow = true; CUR.add(g); } cyl(112, y, HN + 22, HN + 34, 24, pl, 32); }
  B(92, 108, -4, BEAM0 + 4, HN, 334, pl); B(108, 114, -6, BEAM0 + 6, 326, 340, pl);
  // wnętrze: trawertynowa ława + rzeźba + obraz
  const tb = B(0, 48, 60, 334, 0, 42, mat.trav); uvScale(tb, .5); B(2, 46, 70, 220, 42, 52, mat.boucle, { r: 4 }); sph(22, 280, 62, 14, mat.cer); cyl(22, 315, 42, 80, 6, mat.black, 24, 9);
  B(0, 2, 137, 257, 110, 230, mat.oak); B(2, 2.4, 141, 253, 114, 226, M({ map: paintTex(0), roughness: .7 }));
  // nad: tynk + dwa wąskie lustra łukowe
  B(100, 102, -4, BEAM0 + 4, 334, HR, mat.micro);
  for (const y of [90, 304]) { const r = 32, h1 = 552; B(102, 104, y - r, y + r, 360, h1 - r, mat.gilt); B(104, 104.4, y - r + 3, y + r - 3, 363, h1 - r, mat.mirror);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(r / 100, r / 100, .02, 48, 1, false, 0, Math.PI), mat.gilt); cap.rotation.z = Math.PI / 2; cap.rotation.x = -Math.PI / 2; cap.position.set(-1.03, (h1 - r) / 100, y / 100); CUR.add(cap);
    const cm = new THREE.Mesh(new THREE.CircleGeometry(r / 100 - .03, 48, 0, Math.PI), mat.mirror); cm.rotation.y = -Math.PI / 2; cm.position.set(-1.046, (h1 - r) / 100, y / 100); CUR.add(cm); }
  chandelierTiers(316, 200, HR, HR - 190);
}
// M4: trzy łukowe lustra we wnęce + konsola + boazeria
function conceptM4() {
  livingStd(); southGallery();
  B(0, 1.5, 0, BEAM0, 0, HN, mat.greige);
  for (const [cy, w] of [[72, 92], [197, 120], [322, 92]]) { const r = w / 2, h0 = 30, h1 = 262; B(1.5, 4, cy - r, cy + r, h0, h1 - r, mat.gilt); B(4, 4.4, cy - r + 3, cy + r - 3, h0 + 3, h1 - r, mat.mirror);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(r / 100, r / 100, .025, 48, 1, false, 0, Math.PI), mat.gilt); cap.rotation.z = Math.PI / 2; cap.rotation.x = -Math.PI / 2; cap.position.set(-.028, (h1 - r) / 100, cy / 100); CUR.add(cap);
    const cm = new THREE.Mesh(new THREE.CircleGeometry(r / 100 - .03, 48, 0, Math.PI), mat.mirror); cm.rotation.y = -Math.PI / 2; cm.rotation.z = Math.PI / 2 * 0; cm.position.set(-.046, (h1 - r) / 100, cy / 100); CUR.add(cm); }
  B(4, 45, 40, 354, 30, 76, mat.black); B(2, 47, 36, 358, 76, 80, mat.calac); ledStrip(4, 44, 42, 352, 28, 30); for (const y of [118.5, 197, 275.5]) B(45, 45.3, y - .3, y + .3, 32, 74, mat.blackG);
  lamp(20, 110, 80); lamp(20, 284, 80); vaseFlowers(22, 197, 80, .7);
  portalClassic(); aboveBoiserie(mat.wall2, 'tall'); chandelierTiers(316, 200, HR, HR - 190);
}
// M5: „mocha mousse” – cała ściana w kolorze mokki z boazerią i mosiądzem, kremowa ława
function conceptM5() {
  livingStd(); southGallery();
  B(0, 1.5, 0, BEAM0, 0, HN, mat.mocha); B(0, NICHE, 0, 1.5, 0, HN, mat.mocha); B(0, NICHE, BEAM0 - 1.5, BEAM0, 0, HN, mat.mocha); B(0, NICHE, 0, BEAM0, HN - 1.5, HN, mat.mochaL, { cast: false });
  for (const [a, b] of [[14, 110], [128, 266], [284, 380]]) mouldPanel(1.5, a, b, 110, 270, mat.mocha); for (const [a, b] of [[14, 110], [284, 380]]) mouldPanel(1.5, a, b, 14, 92, mat.mocha);
  B(0, 70, 120, 274, 0, 40, mat.mocha); B(0, 72, 118, 276, 40, 54, mat.boucle, { r: 5 }); B(4, 22, 130, 180, 54, 96, mat.boucle, { r: 8 }); B(4, 22, 214, 264, 54, 92, M({ color: '#d9c7b0' }), { r: 8 });
  for (const y of [100, 294]) { B(1.5, 3.5, y - 4, y + 4, 140, 160, mat.brass); rodBetween([3.5, y, 152], [18, y + (y < 200 ? 10 : -10), 156], .6, mat.brass); cyl(20, y + (y < 200 ? 12 : -12), 146, 162, 7, mat.shade, 20, 9); const l = new THREE.PointLight('#ffd6a0', 1.5, 2.5, 2); l.position.set(-.2, 1.5, y / 100); CUR.add(l); }
  B(1.5, 3, 160, 234, 170, 250, mat.brass); B(3, 3.3, 163, 231, 173, 247, M({ map: paintTex(1), roughness: .7 }));
  B(100, 110, -4, BEAM0 + 4, HN - 2, HN + 16, mat.mocha); B(100, 108, -4, 12, 0, HN, mat.mocha); B(100, 108, BEAM0 - 12, BEAM0 + 4, 0, HN, mat.mocha);
  B(100, 102, -4, BEAM0 + 4, 300, HR, mat.mocha); aboveBoiserie(mat.mocha); for (const [a, b] of [[16, 118], [138, 256], [276, 378]]) { B(102, 103, a + 14, b - 14, 364, 364.6, mat.brass); B(102, 103, a + 14, b - 14, 502, 502.6, mat.brass); }
  chandelierTiers(316, 200, HR, HR - 190);
}
// M6: trawertynowy monolit we wnęce (ściana + ława + półki) + jasna boazeria
function conceptM6() {
  livingStd(); southGallery();
  for (const f of [B(0, 2, 0, BEAM0, 0, HN, mat.trav), B(0, NICHE, 0, 2, 0, HN, mat.trav), B(0, NICHE, BEAM0 - 2, BEAM0, 0, HN, mat.trav)]) uvScale(f, .45);
  const bn = B(0, 55, 2, BEAM0 - 2, 0, 44, mat.trav); uvScale(bn, .5); B(4, 50, 30, 200, 44, 54, mat.linen, { r: 4 }); B(4, 20, 40, 90, 54, 94, mat.boucle, { r: 8 });
  for (const h of [150, 210]) { const sh = B(0, 30, 230, 380, h, h + 8, mat.trav); uvScale(sh, .5); } cyl(14, 260, 158, 190, 6, mat.cer); sph(14, 320, 222, 12, mat.white); cyl(14, 355, 158, 180, 8, mat.black, 24, 6);
  B(0, 2, 60, 210, 120, 250, mat.black); B(2, 2.4, 64, 206, 124, 246, M({ map: paintTex(0), roughness: .7 })); B(2, 6, 110, 160, 256, 259, mat.brass);
  ledStrip(2, 4, 4, BEAM0 - 4, HN - 8, HN - 6);
  portalClassic(); aboveBoiserie(mat.wall2, 'wide'); chandelierTiers(316, 200, HR, HR - 190);
}

// ======================= SERIA „KLASYKA” (PL / RU / US) =======================
function paintTex(kind) { return cv(512, 640, (g, w, h) => { const sky = g.createLinearGradient(0, 0, 0, h * .6); sky.addColorStop(0, kind ? '#c9b99a' : '#b8c2c0'); sky.addColorStop(1, '#efe3c8'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,248,230,${rnd() * .25})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h * .45, 40 + rnd() * 90, 10 + rnd() * 20, 0, 0, 7); g.fill(); }
  g.fillStyle = '#9a9a82'; g.beginPath(); g.moveTo(0, h * .62); for (let x = 0; x <= w; x += 32) g.lineTo(x, h * .58 + Math.sin(x / 60 + kind) * 18); g.lineTo(w, h); g.lineTo(0, h); g.fill();
  g.fillStyle = '#7c7a5c'; g.beginPath(); g.moveTo(0, h * .72); for (let x = 0; x <= w; x += 32) g.lineTo(x, h * .7 + Math.sin(x / 45 + 2) * 12); g.lineTo(w, h); g.lineTo(0, h); g.fill();
  for (let i = 0; i < 160; i++) { const x = (kind ? w * .68 : w * .25) + (rnd() - .5) * 170, y = h * .38 + rnd() * h * .32; g.fillStyle = pick(['rgba(70,75,50,.7)', 'rgba(95,95,60,.7)', 'rgba(55,60,40,.75)']); g.beginPath(); g.arc(x, y, 6 + rnd() * 14, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(60,50,35,.8)'; g.fillRect(kind ? w * .67 : w * .24, h * .6, 8, h * .14);
  const fg = g.createLinearGradient(0, h * .75, 0, h); fg.addColorStop(0, '#8a7a55'); fg.addColorStop(1, '#5a4c35'); g.fillStyle = fg; g.fillRect(0, h * .78, w, h * .22);
  noiseFill(g, w, h, 'rgba(0,0,0,0)', .08, 9000, 2); g.strokeStyle = 'rgba(40,30,20,.25)'; g.lineWidth = 30; g.strokeRect(0, 0, w, h); }); }

T.chino = cv(1024, 1400, (g, w, h) => { g.fillStyle = '#e9e6dc'; g.fillRect(0, 0, w, h);
  for (let t = 0; t < 6; t++) { let x = 60 + t * 170 + rnd() * 60, y = h; g.strokeStyle = 'rgba(90,85,70,.8)'; g.lineWidth = 9; g.beginPath(); g.moveTo(x, y); for (let i = 0; i < 8; i++) { x += (rnd() - .5) * 110; y -= 160 + rnd() * 60; g.lineTo(x, y);
      for (let k = 0; k < 3; k++) { g.save(); g.translate(x, y); g.strokeStyle = 'rgba(100,95,80,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo((rnd() - .5) * 120, -rnd() * 60); g.stroke(); g.restore(); } } g.stroke(); }
  for (let i = 0; i < 300; i++) { const x = rnd() * w, y = rnd() * h; g.fillStyle = pick(['rgba(130,155,140,.8)', 'rgba(160,178,160,.75)', 'rgba(110,130,120,.75)']); g.beginPath(); g.ellipse(x, y, 22 + rnd() * 18, 8 + rnd() * 6, rnd() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 70; i++) { const x = rnd() * w, y = rnd() * h; g.fillStyle = pick(['rgba(232,190,190,.9)', 'rgba(245,235,225,.95)', 'rgba(220,170,150,.85)']); for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.26) * 13, y + Math.sin(k * 1.26) * 13, 11, 0, 7); g.fill(); } }
  for (let i = 0; i < 9; i++) { const x = rnd() * w, y = rnd() * h * .8; g.fillStyle = 'rgba(70,110,130,.85)'; g.beginPath(); g.ellipse(x, y, 34, 14, -.3, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + 10, y); g.lineTo(x + 30, y - 10); g.lineTo(x + 28, y + 4); g.fill(); g.fillStyle = 'rgba(200,120,90,.9)'; g.beginPath(); g.arc(x - 14, y - 3, 3, 0, 7); g.fill(); } });
T.plaid = cv(256, 256, (g, w, h) => { g.fillStyle = '#e6dccb'; g.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 64) { g.fillStyle = 'rgba(120,60,50,.35)'; g.fillRect(i, 0, 18, h); g.fillRect(0, i, w, 18); g.fillStyle = 'rgba(40,60,70,.35)'; g.fillRect(i + 36, 0, 6, h); g.fillRect(0, i + 36, w, 6); } });
T.plaid.wrapS = T.plaid.wrapT = THREE.RepeatWrapping;
Object.assign(mat, { sage: M({ color: '#a7af97', roughness: .7, name: 'sage' }), navy: M({ color: '#2d3c44', roughness: .45, name: 'navy' }), chino: M({ map: T.chino, roughness: .85, name: 'chino' }),
  plaid: M({ map: T.plaid, roughness: 1, name: 'plaid' }), gilt: M({ color: '#b48a3a', metalness: 1, roughness: .38, name: 'gilt' }), white: mat.white });
// panele typu shaker na płaszczyźnie (x = stała, oś y)
function shakerWall(x, y0, y1, h0, h1, m, nx = 3, ny = 2, d = 1.6, gap = 12) { B(x - 1, x, y0, y1, h0, h1, m); const w = (y1 - y0 - gap * (nx + 1)) / nx, hh = (h1 - h0 - gap * (ny + 1)) / ny;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const a = y0 + gap + i * (w + gap), b0 = h0 + gap + j * (hh + gap); frameRect(a, a + w, x, b0, b0 + hh, 2.6, d, m, 'y'); } }
function pilaster(x, y, w, h0, h1, m) { B(x, x + 6, y - w / 2, y + w / 2, h0, h1, m); B(x, x + 10, y - w / 2 - 3, y + w / 2 + 3, h0, h0 + 18, m); B(x, x + 10, y - w / 2 - 4, y + w / 2 + 4, h1 - 16, h1, m); B(x, x + 12, y - w / 2 - 6, y + w / 2 + 6, h1 - 6, h1, m);
  for (let k = -1; k <= 1; k++) B(x + 6, x + 7.5, y + k * w / 4 - 1.2, y + k * w / 4 + 1.2, h0 + 24, h1 - 22, m); }
function giltFrame(x, y, h0, w, hh, img) { B(x, x + 4, y - w / 2, y + w / 2, h0, h0 + hh, mat.gilt); B(x + 4, x + 4.4, y - w / 2 + 6, y + w / 2 - 6, h0 + 6, h0 + hh - 6, M({ map: img, roughness: .7 })); }
// CL1 (PL): boazeria w szałwii od podłogi do sufitu + ława z poduchami
function conceptCL1() {
  livingStd(); tvSouth();
  shakerWall(1.5, 0, BEAM0, 0, HN, mat.sage, 4, 2); B(0, NICHE, 0, 1.5, 0, HN, mat.sage); B(0, NICHE, BEAM0 - 1.5, BEAM0, 0, HN, mat.sage); B(0, NICHE, 0, BEAM0, HN - 1.5, HN, mat.sage, { cast: false });
  B(1.5, 62, 10, 384, 0, 42, mat.sage); for (let y = 10; y < 384; y += 62.3) frameRect(y + 6, y + 56, 62, 6, 36, 2, 1.4, mat.sage, 'y');
  B(1.5, 64, 10, 384, 42, 54, mat.plaid, { r: 4 }); for (const [y, m] of [[50, mat.linen], [110, mat.plaid], [280, mat.boucle], [340, mat.linen]]) B(8, 24, y - 26, y + 26, 54, 98, m, { r: 8 });
  for (const y of [100, 294]) swingSconce(y, 150, y < 200 ? 1 : -1);
  giltFrame(1.5, 197, 140, 120, 90, paintTex(1));
  frieze(); shakerWall(103, -2, BEAM0 + 2, 336, HR - 14, mat.sage, 3, 2, 2, 16); B(100, 110, -4, BEAM0 + 4, HR - 14, HR, mat.sage);
  B(100, 108, -4, BEAM0 + 4, HN, 334, mat.sage); portalClassic();
  chandelierTiers(316, 200, HR, HR - 190);
}
// CL2 (PL, dworek): białe witryny z łukami i szprosami + złocone ramy portretów nad
function conceptCL2() {
  livingStd(); tvSouth();
  B(0, 1.5, 0, BEAM0, 0, HN, mat.wall2);
  for (const [a, b] of [[0, 120], [274, 394]]) { const m = (a + b) / 2; B(0, 46, a, b, 0, 88, mat.pp); for (const [p, q] of [[a + 2, m - .4], [m + .4, b - 2]]) { B(46, 47.5, p, q, 8, 86, mat.pp); frameRect(p + 6, q - 6, 47.5, 14, 80, 1.6, 1.2, mat.pp, 'y'); sph(49, p < m ? q - 5 : p + 5, 62, 1.6, mat.brass); }
    B(0, 48, a, b, 88, 92, mat.oak); B(0, 1.5, a, b, 92, 262, mat.greige); B(0, 40, a, a + 4, 92, 262, mat.pp); B(0, 40, b - 4, b, 92, 262, mat.pp);
    { const r = (b - a - 8) / 2; for (let i = 0; i < 40; i++) { const t0 = Math.PI * i / 40, t1 = Math.PI * (i + 1) / 40; const y0 = m - r * Math.cos(t0), y1 = m - r * Math.cos(t1), z0 = 262 - r + r * Math.sin(t0), z1 = 262 - r + r * Math.sin(t1); B(0, 40, Math.min(y0, y1) - .5, Math.max(y0, y1) + .5, Math.min(z0, z1), 262, mat.pp); } }
    for (const h of [140, 190]) { B(0, 36, a + 6, b - 6, h, h + 1.2, M({ color: '#e6efee', roughness: .05, transparent: true, opacity: .4 })); shelf('y', a + 8, b - 8, h + 1.2, 30, 44, 0, 1); } shelf('y', a + 8, b - 8, 92, 30, 44, 0, 1);
    for (const y of [a + 8 + (b - a - 16) / 3, a + 8 + 2 * (b - a - 16) / 3]) B(40, 41.5, y - .8, y + .8, 96, 230, mat.pp); for (const h of [140, 190]) B(40, 41.5, a + 8, b - 8, h - .8, h + .8, mat.pp);
    B(0, 50, a, b, 262, HN, mat.pp); }
  // środek: sekretarzyk/komoda dębowa + lustro w złotej ramie
  B(4, 50, 140, 254, 0, 86, mat.oakD); for (const h of [8, 34, 60]) { B(50, 51, 142, 252, h, h + 24, mat.oakD); for (const y of [175, 221]) B(51, 53, y - 4, y + 4, h + 10, h + 12, mat.brass); }
  B(2, 52, 138, 256, 86, 90, mat.oak); { const fr = new THREE.Mesh(new THREE.TorusGeometry(.42, .03, 12, 48), mat.gilt); fr.rotation.y = Math.PI / 2; fr.scale.set(1, 1.35, 1); fr.position.set(-.04, 1.65, 1.97); CUR.add(fr); }
  B(2.5, 3, 166, 228, 112, 218, mat.mirror); lamp(20, 155, 90); vaseFlowers(20, 240, 90, .6);
  portalClassic(); frieze();
  // nad wnęką: galeria portretów w złoconych ramach (salon dworski)
  giltFrame(103, 72, 365, 90, 115, paintTex(0)); giltFrame(103, 322, 365, 90, 115, paintTex(1)); giltFrame(103, 197, 350, 120, 160, paintTex(0));
  giltFrame(103, 197, 530, 70, 40, paintTex(1)); giltFrame(103, 72, 500, 70, 55, paintTex(0)); giltFrame(103, 322, 500, 70, 55, paintTex(1));
  flushBooks();
  chandelierTiers(316, 200, HR, HR - 190);
}
// CL3 (RU, неоклассика): pilastry z kapitelami, lustro antyczne we wnęce, owalny medalion nad
function conceptCL3() {
  livingStd(); tvSouth();
  B(0, 1.5, 0, BEAM0, 0, HN, mat.wall2); B(0, 2, 60, 334, 90, 270, M({ color: '#c9c6bb', metalness: .85, roughness: .18 })); for (const y of [128.5, 197, 265.5]) B(2, 3, y - 1, y + 1, 90, 270, mat.gilt); for (const h of [150, 210]) B(2, 3, 60, 334, h - 1, h + 1, mat.gilt);
  frameRect(56, 338, 2, 86, 274, 4, 2.4, mat.wall2, 'y');
  B(4, 46, 90, 304, 0, 80, mat.wall2); for (const [p, q] of [[92, 196], [198, 302]]) { B(46, 47.5, p, q, 6, 78, mat.wall2); frameRect(p + 8, q - 8, 47.5, 14, 70, 1.6, 1.2, mat.wall2, 'y'); }
  const ct = B(2, 50, 86, 308, 80, 85, mat.calac); uvScale(ct, .6); lamp(22, 110, 85); lamp(22, 284, 85); sph(22, 197, 98, 13, mat.cer);
  for (const y of [30, 364]) { cyl(30, y, 0, 3, 18, mat.black); cyl(30, y, 3, 40, 4, mat.calac, 24, 14); sph(30, y, 58, 18, mat.white, .9); }
  pilaster(102, -1, 30, 0, HN + 10, mat.wall2); pilaster(102, BEAM0 + 1, 30, 0, HN + 10, mat.wall2);
  B(100, 112, -10, BEAM0 + 10, HN + 10, HN + 40, mat.wall2); B(112, 116, -12, BEAM0 + 12, HN + 34, HN + 42, mat.wall2); B(112, 114, -10, BEAM0 + 10, HN + 12, HN + 16, mat.wall2);
  pilaster(102, -1, 26, HN + 42, HR - 30, mat.wall2); pilaster(102, BEAM0 + 1, 26, HN + 42, HR - 30, mat.wall2);
  { const ov = new THREE.Mesh(new THREE.TorusGeometry(.62, .03, 10, 72), mat.wall2); ov.rotation.y = Math.PI / 2; ov.scale.set(1, 1.5, 1); ov.position.set(-1.04, 4.6, 1.97); CUR.add(ov);
    const ov2 = new THREE.Mesh(new THREE.TorusGeometry(.52, .012, 8, 72), mat.gilt); ov2.rotation.y = Math.PI / 2; ov2.scale.set(1, 1.5, 1); ov2.position.set(-1.045, 4.6, 1.97); CUR.add(ov2); }
  for (const y of [70, 324]) { frameRect(y - 40, y + 40, 102, 350, 560, 2.6, 2, mat.wall2, 'y'); B(102, 105, y - 4, y + 4, 430, 456, mat.gilt); cyl(110, y, 456, 472, 6, mat.shade, 20, 8); }
  B(100, 112, -12, BEAM0 + 12, HR - 30, HR, mat.wall2);
  chandelierTiers(316, 200, HR, HR - 190);
}
// CL4 (RU): marmurowy portal z kluczem + witryna środkowa + medaliony
function conceptCL4() {
  livingStd(); tvSouth();
  B(0, 1.5, 0, BEAM0, 0, HN, mat.greige);
  for (const [a, b] of [[10, 110], [284, 384]]) { B(0, 40, a, b, 0, 85, mat.greige); B(40, 41, a + 2, b - 2, 6, 82, mat.greige); for (const h of [130, 180, 228]) { B(0, 34, a, b, h, h + 3, mat.calac); shelf('y', a + 3, b - 3, h + 3, 30, 42, 0, 1); } B(0, 42, a, b, 85, 89, mat.calac); }
  B(0, 1.5, 130, 264, 0, 240, mat.greige); B(0, 45, 130, 135, 0, 240, mat.pp); B(0, 45, 259, 264, 0, 240, mat.pp); B(0, 45, 130, 264, 0, 18, mat.pp); B(0, 45, 130, 264, 234, 240, mat.pp);
  for (const [p, q] of [[135, 196.5], [197.5, 259]]) { B(43, 45, p, q, 18, 22, mat.pp); B(43, 45, p, q, 230, 234, mat.pp); B(43, 45, p, p + 4, 18, 234, mat.pp); B(43, 45, q - 4, q, 18, 234, mat.pp); B(43.8, 44.2, p + 4, q - 4, 22, 230, mat.glass); B(45, 46.5, p < 196 ? q - 8 : p + 6, p < 196 ? q - 6 : p + 8, 110, 150, mat.brass); }
  for (const h of [70, 120, 170]) { B(4, 40, 134, 260, h, h + 1, M({ color: '#e6efee', roughness: .05, transparent: true, opacity: .4 })); sph(20, 160, h + 10, 8, mat.cer); cyl(20, 230, h + 1, h + 24, 6, mat.white, 16); }
  ledStrip(2, 40, 134, 260, 232, 234); archCut(197, 134, 240, HN - 2, 1.5, 1.5, mat.pp);
  // portal marmurowy
  for (const y0 of [-8, BEAM0 - 18]) { const s = B(102, 116, y0, y0 + 26, 0, HN + 28, mat.calac); uvScale(s, .6); }
  const lt = B(102, 116, -8, BEAM0 + 8, HN, HN + 28, mat.calac); uvScale(lt, .6); B(116, 122, 182, 212, HN - 6, HN + 34, mat.calac);
  B(102, 120, -12, BEAM0 + 12, HN + 28, HN + 36, mat.calac); frieze();
  // nad: łukowa płycina środkowa + dwa okrągłe medaliony
  const r = 70; frameRect(197 - r, 197 + r, 102, 350, HR - 30 - r, 3, 2.2, mat.wall2, 'y');
  for (let i = 0; i < 60; i++) { const a0 = Math.PI * i / 60, a1 = Math.PI * (i + 1) / 60; const y0 = 197 - r * Math.cos(a0), y1 = 197 - r * Math.cos(a1), z0 = HR - 30 - r + r * Math.sin(a0), z1 = HR - 30 - r + r * Math.sin(a1); B(102, 104.2, Math.min(y0, y1) - .8, Math.max(y0, y1) + .8, Math.min(z0, z1) - .8, Math.max(z0, z1) + .8, mat.wall2); }
  giltFrame(103, 197, 380, 90, 120, paintTex(1)); flushBooks();
  for (const y of [60, 334]) { const t = new THREE.Mesh(new THREE.TorusGeometry(.36, .025, 10, 64), mat.wall2); t.rotation.y = Math.PI / 2; t.position.set(-1.04, 4.4, y / 100); CUR.add(t); const t2 = new THREE.Mesh(new THREE.TorusGeometry(.28, .01, 8, 64), mat.gilt); t2.rotation.y = Math.PI / 2; t2.position.set(-1.045, 4.4, y / 100); CUR.add(t2); }
  chandelierTiers(316, 200, HR, HR - 190);
}
// CL5 (US): biblioteka w kolorze „Hague Blue”, ława z kratą, drabina, mosiężne kinkiety – kolor do sufitu
function conceptCL5() {
  livingStd(); tvSouth();
  B(0, 1.5, 0, BEAM0, 0, HN, mat.navy); B(0, NICHE, 0, 1.5, 0, HN, mat.navy); B(0, NICHE, BEAM0 - 1.5, BEAM0, 0, HN, mat.navy); B(0, NICHE, 0, BEAM0, HN - 1.5, HN, mat.navy, { cast: false });
  for (const [a, b] of [[0, 63.5], [63.5, 127], [267, 330.5], [330.5, 394]]) { B(0, 45, a, b, 0, 88, mat.navy); const m = (a + b) / 2; for (const [p, q] of [[a + 2, m - .4], [m + .4, b - 2]]) { B(45, 46.5, p, q, 8, 86, mat.navy); frameRect(p + 5, q - 5, 46.5, 13, 80, 1.6, 1.2, mat.navy, 'y'); sph(48, p < m ? q - 4 : p + 4, 64, 1.5, mat.brass); }
    B(0, 36, a, a + 2, 88, HN, mat.navy); B(0, 36, b - 2, b, 88, HN, mat.navy); for (const h of [88, 136, 184, 232]) { B(0, 34, a + 2, b - 2, h, h + 2.5, mat.navy); shelf('y', a + 3, b - 3, h + 2.5, 30, 42, 0, 1); }
    B(30, 38, m - 14, m + 14, 274, 277, mat.brass); const s = new THREE.SpotLight('#ffd49a', 2.4, 2.4, 1, .8, 2); s.position.set(-.34, 2.72, m / 100); s.target.position.set(-.1, 1.4, m / 100); CUR.add(s, s.target); }
  B(0, 56, 127, 267, 0, 42, mat.navy); B(0, 58, 127, 267, 42, 54, mat.plaid, { r: 4 }); for (const [y, m] of [[150, mat.linen], [195, mat.plaid], [240, mat.boucle]]) B(6, 22, y - 22, y + 22, 54, 92, m, { r: 8 });
  for (const h of [180, 232]) { B(0, 30, 127, 267, h, h + 2.5, mat.navy); shelf('y', 128, 266, h + 2.5, 28, 42, 0, 1); } giltFrame(1.5, 197, 118, 70, 52, paintTex(1));
  rodBetween([42, 2, 252], [42, 392, 252], 1, mat.brass); for (const yy of [342, 382]) rodBetween([78, yy, 0], [44, yy, 254], 1.8, mat.oak); for (let k = 1; k < 9; k++) { const t = k / 9, x = 78 + (44 - 78) * t; rodBetween([x, 342, t * 254], [x, 382, t * 254], 1.3, mat.oak); }
  flushBooks();
  // kolor „zalewa” też antresolę: panele + duży obraz w złotej ramie
  B(100, 108, -4, BEAM0 + 4, HN, 334, mat.navy); B(108, 112, -4, BEAM0 + 4, 326, 334, mat.navy); shakerWall(103, -2, BEAM0 + 2, 336, HR - 12, mat.navy, 4, 1, 2, 14); B(100, 110, -4, BEAM0 + 4, HR - 12, HR, mat.navy);
  giltFrame(104.5, 197, 370, 160, 170, paintTex(1)); B(104, 108, 147, 247, 552, 555, mat.brass);
  B(100, 110, -4, 12, 0, HN, mat.navy); B(100, 110, BEAM0 - 12, BEAM0 + 4, 0, HN, mat.navy);
  chandelierTiers(316, 200, HR, HR - 190);
}
// CL6 (US, grandmillennial): tapeta chinoiserie do sufitu + ława z plisowaną falbaną + białe listwy
function conceptCL6() {
  livingStd(); tvSouth();
  const cw = B(0, 1.5, 0, BEAM0, 0, HN, mat.chino); B(0, NICHE, 0, 1.5, 0, HN, mat.chino); B(0, NICHE, BEAM0 - 1.5, BEAM0, 0, HN, mat.chino);
  B(1.5, 3, 0, BEAM0, 0, 90, mat.pp); frameRect(10, 384, 3, 12, 80, 2, 1.2, mat.pp, 'y'); B(1.5, 4.5, 0, BEAM0, 88, 92, mat.pp);
  B(0, 70, 30, 364, 0, 44, M({ color: '#d9e1d6', roughness: 1 })); for (let y = 30; y < 364; y += 6) B(70, 71.5, y, y + 4, 2, 30, M({ color: '#cfd8cb', roughness: 1 }));
  B(0, 72, 30, 364, 44, 56, mat.linen, { r: 5 }); for (const [y, c] of [[60, '#e3b9b2'], [110, '#f2ede4'], [170, '#b9c9c2'], [230, '#f2ede4'], [290, '#e3b9b2'], [335, '#b9c9c2']]) B(6, 22, y - 25, y + 25, 56, 100, M({ color: c, roughness: 1 }), { r: 8 });
  for (const y of [30, 364]) { B(0, 3, y - 5, y + 5, 150, 162, mat.brass); cyl(14, y, 160, 178, 9, M({ color: '#f1e3df', roughness: 1, side: THREE.DoubleSide }), 20, 12); }
  giltFrame(3, 197, 140, 90, 110, paintTex(1));
  B(100, 110, -4, BEAM0 + 4, HN - 2, HN + 16, mat.pp); B(100, 108, -4, 12, 0, HN, mat.pp); B(100, 108, BEAM0 - 12, BEAM0 + 4, 0, HN, mat.pp);
  const cu = B(102, 103.5, -2, BEAM0 + 2, HN + 16, HR - 14, mat.chino); B(100, 110, -4, BEAM0 + 4, HR - 14, HR, mat.pp);
  chandelierTiers(316, 200, HR, HR - 190);
}

// ======================= SERIA „POLSKI PINTEREST” =======================
T.nero = cv(1024, 1024, (g, w, h) => { g.fillStyle = '#1e1d1c'; g.fillRect(0, 0, w, h); for (let k = 0; k < 10; k++) { g.strokeStyle = `rgba(${pick(['210,180,120', '230,225,215', '190,160,110'])},${.35 + rnd() * .4})`; g.lineWidth = .8 + rnd() * 2.5;
  g.beginPath(); let x = rnd() * w, y = 0; g.moveTo(x, y); for (let i = 0; i < 14; i++) { x += (rnd() - .5) * 120; y += 80; g.lineTo(x, y); } g.stroke(); } });
T.brick = cv(1024, 1024, (g, w, h) => { g.fillStyle = '#d8d2c8'; g.fillRect(0, 0, w, h); const bw = 128, bh = 40; for (let r = 0; r * bh < h; r++) for (let c = -1; c * bw < w; c++) { const x = c * bw + (r % 2 ? bw / 2 : 0), y = r * bh; const v = 225 + rnd() * 25 | 0;
  g.fillStyle = `rgb(${v},${v - 6 - rnd() * 14 | 0},${v - 14 - rnd() * 20 | 0})`; g.fillRect(x + 4, y + 4, bw - 8, bh - 8); if (rnd() < .45) { g.fillStyle = `rgba(${150 + rnd() * 40 | 0},${90 + rnd() * 30 | 0},${70 + rnd() * 20 | 0},${.2 + rnd() * .3})`; g.fillRect(x + 4 + rnd() * 60, y + 4, 30 + rnd() * 60, bh - 8); } } });
T.brick.wrapS = T.brick.wrapT = THREE.RepeatWrapping;
T.micro = cv(1024, 1024, (g, w, h) => { noiseFill(g, w, h, '#d6cbbb', .07, 30000, 6); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${pick(['200,188,170', '225,215,200'])},.25)`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 60 + rnd() * 160, 30 + rnd() * 90, rnd() * 3, 0, 7); g.fill(); } });
T.micro.wrapS = T.micro.wrapT = THREE.RepeatWrapping;
T.mural = cv(1024, 1400, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e9dfcf'); gr.addColorStop(1, '#d9c9b0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let t = 0; t < 7; t++) { const x0 = 80 + t * 140 + rnd() * 40; g.strokeStyle = 'rgba(110,90,65,.75)'; g.lineWidth = 6 + rnd() * 6; g.beginPath(); g.moveTo(x0, h); let x = x0, y = h; for (let i = 0; i < 9; i++) { x += (rnd() - .5) * 70; y -= 120 + rnd() * 60; g.lineTo(x, y); } g.stroke();
    for (let k = 0; k < 120; k++) { const yy = h - rnd() * h * .95, xx = x0 + (rnd() - .5) * 260; g.save(); g.translate(xx, yy); g.rotate(rnd() * 6.28); g.fillStyle = pick(['rgba(120,135,100,.7)', 'rgba(150,160,120,.65)', 'rgba(95,105,80,.7)', 'rgba(185,170,140,.6)', 'rgba(200,150,140,.5)']); g.beginPath(); g.ellipse(0, 0, 18 + rnd() * 26, 7 + rnd() * 9, 0, 0, 7); g.fill(); g.restore(); } }
  for (let i = 0; i < 9; i++) { const x = rnd() * w, y = rnd() * h * .7; g.fillStyle = 'rgba(90,80,70,.55)'; g.beginPath(); g.ellipse(x, y, 10, 4, .4, 0, 7); g.ellipse(x + 12, y - 2, 10, 4, -.4, 0, 7); g.fill(); } });
Object.assign(mat, { nero: M({ map: T.nero, roughness: .1, name: 'nero' }), brick: M({ map: T.brick, roughness: .95, name: 'brick' }), micro: M({ map: T.micro, roughness: .75, name: 'micro' }), mural: M({ map: T.mural, roughness: .9, name: 'mural' }) });
function lamelleAbove(y0 = -2, y1 = BEAM0 + 2, h0 = HN, h1 = HR) { B(100, 102, y0, y1, h0, h1, M({ color: '#2b2622', roughness: .9 })); for (let y = y0; y < y1 - 2; y += 7) B(102, 104.5, y, y + 4.4, h0, h1, mat.oak, { cast: false }); }
function wallFace(m, uv = .5, h0 = HN, h1 = HR) { const f = B(102, 103.5, -2, BEAM0 + 2, h0, h1, m); f.geometry.attributes.uv && uvScale(f, uv); return f; }
// P1: ciemny spiek za TV + dębowa szafka + lamele do sufitu
function conceptP1() {
  livingStd(); tvSouth();
  const bk = B(0, 1.5, 0, BEAM0, 0, HN, mat.nero); uvScale(bk, .35); B(0, NICHE, 0, 1.5, 0, HN, mat.oak); B(0, NICHE, BEAM0 - 1.5, BEAM0, 0, HN, mat.oak);
  for (let x = 1.5; x < NICHE; x += 7) B(x, x + 4.4, 0, BEAM0, HN - 3, HN, mat.oak, { cast: false });
  B(1.5, 5, 102, 292, 100, 208, mat.blackG); B(5, 5.3, 104, 290, 102, 206, mat.screen); ledStrip(1.5, 2.5, 100, 294, 98, 100);
  B(1.5, 45, 20, 374, 22, 62, mat.oak); for (let y = 20; y < 374; y += 3.2) B(45, 46.2, y, y + 2.2, 24, 60, mat.oak, { cast: false }); ledStrip(2, 44, 22, 372, 20, 22);
  B(1.5, 38, 20, 374, 62, 63, mat.oak); sph(18, 60, 74, 11, mat.cer); cyl(18, 340, 63, 95, 6, mat.black, 24, 9); vaseFlowers(20, 320, 63, .5);
  ledStrip(96, 98, 4, BEAM0 - 4, HN - 5, HN - 3);
  lamelleAbove(); chandelierTiers(316, 200, HR, HR - 190);
}
// P2: panele tapicerowane + wbudowana sofa, mikrocement na antresoli, lampy na linkach
function conceptP2() {
  livingStd(); tvSouth();
  const mb = B(0, 1.5, 0, BEAM0, 0, HN, mat.micro); uvScale(mb, .4); B(0, NICHE, 0, 1.5, 0, HN, mat.micro); B(0, NICHE, BEAM0 - 1.5, BEAM0, 0, HN, mat.micro); B(0, NICHE, 0, BEAM0, HN - 1.5, HN, mat.micro, { cast: false });
  for (let h = 50; h < 250; h += 33) B(1.5, 9, 30, 364, h, h + 32, mat.boucle, { r: 6 });
  B(4, 92, 20, 374, 0, 10, mat.black); B(0, 92, 20, 374, 10, 42, mat.oak); B(0, 94, 20, 374, 42, 54, mat.boucle, { r: 5 });
  for (const [y, c] of [[60, '#cdb89c'], [120, '#f0ebe2'], [250, '#a88f74'], [320, '#f0ebe2']]) B(10, 26, y - 25, y + 25, 54, 96, M({ color: c, roughness: 1 }), { r: 8 });
  B(30, 85, 290, 350, 54, 60, M({ color: '#8b7058', roughness: 1 }), { r: 3 });
  for (const y of [70, 324]) { B(1.5, 3, y - 4, y + 4, 250, 262, mat.brass); rodBetween([3, y, 256], [20, y, 256], .6, mat.brass); cyl(20, y, 236, 256, 7, mat.shade, 24, 10); const l = new THREE.PointLight('#ffd6a0', 1.6, 2.5, 2); l.position.set(-.2, 2.4, y / 100); CUR.add(l); }
  wallFace(mat.micro, .35);
  for (const y of [100, 294]) { cyl(160, y, 300, HR, .3, mat.black, 6); cyl(160, y, 270, 300, 22, mat.shade, 32, 28); const l = new THREE.PointLight('#ffdcae', 2, 5, 2); l.position.set(-1.6, 2.8, y / 100); CUR.add(l); }
  ledStrip(96, 98, 4, BEAM0 - 4, HN - 5, HN - 3); chandelierTiers(316, 200, HR, HR - 190);
}
// P3: bielona cegła rozbiórkowa do sufitu + czarne stalowe półki + dębowa ława
function conceptP3() {
  livingStd(); tvSouth();
  const bb = B(0, 2, 0, BEAM0, 0, HN, mat.brick); uvScale(bb, .7); const be = B(0, NICHE, 0, 2, 0, HN, mat.brick); uvScale(be, .7); const bf = B(0, NICHE, BEAM0 - 2, BEAM0, 0, HN, mat.brick); uvScale(bf, .7);
  B(0, NICHE, 0, BEAM0, HN - 2, HN, mat.wall2, { cast: false });
  for (const h of [120, 175, 230]) { B(2, 34, 30, 364, h, h + 3, mat.oak); for (const y of [40, 197, 354]) B(2, 34, y - 1, y + 1, h - 8, h, mat.black); shelf('y', 34, 360, h + 3, 30, 46, 2, 1); }
  B(0, 50, 10, 384, 38, 46, mat.oak); for (const y of [20, 197, 374]) B(4, 46, y - 2, y + 2, 0, 38, mat.black);
  for (let i = 0; i < 4; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .42, 12), M({ color: '#7a5a3e', roughness: 1 })); lg.rotation.z = Math.PI / 2; lg.position.set(-.24, .1 + (i % 2) * .14, (60 + i * 18) / 100); CUR.add(lg); }
  B(4, 48, 250, 330, 46, 56, mat.linen, { r: 4 }); sph(18, 120, 58, 11, mat.cer);
  const wb = wallFace(mat.brick, .7); flushBooks();
  for (const y of [40, 354]) { B(103.5, 106, y - 3, y + 3, 380, 420, mat.black); cyl(112, y, 405, 425, 7, mat.black, 16, 9); }
  ledStrip(96, 98, 4, BEAM0 - 4, HN - 5, HN - 3); chandelierTiers(316, 200, HR, HR - 190);
}
// P4: fototapeta botaniczna na antresoli + ryflowane dębowe fronty i ława we wnęce
function conceptP4() {
  livingStd(); tvSouth();
  B(0, 1.5, 0, BEAM0, 0, HN, mat.greige); B(0, NICHE, 0, 1.5, 0, HN, mat.greige); B(0, NICHE, BEAM0 - 1.5, BEAM0, 0, HN, mat.greige);
  const mw = B(0, 1.8, 0, BEAM0, 95, HN, mat.mural); { const uv = mw.geometry.attributes.uv; }
  for (const [a, b] of [[0, 120], [274, 394]]) { B(0, 48, a, b, 0, 90, mat.oak); for (let y = a; y < b; y += 3.4) B(48, 49.4, y, y + 2.4, 4, 88, mat.oak, { cast: false }); B(0, 50, a, b, 90, 93, mat.trav); }
  B(0, 55, 120, 274, 0, 42, mat.oak); for (let y = 120; y < 274; y += 3.4) B(55, 56.4, y, y + 2.4, 2, 40, mat.oak, { cast: false }); B(0, 56, 120, 274, 42, 52, mat.boucle, { r: 5 });
  B(4, 20, 135, 180, 52, 92, M({ color: '#c9b79c', roughness: 1 }), { r: 8 }); B(4, 20, 215, 260, 52, 90, mat.boucle, { r: 8 });
  sph(20, 40, 102, 12, mat.cer); cyl(20, 90, 93, 125, 6, mat.black, 24, 9); vaseFlowers(20, 330, 93, .55); lamp(22, 370, 93);
  const mu = B(102, 103.5, -2, BEAM0 + 2, HN + 10, HR, mat.mural); B(102, 105, -2, BEAM0 + 2, HN, HN + 10, mat.wall2);
  ledStrip(96, 98, 4, BEAM0 - 4, HN - 5, HN - 3); chandelierTiers(316, 200, HR, HR - 190);
}

// ======================= SERIA „NOWOCZESNA KLASYKA” (ru-pinterest) =======================
T.trav = cv(1024, 1024, (g, w, h) => { g.fillStyle = '#d8c7ad'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(${pick(['190,170,140', '225,210,188', '205,188,160'])},${.15 + rnd() * .3})`; g.fillRect(0, y, w, 1 + rnd() * 3); }
  for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(150,125,95,${.2 + rnd() * .4})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 2 + rnd() * 9, .6 + rnd() * 1.6, 0, 0, 7); g.fill(); } });
T.trav.wrapS = T.trav.wrapT = THREE.RepeatWrapping;
T.calac = cv(1024, 1024, (g, w, h) => { g.fillStyle = '#f3efe9'; g.fillRect(0, 0, w, h); for (let k = 0; k < 14; k++) { const col = pick(['176,150,120', '150,135,120', '200,180,150']); g.strokeStyle = `rgba(${col},${.25 + rnd() * .35})`; g.lineWidth = 1.5 + rnd() * 5;
  g.beginPath(); let x = rnd() * w * .4, y = rnd() * h; g.moveTo(x, y); for (let i = 0; i < 16; i++) { x += 30 + rnd() * 50; y += (rnd() - .5) * 90; g.lineTo(x, y); } g.stroke(); g.lineWidth *= .3; g.stroke(); } });
mat.trav = M({ map: T.trav, roughness: .55 }); mat.calac = M({ map: T.calac, roughness: .12 }); mat.trav.name = 'trav'; mat.calac.name = 'calac';
mat.greige = M({ color: '#d9cdbb', roughness: .8 }); mat.greige.name = 'greige';
mat.ledw = new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffe2b0', emissiveIntensity: 2.2, name: 'led' });
function ledStrip(x0, x1, y0, y1, h0, h1) { B(x0, x1, y0, y1, h0, h1, mat.ledw, { cast: false }); }
// boazeria (płyciny) na antresoli: ściana x=102, h 290..HR
function frieze() { // pełny fryz nad wnęką: łączy opaskę wnęki z boazerią (bez szczelin)
  B(100, 108, -4, BEAM0 + 4, HN, 334, mat.wall2);
  B(108, 112, -4, BEAM0 + 4, 326, 334, mat.wall2); B(112, 115, -4, BEAM0 + 4, 330, 334, mat.wall2); B(108, 110, -4, BEAM0 + 4, 318, 322, mat.wall2);
}
function boiserieAbove(cols = [[18, 120], [140, 254], [274, 376]], rows = [[350, 462], [478, HR - 36]], brass = true) {
  frieze();
  for (const [a, b] of cols) for (const [h0, h1] of rows) { frameRect(a, b, 102, h0, h1, 3, 2.2, mat.wall2, 'y'); frameRect(a + 9, b - 9, 102, h0 + 9, h1 - 9, 1.6, 1.4, mat.wall2, 'y');
    if (brass) { B(102, 103.2, a + 14, b - 14, h0 + 14, h0 + 14.6, mat.brass); B(102, 103.2, a + 14, b - 14, h1 - 14.6, h1 - 14, mat.brass); B(102, 103.2, a + 14, a + 14.6, h0 + 14, h1 - 14, mat.brass); B(102, 103.2, b - 14.6, b - 14, h0 + 14, h1 - 14, mat.brass); } }
}
function portalClassic() { // szeroka opaska z profilem wokół wnęki
  B(102, 110, -2, 14, 0, HN + 16, mat.wall2); B(102, 110, BEAM0 - 14, BEAM0 + 2, 0, HN + 16, mat.wall2); B(102, 110, -2, BEAM0 + 2, HN - 2, HN + 16, mat.wall2);
  B(110, 113, 2, 10, 0, HN + 12, mat.wall2); B(110, 113, BEAM0 - 10, BEAM0 - 2, 0, HN + 12, mat.wall2); B(110, 113, 2, BEAM0 - 2, HN + 4, HN + 12, mat.wall2);
  B(102, 116, -6, 18, 0, 14, mat.wall2); B(102, 116, BEAM0 - 18, BEAM0 + 6, 0, 14, mat.wall2);
}
function chandelierTiers(cx, cy, hTop, hBot) { // kaskadowa, czarno-mosiężna
  cyl(cx, cy, hBot, hTop, .8, mat.black, 8);
  for (const [hh, R, n] of [[hBot + 70, 38, 6], [hBot + 25, 62, 10]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(R / 100, .012, 8, 64), mat.black); t.rotation.x = Math.PI / 2; t.position.set(-cx / 100, hh / 100, cy / 100); CUR.add(t);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R; cyl(px, py, hh, hh + 4, 2, mat.brass); cyl(px, py, hh + 4, hh + 22, 1.6, mat.glow, 12); } }
  const l = new THREE.PointLight('#ffe0b0', 3, 7, 2); l.position.set(-cx / 100, (hBot + 50) / 100, cy / 100); CUR.add(l);
}
// R1: marmurowa nisza TV z podświetleniem + boazeria z mosiężną wstawką
function conceptR1() {
  livingStd(); southGallery();
  const bk = B(0, 1.5, 0, BEAM0, 0, HN, mat.calac); uvScale(bk, .45); const en = B(0, NICHE, 0, 1.5, 0, HN, mat.calac); uvScale(en, .45); B(0, NICHE, BEAM0 - 1.5, BEAM0, 0, HN, mat.calac);
  B(0, NICHE, 0, BEAM0, HN - 1.5, HN, mat.wall2, { cast: false });
  ledStrip(96, 98, 4, 6, 4, HN - 4); ledStrip(96, 98, BEAM0 - 6, BEAM0 - 4, 4, HN - 4); ledStrip(4, 98, 4, BEAM0 - 4, HN - 6, HN - 4);
  // TV + konsola podwieszana
  B(1.5, 5, 102, 292, 95, 203, mat.blackG); B(5, 5.3, 104, 290, 97, 201, mat.screen);
  B(1.5, 46, 60, 334, 28, 58, mat.black); ledStrip(2, 44, 62, 332, 26, 28); B(46, 46.4, 60, 334, 30, 56, mat.blackG);
  for (const y of [151, 243]) B(46, 46.3, y - .3, y + .3, 30, 56, mat.blackG);
  sph(20, 90, 70, 12, mat.cer, 1.1); cyl(22, 300, 58, 92, 7, mat.black, 24, 10); vaseFlowers(24, 320, 58, .5);
  for (const y of [40, 354]) { cyl(30, y, 0, 3, 18, mat.black); cyl(30, y, 3, 36, 4, mat.trav, 24, 14); sph(30, y, 52, 16, mat.trav, .9); }
  portalClassic(); boiserieAbove();
  chandelierTiers(316, 200, HR, HR - 190);
}
// R2: trzy podświetlane łukowe nisze + łukowe płyciny nad
function archCut(cx, w, h0, h1, depthX0, depthX1, m) { // wnęka łukowa: tył + łuk z segmentów
  const r = w / 2; const n = 14;
  B(depthX0 - 1.5, depthX0, cx - r, cx + r, h0, h1 - r, m);
  for (let i = 0; i < n; i++) { const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n; const y0 = cx - r * Math.cos(a0), y1 = cx - r * Math.cos(a1), z0 = h1 - r + r * Math.sin(a0), z1 = h1 - r + r * Math.sin(a1);
    B(depthX0 - 1.5, depthX0, Math.min(y0, y1), Math.max(y0, y1), h1 - r, Math.max(z0, z1), m); }
}
function conceptR2() {
  livingStd(); southGallery();
  // fałszywa ściana z tynku (gł. 45) z trzema łukami
  const FX = 45; const archs = [[70, 96, 12, 210], [197, 170, 0, 262], [324, 96, 12, 210]];
  // wypełnienie ściany wokół łuków (pionowe pasy + nadproża)
  B(0, FX, 0, 20, 0, HN, mat.plaster); B(0, FX, 118, 110, 0, HN, mat.plaster); B(0, FX, 284, 276, 0, HN, mat.plaster); B(0, FX, 374, BEAM0, 0, HN, mat.plaster);
  B(0, FX, 18, 112, 0, 12, mat.plaster); B(0, FX, 276, 376, 0, 12, mat.plaster);
  for (const [cx, w, h0, h1] of archs) { const r = w / 2;
    B(0, FX, cx - r, cx + r, h1, HN, mat.plaster);
    const n = 60; for (let i = 0; i < n; i++) { const a = Math.PI * (i + .5) / n; const yy = cx - r * Math.cos(a), zz = h1 - r + r * Math.sin(a); const ww = Math.PI * r / n + 1; B(0, FX, yy - ww / 2, yy + ww / 2, zz, h1, mat.plaster); }
    B(0, 2, cx - r, cx + r, h0, h1, mat.greige); ledStrip(2, 4, cx - r + 2, cx + r - 2, h1 - r - 2, h1 - r); }
  // dekoracje w bocznych łukach (szklane półki) + ława w środkowym
  for (const cx of [70, 324]) for (const h of [70, 120, 165]) { B(0, 38, cx - 44, cx + 44, h, h + 1.2, M({ color: '#e6efee', roughness: .05, transparent: true, opacity: .4 })); sph(18, cx - 15, h + 9, 8, mat.cer); cyl(18, cx + 18, h + 1, h + 22, 5, mat.trav, 16); }
  for (const cx of [70, 324]) { B(0, 45, cx - 48, cx + 48, 12, 60, mat.greige); B(45, 45.8, cx - 46, cx + 46, 14, 58, mat.greige); sph(46.5, cx - 4, 40, 1.4, mat.brass); sph(46.5, cx + 4, 40, 1.4, mat.brass); }
  B(0, 60, 115, 279, 0, 42, mat.oak); B(0, 60, 115, 279, 42, 52, mat.boucle, { r: 5 }); B(0, 12, 120, 274, 52, 110, mat.boucle, { r: 5 });
  B(14, 30, 130, 176, 52, 92, M({ color: '#bfa98d', roughness: 1 }), { r: 8 }); B(14, 30, 218, 264, 52, 90, mat.boucle, { r: 8 });
  B(0, 2, 167, 227, 130, 210, mat.black); B(2, 2.4, 172, 222, 135, 205, M({ map: T.leafart, roughness: .8 }));
  portalClassic();
  // nad wnęką: trzy płyciny z łukiem u góry + kinkiety
  frieze();
  for (const [cx, w] of [[70, 96], [197, 150], [324, 96]]) { const r = w / 2, h0 = 352, h1 = HR - 36;
    frameRect(cx - r, cx + r, 102, h0, h1 - r, 3, 2.2, mat.wall2, 'y'); const n = 60; for (let i = 0; i < n; i++) { const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n;
      const y0 = cx - r * Math.cos(a0), y1 = cx - r * Math.cos(a1), z0 = h1 - r + r * Math.sin(a0), z1 = h1 - r + r * Math.sin(a1); B(102, 104.2, Math.min(y0, y1) - .8, Math.max(y0, y1) + .8, Math.min(z0, z1) - .8, Math.max(z0, z1) + .8, mat.wall2); } }
  
  for (const y of [133, 261]) { B(102, 104, y - 4, y + 4, 420, 445, mat.brass); const sh = cyl(112, y, 445, 465, 7, mat.shade, 24, 9); sh.position.x = -1.12; }
  chandelierTiers(316, 200, HR, HR - 190);
}
// R3: trawertyn + rejki (fluted) do sufitu
function conceptR3() {
  livingStd(); southGallery();
  const tb = B(0, 2, 0, BEAM0, 0, HN, mat.trav); uvScale(tb, .5); const te = B(0, NICHE, 0, 2, 0, HN, mat.trav); uvScale(te, .5); B(0, NICHE, BEAM0 - 2, BEAM0, 0, HN, mat.trav);
  B(0, NICHE, 0, BEAM0, HN - 2, HN, mat.trav, { cast: false }); ledStrip(2, 4, 4, BEAM0 - 4, HN - 8, HN - 6);
  // ława trawertynowa podwieszana na całą długość + półka
  const bn = B(0, 50, 2, BEAM0 - 2, 34, 44, mat.trav); uvScale(bn, .6); ledStrip(2, 48, 4, BEAM0 - 4, 32, 34);
  const sh = B(0, 26, 40, 354, 150, 156, mat.trav); uvScale(sh, .6); ledStrip(2, 24, 42, 352, 148, 150);
  B(4, 48, 30, 180, 44, 56, mat.boucle, { r: 4 }); B(4, 20, 40, 90, 56, 96, M({ color: '#cdb89c', roughness: 1 }), { r: 8 });
  sph(16, 260, 58, 14, mat.cer); cyl(14, 320, 44, 90, 8, mat.black, 24, 11); cyl(14, 120, 156, 186, 6, mat.cer, 24, 9); sph(14, 200, 168, 11, mat.white); cyl(12, 280, 156, 176, 9, mat.trav, 24, 7);
  B(0, 2, 140, 254, 190, 270, mat.black); B(2, 2.4, 146, 248, 196, 264, M({ map: paintTex(1), roughness: .6 }));
  // rejki (fluted) na antresoli – pełna szerokość, od 2,9 do sufitu
  B(100, 102, -2, BEAM0 + 2, HN, HR, mat.greige);
  for (let y = -2; y < BEAM0 + 2; y += 4.2) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, (HR - HN) / 100, 10, 1, false, 0, Math.PI), mat.greige); c.rotation.y = Math.PI / 2; c.position.set(-1.02, (HN + HR) / 200, (y + 2.1) / 100); c.castShadow = c.receiveShadow = true; CUR.add(c); }
  ledStrip(102, 106, -2, BEAM0 + 2, HN, HN + 1.5);
  // pionowe kinkiety
  for (const y of [-30, BEAM0 + 30]) { }
  chandelierTiers(316, 200, HR, HR - 190);
}
// R4: klasyczna biblioteka-witryna symetryczna + gzyms i boazeria nad
function conceptR4() {
  livingStd(); southGallery();
  const towers = [[0, 92], [302, 394]];
  for (const [a, b] of towers) { B(0, 48, a, b, 0, 10, mat.wall2); B(0, 48, a, b, 10, 90, mat.cream); const m = (a + b) / 2;
    for (const [p, q] of [[a + 2, m - .4], [m + .4, b - 2]]) { B(48, 49.5, p, q, 12, 88, mat.cream); frameRect(p + 6, q - 6, 49.5, 18, 82, 1.4, 1.2, mat.cream, 'y'); sph(51, p < m ? q - 5 : p + 5, 70, 1.6, mat.brass); }
    B(0, 50, a, b, 90, 94, mat.trav); B(0, 40, a, b, 94, 270, mat.cream); B(0, 1, a + 3, b - 3, 96, 266, mat.greige);
    for (const h of [140, 185, 228]) { B(0, 36, a + 3, b - 3, h, h + 1.2, M({ color: '#e6efee', roughness: .05, transparent: true, opacity: .4 })); shelf('y', a + 5, b - 5, h + 1.2, 30, 40, 0, 1); }
    shelf('y', a + 5, b - 5, 94, 30, 44, 0, 1);
    for (const [p, q] of [[a + 2, m - .4], [m + .4, b - 2]]) { B(40, 42, p, q, 94, 98, mat.cream); B(40, 42, p, q, 266, 270, mat.cream); B(40, 42, p, p + 4, 94, 270, mat.cream); B(40, 42, q - 4, q, 94, 270, mat.cream); B(40.6, 41, p + 4, q - 4, 98, 266, mat.glass); }
    B(0, 52, a - 1, b + 1, 270, 290, mat.cream); ledStrip(2, 36, a + 4, b - 4, 266, 267.5); }
  // środek: konsola + duże lustro w ramie
  B(0, 45, 100, 294, 0, 82, mat.black); B(0, 47, 98, 296, 82, 86, mat.trav); for (const y of [148.5, 197, 245.5]) B(45, 45.3, y - .3, y + .3, 4, 80, mat.blackG);
  B(0, 3, 117, 277, 105, 262, mat.brass); B(3, 3.4, 121, 273, 109, 258, mat.mirror);
  lamp(18, 125, 86); lamp(18, 269, 86); vaseFlowers(20, 197, 86, .7);
  portalClassic(); boiserieAbove([[18, 120], [140, 254], [274, 376]], [[350, HR - 36]], true);
  for (const y of [69, 197, 325]) { B(102, 104, y - 18, y + 18, HR - 30, HR - 26, mat.brass); }
  chandelierTiers(316, 200, HR, HR - 190);
}
function southGallery() { // ściana TV/płd. bez zmian (TV na płd.) – jak w koncepcji 1
  tvSouth();
}

// ---------------- wspólne: ściana TV + strefa wypoczynkowa ----------------
function tvSouth() {
  B(196, 436, 0, 45, 0, 58, mat.black); for (const x of [276, 356]) B(x - .3, x + .3, 45, 45.3, 4, 54, mat.blackG);
  B(233, 399, 3, 6, 95, 190, mat.blackG); B(235, 397, 6, 6.3, 97, 188, mat.screen);
  lamp(225, 22, 58); sph(410, 22, 64, 6, mat.cer); B(380, 420, 10, 34, 58, 64, mat.oak);
  for (const x of [166, 467]) { photoFrame(x, 232, 48, 58, 0); photoFrame(x, 164, 48, 58, x > 300 ? 2 : 1); photoFrame(x, 96, 48, 58, x > 300 ? 0 : 2); sconceTV(x, 302); }
}
function livingStd() {
  sofa(152, 496, 317, 418, 396, 496, 141, 317, 'N', 'E');
  B(204, 352, 182, 300, 0, 4, mat.oakD); const ct = B(204, 352, 182, 300, 34, 40, mat.oak); uvScale(ct, 1); for (const [x, y] of [[208, 186], [348, 186], [208, 296], [348, 296]]) B(x - 3, x + 3, y - 3, y + 3, 4, 34, mat.oak);
  vaseFlowers(250, 230, 40, .8); B(290, 330, 220, 250, 40, 46, M({ color: '#d9cbb5' }));
  B(150, 510, 110, 405, 0, 1.2, mat.rug).material = mat.rug;
  B(180, 450, 422, 462, 76, 80, mat.oak); B(180, 450, 422, 462, 20, 23, mat.oak); for (const [x, y] of [[183, 425], [447, 425], [183, 459], [447, 459]]) B(x - 2, x + 2, y - 2, y + 2, 0, 76, mat.oak);
  lamp(420, 442, 80); vaseFlowers(220, 442, 80, .9); B(290, 340, 428, 456, 80, 86, mat.cer);
}
function nicheSkin(m, ceil = true) { B(0, 1.2, 0, BEAM0, 0, HN, m); B(0, NICHE, 0, 1.2, 0, HN, m); if (ceil) B(0, NICHE, 0, BEAM0, HN - 1.2, HN, m, { cast: false }); }
function swingSconce(y, h, flip = 1) { B(0, 2, y - 4, y + 4, h - 6, h + 6, mat.brass); rodBetween([2, y, h], [24, y + flip * 10, h + 4], .6, mat.brass); cyl(26, y + flip * 12, h - 6, h + 6, 6, mat.shade, 24, 8);
  const l = new THREE.PointLight('#ffd6a0', 1.6, 2.5, 2); l.position.set(-.26, (h - 4) / 100, (y + flip * 12) / 100); CUR.add(l); }
function curtainsAt(x, y0, y1, h0, h1, col = '#efe6d6') { const g = new THREE.PlaneGeometry((y1 - y0) / 100, (h1 - h0) / 100, 40, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 60) * .03);
  const c = new THREE.Mesh(g, M({ map: T.linen, color: col, roughness: 1, side: THREE.DoubleSide })); c.rotation.y = Math.PI / 2; c.position.set(-x / 100, (h0 + h1) / 200, (y0 + y1) / 200); c.castShadow = true; c.receiveShadow = true; CUR.add(c); }

// ---------------- KONCEPCJA 3: alkowa wypoczynkowa (daybed za zasłoną) ----------------
function concept3() {
  tvSouth(); livingStd();
  const taupe = M({ color: '#b9a690', roughness: .95 }); nicheSkin(taupe);
  for (const [a, b] of [[0, 92], [302, 394]]) { B(0, 45, a, b, 0, 82, M({ color: '#cbbba6', roughness: .8 })); for (const [p, q] of [[a + 1.5, (a + b) / 2 - .3], [(a + b) / 2 + .3, b - 1.5]]) { B(45, 46.2, p, q, 6, 80, M({ color: '#cbbba6', roughness: .8 })); sph(47, p < (a + b) / 2 ? q - 4 : p + 4, 62, 1.4, mat.brass); }
    B(0, 46, a, b, 82, 85, mat.oak); for (const h of [140, 195, 245]) { B(0, 32, a + 2, b - 2, h, h + 3, mat.oak); shelf('y', a + 3, b - 3, h + 3, 30, 44, 0, 1); } }
  // daybed
  B(4, 96, 94, 300, 0, 10, mat.oakD); for (const [p, q] of [[94, 196], [198, 300]]) { B(0, 100, p, q, 10, 40, mat.oak); B(100, 101, p + 2, q - 2, 12, 38, mat.oak); B(101, 103, (p + q) / 2 - 8, (p + q) / 2 + 8, 25, 27, mat.brass); }
  B(0, 100, 92, 302, 40, 58, mat.boucle, { r: 6 });
  for (let y = 94; y < 300; y += 17) B(0, 9, y, y + 16.4, 58, 138, mat.linen, { r: 3 });
  B(10, 28, 104, 152, 58, 100, M({ color: '#d8ccb8', roughness: 1 }), { r: 8 }); B(10, 28, 148, 196, 58, 96, mat.boucle, { r: 8 }); B(10, 28, 200, 248, 58, 98, M({ color: '#a88f74', roughness: 1 }), { r: 8 }); B(10, 28, 246, 292, 58, 94, mat.boucle, { r: 8 });
  B(30, 96, 260, 298, 58, 64, M({ color: '#8b6a4f', roughness: 1 }), { r: 3 }); // pled
  swingSconce(112, 150, 1); swingSconce(282, 150, -1);
  // szyna sufitowa + zasłony
  B(98, 101, 0, BEAM0, HN - 4, HN - 1, mat.black); curtainsAt(99, 0, 72, 0, HN - 4); curtainsAt(99, 322, 394, 0, HN - 4);
  flushBooks();
}
// ---------------- KONCEPCJA 4: strefa kominkowa (biokominek w kamieniu) ----------------
function concept4() {
  tvSouth(); livingStd();
  const lime = M({ color: '#e3d9c9', roughness: .95 }), stone = M({ map: T.marble, color: '#e2d6c2', roughness: .7 }); nicheSkin(lime);
  for (let y = 40; y < BEAM0; y += 78) B(0, NICHE, y - 6, y + 6, HN - 14, HN - 1, mat.oakD); // belki
  // obudowa kominka
  const fc = 197; const s1 = B(0, 42, fc - 70, fc + 70, 0, 128, stone); uvScale(s1, 1.5);
  B(42, 42.5, fc - 38, fc + 38, 20, 68, M({ color: '#141414', roughness: .9 })); B(30, 42, fc - 36, fc + 36, 20, 22, mat.black);
  B(32, 40, fc - 30, fc + 30, 22, 24, mat.black); B(34, 38, fc - 26, fc + 26, 24, 40, new THREE.MeshStandardMaterial({ color: '#ffb35c', emissive: '#ff8a2a', emissiveIntensity: 3 }));
  { const l = new THREE.PointLight('#ff9a4a', 2.5, 3, 2); l.position.set(-.5, .4, fc / 100); CUR.add(l); }
  const mt = B(0, 48, fc - 80, fc + 80, 128, 136, stone); uvScale(mt, 1.5);
  // lustro okrągłe nad kominkiem
  { const fr = new THREE.Mesh(new THREE.TorusGeometry(.45, .025, 12, 64), mat.brass); fr.rotation.y = Math.PI / 2; fr.position.set(-.025, 1.95, fc / 100); CUR.add(fr);
    const mr = new THREE.Mesh(new THREE.CircleGeometry(.44, 64), mat.mirror); mr.rotation.y = -Math.PI / 2; mr.position.set(-.02, 1.95, fc / 100); CUR.add(mr); }
  vaseFlowers(16, fc - 55, 136, .6); cyl(16, fc + 55, 136, 160, 5, mat.cer);
  // ławy z drewnem
  for (const [a, b] of [[4, 120], [274, 390]]) { B(0, 45, a, b, 0, 40, stone); B(0, 46, a, b, 40, 44, mat.oak); B(0, 44, a + 4, b - 4, 44, 52, mat.linen, { r: 4 });
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const y = a + 10 + k * ((b - a - 20) / 6) + 8; const lg = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .38, 12), M({ color: pick(['#7a5a3e', '#8a6a4b', '#6b4e35']), roughness: 1 })); lg.rotation.z = Math.PI / 2; lg.position.set(-.21, .07 + r * .1 + (k % 2) * .01, y / 100); lg.castShadow = true; CUR.add(lg); } }
  for (const [a, b] of [[10, 114], [280, 384]]) for (const h of [150, 205]) { B(0, 28, a, b, h, h + 4, mat.oak); cyl(14, a + 25, h + 4, h + 22, 6, mat.cer); sph(14, a + 60, h + 12, 8, mat.white); cyl(14, b - 18, h + 4, h + 28, 4, mat.cer, 16, 6); }
  B(0, 40, 0, BEAM0, 0, 2, mat.wall2);
}
// ---------------- KONCEPCJA 5: domowy bar / kawiarnia (zielony lakier, lustro antyczne) ----------------
function concept5() {
  tvSouth(); livingStd();
  const green = M({ color: '#3d4a3a', roughness: .25 }); nicheSkin(green);
  // dół
  B(0, 60, 8, 386, 0, 10, mat.black);
  for (let y = 8; y < 386; y += 47.25) { B(0, 60, y, y + 47.25, 10, 88, green); B(60, 61, y + 1, y + 46.25, 12, 86, green); B(61, 62.5, y + 20, y + 27, 70, 72, mat.brass); }
  B(60, 61.4, 38, 92, 12, 86, M({ color: '#1b2020', roughness: .05, metalness: .3 })); for (let i = 0; i < 6; i++) for (let k = 0; k < 4; k++) cyl(40, 44 + k * 13, 16 + i * 12, 24 + i * 12, 3.5, M({ color: pick(['#2a1810', '#3a2a1e', '#1f2a1a']), roughness: .2 }), 12);
  const top = B(0, 64, 6, 388, 88, 92, M({ map: T.marble, color: '#efe6da', roughness: .2 })); uvScale(top, 1.5);
  rodBetween([66, 6, 80], [66, 388, 80], 1, mat.brass);
  // lustro antyczne + szklane półki
  B(0, 1.5, 6, 388, 92, 245, M({ color: '#b9ad97', metalness: .9, roughness: .18 }));
  for (const h of [135, 180, 222]) { B(0, 26, 10, 384, h, h + 1.2, M({ color: '#dfe8e6', roughness: .05, transparent: true, opacity: .4 })); for (let y = 30; y < 384; y += 60) B(0, 26, y - .6, y + .6, h - 4, h, mat.brass);
    for (let y = 18; y < 378; y += 9 + rnd() * 9) { if (rnd() < .5) cyl(14, y, h + 1.2, h + 1.2 + 16 + rnd() * 14, 3.4, M({ color: pick(['#5a3a1c', '#2e4630', '#c8b16a', '#6b1f22', '#e8e2d2']), roughness: .1, metalness: .1 }), 12);
      else cyl(14, y, h + 1.2, h + 12, 3, M({ color: '#e6efee', roughness: .02, transparent: true, opacity: .45 }), 12); } }
  B(0, 40, 6, 388, 245, HN, green); for (let y = 6; y < 388; y += 47.75) B(40, 41, y + 1, y + 46.75, 247, HN - 2, green);
  // ekspres + karafka + kwiaty
  B(10, 46, 300, 334, 92, 132, mat.steel); B(12, 44, 302, 332, 132, 134, mat.black); cyl(30, 150, 92, 120, 7, M({ color: '#f1efe9', roughness: .05, transparent: true, opacity: .5 }), 16); vaseFlowers(30, 60, 92, .6);
  for (const y of [100, 294]) { B(0, 3, y - 16, y + 16, 250, 253, mat.brass); const s = new THREE.SpotLight('#ffd49a', 2.5, 2.4, 1, .8, 2); s.position.set(-.1, 2.48, y / 100); s.target.position.set(-.2, 1, y / 100); CUR.add(s, s.target); }
  B(0, 1.6, 6, 388, 92, 94, new THREE.MeshStandardMaterial({ color: '#ffe0b0', emissive: '#ffcf8a', emissiveIntensity: 1.2 }), { cast: false });
}
// ---------------- KONCEPCJA 6: pracownia za stalowo-szklaną ścianą ----------------
function concept6() {
  tvSouth(); livingStd();
  // biurko
  B(0, 62, 60, 334, 72, 76, mat.oak); B(0, 60, 60, 120, 0, 72, mat.oakD); B(0, 60, 274, 334, 0, 72, mat.oakD);
  for (const [p, q] of [[60, 120], [274, 334]]) for (const h of [4, 28, 50]) { B(60, 61, p + 1, q - 1, h, h + 20, mat.oakD); B(61, 62.5, (p + q) / 2 - 8, (p + q) / 2 + 8, h + 14, h + 15.5, mat.brass); }
  for (const h of [130, 175, 220, 262]) { B(0, 30, 60, 334, h, h + 3, mat.oak); shelf('y', 62, 332, h + 3, 28, 40, 0, 1); }
  for (const [a, b] of [[0, 60], [334, 394]]) { B(0, 60, a, b, 0, HN, mat.cream); B(60, 61.2, a + 1, b - 1, 10, 220, mat.cream); B(60, 61.2, a + 1, b - 1, 222, HN - 2, mat.cream); B(61.2, 63, a < 100 ? b - 9 : a + 7, a < 100 ? b - 7 : a + 9, 100, 170, mat.brass); }
  // krzesło
  B(70, 120, 175, 225, 42, 50, mat.boucle, { r: 5 }); B(100, 116, 175, 225, 50, 92, mat.boucle, { r: 6 }); cyl(95, 200, 0, 42, 2, mat.black); cyl(95, 200, 0, 3, 22, mat.black);
  // lampa biurkowa + laptop + książki
  cyl(20, 90, 76, 78, 7, mat.brass); rodBetween([20, 90, 78], [24, 104, 118], .6, mat.brass); cyl(26, 108, 112, 124, 6, mat.brass, 16, 10); { const l = new THREE.PointLight('#ffd6a0', 1.4, 2, 2); l.position.set(-.27, 1.1, 1.09); CUR.add(l); }
  B(20, 50, 180, 214, 76, 77.5, M({ color: '#9aa0a5', metalness: .8, roughness: .3 }));
  // ściana stalowo-szklana (Crittall) na krawędzi wnęki
  const fx0 = 99, fx1 = 103, st = M({ color: '#1e2124', roughness: .4, metalness: .4 });
  const ys = [0, 49, 98, 147, 197, 247, 296, 345, 394];
  for (const y of ys) B(fx0, fx1, y - 2, y + 2, 0, HN, st);
  for (const h of [0, 70, 140, 210, HN - 3]) B(fx0, fx1, 0, BEAM0, h, h + 3, st);
  for (let i = 0; i < ys.length - 1; i++) { const g = plane((fx0 + fx1) / 2, (ys[i] + ys[i + 1]) / 2, HN / 2, ys[i + 1] - ys[i] - 4, HN - 4, mat.glass, Math.PI / 2); g.castShadow = false; }
  B(fx1, fx1 + 3, 192, 194, 95, 125, mat.brass); B(fx1, fx1 + 3, 200, 202, 95, 125, mat.brass);
  flushBooks();
}

// ======================= CAŁY PARTER =======================
T.checker = cv(512, 512, (g, w, h) => { const n = 4, s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const dark = (i + j) % 2; g.fillStyle = dark ? '#4a4c4e' : '#ece6dc'; g.fillRect(i * s, j * s, s, s);
  for (let k = 0; k < 18; k++) { g.strokeStyle = dark ? `rgba(220,220,220,${.05 + rnd() * .1})` : `rgba(120,110,100,${.04 + rnd() * .08})`; g.lineWidth = .6 + rnd(); g.beginPath(); g.moveTo(i * s + rnd() * s, j * s + rnd() * s); g.bezierCurveTo(i * s + rnd() * s, j * s + rnd() * s, i * s + rnd() * s, j * s + rnd() * s, i * s + rnd() * s, j * s + rnd() * s); g.stroke(); } }
  g.strokeStyle = 'rgba(80,80,80,.35)'; g.lineWidth = 1.2; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); } });
T.checker.wrapS = T.checker.wrapT = THREE.RepeatWrapping;
T.octa = cv(512, 512, (g, w, h) => { const n = 8, s = w / n, c = s * .29; g.fillStyle = '#9a9c9e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = i * s, y = j * s, v = 236 + rnd() * 10 | 0; g.fillStyle = `rgb(${v},${v - 3},${v - 9})`; g.beginPath(); g.moveTo(x + c, y + 1.5); g.lineTo(x + s - c, y + 1.5); g.lineTo(x + s - 1.5, y + c); g.lineTo(x + s - 1.5, y + s - c); g.lineTo(x + s - c, y + s - 1.5); g.lineTo(x + c, y + s - 1.5); g.lineTo(x + 1.5, y + s - c); g.lineTo(x + 1.5, y + c); g.closePath(); g.fill(); }
  g.fillStyle = '#5e6266'; for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) { g.save(); g.translate(i * s, j * s); g.rotate(Math.PI / 4); g.fillRect(-c * .62, -c * .62, c * 1.24, c * 1.24); g.restore(); } });
T.octa.wrapS = T.octa.wrapT = THREE.RepeatWrapping;
T.marble = cv(1024, 1024, (g, w, h) => { g.fillStyle = '#f2eee8'; g.fillRect(0, 0, w, h); for (let k = 0; k < 26; k++) { g.strokeStyle = `rgba(${pick(['150,135,120', '120,110,100', '190,170,150'])},${.12 + rnd() * .25})`; g.lineWidth = .6 + rnd() * 2.4;
  g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let i = 0; i < 12; i++) { x += (rnd() - .3) * 140; y += (rnd() - .5) * 140; g.lineTo(x, y); } g.stroke(); } });
T.marble.wrapS = T.marble.wrapT = THREE.RepeatWrapping;
T.mosaic = cv(512, 512, (g, w, h) => { g.fillStyle = '#d9cfc4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { const x = rnd() * w, y = rnd() * h, r = 12 + rnd() * 16; const v = 225 + rnd() * 25 | 0;
  g.fillStyle = `rgb(${v},${v - 12 - rnd() * 10 | 0},${v - 22 - rnd() * 12 | 0})`; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + rnd() * .5; g.lineTo(x + Math.cos(a) * r * (0.7 + rnd() * .4), y + Math.sin(a) * r * (0.7 + rnd() * .4)); } g.closePath(); g.fill(); g.strokeStyle = 'rgba(150,135,120,.5)'; g.stroke(); } });
T.mosaic.wrapS = T.mosaic.wrapT = THREE.RepeatWrapping;
T.hpl = cv(512, 512, (g, w, h) => { noiseFill(g, w, h, '#77787a', .05, 4000, 2); g.fillStyle = '#5c5d5f'; g.fillRect(0, 0, 3, h); g.fillRect(w / 2, 0, 3, h); });
T.hpl.wrapS = T.hpl.wrapT = THREE.RepeatWrapping;
T.runner = cv(256, 512, (g, w, h) => { noiseFill(g, w, h, '#d8cdbd', .08, 6000, 2); g.strokeStyle = 'rgba(120,105,85,.45)'; g.lineWidth = 3; g.strokeRect(14, -5, w - 28, h + 10);
  for (let y = 20; y < h; y += 34) { g.beginPath(); g.moveTo(40, y); g.lineTo(w / 2, y + 16); g.lineTo(w - 40, y); g.stroke(); } });
T.runner.wrapS = T.runner.wrapT = THREE.RepeatWrapping;
T.leafart = cv(400, 560, (g, w, h) => { g.fillStyle = '#f1ebe1'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6b4f35'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h * .92); g.lineTo(w / 2, h * .12); g.stroke();
  for (let i = 0; i < 120; i++) { const y = h * (.15 + rnd() * .72), side = rnd() < .5 ? -1 : 1, x = w / 2 + side * rnd() * w * .32; g.save(); g.translate(x, y); g.rotate(side * (.4 + rnd() * .8) - Math.PI / 2 * 0); g.fillStyle = pick(['#c4a585', '#a98263', '#2b2420', '#d8c0a2', '#8a6a4c']);
    g.beginPath(); g.ellipse(0, 0, 9 + rnd() * 12, 3.5 + rnd() * 4, side * .8, 0, 7); g.fill(); g.restore(); } });
T.rugdin = cv(1024, 1024, (g, w, h) => { noiseFill(g, w, h, '#cdb8a0', .1, 30000, 3); g.strokeStyle = 'rgba(110,95,80,.45)'; g.lineWidth = 10; g.strokeRect(40, 40, w - 80, h - 80); g.lineWidth = 4; g.strokeRect(70, 70, w - 140, h - 140);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${pick(['120,130,140', '160,120,100', '230,220,205'])},.35)`; const x = 90 + rnd() * (w - 180), y = 90 + rnd() * (h - 180); g.beginPath(); g.arc(x, y, 4 + rnd() * 10, 0, 7); g.fill(); } });
Object.assign(mat, {
  checker: M({ map: T.checker, roughness: .25 }), octa: M({ map: T.octa, roughness: .35 }), marble: M({ map: T.marble, roughness: .18 }), mosaic: M({ map: T.mosaic, roughness: .3 }),
  hpl: M({ map: T.hpl, roughness: .55 }), epoxy: M({ color: '#8d8f92', roughness: .35 }), concrete: M({ color: '#a7a6a2', roughness: .9 }), ral: M({ color: '#383e42', roughness: .45, metalness: .3 }),
  plaster: M({ color: '#f1ece4', roughness: .9 }), runner: M({ map: T.runner, roughness: 1 }), cream: M({ color: '#ece4d6', roughness: .6 }), steel: M({ color: '#b9bcbf', metalness: .9, roughness: .3 }),
  oakK: M({ map: T.oak, color: '#cbb59a', roughness: .55 }), olive: M({ color: '#6b7350', roughness: 1 }), bronze: M({ color: '#5b4632', metalness: .9, roughness: .35 }),
  porcelain: M({ color: '#f6f5f2', roughness: .15 }), rubber: M({ color: '#3d3f41', roughness: .95 }), mirror: M({ color: '#dfe6ea', metalness: 1, roughness: .02 }), green: M({ color: '#6c7442', roughness: 1 }),
  wallG: M({ color: '#5f6062', roughness: .7 }), leafart: M({ map: T.leafart, roughness: .8 }), rugdin: M({ map: T.rugdin, roughness: 1 }),
});
for (const k in mat) mat[k].name = mat[k].name || k;
let HOUSE = null;
function extrude(poly, h0, h1, m, opts = {}) {
  const sh = new THREE.Shape(poly.o.map(([x, y]) => new THREE.Vector2(-x / 100, -y / 100)));
  for (const hh of (poly.h || [])) sh.holes.push(new THREE.Path(hh.map(([x, y]) => new THREE.Vector2(-x / 100, -y / 100))));
  const g = new THREE.ExtrudeGeometry(sh, { depth: (h1 - h0) / 100, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, h0 / 100, 0);
  const me = new THREE.Mesh(g, m); me.castShadow = opts.cast !== false; me.receiveShadow = true; CUR.add(me); return me;
}
function areaLight(x, y, h, w, d, energy, name = 'AREA') { const o = new THREE.Object3D(); o.name = `${name}:${w}:${d}:${energy}`; o.position.set(-x / 100, h / 100, y / 100); CUR.add(o);
  const l = new THREE.PointLight('#ffe7c8', energy / 40, 6, 2); l.position.copy(o.position); l.position.y -= .05; CUR.add(l); }
function tiled(x0, x1, y0, y1, m, tile, h = .3) { const f = B(x0, x1, y0, y1, 0, h, m, { cast: false }); uvScale(f, 1 / tile); return f; }

function houseShell() {
  const H = HOUSE;
  // podłoga bazowa (dąb) + strop + ściany
  const fp = extrude(H.foot, -12, 0, mat.floor, { cast: false }); { const uv = fp.geometry.attributes.uv, p = fp.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) * .25, p.getZ(i) * .25); }
  for (const w of H.walls) extrude(w, 0, HN, mat.wall);
  for (const w of H.ins) extrude(w, -12, 330, mat.wall2);
  for (const h of H.heads) extrude(h, 205, HN, mat.wall);
  // obudowy pionów (szczeliny w DWG)
  B(-143, -117, 268, 292, 0, HN, mat.wall); B(-482, -458, 396, 421, 0, HN, mat.wall); B(335, 385, 1283, 1307, 0, HN, mat.wall);
  // strop z otworem nad salonem i schodami
  const slab = { o: H.slab.o, h: [[[102, 0], [553, 0], [553, BEAM0], [102, BEAM0]].reverse(), [[-150, 655], [-25, 655], [-25, 1090], [-150, 1090]].reverse()] };
  extrude(slab, HN, 330, mat.wall).name = 'CEIL';
  // pustka salonu – ściany do góry
  B(76, 102, -45, BEAM0, 330, HR, mat.wall); B(-45, 600, BEAM0, BEAM1, 280, HR + 20, mat.wall); B(76, 580, -45, 0, 290, HR + 20, mat.wall);
  B(76, 600, -45, BEAM0, HR, HR + 25, mat.wall).name = 'CEIL'; B(COL, 580, -45, 0, 0, HR + 20, mat.wall); B(COL, 580, BEAM0, 528, 0, HR + 20, mat.wall);
  B(-25, 0, BEAM0, BEAM1, 0, 290, mat.wall);
  // okna / drzwi zewnętrzne / bramy
  for (const w of H.wins) windowUnit(w);
  // fasada W1 (oferta Yawal poz. 7: 3940×5720, słupy 1322/1297/1322, rygle)
  const fx = 553; for (const y of [0, 132.2, 261.9, 394]) B(fx - 3, fx + 5, y - 2.5, y + 2.5, 0, 572, mat.ral);
  for (const h of [0, 15, 221, 236, 286, 507, 557, 572]) B(fx - 3, fx + 5, 0, BEAM0, h - 1.5, h + 1.5, mat.ral);
  B(fx - 6, fx + 30, -5, BEAM0, 572, HR + 20, mat.wall);
  const gl = plane(fx + 1, 197, 286, 390, 572, mat.glass, Math.PI / 2); gl.castShadow = false;
  // otoczenie: trawnik + ogród dookoła
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), M({ color: '#7fae50', roughness: 1 })); lawn.rotation.x = -Math.PI / 2; lawn.position.set(5, -0.13, 8); lawn.receiveShadow = true; CUR.add(lawn);
  for (const [x, y, r, w] of [[1600, 800, Math.PI / 2, 4000], [-3200, 800, -Math.PI / 2, 4000], [-700, 3200, Math.PI, 6000], [-700, -1600, 0, 6000]]) { const g = plane(x, y, 450, w, 1200, mat.garden, r); g.castShadow = false; g.name = 'GARDEN'; }
}
function windowUnit(w) {
  const along = w.ax === 'x', a0 = along ? w.x0 : w.y0, a1 = along ? w.x1 : w.y1, c0 = along ? w.y0 : w.x0, c1 = along ? w.y1 : w.x1, cm = (c0 + c1) / 2;
  const R = (p, q, r, s, h0, h1, m) => along ? B(p, q, r, s, h0, h1, m) : B(r, s, p, q, h0, h1, m);
  if (w.sill > 0) R(a0, a1, c0, c1, 0, w.sill, mat.wall);
  if (w.top < 330) R(a0, a1, c0, c1, w.top, 330, mat.wall);
  if (w.name.startsWith('G1')) { R(a0, a1, cm - 3, cm + 3, 0, w.top, mat.ral); for (let h = 50; h < w.top; h += 50) R(a0, a1, cm + 3, cm + 3.4, h - .4, h + .4, M({ color: '#2a2e31' })); return; }
  if (w.name.startsWith('D1')) { R(a0, a1, cm - 3, cm + 3, 0, w.top, mat.black); R(a0 + 10, a1 - 10, cm - 3.8, cm - 3, 25, w.top - 25, mat.black); R(a0 + 13, a1 - 13, cm - 4.2, cm - 3.8, 28, w.top - 28, mat.black);
    const hx = a1 - 12; R(hx - 1, hx + 1, cm - 8, cm + 8, 100, 125, mat.brass); return; }
  const f = 5; R(a0, a1, cm - 4, cm + 4, w.sill, w.sill + f, mat.ral); R(a0, a1, cm - 4, cm + 4, w.top - f, w.top, mat.ral); R(a0, a0 + f, cm - 4, cm + 4, w.sill, w.top, mat.ral); R(a1 - f, a1, cm - 4, cm + 4, w.sill, w.top, mat.ral);
  for (let i = 1; i < w.div; i++) { const a = a0 + (a1 - a0) * i / w.div; R(a - 3, a + 3, cm - 4, cm + 4, w.sill, w.top, mat.ral); }
  const gl = along ? plane((a0 + a1) / 2, cm, (w.sill + w.top) / 2, a1 - a0, w.top - w.sill, mat.glass, 0) : plane(cm, (a0 + a1) / 2, (w.sill + w.top) / 2, a1 - a0, w.top - w.sill, mat.glass, Math.PI / 2); gl.castShadow = false;
}
function casing(x0, y0, x1, y1, top = 205) { const along = (x1 - x0) > (y1 - y0); const a0 = along ? x0 : y0, a1 = along ? x1 : y1, c0 = along ? y0 : x0, c1 = along ? y1 : x1;
  const R = (p, q, r, s, h0, h1) => along ? B(p, q, r, s, h0, h1, mat.pp) : B(r, s, p, q, h0, h1, mat.pp);
  for (const [r, s] of [[c0 - 1.6, c0], [c1, c1 + 1.6]]) { R(a0 - 8, a0, r, s, 0, top + 8); R(a1, a1 + 8, r, s, 0, top + 8); R(a0 - 8, a1 + 8, r, s, top, top + 8); } }
function doorLeaf(x0, y0, x1, y1, handleSide = 1) { const along = (x1 - x0) > (y1 - y0); const a0 = along ? x0 : y0, a1 = along ? x1 : y1, cm = along ? (y0 + y1) / 2 : (x0 + x1) / 2;
  const R = (p, q, r, s, h0, h1, m) => along ? B(p, q, r, s, h0, h1, m) : B(r, s, p, q, h0, h1, m);
  R(a0, a1, cm - 2, cm + 2, 0, 204, mat.pp); for (const sgn of [-1, 1]) { R(a0 + 9, a1 - 9, cm + sgn * 2, cm + sgn * 2.6, 112, 190, mat.pp); R(a0 + 12, a1 - 12, cm + sgn * 2.6, cm + sgn * 2.9, 115, 187, mat.pp); R(a0 + 9, a1 - 9, cm + sgn * 2, cm + sgn * 2.6, 14, 100, mat.pp); R(a0 + 12, a1 - 12, cm + sgn * 2.6, cm + sgn * 2.9, 17, 97, mat.pp);
    const hx = handleSide > 0 ? a1 - 9 : a0 + 9; R(hx - 2, hx + 2, cm + sgn * 2, cm + sgn * 4, 95, 112, mat.bronze); R(handleSide > 0 ? hx - 14 : hx, handleSide > 0 ? hx : hx + 14, cm + sgn * 4, cm + sgn * 6, 104, 107, mat.bronze); } }
function houseFloors() {
  tiled(-555, -25, 400, 650, mat.checker, 1.2);          // hol wejściowy
  tiled(-640, -345, 650, 1100, mat.checker, 1.2);         // garderoba
  tiled(-640, -339, 1100, 1290, mat.checker, 1.2);        // korytarz do garażu
  tiled(-244, -25, 277, 394, mat.octa, .8);               // WC
  tiled(-637, -337, 1295, 1673, mat.epoxy, 1);            // techniczne + kotłownia
  tiled(-1540, -664, 1095, 1690, mat.concrete, 1);        // garaż
}
function houseHall() { // wejście 0.1.1: boazeria dębowa, szachownica, czarne drzwi
  const H0 = 400, H1 = 650;
  // boazeria na ścianach płn. i płd. (fragmenty między drzwiami)
  const panelRun = (x0, x1, y, dir) => { B(x0, x1, y, y + dir * 1.8, 0, 270, mat.oakK); for (let x = x0; x <= x1; x += 55) B(x - .7, x + .7, y + dir * 1.8, y + dir * 2.6, 0, 270, mat.brass); B(x0, x1, y + dir * 1.8, y + dir * 2.6, 228, 229.4, mat.brass); };
  panelRun(-529, -405, H0, 1); panelRun(-315, -169, H0, 1); panelRun(-79, -25, H0, 1);
  panelRun(-429, -150, H1 - 1, -1);
  B(-555 + 26, -555 + 27.8, 400, 484, 0, 270, mat.oakK); B(-555 + 26, -555 + 27.8, 577, 650, 0, 270, mat.oakK);
  // konsola + lustro łukowe + pufy (ściana płn.)
  B(-330, -200, H1 - 34, H1 - 3, 80, 84, mat.oak); for (const x of [-326, -204]) B(x - 2, x + 2, H1 - 32, H1 - 28, 0, 80, mat.oak);
  { const g = new THREE.Group(); const arch = new THREE.Mesh(new THREE.TorusGeometry(.32, .015, 8, 32, Math.PI), mat.brass); arch.position.set(0, 1.92, 0); g.add(arch);
    for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(.03, .82, .03), mat.brass); r.position.set(s * .32, 1.51, 0); g.add(r); }
    const mir = new THREE.Mesh(new THREE.PlaneGeometry(.62, .82), mat.mirror); mir.position.set(0, 1.51, .005); g.add(mir); const mt = new THREE.Mesh(new THREE.CircleGeometry(.31, 32, 0, Math.PI), mat.mirror); mt.position.set(0, 1.92, .005); g.add(mt);
    g.position.set(2.65, 0, (H1 - 4) / 100); g.rotation.y = Math.PI; CUR.add(g); }
  lamp(-305, H1 - 18, 84); vaseFlowers(-225, H1 - 18, 84, .8);
  for (const x of [-300, -245]) B(x - 20, x + 20, H1 - 60, H1 - 20, 0, 42, mat.linen, { r: 3 });
  for (const x of [-480, -300, -110]) cyl(x, 525, HN - 1, HN, 5, mat.glow, 16);
  areaLight(-290, 525, 285, 1.2, .6, 60, 'AREA_HOL');
}
function houseWardrobe() { // garderoba: czarne szafy, dębowe szafki, zielona pufa
  const X0 = -640, X1 = -345, Y0 = 720, Y1 = 1100;
  // czarne szafy – ściana wsch.
  B(-425, -345, 722, 1095, 0, 270, mat.black); for (let y = 722; y < 1095; y += 62) { B(-426, -425, y - .4, y + .4, 0, 270, mat.blackG); }
  for (let y = 753; y < 1095; y += 124) for (const d of [-3, 3]) sph(-428, y + d, 125, 1.5, mat.brass);
  B(-426, -425, 722, 1095, 205, 206, mat.blackG);
  // dębowe szafki-lockery – ściana płn.
  const lx0 = -630, lx1 = -440; B(lx0, lx1, 1040, 1100, 0, 12, mat.oakK);
  const n = 4, lw = (lx1 - lx0) / n;
  for (let i = 0; i < n; i++) { const a = lx0 + i * lw; B(a, a + 2, 1040, 1100, 12, 270, mat.oakK); B(a + 2, a + lw, 1041, 1043, 45, 205, mat.oakK);
    B(a + 6, a + lw - 4, 1040, 1041, 50, 200, mat.oakK); B(a + lw - 10, a + lw - 8, 1037, 1040, 110, 150, mat.brass); B(a + 2, a + lw, 1040, 1100, 205, 208, mat.oakK);
    B(a + 6, a + lw - 4, 1050, 1090, 210, 245, M({ map: T.cane, color: '#c69a62', roughness: 1 })); B(a + 2, a + lw, 1040, 1100, 42, 45, mat.oakK); }
  B(lx1 - 2, lx1, 1040, 1100, 12, 270, mat.oakK); B(lx0, lx1, 1040, 1100, 268, 272, mat.oakK);
  // pufa
  B(-540, -450, 860, 960, 0, 30, mat.green, { r: 3 }); B(-542, -448, 858, 962, 30, 44, mat.green, { r: 6 });
  for (let k = 0; k < 18; k++) { const t = k / 18; }
  // drzewko oliwne w donicy przy oknie
  cyl(-610, 760, 0, 45, 22, mat.cer, 24, 18); rodBetween([-610, 760, 45], [-605, 765, 150], 2, mat.bronze);
  for (let i = 0; i < 45; i++) sph(-610 + (rnd() - .5) * 60, 760 + (rnd() - .5) * 60, 140 + rnd() * 70, 6 + rnd() * 6, mat.olive, .7);
  // zasłony przy oknie
  for (const [y0, y1] of [[785, 820], [970, 1005]]) { const g = new THREE.PlaneGeometry((y1 - y0) / 100, 2.75, 30, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 60) * .025);
    const c = new THREE.Mesh(g, M({ map: T.linen, color: '#f4efe6', roughness: 1, side: THREE.DoubleSide })); c.rotation.y = Math.PI / 2; c.position.set(6.25, 1.4, (y0 + y1) / 200); c.castShadow = true; CUR.add(c); }
  // grafiki
  for (const [y, h] of [[1000, 150]]) { B(-640, -637, 1010, 1034, 130, 162, mat.black); }
  areaLight(-490, 900, 285, 1.2, 1.2, 80, 'AREA_GARD');
}
function houseWC() { // WC 0.4.1 (219×118): zabudowa dębowa za WC, szafka z marmurem, czarne lustro
  const X0 = -244, X1 = -25, Y0 = 277, Y1 = 394;
  // ściana z zabudową dębową (zach.)
  B(X0, X0 + 22, Y0, Y1, 0, 112, mat.oakK); B(X0 + 22, X0 + 23, Y0 + 3, Y1 - 3, 3, 109, mat.oakK);
  for (const [p, q] of [[Y0 + 1, (Y0 + Y1) / 2 - .4], [(Y0 + Y1) / 2 + .4, Y1 - 1]]) { B(X0, X0 + 36, p, q, 114, 268, mat.oakK); B(X0 + 36, X0 + 37, p + 5, q - 5, 120, 262, mat.oakK); sph(X0 + 38, (p < (Y0 + Y1) / 2 ? q - 4 : p + 4), 128, 1.4, mat.brass); }
  B(X0 + 22, X0 + 23.5, 324, 347, 76, 92, mat.steel);
  // WC podwieszane
  const wc = B(X0 + 23, X0 + 77, 316, 355, 32, 48, mat.porcelain, { r: 9 }); B(X0 + 23, X0 + 72, 318, 353, 48, 52, mat.porcelain, { r: 4 });
  // papier
  B(X0 + 30, X0 + 33, Y1 - 4, Y1, 70, 74, mat.bronze); cyl(X0 + 31.5, Y1 - 9, 66, 78, 5.5, mat.pp, 16);
  // szafka umywalkowa (wsch.)
  B(X1 - 52, X1, Y0 + 6, Y1 - 6, 30, 82, mat.oakK); B(X1 - 53, X1 - 52, Y0 + 8, (Y0 + Y1) / 2 - .5, 34, 80, mat.oakK); B(X1 - 53, X1 - 52, (Y0 + Y1) / 2 + .5, Y1 - 8, 34, 80, mat.oakK);
  for (const y of [(Y0 + Y1) / 2 - 5, (Y0 + Y1) / 2 + 5]) sph(X1 - 54, y, 72, 1.3, mat.brass);
  const top = B(X1 - 54, X1, Y0 + 4, Y1 - 4, 82, 86, mat.marble); uvScale(top, 2); B(X1 - 4, X1, Y0 + 4, Y1 - 4, 86, 98, mat.marble);
  B(X1 - 42, X1 - 12, Y0 + 30, Y1 - 30, 84, 86.2, M({ color: '#f9f9f7', roughness: .1 }));
  cyl(X1 - 8, (Y0 + Y1) / 2, 86, 108, 1.2, mat.bronze); rodBetween([X1 - 8, (Y0 + Y1) / 2, 107], [X1 - 22, (Y0 + Y1) / 2, 104], 1.1, mat.bronze);
  for (const s of [-1, 1]) { cyl(X1 - 8, (Y0 + Y1) / 2 + s * 14, 86, 94, 1, mat.bronze); }
  // lustro czarne + kinkiety
  B(X1 - 3, X1, (Y0 + Y1) / 2 - 33, (Y0 + Y1) / 2 + 33, 118, 196, mat.black, { r: 4 }); B(X1 - 3.3, X1 - 3, (Y0 + Y1) / 2 - 29, (Y0 + Y1) / 2 + 29, 122, 192, mat.mirror);
  for (const s of [-1, 1]) { const y = (Y0 + Y1) / 2 + s * 46; cyl(X1 - 2, y, 158, 162, 4, mat.bronze); rodBetween([X1 - 1, y, 160], [X1 - 10, y, 160], .8, mat.bronze); cyl(X1 - 10, y, 150, 172, 1.2, mat.bronze);
    const sh = cyl(X1 - 10, y, 170, 186, 6, mat.shade, 24, 9); const l = new THREE.PointLight('#ffd2a0', 1.5, 3, 2); l.position.set(-(X1 - 10) / 100, 1.76, y / 100); CUR.add(l); }
  // obraz z liśćmi (ściana płd.)
  B(-170, -100, Y0, Y0 + 3, 120, 215, mat.oak); plane(-135, Y0 + 3.2, 167.5, 64, 89, mat.leafart, 0);
  // ręcznik, kwiaty, mydło
  B(X1 - 56, X1 - 54, Y1 - 28, Y1 - 14, 50, 86, mat.linen); vaseFlowers(X1 - 15, Y0 + 14, 86, .5); cyl(X1 - 12, Y1 - 13, 86, 102, 3, mat.marble);
  // gzyms + oprawa
  B(X0, X1, Y0, Y0 + 6, HN - 8, HN, mat.wall2); B(X0, X1, Y1 - 6, Y1, HN - 8, HN, mat.wall2); B(X0, X0 + 6, Y0, Y1, HN - 8, HN, mat.wall2); B(X1 - 6, X1, Y0, Y1, HN - 8, HN, mat.wall2);
  cyl(-135, 335, HN - 1, HN, 5, mat.glow, 16); areaLight(-135, 335, 286, .3, .3, 20, 'AREA_WC');
  B(X0, X1, Y0, Y0 + 1.5, 0, 9, mat.pp); B(X0, X1, Y1 - 1.5, Y1, 0, 9, mat.pp);
}
function houseBoiler() { // kotłownia 0.10.1 300×200: HPL szare, żywica, pompa ciepła, zasobnik
  const X0 = -637, X1 = -337, Y0 = 1474, Y1 = 1673;
  B(X0, X0 + 1, Y0, Y1, 0, HN, mat.hpl).material = mat.hpl; B(X1 - 1, X1, Y0, Y1, 0, HN, mat.hpl); B(X0, X1, Y0, Y0 + 1, 0, HN, mat.hpl); B(X0, X1, Y1 - 1, Y1, 0, HN, mat.hpl);
  for (const m of CUR.children.slice(-4)) uvScale(m, 1);
  B(X0, X1, Y0, Y1, HN - 1, HN, M({ color: '#6c6d6f', roughness: .7 })); B(X0 + 60, X1 - 60, (Y0 + Y1) / 2 - 1.5, (Y0 + Y1) / 2 + 1.5, HN - 2.5, HN - 1, mat.glow);
  areaLight((X0 + X1) / 2, (Y0 + Y1) / 2, 286, 1.8, .1, 70, 'AREA_KOT');
  // szafka ze zlewem (płd.)
  B(X0 + 2, X0 + 150, Y0 + 1, Y0 + 61, 0, 86, mat.wallG); B(X0 + 2, X0 + 150, Y0 + 1, Y0 + 63, 86, 90, mat.steel);
  for (const x of [X0 + 30, X0 + 75]) B(x, x + 40, Y0 + 10, Y0 + 50, 80, 90.2, M({ color: '#7d8083', metalness: .9, roughness: .25 }));
  cyl(X0 + 72, Y0 + 7, 90, 118, 1.2, mat.steel); rodBetween([X0 + 72, Y0 + 7, 117], [X0 + 72, Y0 + 26, 114], 1.1, mat.steel);
  // pompa ciepła (jedn. wewn.) – ściana wsch.
  B(X1 - 72, X1 - 2, Y0 + 70, Y0 + 170, 0, 182, M({ color: '#b8bbbd', roughness: .45 })); B(X1 - 74, X1 - 72, Y0 + 80, Y0 + 160, 30, 172, mat.wallG);
  { const f = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .02, 48), M({ color: '#1d1f21', roughness: .6 })); f.rotation.z = Math.PI / 2; f.position.set(-(X1 - 75) / 100, 1.05, (Y0 + 120) / 100); CUR.add(f); }
  B(X1 - 75, X1 - 74, Y0 + 145, Y0 + 158, 140, 156, mat.blackG);
  // zasobnik CWU
  cyl(X1 - 150, Y1 - 40, 0, 6, 28, mat.blackG, 40); cyl(X1 - 150, Y1 - 40, 6, 176, 30, M({ color: '#c7c9cb', metalness: .4, roughness: .35 }), 48); cyl(X1 - 150, Y1 - 40, 176, 180, 29, mat.blackG, 40);
  // kocioł/sterownik na ścianie płn. + rury
  B(X0 + 175, X0 + 220, Y1 - 26, Y1 - 1, 135, 205, mat.blackG); B(X0 + 177, X0 + 218, Y1 - 27, Y1 - 26, 150, 165, M({ color: '#2d3134', roughness: .2 }));
  for (const x of [X0 + 185, X0 + 197, X0 + 209]) rodBetween([x, Y1 - 8, 0], [x, Y1 - 8, 135], 1.5, mat.blackG);
  for (const y of [Y1 - 8, Y1 - 20, Y1 - 32]) rodBetween([X1 - 8, y, 182], [X1 - 8, y, HN - 2], 2.4, mat.blackG);
  B(X0, X1, Y0, Y0 + 1, 0, 9, mat.wallG);
}
function houseKitchen() { // kuchnia: dębowe kolumny, biały okap, mozaika, wyspa z marmurem
  const YB = 1274, D = 62, x0 = 4, x1 = 527;
  const tall = (a, b) => { B(a, b, YB - D, YB, 0, 10, mat.oakK); B(a, b, YB - D, YB, 10, 268, mat.oakK); const n = Math.max(1, Math.round((b - a) / 55)); const w = (b - a) / n;
    for (let i = 0; i < n; i++) { const p = a + i * w; B(p + 1, p + w - 1, YB - D - 1.2, YB - D, 12, 204, mat.oakK); B(p + 5, p + w - 5, YB - D - 1.8, YB - D - 1.2, 16, 200, mat.oakK);
      B(p + 1, p + w - 1, YB - D - 1.2, YB - D, 207, 266, mat.oakK); const hx = i % 2 ? p + 8 : p + w - 8; B(hx - 1, hx + 1, YB - D - 6, YB - D - 1.2, 70, 160, mat.brass); } };
  tall(x0, 124); tall(407, x1);
  // dolne szafki + blat marmurowy
  B(124, 407, YB - D, YB, 0, 10, mat.oakK); B(124, 205, YB - D, YB, 10, 88, mat.oakK); B(307, 407, YB - D, YB, 10, 88, mat.oakK);
  for (const [a, b] of [[124, 205], [307, 407]]) for (const h of [10, 36, 62]) { B(a + 1, b - 1, YB - D - 1.2, YB - D, h + 1, h + 25, mat.oakK); B((a + b) / 2 - 10, (a + b) / 2 + 10, YB - D - 4, YB - D - 1.2, h + 18, h + 20, mat.brass); }
  const ct = B(122, 409, YB - D - 3, YB, 88, 92, mat.marble); uvScale(ct, 1.5);
  // kuchnia wolnostojąca czarna 100
  B(206, 306, YB - D, YB, 0, 90, mat.black); B(207, 305, YB - D - 1, YB - D, 15, 48, mat.blackG); B(207, 305, YB - D - 1, YB - D, 52, 80, mat.blackG);
  B(210, 302, YB - D - 5, YB - D - 3, 82, 84, mat.steel); for (let i = 0; i < 7; i++) cyl(216 + i * 13, YB - D - 3, 84, 87, 2.2, mat.steel, 12);
  B(206, 306, YB - D, YB, 90, 92, M({ color: '#2a2a2a', roughness: .4 }));
  // mozaika + okap
  const bs = B(122, 409, YB - 1.5, YB, 92, 270, mat.mosaic); uvScale(bs, 1.6);
  B(186, 326, YB - 52, YB, 175, 200, mat.plaster); B(196, 316, YB - 46, YB, 200, 258, mat.plaster); B(180, 332, YB - 56, YB, 168, 175, mat.plaster); B(176, 336, YB - 58, YB, 258, 268, mat.plaster);
  for (let x = 190; x < 324; x += 7) B(x, x + 3.5, YB - 56.5, YB - 55, 170, 173, mat.plaster);
  // półki/słoiki
  sph(140, YB - 30, 98, 6, mat.cer); cyl(160, YB - 25, 92, 112, 5, mat.cer); cyl(390, YB - 25, 92, 108, 5, mat.cer); vaseFlowers(375, YB - 30, 92, .5);
  // kolumny kremowe (lodówka) – ściana zach.
  B(0, 62, 1075, 1218, 0, 268, mat.cream); for (const [p, q] of [[1076, 1146], [1147, 1217]]) { B(62, 63.2, p, q, 12, 204, mat.cream); B(62, 63.2, p, q, 207, 266, mat.cream); B(63.2, 66, (p < 1146 ? q - 8 : p + 8) - 1, (p < 1146 ? q - 8 : p + 8) + 1, 70, 170, mat.brass); }
  // wyspa
  const IX0 = 82, IX1 = 429, IY0 = 990, IY1 = 1093;
  B(IX0 + 4, IX1 - 4, IY0 + 30, IY1 - 2, 0, 88, mat.oakK);
  for (const x of [IX0 + 4, IX1 - 12]) B(x, x + 8, IY0, IY1, 0, 88, mat.oakK);
  for (let x = IX0 + 12; x < IX1 - 12; x += 55) { B(x + 1, Math.min(x + 54, IX1 - 13), IY1 - 2, IY1, 8, 82, mat.oakK); }
  const it = B(IX0, IX1, IY0 - 6, IY1 + 3, 88, 92, mat.marble); uvScale(it, 1.4); B(IX0 + 2, IX1 - 2, IY0 - 4, IY1 + 1, 92, 92.1, mat.marble);
  B(240, 290, 1040, 1075, 88, 92.2, mat.steel); cyl(262, 1082, 92, 125, 1.4, mat.brass); rodBetween([262, 1082, 124], [262, 1060, 118], 1.3, mat.brass);
  vaseFlowers(140, 1050, 92, .6); sph(180, 1050, 96, 6, mat.cer);
  // hokery
  for (let i = 0; i < 4; i++) { const x = 130 + i * 78, y = 965; for (const [dx, dy] of [[-15, -15], [15, -15], [-15, 15], [15, 15]]) rodBetween([x + dx, y + dy, 0], [x + dx * .7, y + dy * .7, 66], 1.6, mat.oak);
    rodBetween([x - 13, y - 13, 25], [x + 13, y - 13, 25], 1, mat.oak); cyl(x, y, 66, 70, 18, mat.oak, 24); cyl(x, y, 70, 76, 18, mat.boucle, 24); }
  // lampa nad wyspą (czarna belka + 2 abażury)
  cyl(255, 1040, 210, HN, .7, mat.black, 8); rodBetween([170, 1040, 210], [340, 1040, 210], 1.2, mat.black);
  for (const x of [170, 340]) { cyl(x, 1040, 196, 210, .7, mat.black, 8); cyl(x, 1040, 180, 196, 15, mat.shade, 32, 7); const l = new THREE.PointLight('#ffdcae', 1.4, 3, 2); l.position.set(-x / 100, 1.86, 10.4); CUR.add(l); }
  // dywan pod stołem
  const rd = B(160, 412, 500, 880, 0, 1.2, mat.rugdin); uvScale(rd, .4);
  for (const x of [80, 260, 450]) cyl(x, 1150, HN - 1, HN, 4, mat.glow, 16);
  areaLight(270, 1120, 286, 2.5, 1.2, 60, 'AREA_KUCH');
}
function houseStairs() { // schody: dębowe stopnie, chodnik, czarne tralki, dębowa poręcz
  const X0 = -150, X1 = -25, y0 = 655, n1 = 13, R = 324 / 18, G = 27;
  for (let i = 0; i < n1; i++) { const h = (i + 1) * R, y = y0 + i * G; B(X0, X1, y, y + G, i * R, h, mat.pp); B(X0, X1, y - 2, y + G, h - 3, h, mat.oak); B(X0 + 22, X1 - 22, y - 2.3, y + G, h, h + .6, mat.runner).material = mat.runner; }
  const yL = y0 + n1 * G; B(X0, X1, yL, 1090, 0, n1 * R, mat.pp); B(X0, X1, yL, 1090, n1 * R - 3, n1 * R, mat.oak);
  for (let i = 0; i < 5; i++) { const h = n1 * R + (i + 1) * R, x = X0 - i * G; B(x - G, x, 980, 1090, n1 * R, h, mat.pp); B(x - G - 2, x, 980, 1090, h - 3, h, mat.oak); }
  // pierwszy stopień marmurowy, zaokrąglony
  { const s = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, R / 100, 32, 1, false, Math.PI / 2, Math.PI), mat.marble); s.position.set(-(X0 + 15) / 100, R / 200, (y0 + 2) / 100); s.castShadow = s.receiveShadow = true; CUR.add(s); }
  // balustrada od strony zach.
  for (let i = 0; i < n1; i++) { const y = y0 + i * G + G / 2, h = (i + 1) * R; rodBetween([X0 + 4, y, h], [X0 + 4, y, h + 90], .9, mat.black); }
  rodBetween([X0 + 4, y0, R + 90], [X0 + 4, yL, n1 * R + 90], 2.6, mat.oak);
  cyl(X0 + 4, y0, 0, R + 95, 3.2, mat.black, 16); cyl(X0 + 4, y0, R + 95, R + 102, 4.2, mat.black, 16);
  B(X0 - 2, X0, y0, yL, 0, 300, mat.wall); // ściana spiżarni pod schodami
}
function houseOffice() { // gabinet (L) – proste meble
  B(-560, -420, 320, 390, 72, 75, mat.oak); for (const [x, y] of [[-556, 324], [-424, 324], [-556, 386], [-424, 386]]) B(x - 2, x + 2, y - 2, y + 2, 0, 72, mat.black);
  B(-640, -600, 30, 260, 0, 220, mat.oakK); for (const h of [40, 90, 140, 190]) { B(-640, -602, 32, 258, h, h + 2, mat.oakK); shelf('y', 34, 256, h + 2, 30, 45, -640, 1); }
  flushBooks(); B(-400, -200, 40, 130, 0, 42, mat.boucle, { r: 6 }); B(-400, -200, 40, 62, 42, 80, mat.boucle, { r: 8 });
  areaLight(-400, 200, 286, 1.2, 1.2, 40, 'AREA_GAB');
}
function houseGym() { tiled(-325, 280, 1300, 1690, mat.rubber, 1); B(-320, -40, 1690, 1692, 30, 230, mat.mirror); B(-200, -80, 1450, 1500, 0, 45, mat.black, { r: 3 }); areaLight(0, 1500, 286, 2, 1.5, 50, 'AREA_SIL'); }

async function buildHouse() {
  HOUSE = await (await fetch(ASSET + 'house.json')).json();
  houseShell(); houseFloors();
  for (const h of HOUSE.heads) { const xs = h.o.map(p => p[0]), ys = h.o.map(p => p[1]); casing(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)); }
  doorLeaf(-169, 394, -79, 419, -1); doorLeaf(-405, 394, -315, 419, 1);
  houseHall(); houseWardrobe(); houseWC(); houseBoiler(); houseKitchen(); houseStairs(); houseOffice(); houseGym();
  livingDetails(); dining();
}

if (HOUSE_MODE) await buildHouse(); else { architecture(); dining(); }
const CF = { '1': concept1, '2': concept2, '3': concept3, '4': concept4, '5': concept5, '6': concept6, 'r1': conceptR1, 'r2': conceptR2, 'r3': conceptR3, 'r4': conceptR4, 'p1': conceptP1, 'p2': conceptP2, 'p3': conceptP3, 'p4': conceptP4, 'c1': conceptCL1, 'c2': conceptCL2, 'c3': conceptCL3, 'c4': conceptCL4, 'c5': conceptCL5, 'c6': conceptCL6, 'm1': conceptM1, 'm2': conceptM2, 'm3': conceptM3, 'm4': conceptM4, 'm5': conceptM5, 'm6': conceptM6 }; const GS = {};
for (const k in CF) if (INTER || CONCEPT === k) { GS[k] = new THREE.Group(); ROOT.add(GS[k]); CUR = GS[k]; CF[k](); GS[k].visible = CONCEPT === k; }
CUR = ROOT; const G1 = GS['1'] || new THREE.Group(), G2 = GS['2'] || new THREE.Group(); window.GS = GS;

if (EXPORT) {
  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
  scene.updateMatrixWorld(true);
  new GLTFExporter().parse(ROOT, buf => { const u8 = new Uint8Array(buf); let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); window.__glb = btoa(s); window.__done = true; }, e => { window.__err = String(e); }, { binary: true, maxTextureSize: 2048 });
  throw new Error('export-stop');
}
// ---------------- lights ----------------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = +(Q.get('exp') || .85); document.body.appendChild(renderer.domElement);
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = +(Q.get('env') || .22);
RectAreaLightUniformsLib.init();
const sky = new THREE.RectAreaLight('#dfe9f2', +(Q.get('sky') || 1.6), 3.9, 5.4); sky.position.set(-5.5, 2.7, 1.97); sky.lookAt(0, 2.7, 1.97); scene.add(sky);
const sky2 = new THREE.RectAreaLight('#dfe9f2', 1.0, 3.2, 2.4); sky2.position.set(-5.52, 1.2, 6.9); sky2.lookAt(0, 1.2, 6.9); scene.add(sky2);
const hemi = new THREE.HemisphereLight('#f6efe4', '#b89a74', .25); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe2b8', +(Q.get('sun') || 7)); sun.position.set(-15, 8.2, 5.2); sun.target.position.set(HOUSE_MODE ? 3 : -2.2, 0, HOUSE_MODE ? 7 : 1.0); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(INTER ? 2048 : 4096, INTER ? 2048 : 4096); const sc = sun.shadow.camera; const SS = HOUSE_MODE ? 15 : 8; sc.left = -SS; sc.right = SS; sc.top = SS; sc.bottom = -SS; sc.near = 1; sc.far = 40; sun.shadow.bias = -0.0003; sun.shadow.normalBias = .02;
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
  wall:   { pos: [540, 205, 150], look: [0, 205], up: 42, down: 28 },
  wide:   { pos: [40, 600, 150], look: [420, 60], up: 38, down: 32 },
  top:    { top: true, fov: 40, up: 10, down: 10, pos: [0, 0, 0], look: [0, 0] },
  iso:    { iso: true, fov: 38, pos: [700, -900, 1500], look: [-450, 850, 0], up: 10, down: 10 },
};
const vk = VIEW === 'niche' ? (CONCEPT === '2' ? 'niche2' : 'niche1') : VIEW; const V = VIEWS[vk];
if (Q.get('hide') === 'ceil') scene.traverse(o => { if (o.name === 'CEIL') o.visible = false; if (o.isMesh && o.geometry && !o.name) { } });
const d2r = Math.PI / 180, tu = Math.tan(V.up * d2r), td = Math.tan(V.down * d2r), tm = Math.max(tu, td);
const fh = H * 2 * tm / (tu + td);
const cam = new THREE.PerspectiveCamera(2 * Math.atan(tm) / d2r, W / fh, .05, 80);
cam.position.set(-V.pos[0] / 100, V.pos[2] / 100, V.pos[1] / 100); cam.lookAt(-V.look[0] / 100, V.pos[2] / 100, V.look[1] / 100);
if (V.top || V.iso) { cam.fov = V.fov || 40; cam.aspect = W / H; const [px, py, ph] = V.top ? [-500, 840, 2900] : V.pos; cam.position.set(-px / 100, ph / 100, py / 100); if (V.top) cam.up.set(0, 0, 1); const L = V.top ? [-500, 840, 0] : V.look; cam.lookAt(-L[0] / 100, L[2] / 100, L[1] / 100); }
else if (!INTER) cam.setViewOffset(W, fh, 0, fh / 2 - tu / tm * fh / 2, W, H); else { cam.aspect = W / H; cam.fov = 60; }
cam.updateProjectionMatrix();

const comp = new EffectComposer(renderer); comp.addPass(new RenderPass(scene, cam));
const ao = new GTAOPass(scene, cam, W, H); ao.updateGtaoMaterial({ radius: .35, distanceExponent: 1.5, thickness: 1, scale: 1.1 }); ao.blendIntensity = .85; comp.addPass(ao);
comp.addPass(new OutputPass());
if (INTER) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.fov = 62; cam.updateProjectionMatrix(); comp.setSize(innerWidth, innerHeight);
  const ctl = new OrbitControls(cam, renderer.domElement); ctl.enableDamping = true; ctl.maxDistance = HOUSE_MODE ? 40 : 5; ctl.minDistance = .3; ctl.maxPolarAngle = Math.PI * .62; if (HOUSE_MODE) cam.far = 200, cam.updateProjectionMatrix();
  const P3 = (x, y, h) => [-x / 100, h / 100, y / 100];
  const PRE = HOUSE_MODE ? {
    dom: [P3(900, -1100, 1700), P3(-450, 800, 0)], salon: [P3(330, 520, 160), P3(316, 150, 150)], wneka: [P3(515, 120, 140), P3(60, 230, 140)],
    kuchnia: [P3(300, 720, 165), P3(270, 1150, 120)], hol: [P3(-60, 520, 160), P3(-400, 525, 140)], garderoba: [P3(-580, 750, 165), P3(-480, 1040, 120)],
    wc: [P3(-60, 340, 160), P3(-200, 335, 120)], kotlownia: [P3(-400, 1500, 165), P3(-520, 1620, 110)], schody: [P3(-90, 470, 160), P3(-90, 800, 200)] }
  : { salon: [[-3.3, 1.6, 5.25], [-3.0, 1.5, 1.5]], wneka: [[-5.15, 1.4, 1.2], [-0.6, 1.4, 2.3]], okno: [[-0.6, 1.6, 3.6], [-4.5, 1.7, 1.2]], gora: [[-4.8, 4.8, 4.0], [-2.5, 0.6, 1.8]] };
  window.__ceil = on => { scene.traverse(o => { if (o.name === 'CEIL' || o.name === 'GARDEN') o.visible = on; }); scene.background = new THREE.Color(on ? '#e9f0f2' : '#f3efe8'); dirty = 3; };
  const go = k => { const [p, t] = PRE[k]; cam.position.set(...p); ctl.target.set(...t); ctl.update(); dirty = 3; };
  let dirty = 3; ctl.addEventListener('change', () => dirty = 2);
  window.__setConcept = c => { for (const k in GS) GS[k].visible = k === c; dirty = 3; };
  window.__go = go; window.__render = () => dirty = 3; if (HOUSE_MODE) { go('dom'); window.__ceil(false); } else go('salon');
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); comp.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); dirty = 3; });
  const loop = () => { requestAnimationFrame(loop); ctl.update(); if (dirty > 0) { comp.render(); dirty--; } }; loop(); window.__ready && window.__ready();
} else { comp.render(); comp.render(); window.__done = true; }
