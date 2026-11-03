# Profil gzymsu piętra wg przekroju z DXF (wysokości/wysunięcia w cm od lica klinkieru):
# fryz 18 cm (+2), listwa 2 cm (+3), 4 cm (+5), 8 cm (+9), nad nim podbitka.
# Generuje UP.corn2 w zone.json jako offsety obrysu ściany piętra (shapely).
import json, sys
from shapely.geometry import Polygon
p = sys.argv[1] if len(sys.argv) > 1 else 'zone.json'
d = json.load(open(p)); u = d['UP']
W = Polygon(u['corn2'][0]['h'][0]).buffer(0.5, join_style=2)
u['corn2'] = [{'d': dd, 'o': [[round(x, 1), round(y, 1)] for x, y in W.buffer(dd, join_style=2, mitre_limit=5).simplify(0.2).exterior.coords],
               'h': [[[round(x, 1), round(y, 1)] for x, y in W.buffer(-0.5, join_style=2).simplify(0.2).exterior.coords]]} for dd in [4.5, 5.5, 7.5, 11.5]]
json.dump(d, open(p, 'w'))
