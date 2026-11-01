import sys; sys.path.insert(0,'/tmp/scripts')
import concepts as K, ezdxf, base64
IMG=lambda n: 'data:image/jpeg;base64,'+base64.b64encode(open(f'/tmp/viz/out/{n}.jpg','rb').read()).decode()
M3D='https://claude.ai/artifact/HDjpAAb9EEKaW81XfEezeG'
from concepts import C, DEFS
OUT=sys.argv[1]
PB=(-110,-100,620,690); AB=(-60,-40,K.COL+30,K.HR+12); BB=(-50,-40,690,K.HR+12)
pe=K.plan_existing(); p1=K.plan_c1(); p2=K.plan_c2(); a1=K.elevA('1'); a2=K.elevA('2'); b1=K.elevB('1'); b2=K.elevB('2')
def S(d,bb,sc=1.6): return d.svg(bb,sc,defs=DEFS)
# ---------- DXF ----------
doc=ezdxf.new('R2013',setup=True); doc.units=ezdxf.units.CM
doc.styles.add('PL',font='arial.ttf')
msp=doc.modelspace()
blocks=[(pe,0,0,'STAN – wg projektu (ruch: wnęka 102)'),(p1,800,0,'KONCEPCJA 1 – BIBLIOTEKA'),(p2,1600,0,'KONCEPCJA 2 – STREFA TV WE WNĘCE'),
        (b1,800,-800,'K1 – widok wnęki (zachód)'),(a1,800,-1500,'K1 – widok ściany zewn./TV (południe)'),
        (b2,1600,-800,'K2 – widok wnęki (zachód)'),(a2,1600,-1500,'K2 – widok ściany zewn. (południe)')]
for d,dx,dy,t in blocks:
    d.to_dxf(msp,dx,dy,doc)
    tx=msp.add_text(t,height=18,dxfattribs={'layer':'K_OPIS','style':'PL'}); tx.set_placement((dx-40,dy+(K.HR+60 if dy<0 else 520)))
n=msp.add_text('Punkt bazowy (0,0) każdego rzutu = narożnik wnęki: lico ściany lewej × lico ściany zewn. (TV). Jednostki: cm.',height=12,dxfattribs={'layer':'K_OPIS','style':'PL'}); n.set_placement((0,620))
doc.saveas(f'{OUT}/salon-wneka-koncepcje.dxf')
# ---------- HTML ----------
LINKS=[('Homebuilding – 12 pomysłów na wnęki w salonie (fronty licowane ze ścianą, ława wysunięta przed wnękę)','https://www.homebuilding.co.uk/rooms/living-room/living-room-alcove-ideas'),
('This Old House – kącik do czytania','https://www.thisoldhouse.com/living-rooms/create-a-cozy-reading-nook'),
('HGTV – zabudowy z regałami (galeria)','https://www.hgtv.com/decorating/design-ideas/built-in-beauties--pictures'),
('Bob Vila – pomysły na regały w zabudowie','https://www.bobvila.com/articles/built-in-bookshelf-ideas/'),
('Murator Dom – domowa biblioteka z pomysłem','https://muratordom.pl/wnetrza/dekoracje/ksiazki-w-domu-domowa-biblioteka-z-pomyslem-i-pod-kontrola-aa-VZ4j-VfJj-9BnC.html'),
('Architektura i Biznes – salon dla miłośników książek','https://architekturaibiznes.pl/en/pdd/living-room-for-book-lovers,32743.html'),
('Vaughan – kinkiety biblioteczne/obrazowe (mosiądz)','https://www.vaughandesigns.com/collections/library'),
('Osmoz – 15 zabudów medialnych bez widocznych kabli','https://www.osmoz.com/inspiration/osmoz-magazine/2336/15-built-in-media-wall-ideas-for-a-seamless-custom-fit-that-hides-clutter'),
('Osmoz – zasady projektowania ściany TV (proporcje, czego unikać)','https://www.osmoz.com/inspiration/osmoz-magazine/2131/12-media-wall-design-rules-for-better-layout-proportions-and-what-to-avoid'),
('Osmoz – ściana medialna bez kabli (wnęka, cień wokół TV)','https://www.osmoz.com/inspiration/osmoz-magazine/2248/i-built-a-tv-media-wall-for-a-built-in-wire-free-look-no-visible-cables'),
('Studio Matrx – ściana TV z frezowanymi panelami','https://www.studiomatrx.org/design-ideas/wall-panelling/reeded-charcoal-tv-feature-wall'),
('Builder – głośniki zabudowane za tkaniną akustyczną','https://www.builderonline.com/products/the-wired-house-the-art-of-audio_o'),
('1stdibs – szafki z frontami z plecionki wiedeńskiej (inspiracja frontów)','https://www.1stdibs.com/buy/cane-doors')]
SW=[('Ściany – ciepła kość słoniowa (np. kremowa biel)',C['cream']),('Listwy / panel moulding – ton jaśniejszy',C['cream2']),('Dąb naturalny, olejowany',C['oak']),
    ('Dąb – ciemniejszy akcent',C['oak2']),('Plecionka wiedeńska (fronty)',C['cane']),('Czarny mat – konsola, ramy, żyrandol',C['black']),
    ('Mosiądz szczotkowany – uchwyty, kinkiety',C['brass']),('Bouclé / len – tapicerka',C['boucle']),('Len – zasłony',C['linen'])]
sw="".join(f'<div class="sw"><span style="background:{c}"></span>{t}</div>' for t,c in SW)
li="".join(f'<li><a href="{u}">{t}</a></li>' for t,u in LINKS)
H=f'''<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Salon Izabelin – wnęka 102 cm: dwie koncepcje</title>
<style>
:root{{--ink:#2f2a25;--mut:#7a7066;--line:#e3dbcf;--bg:#fbf8f3;--acc:#9b7b45}}
*{{box-sizing:border-box}} body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 Georgia,'Times New Roman',serif}}
main{{max-width:1080px;margin:0 auto;padding:48px 28px 80px}}
h1{{font-weight:400;font-size:40px;line-height:1.15;margin:0 0 8px;letter-spacing:.2px}} h2{{font-weight:400;font-size:28px;margin:64px 0 6px;border-top:1px solid var(--line);padding-top:28px}}
h3{{font:600 13px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--acc);margin:28px 0 8px}}
.lead{{font-size:19px;color:#4a433b;max-width:62ch}} .kick{{font:600 12px Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--mut)}}
figure{{margin:18px 0 8px}} figure svg{{width:100%;height:auto;display:block;border:1px solid var(--line);border-radius:6px}}
figcaption{{font:13px/1.5 Helvetica,Arial,sans-serif;color:var(--mut);margin-top:6px}}
.viz{{display:grid;grid-template-columns:2fr 3fr;gap:16px;align-items:start;margin:22px 0 6px}} .viz img{{width:100%;display:block;border-radius:6px}} @media(max-width:820px){{.viz{{grid-template-columns:1fr}}}}
.cta{{display:inline-block;background:#2f2a25;color:#fbf8f3;text-decoration:none;padding:10px 18px;border-radius:999px;font:14px Helvetica,Arial,sans-serif;margin-top:8px}}
.g2{{display:grid;grid-template-columns:1fr 1fr;gap:22px}} @media(max-width:820px){{.g2{{grid-template-columns:1fr}}}}
ul{{padding-left:20px}} li{{margin:4px 0}} .facts li b{{font-family:Helvetica,Arial,sans-serif;font-size:14px}}
table{{width:100%;border-collapse:collapse;font:14px/1.45 Helvetica,Arial,sans-serif}} td,th{{border-bottom:1px solid var(--line);padding:9px 8px;text-align:left;vertical-align:top}} th{{color:var(--mut);font-weight:600}}
.sws{{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;font:13px Helvetica,Arial,sans-serif}}
.sw{{display:flex;align-items:center;gap:10px}} .sw span{{width:38px;height:38px;border-radius:50%;border:1px solid #d8cfc2;flex:none}}
.note{{background:#f3ede3;border-left:3px solid var(--acc);padding:12px 16px;font:14px/1.55 Helvetica,Arial,sans-serif;border-radius:0 6px 6px 0}}
a{{color:#7a5a2a}} .small{{font:13px/1.5 Helvetica,Arial,sans-serif;color:var(--mut)}}
</style></head><body><main>
<div class="kick">Izabelin · parter · salon 0.5.4 · koncepcja wnętrza</div>
<h1>Wnęka 102 cm przy ścianie TV – dwie koncepcje</h1>
<p class="lead">Wnęka po prawej stronie ściany TV ma 102 cm głębokości, a nie około 40 cm. Ma też niższy sufit (2,9 m), bo nad nią jest łazienka piętra. Zamiast regału 45 cm, który zostawiałby ~57 cm pustki, robimy z niej osobną strefę w stylu zdjęcia referencyjnego: kremowe ściany z listwami, jasny dąb, czarne akcenty, mosiądz i plecionka.</p>

<p><a class="cta" href="{M3D}">Otwórz model 3D (obracanie, obie koncepcje) →</a></p>

<h2>Co wynika z rysunku DWG</h2>
<div class="g2"><div>
<ul class="facts">
<li><b>Wnęka: 102 × 394 cm, wysokość 2,9 m.</b> Fioletowa linia leży 102 cm od lica lewej ściany, na całej długości od ściany zewnętrznej do podciągu 25×40.</li>
<li><b>Nad wnęką jest łazienka 1.2.2 na piętrze.</b> Jej ściana stoi dokładnie na fioletowej linii, dlatego wnęka jest niższa. Reszta salonu ma dwie kondygnacje (okno W1 394/542). Zdjęcie 3 to ten przekrój.</li>
<li><b>Ściana TV między wnęką a słupem przy oknie: 429 cm</b> (wcześniej konsola 423 × 56 i narożnik w odległości ~3,2 m).</li>
<li><b>Za słupem przy podciągu jest otwór do korytarza (hol 0.3.1)</b>: ok. 225 cm, bez drzwi, do stropu 2,9 m. Od tej strony wnęka jest otwarta, więc służy też jako przejście.</li>
<li><b>Za lewą ścianą są WC 0.4.1 i pokój 0.2.1.</b> Umywalka WC wisi na tej ścianie około 2,9–3,7 m od ściany zewnętrznej. W tym pasie nie planujemy głębokich puszek.</li>
</ul></div>
<figure>{S(pe,PB,1.0)}<figcaption>Stan wg projektu, skala dopasowana do wymiarów z DWG (25×25 słup = 25 cm). Fiolet = nowa krawędź wnęki.</figcaption></figure></div>

<h2>Koncepcja 1 · Biblioteka we wnęce</h2>
<p class="lead">Wnęka staje się domową biblioteką z ławą do czytania, a ściana TV zostaje jak na zdjęciu referencyjnym. Niższy sufit wnęki jest tu atutem, bo daje kameralną, „otuloną” strefę obok wysokiego salonu.</p>
<div class="viz"><img src="{IMG('k1_salon')}" alt="Koncepcja 1 – salon"><img src="{IMG('k1_wneka')}" alt="Koncepcja 1 – wnęka"></div><p class="small">Wizualizacje poglądowe: model z wymiarami z DWG, światło dzienne przez okno W1. Materiały i dekoracje są przykładowe.</p>
<div class="g2">
<figure>{S(p1,PB,1.0)}<figcaption>Rzut. Pięć modułów na 394 cm: 4 wieże po 63,5 cm i ława 140 cm na środku. Przejście przy szafkach ~47 cm, a do narożnika razem ~97 cm.</figcaption></figure>
<figure>{S(b1,BB,1.0)}<figcaption>Widok wnęki od strony salonu (patrząc na lewą ścianę).</figcaption></figure></div>
<figure>{S(a1,AB,1.1)}<figcaption>Widok ściany TV (południe) – TV jak na zdjęciu referencyjnym; po prawej przekrój wnęki 102 × 290 z półkami na krótkiej ścianie.</figcaption></figure>
<h3>Zabudowa</h3>
<ul>
<li><b>Dół:</b> szafki 45 cm głębokości, h = 85 cm, fronty z plecionki wiedeńskiej w ramie lakierowanej na kolor ścian, gałki z mosiądzu (jak dolne szafki na zdjęciu).</li>
<li><b>Góra:</b> otwarte półki 35 cm do sufitu (290), co ~47 cm. Na każdej wieży jeden mosiężny kinkiet biblioteczny, jak na zdjęciu referencyjnym.</li>
<li><b>Ława 140 × 55, siedzisko h = 45:</b> 2 szuflady dębowe pod spodem, poduszka z bouclé, tapicerowane lniane oparcie, nad nim 2 półki i kinkiet na ramieniu do czytania.</li>
<li><b>Krótka ściana zewnętrzna:</b> płytkie półki 30 cm, które zawijają bibliotekę w „L”.</li>
<li><b>Opcja:</b> mosiężna szyna na h ≈ 250 cm i dębowa drabina biblioteczna. Ma sens, bo górne półki są na ~2,4 m.</li>
<li><b>Portal:</b> opaska 8–10 cm wokół otworu wnęki w kolorze listew. Nad wnęką (290 → ~550) panele z listew w tym samym rytmie co ściana TV, żeby wysoka ściana nie była pusta.</li>
</ul>
<h3>Światło i elektryka</h3>
<ul><li>3 oprawy sufitowe kierunkowe (wallwasher, 2700 K) na regały plus taśma LED pod półkami, z osobnym obwodem i ściemniaczem.</li>
<li>Zasilanie kinkietów na szczycie wież (h ≈ 270), gniazdo z USB-C w module ławy, zasilacze LED w szafce dolnej.</li>
<li>Gniazda TV/SAT/INT zostają na ścianie zewnętrznej, jak w projekcie elektrycznym.</li></ul>

<h2>Koncepcja 2 · Strefa TV we wnęce</h2>
<p class="lead">TV przenosimy do wnęki. Wnęka jest w całości wyłożona dębem (ściany i lamelowy sufit), więc wygląda jak osobna, ciepła strefa kino-salonu. Ściana zewnętrzna staje się ścianą galeryjną z kompozycji czarno-białych zdjęć.</p>
<div class="viz"><img src="{IMG('k2_salon')}" alt="Koncepcja 2 – salon"><img src="{IMG('k2_wneka')}" alt="Koncepcja 2 – wnęka z TV"></div>
<div class="g2">
<figure>{S(p2,PB,1.0)}<figcaption>Rzut. Narożnik obrócony przodem do wnęki, ~98 cm przejścia do przeszklenia, odległość oglądania ~3,9 m (TV 85″).</figcaption></figure>
<figure>{S(b2,BB,1.0)}<figcaption>Widok wnęki. Środkowe pole 210 cm z frezowanym dębem, TV 85″ (środek ekranu h ≈ 115 cm), konsola podwieszana. Wieże boczne mają głośniki L/R za plecionką.</figcaption></figure></div>
<figure>{S(a2,AB,1.1)}<figcaption>Widok ściany zewnętrznej (południe). Kompozycja ze zdjęcia referencyjnego bez TV: duża fotografia z kinkietem obrazowym, kolumny ram i kinkiety, niska czarna konsola.</figcaption></figure>
<h3>Zabudowa</h3>
<ul>
<li><b>Wieże boczne 92 × 40 cm, do sufitu:</b> dół z frontami z plecionki (sprzęt, wentylowany), na wysokości uszu (h 90–160) głośniki L/R w zabudowie za plecionką podklejoną czarną tkaniną akustyczną, wyżej otwarte półki.</li>
<li><b>Środek 210 cm:</b> frezowany panel dębowy od podłogi do sufitu. TV 85″ (ok. 189 × 108) na płaskim uchwycie, środek ekranu na h ≈ 115 cm, za TV taśma LED (bias light).</li>
<li><b>Konsola podwieszana 186 × 40, h 20–52, czarny mat:</b> w środku głośnik centralny lub soundbar za tkaniną, subwoofer w wieży.</li>
<li><b>Sufit wnęki:</b> lamele dębowe na filcu akustycznym, 2 głośniki sufitowe (front height / Atmos) i 2 oprawy podtynkowe.</li>
<li><b>Ściana zewnętrzna 429 cm:</b> zostają listwy i 2 kolumny ram cz-b z kinkietami (jak na zdjęciu). Na środku duża fotografia ~120 × 155 z mosiężnym kinkietem obrazowym, niżej czarna konsola 160 × 40.</li>
</ul>
<h3>Zmiany w instalacji (do uzgodnienia z elektrykiem)</h3>
<ul>
<li>Przenieść <b>2×SAT, TV, 2×INT i 2 gniazda podwójne</b> ze ściany zewnętrznej na tylną ścianę wnęki, w pas 1,0–2,6 m od ściany zewnętrznej (z dala od umywalki WC). Gniazda za TV na h ≈ 120, przy konsoli h ≈ 35, między nimi peszel Ø50 na HDMI.</li>
<li>Kable głośnikowe: L/R do wież, centralny do konsoli, 2 sufitowe, subwoofer. Wszystko zbiegające się do szafki ze sprzętem w wieży.</li>
<li>Na ścianie galeryjnej: zasilanie kinkietów (już są w projekcie) plus punkt pod kinkiet obrazowy nad środkiem. 1 gniazdo przy konsoli.</li>
<li>Sprawdzić grubość ściany działowej przed osadzeniem głośników in-wall. Wieże dają 40 cm, więc głośniki można wbudować w meble, a nie w ścianę.</li>
</ul>

<h2>Porównanie</h2>
<table><tr><th></th><th>1 · Biblioteka</th><th>2 · TV we wnęce</th></tr>
<tr><td>Charakter</td><td>Spokojna strefa do czytania, salon jak na zdjęciu referencyjnym</td><td>Osobna strefa kinowa, salon bardziej „galeryjny”</td></tr>
<tr><td>Zmiany w projekcie</td><td>Brak zmian w elektryce poza światłem we wnęce</td><td>Przeniesienie gniazd TV/SAT/INT, okablowanie audio</td></tr>
<tr><td>Układ mebli</td><td>Narożnik bez zmian (TV ~3,2 m)</td><td>Narożnik obrócony, tyłem do okna (~98 cm przejścia)</td></tr>
<tr><td>Wykorzystanie 102 cm</td><td>Szafki 45 + ława 55, wnęka nadal jest przejściem z holu</td><td>Wieże 40 + konsola 40, wnęka to scena TV</td></tr>
<tr><td>Ryzyka</td><td>Dużo otwartych półek do ułożenia (stylizacja)</td><td>Światło z okna W1 z boku ekranu, potrzebne zasłony lub rolety</td></tr>
<tr><td>Koszt zabudowy</td><td>Średni (stolarka lakierowana + plecionka)</td><td>Wyższy (okleina dębowa, lamele, audio)</td></tr></table>

<h2>Paleta materiałów</h2>
<div class="sws">{sw}</div>

<h2>Inspiracje</h2>
<ul class="small">{li}</ul>
<p class="small">Najczęstsze wskazówki z tych źródeł, które przeniosłem do koncepcji: fronty licowane z płaszczyzną wnęki (zabudowa nie wygląda jak wstawiona szafa), ława lekko wysunięta przed wnękę, warstwowe ciepłe światło (kinkiety na półkach plus światło sufitowe), ciemny cień wokół TV i wbudowane głośniki za tkaniną akustyczną.</p>

<h2>Do potwierdzenia</h2>
<div class="note">
<b>1.</b> Wysokość salonu przyjąłem ~5,5 m (okno W1 ma 542 cm), a wnęki 2,9 m (potwierdzone). <b>2.</b> Jeśli pod ścianą łazienki na fioletowej linii będzie podciąg, prześwit otworu wnęki może być niższy niż 2,9 m. Portal z opaską to zamaskuje, ale wymiary półek trzeba dopasować. <b>3.</b> Grubość ściany między wnęką a WC/0.2.1 oraz dokładne położenie umywalki WC. <b>4.</b> Wymiary podane od lica ścian surowych, bez tynku.
</div>
<p class="small" style="margin-top:28px">Plik <b>salon-wneka-koncepcje.dxf</b> (cm) zawiera rzuty i widoki obu koncepcji. Punkt bazowy każdego rzutu to narożnik wnęki (lico ściany lewej × lico ściany zewnętrznej), więc można go wstawić bezpośrednio do projektu.</p>
</main></body></html>'''
open(f'{OUT}/salon-wneka-koncepcje.html','w').write(H); print('done')
