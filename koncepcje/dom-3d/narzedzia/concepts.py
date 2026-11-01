import sys, random, math
sys.path.insert(0,'/tmp/scripts')
from draw import D
# ---- wymiary z DWG (cm), początek = narożnik wnęki: lico ściany lewej x=0 / lico ściany TV (zewn.) y=0
NICHE=102; COL=531; WIN=553; BEAM0=394; BEAM1=419; HN=290; HR=550
C=dict(bg='#FBF8F3', wall='#5b544c', cream='#EFE8DD', cream2='#E6DDCF', oak='#CFAE84', oak2='#B48E62', oakl='#DCC2A0',
       black='#232323', brass='#B8923A', cane='#DCC9A3', boucle='#F4F0E8', linen='#E3D9C9', rug='#ECE5D8',
       purple='#9B3FD1', glass='#A9C6CF', dim='#6b645c', txt='#3b3631', smoke='#7A6A58', green='#7E8B6E')
DEFS='''<defs>
<pattern id="cane" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#DCC9A3"/>
<path d="M0 3H6M3 0V6M0 0L6 6M6 0L0 6" stroke="#B89F74" stroke-width="0.6"/><circle cx="3" cy="3" r="1.1" fill="#EFE3CC"/></pattern>
<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#d9d2c7"/><path d="M0 0V6" stroke="#8d857a" stroke-width="1"/></pattern>
<pattern id="flute" width="5" height="10" patternUnits="userSpaceOnUse"><rect width="5" height="10" fill="#CFAE84"/><path d="M0.5 0V10" stroke="#B48E62" stroke-width="1.1"/></pattern>
<pattern id="slats" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#CFAE84"/><path d="M0 0.5H8" stroke="#9c7a52" stroke-width="1.6"/></pattern>
<pattern id="slatsV" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#CFAE84"/><path d="M0.5 0V8" stroke="#9c7a52" stroke-width="1.6"/></pattern>
<pattern id="oakfloor" width="40" height="14" patternUnits="userSpaceOnUse"><rect width="40" height="14" fill="#E9D9C1"/><path d="M0 0.5H40M20 0V7M5 7V14M0 7H40" stroke="#D9C4A4" stroke-width="0.7"/></pattern>
<pattern id="boucle" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#F4F0E8"/><circle cx="1.5" cy="1.5" r="0.8" fill="#E6DFD2"/><circle cx="4" cy="3.8" r="0.7" fill="#E6DFD2"/></pattern>
</defs>'''
BOOKS=['#D9CBB5','#BFAE96','#8C7B6B','#EDE6DA','#A79A86','#6F675E','#C9B79C','#E2D6C2','#9a8b77','#F2EEE6','#556052','#b9a487']

# ================= RZUT =================
def plan_base(d, show_old=False):
    # podłoga
    d.rect(0,0,WIN,BEAM1,fill='url(#oakfloor)',stroke='none',sw=0,layer='K_OPIS')
    d.rect(0,0,NICHE,BEAM0,fill='#efe6d6',stroke='none',sw=0,layer='K_OPIS',op=0.65)
    # ściany (przekrój)
    W=dict(fill=C['wall'],stroke=C['wall'],sw=0.5,layer='K_SCIANY')
    d.rect(-25,-50,25,BEAM1+50,**W)                       # ściana lewa (WC / pokój 0.2.1)
    d.rect(-25,-50,COL+50,50,**W)                         # ściana zewnętrzna (TV)
    d.rect(COL,-50,25,50,**W); d.rect(COL,BEAM0,25,BEAM1+40-BEAM0,**W)   # słupy 25x25 / 25x120
    d.rect(-25,BEAM0,25,25,fill=C['wall'],stroke=C['wall'],sw=0.5,layer='K_KONSTR')
    # okno W1 394/542
    d.rect(WIN-4,0,8,BEAM0,fill=C['glass'],stroke='#5d8796',sw=0.8,layer='K_OKNA')
    d.line(WIN,0,WIN,BEAM0,'#5d8796',0.6,'K_OKNA')
    d.text(WIN+22,BEAM0/2,'W1 394/542 (Hp=0)',8,'#3d6f80',rot=90,layer='K_OKNA')
    # zasłona lniana
    d.poly([(WIN-14,6)]+[(WIN-14+ (3 if i%2 else -3), 6+i*12) for i in range(1,32)],fill='none',stroke='#c9b99f',sw=1.1,layer='K_TKANINY',closed=False)
    # podciąg 25x40 (nad)
    d.line(0,BEAM0,COL,BEAM0,'#8a2b2b',0.9,'K_KONSTR',dash=[10,4,2,4]); d.line(0,BEAM1,COL,BEAM1,'#8a2b2b',0.9,'K_KONSTR',dash=[10,4,2,4])
    d.text(330,BEAM1+9,'podciąg żelbetowy 25×40 (nad) – granica strefy dziennej / jadalni',7.5,'#8a2b2b')
    # krawędź wnęki = ściana łazienki 1.2.2 na piętrze
    d.line(NICHE,0,NICHE,BEAM0,C['purple'],1.6,'K_WNEKA',dash=[8,4])
    d.text(NICHE+6,BEAM0-14,'krawędź wnęki (nad nią ściana łazienki 1.2.2)',7,C['purple'],'left')
    # wymiary
    d.dim(0,0,NICHE,0,-58,'102'); d.dim(NICHE,0,COL,0,-58,'429'); d.dim(0,0,WIN,0,-80,'553')
    d.dim(0,0,0,BEAM0,62,'394')
    # OTWÓR do korytarza / holu 0.3.1 (bez drzwi)
    d.rect(-25,BEAM0,25,25,fill=C['wall'],stroke=C['wall'],sw=0.5,layer='K_SCIANY')
    d.line(-25,BEAM1,-25,645,'#b03c3c',0.9,'K_OPIS',dash=[6,3]); d.line(0,BEAM1,0,645,'#b03c3c',0.9,'K_OPIS',dash=[6,3])
    d.rect(-25,645,25,30,fill=C['wall'],stroke=C['wall'],sw=0.5,layer='K_SCIANY')
    d.dim(-25,BEAM1,-25,645,22,'otwór ~225')
    d.text(-60,532,'OTWÓR – korytarz / hol 0.3.1 (bez drzwi)',7.5,'#b03c3c',rot=90)
    d.rect(0,BEAM1,WIN,256,fill='url(#oakfloor)',stroke='none',sw=0,layer='K_OPIS',op=0.5)
    d.text(260,BEAM1+30,'↑ jadalnia 0.5.3',8,'#777',italic=True)
    d.text(-12.5,170,'WC 0.4.1 / pokój 0.2.1',7,'#f2ece2',rot=90)

def sofa_L(d, pts_main, pts_leg):
    for (x,y,w,h) in (pts_main,pts_leg):
        d.rect(x,y,w,h,fill='url(#boucle)',stroke='#a99d8b',sw=0.8,layer='K_MEBLE',pattern='boucle')

def plan_existing():
    d=D('istniejacy'); plan_base(d)
    d.rect(0,0,45,BEAM1,fill='#e0d6c6',stroke='#888',sw=0.7,layer='K_MEBLE'); d.line(0,0,45,BEAM1,'#999',0.5); d.line(45,0,0,BEAM1,'#999',0.5)
    d.text(22,BEAM1/2,'regał 45 (pierwotnie)',7,'#555',rot=90)
    d.rect(NICHE,0,423,56,fill='#2b2b2b',stroke='#111',sw=0.6); d.text(316,28,'szafka RTV 423×56 – projekt',7,'#ddd')
    sofa_L(d,(152,317,344,101),(396,141,100,176)); d.text(320,368,'narożnik',8,'#6e6253')
    d.rect(204,182,148,118,fill=C['oakl'],stroke=C['oak2'],sw=0.7); d.text(278,241,'ława 148×118',7,'#6e5a40')
    for i,t in enumerate(['2×SAT','TV','2×INT']): d.text(286+i*16,66,t,6.5,'#8a2bb8',rot=90)
    return d

def plan_c1():
    d=D('k1'); plan_base(d)
    # --- biblioteka wzdłuż ściany lewej: 4 wieże 63,5 + ława 140
    bays=[(0,63.5),(63.5,127),(267,330.5),(330.5,394)]
    for a,b in bays:
        d.rect(0,a,45,b-a,fill=C['cream'],stroke='#8f8578',sw=0.8,layer='K_ZABUDOWA')
        d.rect(0,a+3,35,b-a-6,fill='none',stroke='#b5aa9a',sw=0.4,layer='K_ZABUDOWA',dash=[3,2])
    d.rect(0,127,55,140,fill='url(#boucle)',stroke='#8f8578',sw=0.8,layer='K_ZABUDOWA',pattern='boucle')
    d.rect(0,127,14,140,fill=C['linen'],stroke='#a99d8b',sw=0.5,layer='K_TKANINY')
    d.text(30,197,'ława do czytania 140×55',6.5,'#5b5146',rot=90)
    # półki na krótkiej ścianie zewn.
    d.rect(45,0,57,30,fill=C['cream'],stroke='#8f8578',sw=0.8,layer='K_ZABUDOWA'); d.text(74,15,'półki 30',6,'#5b5146')
    # drabina na szynie
    d.line(40,0,40,BEAM0,C['brass'],1.2,'K_ZABUDOWA',dash=[2,3])
    d.rect(45,334,10,48,fill=C['oak'],stroke=C['oak2'],sw=0.6,layer='K_ZABUDOWA'); d.text(66,358,'drabina',6,'#6e5a40',rot=90)
    d.text(22,32,'wieża',6,'#6e6253',rot=90); d.text(22,95,'wieża',6,'#6e6253',rot=90); d.text(22,298,'wieża',6,'#6e6253',rot=90); d.text(22,362,'wieża',6,'#6e6253',rot=90)
    d.text(76,200,'przejście ~47',6.5,'#8a7f70',rot=90,italic=True)
    # dywan chodnik we wnęce
    d.rect(52,40,44,300,fill='none',stroke='#cbbfab',sw=0.6,layer='K_TKANINY',dash=[4,3])
    # --- strefa TV na ścianie zewn. (jak na zdjęciu 1)
    d.rect(196,0,240,45,fill=C['black'],stroke='#000',sw=0.6,layer='K_MEBLE'); d.text(316,22,'konsola 240×45 (czarna)',7,'#ddd')
    d.rect(233,45,166,5,fill='#111',stroke='none',sw=0,layer='K_MEBLE'); d.text(316,56,'TV 75″',6.5,'#444')
    for x in (166,467): d.rect(x-25,0,50,4,fill='#111',stroke='none',sw=0); d.text(x,12,'ramy cz-b',6,'#555')
    sofa_L(d,(152,317,344,101),(396,141,100,176)); d.text(320,368,'narożnik (bez zmian)',8,'#6e6253')
    d.rect(204,182,148,118,fill=C['oakl'],stroke=C['oak2'],sw=0.7); d.text(278,241,'ława',7,'#6e5a40')
    d.rect(170,120,330,250,fill='none',stroke='#cbbfab',sw=0.6,layer='K_TKANINY',dash=[4,3])
    # oświetlenie wnęki
    for y in (60,197,334): d.circle(70,y,5,fill='#fff4d6',stroke=C['brass'],sw=0.8,layer='K_SWIATLO')
    d.text(86,250,'3× oprawa kierunkowa (wallwasher)',6,'#9a7a2c','left',rot=90)
    d.circle(278,241,9,fill='none',stroke=C['black'],sw=0.8,layer='K_SWIATLO',dash=[2,2]); d.text(278,226,'żyrandol',6,'#444')
    return d

def plan_c2():
    d=D('k2'); plan_base(d)
    # --- ściana medialna we wnęce
    d.rect(0,0,40,92,fill=C['oak'],stroke=C['oak2'],sw=0.8,layer='K_ZABUDOWA'); d.rect(0,302,40,92,fill=C['oak'],stroke=C['oak2'],sw=0.8,layer='K_ZABUDOWA')
    d.text(20,46,'wieża L + głośnik',6,'#4e3d28',rot=90); d.text(20,348,'wieża R + głośnik',6,'#4e3d28',rot=90)
    d.rect(0,92,8,210,fill='url(#flute)',stroke=C['oak2'],sw=0.6,layer='K_ZABUDOWA',pattern='flute')
    d.rect(0,104,40,186,fill=C['black'],stroke='#000',sw=0.6,layer='K_ZABUDOWA',op=0.92); d.text(24,197,'konsola podwieszana 186×40',6.5,'#ddd',rot=90)
    d.rect(8,102,5,190,fill='#111',stroke='none',sw=0,layer='K_MEBLE'); d.text(56,197,'TV 85″ na fryzowanym panelu',6.5,'#4e3d28',rot=90)
    d.rect(0,0,NICHE,BEAM0,fill='url(#slats)',stroke='none',sw=0,layer='K_OPIS',op=0.18)
    d.text(80,60,'sufit: lamele dębowe',6,'#6e5a40',rot=90)
    for y in (60,334): d.circle(78,y+(30 if y<100 else -30),5,fill='#fff',stroke='#555',sw=0.8,layer='K_ELEKTRYKA')
    d.text(92,335,'głośniki sufitowe (front height)',5.5,'#555',rot=90)
    # --- meble: narożnik obrócony do wnęki
    sofa_L(d,(355,90,100,300),(255,290,100,100)); d.text(405,240,'narożnik → TV',8,'#6e6253',rot=90)
    d.rect(205,145,115,115,fill=C['oakl'],stroke=C['oak2'],sw=0.7,rx=12); d.text(262,202,'ława',7,'#6e5a40')
    d.rect(150,70,320,280,fill='none',stroke='#cbbfab',sw=0.6,layer='K_TKANINY',dash=[4,3]); d.text(170,80,'dywan 320×280',6,'#8a7f70','left')
    # --- ściana zewn. = ściana galeryjna
    d.rect(236,0,160,40,fill=C['black'],stroke='#000',sw=0.6); d.text(316,20,'konsola 160×40',7,'#ddd')
    for x in (166,467): d.rect(x-25,0,50,4,fill='#111',stroke='none',sw=0)
    d.rect(256,40,120,4,fill='#555',stroke='none',sw=0); d.text(316,52,'duży obraz/foto',6.5,'#444')
    # odległość oglądania
    d.line(13,197,400,197,'#b03c3c',0.6,'K_WYMIARY',dash=[4,3]); d.text(300,190,'≈ 3,9 m oglądania (85″)',7,'#b03c3c')
    # przeniesienie gniazd
    d.text(150,105,'⚡ gniazda TV/SAT/INT ze ściany zewn. → do wnęki',6.5,'#b03c3c','left')
    return d

# ================= WIDOK A (ściana zewn./TV, patrząc na płd.) – u = 531 - x =================
def frames_col(d,u,top=290,n=3,w=48,h=58,gap=10):
    for i in range(n):
        y=top-(i+1)*h-i*gap
        d.rect(u-w/2,y,w,h,fill='#fbfbf8',stroke=C['black'],sw=2.2,layer='K_MEBLE')
        d.rect(u-w/2+9,y+9,w-18,h-18,fill='#cfcac2',stroke='#9a948a',sw=0.4,layer='K_MEBLE')
        d.circle(u,y+h/2+3,7,fill='#77736c',stroke='none',sw=0)
    d.rect(u-20,top+12,40,4,fill=C['black'],stroke='none',sw=0,layer='K_SWIATLO'); d.line(u,top+16,u,top+24,C['black'],1.5,'K_SWIATLO')
    d.rect(u-3,top+22,6,8,fill=C['brass'],stroke='none',sw=0,layer='K_SWIATLO')
    d.poly([(u-20,top+12),(u+20,top+12),(u+40,top-40),(u-40,top-40)],fill='#fff3d1',stroke='none',sw=0,op=0.35)

def elevA(kind):
    d=D('A'+kind); U=lambda x: COL-x
    d.rect(0,0,COL,HR,fill=C['cream'],stroke='none',sw=0,layer='K_OPIS')
    # panel moulding: centralny pas od podłogi do sufitu (jak zdj. 1)
    cu=U(316.5)
    d.rect(cu-110,0,220,HR,fill=C['cream2'],stroke='#d4c9b8',sw=1.2,layer='K_ZABUDOWA')
    d.rect(cu-98,12,196,HR-24,fill='none',stroke='#d4c9b8',sw=1,layer='K_ZABUDOWA')
    for a,b in ((8,cu-122),(cu+122,U(NICHE)-10)):
        d.rect(a,320,b-a,HR-335,fill='none',stroke='#d9cfbf',sw=1); d.rect(a,40,b-a,250,fill='none',stroke='#d9cfbf',sw=1) if kind=='1' else None
    # wnęka (prawa część, niższa)
    d.rect(U(NICHE),HN,NICHE,HR-HN,fill='url(#hatch)',stroke='#8d857a',sw=0.8,layer='K_PRZEKROJ',pattern='hatch')
    d.text(U(NICHE)+NICHE/2,HN+(HR-HN)/2,'strop + łazienka 1.2.2',8,'#4a443d',rot=90)
    if kind=='1':
        d.rect(U(NICHE),0,NICHE,HN,fill='#efe6d6',stroke='none',sw=0)
        # półki na ścianie zewn. (front) + bok wieży w przekroju
        d.rect(U(102),0,57,HN,fill=C['cream'],stroke='#b9ad9b',sw=1,layer='K_ZABUDOWA')
        random.seed(3)
        for k in range(5):
            y=40+k*50; d.rect(U(102),y,57,3,fill='#d8cdbd',stroke='none',sw=0)
            x=U(102)+3
            while x<U(45)-6:
                w=random.choice([3,4,4,5,6]); h=random.choice([28,32,36,40]);
                d.rect(x,y+3,w,h,fill=random.choice(BOOKS),stroke='none',sw=0); x+=w+0.6
        d.rect(U(45),0,45,HN,fill='#e6dccd',stroke='#9d927f',sw=1,layer='K_ZABUDOWA'); d.text(U(22.5),150,'bok regału 45',7,'#6e6253',rot=90)
        d.rect(U(45),0,45,85,fill='url(#cane)',stroke='#9d927f',sw=0.8,pattern='cane')
    else:
        d.rect(U(NICHE),0,NICHE,HN,fill=C['oakl'],stroke=C['oak2'],sw=1)
        d.rect(U(NICHE),HN-8,NICHE,8,fill='url(#slats)',stroke='none',sw=0,pattern='slats')
        d.rect(U(40),0,40,HN,fill=C['oak'],stroke=C['oak2'],sw=1); d.text(U(20),180,'wieża (bok)',7,'#4e3d28',rot=90)
        d.rect(U(40),0,40,85,fill='url(#cane)',stroke='#9d927f',sw=0.8,pattern='cane')
    # portal wnęki
    d.rect(U(NICHE)-8,0,8,HN+8,fill='#e9e1d4',stroke='#cfc3b1',sw=0.8); d.rect(U(NICHE)-8,HN,NICHE+8,8,fill='#e9e1d4',stroke='#cfc3b1',sw=0.8)
    # ściana TV
    if kind=='1':
        d.rect(U(436),0,240,58,fill=C['black'],stroke='#000',sw=1,layer='K_MEBLE')
        for i in range(3): d.line(U(436)+80*(i+1),4,U(436)+80*(i+1),54,'#444',0.8)
        d.rect(cu-83,95,166,95,fill='#151515',stroke='#000',sw=2,layer='K_MEBLE'); d.rect(cu-80,98,160,89,fill='#24272a',stroke='none',sw=0)
        frames_col(d,U(166)); frames_col(d,U(467))
        # wazon + lampa na konsoli
        d.poly([(cu-95,58),(cu-80,58),(cu-78,75),(cu-97,75)],fill='#e9e4dc',stroke='#aaa',sw=0.5)
        d.circle(cu-88,85,13,fill='#f6f3ee',stroke='#d8d1c6',sw=0.5)
    else:
        d.rect(U(396),0,160,52,fill=C['black'],stroke='#000',sw=1,layer='K_MEBLE')
        d.rect(cu-62,90,124,155,fill='#fbfbf8',stroke=C['black'],sw=3); d.rect(cu-48,104,96,127,fill='#c9c3b8',stroke='none',sw=0)
        d.poly([(cu-48,140),(cu-10,190),(cu+20,160),(cu+48,200),(cu+48,104),(cu-48,104)],fill='#a8a196',stroke='none',sw=0)
        d.rect(cu-35,252,70,4,fill=C['brass'],stroke='none',sw=0); d.text(cu,262,'kinkiet obrazowy',6,'#7a6528')
        frames_col(d,U(166)); frames_col(d,U(467))
        d.poly([(cu-60,52),(cu-50,52),(cu-47,72),(cu-63,72)],fill='#e9e4dc',stroke='#aaa',sw=0.5); d.circle(cu+50,64,11,fill='#d9cbb5',stroke='none',sw=0)
    # żyrandol (jak zdj. 1)
    d.line(cu,HR,cu,420,C['black'],1.4,'K_SWIATLO'); d.line(cu-70,410,cu+70,410,C['black'],2.2,'K_SWIATLO')
    for k in (-70,-45,-20,20,45,70):
        d.line(cu+k,410,cu+k,418,C['black'],1.5); d.rect(cu+k-3,418,6,24,fill='#fbf6ea',stroke='#cfc6b6',sw=0.6)
    # obrys / wymiary
    d.poly([(0,0),(COL,0),(COL,HN),(U(NICHE),HN),(U(NICHE),HR),(0,HR)],fill='none',stroke='#3b3631',sw=1.6,layer='K_SCIANY')
    d.rect(-6,0,6,HR,fill=C['glass'],stroke='#5d8796',sw=0.6,layer='K_OKNA'); d.text(-16,250,'okno W1 (przekrój)',7,'#3d6f80',rot=90)
    d.dim(0,0,U(NICHE),0,-18,'429'); d.dim(U(NICHE),0,COL,0,-18,'102')
    d.dim(COL,0,COL,HN,-18,'290'); d.dim(0,0,0,HR,40,'~550 (do weryf.)')
    return d

# ================= WIDOK B (wnęka, patrząc na zach.) – v = y (0 = ściana zewn. po lewej) =================
def elevB(kind):
    d=D('B'+kind)
    d.rect(-30,0,BEAM1+60,HR,fill=C['cream'],stroke='none',sw=0)
    # ściana nad wnęką (ściana łazienki) – listwy
    d.rect(10,HN+30,BEAM0-20,HR-HN-50,fill='none',stroke='#d6ccbc',sw=1.1,layer='K_ZABUDOWA')
    d.rect(22,HN+42,BEAM0-44,HR-HN-74,fill='none',stroke='#d6ccbc',sw=0.9,layer='K_ZABUDOWA')
    # podciąg na końcu (hol)
    d.rect(BEAM0,HN-10,BEAM1-BEAM0,HR-HN+10,fill='url(#hatch)',stroke='#8d857a',sw=0.6,pattern='hatch')
    d.text(BEAM0+12.5,(HR+HN)/2,'podciąg / hol',6.5,'#4a443d',rot=90)
    if kind=='1':
        d.rect(0,0,BEAM0,HN,fill='#e9e0d1',stroke='none',sw=0)
        random.seed(7)
        def tower(a,b):
            d.rect(a,0,b-a,HN,fill=C['cream'],stroke='#b9ad9b',sw=1.2,layer='K_ZABUDOWA')
            d.rect(a+2,0,b-a-4,10,fill='#d9cfbf',stroke='none',sw=0)
            # szafka z frontami z plecionki
            m=(a+b)/2
            for x0,x1 in ((a+3,m-0.5),(m+0.5,b-3)):
                d.rect(x0,12,x1-x0,72,fill='#efe8dc',stroke='#b9ad9b',sw=0.8); d.rect(x0+4,16,x1-x0-8,64,fill='url(#cane)',stroke='#c4b494',sw=0.5,pattern='cane')
            d.circle(m-4,62,1.6,fill=C['brass'],stroke='none',sw=0); d.circle(m+4,62,1.6,fill=C['brass'],stroke='none',sw=0)
            d.rect(a,84,b-a,4,fill='#d8cdbd',stroke='none',sw=0)
            for y in (88,135,182,229):
                d.rect(a+3,y,b-a-6,3,fill='#d8cdbd',stroke='none',sw=0)
                x=a+5; mode=random.random()
                while x<b-8:
                    if random.random()<0.13 and x<b-22:
                        r=random.choice([8,10]); d.circle(x+r,y+3+r*1.1,r,fill=random.choice(['#f3efe8','#e2dbcf','#cfc4b2']),stroke='#bdb3a3',sw=0.4); x+=2*r+3; continue
                    if random.random()<0.08 and x<b-24:
                        for j in range(4): d.rect(x,y+3+j*4,22,4,fill=random.choice(BOOKS),stroke='none',sw=0)
                        x+=25; continue
                    w=random.choice([3,4,4,5,6]); h=random.choice([26,30,34,38])
                    d.rect(x,y+3,w,h,fill=random.choice(BOOKS),stroke='none',sw=0); x+=w+0.5
            # kinkiet obrazowy mosiądz
            d.rect(m-16,268,32,4,fill=C['brass'],stroke='none',sw=0,layer='K_SWIATLO'); d.line(m,272,m,280,C['brass'],1.5,'K_SWIATLO')
            d.poly([(m-16,268),(m+16,268),(m+26,236),(m-26,236)],fill='#fff3d1',stroke='none',sw=0,op=0.45)
        for a,b in ((0,63.5),(63.5,127),(267,330.5),(330.5,394)): tower(a,b)
        # ława do czytania
        d.rect(127,0,140,HN,fill='#e3d8c7',stroke='#b9ad9b',sw=1.2)
        d.rect(129,0,136,10,fill='#d9cfbf',stroke='none',sw=0)
        for i in range(2): d.rect(131+i*68,12,64,30,fill=C['oak'],stroke=C['oak2'],sw=0.8); d.rect(131+i*68+26,26,12,2.5,fill=C['brass'],stroke='none',sw=0)
        d.rect(127,42,140,12,fill='url(#boucle)',stroke='#a99d8b',sw=0.8,pattern='boucle')
        d.rect(133,54,128,62,fill=C['linen'],stroke='#c8bba7',sw=0.8,rx=4)  # tapicerowane oparcie
        for i in range(3): d.line(133+32*(i+1),56,133+32*(i+1),114,'#d2c6b2',0.7)
        d.rect(140,56,34,30,fill='#c9b79c',stroke='none',sw=0,rx=6); d.rect(218,56,36,28,fill='#e9e2d6',stroke='none',sw=0,rx=6)
        for y in (180,232):
            d.rect(130,y,134,3,fill='#d8cdbd',stroke='none',sw=0)
            x=134
            while x<258:
                if random.random()<0.12: d.circle(x+8,y+12,8,fill='#efe9df',stroke='#c8bfae',sw=0.4); x+=19; continue
                w=random.choice([3,4,5]); h=random.choice([24,28,32]); d.rect(x,y+3,w,h,fill=random.choice(BOOKS),stroke='none',sw=0); x+=w+0.5
        # kinkiet ramię
        d.line(197,150,197,140,C['brass'],2); d.line(197,150,222,150,C['brass'],1.5); d.poly([(216,150),(228,150),(232,138),(212,138)],fill='#f3ead7',stroke=C['brass'],sw=0.8)
        # szyna + drabina
        d.line(2,252,BEAM0-2,252,C['brass'],2.4,'K_ZABUDOWA')
        d.poly([(338,0),(352,0),(368,252),(356,252)],fill='none',stroke=C['oak2'],sw=2.6); d.poly([(372,0),(386,0),(380,252),(370,252)],fill='none',stroke=C['oak2'],sw=2.6)
        for k in range(1,9):
            t=k/9; d.line(338+14+t*(356-338-14+4),t*252,372+t*(370-372),t*252,C['oak2'],2)
        d.text(197,-14,'ława 140 · siedzisko h=45',7,'#6e6253')
    else:
        d.rect(0,0,BEAM0,HN,fill=C['oakl'],stroke='none',sw=0)
        # wieże boczne
        def tower(a,b,lab):
            d.rect(a,0,b-a,HN,fill=C['oak'],stroke=C['oak2'],sw=1.2)
            for x0,x1 in ((a+3,(a+b)/2-0.5),((a+b)/2+0.5,b-3)):
                d.rect(x0,8,x1-x0,72,fill='url(#cane)',stroke='#a88f68',sw=0.6,pattern='cane')
            d.rect(a+3,90,b-a-6,70,fill='#3a3530',stroke='#2a2622',sw=0.8); d.rect(a+6,93,b-a-12,64,fill='url(#cane)',stroke='none',sw=0,pattern='cane',op=0.9)
            d.text((a+b)/2,125,lab,6.5,'#3a2c1c')
            random.seed(int(a))
            for y in (168,218):
                d.rect(a+3,y,b-a-6,3,fill=C['oak2'],stroke='none',sw=0); x=a+6
                while x<b-8:
                    if random.random()<0.18: d.circle(x+8,y+12,8,fill='#f1ece3',stroke='#c8bfae',sw=0.4); x+=19; continue
                    w=random.choice([3,4,5]); h=random.choice([24,28,32,36]); d.rect(x,y+3,w,h,fill=random.choice(BOOKS),stroke='none',sw=0); x+=w+0.5
            d.rect(a+3,262,b-a-6,3,fill=C['oak2'],stroke='none',sw=0)
        tower(0,92,'głośnik L'); tower(302,394,'głośnik R')
        d.rect(92,0,210,HN,fill='url(#flute)',stroke=C['oak2'],sw=1,pattern='flute')
        # TV 85" 189x108, środek h=115
        d.rect(197-94.5,61,189,108,fill='#131313',stroke='#000',sw=2.2); d.rect(197-92,63,184,104,fill='#22262a',stroke='none',sw=0)
        d.rect(197-100,57,200,116,fill='none',stroke='#ffe9b8',sw=3,op=0.45)  # podświetlenie bias
        d.text(197,115,'TV 85″',10,'#666')
        d.rect(104,20,186,32,fill=C['black'],stroke='#000',sw=1)
        for i in range(3): d.line(104+62*(i+1),23,104+62*(i+1),49,'#444',0.8)
        d.rect(150,30,94,12,fill='#3a3a3a',stroke='none',sw=0); d.text(197,36,'centralny / soundbar za tkaniną',5.5,'#ccc')
        # lamele sufitu (widok krawędzi) + oprawy
        d.rect(0,HN-6,BEAM0,6,fill='url(#slatsV)',stroke=C['oak2'],sw=0.6,pattern='slatsV')
        for y in (46,348): d.circle(y,HN-9,4,fill='#fff',stroke='#555',sw=0.6)
        d.text(197,-14,'konsola podwieszana 186 · h=20–52',7,'#6e6253')
    # portal
    d.rect(-10,0,10,HN+10,fill='#e9e1d4',stroke='#cfc3b1',sw=0.8); d.rect(-10,HN,BEAM0+10,10,fill='#e9e1d4',stroke='#cfc3b1',sw=0.8)
    d.poly([(0,0),(0,HN),(BEAM0,HN)],fill='none',stroke='#3b3631',sw=1.2,closed=False)
    d.dim(0,0,BEAM0,0,-26,'394'); d.dim(0,0,0,HN,22,'290'); d.dim(670,0,670,HR,-14,'~550')
    # OTWÓR do korytarza (widoczny za słupem przy podciągu)
    d.rect(BEAM1,HN,645-BEAM1,HR-HN,fill='url(#hatch)',stroke='#8d857a',sw=0.6,pattern='hatch')
    d.rect(BEAM1,0,645-BEAM1,HN,fill='#ddd3c4',stroke='#b03c3c',sw=1.2,dash=[6,3],layer='K_OPIS')
    d.rect(BEAM1+40,0,80,205,fill='#e8dfd2',stroke='#c9bda9',sw=0.6); d.rect(645,0,20,HR,fill=C['cream'],stroke='none',sw=0)
    d.text((BEAM1+645)/2,HN/2+40,'OTWÓR',9,'#b03c3c',weight='bold'); d.text((BEAM1+645)/2,HN/2+22,'korytarz / hol 0.3.1',7.5,'#b03c3c'); d.text((BEAM1+645)/2,HN/2+8,'(bez drzwi)',7,'#b03c3c')
    d.dim(BEAM1,0,645,0,-26,'~225')
    d.text(-40,HN/2+60,'ściana zewn.',7,'#777',rot=90); 
    return d
