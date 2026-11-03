# Buduje garden.js z pliku „Ogród w Izabelinie” (tylko ogród: bez domu, świateł, nieba i UI)
import re, sys
src = open(sys.argv[1]).read()
m = src.split('<script type="module">', 1)[1].split('</script>', 1)[0]
L = m.split('\n')
def idx(pred, start=0):
    for i in range(start, len(L)):
        if pred(L[i]): return i
    raise SystemExit('marker not found')
i_basics = idx(lambda s: s.startswith('/* ---------- basics'))
i_stage = idx(lambda s: s.startswith('const stage'))
i_geom = idx(lambda s: s.startswith('/* ---------- geometry builder'))
i_build = idx(lambda s: s.startswith('const BUILD = new THREE.Group()'))
i_block = idx(lambda s: s.startswith('function block('), i_build)
i_hend = idx(lambda s: s == 'target = scene;', i_block)
i_furn = idx(lambda s: s.startswith('/* terrace furniture'), i_hend)
i_fence = idx(lambda s: s.startswith('/* fences'), i_furn)
i_labels = idx(lambda s: s.startswith('/* ---------- labels'))
i_inpoly = idx(lambda s: s.startswith('function inPoly('))
furn = L[i_furn:i_fence]
seat = [s for s in furn if s.startswith('const mWood') or s.startswith('function seat(')]
body = (L[i_basics:i_stage] + ['const scene = ROOT;'] + L[i_geom:i_build] +
        [s for s in L[i_build + 1:i_block + 1]] +           # funkcje elewacji (nieużywane) bez bryły domu
        seat + L[i_fence:i_labels] + [L[i_inpoly]])
js = '\n'.join(body)
rep = [
  ("renderer.capabilities.getMaxAnisotropy()", "8"),
  ("slab(TERRACE, 0, TER, mTerr, false);", "/* taras – z modelu domu (DWG) */"),
  ("slab(rect(14.71, 62.65, 18.02, 63.25), 0, .15, mStone, false);", "/* stopień wejścia – z modelu domu (DWG) */"),
  ("const PLANTERS = [rect(11.8, 63.05, 14.6, 63.65),", "const PLANTERS = [rect(11.8, 63.05, 14.35, 63.65),"),
  ("const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;", ""),
  # stożki światła z lamp (efekt wieczorny) dawały trójkątne smugi na elewacji – wyłączone
  ("cone.renderOrder = 5; target.add(cone);", "cone.renderOrder = 5; cone.visible = false; target.add(cone);"),
]
for a, b in rep:
    assert a in js, a; js = js.replace(a, b)
# światła ogrodu (wieczór) pomijamy – w modelu domu są własne; zostają same oprawy
js = js.replace('new THREE.SpotLight(', 'NOLIGHT(').replace('new THREE.PointLight(', 'NOLIGHT(')
js = re.sub(r"\n  ([123]): buildConcept\(\{", r"\n  \1: () => buildConcept({", js)
assert js.count('() => buildConcept({') == 3
out = ("// Ogród w Izabelinie – wg planu projektanta ogrodu (1:100), bez domu. Wygenerowane przez make_garden.py.\n"
       "window.__makeGarden = function (THREE, RoundedBoxGeometry) {\n"
       "const ROOT = new THREE.Group(); ROOT.name = 'OGROD';\n"
       "const NOLIGHT = () => { const o = new THREE.Object3D(); o.target = new THREE.Object3D(); o.intensity = 0; return o; };\n"
       + js +
       "\nconst built = {};\nconst show = k => { if (!built[k]) built[k] = CONCEPTS[k](); for (const c in built) built[c].group.visible = +c === +k; };\n"
       "return { root: ROOT, show, names: { 1: 'Koncepcja I', 2: 'Koncepcja II', 3: 'Propozycja Claude' } };\n};\n")
open(sys.argv[2], 'w').write(out); print(len(out))
