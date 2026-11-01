import sys; sys.path.insert(0,'/tmp/scripts')
import concepts2 as K
OUT=sys.argv[1]
EB=(-45,-40,700,K.HT+22); PB=(-110,-100,620,470)
CS=[
 ('1','Biblioteka na dwie kondygnacje','Wnęka: regały z ławą do czytania (jak dotąd). Antresola: regały kontynuowane do sufitu na ścianie nad wnęką, z dwiema mosiężnymi szynami (3,0 i 4,45 m) i drabiną. Cała ściana staje się jedną, wysoką biblioteką – najmocniejszy efekt „wow” w pomieszczeniu 5,9 m.',
  ['Wnęka: szafki 45 cm z plecionką, półki 35 cm, ława 140 cm','Antresola: półki 30 cm na ścianie łazienki (mocowanie do ściany nośnej/stelaża – do sprawdzenia)','Drabina na szynie; górne półki głównie na dekoracje','Kinkiety biblioteczne na każdej wieży + rząd przy suficie'],
  'Ściana jak z Pinteresta „double-height library”. Dużo stolarki, potrzebne stylizowanie półek.','wysoki'),
 ('2','TV we wnęce + dębowe lamele do sufitu','Wnęka: strefa TV (TV 85″, wieże z głośnikami za plecionką, konsola). Antresola: pionowe lamele dębowe od podłogi wnęki aż do sufitu – jedna ciepła płaszczyzna na całą wysokość, która dodatkowo wycisza wysoki salon (pogłos!).',
  ['Lamele dębowe na filcu akustycznym na ścianie nad wnęką i w głębi wnęki','Listwa LED podkreślająca krawędź wnęki na 2,9 m','Wieże boczne 92 cm, środek z TV 210 cm','Telewizor przeniesiony ze ściany płd. → tam ściana galeryjna'],
  'Najlepsza akustyka i nowoczesny wygląd; wymaga przeniesienia gniazd TV/SAT/INT.','średni–wysoki'),
 ('3','Alkowa wypoczynkowa (daybed) + zasłony od sufitu','Wnęka: tapicerowany daybed 100 × 210 cm z szufladami, kanałowe oparcie, kinkiety na ramieniu, szafki i półki po bokach. Antresola: duży obraz z kinkietem i lniane zasłony zawieszone pod sufitem (5,9 m) – można zasłonić całą wnękę i zrobić z niej miejsce dla gościa.',
  ['Ściany wnęki w ciepłym taupe (tadelakt/wapno)','Daybed = dodatkowe miejsce do spania','Szyna sufitowa na 5,9 m, zasłony podwójnej wysokości','Duży obraz 155 × 190 cm nad wnęką'],
  'Bardzo przytulnie, „hotelowo”. Zasłony 5,9 m to spory koszt i pranie.','średni'),
 ('4','Kącik muzyczny z pianinem + panele akustyczne','Wnęka: pianino (150 × 60 cm) z ławą – razem ok. 100 cm głębokości, czyli dokładnie na wymiar wnęki. Po bokach dębowe szafki z plecionką i półki na płyty winylowe i książki, nad pianinem obraz z kinkietem. Antresola: sześć dużych paneli akustycznych obciągniętych lnem w dębowych ramach – piękna, miękka ściana, która wycisza pogłos wysokiego salonu.',
  ['Ściany wnęki w tynku wapiennym (ciepła biel)','Pianino czarne na wysoki połysk – akcent jak czarna konsola TV','Półki na winyle (31 × 31 cm) w dolnym rzędzie','Panele akustyczne 118 × 128 cm, len w kolorze ścian'],
  'Elegancko i praktycznie dla akustyki. Pianino nie przy oknie – dobrze dla instrumentu (stała temperatura).','średni'),
 ('5','Domowy bar / kawiarnia + ściana galeryjna','Wnęka „zalana” głęboką zielenią na wysoki połysk: zabudowa barowa z blatem z marmuru, chłodziarka do wina, ekspres, postarzane lustro z szklanymi półkami na mosiężnych wspornikach. Antresola: ściana galeryjna – kilkanaście ram w różnych rozmiarach z kinkietami obrazowymi.',
  ['Fronty lakier zielony (np. oliwkowy/butelkowy), uchwyty mosiężne','Lustro antyczne + szkło + podświetlenie LED','Woda do ekspresu – podejście wodne przy WC za ścianą (ułatwia)','Galeria zdjęć cz-b jak na ścianie TV'],
  'Najbardziej odważna, „jewel box”. Kontrast z kremowym salonem.','średni'),
 ('6','Pracownia za stalowo-szklaną ścianą + lustrzana krata','Wnęka zamknięta czarną ścianą stalowo-szklaną (styl Crittall) z drzwiami – biurko na całą długość, półki, szafy po bokach. Antresola: postarzane lustra w tej samej czarnej kratownicy – powtarzają rytm okien, odbijają światło z fasady i optycznie powiększają salon.',
  ['Ściana stal + szkło (możliwe szkło ryflowane w dolnym pasie)','Biurko 274 × 62 cm, krzesło, lampa','Lustra 7 × 4 pól w kratownicy na antresoli','Dobrze gra z czarnymi ramami okien (RAL 7016)'],
  'Wydzielone, ciche miejsce do pracy w salonie. Szkło wymaga sprzątania.','średni–wysoki'),
]
CS2=[
 ('7','Portal łukowy w tadelakcie','Wnęka zamieniona w miękki łuk: przed nią ścianka z tynku tadelakt z łukowym otworem, wnętrze w ciepłym odcieniu tego samego tynku. Na dole długa ława z poduszkami, w osi mała łukowa nisza na ceramikę i dwa kinkiety. Antresola: tadelakt na całej wysokości i okrągłe lustro w mosiężnej ramie nad łukiem – trend „śródziemnomorski” z Pinteresta.',
  ['Ścianka z łukiem gr. ~8 cm (płyta g-k + tadelakt/mikrocement)','Ława dębowa 274 cm z poduszkami bouclé','Mała nisza łukowa 60 × 130 cm w osi','Lustro Ø140 cm w mosiądzu na 4,7 m'],
  'Bardzo miękko i rzeźbiarsko, mało stolarki. Łuk zmniejsza otwór wnęki.','niski–średni'),
 ('8','Japandi: podest tatami + shoji + krata kumiko','Wnęka jako strefa wyciszenia: dębowy podest 24 cm z matami tatami i poduszkami do siedzenia, niski stolik do herbaty. Wnękę zamykają przesuwne panele shoji (dąb + papier/akryl mleczny). Antresola: podświetlana od tyłu dębowa krata kumiko na całą szerokość – miękkie światło wieczorem.',
  ['Podest z szufladami (schowek)','Panele shoji przesuwne na szynie sufitowej','Krata kumiko 394 × 280 cm z LED za mlecznym akrylem','Kolory: dąb, len, papier ryżowy, akcenty czerni'],
  'Spokojna, minimalistyczna strefa (joga, herbata, czytanie). Mniej „klasycznie” niż reszta salonu.','średni'),
 ('9','Kącik kawowy z ławą + ściana talerzy','Wnęka jako przytulny kącik śniadaniowo-kawowy: ława tapicerowana na całą długość (50 cm), dwa okrągłe stoliki bistro, lampy wiszące, boazeria do 110 cm i półki na filiżanki. Antresola: kompozycja ręcznie robionych talerzy ceramicznych – ciepła, kolekcjonerska ściana.',
  ['Ława 374 × 50 cm, poduszki lniane','Stoliki Ø70 cm na czarnych nogach','Boazeria pionowa do 110 cm','Talerze Ø20–45 cm, ok. 25 sztuk'],
  'Drugie miejsce do kawy obok jadalni – dobre przy gościach. Talerze to tani i efektowny pomysł.','niski–średni'),
 ('10','Zielona alkowa (rośliny + panel z mchu)','Wnęka jako mała oranżeria: dębowe półki z podświetleniem LED do roślin, duże donice na podłodze, ławka. Nad krawędzią wnęki zwisające pnącza. Antresola: duży panel z mchu chrobotka w dębowej ramie – zielony obraz, który nie wymaga podlewania.',
  ['Listwy LED pełnego spektrum pod półkami','Donice ceramiczne, rośliny cieniolubne','Panel mchu 334 × 240 cm (stabilizowany)','Uwaga: wnęka nie ma okna – rośliny potrzebują lamp'],
  'Świeżo i naturalnie, ale wymaga opieki nad roślinami i lamp.','średni'),
 ('11','Gabinet kolekcji – podświetlane witryny','Cztery witryny 92 × 45 cm ze szklanymi drzwiami w mosiężnych ramach, na dole zamknięte szafki. Podświetlenie półek, ceramika, książki, pamiątki. Antresola: płyciny z listew w rytmie witryn z mosiężnymi kinkietami i gzymsem na 2,9 m – klasyczna, „muzealna” ściana.',
  ['Witryny ze szkłem i mosiądzem (lub czarną stalą)','LED w półkach, szkło 6 mm','Płyciny 76 × 220 cm na antresoli','4 kinkiety na wys. ~4,3 m'],
  'Elegancko i porządnie – kurz zostaje za szkłem. Najbardziej klasyczna.','wysoki'),
 ('12','Minimalistyczna galeria','Wnęka jak sala muzealna: pusta, jasna płaszczyzna, na środku cokół z rzeźbą, po bokach niskie dębowe ławki z ceramiką, trzy oprawy kierunkowe (wallwasher). Antresola: jedno wielkoformatowe płótno 280 × 230 cm z długim kinkietem obrazowym.',
  ['Cokół 94 × 70 cm, rzeźba/obiekt','Oprawy wpuszczane kierunkowe (wallwasher)','Płótno 280 × 230 cm na 3,2–5,5 m','Najmniej stolarki ze wszystkich koncepcji'],
  'Najtańsza i najbardziej „spokojna”; wymaga dobrego obrazu i rzeźby.','niski'),
]
cards=""
for k,t,lead,items,note,cost in CS+CS2:
    e=(K.elevW(k) if int(k)<=6 else K.elevW2(k)).svg(EB,1.0,defs=K.DEFS2); p=(K.plan_k(k) if int(k)<=6 else K.plan_k2(k)).svg(PB,1.0,defs=K.DEFS2)
    if k=='7': cards+='<section class="card"><div class="kick">Seria 2</div><h2 style="font-size:32px">Kolejne koncepcje (7–12)</h2></section>'
    li="".join(f"<li>{x}</li>" for x in items)
    cards+=f'''<section class="card"><div class="num">Koncepcja {k}</div><h2>{t}</h2><p class="lead">{lead}</p>
<div class="g"><figure>{e}<figcaption>Widok całej ściany z salonu: wnęka (0–2,9 m) + antresola (2,9–5,9 m).</figcaption></figure>
<div><figure>{p}<figcaption>Rzut wnęki i salonu.</figcaption></figure><ul>{li}</ul><p class="note"><b>W skrócie:</b> {note} <b>Koszt:</b> {cost}.</p></div></div></section>'''
LINKS=[('Ideal Home – 31 pomysłów na wnęki','https://www.idealhome.co.uk/all-rooms-ideas/clever-designs-for-alcoves-91177'),('Frederic – łóżka/daybedy we wnękach','https://fredericmagazine.com/2022/10/alcove-beds/'),
('Feather & Black – alkowa z zasłoną','https://www.featherandblack.com/inspiration/alcove-bedroom-ideas'),('Houzz – bar we wnęce z lustrem antycznym','https://www.houzz.com/hznb/projects/home-bar-pj-vj~6873776'),
('Boston Globe – wnęka zamieniona w zielony bar','https://www.bostonglobe.com/2025/03/14/magazine/home-design-turning-unused-nook-into-wet-bar'),('Armac Martin – inspiracje barów domowych','https://www.armacmartin.com/blogs/the-journal/luxury-home-bar-inspiration'),
('Crittall – wewnętrzne ściany stalowe','https://crittall-windows.co.uk/news/stunning-internal-windows'),('Houzz – 10 sposobów na drzwi Crittall we wnętrzu','https://www.houzz.co.uk/ideabooks/81346771/thumbs/crittall-style-windows-10-stylish-ideas-for-using-them-inside')]
li="".join(f'<li><a href="{u}">{t}</a></li>' for t,u in LINKS)
H=f'''<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wnęka + antresola – 12 koncepcji</title>
<style>:root{{--line:#e3dbcf;--mut:#7a7066;--acc:#9b7b45}}body{{margin:0;background:#fbf8f3;color:#2f2a25;font:16px/1.6 Georgia,serif}}main{{max-width:1180px;margin:0 auto;padding:44px 24px 80px}}
h1{{font-weight:400;font-size:38px;line-height:1.15;margin:0 0 8px}}h2{{font-weight:400;font-size:28px;margin:4px 0 8px}}.kick,.num{{font:600 12px Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--mut)}}.num{{color:var(--acc)}}
.lead{{font-size:18px;color:#4a433b;max-width:75ch}}.card{{border-top:1px solid var(--line);padding:30px 0 10px;margin-top:30px}}.g{{display:grid;grid-template-columns:3fr 2fr;gap:24px;align-items:start}}@media(max-width:860px){{.g{{grid-template-columns:1fr}}}}
figure{{margin:10px 0}}figure svg{{width:100%;height:auto;display:block;border:1px solid var(--line);border-radius:6px}}figcaption,.small{{font:13px/1.5 Helvetica,Arial,sans-serif;color:var(--mut);margin-top:6px}}
ul{{font:14px/1.55 Helvetica,Arial,sans-serif;padding-left:18px}}.note{{background:#f3ede3;border-left:3px solid var(--acc);padding:10px 14px;font:14px/1.55 Helvetica,Arial,sans-serif;border-radius:0 6px 6px 0}}
table{{width:100%;border-collapse:collapse;font:14px/1.45 Helvetica,Arial,sans-serif}}td,th{{border-bottom:1px solid var(--line);padding:8px;text-align:left;vertical-align:top}}th{{color:var(--mut)}}a{{color:#7a5a2a}}</style></head><body><main>
<div class="kick">Izabelin · salon 0.5.4 · wnęka 102 cm + antresola</div><h1>Wnęka razem z antresolą – 12 koncepcji</h1>
<p class="lead">Ściana z wnęką to w praktyce jedna płaszczyzna o wysokości ok. 5,9 m: na dole wnęka 394 × 290 × 102 cm, nad nią ściana łazienki z piętra (antresola) o wysokości ok. 3 m. Każda koncepcja projektuje obie części razem, żeby ściana czytała się jako całość z wysokim oknem (fasada 394 × 572 cm wg oferty Yawal) i ścianą TV.</p>
<p class="small">Styl jak na zdjęciu referencyjnym: kremowe ściany, jasny dąb, czarne akcenty, mosiądz, plecionka, bouclé i len. Rysunki w skali na wymiarach z DWG. Po wybraniu 1–2 koncepcji zrobię realistyczne wizualizacje i dodam je do modelu 3D domu.</p>
{cards}
<section class="card"><h2>Porównanie</h2><table><tr><th>Koncepcja</th><th>Funkcja wnęki</th><th>Antresola</th><th>Zmiany w elektryce</th><th>Koszt</th></tr>
<tr><td>1 Biblioteka x2</td><td>czytanie, książki</td><td>regały do sufitu + drabina</td><td>oświetlenie półek</td><td>wysoki</td></tr>
<tr><td>2 TV + lamele</td><td>kino domowe</td><td>lamele dębowe (akustyka)</td><td>przeniesienie TV/SAT/INT, audio</td><td>średni–wysoki</td></tr>
<tr><td>3 Daybed + zasłony</td><td>wypoczynek / gość</td><td>obraz + zasłony 5,9 m</td><td>kinkiety, szyna</td><td>średni</td></tr>
<tr><td>4 Kącik muzyczny</td><td>pianino, winyle</td><td>panele akustyczne lniane</td><td>kinkiet obrazowy, gniazdo</td><td>średni</td></tr>
<tr><td>5 Bar</td><td>bar / kawiarnia</td><td>ściana galeryjna</td><td>chłodziarka, ekspres, woda, LED</td><td>średni</td></tr>
<tr><td>6 Pracownia</td><td>biuro za szkłem</td><td>lustra w stalowej kracie</td><td>gniazda przy biurku, LAN</td><td>średni–wysoki</td></tr>
<tr><td>7 Portal łukowy</td><td>ława, nastrój</td><td>tadelakt + lustro okrągłe</td><td>2 kinkiety</td><td>niski–średni</td></tr>
<tr><td>8 Japandi</td><td>wyciszenie, herbata</td><td>podświetlana krata kumiko</td><td>LED za kratą</td><td>średni</td></tr>
<tr><td>9 Kącik kawowy</td><td>kawa, śniadania</td><td>ściana talerzy</td><td>2 lampy wiszące</td><td>niski–średni</td></tr>
<tr><td>10 Zielona alkowa</td><td>rośliny</td><td>panel z mchu</td><td>lampy do roślin</td><td>średni</td></tr>
<tr><td>11 Witryny</td><td>kolekcja</td><td>płyciny + kinkiety</td><td>LED w witrynach</td><td>wysoki</td></tr>
<tr><td>12 Galeria</td><td>ekspozycja sztuki</td><td>wielkie płótno</td><td>3 wallwashery</td><td>niski</td></tr></table></section>
<section class="card"><h2>Inspiracje</h2><ul>{li}</ul><p class="small">Wyszukiwarka nie zwraca bezpośrednio tablic Pinteresta, więc posłużyłem się serwisami, z których pochodzi większość pinów o tych tematach (Houzz, Ideal Home, Crittall, magazyny wnętrzarskie).</p></section>
</main></body></html>'''
open(f'{OUT}/wneka-antresola-koncepcje.html','w').write(H); print('ok')
