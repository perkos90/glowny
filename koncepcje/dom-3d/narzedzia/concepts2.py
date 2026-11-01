import sys, random, math
sys.path.insert(0,'/tmp/scripts')
from draw import D
from concepts import C, BOOKS, NICHE, BEAM0, BEAM1, HN, plan_base, sofa_L
HT=595  # wysokość salonu (fasada 572 wg oferty Yawal + strop)
TAUPE='#b9a690'; GREEN='#3d4a3a'; LIME='#e6ddcf'; STONE='#ddd0bb'; STEEL='#1e2124'
DEFS2='''<defs>
<pattern id="cane" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#DCC9A3"/><path d="M0 3H6M3 0V6M0 0L6 6M6 0L0 6" stroke="#B89F74" stroke-width="0.6"/><circle cx="3" cy="3" r="1.1" fill="#EFE3CC"/></pattern>
<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#d9d2c7"/><path d="M0 0V6" stroke="#8d857a" stroke-width="1"/></pattern>
<pattern id="flute" width="5" height="10" patternUnits="userSpaceOnUse"><rect width="5" height="10" fill="#CFAE84"/><path d="M0.5 0V10" stroke="#B48E62" stroke-width="1.1"/></pattern>
<pattern id="lamel" width="7" height="10" patternUnits="userSpaceOnUse"><rect width="7" height="10" fill="#c9a77d"/><rect x="4.6" width="2.4" height="10" fill="#6d5338"/></pattern>
<pattern id="stone" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#ddd0bb"/><path d="M0 13H40M0 27H40M14 0V13M30 13V27M8 27V40" stroke="#c4b49b" stroke-width="0.8"/><circle cx="22" cy="6" r="1" fill="#cbbca4"/><circle cx="5" cy="20" r=".8" fill="#cbbca4"/></pattern>
<pattern id="lime" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="#e6ddcf"/><path d="M0 8Q15 2 30 9M0 22Q12 27 30 20" stroke="#ddd2c1" stroke-width="3" fill="none"/></pattern>
<pattern id="linen" width="8" height="40" patternUnits="userSpaceOnUse"><rect width="8" height="40" fill="#efe6d6"/><path d="M2 0V40" stroke="#ddd1bd" stroke-width="2.2"/></pattern>
<pattern id="mirror" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#c9c6bb"/><path d="M0 40L40 0M-10 20L20 -10M20 50L50 20" stroke="#e4e2da" stroke-width="5" opacity=".7"/><circle cx="12" cy="30" r="2" fill="#b3ab98" opacity=".6"/></pattern>
<pattern id="boucle" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#F4F0E8"/><circle cx="1.5" cy="1.5" r="0.8" fill="#E6DFD2"/><circle cx="4" cy="3.8" r="0.7" fill="#E6DFD2"/></pattern>
<pattern id="oakfloor" width="40" height="14" patternUnits="userSpaceOnUse"><rect width="40" height="14" fill="#E9D9C1"/><path d="M0 0.5H40M20 0V7M5 7V14M0 7H40" stroke="#D9C4A4" stroke-width="0.7"/></pattern>
</defs>'''
R=random.Random
def books_row(d,x0,x1,y,hmax,rnd,vases=True):
    x=x0+1
    while x<x1-4:
        r=rnd.random()
        if vases and r<.1 and x<x1-20: rr=rnd.choice([7,9]); d.circle(x+rr,y+rr*1.1,rr,fill=rnd.choice(['#f3efe8','#e2dbcf','#cfc4b2']),stroke='#bdb3a3',sw=.4); x+=2*rr+3; continue
        if r<.16 and x<x1-24:
            for j in range(3): d.rect(x,y+j*4,22,4,fill=rnd.choice(BOOKS),stroke='none',sw=0)
            x+=25; continue
        if r<.22: x+=6; continue
        w=rnd.choice([3,4,4,5,6]); h=min(hmax,rnd.choice([24,28,32,36]))
        d.rect(x,y,w,h,fill=rnd.choice(BOOKS),stroke='none',sw=0); x+=w+.5
def frame_sh(d,x,y,w,h,kind=0,rnd=None):
    d.rect(x,y,w,h,fill='#fbfbf8',stroke=C['black'],sw=2); d.rect(x+w*.14,y+h*.14,w*.72,h*.72,fill='#cfcac2',stroke='none',sw=0)
    if kind==0: d.circle(x+w/2,y+h*.55,min(w,h)*.14,fill='#77736c',stroke='none',sw=0)
    elif kind==1: d.poly([(x+w*.14,y+h*.3),(x+w*.4,y+h*.6),(x+w*.6,y+h*.45),(x+w*.86,y+h*.65),(x+w*.86,y+h*.14),(x+w*.14,y+h*.14)],fill='#9c968c',stroke='none',sw=0)
    else: d.rect(x+w*.14,y+h*.14,w*.72,h*.25,fill='#8f897f',stroke='none',sw=0)
def picture_light(d,xc,y,w=36):
    d.rect(xc-w/2,y,w,3.5,fill=C['brass'],stroke='none',sw=0); d.poly([(xc-w/2,y),(xc+w/2,y),(xc+w*.8,y-40),(xc-w*.8,y-40)],fill='#fff3d1',stroke='none',sw=0,op=.35)

def elev_base(d,niche_fill=None):
    """Widok ściany zach. (z salonu): v=y (0 = ściana zewn. po lewej), h do HT."""
    d.rect(-40,0,700,HT,fill=C['cream'],stroke='none',sw=0)
    if niche_fill: d.rect(0,0,BEAM0,HN,fill=niche_fill,stroke='none',sw=0)
    # słup + podciąg (przekrój) i strop nad otworem do holu
    d.rect(BEAM0,HN-10,BEAM1-BEAM0,HT-HN+10,fill='url(#hatch)',stroke='#8d857a',sw=.6,pattern='hatch')
    d.rect(BEAM1,HN,645-BEAM1,HT-HN,fill='url(#hatch)',stroke='#8d857a',sw=.6,pattern='hatch')
    d.rect(BEAM1,0,645-BEAM1,HN,fill='#ddd3c4',stroke='#b8a98f',sw=.8,dash=[5,3]); d.text((BEAM1+645)/2,150,'otwór – hol',8,'#8a7b66')
    d.rect(645,0,25,HT,fill=C['cream'],stroke='none',sw=0)
    d.text((BEAM1+645)/2,(HN+HT)/2,'strop / piętro',8,'#5f574d')
def elev_frame(d,label_up='antresola (ściana łazienki nad wnęką)'):
    d.line(-40,0,670,0,'#3b3631',1.6,'K_SCIANY'); d.line(-40,HT,670,HT,'#3b3631',1.2,'K_SCIANY')
    d.poly([(0,0),(0,HN),(BEAM0,HN)],fill='none',stroke='#3b3631',sw=1,closed=False)
    d.dim(0,0,BEAM0,0,-24,'wnęka 394'); d.dim(-22,0,-22,HN,0,'290'); d.dim(-22,HN,-22,HT,0,'~305'); d.dim(690,0,690,HT,-10,'~595')
    d.text(BEAM0/2,HT+12,label_up,8,'#7a6f63',italic=True)

def elevW(kind):
    d=D('W'+kind); rnd=R(int(kind)*7+3)
    if kind=='1':   # biblioteka na dwie kondygnacje
        elev_base(d,'#e9e0d1')
        for a,b in ((0,63.5),(63.5,127),(267,330.5),(330.5,394)):
            d.rect(a,0,b-a,HN,fill=C['cream'],stroke='#b9ad9b',sw=1.1); m=(a+b)/2
            for x0,x1 in ((a+3,m-.5),(m+.5,b-3)): d.rect(x0,12,x1-x0,72,fill='url(#cane)',stroke='#c4b494',sw=.5,pattern='cane')
            for y in (88,135,182,229): d.rect(a+3,y,b-a-6,3,fill='#d8cdbd',stroke='none',sw=0); books_row(d,a+4,b-4,y+3,40,rnd)
            picture_light(d,m,268,28)
        d.rect(127,0,140,HN,fill='#e3d8c7',stroke='#b9ad9b',sw=1.1); d.rect(127,42,140,12,fill='url(#boucle)',stroke='#a99d8b',sw=.8,pattern='boucle'); d.rect(133,54,128,62,fill=C['linen'],stroke='#c8bba7',sw=.8)
        for i in range(2): d.rect(131+i*68,12,64,30,fill=C['oak'],stroke=C['oak2'],sw=.8)
        for y in (180,232): d.rect(130,y,134,3,fill='#d8cdbd',stroke='none',sw=0); books_row(d,134,260,y+3,34,rnd)
        # GÓRA: regały do sufitu na ścianie antresoli
        d.rect(-2,HN,BEAM0+4,HT-HN,fill=C['cream'],stroke='#b9ad9b',sw=1.1)
        for x in (0,63.5,127,197,267,330.5,394): d.rect(x-1.5,HN,3,HT-HN,fill='#d8cdbd',stroke='none',sw=0)
        for y in (300,358,416,474,532): d.rect(0,y,BEAM0,3,fill='#d8cdbd',stroke='none',sw=0)
        for y in (303,361,419,477):
            for a,b in ((0,63.5),(63.5,127),(127,197),(197,267),(267,330.5),(330.5,394)): books_row(d,a+2,b-2,y,46,rnd)
        d.line(2,300,BEAM0-2,300,C['brass'],2.4); d.line(2,445,BEAM0-2,445,C['brass'],2.2)
        d.poly([(300,0),(314,0),(352,445),(340,445)],fill='none',stroke=C['oak2'],sw=2.6); d.poly([(340,0),(354,0),(380,445),(368,445)],fill='none',stroke=C['oak2'],sw=2.6)
        for k in range(1,16): t=k/16; d.line(300+t*(340-300)+7,t*445,340+t*(368-340)+7,t*445,C['oak2'],1.8)
        for x in (31.5,95,162,232,299,362): picture_light(d,x,585,22)
        elev_frame(d,'antresola: regały do sufitu + mosiężne szyny na 3,0 i 4,45 m')
    if kind=='2':   # TV we wnęce + lamele dębowe do sufitu
        elev_base(d,C['oakl'])
        d.rect(-2,0,BEAM0+4,HT,fill='url(#lamel)',stroke=C['oak2'],sw=1,pattern='lamel')
        d.rect(0,0,BEAM0,HN,fill='#cdb08a',stroke='none',sw=0,op=.35)
        for a,b in ((0,92),(302,394)):
            d.rect(a,0,b-a,HN,fill=C['oak'],stroke=C['oak2'],sw=1.1)
            for x0,x1 in ((a+3,(a+b)/2-.5),((a+b)/2+.5,b-3)): d.rect(x0,8,x1-x0,72,fill='url(#cane)',stroke='#a88f68',sw=.6,pattern='cane')
            d.rect(a+3,90,b-a-6,70,fill='#3a3530',stroke='#2a2622',sw=.8); d.rect(a+6,93,b-a-12,64,fill='url(#cane)',stroke='none',sw=0,pattern='cane',op=.9)
            for y in (168,218): d.rect(a+3,y,b-a-6,3,fill=C['oak2'],stroke='none',sw=0); books_row(d,a+5,b-5,y+3,38,rnd)
        d.rect(197-94.5,61,189,108,fill='#131313',stroke='#000',sw=2); d.rect(197-100,57,200,116,fill='none',stroke='#ffe9b8',sw=3,op=.45); d.text(197,115,'TV 85″',10,'#666')
        d.rect(104,20,186,32,fill=C['black'],stroke='#000',sw=1)
        d.rect(0,HN-3,BEAM0,4,fill='#fff2cf',stroke='none',sw=0,op=.9); d.text(197,HN+8,'listwa LED na krawędzi',6.5,'#7a6528')
        for x in (60,197,334): d.circle(x,HT-8,4,fill='#fff',stroke='#555',sw=.6)
        elev_frame(d,'antresola: lamele dębowe od podłogi wnęki do sufitu (akustyka)')
    if kind=='3':   # alkowa wypoczynkowa + zasłony od sufitu
        elev_base(d,TAUPE)
        for a,b in ((0,92),(302,394)):
            d.rect(a,0,b-a,82,fill='#cbbba6',stroke='#a99a85',sw=1); d.rect(a,82,b-a,3,fill=C['oak'],stroke='none',sw=0)
            for y in (140,195,245): d.rect(a+2,y,b-a-4,3,fill=C['oak'],stroke='none',sw=0); books_row(d,a+4,b-4,y+3,44,rnd)
        d.rect(94,0,206,10,fill=C['oak2'],stroke='none',sw=0)
        for p,q in ((94,196),(198,300)): d.rect(p,10,q-p,30,fill=C['oak'],stroke=C['oak2'],sw=.8); d.rect((p+q)/2-8,24,16,2,fill=C['brass'],stroke='none',sw=0)
        d.rect(92,40,210,18,fill='url(#boucle)',stroke='#a99d8b',sw=.8,pattern='boucle',rx=4)
        for y in range(94,300,17): d.rect(y,58,16,80,fill=C['linen'],stroke='#cdbfa9',sw=.5)
        for x,c in ((104,'#d8ccb8'),(150,'#f0ebe2'),(204,'#a88f74'),(248,'#f0ebe2')): d.rect(x,58,44,38,fill=c,stroke='#bfb3a0',sw=.5,rx=6)
        for y in (112,282): d.line(y,150,y+(10 if y<200 else -10),156,C['brass'],1.4); d.poly([(y-5+(12 if y<200 else -12),146),(y+7+(12 if y<200 else -12),146),(y+9+(12 if y<200 else -12),160),(y-7+(12 if y<200 else -12),160)],fill='#f3ead7',stroke=C['brass'],sw=.8)
        # GÓRA: duży obraz + zasłony od sufitu
        d.rect(120,345,154,190,fill='#f6f2ea',stroke='#8a6a4c',sw=3); d.rect(132,357,130,166,fill='#cdb79b',stroke='none',sw=0)
        d.poly([(132,400),(170,450),(205,420),(262,480),(262,357),(132,357)],fill='#b39a7b',stroke='none',sw=0); picture_light(d,197,548,60)
        d.line(-4,HT-6,BEAM0+4,HT-6,C['black'],2.5)
        for a,b in ((-4,60),(334,398)): d.rect(a,0,b-a,HT-6,fill='url(#linen)',stroke='#d6c9b4',sw=.8,pattern='linen')
        elev_frame(d,'antresola: obraz + zasłony lniane od sufitu (5,9 m) – można zamknąć wnękę')
    if kind=='4':   # kącik muzyczny z pianinem + panele akustyczne
        elev_base(d,'url(#lime)')
        for a_,b_ in ((0,92),(302,394)):
            d.rect(a_,0,b_-a_,85,fill=C['oak'],stroke=C['oak2'],sw=1)
            for x0,x1 in ((a_+3,(a_+b_)/2-.5),((a_+b_)/2+.5,b_-3)): d.rect(x0,8,x1-x0,72,fill='url(#cane)',stroke='#a88f68',sw=.6,pattern='cane')
            d.rect(a_,85,b_-a_,3,fill=C['oak2'],stroke='none',sw=0)
            for h in (88,140,192,240):
                d.rect(a_+2,h,b_-a_-4,3,fill=C['oak'],stroke='none',sw=0)
                if h==88:
                    for k in range(14): d.rect(a_+6+k*5.6,h+3,4.4,31,fill=rnd.choice(['#2b2b2b','#c9b18a','#6d5e4c','#e7e1d4','#8a3d2c','#3f5a6b']),stroke='none',sw=0)
                else: books_row(d,a_+4,b_-4,h+3,44,rnd)
        # pianino
        d.rect(122,0,150,125,fill='#151515',stroke='#000',sw=1.2); d.rect(122,70,150,8,fill='#222',stroke='#000',sw=.6)
        for k in range(52): d.rect(124+k*2.82,72,2.4,6,fill='#f6f4ee',stroke='none',sw=0)
        d.rect(122,125,150,4,fill='#0e0e0e',stroke='none',sw=0); d.rect(132,8,6,62,fill='#0e0e0e',stroke='none',sw=0); d.rect(256,8,6,62,fill='#0e0e0e',stroke='none',sw=0)
        d.rect(150,0,94,48,fill='url(#boucle)',stroke='#a99d8b',sw=.7,pattern='boucle',rx=3); d.rect(150,48,94,5,fill=C['oak'],stroke='none',sw=0)
        d.rect(170,129,40,26,fill='#efe9df',stroke='#b9ad9b',sw=.6); vf=(232,129)
        d.circle(vf[0],vf[1]+14,12,fill='#e8e2d8',stroke='#c9c0b2',sw=.4)
        for x in (197,): picture_light(d,x,205,70)
        d.rect(152,140,90,58,fill='#f6f2ea',stroke='#8a6a4c',sw=2.4); d.rect(160,148,74,42,fill='#cdbfa8',stroke='none',sw=0)
        # GÓRA: panele akustyczne lniane w ramach dębowych 3×2
        W_=118; H_=128
        for i in range(3):
            for j in range(2):
                x=10+i*(W_+10); y=305+j*(H_+12)
                d.rect(x,y,W_,H_,fill=C['oak'],stroke=C['oak2'],sw=1); d.rect(x+5,y+5,W_-10,H_-10,fill='url(#linen)',stroke='none',sw=0,pattern='linen')
        for x in (69,197,325): d.rect(x-2,575,4,10,fill=C['brass'],stroke='none',sw=0)
        elev_frame(d,'antresola: panele akustyczne (len w ramach dębowych) – wyciszają wysoki salon')
    if kind=='5':   # bar + ściana galeryjna
        elev_base(d,GREEN)
        d.rect(8,0,378,10,fill=C['black'],stroke='none',sw=0)
        for i in range(8):
            y=8+i*47.25; d.rect(y,10,46.25,78,fill=GREEN,stroke='#2c362a',sw=.8); d.rect(y+18,70,10,2,fill=C['brass'],stroke='none',sw=0)
        d.rect(38,12,54,74,fill='#1b2020',stroke='#000',sw=.8)
        d.rect(6,88,382,4,fill='#efe6da',stroke='#cbbfae',sw=.6)
        d.rect(6,92,382,153,fill='url(#mirror)',stroke='#a39b88',sw=.8,pattern='mirror')
        for h in (135,180,222):
            d.rect(10,h,374,1.6,fill='#dfe8e6',stroke='#b9c4c2',sw=.4)
            y=16
            while y<378:
                if rnd.random()<.5: hh=16+rnd.random()*14; d.rect(y,h+1.6,6,hh,fill=rnd.choice(['#5a3a1c','#2e4630','#c8b16a','#6b1f22']),stroke='none',sw=0); d.rect(y+2,h+1.6+hh,2,5,fill='#333',stroke='none',sw=0)
                else: d.rect(y,h+1.6,6,10,fill='#e6efee',stroke='#b9c4c2',sw=.3)
                y+=9+rnd.random()*8
        d.rect(6,245,382,45,fill=GREEN,stroke='#2c362a',sw=.8)
        d.rect(300,92,34,40,fill='#b9bcbf',stroke='#888',sw=.6)
        # GÓRA: ściana galeryjna (salon-style)
        rr=R(11); frames=[(20,320,70,90),(100,330,60,75),(175,310,90,110),(280,325,55,70),(345,318,40,55),(30,430,55,70),(95,425,85,105),(195,440,70,90),(280,410,95,120),(20,520,60,50),(110,545,80,40),(210,540,65,45),(300,545,80,40)]
        for i,(x,y,w,h) in enumerate(frames): frame_sh(d,x,y,w,h,i%3)
        for x in (60,215,330): picture_light(d,x,HT-14,40)
        elev_frame(d,'antresola: ściana galeryjna (ramy + kinkiety obrazowe), wnęka „zalana” zielenią')
    if kind=='6':   # pracownia za Crittallem + lustrzana krata nad
        elev_base(d,'#efe8dd')
        d.rect(0,0,60,HN,fill=C['cream'],stroke='#b9ad9b',sw=1); d.rect(334,0,60,HN,fill=C['cream'],stroke='#b9ad9b',sw=1)
        d.rect(60,72,274,4,fill=C['oak'],stroke=C['oak2'],sw=.8); d.rect(60,0,60,72,fill=C['oak2'],stroke='none',sw=0); d.rect(274,0,60,72,fill=C['oak2'],stroke='none',sw=0)
        for h in (130,175,220,262): d.rect(60,h,274,3,fill=C['oak'],stroke='none',sw=0); books_row(d,62,332,h+3,38,rnd)
        d.rect(170,42,50,50,fill='url(#boucle)',stroke='#a99d8b',sw=.6,pattern='boucle',rx=5)
        ys=[0,49,98,147,197,247,296,345,394]
        for y in ys: d.rect(y-2,0,4,HN,fill=STEEL,stroke='none',sw=0)
        for h in (0,70,140,210,HN-3): d.rect(0,h,BEAM0,3,fill=STEEL,stroke='none',sw=0)
        d.rect(0,0,BEAM0,HN,fill='#dfeaee',stroke='none',sw=0,op=.18)
        d.rect(192,95,2,30,fill=C['brass'],stroke='none',sw=0); d.rect(200,95,2,30,fill=C['brass'],stroke='none',sw=0)
        # GÓRA: lustra w stalowej kracie
        d.rect(0,HN+10,BEAM0,HT-HN-20,fill='url(#mirror)',stroke=STEEL,sw=2,pattern='mirror')
        for y in ys: d.rect(y-2,HN+10,4,HT-HN-20,fill=STEEL,stroke='none',sw=0)
        for h in (HN+10,370,450,520,HT-12): d.rect(0,h,BEAM0,3,fill=STEEL,stroke='none',sw=0)
        elev_frame(d,'antresola: postarzane lustra w czarnej stalowej kracie – odbijają światło z okna')
    return d

def plan_k(kind):
    d=D('P'+kind); plan_base(d)
    sofa_L(d,(152,317,344,101),(396,141,100,176)); d.rect(204,182,148,118,fill=C['oakl'],stroke=C['oak2'],sw=.7)
    d.rect(196,0,240,45,fill=C['black'],stroke='#000',sw=.6); d.text(316,22,'TV na ścianie płd.',7,'#ddd') if kind!='2' else None
    if kind=='1':
        for a,b in ((0,63.5),(63.5,127),(267,330.5),(330.5,394)): d.rect(0,a,45,b-a,fill=C['cream'],stroke='#8f8578',sw=.8)
        d.rect(0,127,55,140,fill='url(#boucle)',stroke='#8f8578',sw=.8,pattern='boucle'); d.text(30,197,'ława',6.5,'#5b5146',rot=90)
        d.rect(NICHE,0,30,BEAM0,fill='#e8dfd0',stroke='#8f8578',sw=.6,dash=[3,2]); d.text(NICHE+15,197,'regały na antresoli (nad 3,0 m)',6,'#6e6253',rot=90)
    if kind=='2':
        d.rect(0,0,40,92,fill=C['oak'],stroke=C['oak2'],sw=.8); d.rect(0,302,40,92,fill=C['oak'],stroke=C['oak2'],sw=.8); d.rect(0,92,8,210,fill='url(#flute)',stroke=C['oak2'],sw=.6,pattern='flute')
        d.rect(0,104,40,186,fill=C['black'],stroke='#000',sw=.6); d.text(24,197,'TV 85″ + konsola',6.5,'#ddd',rot=90)
        d.rect(NICHE,0,4,BEAM0,fill='url(#lamel)',stroke=C['oak2'],sw=.4,pattern='lamel'); d.text(NICHE+14,197,'lamele do sufitu',6,'#6e5a40',rot=90)
    if kind=='3':
        d.rect(0,0,45,92,fill='#cbbba6',stroke='#8f8578',sw=.8); d.rect(0,302,45,92,fill='#cbbba6',stroke='#8f8578',sw=.8)
        d.rect(0,92,100,210,fill='url(#boucle)',stroke='#8f8578',sw=.8,pattern='boucle'); d.text(50,197,'daybed 100×210',7,'#5b5146',rot=90)
        d.line(99,0,99,BEAM0,C['black'],1.4,dash=[4,2]); d.text(108,60,'szyna zasłon (od sufitu 5,9 m)',6,'#555','left',rot=90)
    if kind=='4':
        for a_,b_ in ((0,92),(302,394)): d.rect(0,a_,45,b_-a_,fill=C['oak'],stroke=C['oak2'],sw=.8)
        d.rect(0,122,60,150,fill='#151515',stroke='#000',sw=.8); d.text(30,197,'pianino 150 × 60',7,'#ddd',rot=90)
        d.rect(62,150,38,94,fill='#f1ece3',stroke='#a99d8b',sw=.6); d.text(81,197,'ława',6,'#5b5146',rot=90)
        d.rect(NICHE,0,4,BEAM0,fill=C['oak'],stroke=C['oak2'],sw=.4); d.text(NICHE+14,197,'panele akustyczne na antresoli',6,'#6e5a40',rot=90)
    if kind=='5':
        d.rect(0,8,64,378,fill=GREEN,stroke='#2c362a',sw=.8); d.text(32,197,'bar 64 × 378 (blat h=90)',7,'#e8e2d4',rot=90)
        d.rect(0,38,60,54,fill='#1b2020',stroke='#000',sw=.6); d.text(30,65,'chłodziarka',5.5,'#ccc',rot=90)
    if kind=='6':
        d.rect(0,60,62,274,fill=C['oak'],stroke=C['oak2'],sw=.8); d.text(30,197,'biurko 274 × 62',7,'#4e3d28',rot=90)
        d.rect(0,0,60,60,fill=C['cream'],stroke='#8f8578',sw=.8); d.rect(0,334,60,60,fill=C['cream'],stroke='#8f8578',sw=.8)
        d.circle(95,200,24,fill='#f1ece3',stroke='#a99d8b',sw=.6)
        for y in [0,49,98,147,197,247,296,345,394]: d.rect(99,y-2,4,4,fill=STEEL,stroke='none',sw=0)
        d.line(101,0,101,BEAM0,STEEL,1.6); d.text(112,300,'ściana stalowo-szklana z drzwiami',6,'#333','left',rot=90)
    return d
