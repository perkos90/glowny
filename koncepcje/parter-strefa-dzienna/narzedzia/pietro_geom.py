import json
from shapely.geometry import Polygon, box, LineString, mapping
from shapely.ops import unary_union
L=json.load(open('/tmp/dwgwork/up_layers.json'))
Z=json.load(open('/tmp/viz/web/zone.before_up.json'))
def P(p):
    g=Polygon(p); return g if g.is_valid else g.buffer(0)
MUR='A_\\U+015Aciana murowana'; ZEL='A_\\U+017Belbet'; OC='A_Ocieplenie'
mas=unary_union([P(p) for k in (MUR,ZEL) for p in L.get(k,[]) if len(p)>3])
ins=unary_union([P(p) for p in L[OC] if len(p)>3]).difference(mas)
# zaślepki szachtów / kanałów (nie są drzwiami)
fills=[box(295,1278,367,1302),box(-154,1072,-99,1096),box(150,-26,171,-1),box(-165,240,-132,279),box(-483,393,-445,418)]
mas=unary_union([mas]+fills)
# antresola: podciąg nad salonem nie jest ścianą na piętrze
mas=mas.difference(box(103,380,531,430))
# wysunięcie przed fasadą nad wejściem = płyta mini balkonu (nie ściana)
BALK=box(-735,380,-689,692)
ins=ins.difference(BALK)
allw=unary_union([mas,ins])
foot=allw.buffer(300,join_style=2).buffer(-300,join_style=2)
foot=Polygon(foot.exterior)
def polys(g):
    gs=[g] if g.geom_type=='Polygon' else [x for x in g.geoms if x.geom_type=='Polygon']
    return [dict(o=[[round(v,1) for v in c] for c in x.exterior.coords],h=[[[round(v,1) for v in c] for c in r.coords] for r in x.interiors]) for x in gs if x.area>20]
# drzwi wewnętrzne
D=[(-417,647,-328,672,'NW'),(183,932,273,944,'łaz. gł.'),(10,932,100,944,'garderoba'),(-445,497,-427,587,'pralnia'),(-417,393,-327,418,'syp. SW'),(-95,393,-5,418,'łaz. S')]
near=mas.intersection(box(205,540,300,600)).bounds
D.append((50,near[1],210,near[3],'syp. gł. (2 skrzydła)'))
doors=[dict(x0=a,y0=b,x1=c,y1=d,name=n) for a,b,c,d,n in D]
# okna (wszystkie Hp=0, h=240)
W=[('S','x',-446,-341),('S','x',-61,44),('W','y',87,267),('W','y',470,600),('W','y',804,984),('N','x',-518,-378),('E','y',471,561),('E','y',667,847),('E','y',997,1177)]
wins=[]
for f,ax,a0,a1 in W:
    am=(a0+a1)/2
    probe=LineString([(am,-200),(am,1600)]) if ax=='x' else LineString([(-900,am),(800,am)])
    cand=allw.intersection(box(a0-40,-200,a1+40,1600) if ax=='x' else box(-900,a0-40,800,a1+40))
    # grubość: element ściany przy krawędzi footprintu po właściwej stronie
    fp=foot.exterior
    if f in('S','N'):
        yy=[c[1] for c in foot.intersection(LineString([(a0-20,-200),(a0-20,1600)])).coords]
        c_out=min(yy) if f=='S' else max(yy)
        seg=allw.intersection(box(a0-30,c_out-1 if f=='N' else c_out-1,a1+30,c_out+1)).bounds
        # przekrój przez ścianę obok otworu
        col=allw.intersection(LineString([(a0-12,c_out-120 if f=='N' else c_out),(a0-12,c_out if f=='N' else c_out+120)]))
        b=col.bounds; c0,c1=b[1],b[3]
        wins.append(dict(f=f,ax='x',x0=a0,x1=a1,y0=c0,y1=c1,out=c_out,d=-1 if f=='S' else 1))
    else:
        xx=[c[0] for c in foot.intersection(LineString([(-900,a0-20),(800,a0-20)])).coords]
        c_out=min(xx) if f=='W' else max(xx)
        col=allw.intersection(LineString([(c_out if f=='W' else c_out-120,a0-12),(c_out+120 if f=='W' else c_out,a0-12)]))
        b=col.bounds; c0,c1=b[0],b[2]
        wins.append(dict(f=f,ax='y',y0=a0,y1=a1,x0=c0,x1=c1,out=c_out,d=-1 if f=='W' else 1))
for w in wins:
    if w['f']=='N': w['sill']=180  # O10 140×60 wg DWG (Hp=0 na rzucie to błąd – okno nad łóżkiem, nad dachem parteru)
    if w['f']=='E' and w['y0']>=442 and w['y1']<=932: w['terr']=True
    print(w)
# okna przecinają całą grubość ściany (także wysunięcie nad wejściem)
ob=unary_union([box(w['x0'],w['y0'],w['x1'],w['y1']) for w in wins])
mas=mas.difference(ob); ins=ins.difference(ob); allw=unary_union([mas,ins])
# otwory w stropie
void=box(102,-60,600,394)
stair=Polygon([(-136,665),(-25,665),(-25,1072),(-243,1072),(-243,862),(-136,862)])
# posadzki piętra: wnętrze bez ścian, bez pustki i otworu schodów
inner=foot.difference(allw).difference(void).difference(stair)
inner=unary_union([g for g in (inner.geoms if hasattr(inner,'geoms') else [inner]) if g.area>2000])
bath=[box(-145,0,95,393),box(160,944,531,1278)]
floorBath=inner.intersection(unary_union(bath)); floorOak=inner.difference(unary_union(bath))
# strop parteru = stary + rzut piętra, z otworami
oldslab=Polygon(Z['slabP'][0]['o'])
slab=unary_union([oldslab,foot]).difference(void).difference(stair)
# sufit piętra (590..646)
ceil=foot.difference(void.intersection(box(102,0,531,394)))
# elewacja piętra: pas 2.5 cm wokół rzutu, z otworami okien
ring=foot.buffer(2.5,join_style=2).difference(foot)
cuts=[]
for w in wins:
    cuts.append(box(w['x0']-1,w['out']-6,w['x1']+1,w['out']+6) if w['ax']=='x' else box(w['out']-6,w['y0']-1,w['out']+6,w['y1']+1))
ring=ring.difference(unary_union(cuts+[box(553,-60,600,394)]))
dark_zone=box(0,0,0.1,0.1)  # ciemna bryła salonu rysowana osobno (zoneDarkBlock)
skin=[]
for g in (ring.geoms if hasattr(ring,'geoms') else [ring]):
    for part in [g.intersection(dark_zone),g.difference(dark_zone)]:
        for q in polys(part):
            q['dark']=part.equals(g.intersection(dark_zone)); skin.append(q)
eave=foot.buffer(14,join_style=2).difference(foot)
corn=[]
for off,h0,h1 in [(3.5,587,607),(5.5,607,615),(8,615,624),(12,624,634),(16,634,642),(12,642,654),(28,654,662)]:
    ring=foot.buffer(off,join_style=2).difference(foot)
    DK=unary_union([box(230,-90,640,-44),box(575,-90,640,452)])  # ciemna bryła salonu – biały gzyms nie nachodzi na jej opaskę (do 6,02)
    if h0<602:
        corn.append(dict(h0=h0,h1=h1,p=polys(ring.difference(DK))))
        if h1>602: corn.append(dict(h0=602,h1=h1,p=polys(ring.intersection(DK))))
    else: corn.append(dict(h0=h0,h1=h1,p=polys(ring)))
gut=polys(foot.buffer(31,join_style=2).difference(foot.buffer(26,join_style=2)))
soff=polys(box(-720,-82,612,1409).difference(foot))  # podsufitka okapu pod całym dachem (bez szczelin przy uskokach)
labels=[('Sypialnia 1',-400,190),('Łazienka',-30,190),('Pustka nad salonem',320,200),('Hol / antresola',230,490),('Pralnia',-540,600),
        ('Sypialnia 2',-480,1000),('Schody',-140,960),('Sypialnia główna',260,750),('Garderoba',-100,1200),('Łazienka główna',350,1110)]
Z['UP']=dict(footS=polys(foot.simplify(3))[0],corn=corn,gut=gut,soff=soff,walls=polys(mas),ins=polys(ins),doors=doors,wins=wins,floorOak=polys(floorOak),floorBath=polys(floorBath),ceil=polys(ceil),
             skin=skin,eave=polys(eave),foot=polys(foot)[0],labels=labels,terr=dict(x0=581,x1=975,y0=442,y1=932),balk=dict(x0=-732,x1=-689,y0=382,y1=689),stair=[list(c) for c in stair.exterior.coords])
Z['slabP']=polys(slab)
Z['upP']=[]
for s in Z['skin']: pass
Z['skin']=[s for s in Z['skin'] if s['lev']!='U']
json.dump(Z,open('/tmp/viz/web/zone.json','w'))
print('foot',foot.bounds,'skin',len(skin),'slab',len(Z['slabP']))
