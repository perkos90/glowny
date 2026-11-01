import json
from shapely.geometry import Polygon, box, mapping, LineString
from shapely.ops import unary_union
L=json.load(open('/tmp/dwgwork/gf_layers.json'))
def P(p):
    g=Polygon(p); return g if g.is_valid else g.buffer(0)
mas=unary_union([P(p) for k in ('A_\\U+015Aciana murowana','A_\\U+017Belbet') for p in L[k] if len(p)>3])
ins=unary_union([P(p) for p in L['A_Ocieplenie'] if len(p)>3]).difference(mas)
allw=unary_union([mas,ins])
def polys(g):
    gs=[g] if g.geom_type=='Polygon' else list(g.geoms)
    return [dict(o=[list(map(lambda v:round(v,1),c)) for c in x.exterior.coords],h=[[list(map(lambda v:round(v,1),c)) for c in r.coords] for r in x.interiors]) for x in gs if x.area>20]
# A) nadproża drzwi: domknięcie R=50
cl=allw.buffer(50,join_style=2).buffer(-50,join_style=2).difference(allw)
heads=[]
for g in ([cl] if cl.geom_type=='Polygon' else cl.geoms):
    if g.area<200: continue
    r=g.minimum_rotated_rectangle; xs=[c[0] for c in r.exterior.coords]; ys=[c[1] for c in r.exterior.coords]
    import math
    c=list(r.exterior.coords); d1=math.dist(c[0],c[1]); d2=math.dist(c[1],c[2]); lo,sh=max(d1,d2),min(d1,d2)
    if 60<=lo<=135 and sh>=8: heads.append(g)
print('door headers',len(heads),[ (round(h.bounds[0]),round(h.bounds[1]),round(h.bounds[2]),round(h.bounds[3])) for h in heads])
# B) okna: (nazwa, oś, a0,a1, środek poprzeczny, parapet, góra, podział)
W=[('O1 gabinet płd','x',-295,-106,-23,0,240,2),('O1 gabinet zach','y',83,272,-662,0,240,2),
   ('O2 jadalnia','y',523,852,554,0,240,3),('O1 garderoba (HS)','y',800,989,-662,0,240,2),
   ('O4 kuchnia (HS)','y',963,1212,554,0,240,2),('O5 siłownia płn','x',-40,232,1705,0,240,2),('O5 siłownia wsch','y',1380,1652,290,0,240,2),
   ('O6 garaż','x',-1346,-1177,1705,143,203,2),('O6 garaż','x',-977,-808,1705,143,203,2),
   ('D1 wejście','y',484,577,-555,0,215,0)]
wins=[]
for name,ax,a0,a1,c,sill,top,div in W:
    strip=box(a0-5,c-90,a1+5,c+90) if ax=='x' else box(c-90,a0-5,c+90,a1+5)
    near=allw.intersection(box(a0-60,c-42,a1+60,c+42) if ax=='x' else box(c-42,a0-60,c+42,a1+60))
    b=near.bounds  # across extent
    c0,c1=(b[1],b[3]) if ax=='x' else (b[0],b[2])
    rect=box(a0,c0,a1,c1) if ax=='x' else box(c0,a0,c1,a1)
    gap=rect.difference(allw)
    gb=gap.bounds if not gap.is_empty else rect.bounds
    wins.append(dict(name=name,ax=ax,x0=gb[0],y0=gb[1],x1=gb[2],y1=gb[3],sill=sill,top=top,div=div))
    print(name,[round(v) for v in gb])
from shapely.geometry import Point
ys=[y for y in range(1030,1130,4) if allw.intersects(LineString([(-1600,y),(-640,y)]))]
print('garage wall y',ys[:3],ys[-3:])
GY=(ys[0]+ys[-1])/2 if ys else 1080
# bramy garażowe: szczeliny w ścianie płd. garażu
line=LineString([(-1600,GY),(-640,GY)]).difference(allw)
gates=[]
for s in ([line] if line.geom_type=='LineString' else line.geoms):
    x0,x1=sorted([s.coords[0][0],s.coords[-1][0]])
    if 200<x1-x0<400:
        near=allw.intersection(box(x0-40,1040,x1+40,1160)).bounds; gates.append(dict(name='G1 brama',ax='x',x0=x0,y0=near[1],x1=x1,y1=near[3],sill=0,top=250,div=0)); print('gate',round(x0),round(x1),near)
foot=allw.buffer(260,join_style=2).buffer(-260,join_style=2)
foot=Polygon(foot.exterior) if foot.geom_type=='Polygon' else Polygon(max(foot.geoms,key=lambda g:g.area).exterior)
slab=foot.intersection(box(-2000,-100,581,2000))
slab=Polygon(slab.exterior) if slab.geom_type=='Polygon' else Polygon(max(slab.geoms,key=lambda g:g.area).exterior)
json.dump(dict(slab=polys(slab)[0],walls=polys(mas),ins=polys(ins),heads=[polys(h)[0] for h in heads],wins=wins+gates,foot=polys(foot)[0]),open('/tmp/viz/web/house.json','w'))
print('ok', foot.bounds)
