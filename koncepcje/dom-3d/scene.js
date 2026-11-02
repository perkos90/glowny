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
const ZONE = Q.get('zone') === '1';
const HOUSE_MODE = Q.get('house') === '1' || ZONE;
const NOMOULD = Q.get('nomould') === '1' || Q.get('c') === 'k1b';
const TREE = Q.get('tree');
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
  if (!/^k2w/.test(String(CONCEPT))) { B(102, 553, 0, 12, HR - 12, HR, mat.wall2); B(102, 115, 0, BEAM0, HR - 12, HR, mat.wall2); }
  // zasłony
  for (const [y0, y1] of [[2, 70], [324, 392]]) { const CT = ZONE ? HR - 25 : HR - 12; const g = new THREE.PlaneGeometry((y1 - y0) / 100, CT / 100, 60, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 55) * .035);
    const c = new THREE.Mesh(g, M({ map: T.linen, color: '#efe6d6', roughness: 1, side: THREE.DoubleSide })); c.rotation.y = Math.PI / 2; c.position.set(-(WIN - 14) / 100, CT / 200, (y0 + y1) / 200); c.castShadow = true; c.receiveShadow = true; CUR.add(c); }
  if (!ZONE) B(WIN - 20, WIN - 16, 0, BEAM0, HR - 12, HR - 9, mat.black); // karnisz
  if (NOMOULD) { builtUps(); }
  // portal wnęki
  if (!NOMOULD && !/^k[12]w/.test(String(CONCEPT))) { B(96, 108, -2, BEAM0, 280, 292, mat.wall2); B(96, 108, 0, 8, 0, 292, mat.wall2); }
  // listwy na ścianie nad wnęką
  if (!NOMOULD && !/^[rpcm]/.test(String(CONCEPT)) && !/^k2w/.test(String(CONCEPT))) frameRect(30, 364, 102, 330, 520, 2.2, 1.6, mat.wall2, 'y');
  // ściana TV – pas centralny + ramki
  const cx = 316.5; if (!NOMOULD) { if (!/^k[12]w/.test(String(CONCEPT))) { B(cx - 110, cx + 110, 0, 2.5, 0, HR, mat.wall2); frameRect(cx - 98, cx + 98, 2.5, 12, HR - 22); }
  if (!/^k2w/.test(String(CONCEPT))) for (const [a, b] of [[114, cx - 124], [cx + 124, 522]]) { frameRect(a, b, 0, 315, HR - 25); } }
  // listwa przypodłogowa
  B(102, 531, 0, 2, 0, 10, mat.wall2); if (!ZONE) B(0, 2, 0, 1040, 0, 10, mat.wall2);
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
// ======================= K2W: TV we wnęce (ciepła biel) + ściana płd. z wypukłościami i obrazem =======================
function sofaStraight(x0, x1, y0, y1, back) { // back: 'S' (oparcie przy y0) / 'N' (przy y1)
  B(x0, x1, y0, y1, 0, 12, mat.black); B(x0, x1, y0, y1, 12, 40, mat.boucle, { r: 4 });
  if (back === 'S') B(x0, x1, y0, y0 + 22, 40, 80, mat.boucle, { r: 8 }); else B(x0, x1, y1 - 22, y1, 40, 80, mat.boucle, { r: 8 });
  B(x0, x0 + 20, y0, y1, 40, 64, mat.boucle, { r: 8 }); B(x1 - 20, x1, y0, y1, 40, 64, mat.boucle, { r: 8 });
  const s0 = back === 'S' ? y0 + 22 : y0 + 2, s1 = back === 'S' ? y1 - 2 : y1 - 22; const n = 3, w = (x1 - x0 - 40) / n;
  for (let i = 0; i < n; i++) B(x0 + 20 + i * w + 1, x0 + 20 + (i + 1) * w - 1, s0, s1, 40, 50, mat.boucle, { r: 6 });
  const py = back === 'S' ? [y0 + 22, y0 + 36] : [y1 - 36, y1 - 22];
  B(x0 + 24, x0 + 66, py[0], py[1], 50, 92, M({ color: '#d8ccb8', roughness: 1 }), { r: 8 }); B(x1 - 66, x1 - 24, py[0], py[1], 50, 92, M({ color: '#bca78c', roughness: 1 }), { r: 8 });
}
function armchair(x, y, rot) { const g = new THREE.Group(); const prev = CUR; CUR = g;
  B(-42, 42, -40, 40, 0, 12, mat.oak, { r: 2 }); B(-40, 40, -38, 38, 12, 42, mat.boucle, { r: 10 }); B(-40, 40, 18, 40, 42, 82, mat.boucle, { r: 12 });
  B(-40, -24, -38, 28, 42, 64, mat.boucle, { r: 9 }); B(24, 40, -38, 28, 42, 64, mat.boucle, { r: 9 }); B(-22, 22, -30, 14, 42, 52, mat.boucle, { r: 6 });
  CUR = prev; g.position.set(-x / 100, 0, y / 100); g.rotation.y = rot; g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); CUR.add(g); }
function pouf(x, y, r = 24, m = mat.boucle) { cyl(x, y, 0, 40, r, m, 40, r); sph(x, y, 40, r * .98, m, .12); }
function slipperChair(x, y, rot) { const g = new THREE.Group(); const prev = CUR; CUR = g;
  for (const [a, b] of [[-26, -22], [26, -22], [-26, 22], [26, 22]]) rodBetween([a, b, 0], [a * .95, b * .95, 26], 1.6, mat.oak);
  B(-30, 30, -28, 28, 26, 44, mat.boucle, { r: 6 }); B(-30, 30, 18, 30, 42, 86, mat.boucle, { r: 8 }); B(-24, 24, -22, 18, 44, 50, mat.boucle, { r: 5 });
  CUR = prev; g.position.set(-x / 100, 0, y / 100); g.rotation.y = rot; g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); CUR.add(g); }
function christmasTree(x, y, H, D, name, warn) { // H, D w cm; choinka z lampkami i bombkami
  const g = new THREE.Group(); g.name = name; g.visible = false; const prev = CUR; CUR = g;
  const needle = M({ color: '#2f4a33', roughness: .9 }), needle2 = M({ color: '#3b5a3d', roughness: .9 });
  cyl(x, y, 0, 30, D * .22, M({ map: T.cane, color: '#d9c19a', roughness: 1 }), 32, D * .2); cyl(x, y, 30, 60, 5, mat.oakD, 12);
  const tiers = 9; for (let i = 0; i < tiers; i++) { const t = i / tiers, h0 = 50 + t * (H - 70), h1 = h0 + (H - 50) / tiers * 1.9, r = (D / 2) * (1 - t * .92);
    const c = new THREE.Mesh(new THREE.ConeGeometry(r / 100, (h1 - h0) / 100, 28), i % 2 ? needle : needle2); c.position.set(-x / 100, (h0 + h1) / 200, y / 100); c.castShadow = true; c.receiveShadow = true; g.add(c); }
  const lm = new THREE.MeshStandardMaterial({ color: '#fff1cf', emissive: '#ffcf7a', emissiveIntensity: 3 }), orn = [M({ color: '#c9a050', metalness: .9, roughness: .25 }), M({ color: '#f1ece2', roughness: .3 }), M({ color: '#8c2f2f', roughness: .3 })];
  for (let k = 0; k < Math.round(H * 0.9); k++) { const h = 60 + rnd() * (H - 80), r = (D / 2) * (1 - (h - 50) / (H - 50) * .92) * (.82 + rnd() * .14), a = rnd() * 6.28;
    const m = new THREE.Mesh(new THREE.SphereGeometry((k % 3 ? 1.1 : 3.2) / 100, 8, 6), k % 3 ? lm : pick(orn)); m.position.set(-(x + Math.cos(a) * r) / 100, h / 100, (y + Math.sin(a) * r) / 100); g.add(m); }
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(.09), mat.brass); star.position.set(-x / 100, (H + 4) / 100, y / 100); g.add(star);
  const pl = new THREE.PointLight('#ffcf8a', 1.4, 4, 2); pl.position.set(-x / 100, H * .45 / 100, y / 100); g.add(pl);
  // obrys rzutu na podłodze: zielony = mieści się, czerwony = koliduje
  const ring = new THREE.Mesh(new THREE.RingGeometry(D / 200 - .02, D / 200, 64), new THREE.MeshBasicMaterial({ color: warn ? '#d0352b' : '#2e9b4e', transparent: true, opacity: .85 })); ring.rotation.x = -Math.PI / 2; ring.position.set(-x / 100, .02, y / 100); g.add(ring);
  CUR = prev; CUR.add(g); }
// wymiary choinki 4 m: pełna Ø210, smukła (slim) Ø110, „pencil” Ø80 (wg katalogów producentów 12–14 ft)
function treesFor(mode) {
  const P = { P: { pencil: [495, 195, 0], slim: [482, 195, 0], full: [435, 197, 1] }, L: { pencil: [497, 46, 0], slim: [482, 56, 1], full: [435, 197, 1] }, R: { pencil: [497, 320, 0], slim: [483, 322, 0], full: [435, 290, 1] } }[mode];
  christmasTree(P.pencil[0], P.pencil[1], 400, 80, 'TREE_pencil', P.pencil[2]); christmasTree(P.slim[0], P.slim[1], 400, 110, 'TREE_slim', P.slim[2]); christmasTree(P.full[0], P.full[1], 400, 210, 'TREE_full', P.full[2]);
}
function conceptK2W(mode = 'L', sideWall = false) {
  // --- ściana płd.: wypukłości (ramka szersza 1,5×) + obraz na środku, bez ramek z boku
  const cx = 316.5, Y = 101, R = Y + 16.5, G = 91, T = HR;
  B(cx - R, cx - Y, 0, 10, 0, T, mat.wall2); B(cx + Y, cx + R, 0, 10, 0, T, mat.wall2); B(cx - Y, cx + Y, 0, 10, 0, 13, mat.wall2); B(cx - Y, cx + Y, 0, 10, T - 10, T, mat.wall2);
  B(cx - Y, cx + Y, 0, 3, 13, T - 10, mat.wall2); B(cx - G, cx + G, 0, 10, 36, T - 20, mat.wall2);
  const ph0 = mode === 'L' ? 115 : 125, pw = 130, phh = 165;
  B(cx - pw / 2, cx + pw / 2, 10, 13, ph0, ph0 + phh, mat.oakD); B(cx - pw / 2 + 4, cx + pw / 2 - 4, 13, 13.4, ph0 + 4, ph0 + phh - 4, M({ map: paintTex(0), roughness: .7 }));
  B(cx - 2, cx + 2, 10, 17, ph0 + phh + 12, ph0 + phh + 20, mat.brass); B(cx - 34, cx + 34, 14, 21, ph0 + phh + 8, ph0 + phh + 12, mat.brass);
  { const l = new THREE.SpotLight('#ffd9a0', 4, 3, .9, .8, 2); l.position.set(-cx / 100, (ph0 + phh + 8) / 100, .2); l.target.position.set(-cx / 100, (ph0 + phh / 2) / 100, 0); CUR.add(l, l.target); }
  // --- wnęka obniżona do spodu podciągu (280 cm)
  const TOP = 280; B(0, NICHE + 1, 0, BEAM0, TOP, HN + 1, mat.wall);
  if (sideWall) { // zabudowa boku wnęki od strony holu: ścianka g-k 12,5 cm (CW75 + 2×12,5) do spodu podciągu
    const FD = 41.6; B(0, FD, BEAM0, BEAM1, 0, TOP, mat.wall); B(FD - 1, FD, BEAM0, BEAM1, 0, 10, mat.wall2); } // zlicowana z frontem zabudowy i z licem słupa/podciągu od strony korytarza
  // --- wnęka: zabudowa TV w ciepłej bieli
  const WB = M({ color: '#f7f2ea', roughness: .6, name: 'mebleB' }), WC = M({ color: '#f3ede3', roughness: .6, name: 'mebleC' }); // meble jaśniejsza ciepła biel niż ściany
  for (const [a, b] of [[0, 92], [302, 394]]) {
    B(0, 40, a, b, 0, 8, WC); B(0, 40, a, b, 8, 86, WB); const m = (a + b) / 2;
    for (const [p, q] of [[a + 1.5, m - .3], [m + .3, b - 1.5]]) { B(40, 41.2, p, q, 10, 84, WC); const c = B(41.2, 41.6, p + 5, q - 5, 16, 78, mat.cane); uvScale(c, 2.2); sph(42.6, p < m ? q - 4 : p + 4, 60, 1.4, mat.brass); }
    B(0, 42, a, b, 86, 90, WC); B(0, 40, a, b, 90, 160, WB); const sp = B(40, 40.6, a + 5, b - 5, 94, 156, mat.cane); uvScale(sp, 2.2);
    B(0, 40, a, b, 160, 163, WC); B(0, 36, a, a + 2.5, 163, TOP, WB); B(0, 36, b - 2.5, b, 163, TOP, WB);
    for (const h of [212, 252]) B(0, 34, a + 2, b - 2, h, h + 2.5, WC);
    for (const [h, mh] of [[163, 46], [214.5, 36], [254.5, 32]]) shelf('y', a + 3, b - 3, h, 32, mh, 0, 1);
  }
  for (let y = 93; y < 301; y += 2.6) B(2, 4.5, y, y + 1.9, 0, TOP, WC, { cast: false });
  B(4.5, 5.5, 102, 292, 61, 169, new THREE.MeshStandardMaterial({ color: '#ffe9c4', emissive: '#ffd99a', emissiveIntensity: 1.4 }), { cast: false });
  B(5.5, 9, 102.5, 291.5, 61, 169, mat.blackG); B(9, 9.3, 104, 290, 63, 167, mat.screen);
  B(4.5, 42, 104, 290, 20, 52, WC); for (const y of [166, 228]) B(42, 42.3, y - .3, y + .3, 22, 50, M({ color: '#d8cdbd' }));
  ledStrip(4.5, 40, 106, 288, 18, 20);
  for (const y of [46, 197, 348]) cyl(70, y, TOP - 1, TOP, 4, mat.glow, 16);
  // 2 głośniki sufitowe pomiędzy oczkami (grill Ø20 cm, malowany na kolor sufitu)
  { const gr = M({ color: '#ebe5dc', roughness: .9, name: 'grill' }), ring = M({ color: '#ddd5ca', roughness: .7, name: 'grillRing' });
    for (const y of [121.5, 272.5]) { cyl(70, y, TOP - .8, TOP, 11, ring, 40); cyl(70, y, TOP - 1, TOP - .2, 9.6, gr, 40); for (let k = -3; k <= 3; k++) B(70 + k * 2.6 - .3, 70 + k * 2.6 + .3, y - Math.sqrt(Math.max(0, 81 - (k * 2.6) ** 2)), y + Math.sqrt(Math.max(0, 81 - (k * 2.6) ** 2)), TOP - 1.15, TOP - 1, ring, { cast: false }); } }
  flushBooks();
  // --- meble
  if (mode === 'L') {
    sofa(355, 455, 90, 390, 255, 355, 290, 390, 'E', 'N');
    const ct = B(205, 320, 145, 260, 34, 40, mat.oak, { r: 6 }); uvScale(ct, 1); B(225, 300, 165, 240, 0, 34, mat.oak, { r: 4 });
    vaseFlowers(240, 200, 40, .75); B(150, 470, 70, 350, 0, 1.2, mat.rug);
  } else if (mode === 'R') {
    // narożnik obrócony o 90°: długi bok równolegle do ściany płd., szezlong przy oknie; fotele i puf od strony kuchni
    sofaStraight(150, 450, 30, 126, 'S');
    B(354, 450, 126, 236, 0, 12, mat.black); B(354, 450, 126, 236, 12, 40, mat.boucle, { r: 4 }); B(356, 448, 128, 234, 40, 50, mat.boucle, { r: 6 }); B(430, 450, 126, 236, 40, 64, mat.boucle, { r: 8 });
    const ct = B(200, 330, 150, 236, 34, 40, mat.oak, { r: 6 }); uvScale(ct, 1); B(215, 315, 165, 221, 0, 34, mat.oak, { r: 4 });
    vaseFlowers(240, 190, 40, .75); B(285, 320, 200, 228, 40, 46, M({ color: '#d9cbb5' }));
    slipperChair(225, 290, 0); slipperChair(310, 290, 0); // dwa siedziska bez podłokietników, przodem do stolika
    B(130, 470, 20, 370, 0, 1.2, mat.rug).material = mat.rug;
  } else {
    // dwie kanapy równoległe (prostopadle do okna i TV), stolik pośrodku
    sofaStraight(160, 400, 32, 128, 'S'); sofaStraight(160, 400, 262, 358, 'N');
    const ct = B(200, 360, 158, 232, 36, 42, mat.oak, { r: 4 }); uvScale(ct, 1); for (const [x, y] of [[204, 162], [356, 162], [204, 228], [356, 228]]) B(x - 3, x + 3, y - 3, y + 3, 0, 36, mat.oak);
    vaseFlowers(250, 195, 42, .75); B(300, 340, 180, 210, 42, 48, M({ color: '#d9cbb5' }));
    B(130, 440, 20, 370, 0, 1.2, mat.rug).material = mat.rug;
    for (const y of [30, 360]) { B(410, 455, y - 22, y + 22, 0, 52, mat.oak, { r: 3 }); lamp(432, y, 52); }
  }

  treesFor(mode === 'L' ? 'L' : mode === 'R' ? 'R' : 'P');
}

// ======================= K1W: koncepcja 1 bez ławy i drabiny + szafa po prawej =======================
function tvRelief(cx = 316.5) { // czerwona ramka +10 / pas wklęsły +3 / zielony panel +10 (cm od ściany)
  const R = 112, Y = 101, G = 91, T = HR;
  B(cx - R, cx - Y, 0, 10, 0, T, mat.wall2); B(cx + Y, cx + R, 0, 10, 0, T, mat.wall2); B(cx - Y, cx + Y, 0, 10, 0, 13, mat.wall2); B(cx - Y, cx + Y, 0, 10, T - 10, T, mat.wall2);
  B(cx - Y, cx + Y, 0, 3, 13, T - 10, mat.wall2);
  B(cx - G, cx + G, 0, 10, 36, T - 20, mat.wall2);
}
function conceptK1W(noSide = false) {
  // ściana TV: wypukłości wg szkicu, TV na zielonym panelu (+10 cm), konsola przed ramką
  tvRelief();
  B(196, 436, 10, 55, 0, 58, mat.black); for (const x of [276, 356]) B(x - .3, x + .3, 55, 55.3, 4, 54, mat.blackG);
  B(233, 399, 10, 13, 95, 190, mat.blackG); B(235, 397, 13, 13.3, 97, 188, mat.screen);
  lamp(225, 32, 58); sph(410, 32, 64, 6, mat.cer); B(380, 420, 20, 44, 58, 64, mat.oak);
  for (const x of [166, 467]) { photoFrame(x, 232, 48, 58, 0); photoFrame(x, 164, 48, 58, x > 300 ? 2 : 1); photoFrame(x, 96, 48, 58, x > 300 ? 0 : 2); sconceTV(x, 302); }
  // biblioteka: 4 wieże (bez ławy)
  const towers = [[0, 63.5], [63.5, 127], [127, 197], [197, 267]];
  for (const [a, b] of towers) {
    B(0, 42, a + .5, b - .5, 0, 10, mat.wall2); B(0, 45, a, b, 10, 85, mat.wall); const m = (a + b) / 2;
    for (const [p, q] of [[a + 1.5, m - .3], [m + .3, b - 1.5]]) { B(45, 47, p, q, 12, 83, mat.wall2); const c = B(47, 47.5, p + 5, q - 5, 17, 78, mat.cane); uvScale(c, 2.2); sph(48.5, (p < m ? q - 4 : p + 4), 58, 1.4, mat.brass); }
    B(0, 46, a, b, 85, 88, mat.wall2); B(0, 36, a, a + 2, 88, HN, mat.wall); B(0, 36, b - 2, b, 88, HN, mat.wall);
    for (const h of [135, 182, 229]) B(0, 34, a + 2, b - 2, h, h + 2.5, mat.wall);
    for (const [h, mh] of [[88, 47], [137.5, 44], [184.5, 44], [231.5, 44]]) shelf('y', a + 2, b - 2, h, 34, mh, 0, 1);
    B(30, 38, m - 15, m + 15, 270, 273, mat.brass); rodBetween([30, m, 271], [22, m, 280], .7, mat.brass);
    const s = new THREE.SpotLight('#ffd49a', 2.2, 2.4, 1.0, .8, 2); s.position.set(-.34, 2.66, m / 100); s.target.position.set(-.1, 1.4, m / 100); CUR.add(s, s.target);
  }
  // półki na krótkiej ścianie (zawinięcie L)
  if (!noSide) { B(45, 102, 0, 30, 0, 10, mat.wall2); B(45, 102, 0, 30, 10, 85, mat.wall); B(45, 102, 30, 31, 12, 83, mat.cane);
  for (const h of [85, 132, 179, 226]) { B(45, 102, 0, 30, h, h + 2.5, mat.wall); shelf('x', 46, 101, h + 2.5, 28, 44, 0, 1); }
  B(100, 102, 0, 30, 85, HN, mat.wall); }
  // SZAFA po prawej (od strony holu): 127 cm, gł. 45 (lico z biblioteką), do sufitu wnęki, 2 skrzydła z plecionką
  const Y0 = 267, Y1 = BEAM0, SD = 45, ym = (Y0 + Y1) / 2;
  B(0, SD, Y0, Y1, 0, 10, mat.wall2); B(0, SD - 2, Y0, Y1, 10, HN, mat.wall);
  B(0, SD + 1, Y0, Y0 + 2.5, 0, HN, mat.wall2); B(0, SD + 1, Y1 - 2.5, Y1, 0, HN, mat.wall2); // boki
  for (const [p, q] of [[Y0 + 2.5, ym - .4], [ym + .4, Y1 - 2.5]]) {
    B(SD - 2, SD, p, q, 10, 236, mat.wall2); B(SD - 2, SD, p, q, 238, HN - 2, mat.wall2); // drzwi + nadstawka
    for (const [h0, h1] of [[22, 112], [124, 224]]) { frameRect(p + 6, q - 6, SD, h0, h1, 2.4, 1.6, mat.wall2, 'y'); const c = B(SD, SD + .4, p + 9, q - 9, h0 + 3, h1 - 3, mat.cane); uvScale(c, 2.2); }
    frameRect(p + 6, q - 6, SD, 246, HN - 10, 2.4, 1.6, mat.wall2, 'y');
    const hx = p < ym ? q - 7 : p + 7; B(SD + 1.6, SD + 4.6, hx - .8, hx + .8, 98, 140, mat.brass); B(SD, SD + 4.6, hx - 1, hx + 1, 98, 100, mat.brass); B(SD, SD + 4.6, hx - 1, hx + 1, 138, 140, mat.brass);
  }
  B(SD - 2, SD + .8, Y0 + 2, Y1 - 2, 236, 238, mat.wall2);
  // oprawy w suficie wnęki
  for (const y of [60, 197]) cyl(70, y, HN - 1, HN, 4, mat.glow, 16);
  flushBooks();
  // salon jak w koncepcji 1
  sofa(152, 496, 317, 418, 396, 496, 141, 317, 'N', 'E');
  B(204, 352, 182, 300, 0, 4, mat.oakD); const ct = B(204, 352, 182, 300, 34, 40, mat.oak); uvScale(ct, 1); for (const [x, y] of [[208, 186], [348, 186], [208, 296], [348, 296]]) B(x - 3, x + 3, y - 3, y + 3, 4, 34, mat.oak);
  vaseFlowers(250, 230, 40, .8); B(290, 330, 220, 250, 40, 46, M({ color: '#d9cbb5' }));
  B(150, 510, 110, 405, 0, 1.2, mat.rug).material = mat.rug;
  B(180, 450, 422, 462, 76, 80, mat.oak); B(180, 450, 422, 462, 20, 23, mat.oak); for (const [x, y] of [[183, 425], [447, 425], [183, 459], [447, 459]]) B(x - 2, x + 2, y - 2, y + 2, 0, 76, mat.oak);
  lamp(420, 442, 80); vaseFlowers(220, 442, 80, .9); B(290, 340, 428, 456, 80, 86, mat.cer);
}

// ======================= K1B: biblioteka jak na zdjęciu (koncepcja 1 dopasowana) =======================
function plantFern(x, y, h, s = 1) { cyl(x, y, h, h + 14 * s, 8 * s, mat.white, 24, 6 * s); for (let i = 0; i < 26; i++) { const a = rnd() * 6.28, r = rnd() * 14 * s; const l = new THREE.Mesh(new THREE.SphereGeometry((3 + rnd() * 3) * s / 100, 8, 6), mat.leaf); l.scale.set(1, .5, 2.2); l.position.set(-(x + Math.cos(a) * r) / 100, (h + 18 * s + rnd() * 12 * s) / 100, (y + Math.sin(a) * r) / 100); l.rotation.set(rnd(), rnd() * 3, rnd()); l.castShadow = true; CUR.add(l); } }
function conceptK1B() {
  livingStd(); tvSouth();
  const W = mat.pp, n = 4, bw = BEAM0 / n, D0 = 50, D1 = 38;
  B(0, 1.5, 0, BEAM0, 0, HN, mat.wall2); B(0, NICHE, 0, BEAM0, HN - 1, HN, mat.wall2, { cast: false });
  // cokół + szafki dolne z plecionką
  B(0, D0 - 6, 0, BEAM0, 0, 10, W);
  for (let i = 0; i < n; i++) { const a = i * bw, b = a + bw, m = (a + b) / 2;
    B(0, D0, a, b, 10, 88, W);
    for (const [p, q] of [[a + 3, m - .4], [m + .4, b - 3]]) { B(D0, D0 + 2, p, q, 12, 86, W); const c = B(D0 + 2, D0 + 2.3, p + 6, q - 6, 18, 80, mat.cane); uvScale(c, 2.2); B(D0 + 2, D0 + 3, p, p + 6, 12, 86, W); B(D0 + 2, D0 + 3, q - 6, q, 12, 86, W); B(D0 + 2, D0 + 3, p, q, 12, 18, W); B(D0 + 2, D0 + 3, p, q, 80, 86, W);
      const hx = p < m ? q - 9 : p + 9; B(D0 + 3, D0 + 6, hx - .7, hx + .7, 50, 70, mat.brass); B(D0 + 3, D0 + 5, hx - .9, hx + .9, 50, 52, mat.brass); B(D0 + 3, D0 + 5, hx - .9, hx + .9, 68, 70, mat.brass); }
  }
  // blat ciemny
  B(0, D0 + 4, -1, BEAM0 + 1, 88, 91.5, M({ color: '#2a2b2c', roughness: .35, name: 'blat' }));
  // nadstawka: pilastry do fryzu, plecy, półki; fryz ciągły dosunięty do sufitu wnęki (bez gzymsów)
  const FZ = 238, FD = D1 + 3;
  for (let i = 0; i <= n; i++) { const y = i * bw; const y0 = Math.max(0, y - 3), y1 = Math.min(BEAM0, y + 3); B(0, D1 + 2, y0, y1, 91.5, FZ, W); B(D1 + 2, FD, y0 + .6, y1 - .6, 91.5, FZ, W); }
  for (let i = 0; i < n; i++) { const a = i * bw + 3, b = (i + 1) * bw - 3, m = (a + b) / 2;
    B(0, 1.5, a, b, 91.5, FZ, M({ color: '#ece4d8', roughness: .9 }));
    for (const h of [140, 190]) B(0, D1, a, b, h, h + 3, W);
    B(FD, FD + 3, m - 1.2, m + 1.2, 244, 254, mat.brass); B(FD + 1, FD + 8, m - 17, m + 17, 238, 242, mat.brass); B(FD + 3, FD + 7, m - 17, m + 17, 236.5, 238, mat.brass);
    const s = new THREE.SpotLight('#ffd49a', 2.4, 2.6, 1.0, .85, 2); s.position.set(-(FD + 5) / 100, 2.36, m / 100); s.target.position.set(-.1, 1.4, m / 100); CUR.add(s, s.target);
  }
  B(0, FD, 0, BEAM0, FZ, HN, W); B(FD - .5, FD, 0, BEAM0, FZ, FZ + 1.2, M({ color: '#e7ded0' }));
  // zawinięcie na krótką ścianę wnęki (ściana zewn., y=0): szafka narożna + półki + fryz
  { const x0 = D0, x1 = NICHE, m = (x0 + x1) / 2;
    B(x0, x1, 0, D0 - 6, 0, 10, W); B(x0, x1, 0, D0, 10, 88, W); B(x0 + 3, x1 - 3, D0, D0 + 2, 12, 86, W); const c = B(x0 + 9, x1 - 9, D0 + 2, D0 + 2.3, 18, 80, mat.cane); uvScale(c, 2.2);
    for (const [p, q, r, t] of [[x0 + 3, x0 + 9, 12, 86], [x1 - 9, x1 - 3, 12, 86], [x0 + 3, x1 - 3, 12, 18], [x0 + 3, x1 - 3, 80, 86]]) B(p, q, D0 + 2, D0 + 3, r, t, W);
    B(x1 - 12, x1 - 10.6, D0 + 3, D0 + 6, 50, 70, mat.brass);
    B(x0, x1 + 1, -1, D0 + 4, 88, 91.5, M({ color: '#2a2b2c', roughness: .35, name: 'blat' }));
    B(x0, x1, 0, 1.5, 91.5, FZ, M({ color: '#ece4d8', roughness: .9 })); B(x1 - 6, x1, 0, D1 + 2, 91.5, FZ, W); B(x1 - 5.4, x1 - .6, D1 + 2, FD, 91.5, FZ, W);
    for (const h of [140, 190]) B(x0, x1 - 6, 0, D1, h, h + 3, W);
    B(x0, x1, 0, FD, FZ, HN, W);
    B(m - 1.2, m + 1.2, FD, FD + 3, 244, 254, mat.brass); B(m - 14, m + 14, FD + 1, FD + 8, 238, 242, mat.brass);
    const s = new THREE.SpotLight('#ffd49a', 1.8, 2.4, 1.0, .85, 2); s.position.set(-m / 100, 2.36, (FD + 5) / 100); s.target.position.set(-m / 100, 1.4, .1); CUR.add(s, s.target);
    shelf('x', x0 + 2, x1 - 8, 193, 30, 44, 0, 1); sph(m, 18, 160, 13, mat.cer, .95); shelf('x', x0 + 2, x0 + 24, 91.5, 30, 44, 0, 1); }
  // dekoracje jak na zdjęciu: książki pion/poziom, wazony, paprotka, ramka
  rnd = (() => { let s = 777; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const dec = [[0, 'books', 'vase'], [1, 'vase', 'books'], [2, 'plant', 'books'], [3, 'books', 'frame']];
  for (const [i, top, mid] of dec) { const a = i * bw + 6, b = (i + 1) * bw - 6, m = (a + b) / 2;
    // półka górna (193)
    if (top === 'books') { shelf('y', a, a + 40, 193, 30, 50, 0, 1); cyl(18, b - 16, 193, 220, 7, mat.cer, 24, 9); }
    else if (top === 'vase') { sph(18, m - 12, 210, 15, mat.cer, .95); for (let k = 0; k < 4; k++) B(4, 26, b - 24, b - 4, 193 + k * 3.2, 196 + k * 3.2, M({ color: pick(['#e8e1d4', '#c9b79c', '#8c7b6b']) })); }
    else { plantFern(18, m, 193, 1.1); }
    // półka środkowa (143)
    if (mid === 'books') { shelf('y', b - 42, b, 143, 30, 46, 0, 1); sph(18, a + 18, 156, 12, mat.cer, .9); }
    else if (mid === 'vase') { sph(18, m, 162, 17, mat.cer, .95); }
    else { B(4, 6, m - 14, m + 14, 143, 178, mat.oakD); B(6, 6.3, m - 11, m + 11, 146, 175, M({ map: photoTex(1), roughness: .6 })); cyl(18, a + 16, 143, 156, 6, mat.cer); }
    // blat (91.5)
    if (i % 2 === 0) { sph(18, m, 106, 14, mat.cer, 1); for (let k = 0; k < 3; k++) B(4, 30, a + 6, a + 32, 91.5 + k * 3.4, 94.9 + k * 3.4, M({ color: pick(['#e8e1d4', '#d6c9b5']) })); }
    else { shelf('y', a, a + 30, 91.5, 30, 46, 0, 1); cyl(20, b - 20, 91.5, 104, 8, mat.oakD, 24, 7); sph(20, b - 20, 108, 5, mat.cer); }
  }
  flushBooks();
}
// nadbudowy z płyt zamiast listew: ściana TV + antresola + opaska wnęki
function builtUps() {
  const cx = 316.5;
  B(cx - 112, cx + 112, 0, 2.2, 0, HR, mat.wall2); B(cx - 92, cx + 92, 2.2, 3.6, 0, HR - 30, mat.wall2);
  for (const [a, b] of [[106, cx - 126], [cx + 126, 529]]) B(a, b, 0, 1.2, 330, HR - 30, mat.wall2);
  B(102, 106, 0, BEAM0, HN - 2, HN + 26, mat.wall2); B(102, 106, 0, 12, 0, HN, mat.wall2); B(102, 106, BEAM0 - 12, BEAM0, 0, HN, mat.wall2);
  B(102, 104.2, 18, BEAM0 - 18, 350, HR - 34, mat.wall2); B(104.2, 105.6, 48, BEAM0 - 48, 380, HR - 64, mat.wall2);
}

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
  { const up = { o: H.slab.o, h: [[[76, -45], [553, -45], [553, BEAM1], [76, BEAM1]].reverse()] }; extrude(up, 330, 600, mat.wall).name = 'CEIL'; }
  // szyb schodów na piętro (piętro nie jest jeszcze modelowane)
  { const c = B(-160, -15, 645, 1100, 600, 620, mat.wall); c.name = 'CEIL'; for (const w of [B(-160, -150, 645, 1100, 330, 600, mat.wall), B(-25, -15, 645, 1100, 330, 600, mat.wall), B(-160, -15, 645, 655, 330, 600, mat.wall), B(-160, -15, 1090, 1100, 330, 600, mat.wall)]) w.name = 'CEIL'; }
  // pustka salonu – ściany do góry
  B(76, 102, -45, BEAM0, 330, HR, mat.wall); B(-45, 600, BEAM0, BEAM1, 280, HR + 20, mat.wall); B(76, 580, -45, 0, 290, HR + 20, mat.wall);
  B(60, 102, -45, BEAM1, HN - 1, 340, mat.wall); // uszczelnienie styku strop / ściana łazienki nad wnęką
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
  const WC = w.ceil || 330; if (w.top < WC) R(a0, a1, c0, c1, w.top, WC, mat.wall);
  if (w.name.startsWith('G1')) { R(a0, a1, cm - 3, cm + 3, 0, w.top, mat.gdoor || mat.ral); for (let h = 50; h < w.top; h += 50) R(a0, a1, cm + 3, cm + 3.4, h - .4, h + .4, M({ color: '#2a2e31' })); return; }
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
  B(X0, X0 + 1, Y0, Y1, 0, HN, mat.hpl).material = mat.hpl; B(X1 - 1, X1, Y0, Y1, 0, HN, mat.hpl); B(X0, X1, Y0, Y0 + 1, 0, HN, mat.hpl); if (ZONE) { B(X0, -629, Y1 - 1, Y1, 0, HN, mat.hpl); B(-539, X1, Y1 - 1, Y1, 0, HN, mat.hpl); B(-629, -539, Y1 - 1, Y1, 205, HN, mat.hpl); } else B(X0, X1, Y1 - 1, Y1, 0, HN, mat.hpl);
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

// ================= STREFA DZIENNA (zone=1): salon + jadalnia + kuchnia + schody + spiżarnia/druga kuchnia + hol + gabinet =================
const RS = 330 / 18, GS_ = 27; // wysokość stopnia, głębokość stopnia
function sideShape(x0, x1, pts, m) { // kształt w płaszczyźnie (y,h), wyciągnięty wzdłuż x
  const sh = new THREE.Shape(pts.map(([y, h]) => new THREE.Vector2(y / 100, h / 100))); const g = new THREE.ExtrudeGeometry(sh, { depth: (x1 - x0) / 100, bevelEnabled: false });
  g.rotateY(-Math.PI / 2); g.translate(-x0 / 100, 0, 0); const me = new THREE.Mesh(g, m); me.castShadow = me.receiveShadow = true; CUR.add(me); return me; }
function frontShape(y0, y1, pts, m) { // kształt w płaszczyźnie (x,h), wyciągnięty wzdłuż y
  const sh = new THREE.Shape(pts.map(([x, h]) => new THREE.Vector2(-x / 100, h / 100))); const g = new THREE.ExtrudeGeometry(sh, { depth: (y1 - y0) / 100, bevelEnabled: false });
  g.translate(0, 0, y0 / 100); const me = new THREE.Mesh(g, m); me.castShadow = me.receiveShadow = true; CUR.add(me); return me; }
const oakVmap = T.oak.clone(); oakVmap.center.set(.5, .5); oakVmap.rotation = Math.PI / 2; oakVmap.needsUpdate = true;
Object.assign(mat, {
  ven: M({ map: oakVmap, color: '#f3dcbb', roughness: .42, name: 'fornir' }), venD: M({ color: '#6b5236', roughness: .8, name: 'frez' }),
  kOak: M({ map: oakVmap, color: '#f6ead8', roughness: .5, name: 'dabKuchnia' }), kCream: M({ color: '#efe8dc', roughness: .5, name: 'kremKuchnia' }),
  stone: M({ map: T.marble, color: '#f4eee6', roughness: .15, name: 'kamien' }), sink: M({ color: '#f7f6f3', roughness: .12, name: 'ceramika' }),
  rattan: M({ map: T.cane, color: '#d9b98c', roughness: .9, name: 'rattan' }),
});

function hsWindow(y0, y1, top = 240) { // HS Yawal DP 180, RAL 7016, dwie kwatery, przesuwna od wewnątrz
  const R = mat.ral, xa = 536, xb = 552, f = 7, m = (y0 + y1) / 2;
  B(xa, xb, y0, y1, 0, 3, R); B(xa, xb, y0, y1, top - 7, top, R); B(xa, xb, y0, y0 + f, 0, top, R); B(xa, xb, y1 - f, y1, 0, top, R);
  const sash = (p, q, xs, xe) => { B(xs, xe, p, q, 3, 11, R); B(xs, xe, p, q, top - 15, top - 7, R); B(xs, xe, p, p + 8, 3, top - 7, R); B(xs, xe, q - 8, q, 3, top - 7, R);
    const g = plane((xs + xe) / 2, (p + q) / 2, top / 2, q - p - 16, top - 26, mat.glass, Math.PI / 2); g.castShadow = false; };
  sash(y0 + f, m + 5, 545, 551); sash(m - 5, y1 - f, 537, 543);
  B(533, 537, m + 4, m + 7, 95, 125, R); // klamka HS
  B(531, 580, y0, y1, top, 330, mat.wall); // nadproże
}
function zoneShell() {
  const H = HOUSE;
  const fp = extrude(H.foot, -12, 0, mat.floor, { cast: false }); { const uv = fp.geometry.attributes.uv, p = fp.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) * .25, p.getZ(i) * .25); }
  for (const w of H.walls) extrude(w, 0, HN, mat.wall);
  for (const w of H.ins) extrude(w, -12, 330, mat.wall2);
  for (const h of H.heads) extrude(h, 205, HN, mat.wall);
  B(-172, -133, 250, 277, 0, HN, mat.wall); B(-482, -458, 396, 421, 0, HN, mat.wall); // obudowa pionu przy WC (bez szczeliny)
  // strop z otworem nad salonem i klatką schodową (bieg 1 + spocznik + bieg 2 nad spiżarnią)
  const stairHole = [[-135, 640], [-25, 640], [-25, 977], [-300, 977], [-300, 916], [-135, 916]];
  for (const p of H.slabP) extrude(p, HN, 330, mat.wall).name = 'CEIL';
  for (const p of H.upP) extrude(p, 330, 600, mat.wall).name = 'CEIL'; // bryła piętra (niemodelowane) z szybem schodów
  // pustka salonu – ściany do góry
  B(76, 102, -45, BEAM0, 330, HR, mat.wall); B(-45, 600, BEAM0, BEAM1, 280, 330, mat.wall); // antresola – nad podciągiem otwarte B(76, 580, -45, 0, 290, HR + 20, mat.wall);
  B(60, 102, -45, BEAM1, HN - 1, 340, mat.wall);
  B(76, 600, -45, BEAM0, HR, HR + 25, mat.wall).name = 'CEIL'; B(COL, 580, -45, 0, 0, HR + 20, mat.wall); B(COL, 580, BEAM0, 528, 0, 330, mat.wall);
  B(-25, 0, BEAM0, BEAM1, 0, 290, mat.wall);
  // podciągi wg DWG: nad przejściem jadalnia–hol 25×40 (spód ok. 265 cm wg przekroju), w garderobie 2× 25×35 (spód ok. 273 cm)
  B(-25, 0, BEAM1, 916.3, 265, HN, mat.wall).name = 'BEAM'; // podciąg biegnie do ściany spiżarni
  B(-640, -339, 1072, 1097, 273, HN, mat.wall).name = 'BEAM'; // drugi podciąg (od strony czarnych szaf) usunięty
  // siłownia w parterowym skrzydle: niższy sufit ok. 256 cm (przekrój DWG, podciąg 25×51)
  B(-339, 306, 1303, 1723, 256, HN, mat.wall).name = 'CEIL';
  // okna wg oferty Yawal: jadalnia poz. 4 HS 2700×2400, kuchnia poz. 5 HS 2400×2400 (osadzone w osi otworów z DWG)
  const D0 = 687.5 - 135, D1 = 687.5 + 135, K0 = 1085.5 - 120, K1 = 1085.5 + 120;
  B(COL, 580, 520, D0, 0, 330, mat.wall); B(COL, 580, D1, K0, 0, 330, mat.wall); B(COL, 580, K1, 1215, 0, 330, mat.wall);
  hsWindow(D0, D1); hsWindow(K0, K1); window.__WIN = { D0, D1, K0, K1 };
  for (const w of H.wins) windowUnit(w);
  // fasada W1 salonu (poz. 7 FA 50 N 3940×5720)
  const fx = 553; for (const y of [0, 132.2, 261.9, 394]) B(fx - 3, fx + 5, y - 2.5, y + 2.5, 0, 572, mat.ral);
  for (const h of [0, 15, 221, 236, 286, 507, 557, 572]) B(fx - 3, fx + 5, 0, BEAM0, h - 1.5, h + 1.5, mat.ral);
  B(fx - 6, fx + 30, -5, BEAM0, 572, HR + 20, mat.wall);
  const gl = plane(fx + 1, 197, 286, 390, 572, mat.glass, Math.PI / 2); gl.castShadow = false;
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), M({ color: '#7fae50', roughness: 1 })); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, -0.13, 6); lawn.receiveShadow = true; CUR.add(lawn);
  for (const [x, y, r, w] of [[1500, 600, Math.PI / 2, 3600], [-700, -1500, 0, 4000]]) { const g = plane(x, y, 450, w, 1200, mat.garden, r); g.castShadow = false; g.name = 'GARDEN'; }
}
function zoneFloors() {
  tiled(-529, -25, 419, 646, mat.checker, .55);   // hol – szachownica jak na wizualizacji
  tiled(-244, -25, 277, 394, mat.octa, .42);        // WC
}

// ---------- HOL: fornir dębowy z frezami, czarne drzwi wejściowe z doświetlami, przeszklone drzwi dębowe ----------
function veneerRun(axis, a0, a1, c, dir, h1 = HN, skip = []) { // panele fornirowane 2 cm z frezem co ~48 cm
  const n = Math.max(1, Math.round((a1 - a0) / 48)), w = (a1 - a0) / n;
  for (let i = 0; i < n; i++) { const p = a0 + i * w, q = p + w; if (skip.some(([s, e]) => q > s + 1 && p < e - 1)) continue;
    const R = (pp, qq, c0, c1, h0, hh, m) => axis === 'x' ? B(pp, qq, Math.min(c0, c1), Math.max(c0, c1), h0, hh, m) : B(Math.min(c0, c1), Math.max(c0, c1), pp, qq, h0, hh, m);
    R(p + .4, q - .4, c, c + dir * 2, 0, h1, mat.ven); R(p - .4, p + .4, c, c + dir * .6, 0, h1, mat.venD); }
}
function glazedDoubleDoor(x, y0, y1, top = 240) { // dwuskrzydłowe, dąb, szprosy (jak na wizualizacji wejścia)
  const O = mat.ven, f = 7, m = (y0 + y1) / 2;
  B(x - 6, x + 6, y0 - 6, y0, 0, top + 6, O); B(x - 6, x + 6, y1, y1 + 6, 0, top + 6, O); B(x - 6, x + 6, y0 - 6, y1 + 6, top, top + 6, O);
  for (const [p, q] of [[y0, m - .3], [m + .3, y1]]) { B(x - 2.5, x + 2.5, p, p + f, 0, top, O); B(x - 2.5, x + 2.5, q - f, q, 0, top, O); B(x - 2.5, x + 2.5, p, q, 0, 14, O); B(x - 2.5, x + 2.5, p, q, top - f, top, O);
    const yc = (p + q) / 2; B(x - 2, x + 2, yc - 1.2, yc + 1.2, 14, top - f, O); for (const h of [62, 122, 182]) B(x - 2, x + 2, p + f, q - f, h - 1.2, h + 1.2, O);
    const g = plane(x, yc, top / 2, q - p - 2 * f, top - 21, mat.glass, Math.PI / 2); g.castShadow = false;
    const hy = p < m ? q - 5 : p + 5; for (const s of [-1, 1]) B(x + s * 2.5, x + s * 4.5, hy - 1, hy + 1, 95, 135, mat.brass); }
}
function zoneHall() {
  const Y0 = 419, Y1 = 646, XD = -220; // XD – przeszklone drzwi dzielące hol (czerwona linia)
  // fornir: ściana płd. (drzwi do gabinetu i WC jako drzwi ukryte w fornirze), płn., zach.
  veneerRun('x', -529, -25, Y0, 1, HN);
  veneerRun('x', -529, -520, 648, -1, HN); veneerRun('x', -440, -407, 648, -1, HN); veneerRun('x', -282, -147, 648, -1, HN);
  // ukryte drzwi do garderoby (otwór z DWG x -520…-440) – skrzydło w fornirze, frez, mosiężna klamka
  B(-520, -440, 646, 648, 208, HN, mat.ven); B(-520.6, -519.4, 645.4, 648, 0, 208, mat.venD); B(-440.6, -439.4, 645.4, 648, 0, 208, mat.venD); B(-520, -440, 645.4, 648, 207.4, 208.4, mat.venD);
  B(-519.4, -440.6, 646, 648, 0, 207.4, mat.ven); { const hx = -449; B(hx - 1, hx + 1, 641, 646, 103, 106, mat.brass); B(hx - 13, hx + 1, 639.5, 641, 103, 106, mat.brass); }
  // ukryta szafa we wnęce (x -407…-282, gł. 60) – fronty w fornirze zlicowane ze ścianą, bez uchwytów
  B(-407, -282, 648, 706, 0, HN, mat.kOak); { const n = 3, w = 125 / n; for (let i = 0; i < n; i++) { const a = -407 + i * w; B(a + .3, a + w - .3, 646, 648, 0, HN, mat.ven); B(a - .3, a + .3, 645.6, 648, 0, HN, mat.venD); } B(-282.3, -281.7, 645.6, 648, 0, HN, mat.venD); B(-407, -282, 645.6, 648, 214.7, 215.3, mat.venD); }
  veneerRun('y', Y0, 484 - 40, -529, 1, HN); veneerRun('y', 577 + 40, Y1, -529, 1, HN);
  B(-529, -527, 444, 617, 240, HN, mat.ven);
  // drzwi ukryte w fornirze (gabinet, WC) – klamki mosiężne
  for (const [a, b] of [[-405, -315], [-169, -79]]) { B(a, b, Y0 + 2, Y0 + 2.6, 0, 210, mat.venD); B(a + 1, b - 1, Y0 + 2.6, Y0 + 3, 1, 209, mat.ven);
    const hx = a + 8; B(hx - 1, hx + 1, Y0 + 3, Y0 + 7, 103, 106, mat.brass); B(hx - 1, hx + 13, Y0 + 6, Y0 + 7.5, 103, 106, mat.brass); }
  // przeszklone drzwi dębowe + fornir po bokach i nad drzwiami
  const d0 = 452, d1 = 612; glazedDoubleDoor(XD, d0, d1);
  B(XD - 6, XD + 6, Y0, d0 - 6, 0, HN, mat.ven); B(XD - 6, XD + 6, d1 + 6, Y1, 0, HN, mat.ven); B(XD - 6, XD + 6, d0 - 6, d1 + 6, 246, HN, mat.ven);
  for (const y of [Y0 + 15, d1 + 17]) B(XD - 6.4, XD + 6.4, y - .4, y + .4, 0, HN, mat.venD);
  // drzwi wejściowe czarne z doświetlami (D1 + doświetla z DWG)
  const xw = -553; B(xw - 4, xw + 4, 438, 625, 0, 4, mat.black); B(xw - 4, xw + 4, 438, 625, 236, 240, mat.black);
  for (const y of [438, 474, 588, 625]) B(xw - 4, xw + 4, y - 3, y + 3, 0, 240, mat.black);
  for (const [p, q] of [[441, 471], [591, 622]]) { const g = plane(xw, (p + q) / 2, 120, q - p - 6, 228, mat.glass, Math.PI / 2); g.castShadow = false; }
  B(xw - 3, xw + 3, 477, 585, 0, 236, mat.black); B(xw + 3, xw + 4, 490, 572, 24, 216, mat.blackG); B(xw + 4, xw + 4.8, 496, 566, 30, 210, mat.black);
  B(xw + 4, xw + 10, 576, 579, 98, 104, mat.brass); B(xw + 8, xw + 10, 562, 579, 99, 103, mat.brass);
  B(-577, -529, 438, 625, 240, HN, mat.wall); B(-577, -529, 419, 438, 0, 240, mat.wall); B(-577, -529, 625, 646, 0, 240, mat.wall);
  // konsola dębowa + lustro łukowe + lampa + 2 pufy (jak na wizualizacji)
  // konsola dębowa + lustro łukowe + lampa + 2 pufy – ściana płd. między wejściem a drzwiami do gabinetu
  const cy = 421; B(-512, -422, cy + 2, cy + 34, 82, 86, mat.ven); for (const x of [-508, -426]) B(x - 2.5, x + 2.5, cy + 4, cy + 30, 0, 82, mat.ven);
  B(-512, -422, cy + 4, cy + 30, 18, 20, mat.ven);
  { const g = new THREE.Group(); const arch = new THREE.Mesh(new THREE.TorusGeometry(.34, .018, 8, 32, Math.PI), mat.brass); arch.position.set(0, 1.94, 0); g.add(arch);
    for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(.036, .9, .03), mat.brass); r.position.set(s * .34, 1.49, 0); g.add(r); }
    const mir = new THREE.Mesh(new THREE.PlaneGeometry(.66, .9), mat.mirror); mir.position.set(0, 1.49, .005); g.add(mir); const mt = new THREE.Mesh(new THREE.CircleGeometry(.33, 32, 0, Math.PI), mat.mirror); mt.position.set(0, 1.94, .005); g.add(mt);
    g.position.set(4.67, 0, (cy + 3) / 100); CUR.add(g); }
  lamp(-495, cy + 18, 86); vaseFlowers(-440, cy + 18, 86, .8);
  for (const x of [-487, -447]) B(x - 19, x + 19, cy + 8, cy + 40, 0, 40, mat.linen, { r: 0.04 });
  for (const x of [-480, -360, -120]) cyl(x, 532, HN - 1, HN, 5, mat.glow, 16);
  areaLight(-290, 532, 285, 1.4, .6, 60, 'AREA_HOL');
}

// ---------- GABINET (cały: także część pod WC aż do ściany salonu) ----------
function zoneOffice() {
  // biurko (wg DWG), krzesło
  B(-287, -113, 95, 155, 73, 77, mat.oak); for (const x of [-281, -119]) { B(x - 3, x + 3, 98, 152, 0, 73, mat.black); }
  B(-285, -115, 99, 151, 60, 62, mat.black);
  lamp(-140, 125, 77); B(-250, -200, 110, 140, 77, 79, mat.black);
  { const g = new THREE.Group(); const prev = CUR; CUR = g; B(-24, 24, -24, 24, 44, 52, mat.boucle, { r: 0.03 }); B(-24, 24, 18, 26, 52, 95, mat.boucle, { r: 0.04 }); for (const [a, b] of [[-20, -20], [20, -20], [-20, 20], [20, 20]]) rodBetween([a, b, 0], [a, b, 44], 1.4, mat.oak);
    CUR = prev; g.position.set(2.0, 0, 1.85); CUR.add(g); }
  armchair(-200, 52, Math.PI); // fotel po drugiej stronie biurka
  // szafy wnękowe dębowe (wg DWG, ściana wsch. gabinetu)
  B(-82, -25, 2, 250, 0, 10, mat.oakD); B(-82, -25, 2, 250, 10, HN, mat.kOak);
  for (let y = 2; y < 248; y += 62) { B(-83.5, -82, y + .5, y + 61.5, 12, HN - 3, mat.kOak); B(-85, -83.5, y + (Math.round((y - 2) / 62) % 2 ? 6 : 56), y + (Math.round((y - 2) / 62) % 2 ? 8 : 58), 80, 170, mat.brass); }
  // regał przy ścianie zach. przy WC (wg DWG)
  B(-316, -281, 250, 392, 0, 2, mat.kOak); B(-283, -281, 250, 392, 2, HN, mat.kOak); for (const y of [250, 390]) B(-316, -281, y, y + 2, 0, HN, mat.kOak); for (const h of [40, 90, 140, 190, 240]) B(-316, -281, 250, 392, h, h + 2, mat.oak);
  shelf('y', 254, 388, 92, 30, 46, -283, -1); shelf('y', 254, 388, 142, 30, 46, -283, -1); shelf('y', 254, 388, 192, 30, 46, -283, -1);
  // strefa wypoczynkowa: sofa, stolik, 2 fotele
  B(-622, -556, 85, 315, 0, 12, mat.black); B(-622, -556, 85, 315, 12, 40, mat.boucle, { r: 0.04 }); B(-622, -600, 85, 315, 40, 82, mat.boucle, { r: 0.08 });
  for (const [a, b] of [[85, 105], [295, 315]]) B(-622, -556, a, b, 40, 64, mat.boucle, { r: 0.08 }); for (let i = 0; i < 3; i++) B(-600, -558, 106 + i * 63, 168 + i * 63, 40, 50, mat.boucle, { r: 0.06 });
  B(-490, -420, 135, 270, 0, 40, mat.oak); B(-488, -422, 137, 268, 40, 42, mat.oak);
  armchair(-470, 50, Math.PI); armchair(-470, 345, 0);
  const rg = B(-600, -400, 60, 330, 0, 1, mat.rug); uvScale(rg, .5);
  for (const [x, y] of [[-480, 200], [-180, 150], [-180, 330]]) cyl(x, y, HN - 1, HN, 5, mat.glow, 16);
  flushBooks(); areaLight(-330, 200, 286, 2.5, 2, 70, 'AREA_GAB');
}

// ---------- SCHODY (bieg 1 zabudowany, balustrada czarna, poręcz dębowa, marmurowy pierwszy stopień) ----------
function zoneStairs() {
  // wg DWG: bieg 1 – 13×18,3 / 27 (x -136…-25, w górę na północ), spocznik y 970…1072, bieg 2 – 5×18,3 / 27 (x -243…-136, z powrotem na południe do holu piętra)
  const X0 = -135, X1 = -25, y0 = 646, n1 = 12, yL = y0 + n1 * GS_, hL = (n1 + 1) * RS, YN = 1072, XW = -243, XM = -136;
  // bieg 1 jako płyta schodkowa ze skośnym spodem – pod schodami wolna przestrzeń
  const pts = []; for (let i = 1; i < n1; i++) pts.push([y0 + i * GS_, (i + 1) * RS - 3], [y0 + (i + 1) * GS_, (i + 1) * RS - 3]);
  pts.push([yL, n1 * RS - 30], [y0 + GS_, 0]);
  sideShape(X0, X1, pts, mat.wall);
  for (let i = 1; i < n1; i++) { const y = y0 + i * GS_, h = (i + 1) * RS; B(X0, X1, y, y + 1.5, h - RS - 3, h - 3, mat.pp); B(X0, X1 + 2.5, y - 2.5, y + GS_, h - 3, h, mat.oak); }
  B(X0, X1, yL, yL + 1.5, hL - RS - 3, hL - 3, mat.pp);
  // spocznik na całą szerokość klatki
  B(XW, X1, yL, YN, hL - 20, hL - 3, mat.wall); B(XW, X1, yL - 2.5, YN, hL - 3, hL, mat.oak);
  // bieg 2: 4 stopnie w stronę holu (ostatni podstopień na krawędzi stropu y 862)
  const p2 = [[yL, hL - 20]]; for (let k = 1; k <= 4; k++) { const ya = yL - (k - 1) * GS_, yb = yL - k * GS_, h = hL + k * RS;
    B(XW, XM, ya - 1.5, ya, h - RS - 3, h - 3, mat.pp); B(XW, XM, yb, ya + 2.5, h - 3, h, mat.oak); }
  const yT = yL - 4 * GS_; B(XW, XM, yT - 1.5, yT, 330 - RS, 330, mat.pp);
  sideShape(XW, XM, [[yL, hL - 3], [yL - GS_, hL - 3], [yL - GS_, hL + RS - 3], [yL - 2 * GS_, hL + RS - 3], [yL - 2 * GS_, hL + 2 * RS - 3], [yL - 3 * GS_, hL + 2 * RS - 3], [yL - 3 * GS_, hL + 3 * RS - 3], [yT, hL + 3 * RS - 3], [yT, 300], [yL, hL - 20]], mat.wall);
  const top = y => RS + (y - y0) * RS / GS_ + 14;
  // pierwszy stopień marmurowy z zaokrąglonym końcem
  B(X0, -12, y0 - 6, y0 + GS_, 0, RS, mat.marble);
  { const s = new THREE.Mesh(new THREE.CylinderGeometry((GS_ + 6) / 200, (GS_ + 6) / 200, RS / 100, 32, 1, false, 0, Math.PI), mat.marble); s.position.set(.12, RS / 200, (y0 - 6 + GS_ + 6 + y0 - 6) / 200); s.rotation.y = Math.PI; s.castShadow = s.receiveShadow = true; CUR.add(s); }
  // balustrada biegu 1: czarne tralki, słupek, poręcz dębowa
  const xb = X1 - 3, hr = 92;
  for (let i = 1; i < n1; i++) for (const d of [-6, 6]) { const yy = y0 + i * GS_ + GS_ / 2 + d, h = (i + 1) * RS; rodBetween([xb, yy, h], [xb, yy, h + hr + (d + 6) / GS_ * RS - 4], .7, mat.black); }
  cyl(-10, y0 + 8, RS, RS + 98, 3, mat.black, 16); cyl(-10, y0 + 8, RS + 98, RS + 104, 4.2, mat.black, 16); sph(-10, y0 + 8, RS + 106, 3.6, mat.black);
  rodBetween([-10, y0 + 8, RS + 100], [xb, y0 + GS_ * 1.5, 2 * RS + hr], 2.4, mat.oak);
  rodBetween([xb, y0 + GS_ * 1.5, 2 * RS + hr], [xb, 914, top(914) - 14 + hr - RS + 2], 2.4, mat.oak);
  // balustrada biegu 2 i krawędzi otworu na piętrze (od strony biegu 1)
  const xr = XM + 2; for (let k = 1; k <= 4; k++) for (const d of [-6, 6]) { const yy = yL - k * GS_ + GS_ / 2 + d, h = hL + k * RS; rodBetween([xr, yy, h], [xr, yy, h + hr], .7, mat.black); }
  rodBetween([xr, yL, hL + hr], [xr, yT, 330 + hr], 2.4, mat.oak);
  cyl(xr, yL - 2, hL, hL + hr + 6, 3, mat.black, 16);
  // chodnik na stopniach
  for (let i = 1; i < n1; i++) { const yy = y0 + i * GS_, h = (i + 1) * RS; B(X0 + 22, X1 - 22, yy - 2.6, yy + GS_, h, h + .6, mat.runner); B(X0 + 22, X1 - 22, yy - 2.6, yy - 2, h - RS + 1, h, mat.runner); }
}

// ---------- SPIŻARNIA z DRUGĄ KUCHNIĄ (pomieszczenie pod biegiem 2, za ścianą schodów) ----------
function zoneScullery() {
  const XE = -147, XW = -327;
  // blat wzdłuż ściany schodów (wg DWG 50×300) – fronty kremowe, blat kamienny, zlew ceramiczny, płyta domino
  const xa = XE - 60, ya = 676, yb = 975;
  B(xa, XE, ya, yb, 0, 10, mat.oakD); B(xa + 2, XE, ya, yb, 10, 88, mat.kCream);
  const n = 5, w = (yb - ya) / n; for (let i = 0; i < n; i++) { const p = ya + i * w; B(xa + .8, xa + 2, p + .4, p + w - .4, 12, 86, mat.kCream); B(xa, xa + .8, p + 4, p + w - 4, 16, 82, mat.kCream);
    sph(xa - 1, p + w / 2, 76, 1.6, mat.brass); }
  const ct = B(xa - 2, XE, ya, yb, 88, 92, mat.stone); uvScale(ct, 1.4);
  B(xa + 8, XE - 6, 822, 884, 70, 92.1, mat.sink); B(xa + 12, XE - 10, 826, 880, 72, 92.2, M({ color: '#e9e7e2', roughness: .2 }));
  cyl(XE - 4, 853, 92, 122, 1.3, mat.brass); rodBetween([XE - 4, 853, 121], [XE - 22, 853, 116], 1.2, mat.brass); for (const d of [-10, 10]) cyl(XE - 5, 853 + d, 92, 99, 1.4, mat.brass);
  B(xa + 8, XE - 6, 700, 760, 92, 92.6, mat.blackG); for (const yy of [714, 746]) cyl(xa + 30, yy, 92.6, 92.8, 8, M({ color: '#2a2a2a', roughness: .2 }), 24);
  // zellige do 150 cm + 2 półki dębowe
  const bs = B(XE - 1.2, XE, ya, yb, 92, 150, mat.mosaic); uvScale(bs, 1.4);
  for (const h of [158, 200]) { B(XE - 26, XE, ya + 10, 900, h, h + 3.5, mat.oak); for (let yy = ya + 20; yy < 890; yy += 24) cyl(XE - 13, yy, h + 3.5, h + 14 + (yy % 3) * 4, 5, yy % 2 ? mat.cer : mat.white, 16); }
  // spiżarnia: regał dębowy od podłogi do sufitu na ścianie zach. (słoje, kosze)
  const sx0 = XW, sx1 = XW + 38, sy0 = 726, sy1 = 1062;
  B(sx0, sx1, sy0, sy1, 0, 10, mat.oakD); for (const yy of [sy0, (sy0 + sy1) / 2, sy1 - 2]) B(sx0, sx1, yy, yy + 2, 10, HN, mat.kOak);
  for (const h of [10, 50, 90, 125, 160, 195, 230, 265]) B(sx0, sx1, sy0, sy1, h, h + 2.5, mat.kOak);
  for (const h of [12.5, 52.5]) for (let yy = sy0 + 6; yy < sy1 - 40; yy += 42) B(sx0 + 4, sx1 - 2, yy, yy + 36, h, h + 26, mat.rattan, { r: 0.02 });
  for (const h of [92.5, 127.5, 162.5, 197.5]) for (let yy = sy0 + 10; yy < sy1 - 10; yy += 16) { const t = rnd(); cyl(sx0 + 20, yy, h, h + 14 + t * 12, 5.5, t < .5 ? mat.glass : mat.cer, 16); if (t < .5) cyl(sx0 + 20, yy, h + 14 + t * 12, h + 17 + t * 12, 5.6, mat.oak, 16); }
  // szafa pod spocznikiem (wg DWG)
  B(-147, -27, 930, 975, 0, 182, mat.kCream); for (let x = -147; x < -30; x += 39.3) { B(x + .4, x + 38.9, 975, 976.2, 2, 180, mat.kCream); sph(x + 33, 977.5, 100, 1.4, mat.brass); }
  // drzwi do korytarza (zach.) + oświetlenie
  doorLeaf(-339, 980, -327, 1064, 1);
  for (const yy of [760, 900, 1020]) cyl(-237, yy, HN - 1, HN, 5, mat.glow, 16);
  areaLight(-237, 880, 286, 1.2, 2.6, 70, 'AREA_SPIZ');
  // podłoga – płytki ośmiokątne
  tiled(-327, -147, 673, 1067, mat.octa, .5); tiled(-147, -25, 928, 1067, mat.octa, .5);
}

// ---------- KUCHNIA (blat jak na wizualizacji: słupki dębowe po bokach, pośrodku blat + kuchnia + biały okap) ----------
function tallOak(a, b, YF, YB, top = HN, m = mat.kOak, handles = 'bar') {
  B(a, b, YF + 4, YB, 0, 10, mat.oakD); B(a, b, YF + 1, YB, 10, top, m);
  const n = Math.max(1, Math.round((b - a) / 58)), w = (b - a) / n;
  for (let i = 0; i < n; i++) { const p = a + i * w, q = p + w;
    for (const [h0, h1] of [[11, 208], [210, top - 1]]) { B(p + .3, q - .3, YF - .6, YF + 1, h0, h1, m); for (const [r0, r1, s0, s1] of [[p + .3, p + 7, h0, h1], [q - 7, q - .3, h0, h1], [p + .3, q - .3, h0, h0 + 7], [p + .3, q - .3, h1 - 7, h1]]) B(r0, r1, YF - 1.6, YF - .6, s0, s1, m); }
    const hx = i % 2 ? p + 4.5 : q - 4.5; if (handles === 'bar') { B(hx - .8, hx + .8, YF - 5.5, YF - 1.6, 75, 175, mat.brass); for (const h of [78, 172]) B(hx - .8, hx + .8, YF - 5.5, YF - 1.6, h - 1, h + 1, mat.brass); B(hx - .8, hx + .8, YF - 4.5, YF - 1.6, 212, 228, mat.brass); } }
}
function drawerStack(a, b, YF, rows = [10, 32, 59, 86], dir = -1) { // dir: -1 front w stronę -y, +1 w stronę +y
  const Y = (p, q) => [YF + dir * Math.min(p, q), YF + dir * Math.max(p, q)].sort((u, v) => u - v);
  for (let r = 0; r < rows.length - 1; r++) { const h0 = rows[r] + .3, h1 = rows[r + 1] - .3; B(a + .3, b - .3, ...Y(-1, .6), h0, h1, mat.kOak);
    for (const [r0, r1, s0, s1] of [[a + .3, a + 6, h0, h1], [b - 6, b - .3, h0, h1], [a + .3, b - .3, h0, h0 + 5], [a + .3, b - .3, h1 - 5, h1]]) B(r0, r1, ...Y(.6, 1.4), s0, s1, mat.kOak);
    const c = (a + b) / 2, hh = (h0 + h1) / 2 + 2; B(c - 12, c + 12, ...Y(3, 4), hh - .7, hh + .7, mat.brass); for (const s of [-12, 12]) B(c + s - .7, c + s + .7, ...Y(1.4, 4), hh - .7, hh + .7, mat.brass); }
}
function stool(x, y) { // hoker dębowy z okrągłym siedziskiem i lnianą poduszką
  for (const [dx, dy] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) rodBetween([x + dx, y + dy, 0], [x + dx * .6, y + dy * .6, 64], 1.6, mat.oak);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.125, .009, 8, 32), mat.oak); ring.rotation.x = Math.PI / 2; ring.position.set(-x / 100, .24, y / 100); ring.castShadow = true; CUR.add(ring);
  cyl(x, y, 63, 67, 18, mat.oak, 32); cyl(x, y, 67, 74, 18, mat.linen, 32, 17); sph(x, y, 74, 17, mat.linen, .18);
  for (const s of [-1, 1]) rodBetween([x + s * 17, y - 3, 70], [x + s * 18.5, y - 4, 60], .5, mat.linen);
}
function zoneKitchen() {
  const YB = 1278, D = 64, YF = YB - D;
  // ściana płn.: słupki | blat z szufladami + kuchnia wolnostojąca + okap | słupki
  const L0 = -13, L1 = 107, R0 = 411, R1 = 531, C0 = L1, C1 = R0, cx = (C0 + C1) / 2;
  tallOak(L0, L1, YF, YB); tallOak(R0, R1, YF, YB);
  B(C0, C1, YF + 4, YB, 0, 10, mat.oakD); B(C0, cx - 50, YF + 1, YB, 10, 88, mat.kOak); B(cx + 50, C1, YF + 1, YB, 10, 88, mat.kOak);
  for (const [a, b] of [[C0, C0 + (cx - 50 - C0) / 2], [C0 + (cx - 50 - C0) / 2, cx - 50], [cx + 50, cx + 50 + (C1 - cx - 50) / 2], [cx + 50 + (C1 - cx - 50) / 2, C1]]) drawerStack(a, b, YF);
  for (const [a, b] of [[C0, cx - 50.5], [cx + 50.5, C1]]) { const t = B(a, b, YF - 3, YB, 88, 92, mat.stone); uvScale(t, 1.3); }
  // kuchnia wolnostojąca czarna 100 cm z mosiężnymi pokrętłami
  const k0 = cx - 50, k1 = cx + 50; B(k0, k1, YF - 2, YB, 0, 92, mat.black); B(k0 + 2, k1 - 2, YF - 2.6, YF - 2, 10, 50, mat.blackG); B(k0 + 4, k1 - 4, YF - 3, YF - 2.6, 54, 76, mat.blackG);
  B(k0 + 6, k1 - 6, YF - 6, YF - 4, 72, 74, mat.brass); for (const x of [k0 + 6, k1 - 6]) B(x - 1, x + 1, YF - 6, YF - 2.6, 72, 74, mat.brass);
  for (let i = 0; i < 7; i++) { const c = cyl(k0 + 14 + i * 12, YF - 3.5, 82, 86, 2, mat.brass, 16); c.rotation.x = Math.PI / 2; c.position.y = .84; }
  B(k0, k1, YF - 2, YB, 92, 93.5, M({ color: '#222', roughness: .3 })); for (const [x, y] of [[k0 + 25, YF + 18], [k1 - 25, YF + 18], [k0 + 25, YB - 16], [k1 - 25, YB - 16], [cx, YF + 32]]) cyl(x, y, 93.5, 95, 9, mat.black, 6);
  // kamienny pas (mozaika) za blatem do okapu, okap tynkowany biały
  const bs = B(C0, C1, YB - 1.5, YB, 92, HN, mat.mosaic); uvScale(bs, 1.5);
  B(cx - 82, cx + 82, YB - 60, YB, 168, 186, mat.plaster); B(cx - 85, cx + 85, YB - 62, YB, 186, 190, mat.plaster); B(cx - 76, cx + 76, YB - 54, YB, 190, HN, mat.plaster);
  B(cx - 70, cx + 70, YB - 56, YB - 50, 167, 168, M({ color: '#bbb', metalness: .8, roughness: .3 }));
  // dekoracje na blacie
  cyl(C0 + 22, YF + 25, 92, 108, 6.5, mat.cer, 24); for (let i = 0; i < 4; i++) rodBetween([C0 + 22, YF + 25, 100], [C0 + 19 + i * 2, YF + 22 + i, 128], .7, mat.oak);
  B(C0 + 40, C0 + 70, YB - 3, YB - 1.5, 92, 132, mat.oak, { r: 0.01 }); vaseFlowers(C1 - 28, YF + 28, 92, .55); sph(C1 - 58, YF + 30, 97, 6, mat.cer);
  // lodówka/zamrażarka w zabudowie kremowej + jej przedłużenie: ukryte drzwi do spiżarni (otwór x -25…0, y 977…1067) wyglądające jak zabudowa
  { const XF = 0, cream = (p, q, handle) => { for (const [h0, h1] of [[11, 208], [210, HN - 1]]) { B(XF, XF + 1, p + .3, q - .3, h0, h1, mat.kCream);
        for (const [s0, s1, t0, t1] of [[p + .3, p + 7, h0, h1], [q - 7, q - .3, h0, h1], [p + .3, q - .3, h0, h0 + 7], [p + .3, q - .3, h1 - 7, h1]]) B(XF + 1, XF + 2, s0, s1, t0, t1, mat.kCream); }
      if (handle) { const hy = handle; B(XF + 2, XF + 6, hy - .8, hy + .8, 75, 175, mat.brass); B(XF + 2, XF + 5, hy - .8, hy + .8, 212, 228, mat.brass); } };
    B(-70, XF, 1099, 1216, 0, 10, mat.oakD); B(-70, XF, 1099, 1216, 10, HN, mat.kCream); B(XF, XF + 2, 1099, 1216, 0, 10, mat.oakD);
    const w = (1216 - 1099) / 2; cream(1099, 1099 + w, 1099 + w - 4.5); cream(1099 + w, 1216, 1099 + w + 4.5);
    // ukryte drzwi do spiżarni (skrzydło 90 cm z podziałem jak fronty) + wąski panel na filarze
    B(XF - 4, XF, 977, 1067, 0, 207, mat.kCream); B(XF, XF + 2, 977, 1099, 0, 10, mat.oakD);
    cream(977, 1022, 980.5); cream(1022, 1067, 0); cream(1067, 1099, 0);
    B(XF, XF + 2.2, 976.4, 977.2, 0, HN, mat.venD); }
  // wyspa (wg DWG 350×110): podstawa dębowa z ramkami, słupki narożne, blat kamienny z nawisem od jadalni, zlew + bateria mosiężna
  const IX0 = 80, IX1 = 430, IY0 = 980, IY1 = 1090, IB = IY0 + 30;
  B(IX0 + 9, IX1 - 9, IB + 2, IY1 - 3, 10, 86, mat.kOak); B(IX0 + 12, IX1 - 12, IB + 6, IY1 - 8, 0, 10, mat.oakD);
  for (const [x, y] of [[IX0 + 1, IB], [IX1 - 9, IB], [IX0 + 1, IY1 - 10], [IX1 - 9, IY1 - 10]]) { B(x, x + 8, y, y + 8, 12, 86, mat.kOak); B(x - 1, x + 9, y - 1, y + 9, 0, 12, mat.kOak); }
  for (const x of [IX0 + 1, IX1 - 9]) { B(x, x + 8, IB + 8, IY1 - 10, 12, 86, mat.kOak); const xo = x < 200 ? x - .8 : x + 8; for (const [a, b, c, d] of [[IB + 8, IB + 15, 14, 84], [IY1 - 17, IY1 - 10, 14, 84], [IB + 8, IY1 - 10, 14, 21], [IB + 8, IY1 - 10, 77, 84]]) B(xo, xo + .8, a, b, c, d, mat.kOak); }
  const np = 6, pw = (IX1 - IX0 - 18) / np; for (let i = 0; i < np; i++) { const a = IX0 + 9 + i * pw, b = a + pw; for (const [r0, r1, s0, s1] of [[a + .5, a + 7, 12, 84], [b - 7, b - .5, 12, 84], [a + .5, b - .5, 12, 19], [a + .5, b - .5, 77, 84]]) B(r0, r1, IB + 1.2, IB + 2, s0, s1, mat.kOak); }
  for (let i = 0; i < np; i++) { const a = IX0 + 9 + i * pw, b = a + pw; if (i === 2 || i === 3) { B(a + .3, b - .3, IY1 - 3, IY1 - 2, 12, 84, mat.kOak); continue; } drawerStack(a, b, IY1 - 3, [12, 36, 60, 84], 1); }
  const it = B(IX0 - 2, IX1 + 2, IY0, IY1 + 3, 86, 92, mat.stone); uvScale(it, 1.2);
  const sc = (IX0 + IX1) / 2; B(sc - 38, sc + 38, 1040, 1080, 70, 92.1, mat.steel); B(sc - 36, sc + 36, 1042, 1078, 72, 92.2, M({ color: '#9a9da0', metalness: .9, roughness: .25 }));
  cyl(sc, 1084, 92, 96, 2.6, mat.brass); cyl(sc, 1084, 96, 128, 1.4, mat.brass); { const t = new THREE.Mesh(new THREE.TorusGeometry(.11, .014, 8, 24, Math.PI), mat.brass); t.rotation.y = Math.PI / 2; t.position.set(-sc / 100, 1.28, 10.73); t.castShadow = true; CUR.add(t); }
  cyl(sc, 1062, 112, 128, 1.2, mat.brass); for (const d of [-14, 14]) { cyl(sc + d, 1084, 92, 100, 1.2, mat.brass); B(sc + d - .6, sc + d + .6, 1076, 1084, 99, 100.5, mat.brass); }
  sph(IX0 + 50, 1040, 97, 9, mat.cer, .55); vaseFlowers(IX1 - 50, 1035, 92, .6); cyl(sc + 70, 1050, 92, 103, 4, mat.cer);
  // 4 hokery od strony jadalni
  for (const x of [128, 212, 298, 382]) stool(x, 955);
  // lampa nad wyspą: czarna belka + 2 plisowane abażury
  cyl(255, 1035, 215, HN, .6, mat.black, 8); rodBetween([150, 1035, 214], [360, 1035, 214], 1.3, mat.black);
  for (const x of [165, 345]) { cyl(x, 1035, 200, 214, .6, mat.black, 8); const s = cyl(x, 1035, 178, 200, 21, mat.shade, 28, 13); const l = new THREE.PointLight('#ffdcae', 1.6, 3.5, 2); l.position.set(-x / 100, 1.85, 10.35); CUR.add(l); }
  for (const [x, y] of [[60, 1160], [255, 1160], [460, 1160], [60, 1030], [460, 1030]]) cyl(x, y, HN - 1, HN, 4, mat.glow, 16);
  areaLight(255, 1150, 286, 3, 1.2, 70, 'AREA_KUCH');
}

// ---------- JADALNIA (jak na wizualizacji: długi dębowy stół, krzesła lniane w czarnej ramie, fotel u szczytu, dywan, żyrandol świecowy) ----------
function linenChair(x, y, rot) { const g = new THREE.Group(); const prev = CUR; CUR = g;
  B(-23, 23, -22, 22, 44, 52, mat.linen, { r: 0.03 }); B(-22, 22, 14, 21, 52, 92, mat.linen, { r: 0.04 });
  for (const [a, b] of [[-21, -20], [21, -20], [-21, 19], [21, 19]]) rodBetween([a, b, 0], [a, b, 44], 1.1, mat.black);
  for (const s of [-1, 1]) { rodBetween([s * 24, -16, 44], [s * 24, -16, 66], .9, mat.black); rodBetween([s * 24, -16, 66], [s * 24, 18, 70], 1, mat.black); rodBetween([s * 24, 18, 44], [s * 24, 18, 70], .9, mat.black); }
  rodBetween([-21, 19, 20], [21, 19, 20], .7, mat.black);
  CUR = prev; g.position.set(-x / 100, 0, y / 100); g.rotation.y = rot; g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); CUR.add(g); }
function hostChair(x, y, rot) { const g = new THREE.Group(); const prev = CUR; CUR = g;
  B(-26, 26, -25, 25, 6, 45, mat.linen, { r: 0.02 }); B(-25.5, 25.5, -24.5, 19, 45, 51, mat.linen, { r: 0.025 }); B(-26, 26, 17, 26, 45, 104, mat.linen, { r: 0.025 });
  for (const [a, b] of [[-23, -22], [23, -22], [-23, 22], [23, 22]]) B(a - 2, a + 2, b - 2, b + 2, 0, 6, mat.oakD);
  CUR = prev; g.position.set(-x / 100, 0, y / 100); g.rotation.y = rot; g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); CUR.add(g); }
function candleChandelier(cx, cy, hb) { cyl(cx, cy, hb + 20, HN, .6, mat.black, 8); cyl(cx, cy, HN - 3, HN, 7, mat.black, 24);
  cyl(cx, cy, hb - 6, hb + 22, 2.4, mat.black, 16); sph(cx, cy, hb - 8, 3, mat.black);
  for (const [R, hh, n] of [[42, hb, 8], [22, hb + 22, 4]]) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + (n === 4 ? .4 : 0), px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
    rodBetween([cx, cy, hh + (n === 8 ? 4 : 0)], [px, py, hh], .7, mat.black); cyl(px, py, hh, hh + 4, 2.2, mat.black, 12); cyl(px, py, hh + 4, hh + 17, 1.3, mat.white, 12); cyl(px, py, hh + 17, hh + 21, .9, mat.glow, 8); }
  const l = new THREE.PointLight('#ffd9a8', 2.6, 5, 2); l.position.set(-cx / 100, (hb + 10) / 100, cy / 100); CUR.add(l); }
function zoneDining() {
  const X0 = 236, X1 = 336, Y0 = 538, Y1 = 838, cx = (X0 + X1) / 2;
  const rg = B(cx - 160, cx + 160, Y0 - 90, Y1 + 50, 0, 1, mat.rugdin); uvScale(rg, .3);
  const t = B(X0, X1, Y0, Y1, 70, 76, mat.oak); uvScale(t, 1); B(X0 + 8, X1 - 8, Y0 + 14, Y1 - 14, 62, 70, mat.oak);
  for (const [x, y] of [[X0 + 6, Y0 + 12], [X1 - 6, Y0 + 12], [X0 + 6, Y1 - 12], [X1 - 6, Y1 - 12]]) B(x - 4.5, x + 4.5, y - 4.5, y + 4.5, 0, 70, mat.oak);
  for (const y of [583, 653, 723, 793]) { linenChair(X0 - 22, y, Math.PI / 2); linenChair(X1 + 22, y, -Math.PI / 2); }
  hostChair(cx, Y0 - 34, Math.PI);
  vaseFlowers(cx, 690, 76, 1.1); for (const y of [610, 770]) { cyl(cx, y, 76, 78, 4, mat.brass, 16); cyl(cx, y, 78, 100, 1.2, mat.white, 12); }
  candleChandelier(cx, 688, 190);
  // zasłony lniane przy oknach HS
  const Wn = window.__WIN; for (const [a, b] of [[Wn.D0 - 45, Wn.D0 + 15], [Wn.D1 - 15, Wn.D1 + 45], [Wn.K0 - 40, Wn.K0 + 12], [Wn.K1 - 12, Wn.K1 + 2]]) curtainsAt(522, a, b, 2, 265);
  
  for (const [x, y] of [[120, 560], [120, 800], [450, 560], [450, 800]]) cyl(x, y, HN - 1, HN, 4, mat.glow, 16);
  areaLight(286, 690, 286, 2.5, 3.2, 55, 'AREA_JAD');
}

// ---------- GARDEROBA (cała: od holu do ściany płn., z drzwiami do garażu i siłowni) – jak na wizualizacji ----------
function zoneWardrobe() {
  const X0 = -640, X1 = -339, Y0 = 692, Y1 = 1280;
  tiled(X0, X1, Y0, Y1, mat.checker, .55);
  // czarne szafy na końcu (ściana płn.), drzwi z podziałem na nadstawkę, małe mosiężne gałki
  const yF = Y1 - 60; B(X0 + 2, X1 - 2, yF + 3, Y1, 0, 8, mat.black); B(X0 + 2, X1 - 2, yF + 1, Y1, 8, HN, mat.black);
  const n = 6, w = (X1 - X0 - 4) / n;
  for (let i = 0; i < n; i++) { const a = X0 + 2 + i * w, b = a + w;
    for (const [h0, h1] of [[9, 206], [208, HN - 1]]) B(a + .3, b - .3, yF, yF + 1, h0, h1, mat.black);
    B(a - .3, a + .3, yF - .2, yF + 1, 8, HN, mat.blackG); B(a, b, yF - .2, yF + 1, 206.6, 207.4, mat.blackG);
    sph(i % 2 ? a + 4 : b - 4, yF - 1.2, 108, 1.5, mat.brass); }
  // dębowe szafki (lockery) przy ścianie wsch. (wg DWG y 722…978): wnęki na buty, drzwi z rozetą, kosze u góry
  const xF = X1 - 58, ya = 722, yb = 978, m = 4, lw = (yb - ya) / m;
  B(xF, X1, ya, yb, 0, 6, mat.kOak); B(xF + 4, X1, ya, yb, 6, HN, mat.kOak);
  for (let i = 0; i <= m; i++) { const y = ya + i * lw; B(xF, xF + 4, y - 1.5, y + 1.5, 6, HN, mat.kOak); }
  for (const h of [40, 43, 206, 209, 258, 261]) B(xF, X1, ya, yb, h - 1.5, h + 1.5, mat.kOak);
  for (let i = 0; i < m; i++) { const p = ya + i * lw + 1.8, q = p + lw - 3.6;
    B(xF - .6, xF + 1, p, q, 45, 204, mat.kOak); for (const [s0, s1, t0, t1] of [[p, p + 6, 45, 204], [q - 6, q, 45, 204], [p, q, 45, 51], [p, q, 198, 204]]) B(xF - 1.6, xF - .6, s0, s1, t0, t1, mat.kOak);
    { const r = new THREE.Mesh(new THREE.TorusGeometry(.035, .006, 8, 24), mat.brass); r.rotation.y = Math.PI / 2; r.position.set(-(xF - 1.8) / 100, 1.8, (p + q) / 200); CUR.add(r); }
    B(xF - 4, xF - 1.6, q - 6, q - 4.4, 110, 140, mat.brass);
    B(xF + 8, X1 - 4, p + 5, q - 5, 211, 245, mat.rattan, { r: 0.02 }); }
  // drzwi: do garażu (czarne, ściana zach.) i do siłowni (ściana wsch.)
  B(-652, -648, 1106, 1194, 0, 204, mat.black); B(-648, -647, 1114, 1186, 20, 190, mat.blackG); B(-647, -642, 1182, 1184, 98, 102, mat.brass); B(-643, -641, 1170, 1184, 99, 101, mat.brass);
  doorLeaf(-339, 1110, -327, 1200, 1);
  // zielona pufa z plisowaną falbaną
  const g = M({ color: '#5f6b3e', roughness: 1 }); B(-545, -435, 965, 1055, 4, 34, g); B(-547, -433, 963, 1057, 34, 46, g, { r: 0.04 });
  for (let x = -546; x < -434; x += 4) for (const yy of [962.5, 1055.5]) B(x, x + 2.6, yy - 1.2, yy + 1.2, 1, 32, g);
  for (let y = 964; y < 1055; y += 4) for (const xx of [-546, -434]) B(xx - 1.2, xx + 1.2, y, y + 2.6, 1, 32, g);
  // drzewko oliwne przy oknie, zasłony, grafiki
  cyl(-610, 760, 0, 45, 22, mat.cer, 24, 18); rodBetween([-610, 760, 45], [-605, 765, 150], 2, mat.bronze);
  for (let k = 0; k < 45; k++) sph(-610 + (rnd() - .5) * 60, 760 + (rnd() - .5) * 60, 140 + rnd() * 70, 6 + rnd() * 6, mat.olive, .7);
  curtainsAt(-628, 775, 812, 2, 282, '#f4efe6'); curtainsAt(-628, 978, 1015, 2, 282, '#f4efe6'); B(-632, -628, 770, 1020, 282, 285, mat.black);
  for (const [y, h0] of [[1050, 175], [1050, 120]]) { B(-640, -637, y - 18, y + 18, h0, h0 + 46, mat.black); plane(-636.5, y, h0 + 23, 30, 40, mat.leafart, -Math.PI / 2); }
  for (const [x, y] of [[-490, 800], [-490, 1000], [-490, 1170]]) cyl(x, y, HN - 1, HN, 5, mat.glow, 16);
  areaLight(-490, 990, 285, 2, 4, 90, 'AREA_GARD');
}
// ================= ELEWACJE (wg DWG A-9 i wizualizacji) + SIŁOWNIA =================
T.brick = cv(512, 512, (g, w, h) => { g.fillStyle = '#f1efe9'; g.fillRect(0, 0, w, h); const bh = 512 / 24, bw = 512 / 6.5;
  for (let r = 0; r < 24; r++) for (let c = -1; c < 8; c++) { const x = c * bw + (r % 2) * bw / 2, y = r * bh, v = 214 + rnd() * 16 | 0; g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; g.fillRect(x + 2, y + 2, bw - 4, bh - 4); } });
T.brick.wrapS = T.brick.wrapT = THREE.RepeatWrapping;
T.terr = cv(512, 512, (g, w, h) => { g.fillStyle = '#cfccc6'; g.fillRect(0, 0, w, h); for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) { const v = 222 + rnd() * 14 | 0; g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(c * 256 + 2, r * 128 + 2, 252, 124); } });
T.terr.wrapS = T.terr.wrapT = THREE.RepeatWrapping;
T.roof = cv(256, 256, (g, w, h) => { g.fillStyle = '#2c2a29'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3836'; for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 3); for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 2, h); });
T.roof.wrapS = T.roof.wrapT = THREE.RepeatWrapping;
Object.assign(mat, {
  ext: M({ color: '#f4f2ec', roughness: .92, name: 'tynkRAL9010' }), dark: M({ color: '#4d4a45', roughness: .9, name: 'tynkRAL7022' }),
  brick: M({ map: T.brick, roughness: .95, name: 'klinkier' }), terr: M({ map: T.terr, roughness: .8, name: 'taras' }),
  roofM: M({ map: T.roof, roughness: .7, side: THREE.DoubleSide, name: 'dach' }), glassD: M({ color: '#2b343a', roughness: .06, metalness: .55, name: 'szybaZew' }),
  gdoor: M({ color: '#3a302a', roughness: .6, name: 'bramaGaraz' }),
});
const FACE = { E: { ax: 'y', c: 581, d: 1 }, W: { ax: 'y', c: -689, d: -1 }, Wr: { ax: 'y', c: -580, d: -1 }, S: { ax: 'x', c: -50, d: -1 }, WN: { ax: 'x', c: 1723, d: 1 }, WE: { ax: 'y', c: 332, d: 1 }, GS: { ax: 'x', c: 1043, d: -1 }, GN: { ax: 'x', c: 1724, d: 1 } };
function fbox(f, a0, a1, h0, h1, m, d0 = 0, d1 = 2.5) { const F = FACE[f], p = F.c + F.d * d0, q = F.c + F.d * d1, c0 = Math.min(p, q), c1 = Math.max(p, q);
  return F.ax === 'y' ? B(c0, c1, a0, a1, h0, h1, m) : B(a0, a1, c0, c1, h0, h1, m); }
function fplane(f, a0, a1, h0, h1, m, d) { const F = FACE[f], c = F.c + F.d * d; const p = F.ax === 'y' ? plane(c, (a0 + a1) / 2, (h0 + h1) / 2, a1 - a0, h1 - h0, m, F.d > 0 ? -Math.PI / 2 : Math.PI / 2) : plane((a0 + a1) / 2, c, (h0 + h1) / 2, a1 - a0, h1 - h0, m, F.d > 0 ? 0 : Math.PI); p.castShadow = false; return p; }
function hipRoof(x0, x1, y0, y1, hE, pitch, m) {
  const W = x1 - x0, L = y1 - y0, t = Math.tan(pitch * Math.PI / 180), P = (x, y, h) => [-x / 100, h / 100, y / 100], v = [];
  const tri = (a, b, c) => v.push(...a, ...b, ...c), quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
  const A = P(x0, y0, hE), Bq = P(x1, y0, hE), C = P(x1, y1, hE), D = P(x0, y1, hE);
  if (L >= W) { const r = W / 2, hr = hE + r * t, R1 = P(x0 + r, y0 + r, hr), R2 = P(x0 + r, y1 - r, hr); tri(A, Bq, R1); tri(C, D, R2); quad(Bq, C, R2, R1); quad(D, A, R1, R2); }
  else { const r = L / 2, hr = hE + r * t, R1 = P(x0 + r, y0 + r, hr), R2 = P(x1 - r, y0 + r, hr); tri(D, A, R1); tri(Bq, C, R2); quad(A, Bq, R2, R1); quad(C, D, R1, R2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals();
  const uv = []; for (let i = 0; i < v.length; i += 3) uv.push(v[i] * .8, v[i + 2] * .8 + v[i + 1] * .8); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const me = new THREE.Mesh(g, m); me.castShadow = true; me.receiveShadow = true; me.name = 'CEIL'; CUR.add(me); return me; }
function railing(axis, a0, a1, c, h0, hgt = 100, step = 11) { // czarna balustrada
  const R = (p, q, r, s, hh0, hh1) => axis === 'x' ? B(p, q, r, s, hh0, hh1, mat.black) : B(r, s, p, q, hh0, hh1, mat.black);
  R(a0, a1, c - 2, c + 2, h0 + hgt - 4, h0 + hgt); R(a0, a1, c - 1, c + 1, h0 + 6, h0 + 9);
  for (let a = a0; a <= a1 + .1; a += step) R(a - .8, a + .8, c - .8, c + .8, h0, h0 + hgt);
}
function upWin(f, a0, a1, sill, top, french) {
  fbox(f, a0, a1, 330, sill, mat.brick).name = 'CEIL'; fbox(f, a0, a1, top, 640, mat.brick).name = 'CEIL';
  for (const m of [fbox(f, a0 - 11, a0, sill, top + 12, mat.ext, 0, 5.5), fbox(f, a1, a1 + 11, sill, top + 12, mat.ext, 0, 5.5), fbox(f, a0 - 13, a1 + 13, top, top + 13, mat.ext, 0, 7), fbox(f, a0 - 13, a1 + 13, sill - 6, sill, mat.ext, 0, 7)]) m.name = 'CEIL';
  fplane(f, a0, a1, sill, top, mat.glassD, .6).name = 'CEIL';
  const fr = (p, q, h0, h1) => { fbox(f, p, q, h0, h1, mat.ral, .4, 2.2).name = 'CEIL'; };
  fr(a0, a0 + 6, sill, top); fr(a1 - 6, a1, sill, top); fr(a0, a1, sill, sill + 6); fr(a0, a1, top - 6, top); fr((a0 + a1) / 2 - 2.5, (a0 + a1) / 2 + 2.5, sill, top); fr(a0, a1, top - (top - sill) * .22 - 2.5, top - (top - sill) * .22 + 2.5);
  if (french) { const F = FACE[f]; const c = F.c + F.d * 12; const g0 = CUR.children.length; railing(F.ax === 'y' ? 'y' : 'x', a0 - 4, a1 + 4, c, sill, 95); for (let i = g0; i < CUR.children.length; i++) CUR.children[i].name = 'CEIL'; }
}

// ciemna bryła salonu (tynk RAL 7022) wg elewacji DWG: od ogrodu y -50…440 (wokół przeszklenia), od strony gabinetu x 246…581;
// listwy: ramy boczne, pas w linii stropu, opaska i gzyms pod okapem
function zoneDarkBlock() {
  const D = mat.dark, T0 = 572, T1 = 588, T2 = 602, R0 = 330, R1 = 346;
  // elewacja boczna (y = -50): płyta + ramy + pas
  B(246, 583.5, -53.5, -50, 0, T0, D);
  B(246, 298, -56, -53.5, 0, T0, D); B(536, 583.5, -56, -53.5, 0, T0, D);
  B(298, 536, -56, -53.5, R0, R1, D); B(298, 536, -56, -53.5, 0, 8, D); B(298, 536, -56, -53.5, T0 - 8, T0, D);
  for (const [a, b] of [[298, 536]]) for (const [h0, h1] of [[8, R0], [R1, T0 - 8]]) frameRect(a + 14, b - 14, -55, h0 + 14, h1 - 14, 3, 1.5, D, 'x');
  // elewacja ogrodowa (x = 581): ramy po bokach przeszklenia
  B(581, 586, -56, 0, 0, T0, D); B(581, 586, 394, 440, 0, T0, D); B(581, 583.5, 440, 455, 0, 16, mat.brick);
  // nad przeszkleniem: płyta do opaski
  B(553, 586, -50, 440, T0 - 2, T0, D);
  // opaska i gzyms (obiegają oba lica)
  B(243, 589, -59, -50, T0, T1, D); B(553, 589, -59, 443, T0, T1, D);
  B(240, 592, -62, -50, T1, T1 + 4, D); B(553, 592, -62, 446, T1, T1 + 4, D);
  B(237, 595, -65, -50, T1 + 4, T2, D); B(553, 595, -65, 449, T1 + 4, T2, D);
  // pas międzykondygnacyjny dociągnięty do ciemnej bryły
  B(60, 246, -57, -50, 330, 346, mat.ext); B(581, 588, 440, 455, 330, 346, mat.ext);
}
function zoneExterior() {
  const H = HOUSE, nm = (m, n = 'CEIL') => { m.name = n; return m; };
  // elewacja: cokół z klinkieru, tynk biały na parterze, klinkier na piętrze, ciemna bryła salonu (RAL 7022)
  for (const s of H.skin) {
    if (s.lev === 'U') { nm(extrude(s, 330, 640, mat.brick)); continue; }
    extrude(s, -12, 16, mat.brick); extrude(s, 16, 330, mat.ext);
  }
  for (const b of H.band) nm(extrude(b, 330, 346, mat.ext));
  for (const b of H.UP.eave) { nm(extrude(b, 600, 640, mat.ext)); nm(extrude(b, 640, 648, mat.black)); } // gzyms okapu ok. 40 cm (DWG)
  for (const b of H.eaveW) { nm(extrude(b, 312, 330, mat.ext)); nm(extrude(b, 330, 336, mat.black)); }
  // nadproża / cokoły przy oknach parteru (otwory przecinają okładzinę)
  for (const [f, a0, a1] of [['S', -295, -106], ['W', 87, 267], ['W', 800, 989], ['Wr', 438, 625], ['E', 552.5, 822.5], ['E', 965.5, 1205.5], ['WN', -40, 232], ['WE', 1380, 1652]]) { fbox(f, a0, a1, 240, 330, mat.ext); fbox(f, a0, a1, -12, 0, mat.brick); }
  // ciemna rama przeszklenia salonu (nad szkłem do gzymsu)
  zoneDarkBlock();
  // okna piętra wg elewacji (południowa DWG = od ogrodu): 3 otwory + drzwi na balkon; od wejścia 3 okna; od zachodu 2 okna z balkonikami francuskimi
  // okna piętra – wg rzutu piętra z DWG (zoneUpperExt)
  zoneUpperExt();
  // dachy czterospadowe (blachodachówka ciemnoszara RAL 8022)
  hipRoof(-772, 621, -91, 1418, 646, 30, mat.roofM);
  hipRoof(-1624, -624, 1003, 1764, 334, 30, mat.roofM); hipRoof(-689, 372, 1263, 1763, 334, 30, mat.roofM);
  // rynny – rury spustowe
  for (const [x, y] of [[586, -55], [586, 1300], [-694, -55], [-694, 1296], [337, 1655]]) nm(cyl(x, y, -12, y > 1290 && x > 0 && x < 400 ? 330 : 640, 4, mat.black, 12));
  // garaż: nadproża nad bramami i okna z parapetem 143 cm (bramy i okna rysuje windowUnit wg DWG)
  for (const [a, b] of [[-1458, -1164], [-1083, -789]]) fbox('GS', a, b, 250, 330, mat.ext);
  for (const [a, b] of [[-1344, -1177], [-977, -808]]) { fbox('GN', a, b, -12, 16, mat.brick); fbox('GN', a, b, 16, 143, mat.ext); fbox('GN', a, b, 203, 330, mat.ext); }
  fbox('GN', -629, -539, 205, 330, mat.ext); fbox('GN', -629, -539, -12, 0, mat.brick);
  // TARAS (wg DWG): płyta x 581…1000, y -50…1355, stopnie – bez podcienia
  const tr = B(581, 1000, -50, 1355, -12, -2, mat.terr, { cast: false }); uvScale(tr, .5);
  B(1000, 1034, -50, 1355, -12, -7, mat.terr); B(581, 1034, -84, -50, -12, -7, mat.terr); B(581, 1034, 1355, 1389, -12, -7, mat.terr);
  // meble tarasowe: stół (blat drewniany) + 8 krzeseł pod podcieniem
  B(680, 880, 650, 750, 72, 76, mat.oakD); for (const [x, y] of [[686, 656], [874, 656], [686, 744], [874, 744]]) B(x - 2, x + 2, y - 2, y + 2, -2, 72, mat.black);
  for (let i = 0; i < 4; i++) for (const [y, s] of [[620, 1], [780, -1]]) { const x = 705 + i * 50; B(x - 21, x + 21, y - 20, y + 20, 44, 48, M({ color: '#7d7a74', roughness: .9 })); B(x - 21, x + 21, y + s * 18 - 2, y + s * 18 + 2, 48, 88, M({ color: '#7d7a74', roughness: .9 })); for (const dx of [-19, 19]) rodBetween([x + dx, y - 18, -2], [x + dx, y + 18, -2], .6, mat.black); for (const dx of [-19, 19]) for (const dy of [-18, 18]) rodBetween([x + dx, y + dy, -2], [x + dx, y + dy, 44], .6, mat.black); }
  // wejście: bez podcienia (bez słupów i balkonu), schodki
  const ep = B(-760, -580, 400, 690, -12, -2, mat.terr); uvScale(ep, .5); B(-790, -760, 410, 680, -12, -7, mat.terr);
  for (const y of [455, 640]) { B(-584, -580, y - 6, y + 6, 190, 222, mat.black); }
  // podjazd przed garażem
  const dr = B(-1600, -650, 700, 1040, -13, -11, M({ map: T.terr, color: '#e2e0dc', roughness: .9 }), { cast: false }); uvScale(dr, .4);
}

// ---------- SIŁOWNIA (L: x -339…306, y 1097…1723) ----------
function zoneGym() {
  tiled(-339, 306, 1303, 1723, mat.rubber, 1); tiled(-339, -82, 1097, 1303, mat.rubber, 1);
  // podest + klatka (power rack) wg DWG, sztanga z obciążeniem, ławka
  const pl = B(30, 200, 1430, 1640, 0, 3, mat.oakD); uvScale(pl, 1);
  for (const [x, y] of [[85, 1462], [85, 1608], [150, 1462], [150, 1608]]) B(x - 3.5, x + 3.5, y - 3.5, y + 3.5, 3, 232, mat.black);
  for (const x of [85, 150]) B(x - 3.5, x + 3.5, 1462, 1608, 225, 232, mat.black); for (const y of [1462, 1608]) B(85, 150, y - 3.5, y + 3.5, 225, 232, mat.black);
  for (const x of [85, 150]) B(x - 3, x + 3, 1462, 1608, 3, 10, mat.black);
  rodBetween([117, 1420, 140], [117, 1650, 140], 1.4, mat.steel);
  for (const y of [1440, 1446, 1624, 1630]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(.225, .225, .05, 40), M({ color: '#1b1b1b', roughness: .7 })); d.rotation.x = Math.PI / 2; d.position.set(-1.17, 1.4, y / 100); d.castShadow = true; CUR.add(d); }
  B(20, 112, 1512, 1542, 38, 46, M({ color: '#1e1e1e', roughness: .6 }), { r: .02 }); for (const x of [30, 100]) B(x - 3, x + 3, 1512, 1542, 0, 38, mat.black);
  // stojak z hantlami + lustro na ścianie zach.
  B(-305, -260, 1340, 1560, 0, 4, mat.black); for (const y of [1345, 1555]) B(-302, -263, y - 2, y + 2, 0, 90, mat.black);
  for (const h of [45, 80]) { B(-302, -263, 1345, 1555, h, h + 3, mat.black); for (let y = 1360; y < 1550; y += 26) { rodBetween([-293, y, h + 7], [-272, y, h + 7], 1.2, mat.steel); for (const x of [-293, -272]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .07, 6), mat.black); k.rotation.z = Math.PI / 2; k.position.set(-x / 100, (h + 7) / 100, y / 100); CUR.add(k); } } }
  B(-305, -304, 1580, 1690, 15, 230, mat.mirror); B(-306, -304, 1576, 1694, 13, 15, mat.black);
  B(-305, -304, 1320, 1335, 15, 230, mat.black);
  // bieżnia przy oknie płn.
  B(-160, -80, 1520, 1690, 0, 18, mat.black, { r: .02 }); B(-150, -90, 1530, 1680, 18, 19, M({ color: '#2b2b2b', roughness: .9 })); for (const x of [-155, -85]) rodBetween([x, 1530, 18], [x, 1515, 130], 2, mat.black); B(-165, -75, 1505, 1520, 125, 140, mat.blackG);
  // drążek, piłka, mata, roślina
  sph(220, 1360, 32, 32, M({ color: '#5f6b3e', roughness: .9 })); B(-60, 10, 1330, 1390, 0, 1, M({ color: '#7b8a6a', roughness: 1 }));
  cyl(270, 1690, 0, 40, 18, mat.cer, 24, 14); for (let k = 0; k < 30; k++) sph(270 + (rnd() - .5) * 40, 1690 + (rnd() - .5) * 40, 70 + rnd() * 70, 7 + rnd() * 5, mat.leaf, .8);
  // TV na ścianie płd.
  B(0, 120, 1303, 1306, 120, 188, mat.screen);
  for (const [x, y] of [[-200, 1200], [-200, 1450], [0, 1450], [180, 1450], [0, 1620], [180, 1620]]) cyl(x, y, HN - 1, HN, 5, mat.glow, 16);
  areaLight(0, 1500, 286, 4, 3, 90, 'AREA_SIL');
}

// ---------- GARAŻ (2 stanowiska, bramy i okna wg DWG) + POMIESZCZENIE TECHNICZNE + KOTŁOWNIA ----------
function car(cx, cy, col) { const P = M({ color: col, roughness: .25, metalness: .6 }), G = M({ color: '#1d2329', roughness: .05, metalness: .4 });
  B(cx - 91, cx + 91, cy - 232, cy + 232, 22, 70, P, { r: .06 }); B(cx - 89, cx + 89, cy - 225, cy - 60, 66, 84, P, { r: .05 }); B(cx - 89, cx + 89, cy + 120, cy + 228, 66, 90, P, { r: .05 });
  sideShape(cx - 76, cx + 76, [[cy - 75, 84], [cy - 10, 132], [cy + 95, 134], [cy + 128, 90], [cy + 128, 84]], G); sideShape(cx - 70, cx + 70, [[cy - 6, 132], [cy + 92, 134], [cy + 92, 140], [cy - 2, 138]], P);
  for (const [dx, dy] of [[-82, -150], [82, -150], [-82, 150], [82, 150]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .24, 28), M({ color: '#151515', roughness: .8 })); w.rotation.z = Math.PI / 2; w.position.set(-(cx + dx) / 100, .34, (cy + dy) / 100); w.castShadow = true; CUR.add(w); }
  for (const s of [-1, 1]) { B(cx + s * 60 - 14, cx + s * 60 + 14, cy - 232, cy - 229, 58, 66, mat.glow); B(cx + s * 60 - 14, cx + s * 60 + 14, cy + 229, cy + 232, 58, 66, M({ color: '#7a1010', emissive: '#300', roughness: .3 })); } }
function zoneGarage() {
  const X0 = -1560, X1 = -664, Y0 = 1093, Y1 = 1698;
  tiled(X0, X1, Y0, Y1, M({ color: '#9a9b9c', roughness: .35, metalness: .05 }), 1);
  B(X0, X1, Y0, Y1, 256, HN, mat.wall).name = 'CEIL';
  // wysoka zabudowa wzdłuż ściany zach. (wg DWG 60×580): szafy białe HPL + półki
  B(X0, X0 + 58, 1098, 1680, 0, 8, mat.wallG); B(X0, X0 + 58, 1098, 1680, 8, 250, mat.white);
  for (let y = 1098; y < 1680; y += 58.2) { B(X0 + 58, X0 + 59, y + .4, y + 57.8, 10, 248, mat.white); B(X0 + 59, X0 + 62, y + 50, y + 52, 100, 160, mat.steel); }
  // 2 auta (wg DWG), ładowarka EV, oświetlenie liniowe
  car(-1263, 1390, '#3b4148'); car(-900, 1390, '#d9d6cf');
  B(-1110, -1088, 1694, 1698, 120, 160, mat.white); B(-1106, -1092, 1692, 1694, 140, 148, mat.glow); rodBetween([-1099, 1692, 120], [-1099, 1690, 90], .8, mat.black);
  for (const x of [-1263, -900]) for (const y of [1250, 1530]) B(x - 60, x + 60, y - 3, y + 3, 255, 256, mat.glow);
  areaLight(-1110, 1400, 250, 6, 4, 140, 'AREA_GAR');
  // drzwi: garaż → techniczne, garaż → kotłownia, kotłownia → zewnątrz (czarne)
  doorLeaf(-664, 1356, -639, 1440, 1); doorLeaf(-664, 1561, -639, 1645, 1);
  B(-626, -542, 1693, 1699, 0, 205, mat.black); B(-551, -547, 1688, 1693, 98, 102, mat.brass);
  // POMIESZCZENIE TECHNICZNE (x -640…-339, y 1295…1460): rozdzielnica, szafki, stacja uzdatniania wody, rack
  tiled(-639, -339, 1295, 1460, mat.epoxy, 1); B(-639, -339, 1295, 1460, 256, HN, mat.wall).name = 'CEIL';
  B(-636, -345, 1297, 1340, 0, 8, mat.wallG); B(-636, -345, 1297, 1340, 8, 90, M({ color: '#d7d8d6', roughness: .5 })); B(-636, -345, 1297, 1342, 90, 93, mat.steel);
  B(-628, -572, 1297, 1312, 120, 230, M({ color: '#e7e8e6', roughness: .4 })); B(-627, -573, 1312, 1313, 122, 228, M({ color: '#cfd1cf', roughness: .4 })); B(-578, -575, 1313, 1316, 170, 180, mat.black);
  for (const x of [-410, -375]) { cyl(x, 1385, 0, 120, 13, M({ color: '#2f5b8a', roughness: .4 }), 24); cyl(x, 1385, 120, 128, 9, mat.black, 16); }
  B(-440, -425, 1350, 1420, 0, 60, M({ color: '#f1f1f0', roughness: .5 }));
  B(-540, -480, 1420, 1458, 0, 200, mat.black); for (let h = 20; h < 200; h += 18) B(-539, -481, 1419, 1420, h, h + 12, mat.blackG); B(-536, -484, 1418.5, 1419, 150, 152, mat.glow);
  cyl(-490, 1380, HN - 1, HN, 5, mat.glow, 16); areaLight(-490, 1378, 250, 2, 1.2, 50, 'AREA_TECH');
  // KOTŁOWNIA (zlew, pompa ciepła, zasobnik CWU – jak wcześniej) + niższy sufit
  tiled(-639, -339, 1460, 1673, mat.epoxy, 1); houseBoiler();
}

window.__venShade = hex => { mat.ven.color.set(hex); mat.venTV && mat.venTV.color.set(hex); window.__render && window.__render(); };
window.__tvVeneer = on => { if (!mat.venTV) { mat.venTV = mat.ven.clone(); mat.venTV.color.copy(mat.ven.color); mat.venTV.name = 'fornirTV'; }
  scene.traverse(o => { if (!o.isMesh) return; if (o.userData.origMat === undefined && o.material && /^meble[BC]$/.test(o.material.name)) o.userData.origMat = o.material;
    if (o.userData.origMat) o.material = on ? mat.venTV : o.userData.origMat; }); window.__render && window.__render(); };

// zabudowa karniszy w profilu podciągu (25×25) + listwy przysufitowe wokół salonu i jadalni (bez kuchni)
function crown(ax, a0, a1, face, dir, top, H = 10.5) {
  for (const [p, h] of [[2, H], [4, H * .66], [6.5, H * .33]]) {
    if (ax === 'x') B(a0, a1, face, face + dir * p, top - h, top, mat.wall2, { cast: false });
    else B(face, face + dir * p, a0, a1, top - h, top, mat.wall2, { cast: false });
  }
}
function zoneCornice() {
  const DE = 1214; // do frontu dębowych słupków kuchni
  B(528, 553, 0, BEAM0, HR - 25, HR, mat.wall).name = 'BEAM';   // salon – zabudowa karnisza pod stropem pustki
  B(506, 531, BEAM1, DE, HN - 25, HN, mat.wall).name = 'BEAM';  // jadalnia – zabudowa karnisza (jak podciąg)
  // salon (sufit pustki)
  crown('x', 102, 528, 0, 1, HR); crown('y', 0, BEAM0, 102, 1, HR);
  // jadalnia (sufit parteru) – wzdłuż podciągów i zabudowy karnisza
  crown('x', 0, 506, BEAM1, 1, HN, 9); crown('y', BEAM1, 977, 0, 1, HN, 9); crown('y', 977, DE, 2, 1, HN, 9); crown('y', BEAM1, DE, 506, -1, HN, 9);
}

// ======================= PIĘTRO (wg rzutu piętra z DWG; poziom +3,24 ≈ 330, sufit ok. 590) =======================
const HU0 = 330, HU1 = HR;
function upGroup(fn) { const g = new THREE.Group(); g.name = 'UPPER'; const prev = CUR; CUR.add(g); CUR = g; fn(); CUR = prev; return g; }
function labelDecal(txt, x, y, h) { const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,.88)'; g.beginPath(); g.roundRect(8, 8, 1008, 144, 40); g.fill(); g.fillStyle = '#3a2f26'; g.font = '600 82px Helvetica, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 512, 82);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const me = new THREE.Mesh(new THREE.PlaneGeometry(1.9, .3), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  me.rotation.x = -Math.PI / 2; me.rotation.z = Math.PI; me.position.set(-x / 100, (h + 2) / 100, y / 100); me.name = 'LABEL'; me.visible = false; me.renderOrder = 5; CUR.add(me); return me; }
function zoneUpper() {
  const U = HOUSE.UP;
  upGroup(() => {
    // posadzki: dąb, łazienki – jasny kamień
    for (const f of U.floorOak) { const m = extrude(f, HU0 - 1, HU0 + .6, mat.floor, { cast: false }); const uv = m.geometry.attributes.uv, p = m.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) * .25, p.getZ(i) * .25); }
    for (const f of U.floorBath) { const m = extrude(f, HU0 - 1, HU0 + .6, mat.cer, { cast: false }); }
    // ściany, ocieplenie, nadproża drzwi (drzwi 80–90 × 200), sufit
    for (const w of U.walls) extrude(w, HU0, HU1, mat.wall);
    for (const w of U.ins) extrude(w, HU0, HU1, mat.wall2);
    for (const d of U.doors) { B(d.x0, d.x1, d.y0, d.y1, HU0 + 202, HU1, mat.wall);
      const g = new THREE.Group(); g.position.y = HU0 / 100; CUR.add(g); const prev = CUR; CUR = g; casing(d.x0, d.y0, d.x1, d.y1, 202); CUR = prev; }
    for (const c of U.ceil) extrude(c, HU1, 646, mat.wall).name = 'CEIL';
    // okna – wszystkie od podłogi (Hp = 0), wys. 240, RAL 7016, balustrady francuskie na zewnątrz
    { const g = new THREE.Group(); g.position.y = HU0 / 100; CUR.add(g); const prev = CUR; CUR = g;
      for (const w of U.wins) windowUnit(Object.assign({ name: 'U ' + w.f, sill: 0, top: 240, div: (w.ax === 'x' ? w.x1 - w.x0 : w.y1 - w.y0) > 120 ? 2 : 1, ceil: HU1 - HU0 }, w));
      CUR = prev; }
    // balustrada przy pustce nad salonem i przy otworze schodów
    railing('x', 106, 530, 404, HU0, 100, 11); // antresola nad salonem – czarna balustrada
    railing('x', -133, -27, 667, HU0, 100, 11); railing('y', 667, 860, -134, HU0, 100, 11);
    // podpisy pomieszczeń (widoczne w widoku „Piętro z góry”)
    for (const [t, x, y] of U.labels) labelDecal(t, x, y, HU0);
    // oświetlenie robocze
    for (const [, x, y] of U.labels) { const l = new THREE.PointLight('#ffe9cf', .9, 7, 2); l.position.set(-x / 100, (HU1 - 25) / 100, y / 100); CUR.add(l); }
  });
}
function zoneUpperExt() {
  const U = HOUSE.UP, nm = (m, n = 'CEIL') => { m.name = n; return m; };
  for (const s of U.skin) nm(extrude(s, HU0, 640, s.dark ? mat.dark : mat.brick));
  for (const w of U.wins) { const o = w.out, d = w.d, along = w.ax === 'x';
    const R = (a0, a1, c0, c1, h0, h1, m) => nm(along ? B(a0, a1, Math.min(c0, c1), Math.max(c0, c1), h0, h1, m) : B(Math.min(c0, c1), Math.max(c0, c1), a0, a1, h0, h1, m));
    const a0 = along ? w.x0 : w.y0, a1 = along ? w.x1 : w.y1;
    // białe pole tynku wokół okna (od pasa do okapu) + opaska okienna (listwa) – wg elewacji DWG
    R(a0 - 30, a0, o, o + d * 3.5, 346, 600, mat.ext); R(a1, a1 + 30, o, o + d * 3.5, 346, 600, mat.ext); R(a0, a1, o - d * 6, o + d * 3.5, HU0 + 240, 600, mat.ext);
    R(a0 - 10, a0, o, o + d * 5.5, HU0, HU0 + 250, mat.ext); R(a1, a1 + 10, o, o + d * 5.5, HU0, HU0 + 250, mat.ext); R(a0 - 10, a1 + 10, o, o + d * 5.5, HU0 + 240, HU0 + 252, mat.ext);
    if (w.terr) continue;
    const g0 = CUR.children.length; railing(along ? 'x' : 'y', a0 + 4, a1 - 4, o + d * 10, HU0, 100, 11); for (let i = g0; i < CUR.children.length; i++) CUR.children[i].name = 'CEIL'; }
  // taras na piętrze (wg DWG), wspornikowy – bez słupów i podcienia; czarna balustrada
  { const t = U.terr, g = new THREE.Group(); g.name = 'UPPER'; CUR.add(g); const prev = CUR; CUR = g;
    B(t.x0, t.x1, t.y0, t.y1, 272, HU0 - 12, mat.ext); B(t.x0, t.x1 + 3, t.y0 - 3, t.y1 + 3, HU0 - 12, HU0 - 6, mat.ext); B(t.x0, t.x1 + 5, t.y0 - 5, t.y1 + 5, HU0 - 6, HU0 - 2, mat.ext); // czoło tarasu z gzymsem (wg DWG) const f = B(t.x0, t.x1 - 2, t.y0 + 2, t.y1 - 2, HU0 - 2, HU0 + 1, mat.terr, { cast: false }); uvScale(f, .5);
    // filary wg DWG: słup żelbetowy 25×25 w obudowie ok. 40×40 (x 935…975), tynk biały, cokół i głowica
    for (const yc of [465, 910]) { const x0 = 935, x1 = 975, y0 = yc - 20, y1 = yc + 20;
      B(x0 - 3, x1 + 3, y0 - 3, y1 + 3, -12, 40, mat.ext); B(x0, x1, y0, y1, 40, 235, mat.ext);
      B(x0 - 2, x1 + 2, y0 - 2, y1 + 2, 235, 255, mat.ext); B(x0 - 4, x1 + 4, y0 - 4, y1 + 4, 255, 272, mat.ext); }
    railing('y', t.y0 + 4, t.y1 - 4, t.x1 - 6, HU0 + 1, 100, 11); railing('x', t.x0 + 4, t.x1 - 6, t.y0 + 6, HU0 + 1, 100, 11); railing('x', t.x0 + 4, t.x1 - 6, t.y1 - 6, HU0 + 1, 100, 11);
    CUR = prev; }
  // spód wysunięcia piętra (nad wejściem i od północy)
}
function buildZone() {
  zoneShell(); zoneFloors();
  for (const h of HOUSE.heads) { const xs = h.o.map(p => p[0]), ys = h.o.map(p => p[1]); if (Math.min(...ys) > 380 && Math.max(...ys) < 430) continue; if (Math.min(...ys) > 970 && Math.max(...ys) < 1075 && Math.max(...xs) <= 1) continue; casing(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)); }
  zoneHall(); houseWC(); zoneOffice(); zoneStairs(); zoneScullery(); zoneKitchen(); zoneDining(); zoneWardrobe();
  zoneGym(); zoneGarage(); zoneExterior(); livingDetails(); zoneCornice(); zoneUpper();
}

async function buildHouse() {
  if (ZONE) { HOUSE = window.__ZONE || await (await fetch(ASSET + 'zone.json')).json(); buildZone(); return; }
  HOUSE = await (await fetch(ASSET + 'house.json')).json();
  houseShell(); houseFloors();
  for (const h of HOUSE.heads) { const xs = h.o.map(p => p[0]), ys = h.o.map(p => p[1]); casing(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)); }
  doorLeaf(-169, 394, -79, 419, -1); doorLeaf(-405, 394, -315, 419, 1);
  houseHall(); houseWardrobe(); houseWC(); houseBoiler(); houseKitchen(); houseStairs(); houseOffice(); houseGym();
  livingDetails(); dining();
}

if (HOUSE_MODE) await buildHouse(); else { architecture(); dining(); }
const CF = { '1': concept1, '2': concept2, '3': concept3, '4': concept4, '5': concept5, '6': concept6, 'r1': conceptR1, 'r2': conceptR2, 'r3': conceptR3, 'r4': conceptR4, 'p1': conceptP1, 'p2': conceptP2, 'p3': conceptP3, 'p4': conceptP4, 'c1': conceptCL1, 'c2': conceptCL2, 'c3': conceptCL3, 'c4': conceptCL4, 'c5': conceptCL5, 'c6': conceptCL6, 'm1': conceptM1, 'm2': conceptM2, 'm3': conceptM3, 'm4': conceptM4, 'm5': conceptM5, 'm6': conceptM6, 'k1b': conceptK1B, 'k1w': conceptK1W, 'k1w2': () => conceptK1W(true), 'k2w': () => conceptK2W('L'), 'k2wp': () => conceptK2W('P'), 'k2wz': () => conceptK2W('L', true), 'k2wpz': () => conceptK2W('P', true), 'k2wr': () => conceptK2W('R'), 'k2wrz': () => conceptK2W('R', true) }; const GS = {};
const CS = (Q.get('cs') || '').split(',').filter(Boolean);
for (const k in CF) if ((INTER && (!CS.length || CS.includes(k))) || CONCEPT === k) { GS[k] = new THREE.Group(); ROOT.add(GS[k]); CUR = GS[k]; CF[k](); GS[k].visible = CONCEPT === k; }
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
if (ZONE) { const sky3 = new THREE.RectAreaLight('#dfe9f2', 1.0, 2.4, 2.4); sky3.position.set(-5.52, 1.2, 10.85); sky3.lookAt(0, 1.2, 10.85); scene.add(sky3); }
const hemi = new THREE.HemisphereLight('#f6efe4', '#b89a74', .25); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe2b8', +(Q.get('sun') || 7)); sun.position.set(-15, 8.2, 5.2); sun.target.position.set(HOUSE_MODE ? 3 : -2.2, 0, HOUSE_MODE ? 7 : 1.0); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(INTER ? 2048 : 4096, INTER ? 2048 : 4096); const sc = sun.shadow.camera; const SS = HOUSE_MODE ? 15 : 8; sc.left = -SS; sc.right = SS; sc.top = SS; sc.bottom = -SS; sc.near = 1; sc.far = 40; sun.shadow.bias = -0.0003; sun.shadow.normalBias = .02;
// liście drzew przed oknem – rzucają cień jak na zdjęciu referencyjnym
const leafTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 1024);
  g.fillStyle = '#fff'; for (let i = 0; i < 900; i++) { const x = rnd() * 1024, y = rnd() * 1024; g.save(); g.translate(x, y); g.rotate(rnd() * 6.28); g.beginPath(); g.ellipse(0, 0, 10 + rnd() * 16, 5 + rnd() * 7, 0, 0, 7); g.fill(); g.restore(); }
  g.strokeStyle = '#fff'; g.lineWidth = 5; for (let i = 0; i < 25; i++) { g.beginPath(); g.moveTo(rnd() * 1024, rnd() * 1024); g.lineTo(rnd() * 1024, rnd() * 1024); g.stroke(); }
  const t = new THREE.CanvasTexture(c); return t; })();
const goboMat = new THREE.MeshBasicMaterial({ alphaMap: leafTex, transparent: false, alphaTest: .5, side: THREE.DoubleSide, colorWrite: false, depthWrite: false });
for (const [px, pz, sz] of [[-8.2, 3.0, 4.5], [-8.6, 0.2, 3.5], [-8.0, 5.8, 3]]) { const gb = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz * 1.2), goboMat); gb.position.set(px, 4.6, pz); gb.rotation.y = Math.PI / 2 + .3; gb.castShadow = true; if (ZONE) gb.name = 'GARDEN'; scene.add(gb); }

// ---------------- camera ----------------
const VIEWS = {
  main:   { pos: [330, 525, 160], look: [330, 0], up: 41, down: 33 },
  niche1: { pos: [515, 120, 140], look: [0, 235], up: 30, down: 26 },
  niche1w: { pos: [520, 150, 140], look: [0, 230], up: 30, down: 26 },
  tvside: { pos: [80, 300, 150], look: [420, 0], up: 35, down: 30 },
  niche2: { pos: [535, 240, 132], look: [0, 197], up: 28, down: 24 },
  bok:    { pos: [300, 560, 150], look: [40, 330], up: 30, down: 26 },
  kuch:   { pos: [300, 700, 170], look: [300, 0], up: 32, down: 34 },
  okno:   { pos: [120, 380, 160], look: [553, 120], up: 45, down: 30 },
  sufit:  { pos: [180, 197, 150], look: [0, 197], up: 50, down: 10 },
  wall:   { pos: [540, 205, 150], look: [0, 205], up: 42, down: 28 },
  gap:    { pos: [330, 60, 160], look: [0, 200], up: 55, down: 5 },
  wide:   { pos: [40, 600, 150], look: [420, 60], up: 38, down: 32 },
  top:    { top: true, fov: 40, up: 10, down: 10, pos: [0, 0, 0], look: [0, 0] },
  zjad:   { pos: [400, 300, 160], look: [200, 1200], up: 36, down: 34 },
  zkuch:  { pos: [255, 760, 160], look: [255, 1278], up: 38, down: 36 },
  zkarE:  { pos: [150, 700, 160], look: [560, 1150], up: 45, down: 20 },
  zkarW:  { pos: [380, 700, 160], look: [-20, 1150], up: 45, down: 20 },
  zwys:   { pos: [505, 870, 160], look: [60, 1180], up: 36, down: 36 },
  zsch:   { pos: [380, 640, 160], look: [-135, 820], up: 40, down: 34 },
  zspi:   { pos: [-165, 1050, 160], look: [-300, 690], up: 38, down: 36 },
  zhol:   { pos: [-40, 532, 160], look: [-529, 532], up: 36, down: 36 },
  zwc:    { pos: [-40, 335, 160], look: [-244, 335], up: 40, down: 40 },
  zsil:   { pos: [-250, 1330, 165], look: [250, 1650], up: 36, down: 36 },
  zogr:   { pos: [2100, 250, 380], look: [300, 650], up: 30, down: 20 },
  zfront: { pos: [-1900, 250, 330], look: [-600, 600], up: 30, down: 18 },
  zbok:   { pos: [-650, -650, 420], look: [-1050, 1200], up: 30, down: 22 },
  zgymE:  { pos: [-200, 1500, 150], look: [332, 1500], up: 40, down: 36 },
  zgymN:  { pos: [100, 1350, 150], look: [100, 1723], up: 40, down: 36 },
  zgaraz: { pos: [-720, 1660, 170], look: [-1450, 1150], up: 36, down: 38 },
  ztech:  { pos: [-360, 1445, 165], look: [-640, 1300], up: 40, down: 40 },
  zgar:   { pos: [-490, 700, 160], look: [-490, 1280], up: 36, down: 36 },
  zpod:   { pos: [200, 690, 140], look: [-135, 800], up: 40, down: 30 },
  zgab:   { pos: [-105, 15, 160], look: [-640, 320], up: 36, down: 36 },
  zutop:  { top: true, fov: 42, up: 10, down: 10, pos: [0, 0, 0], look: [0, 0], c: [-60, 660, 2400] },
  zsouth: { pos: [1000, -650, 260], look: [300, 200], up: 30, down: 22 },
  zuhol:  { pos: [480, 500, 490], look: [-400, 520], up: 40, down: 30 },
  zterr:  { iso: true, fov: 60, pos: [1000, 520, 200], look: [600, 700, 300], up: 40, down: 40 },
  zsalA:  { iso: true, fov: 70, pos: [380, 60, 150], look: [250, 500, 380], up: 40, down: 40 },
  zuant:  { iso: true, fov: 70, pos: [180, 520, 500], look: [420, 60, 250], up: 40, down: 40 },
  zusch:  { pos: [-60, 590, 490], look: [-190, 980], up: 40, down: 40 },
  zusypg: { pos: [470, 600, 490], look: [60, 880], up: 38, down: 34 },
  zulazg: { pos: [470, 960, 490], look: [200, 1250], up: 38, down: 34 },
  zugard: { pos: [70, 960, 490], look: [-250, 1250], up: 38, down: 34 },
  zusyp1: { pos: [-200, 360, 490], look: [-600, 60], up: 38, down: 34 },
  zusyp2: { pos: [-300, 720, 490], look: [-600, 1300], up: 38, down: 34 },
  ztop:   { top: true, fov: 42, up: 10, down: 10, pos: [0, 0, 0], look: [0, 0], c: [-60, 640, 2600] },
  zsal:   { iso: true, fov: 70, pos: [120, 380, 200], look: [540, 120, 470], up: 40, down: 40 },
  iso:    { iso: true, fov: 38, pos: [700, -900, 1500], look: [-450, 850, 0], up: 10, down: 10 },
};
const vk = VIEW === 'niche' ? ((CONCEPT === '2' || /^k2w/.test(String(CONCEPT))) ? 'niche2' : (String(CONCEPT).startsWith('k1w') ? 'niche1w' : 'niche1')) : VIEW; const V = VIEWS[vk];
if (/^z(ogr|front|bok)$/.test(VIEW)) scene.traverse(o => { if (o.name === 'GARDEN') o.visible = false; });
if (Q.get('up') === '0') scene.traverse(o => { if (o.name === 'UPPER') o.visible = false; });
if (Q.get('lab') === '1') scene.traverse(o => { if (o.name === 'LABEL') o.visible = true; });
if (Q.get('hide') === 'ceil') scene.traverse(o => { if (o.name === 'CEIL') o.visible = false; if (o.isMesh && o.geometry && !o.name) { } });
const d2r = Math.PI / 180, tu = Math.tan(V.up * d2r), td = Math.tan(V.down * d2r), tm = Math.max(tu, td);
const fh = H * 2 * tm / (tu + td);
const cam = new THREE.PerspectiveCamera(2 * Math.atan(tm) / d2r, W / fh, .05, 80);
cam.position.set(-V.pos[0] / 100, V.pos[2] / 100, V.pos[1] / 100); cam.lookAt(-V.look[0] / 100, V.pos[2] / 100, V.look[1] / 100);
if (V.top || V.iso) { cam.fov = V.fov || 40; cam.aspect = W / H; const [px, py, ph] = V.top ? (V.c || [-500, 840, 2900]) : V.pos; cam.position.set(-px / 100, ph / 100, py / 100); if (V.top) cam.up.set(0, 0, 1); const L = V.top ? [(V.c || [-500])[0], (V.c || [0, 840])[1], 0] : V.look; cam.lookAt(-L[0] / 100, L[2] / 100, L[1] / 100); }
else if (!INTER) cam.setViewOffset(W, fh, 0, fh / 2 - tu / tm * fh / 2, W, H); else { cam.aspect = W / H; cam.fov = 60; }
cam.updateProjectionMatrix();

const comp = new EffectComposer(renderer); comp.addPass(new RenderPass(scene, cam));
const ao = new GTAOPass(scene, cam, W, H); ao.updateGtaoMaterial({ radius: .35, distanceExponent: 1.5, thickness: 1, scale: 1.1 }); ao.blendIntensity = .85; comp.addPass(ao);
comp.addPass(new OutputPass());
if (INTER) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.fov = 62; cam.updateProjectionMatrix(); comp.setSize(innerWidth, innerHeight);
  const ctl = new OrbitControls(cam, renderer.domElement); ctl.enableDamping = true; ctl.maxDistance = HOUSE_MODE ? 40 : 5; ctl.minDistance = .3; ctl.maxPolarAngle = Math.PI * .62; if (HOUSE_MODE) cam.far = 200, cam.updateProjectionMatrix();
  const P3 = (x, y, h) => [-x / 100, h / 100, y / 100];
  const PRE = ZONE ? {
    jadalnia: [P3(330, 330, 165), P3(270, 900, 120)], kuchnia: [P3(260, 760, 165), P3(255, 1250, 140)], wyspa: [P3(500, 880, 160), P3(120, 1120, 110)],
    schody: [P3(330, 600, 160), P3(-80, 830, 150)], spizarnia: [P3(-180, 1030, 160), P3(-260, 760, 120)], hol: [P3(-60, 530, 160), P3(-529, 530, 130)], hol2: [P3(-500, 530, 160), P3(-25, 530, 130)],
    gabinet: [P3(-120, 30, 165), P3(-560, 260, 100)], garderoba: [P3(-490, 705, 165), P3(-490, 1150, 130)], wc: [P3(-40, 335, 160), P3(-240, 335, 115)], silownia: [P3(-250, 1340, 165), P3(150, 1600, 110)], garaz: [P3(-720, 1660, 170), P3(-1400, 1150, 90)], techniczne: [P3(-360, 1445, 165), P3(-640, 1300, 110)], kotlownia: [P3(-600, 1500, 165), P3(-345, 1620, 110)],
    ogrod: [P3(2100, 250, 380), P3(300, 650, 330)], front: [P3(-1900, 250, 330), P3(-600, 600, 330)], bok: [P3(-650, -650, 420), P3(-1050, 1200, 180)], podschodami: [P3(150, 700, 140), P3(-100, 800, 90)], salon: [P3(330, 520, 160), P3(316, 150, 150)], wneka: [P3(515, 120, 140), P3(60, 230, 140)],
    dom: [P3(-60, 120, 1900), P3(-60, 660, 0)], gora: [P3(-60, 160, 2100), P3(-60, 660, 330)],
    p_hol: [P3(480, 500, 490), P3(-400, 520, 460)], p_schody: [P3(-60, 590, 490), P3(-190, 980, 400)], p_sypg: [P3(470, 600, 490), P3(60, 880, 440)], p_lazg: [P3(190, 1255, 490), P3(520, 1000, 440)],
    p_gard: [P3(70, 960, 490), P3(-250, 1250, 430)], p_syp1: [P3(-200, 360, 490), P3(-600, 60, 440)], p_lazs: [P3(-110, 370, 490), P3(60, 30, 430)], p_syp2: [P3(-300, 720, 490), P3(-600, 1300, 440)], p_pral: [P3(-470, 560, 490), P3(-640, 420, 440)] } : HOUSE_MODE ? {
    dom: [P3(900, -1100, 1700), P3(-450, 800, 0)], salon: [P3(330, 520, 160), P3(316, 150, 150)], wneka: [P3(515, 120, 140), P3(60, 230, 140)],
    kuchnia: [P3(300, 720, 165), P3(270, 1150, 120)], hol: [P3(-60, 520, 160), P3(-400, 525, 140)], garderoba: [P3(-580, 750, 165), P3(-480, 1040, 120)],
    wc: [P3(-60, 340, 160), P3(-200, 335, 120)], kotlownia: [P3(-400, 1500, 165), P3(-520, 1620, 110)], schody: [P3(-90, 470, 160), P3(-90, 800, 200)] }
  : { salon: [[-3.3, 1.6, 5.25], [-3.0, 1.5, 1.5]], wneka: [[-5.15, 1.4, 1.2], [-0.6, 1.4, 2.3]], okno: [[-0.6, 1.6, 3.6], [-4.5, 1.7, 1.2]], choinka: [[-1.2, 1.7, 3.8], [-5.0, 2.0, 1.6]], kuch: [[-3.0, 1.7, 7.0], [-3.0, 1.2, 1.5]], gora: [[-4.8, 4.8, 4.0], [-2.5, 0.6, 1.8]] };
  window.__ceil = on => { scene.traverse(o => { if (o.name === 'CEIL' || o.name === 'GARDEN') o.visible = on; }); scene.background = new THREE.Color(on ? '#e9f0f2' : '#f3efe8'); dirty = 3; };
  const go = k => { const ext = ['ogrod', 'front', 'bok'].includes(k); scene.traverse(o => { if (o.name === 'GARDEN') o.visible = !ext && k !== 'dom' && k !== 'gora'; if (o.name === 'UPPER') o.visible = k !== 'dom'; if (o.name === 'LABEL') o.visible = k === 'gora'; }); const [p, t] = PRE[k]; cam.position.set(...p); ctl.target.set(...t); ctl.update(); dirty = 3; };
  let dirty = 3; ctl.addEventListener('change', () => dirty = 2);
  window.__setConcept = c => { for (const k in GS) GS[k].visible = k === c; dirty = 3; };
  window.__tree = kind => { scene.traverse(o => { if (o.name && o.name.startsWith('TREE_')) o.visible = o.name === 'TREE_' + kind; }); dirty = 3; };
  window.__go = go; window.__render = () => dirty = 3; if (ZONE) go('jadalnia'); else if (HOUSE_MODE) { go('dom'); window.__ceil(false); } else go('salon');
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); comp.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); dirty = 3; });
  const loop = () => { requestAnimationFrame(loop); ctl.update(); if (dirty > 0) { comp.render(); dirty--; } }; loop(); window.__ready && window.__ready();
} else { if (TREE) scene.traverse(o => { if (o.name && o.name.startsWith('TREE_')) o.visible = o.name === 'TREE_' + TREE; }); comp.render(); comp.render(); window.__done = true; }
