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
 ('4','Strefa kominkowa z kamiennym „kominem” do sufitu','Wnęka: biokominek (bez komina – za ścianą jest WC) w obudowie z kamienia, ławy po bokach ze schowkiem na drewno. Antresola: pas kamienia 140 cm kontynuowany od kominka do sufitu – optycznie wielki komin; reszta ściany w wapnie, belki dębowe w suficie wnęki.',
  ['Okładzina: trawertyn/wapień lub tynk kamieniopodobny (lżejszy)','Okrągłe lustro w mosiężnej ramie nad kominkiem','Ławy 45 × 116 cm z poduszkami, drewno pod spodem','Kinkiety na „kominie” na wys. ~4,3 m'],
  'Klimatycznie i ponadczasowo. Ciężar kamienia na ścianie antresoli – lepiej płyty cienkie lub tynk.','średni–wysoki'),
 ('5','Domowy bar / kawiarnia + ściana galeryjna','Wnęka „zalana” głęboką zielenią na wysoki połysk: zabudowa barowa z blatem z marmuru, chłodziarka do wina, ekspres, postarzane lustro z szklanymi półkami na mosiężnych wspornikach. Antresola: ściana galeryjna – kilkanaście ram w różnych rozmiarach z kinkietami obrazowymi.',
  ['Fronty lakier zielony (np. oliwkowy/butelkowy), uchwyty mosiężne','Lustro antyczne + szkło + podświetlenie LED','Woda do ekspresu – podejście wodne przy WC za ścianą (ułatwia)','Galeria zdjęć cz-b jak na ścianie TV'],
  'Najbardziej odważna, „jewel box”. Kontrast z kremowym salonem.','średni'),
 ('6','Pracownia za stalowo-szklaną ścianą + lustrzana krata','Wnęka zamknięta czarną ścianą stalowo-szklaną (styl Crittall) z drzwiami – biurko na całą długość, półki, szafy po bokach. Antresola: postarzane lustra w tej samej czarnej kratownicy – powtarzają rytm okien, odbijają światło z fasady i optycznie powiększają salon.',
  ['Ściana stal + szkło (możliwe szkło ryflowane w dolnym pasie)','Biurko 274 × 62 cm, krzesło, lampa','Lustra 7 × 4 pól w kratownicy na antresoli','Dobrze gra z czarnymi ramami okien (RAL 7016)'],
  'Wydzielone, ciche miejsce do pracy w salonie. Szkło wymaga sprzątania.','średni–wysoki'),
]
cards=""
for k,t,lead,items,note,cost in CS:
    e=K.elevW(k).svg(EB,1.0,defs=K.DEFS2); p=K.plan_k(k).svg(PB,1.0,defs=K.DEFS2)
    li="".join(f"<li>{x}</li>" for x in items)
    cards+=f'''<section class="card"><div class="num">Koncepcja {k}</div><h2>{t}</h2><p class="lead">{lead}</p>
<div class="g"><figure>{e}<figcaption>Widok całej ściany z salonu: wnęka (0–2,9 m) + antresola (2,9–5,9 m).</figcaption></figure>
<div><figure>{p}<figcaption>Rzut wnęki i salonu.</figcaption></figure><ul>{li}</ul><p class="note"><b>W skrócie:</b> {note} <b>Koszt:</b> {cost}.</p></div></div></section>'''
LINKS=[('Ideal Home – 31 pomysłów na wnęki','https://www.idealhome.co.uk/all-rooms-ideas/clever-designs-for-alcoves-91177'),('Frederic – łóżka/daybedy we wnękach','https://fredericmagazine.com/2022/10/alcove-beds/'),
('Feather & Black – alkowa z zasłoną','https://www.featherandblack.com/inspiration/alcove-bedroom-ideas'),('Houzz – pomysły na wnęki przy kominku','https://www.houzz.com.sg/magazine/10-stylish-ideas-for-fireplace-alcoves-stsetivw-vs~54272787'),
('OSMOZ – obudowa kominka jako oś zabudowy','https://www.osmoz.com/inspiration/osmoz-magazine/2046/easy-mantel-shelf-and-surround-ideas-for-a-built-in-look'),('Houzz – bar we wnęce z lustrem antycznym','https://www.houzz.com/hznb/projects/home-bar-pj-vj~6873776'),
('Boston Globe – wnęka zamieniona w zielony bar','https://www.bostonglobe.com/2025/03/14/magazine/home-design-turning-unused-nook-into-wet-bar'),('Armac Martin – inspiracje barów domowych','https://www.armacmartin.com/blogs/the-journal/luxury-home-bar-inspiration'),
('Crittall – wewnętrzne ściany stalowe','https://crittall-windows.co.uk/news/stunning-internal-windows'),('Houzz – 10 sposobów na drzwi Crittall we wnętrzu','https://www.houzz.co.uk/ideabooks/81346771/thumbs/crittall-style-windows-10-stylish-ideas-for-using-them-inside')]
li="".join(f'<li><a href="{u}">{t}</a></li>' for t,u in LINKS)
H=f'''<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wnęka + antresola – 6 koncepcji</title>
<style>:root{{--line:#e3dbcf;--mut:#7a7066;--acc:#9b7b45}}body{{margin:0;background:#fbf8f3;color:#2f2a25;font:16px/1.6 Georgia,serif}}main{{max-width:1180px;margin:0 auto;padding:44px 24px 80px}}
h1{{font-weight:400;font-size:38px;line-height:1.15;margin:0 0 8px}}h2{{font-weight:400;font-size:28px;margin:4px 0 8px}}.kick,.num{{font:600 12px Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--mut)}}.num{{color:var(--acc)}}
.lead{{font-size:18px;color:#4a433b;max-width:75ch}}.card{{border-top:1px solid var(--line);padding:30px 0 10px;margin-top:30px}}.g{{display:grid;grid-template-columns:3fr 2fr;gap:24px;align-items:start}}@media(max-width:860px){{.g{{grid-template-columns:1fr}}}}
figure{{margin:10px 0}}figure svg{{width:100%;height:auto;display:block;border:1px solid var(--line);border-radius:6px}}figcaption,.small{{font:13px/1.5 Helvetica,Arial,sans-serif;color:var(--mut);margin-top:6px}}
ul{{font:14px/1.55 Helvetica,Arial,sans-serif;padding-left:18px}}.note{{background:#f3ede3;border-left:3px solid var(--acc);padding:10px 14px;font:14px/1.55 Helvetica,Arial,sans-serif;border-radius:0 6px 6px 0}}
table{{width:100%;border-collapse:collapse;font:14px/1.45 Helvetica,Arial,sans-serif}}td,th{{border-bottom:1px solid var(--line);padding:8px;text-align:left;vertical-align:top}}th{{color:var(--mut)}}a{{color:#7a5a2a}}</style></head><body><main>
<div class="kick">Izabelin · salon 0.5.4 · wnęka 102 cm + antresola</div><h1>Wnęka razem z antresolą – 6 koncepcji</h1>
<p class="lead">Ściana z wnęką to w praktyce jedna płaszczyzna o wysokości ok. 5,9 m: na dole wnęka 394 × 290 × 102 cm, nad nią ściana łazienki z piętra (antresola) o wysokości ok. 3 m. Każda koncepcja projektuje obie części razem, żeby ściana czytała się jako całość z wysokim oknem (fasada 394 × 572 cm wg oferty Yawal) i ścianą TV.</p>
<p class="small">Styl jak na zdjęciu referencyjnym: kremowe ściany, jasny dąb, czarne akcenty, mosiądz, plecionka, bouclé i len. Rysunki w skali na wymiarach z DWG. Po wybraniu 1–2 koncepcji zrobię realistyczne wizualizacje i dodam je do modelu 3D domu.</p>
{cards}
<section class="card"><h2>Porównanie</h2><table><tr><th>Koncepcja</th><th>Funkcja wnęki</th><th>Antresola</th><th>Zmiany w elektryce</th><th>Koszt</th></tr>
<tr><td>1 Biblioteka x2</td><td>czytanie, książki</td><td>regały do sufitu + drabina</td><td>oświetlenie półek</td><td>wysoki</td></tr>
<tr><td>2 TV + lamele</td><td>kino domowe</td><td>lamele dębowe (akustyka)</td><td>przeniesienie TV/SAT/INT, audio</td><td>średni–wysoki</td></tr>
<tr><td>3 Daybed + zasłony</td><td>wypoczynek / gość</td><td>obraz + zasłony 5,9 m</td><td>kinkiety, szyna</td><td>średni</td></tr>
<tr><td>4 Kominek</td><td>strefa kominkowa</td><td>kamienny „komin”</td><td>biokominek (bez komina), kinkiety</td><td>średni–wysoki</td></tr>
<tr><td>5 Bar</td><td>bar / kawiarnia</td><td>ściana galeryjna</td><td>chłodziarka, ekspres, woda, LED</td><td>średni</td></tr>
<tr><td>6 Pracownia</td><td>biuro za szkłem</td><td>lustra w stalowej kracie</td><td>gniazda przy biurku, LAN</td><td>średni–wysoki</td></tr></table></section>
<section class="card"><h2>Inspiracje</h2><ul>{li}</ul><p class="small">Wyszukiwarka nie zwraca bezpośrednio tablic Pinteresta, więc posłużyłem się serwisami, z których pochodzi większość pinów o tych tematach (Houzz, Ideal Home, Crittall, magazyny wnętrzarskie).</p></section>
</main></body></html>'''
open(f'{OUT}/wneka-antresola-koncepcje.html','w').write(H); print('ok')
