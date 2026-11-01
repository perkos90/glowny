import sys
OUT=sys.argv[1]
RU=[('r1','Marmurowa nisza TV + boazeria z mosiądzem','«Мраморная ниша»',
 'Wnęka wyłożona jasnym marmurem (lub spiekiem Calacatta) z podświetleniem LED po obwodzie. W środku TV i długa, czarna konsola podwieszana z podświetleniem od spodu. Wnękę obramowuje szeroka, klasyczna opaska. Na antresoli boazeria: sześć symetrycznych płycin z cienką mosiężną wstawką, gzyms nad wnęką i kaskadowy żyrandol.',
 ['Marmur/spiek bookmatch, podświetlenie konturowe','Konsola lakier czarny 274 cm, LED pod spodem','Boazeria malowana w kolorze ścian + mosiądz 6 mm','Żyrandol kaskadowy czarny z mosiądzem'],'wysoki'),
 ('r2','Trzy podświetlane łuki + łukowe płyciny','«Арки с подсветкой»',
 'We wnęce ścianka z tynku z trzema łukowymi niszami: boczne z podświetlanymi szklanymi półkami i szafkami, środkowa z tapicerowaną ławą i obrazem. Na antresoli płyciny zakończone łukiem, powtarzające rytm nisz, i para mosiężnych kinkietów.',
 ['Łuki z płyt g-k + tynk dekoracyjny','LED w każdym łuku (ciepłe 2700 K)','Ława dębowa z poduszkami bouclé','Płyciny łukowe z listew na 3,3–5,5 m'],'średni'),
 ('r3','Trawertyn z podświetleniem + rejki do sufitu','«Травертин и рейки»',
 'Wnętrze wnęki w trawertynie (lub płytach trawertynopodobnych) z ukrytą listwą LED u góry. Podwieszana trawertynowa ława na całą długość i półka, obie podświetlone od spodu. Antresola to ryflowane panele (rejki) w kolorze greige od krawędzi wnęki do sufitu, z linią światła na 2,9 m.',
 ['Trawertyn szlifowany, ława gr. 10 cm','Półka 314 cm podświetlana','Panele ryflowane MDF malowane, 5,9 m','Minimum dekoracji – „cichy luksus”'],'średni–wysoki'),
 ('r4','Symetryczna biblioteka-witryna + lustro w mosiądzu','«Классическая библиотека»',
 'Dwie wysokie witryny (szkło + kremowe fronty z płycinami) z podświetlanymi półkami, między nimi czarna komoda z blatem z trawertynu, duże lustro w mosiężnej ramie i para lamp. Na antresoli boazeria z trzema wysokimi płycinami z mosiężną wstawką oraz mosiężne listwy oświetleniowe pod sufitem.',
 ['Witryny 92 × 50 cm, drzwi szklane z ramą','Komoda czarna 194 cm, blat trawertyn','Lustro 160 × 157 cm, rama mosiądz','Symetria – typowa dla «современной классики»'],'wysoki')]
PL=[('p1','Ciemny spiek za TV + dębowe lamele do sufitu','Spiek + lamele',
 'Tył wnęki ze spieku wielkoformatowego w czerni z żyłą (typu Nero Marquina), boki i sufit wnęki w dębie. TV z podświetleniem, pod nim długa dębowa szafka z ryflowanym frontem, podświetlona od spodu. Na antresoli pionowe dębowe lamele na czarnym filcu aż do sufitu – najpopularniejsze połączenie na polskim Pintereście.',
 ['Spiek 12 mm, format 160 × 320','Szafka RTV 354 cm, ryflowany front','Lamele dębowe na filcu akustycznym 5,9 m','LED na krawędzi wnęki'],'wysoki'),
 ('p2','Panele tapicerowane + mikrocement + lampy na linkach','Tapicerka + mikrocement',
 'Wnęka w mikrocemencie z poziomymi panelami tapicerowanymi w bouclé (jak duże wezgłowie) i wbudowaną sofą na całą długość. Dwa kinkiety do czytania. Antresola w mikrocemencie, a przed nią dwie duże lampy zawieszone na długich linkach w połowie wysokości salonu – rada z Muratora dla salonów z antresolą.',
 ['Panele tapicerowane 334 × 200 cm, tkanina plamoodporna','Sofa wbudowana 354 × 92 cm','Mikrocement na wnęce i antresoli','Lampy Ø44 cm na 2,7 m'],'średni'),
 ('p3','Bielona cegła rozbiórkowa do sufitu + stalowe półki','Cegła + stal',
 'Cała ściana – wnęka i antresola – w bielonej cegle rozbiórkowej (lub płytkach cegłopodobnych, lżejszych). We wnęce dębowe półki na czarnych wspornikach, dębowa ława na stalowych nogach z miejscem na drewno dekoracyjne. Na antresoli dwa czarne kinkiety.',
 ['Cegła rozbiórkowa bielona / lico cegły 2 cm','Półki dąb + czarna stal','Ława 374 cm na stalowych nogach','Łączy się z czarnymi oknami RAL 7016'],'średni'),
 ('p4','Fototapeta botaniczna + ryflowane dębowe fronty','Fototapeta + ryflowanie',
 'Wnęka w greige z fototapetą botaniczną w górnej części, poniżej dębowe szafki z ryflowanymi frontami i blatem z trawertynu oraz ława z poduszkami. Na antresoli ta sama fototapeta na całą wysokość (ok. 3 m) – efekt „ogrodu” za salonem, zamówiona na wymiar ściany.',
 ['Fototapeta na wymiar 3,9 × 3,0 m (flizelina)','Szafki ryflowane 120 cm + ława 154 cm','Blat trawertyn','Tanie i szybkie w wymianie'],'niski–średni')]
def cards(L):
    o=''
    for k,t,orig,lead,items,cost in L:
        li=''.join(f'<li>{x}</li>' for x in items)
        o+=f'''<article class="card"><img src="img/{k}.jpg" alt="{t}"><div class="txt"><div class="num">{k.upper()} · {orig}</div><h3>{t}</h3><p>{lead}</p><ul>{li}</ul><p class="cost"><b>Koszt:</b> {cost}</p></div></article>'''
    return o
H=f'''<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wnęka + antresola – koncepcje z rosyjskiego i polskiego Pinteresta</title>
<style>body{{margin:0;background:#fbf8f3;color:#2f2a25;font:16px/1.6 Georgia,serif}}main{{max-width:1240px;margin:0 auto;padding:40px 22px 80px}}h1{{font-weight:400;font-size:36px;line-height:1.15;margin:0 0 8px}}
.kick,.num{{font:600 12px Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#7a7066}}.num{{color:#9b7b45}}.lead{{font-size:18px;color:#4a433b;max-width:78ch}}
.tabs{{position:sticky;top:0;background:rgba(251,248,243,.95);padding:12px 0;z-index:5;display:flex;gap:8px;border-bottom:1px solid #e3dbcf;margin:22px 0 10px}}
.tabs button{{border:1px solid #d9cfbf;background:#fff;border-radius:999px;padding:9px 16px;font:15px Helvetica,Arial,sans-serif;cursor:pointer}}.tabs button.on{{background:#2f2a25;color:#fbf8f3;border-color:#2f2a25}}
section{{display:none}}section.on{{display:block}}h2{{font-weight:400;font-size:28px;margin:18px 0 4px}}.card{{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:26px;align-items:start;border-top:1px solid #e3dbcf;padding:26px 0}}
.card img{{width:100%;border-radius:8px;display:block}}h3{{font-weight:400;font-size:24px;margin:4px 0 8px}}ul{{font:14px/1.55 Helvetica,Arial,sans-serif;padding-left:18px}}.cost{{font:14px Helvetica,Arial,sans-serif;background:#f3ede3;border-left:3px solid #9b7b45;padding:8px 12px}}
.small{{font:13px/1.5 Helvetica,Arial,sans-serif;color:#7a7066}}a{{color:#7a5a2a}}@media(max-width:820px){{.card{{grid-template-columns:1fr}}}}</style></head><body><main>
<div class="kick">Izabelin · salon · wnęka 102 cm + antresola (ok. 5,9 m)</div><h1>Koncepcje z rosyjskiego i polskiego Pinteresta</h1>
<p class="lead">Każda koncepcja to cała ściana: wnęka 394 × 290 cm i antresola nad nią aż do sufitu. Wizualizacje na wymiarach z DWG, z oknem według oferty Yawal (394 × 572 cm) i słońcem przez fasadę. Telewizor zostaje na ścianie płd. tam, gdzie wnęka ma inną funkcję.</p>
<div class="tabs"><button data-s="ru" class="on">Rosyjski Pinterest – nowoczesna klasyka</button><button data-s="pl">Polski Pinterest</button></div>
<section id="ru" class="on"><h2>«Современная классика» – nowoczesna klasyka</h2><p class="small">Cechy stylu: symetria, boazeria i płyciny, cienkie mosiężne wstawki, marmur i trawertyn, podświetlane nisze, monochromatyczny beż z czernią, kaskadowe żyrandole w salonach „ze drugim światłem” (двусветная гостиная).</p>{cards(RU)}</section>
<section id="pl"><h2>Polski Pinterest</h2><p class="small">Najczęstsze motywy: lamele dębowe, spieki wielkoformatowe za TV, panele tapicerowane, mikrocement, bielona cegła, fototapety na wymiar, ryflowane fronty, lampy na długich linkach w wysokich salonach.</p>{cards(PL)}</section>
<p class="small" style="margin-top:30px">Źródła inspiracji: <a href="https://muratordom.pl/wnetrza/projekty-i-aranzacje/wysokie-wnetrza-w-domu-salon-i-antresola-aa-zpsv-DToV-XkE4.html">Murator – salon z antresolą</a>, <a href="https://muratordom.pl/wnetrza/salon/pomysly-na-sciane-za-telewizorem-efektowne-aranzacje-ktore-odmienia-salon-aa-Duvk-GqE2-tMyF.html">Murator – ściana za TV</a>, <a href="https://muratordom.pl/cenniki-budowlane/drewniane-metalowe-czy-mdf-jakie-lamele-wybrac-inspiracje-i-ceny-marzec-2026-aa-KE8x-GhvP-Y2wM.html">Murator – lamele 2026</a>, <a href="https://kb.pl/wnetrza/aranzacja-salonu/co-na-sciane-w-salonie-najlepsze-propozycje-wykonczenia-scian/">KB – wykończenie ścian w salonie</a>, <a href="https://m-strana.ru/design/vtoroy-svet-v-interere-dizayn-osobennosti-preimushchestva-i-nedostatki/">m-strana.ru – второй свет</a>, <a href="https://junior3d.ru/dekor/dizajn-vtorogo-sveta.html">junior3d.ru – гостиная со вторым светом</a>, <a href="https://realty.rbc.ru/news/617be4549a7947f1baa021fc">RBC – молдинги</a>. Strony Pinteresta (ru/pl) są zablokowane w tym środowisku, więc korzystałem z serwisów, z których pochodzą piny.</p>
</main><script>document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{{document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));document.querySelectorAll('section').forEach(s=>s.classList.toggle('on',s.id===b.dataset.s));scrollTo(0,0);}});</script></body></html>'''
open(f'{OUT}/index.html','w').write(H); print('ok')
