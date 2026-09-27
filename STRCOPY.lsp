;;; ==========================================================================
;;; STRCOPY.lsp  -  PRZENIESIENIE DANYCH STRINGOW ze starego obszaru stolow
;;;                 na stoly przestawione w nowe miejsce
;;; BricsCAD 2019 (czysty AutoLISP + vla-getboundingbox, vlax-for po blokach)
;;; Spec: docs/superpowers/specs/2026-09-26-strcopy-design.md
;;; --------------------------------------------------------------------------
;;; STRCOPY  - uruchom w ORYGINALNYM rysunku. Wskaz polilinie starego obszaru,
;;;            przykladowy napis stringu i blok stolu. Skrypt czyta stringi
;;;            z obszaru: numer (ST / INV / STR), kolor kreskowania inwertera,
;;;            rzad stolu (G = gorny, D = dolny) i liczbe paneli POD
;;;            kreskowaniem (liczona z bryl paneli bloku stolu, nie z dlugosci
;;;            kreskowania). Wynik: plik <rysunek>_strcopy.csv obok DWG.
;;; STRPASTE - uruchom w NOWYM rysunku. Wskaz plik CSV, polilinie nowego
;;;            obszaru, napis i blok stolu. Nowe kreskowania musza juz lezec
;;;            tak, jak ida stringi, a kazdy string musi miec napis (moze byc
;;;            skopiowany / zly - sluzy tylko do rozpoznania, ktore
;;;            kreskowania tworza jeden string).
;;;            1. Kontrola zestawu: tyle samo stringow kazdego rodzaju
;;;               (G24, G25, D24, D25 ...) co w oryginale - inaczej nic nie
;;;               jest zmieniane.
;;;            2. Grupy inwerterow - pytanie [Skupiska/Pasy]:
;;;               Skupiska (domyslnie, jak INWERTERY w ZLICZ-PANELE): obszar
;;;               dzielony na pol rekurencyjnie - polowa inwerterow (od
;;;               pierwszego numeru) dostaje czesc obszaru przy narozniku
;;;               startu, z kazdego rodzaju tyle stringow, ile maja te
;;;               inwertery w oryginale. Ciecie miedzy rzedami stolow (rzad
;;;               na granicy dzielony) albo w poprzek rzedow - wybierane to,
;;;               ktore daje zwartsze czesci (ksztalt *SC-ASPECT*). Kazda
;;;               grupa jest jednym zwartym skupiskiem.
;;;               Pasy: rzedy stolow dzielone na pasy po N rzedow,
;;;               pasy przegladane kolumnami od wybranej strony (kolejny pas
;;;               w przeciwna strone); kazdy inwerter bierze kolejne stringi
;;;               takiego rodzaju, jakiego mu jeszcze brakuje. Skrypt uklada
;;;               grupy dla kazdego N (1..liczba rzedow) i proponuje N, przy
;;;               ktorym grupy sa najmniej porozrywane (przy remisie N
;;;               z oryginalu).
;;;               W obu trybach potem porzadkowanie: zamiana stringow tego
;;;               samego rodzaju miedzy inwerterami, gdy grupy staja sie
;;;               zwartsze (nigdy, gdy zamiana rozrywa grupe).
;;;            3. Numery w grupie: rzad po rzedzie od wybranego naroznika,
;;;               kazdy rodzaj dostaje numery STR swojego rodzaju rosnaco.
;;;            4. Zapis (po potwierdzeniu, jedno UNDO): w napisach zmieniane
;;;               sa tylko czlony ST / INV / STR, kreskowania dostaja kolor
;;;               inwertera (jawny, warstwa bez zmian); kontrola po zapisie.
;;; Kolka na niedrukowalnej warstwie STRCOPY_TEST: CZERWONE = blad,
;;; ZOLTE = do sprawdzenia.
;;; ==========================================================================

(vl-load-com)

(setq *SC-CELL*    20.0)   ; kubelek siatki po X [m]
(setq *SC-LTOL*     0.3)   ; napis na kreskowaniu: odleglosc do [m]
(setq *SC-LFAR*     3.0)   ; napis obok kreskowania: najblizsze do [m]
(setq *SC-NEAR*    50.0)   ; ten sam string poza obszarem blizej niz [m]
(setq *SC-HMARG*   10.0)   ; kreskowania: zapas wokol obszaru [m]
(setq *SC-TMARG*    5.0)   ; stoly: zapas wokol obszaru [m]
(setq *SC-IMARG*  100.0)   ; stoly: wstepny zapas po punkcie wstawienia [m]
(setq *SC-SOLTOL*   0.25)  ; bryla = panel przy wymiarach +/- 25 % mediany
(setq *SC-GAP*      0.02)  ; stol bez bryl: przerwa miedzy panelami [m]
(setq *SC-SWAPMIN* 10.0)   ; porzadkowanie: min. zysk (suma kwadratow odl.) [m2]
(setq *SC-SWAPMAX*  200)   ; porzadkowanie: najwiecej zamian
(setq *SC-FARK*     2.5)   ; daleko od grupy: k x mediana odleglosci w grupie
(setq *SC-FARMIN*  15.0)   ; ... i dalej niz [m]
(setq *SC-CIRCR*    5.0)   ; promien kolka [m]
(setq *SC-CIRCTXH*  1.5)   ; opis przy kolku: wysokosc tekstu [m]
(setq *SC-CIRCTXW* 45.0)   ; opis przy kolku: szerokosc zawijania [m]
(setq *SC-RED*        1)   ; kolko: blad
(setq *SC-YELLOW*     2)   ; kolko: do sprawdzenia
(setq *SC-LAYER* "STRCOPY_TEST")
(setq *SC-MAXLST*    40)   ; najwiecej wpisow jednej listy w raporcie
(setq *SC-ASPECT*    3.0)  ; skupiska: ksztalt grupy - wymiar wzdluz rzedow / w poprzek
(setq *SC-MIXW*      0.3)  ; skupiska: kara za czesci zachodzace na siebie (na string)
(if (null *SC-MODE*) (setq *SC-MODE* "Skupiska"))
(if (null *SC-HFROM*) (setq *SC-HFROM* "Lewa"))
(if (null *SC-VFROM*) (setq *SC-VFROM* "Gory"))

;;; --------------------------------------------------------------------------
;;; Narzedzia ogolne
;;; --------------------------------------------------------------------------

(defun sc:pt (ptx pty) (strcat "X=" (rtos ptx 2 1) " Y=" (rtos pty 2 1)))

;; rekord jako lista par: odczyt i "zmiana" (nowa para na poczatku przyslania)
(defun sc:g (rec tag) (cdr (assoc tag rec)))
(defun sc:s (rec tag val) (cons (cons tag val) rec))

(defun sc:join (lst sep / out itm)
  (foreach itm lst (setq out (if out (strcat out sep itm) itm)))
  (if out out ""))

(defun sc:setnth (lst idx val / out kk itm)
  (setq kk 0)
  (foreach itm lst (setq out (cons (if (= kk idx) val itm) out) kk (1+ kk)))
  (reverse out))

;; sortowanie przez scalanie wg funkcji "mniejszy" - stabilne (vl-sort gubi
;; elementy rowne). Nazwy lokalne celowo nietypowe: lambdy przekazywane jako
;; mslf widza zmienne wywolujacego (wiazanie dynamiczne).
(defun sc:msort (msl mslf / msh msa msb mso)
  (if (or (null msl) (null (cdr msl)))
    msl
    (progn
      (setq msh (/ (length msl) 2) msa nil msb msl mso nil)
      (repeat msh (setq msa (cons (car msb) msa) msb (cdr msb)))
      (setq msa (sc:msort (reverse msa) mslf)
            msb (sc:msort msb mslf))
      (while (and msa msb)
        (if (apply mslf (list (car msb) (car msa)))
          (setq mso (cons (car msb) mso) msb (cdr msb))
          (setq mso (cons (car msa) mso) msa (cdr msa))))
      (append (reverse mso) msa msb))))

(defun sc:median (nums)
  (if nums (nth (/ (length nums) 2) (sc:msort nums (function <)))))

(defun sc:strless (sa sb) (< sa sb))

;; komunikaty do raportu (listy globalne, najnowszy na poczatku)
(defun sc:reset ()
  (setq *SC-ERRS* nil *SC-CHKS* nil *SC-INFOS* nil *SC-CIRCS* nil
        *SC-BLKBOX* nil *SC-LOCKS* nil *SC-UNDO* nil *SC-NSOFT* 0 *SC-UNL* nil
        *SC-BIL* nil *SC-BILROWS* nil))

;; blad "miekki": przy wyborze Dopasuj w STRPASTE nie blokuje zapisu
;; (zestaw sie nie zgadza, kreskowanie bez napisu)
(defun sc:errsoft (msg ptx pty)
  (setq *SC-NSOFT* (1+ *SC-NSOFT*))
  (sc:err msg ptx pty))

;; kolko = (x y kolor opis); w tym samym miejscu kolejne opisy sa dopisywane
(defun sc:circ (ptx pty col msg / itm cur)
  (setq cur nil)
  (foreach itm *SC-CIRCS*
    (if (and (null cur) (equal (list ptx pty col) (list (car itm) (cadr itm) (caddr itm)) 1e-6))
      (setq cur itm)))
  (cond
    ((null cur) (setq *SC-CIRCS* (cons (list ptx pty col msg) *SC-CIRCS*)))
    ((not (vl-string-search msg (cadddr cur)))
     (setq *SC-CIRCS* (subst (list ptx pty col (strcat (cadddr cur) "; " msg)) cur *SC-CIRCS*)))))

(defun sc:err (msg ptx pty)
  (setq *SC-ERRS* (cons (if ptx (strcat (sc:pt ptx pty) "  " msg) msg) *SC-ERRS*))
  (if ptx (sc:circ ptx pty *SC-RED* (strcat "BLAD: " msg))))

(defun sc:chk (msg ptx pty)
  (setq *SC-CHKS* (cons (if ptx (strcat (sc:pt ptx pty) "  " msg) msg) *SC-CHKS*))
  (if ptx (sc:circ ptx pty *SC-YELLOW* (strcat "SPRAWDZ: " msg))))

(defun sc:info (msg) (setq *SC-INFOS* (cons msg *SC-INFOS*)))

;; lista w raporcie, najwyzej *SC-MAXLST* wpisow
(defun sc:print (title lst / cnt itm)
  (princ (strcat "\n--- " title " (" (itoa (length lst)) ") ---"))
  (if (null lst)
    (princ "\n  (brak)")
    (progn
      (setq cnt 0)
      (foreach itm (reverse lst)
        (if (< cnt *SC-MAXLST*) (princ (strcat "\n  " itm)))
        (setq cnt (1+ cnt)))
      (if (> cnt *SC-MAXLST*)
        (princ (strcat "\n  ... i " (itoa (- cnt *SC-MAXLST*)) " kolejnych"))))))

(defun sc:report (title / itm)
  (princ (strcat "\n\n==================== " title " - raport ===================="))
  (sc:print "BLEDY" *SC-ERRS*)
  (sc:print "DO SPRAWDZENIA" *SC-CHKS*)
  (sc:print "INFORMACJE" *SC-INFOS*)
  ;; bilans miejsc - zawsze w calosci
  (if *SC-BIL*
    (progn
      (princ "\n--- BILANS MIEJSC: brakujace / niepotrzebne (z dlugoscia stringu) ---")
      (foreach itm (reverse *SC-BIL*) (princ (strcat "\n  " itm))))))

;;; --------------------------------------------------------------------------
;;; Bilans miejsc (STRPASTE, gdy zestaw sie nie zgadza)
;;; --------------------------------------------------------------------------

;; "G24" -> ("gorny rzad" "24")
(defun sc:kindparts (kd / pre)
  (setq pre (sc:alpha kd))
  (list (cond ((= pre "G") "gorny rzad") ((= pre "D") "dolny rzad") ((= pre "S") "srodkowy rzad")
              (T (strcat "rzad " pre)))
        (sc:digs kd (1+ (strlen pre)))))

(defun sc:bil (txt row)
  (setq *SC-BIL* (cons txt *SC-BIL*))
  (if row (setq *SC-BILROWS* (cons row *SC-BILROWS*))))

;; sumy wg rodzaju + lista niepotrzebnych miejsc (xtra: stringi z kotwicami)
(defun sc:bilans (okc nkc xtra / kinds itm kd on nn kp xs)
  (setq *SC-BIL* nil *SC-BILROWS* nil)
  (foreach itm (append okc nkc)
    (if (not (member (car itm) kinds)) (setq kinds (cons (car itm) kinds))))
  (foreach kd (sc:msort kinds (function sc:strless))
    (setq on (cdr (assoc kd okc)) nn (cdr (assoc kd nkc))
          on (if on on 0) nn (if nn nn 0) kp (sc:kindparts kd))
    (if (/= on nn)
      (sc:bil (strcat kd " (" (car kp) ", " (cadr kp) " paneli): w oryginale " (itoa on)
                      ", w nowym obszarze " (itoa nn) " -> "
                      (if (> nn on)
                        (strcat "NIEPOTRZEBNE miejsca: " (itoa (- nn on)))
                        (strcat "BRAKUJE miejsc: " (itoa (- on nn)))))
              (strcat "SUMA;" kd ";" (car kp) ";" (cadr kp) ";" (itoa on) ";" (itoa nn) ";"
                      (itoa (- nn on)) ";;;;"))))
  (foreach xs (sc:msort xtra (function sc:readless))
    (setq kp (sc:kindparts (sc:g xs "KIND")))
    (sc:bil (strcat "niepotrzebne: " (sc:pt (sc:g xs "CX") (sc:g xs "CY")) "  \"" (sc:g xs "TEXT")
                    "\"  " (sc:g xs "KIND") " = " (cadr kp) " paneli, " (car kp) ", rzad stolow "
                    (itoa (1+ (sc:g xs "AI"))) " od " (if (= *SC-VFROM* "Gory") "gory" "dolu"))
            (strcat "NIEPOTRZEBNE;" (sc:g xs "KIND") ";" (car kp) ";" (cadr kp) ";;;;"
                    (sc:csvfld (sc:g xs "TEXT")) ";" (sc:num (sc:g xs "CX") 2) ";"
                    (sc:num (sc:g xs "CY") 2) ";" (itoa (1+ (sc:g xs "AI")))))))

;; numery z oryginalu bez miejsca (po przydziale) -> liczba
(defun sc:bilmissing (ostrs nmap / orec cnt kp)
  (setq cnt 0)
  (foreach orec ostrs
    (if (not (vl-some (function (lambda (pr) (= (cadr pr) (car orec)))) nmap))
      (progn
        (setq cnt (1+ cnt) kp (sc:kindparts (nth 4 orec)))
        (sc:bil (strcat "brakuje miejsca: " (car orec) "  " (nth 4 orec) " = " (cadr kp)
                        " paneli, " (car kp) " (numer NIE uzyty)")
                (strcat "BRAKUJE;" (nth 4 orec) ";" (car kp) ";" (cadr kp) ";;;;"
                        (sc:csvfld (car orec)) ";;;")))))
  cnt)

;; zapis bilansu do <rysunek>_strbilans.csv -> sciezka albo nil
(defun sc:bilcsv ( / path fh row)
  (setq path (strcat (getvar "DWGPREFIX") (sc:noext (getvar "DWGNAME")) "_strbilans.csv"))
  (if (setq fh (open path "w"))
    (progn
      (write-line "Typ;Rodzaj;Rzad;Panele;Oryginal;Nowy;Roznica;Napis;X;Y;RzadStolow" fh)
      (foreach row (reverse *SC-BILROWS*) (write-line row fh))
      (close fh)
      path)
    nil))

;; nadmiarowe stringi: w kazdym rodzaju te OSTATNIE od strony startu;
;; rodzaj nieobecny w oryginale - caly nadmiarowy (strs z kotwicami)
(defun sc:pickxtra (strs okc nkc / xtra kc on sur lst)
  (foreach kc nkc
    (setq on  (cdr (assoc (car kc) okc))
          sur (- (cdr kc) (if on on 0)))
    (if (> sur 0)
      (progn
        (setq lst (vl-remove-if-not (function (lambda (sx) (= (sc:g sx "KIND") (car kc)))) strs)
              lst (reverse (sc:msort lst (function sc:readless))))
        (repeat sur
          (setq xtra (cons (car lst) xtra) lst (cdr lst))))))
  xtra)

;;; --------------------------------------------------------------------------
;;; Propozycja nowego ustawienia (tylko gdy ulozenie jest NIEMOZLIWE)
;;; --------------------------------------------------------------------------
;;; Stringi nowego obszaru w kolejnosci czytania od strony startu, bez luk,
;;; tyle ile w oryginale; suma paneli = oryginal - gdy sie nie zgadza, stringi
;;; najblizej konca dostaja zmiane +/-1 panel (przestawienie stolow, np.
;;; 12+12 -> 12+13). String rodzaju nieznanego w oryginale, dlugi jak kilka
;;; stringow (np. G50 = jeden napis na dwoch stringach) liczony jako kilka.
;;; Inwertery: liczba stringow z oryginalu, stringi moga przejsc do innego
;;; inwertera (kolejne bloki wg przegladu pasami jak przy ukladaniu).
;;; Wynik: <rysunek>_strpropozycja.csv, rysunek bez zmian.

(defun sc:olen (kd) (atoi (sc:digs kd (1+ (strlen (sc:alpha kd))))))

(defun sc:proposal (alls ostrs oinvs okc hrows / lens p0 n0 l0 ents sx pn nn kk sel rest p1 diff
                       ent out inv need cnt cur path fh k2 pnew pold orec chg invp itm)
  (setq lens (mapcar (function (lambda (orec) (sc:olen (nth 4 orec)))) ostrs)
        p0   (apply (function +) lens)
        n0   (length lens)
        l0   (sc:mode lens))
  ;; wpisy (string panele paneliPo uwaga) w kolejnosci czytania
  (foreach sx (sc:msort (mapcar (function (lambda (sz) (sc:s sz "STRIPE" (/ (sc:g sz "AI") hrows)))) alls)
                        (function sc:readless))
    (setq pn (sc:g sx "PAN"))
    (if (and (null (assoc (sc:g sx "KIND") okc)) (> pn (* 1.5 l0)))
      (progn
        (setq nn (max 1 (fix (+ 0.5 (/ pn (float l0))))) kk 0)
        (repeat nn
          (setq ents (cons (list sx (/ pn nn) (/ pn nn)
                                 (strcat "napis na " (itoa nn) " stringach - rozdziel napisy"))
                           ents)
                kk (1+ kk))))
      (setq ents (cons (list sx pn pn "") ents))))
  (setq ents (reverse ents) kk 0)
  (foreach ent ents
    (if (< kk n0) (setq sel (cons ent sel)) (setq rest (cons ent rest)))
    (setq kk (1+ kk)))
  ;; sel: od konca (najdalej od startu) - tu wyrownanie sumy paneli
  (setq p1 (apply (function +) (mapcar (function cadr) sel)) diff (- p0 p1) out nil)
  (foreach ent sel
    (cond
      ((and (> diff 0) (< (cadr ent) l0))
       (setq ent (list (car ent) (cadr ent) (1+ (cadr ent))
                       (strcat (cadddr ent) (if (= (cadddr ent) "") "" "; ")
                               "+1 panel: przestaw stoly (np. 12+12 -> 12+13)"))
             diff (1- diff)))
      ((and (< diff 0) (>= (cadr ent) l0))
       (setq ent (list (car ent) (cadr ent) (1- (cadr ent))
                       (strcat (cadddr ent) (if (= (cadddr ent) "") "" "; ")
                               "-1 panel: przestaw stoly (np. 12+13 -> 12+12)"))
             diff (1+ diff))))
    (setq out (cons ent out)))
  (setq sel out)   ; znowu w kolejnosci czytania
  ;; inwertery: kolejne bloki wg przegladu pasami
  (setq sel (sc:msort sel (function (lambda (ea eb) (sc:sweepless (car ea) (car eb))))) out nil)
  (foreach inv (mapcar (function car) oinvs)
    (setq need 0 pold 0)
    (foreach orec ostrs
      (if (= (nth 1 orec) inv) (setq need (1+ need) pold (+ pold (sc:olen (nth 4 orec))))))
    (setq cur nil)
    (repeat need (if sel (setq cur (cons (car sel) cur) sel (cdr sel))))
    (setq cur (sc:msort cur (function (lambda (ea eb) (sc:readless (car ea) (car eb))))) k2 0 pnew 0)
    (foreach ent cur
      (setq k2 (1+ k2) pnew (+ pnew (caddr ent))
            out (cons (list inv k2 ent) out)))
    (setq invp (cons (list inv pold pnew need (length cur)) invp)))
  (setq out (reverse out) invp (reverse invp))
  ;; CSV
  (setq path (strcat (getvar "DWGPREFIX") (sc:noext (getvar "DWGNAME")) "_strpropozycja.csv"))
  (if (setq fh (open path "w"))
    (progn
      (write-line "Typ;Inwerter;NowyString;Rzad;PaneliTeraz;PaneliPo;Uwaga;NapisTeraz;X;Y;RzadStolow" fh)
      (foreach itm out
        (setq ent (caddr itm) sx (car ent))
        (write-line (strcat "STRING;" (sc:csvfld (car itm)) ";"
                            (sc:csvfld (strcat (car itm) "-STR" (itoa (cadr itm)))) ";"
                            (sc:g sx "ROW") ";" (itoa (cadr ent)) ";" (itoa (caddr ent)) ";"
                            (sc:csvfld (cadddr ent)) ";" (sc:csvfld (sc:g sx "TEXT")) ";"
                            (sc:num (sc:g sx "CX") 2) ";" (sc:num (sc:g sx "CY") 2) ";"
                            (itoa (1+ (sc:g sx "AI"))))
                    fh))
      (foreach ent (reverse rest)
        (setq sx (car ent))
        (write-line (strcat "ZBEDNY;;;" (sc:g sx "ROW") ";" (itoa (cadr ent)) ";0;"
                            (sc:csvfld "niepodlaczony (koniec obszaru)") ";" (sc:csvfld (sc:g sx "TEXT")) ";"
                            (sc:num (sc:g sx "CX") 2) ";" (sc:num (sc:g sx "CY") 2) ";"
                            (itoa (1+ (sc:g sx "AI"))))
                    fh))
      (foreach itm invp
        (write-line (strcat "SUMA_INW;" (sc:csvfld (car itm)) ";;;" (itoa (cadr itm)) ";" (itoa (caddr itm))
                            ";" (sc:csvfld (strcat "stringow " (itoa (nth 4 itm)) " z " (itoa (nth 3 itm))
                                                   "; paneli oryginal / nowe")) ";;;;")
                    fh))
      (write-line (strcat "SUMA;;;;" (itoa p0) ";" (itoa (- p0 diff)) ";"
                          (sc:csvfld "paneli oryginal / nowe") ";;;;")
                  fh)
      (close fh))
    (setq path nil))
  ;; raport
  (setq chg 0)
  (foreach itm out (if (/= (cadr (caddr itm)) (caddr (caddr itm))) (setq chg (1+ chg))))
  (sc:bil (strcat "PROPOZYCJA nowego ustawienia (od strony startu bez luk, " (itoa n0)
                  " stringow, paneli " (itoa p0) (if (= diff 0) " = oryginal" (strcat ", NIE wyrownano: "
                                                                                    (itoa diff) " paneli"))
                  "): zmian +/-1 panel: " (itoa chg) ", zbednych stringow: " (itoa (length rest))
                  (if path (strcat " -> " path) " (CSV NIE zapisany)"))
          nil)
  (foreach itm out
    (setq ent (caddr itm))
    (if (/= (cadddr ent) "")
      (sc:bil (strcat "  " (car itm) "-STR" (itoa (cadr itm)) ": \"" (sc:g (car ent) "TEXT") "\" "
                      (itoa (cadr ent)) " -> " (itoa (caddr ent)) " paneli, rzad stolow "
                      (itoa (1+ (sc:g (car ent) "AI"))) " - " (cadddr ent))
              nil)))
  (foreach itm invp
    (if (/= (cadr itm) (caddr itm))
      (sc:bil (strcat "  " (car itm) ": paneli w oryginale " (itoa (cadr itm)) ", w propozycji "
                      (itoa (caddr itm)) " (stringi przeszly miedzy inwerterami)")
              nil)))
  path)

(defun sc:asksides ( / ans)
  (initget "Lewa Prawa")
  (setq ans (getkword (strcat "\nNumeracja od strony [Lewa/Prawa] <" *SC-HFROM* ">: ")))
  (if ans (setq *SC-HFROM* ans))
  (initget "Gory Dolu")
  (setq ans (getkword (strcat "\nPierwsze rzedy stolow od [Gory/Dolu] <" *SC-VFROM* ">: ")))
  (if ans (setq *SC-VFROM* ans)))

;; niedrukowalna warstwa na kolka
(defun sc:mklayer (name)
  (if (null (tblsearch "LAYER" name))
    (entmake (list '(0 . "LAYER") '(100 . "AcDbSymbolTableRecord")
                   '(100 . "AcDbLayerTableRecord") (cons 2 name)
                   '(70 . 0) (cons 62 *SC-YELLOW*) '(290 . 0))))
  name)

(defun sc:circle (ptx pty col msg)
  (entmake (list '(0 . "CIRCLE") (cons 8 (sc:mklayer *SC-LAYER*))
                 (cons 62 col) (list 10 ptx pty 0.0) (cons 40 *SC-CIRCR*)))
  ;; opis problemu obok kolka (MTEXT, zawijany; najwyzej 250 znakow)
  (if (and msg (/= msg ""))
    (entmake (list '(0 . "MTEXT") '(100 . "AcDbEntity") (cons 8 *SC-LAYER*) (cons 62 col)
                   '(100 . "AcDbMText")
                   (list 10 (+ ptx *SC-CIRCR* 1.0) (+ pty *SC-CIRCR*) 0.0)
                   (cons 40 *SC-CIRCTXH*) (cons 41 *SC-CIRCTXW*) '(71 . 1)
                   (cons 1 (if (> (strlen msg) 250) (strcat (substr msg 1 247) "...") msg))))))

(defun sc:askcircles ( / ans itm)
  (if *SC-CIRCS*
    (progn
      (initget "Tak Nie")
      (setq ans (getkword (strcat "\nNarysowac kolka w " (itoa (length *SC-CIRCS*))
                                  " miejscach z opisem problemu (CZERWONE = blad, ZOLTE = do sprawdzenia; warstwa "
                                  *SC-LAYER* ")? [Tak/Nie] <Tak>: ")))
      (if (/= ans "Nie")
        (progn
          (foreach itm *SC-CIRCS* (sc:circle (car itm) (cadr itm) (caddr itm) (cadddr itm)))
          (princ (strcat "\nNarysowano kolek: " (itoa (length *SC-CIRCS*))
                         " na warstwie " *SC-LAYER* ".")))))))

;; warstwa zablokowana? (pamiec podreczna *SC-LOCKS*)
(defun sc:locked (lay / key cur rec)
  (setq key (strcase lay))
  (if (setq cur (assoc key *SC-LOCKS*))
    (cdr cur)
    (progn
      (setq rec (tblsearch "LAYER" lay)
            cur (if (and rec (= 4 (logand 4 (cdr (assoc 70 rec))))) T nil))
      (setq *SC-LOCKS* (cons (cons key cur) *SC-LOCKS*))
      cur)))

;; entsel: ename, 'MISS przy pudle, nil przy Enterze
(defun sc:pick (msg / res)
  (vl-catch-all-apply 'setvar (list "ERRNO" 0))
  (setq res (entsel msg))
  (cond (res (car res))
        ((= (getvar "ERRNO") 7) 'MISS)
        (T nil)))

;; obwiednia w planie (xmin ymin xmax ymax) albo nil
(defun sc:bbox (ename / res lop hip)
  (setq lop nil hip nil)
  (setq res (vl-catch-all-apply
              '(lambda ()
                 (vla-getboundingbox (vlax-ename->vla-object ename) 'lop 'hip)
                 T)
              nil))
  (if (or (vl-catch-all-error-p res) (null lop) (null hip))
    nil
    (progn
      (setq lop (vlax-safearray->list lop)
            hip (vlax-safearray->list hip))
      (list (car lop) (cadr lop) (car hip) (cadr hip)))))

;; odleglosc punktu od prostokata (0 w srodku)
(defun sc:bdist (ptx pty box / dxx dyy)
  (setq dxx (max 0.0 (- (car box) ptx) (- ptx (caddr box)))
        dyy (max 0.0 (- (cadr box) pty) (- pty (cadddr box))))
  (sqrt (+ (* dxx dxx) (* dyy dyy))))

(defun sc:pheight (prt) (- (cadddr (sc:g prt "BOX")) (cadr (sc:g prt "BOX"))))

;; prostokat box zachodzi na prostokat obszaru pbox powiekszony o mrg
(defun sc:boxnear (box pbox mrg)
  (and (<= (car box) (+ (caddr pbox) mrg)) (>= (caddr box) (- (car pbox) mrg))
       (<= (cadr box) (+ (cadddr pbox) mrg)) (>= (cadddr box) (- (cadr pbox) mrg))))

;; kubelki po X: ((klucz element ...) ...); getbox = funkcja element -> obrys
(defun sc:mkgrid (items getbox / grd itm box kfr kto kdx cur)
  (foreach itm items
    (setq box (apply getbox (list itm))
          kfr (fix (/ (car box) *SC-CELL*))
          kto (fix (/ (caddr box) *SC-CELL*))
          kdx kfr)
    (while (<= kdx kto)
      (if (setq cur (assoc kdx grd))
        (setq grd (subst (cons kdx (cons itm (cdr cur))) cur grd))
        (setq grd (cons (list kdx itm) grd)))
      (setq kdx (1+ kdx))))
  grd)

;; elementy z kubelkow pokrywajacych przedzial X [xa xb], bez powtorzen
(defun sc:gcands (grd xa xb / kdx kto res itm)
  (setq kdx (fix (/ xa *SC-CELL*))
        kto (fix (/ xb *SC-CELL*)))
  (while (<= kdx kto)
    (foreach itm (cdr (assoc kdx grd))
      (if (not (member itm res)) (setq res (cons itm res))))
    (setq kdx (1+ kdx)))
  res)

(defun sc:tbox (tab) (list (nth 0 tab) (nth 1 tab) (nth 2 tab) (nth 3 tab)))
(defun sc:pbox (prt) (sc:g prt "BOX"))

;;; --------------------------------------------------------------------------
;;; Narzedzia tekstowe i CSV
;;; --------------------------------------------------------------------------

(defun sc:trim (txt) (if txt (vl-string-trim " \t" txt) ""))

(defun sc:isdig (chr) (and (= 1 (strlen chr)) (>= chr "0") (<= chr "9")))

(defun sc:isalpha (chr)
  (and (= 1 (strlen chr))
       (or (and (>= chr "A") (<= chr "Z")) (and (>= chr "a") (<= chr "z")))))

;; litery z poczatku tekstu ("ST11" -> "ST")
(defun sc:alpha (txt / idx cnt acc)
  (setq idx 1 cnt (strlen txt) acc "")
  (while (and (<= idx cnt) (sc:isalpha (substr txt idx 1)))
    (setq acc (strcat acc (substr txt idx 1)) idx (1+ idx)))
  acc)

;; cyfry od pozycji idx ("STR05" 4 -> "05")
(defun sc:digs (txt idx / cnt acc)
  (setq cnt (strlen txt) acc "")
  (while (and (<= idx cnt) (sc:isdig (substr txt idx 1)))
    (setq acc (strcat acc (substr txt idx 1)) idx (1+ idx)))
  acc)

(defun sc:split (txt sep / cnt idx acc cur chr)
  (setq cnt (strlen txt) idx 1 acc nil cur "")
  (while (<= idx cnt)
    (setq chr (substr txt idx 1))
    (if (= chr sep)
      (setq acc (cons cur acc) cur "")
      (setq cur (strcat cur chr)))
    (setq idx (1+ idx)))
  (reverse (cons cur acc)))

;; bez spacji, wielkimi literami (klucz napisu nierozpoznanego)
(defun sc:normtxt (txt / idx cnt acc chr)
  (setq idx 1 cnt (strlen txt) acc "")
  (while (<= idx cnt)
    (setq chr (substr txt idx 1))
    (if (not (member chr '(" " "\t"))) (setq acc (strcat acc chr)))
    (setq idx (1+ idx)))
  (strcase acc))

;; MTEXT -> czysty tekst (usuniecie kodow formatujacych)
(defun sc:mtx (txt / cnt idx chr nxt jdx acc)
  (setq cnt (strlen txt) idx 1 acc "")
  (while (<= idx cnt)
    (setq chr (substr txt idx 1))
    (cond
      ((= chr "\\")
       (setq nxt (substr txt (1+ idx) 1))
       (cond
         ((= nxt "P") (setq acc (strcat acc " ") idx (+ idx 2)))
         ((= nxt "~") (setq acc (strcat acc " ") idx (+ idx 2)))
         ((member nxt '("\\" "{" "}"))
          (setq acc (strcat acc nxt) idx (+ idx 2)))
         ((member (strcase nxt) '("L" "O" "K"))
          (setq idx (+ idx 2)))
         ;; kody z parametrem do ";" - takze akapit "p" malym (duze P = nowa linia, wyzej)
         ((member (strcase nxt) '("A" "C" "F" "H" "Q" "T" "W" "S" "N" "P"))
          (setq jdx (1+ idx))
          (while (and (<= jdx cnt) (/= (substr txt jdx 1) ";")) (setq jdx (1+ jdx)))
          (setq idx (1+ jdx)))
         (t (setq idx (+ idx 2)))))
      ((= chr "{") (setq idx (1+ idx)))
      ((= chr "}") (setq idx (1+ idx)))
      (t (setq acc (strcat acc chr) idx (1+ idx)))))
  acc)

;; surowy tekst TEXT/MTEXT (MTEXT podzielony na fragmenty 3 -> nil)
(defun sc:rawtext (el / typ frag pair)
  (setq typ (cdr (assoc 0 el)))
  (cond
    ((= typ "TEXT") (cdr (assoc 1 el)))
    ((= typ "MTEXT")
     (setq frag nil)
     (foreach pair el (if (= 3 (car pair)) (setq frag T)))
     (if frag nil (cdr (assoc 1 el))))
    (t nil)))

;; punkt napisu w WCS (TEXT wyrownany -> 11; TEXT lezy w OCS)
(defun sc:tpoint (en el / typ pt10 pt11 ju1 ju2 pnt)
  (setq typ  (cdr (assoc 0 el))
        pt10 (cdr (assoc 10 el))
        pt11 (cdr (assoc 11 el))
        ju1  (cdr (assoc 72 el))
        ju2  (cdr (assoc 73 el)))
  (setq pnt (if (and (= typ "TEXT") pt11
                     (or (and ju1 (/= 0 ju1)) (and ju2 (/= 0 ju2))))
              pt11
              pt10))
  (if (and pnt (= typ "TEXT")) (trans pnt en 0) pnt))

;; obrys napisu w planie (x1 y1 x2 y2): TEXT z obwiedni; MTEXT z szerokosci
;; rzeczywistej (42), wysokosci (43) i punktu zaczepienia (71) - obwiednia
;; MTEXT bywa szeroka jak cala ramka; MTEXT obrocony albo bez tych grup ->
;; maly kwadrat wokol punktu wstawienia
(defun sc:labbox (en el pnt / typ bb wid hgt att dir ang px py)
  (setq typ (cdr (assoc 0 el))
        wid (cdr (assoc 42 el))
        hgt (cdr (assoc 43 el))
        att (cdr (assoc 71 el))
        dir (cdr (assoc 11 el))
        ang (cdr (assoc 50 el))
        px  (car pnt)
        py  (cadr pnt))
  (cond
    ((and (= typ "TEXT") (setq bb (sc:bbox en))) bb)
    ((and (= typ "MTEXT") wid hgt att (> wid 0.0) (> hgt 0.0)
          (or (null dir) (and (> (car dir) 0.0) (< (abs (cadr dir)) 1e-6)))
          (or (null ang) (< (abs ang) 1e-6)))
     (list (cond ((member att '(1 4 7)) px) ((member att '(2 5 8)) (- px (* 0.5 wid))) (T (- px wid)))
           (cond ((member att '(1 2 3)) (- py hgt)) ((member att '(4 5 6)) (- py (* 0.5 hgt))) (T py))
           (cond ((member att '(1 4 7)) (+ px wid)) ((member att '(2 5 8)) (+ px (* 0.5 wid))) (T px))
           (cond ((member att '(1 2 3)) py) ((member att '(4 5 6)) (+ py (* 0.5 hgt))) (T (+ py hgt)))))
    (T (list (- px 0.05) (- py 0.05) (+ px 0.05) (+ py 0.05)))))

;; liczba z przecinkiem dziesietnym (CSV dla Excela)
(defun sc:num (val prec / txt pos)
  (setq txt (rtos val 2 prec))
  (while (setq pos (vl-string-search "." txt))
    (setq txt (strcat (substr txt 1 pos) "," (substr txt (+ pos 2)))))
  txt)

;; tekst -> liczba (przecinek albo kropka), pusty -> nil
(defun sc:tonum (txt / pos)
  (setq txt (sc:trim txt))
  (while (setq pos (vl-string-search "," txt))
    (setq txt (strcat (substr txt 1 pos) "." (substr txt (+ pos 2)))))
  (if (= txt "") nil (atof txt)))

;; tekst -> liczba calkowita, pusty -> nil
(defun sc:toint (txt)
  (setq txt (sc:trim txt))
  (if (= txt "") nil (atoi txt)))

(defun sc:cstr (val) (if val (itoa val) ""))

(defun sc:csvfld (txt / idx cnt chr acc)
  (if (null txt) (setq txt ""))
  (setq acc "" idx 1 cnt (strlen txt))
  (while (<= idx cnt)
    (setq chr (substr txt idx 1))
    (setq acc (strcat acc (if (= chr "\"") "\"\"" chr)))
    (setq idx (1+ idx)))
  (strcat "\"" acc "\""))

;; podzial wiersza CSV z obsluga cudzyslowow
(defun sc:csvsplit (line sep / idx chr inq cur res)
  (setq idx 1 cur "")
  (while (<= idx (strlen line))
    (setq chr (substr line idx 1) idx (1+ idx))
    (cond
      ((and inq (= chr "\"") (= (substr line idx 1) "\""))
       (setq cur (strcat cur "\"") idx (1+ idx)))
      ((= chr "\"")
       (setq inq (not inq)))
      ((and (not inq) (= chr sep))
       (setq res (cons (sc:trim cur) res) cur ""))
      (T (setq cur (strcat cur chr)))))
  (reverse (cons (sc:trim cur) res)))

;; wszystkie wiersze pliku; konce linii CR, LF albo CRLF (Excel zapisuje
;; czasem samo CR - read-line czytalby wtedy caly plik jako jedna linie)
(defun sc:readlines (fh / code cur res prevcr)
  (setq cur "")
  (while (setq code (read-char fh))
    (cond
      ((= code 13)
       (setq res (cons cur res) cur "" prevcr T))
      ((= code 10)
       (if prevcr
         (setq prevcr nil)
         (setq res (cons cur res) cur "")))
      (T
       (setq cur (strcat cur (chr code)) prevcr nil))))
  (if (/= cur "") (setq res (cons cur res)))
  (reverse res))

(defun sc:noext (fnm / idx dot)
  (setq dot 0 idx 1)
  (while (<= idx (strlen fnm))
    (if (= (substr fnm idx 1) ".") (setq dot idx))
    (setq idx (1+ idx)))
  (if (> dot 0) (substr fnm 1 (1- dot)) fnm))

;;; --------------------------------------------------------------------------
;;; Nazwa stringu: ST11-INV30-STR5
;;; --------------------------------------------------------------------------

;; "ST11-INV30-STR5 (635W)" -> (sttok invtok strtok stnum invn strn stpre)
;;   = ("ST11" "INV30" "STR5" 11 30 5 "ST"). Czlonu stacji moze nie byc
;;   (sttok = nil). Brak czlonu INV albo STR -> nil.
(defun sc:parse (txt / toks tok upr pre dg sttok invtok strtok stnum invn strn stpre)
  (setq toks (sc:split txt "-"))
  (foreach tok toks
    (setq upr (strcase (sc:trim tok))
          pre (sc:alpha upr)
          dg  (sc:digs upr (1+ (strlen pre))))
    (cond
      ((= dg "") nil)
      ((and (= pre "STR") (null strtok))
       (setq strtok (strcat "STR" dg) strn (atoi dg)))
      ((and (= pre "INV") (null invtok))
       (setq invtok (strcat "INV" dg) invn (atoi dg)))
      ((and (> (strlen pre) 0) (null sttok) (null invtok) (null strtok))
       (setq sttok (strcat pre dg) stnum (atoi dg) stpre pre))))
  (if (and invtok strtok)
    (list sttok invtok strtok stnum invn strn stpre)
    nil))

;; nazwa inwertera bez czlonu STR ("ST11-INV27") -> T
(defun sc:invonly (txt / tok upr invf strf)
  (foreach tok (sc:split txt "-")
    (setq upr (strcase (sc:trim tok)))
    (if (and (= "INV" (sc:alpha upr)) (/= "" (sc:digs upr 4))) (setq invf T))
    (if (and (= "STR" (sc:alpha upr)) (/= "" (sc:digs upr 4))) (setq strf T)))
  (and invf (not strf)))

;; klucz stringu "ST11-INV30-STR5" (liczby bez wiodacych zer)
(defun sc:idkey (inf)
  (strcat (if (car inf) (strcat (nth 6 inf) (itoa (nth 3 inf)) "-") "")
          "INV" (itoa (nth 4 inf)) "-STR" (itoa (nth 5 inf))))

;; klucz inwertera "ST11-INV30"
(defun sc:invkey (inf)
  (strcat (if (car inf) (strcat (nth 6 inf) (itoa (nth 3 inf)) "-") "")
          "INV" (itoa (nth 4 inf))))

;; kolejnosc inwerterow / stringow: stacja, INV, STR
(defun sc:infless (ia ib / sa sb)
  (setq sa (if (nth 3 ia) (nth 3 ia) 0) sb (if (nth 3 ib) (nth 3 ib) 0))
  (cond ((< sa sb) T)
        ((> sa sb) nil)
        ((< (nth 4 ia) (nth 4 ib)) T)
        ((> (nth 4 ia) (nth 4 ib)) nil)
        (T (< (nth 5 ia) (nth 5 ib)))))

;; podmiana czlonu w SUROWYM tekscie: pierwsze wystapienie liter pre (bez
;; wzgledu na wielkosc, nie w srodku slowa), po ktorych stoja cyfry -> caly
;; czlon (litery + cyfry) zastapiony przez newtok. Brak czlonu -> nil.
(defun sc:reptok (raw pre newtok / upr cnt plen pos idx found)
  (setq upr (strcase raw) cnt (strlen raw) plen (strlen pre) pos 0 found nil)
  (while (and (not found) (<= (+ pos plen 1) cnt))
    (if (and (= pre (substr upr (1+ pos) plen))
             (sc:isdig (substr upr (+ pos plen 1) 1))
             (or (= pos 0) (not (sc:isalpha (substr upr pos 1)))))
      (setq found T)
      (setq pos (1+ pos))))
  (if (not found)
    nil
    (progn
      (setq idx (+ pos plen 1))
      (while (and (<= idx cnt) (sc:isdig (substr upr idx 1))) (setq idx (1+ idx)))
      (strcat (substr raw 1 pos) newtok (if (<= idx cnt) (substr raw idx) "")))))

;; nowy tekst napisu: w surowym tekscie napisu z nowego obszaru podmieniane
;; sa tylko czlony stacji, INV i STR na czlony nazwy z oryginalu (formatowanie
;; MTEXT i dopiski zostaja). Napis bez tych czlonow -> nazwa z oryginalu.
;; oldinf = sc:parse napisu z nowego obszaru, newtxt = napis z oryginalu
(defun sc:newtext (raw oldinf newtxt / ninf cur)
  (setq ninf (sc:parse newtxt))
  (cond
    ((or (null oldinf) (null ninf)) newtxt)
    ((not (equal (null (car oldinf)) (null (car ninf)))) newtxt)
    (T
     (setq cur raw)
     (if (car ninf) (setq cur (sc:reptok cur (nth 6 oldinf) (car ninf))))
     (if cur (setq cur (sc:reptok cur "INV" (cadr ninf))))
     (if cur (setq cur (sc:reptok cur "STR" (caddr ninf))))
     (if cur cur newtxt))))

;;; --------------------------------------------------------------------------
;;; Obszar = wnetrze wskazanej polilinii
;;; --------------------------------------------------------------------------

;; wierzcholki polilinii jako wielokat (x y) w WCS; segmenty lukowe
;; przyblizane 8 odcinkami. -> lista punktow albo nil
(defun sc:polypts (ename / el typ bul pair endp kdx sub nsub pt acc)
  (setq el  (entget ename)
        typ (cdr (assoc 0 el))
        bul nil)
  (if (= typ "LWPOLYLINE")
    (foreach pair el
      (if (= 42 (car pair)) (setq bul (cons (cdr pair) bul)))))
  (setq bul  (reverse bul)
        endp (vl-catch-all-apply 'vlax-curve-getEndParam (list ename)))
  (if (or (vl-catch-all-error-p endp) (null endp))
    nil
    (progn
      (setq kdx 0 acc nil)
      (while (< kdx (fix (+ endp 0.5)))
        (setq nsub (if (and (= typ "LWPOLYLINE") (nth kdx bul)
                            (equal (nth kdx bul) 0.0 1e-9))
                     1
                     8)
              sub 0)
        (while (< sub nsub)
          (setq pt (vl-catch-all-apply 'vlax-curve-getPointAtParam
                                       (list ename (+ kdx (/ (float sub) nsub)))))
          (if (and pt (not (vl-catch-all-error-p pt)) (listp pt))
            (setq acc (cons (list (car pt) (cadr pt)) acc)))
          (setq sub (1+ sub)))
        (setq kdx (1+ kdx)))
      (setq pt (vl-catch-all-apply 'vlax-curve-getPointAtParam (list ename endp)))
      (if (and pt (not (vl-catch-all-error-p pt)) (listp pt))
        (setq acc (cons (list (car pt) (cadr pt)) acc)))
      (reverse acc))))

;; punkt wewnatrz wielokata (promien w prawo, parzystosc przeciec); tylko XY
(defun sc:inpoly (ptx pty poly / ins prev cur xa ya xb yb)
  (setq ins nil prev (last poly))
  (foreach cur poly
    (setq xa (car cur) ya (cadr cur)
          xb (car prev) yb (cadr prev))
    (if (and (not (eq (> ya pty) (> yb pty)))
             (< ptx (+ xa (/ (* (- xb xa) (- pty ya)) (- yb ya)))))
      (setq ins (not ins)))
    (setq prev cur))
  ins)

;; obrys wielokata -> (minx miny maxx maxy)
(defun sc:polybox (poly / pt bx1 by1 bx2 by2)
  (foreach pt poly
    (if (or (null bx1) (< (car pt) bx1)) (setq bx1 (car pt)))
    (if (or (null bx2) (> (car pt) bx2)) (setq bx2 (car pt)))
    (if (or (null by1) (< (cadr pt) by1)) (setq by1 (cadr pt)))
    (if (or (null by2) (> (cadr pt) by2)) (setq by2 (cadr pt))))
  (list bx1 by1 bx2 by2))

;; punkt w obszarze (najpierw tani test obrysu)
(defun sc:inarea (ptx pty poly pbox)
  (and (>= ptx (car pbox)) (<= ptx (caddr pbox))
       (>= pty (cadr pbox)) (<= pty (cadddr pbox))
       (sc:inpoly ptx pty poly)))

;; punkt blizej niz dd od obrysu pbox
(defun sc:nearbox (ptx pty pbox dd)
  (<= (sc:bdist ptx pty pbox) dd))

;;; --------------------------------------------------------------------------
;;; Wskazania uzytkownika
;;; --------------------------------------------------------------------------

;; polilinia obszaru -> (wielokat obrys) albo nil
(defun sc:askpoly (msg / en el poly)
  (setq en (sc:pick msg))
  (while (eq en 'MISS)
    (princ "\n  Nic nie trafiono - sprobuj jeszcze raz.")
    (setq en (sc:pick msg)))
  (cond
    ((null en) nil)
    ((not (member (cdr (assoc 0 (setq el (entget en)))) '("LWPOLYLINE" "POLYLINE")))
     (princ (strcat "\n  To nie jest polilinia, tylko " (cdr (assoc 0 el)) "."))
     nil)
    (T
     (setq poly (sc:polypts en))
     (cond
       ((or (null poly) (< (length poly) 3))
        (princ "\n  Polilinia ma za malo wierzcholkow.")
        nil)
       (T
        (if (/= 1 (logand 1 (cdr (assoc 70 el))))
          (princ "\n  Polilinia jest OTWARTA - domykam ja odcinkiem ostatni-pierwszy wierzcholek."))
        (list poly (sc:polybox poly)))))))

;; przykladowy napis -> warstwa napisow (STRCASE) albo nil
(defun sc:asklab (msg / en done)
  (while (not done)
    (setq en (sc:pick msg))
    (cond
      ((null en) (setq done T))
      ((eq en 'MISS) (princ "\n  Nic nie trafiono - sprobuj jeszcze raz."))
      ((not (member (cdr (assoc 0 (entget en))) '("TEXT" "MTEXT")))
       (princ "\n  To nie jest napis (TEXT / MTEXT) - wskaz napis stringu."))
      (T (setq done T))))
  (if en
    (progn
      (princ (strcat "\n  Warstwa napisow: \"" (cdr (assoc 8 (entget en))) "\""))
      (strcase (cdr (assoc 8 (entget en)))))
    nil))

;; bloki stolow -> lista warstw (STRCASE); stolem jest KAZDY blok na tych
;; warstwach (zasada uzytkownika - nie po nazwie bloku)
(defun sc:asktabs ( / done lays en el)
  (while (not done)
    (setq en (sc:pick (if lays
                        "\nWskaz blok stolu z KOLEJNEJ warstwy <Enter = dalej>: "
                        "\nWskaz blok stolu (wyznacza warstwe stolow): ")))
    (cond
      ((null en) (setq done T))
      ((eq en 'MISS) (princ "\n  Nic nie trafiono - sprobuj jeszcze raz."))
      ((/= (cdr (assoc 0 (setq el (entget en)))) "INSERT")
       (princ (strcat "\n  To nie jest blok, tylko " (cdr (assoc 0 el))
                      " - wskaz blok stolu.")))
      ((member (strcase (cdr (assoc 8 el))) lays)
       (princ (strcat "\n  Warstwa juz na liscie: \"" (cdr (assoc 8 el)) "\"")))
      (T
       (setq lays (cons (strcase (cdr (assoc 8 el))) lays))
       (princ (strcat "\n  + warstwa stolow: \"" (cdr (assoc 8 el)) "\"")))))
  lays)

;;; --------------------------------------------------------------------------
;;; Stoly: panele z bryl 3D definicji bloku (jak KRESKSTOL)
;;; --------------------------------------------------------------------------
;;; Obwiednia CALEGO bloku nie nadaje sie na krawedz stolu: w blokach PVcase
;;; sa kola palowania (czesc na zamrozonej warstwie) wystajace za panele.

;; obwiednia obiektu vla -> (xmin ymin zmin xmax ymax zmax) albo nil
(defun sc:vbox3 (obj / res lop hip)
  (setq lop nil hip nil)
  (setq res (vl-catch-all-apply 'vla-getboundingbox (list obj 'lop 'hip)))
  (if (or (vl-catch-all-error-p res) (null lop) (null hip))
    nil
    (append (vlax-safearray->list lop) (vlax-safearray->list hip))))

;; punkt w ukladzie bloku -> WCS (punkt bazowy, skala, obrot, normalna)
(defun sc:b2w (en ins bp sx sy sz ca sa pt / lx ly lz)
  (setq lx (* sx (- (car pt) (car bp)))
        ly (* sy (- (cadr pt) (cadr bp)))
        lz (* sz (- (caddr pt) (caddr bp))))
  (trans (list (+ (car ins) (- (* lx ca) (* ly sa)))
               (+ (cadr ins) (+ (* lx sa) (* ly ca)))
               (+ (caddr ins) lz))
         en 0))

;; przeksztalcenie wstawienia bloku jako 3 wiersze (a b c d):
;; X_wcs = a*x + b*y + c*z + d (i tak samo Y, Z)
(defun sc:xcoef (en el / rec bp sx sy sz ang ca sa ins org pex pey pez)
  (setq rec (tblsearch "BLOCK" (cdr (assoc 2 el)))
        bp  (if (and rec (assoc 10 rec)) (cdr (assoc 10 rec)) '(0.0 0.0 0.0))
        sx  (if (assoc 41 el) (cdr (assoc 41 el)) 1.0)
        sy  (if (assoc 42 el) (cdr (assoc 42 el)) 1.0)
        sz  (if (assoc 43 el) (cdr (assoc 43 el)) 1.0)
        ang (if (assoc 50 el) (cdr (assoc 50 el)) 0.0)
        ins (cdr (assoc 10 el))
        ca  (cos ang)
        sa  (sin ang))
  (if (null (caddr bp)) (setq bp (list (car bp) (cadr bp) 0.0)))
  (if (null (caddr ins)) (setq ins (list (car ins) (cadr ins) 0.0)))
  (setq org (sc:b2w en ins bp sx sy sz ca sa '(0.0 0.0 0.0))
        pex (sc:b2w en ins bp sx sy sz ca sa '(1.0 0.0 0.0))
        pey (sc:b2w en ins bp sx sy sz ca sa '(0.0 1.0 0.0))
        pez (sc:b2w en ins bp sx sy sz ca sa '(0.0 0.0 1.0)))
  (mapcar (function (lambda (kx)
                      (list (- (nth kx pex) (nth kx org)) (- (nth kx pey) (nth kx org))
                            (- (nth kx pez) (nth kx org)) (nth kx org))))
          '(0 1 2)))

;; obwiednia (x1 y1 z1 x2 y2 z2) po przeksztalceniu cf
(defun sc:xbox (cf box / row lo hi los his)
  (foreach row cf
    (setq lo (+ (nth 3 row)
                (min (* (nth 0 row) (nth 0 box)) (* (nth 0 row) (nth 3 box)))
                (min (* (nth 1 row) (nth 1 box)) (* (nth 1 row) (nth 4 box)))
                (min (* (nth 2 row) (nth 2 box)) (* (nth 2 row) (nth 5 box))))
          hi (+ (nth 3 row)
                (max (* (nth 0 row) (nth 0 box)) (* (nth 0 row) (nth 3 box)))
                (max (* (nth 1 row) (nth 1 box)) (* (nth 1 row) (nth 4 box)))
                (max (* (nth 2 row) (nth 2 box)) (* (nth 2 row) (nth 5 box))))
          los (cons lo los)
          his (cons hi his)))
  (append (reverse los) (reverse his)))

;; obwiednie bryl 3D definicji bloku w ukladzie bloku (pamiec *SC-BLKBOX*);
;; bloki zagniezdzone do 4 poziomow. Brak bryl -> nil.
(defun sc:blkboxes (bname depth / key cur blk res obj box sub cf out)
  (setq key (strcase bname))
  (if (setq cur (assoc key *SC-BLKBOX*))
    (cdr cur)
    (progn
      (setq blk (vl-catch-all-apply 'vla-item
                  (list (vla-get-blocks (vla-get-activedocument (vlax-get-acad-object))) bname)))
      (if (not (vl-catch-all-error-p blk))
        (vlax-for obj blk
          (cond
            ((= (vla-get-objectname obj) "AcDb3dSolid")
             (if (setq box (sc:vbox3 obj)) (setq out (cons box out))))
            ((and (< depth 4) (= (vla-get-objectname obj) "AcDbBlockReference"))
             (setq sub (sc:blkboxes (vla-get-name obj) (1+ depth)))
             (if sub
               (progn
                 (setq res (vlax-vla-object->ename obj)
                       cf  (sc:xcoef res (entget res)))
                 (foreach box sub (setq out (cons (sc:xbox cf box) out)))))))))
      (setq *SC-BLKBOX* (cons (cons key out) *SC-BLKBOX*))
      out)))

;; nazwa bloku do raportu (blok dynamiczny -> nazwa wlasciwa)
(defun sc:blkname (en el / nm res)
  (setq nm (cdr (assoc 2 el)))
  (if (wcmatch nm "`**")
    (progn
      (setq res (vl-catch-all-apply 'vla-get-effectivename
                  (list (vlax-ename->vla-object en))))
      (if (= (type res) 'STR) (setq nm res))))
  nm)

;; obwiednie bryl stolu w WCS -> wiersze paneli od gory:
;; ((ylo yhi yc (xc ...) xlo xhi) ...) albo nil. Bryly o wymiarach w planie
;; odbiegajacych od mediany o wiecej niz *SC-SOLTOL* nie sa panelami.
(defun sc:panrows (wbs / mdx mdy pans wb ddx ddy srt rows cur prv pan res xs)
  (setq mdx (sc:median (mapcar (function (lambda (bx) (- (nth 3 bx) (nth 0 bx)))) wbs))
        mdy (sc:median (mapcar (function (lambda (bx) (- (nth 4 bx) (nth 1 bx)))) wbs)))
  (if (and mdx mdy (> mdx 0.0) (> mdy 0.0))
    (progn
      (foreach wb wbs
        (setq ddx (- (nth 3 wb) (nth 0 wb)) ddy (- (nth 4 wb) (nth 1 wb)))
        (if (and (<= (abs (- ddx mdx)) (* *SC-SOLTOL* mdx))
                 (<= (abs (- ddy mdy)) (* *SC-SOLTOL* mdy)))
          ;; panel = (xc yc x1 y1 x2 y2)
          (setq pans (cons (list (* 0.5 (+ (nth 0 wb) (nth 3 wb)))
                                 (* 0.5 (+ (nth 1 wb) (nth 4 wb)))
                                 (nth 0 wb) (nth 1 wb) (nth 3 wb) (nth 4 wb))
                           pans))))
      ;; od gory (yc malejaco); nowy wiersz przy skoku > pol wysokosci panelu
      (setq srt (sc:msort pans (function (lambda (pa pb) (> (cadr pa) (cadr pb))))))
      (foreach pan srt
        (if (and cur (> (- prv (cadr pan)) (* 0.5 mdy)))
          (setq rows (cons cur rows) cur nil))
        (setq cur (cons pan cur) prv (cadr pan)))
      (if cur (setq rows (cons cur rows)))
      (foreach cur (reverse rows)
        (setq xs (sc:msort (mapcar (function car) cur) (function <)))
        (setq res (cons (list (apply (function min) (mapcar (function (lambda (pq) (nth 3 pq))) cur))
                              (apply (function max) (mapcar (function (lambda (pq) (nth 5 pq))) cur))
                              (/ (apply (function +) (mapcar (function cadr) cur))
                                 (float (length cur)))
                              xs
                              (apply (function min) (mapcar (function (lambda (pq) (nth 2 pq))) cur))
                              (apply (function max) (mapcar (function (lambda (pq) (nth 4 pq))) cur)))
                        res)))
      (reverse res))))

;; stol -> (x1 y1 x2 y2 ename rows solidp npr bid uchwyt) albo nil
;;   rows   = wiersze paneli od gory (sc:panrows); npr = paneli w wierszu
;;   solidp = T (panele z bryl) / nil (blok bez bryl: obrys = obwiednia
;;            bloku, rows = nil do czasu sc:fallrows)
(defun sc:tabrec (en el / boxes cf wbs rows row bb npr)
  (if (setq boxes (sc:blkboxes (cdr (assoc 2 el)) 0))
    (setq cf   (sc:xcoef en el)
          wbs  (mapcar (function (lambda (bx) (sc:xbox cf bx))) boxes)
          rows (sc:panrows wbs)))
  (cond
    (rows
     (setq npr 0)
     (foreach row rows (setq npr (max npr (length (nth 3 row)))))
     (list (apply (function min) (mapcar (function (lambda (rw) (nth 4 rw))) rows))
           (apply (function min) (mapcar (function car) rows))
           (apply (function max) (mapcar (function (lambda (rw) (nth 5 rw))) rows))
           (apply (function max) (mapcar (function cadr) rows))
           en rows T npr nil (cdr (assoc 5 el))))
    ((setq bb (sc:bbox en))
     (list (car bb) (cadr bb) (caddr bb) (cadddr bb) en nil nil 0 nil (cdr (assoc 5 el))))
    (T nil)))

;; stol bez bryl: 2 wiersze (gorna i dolna polowa obrysu), srodki paneli
;; rozlozone rowno, n = zaokraglenie((dlugosc + przerwa) / szerokosc)
(defun sc:fallrows (tb wid / x1 y1 x2 y2 len nn kk xs ym)
  (setq x1 (car tb) y1 (cadr tb) x2 (caddr tb) y2 (cadddr tb)
        len (- x2 x1)
        nn (max 1 (fix (+ 0.5 (/ (+ len *SC-GAP*) wid))))
        ym (* 0.5 (+ y1 y2))
        kk 0)
  (repeat nn
    (setq xs (cons (+ x1 (* (+ kk 0.5) (/ len nn))) xs) kk (1+ kk)))
  (setq xs (reverse xs))
  (list x1 y1 x2 y2 (nth 4 tb)
        (list (list ym y2 (* 0.5 (+ ym y2)) xs x1 x2)
              (list y1 ym (* 0.5 (+ y1 ym)) xs x1 x2))
        nil nn (nth 8 tb) (nth 9 tb)))

;; licznik nazw blokow: ((nazwa liczba paneliWRzedzie wierszy) ...)
(defun sc:bump (alst nm tb / cur)
  (if (setq cur (assoc nm alst))
    (subst (list nm (1+ (cadr cur)) (caddr cur) (cadddr cur)) cur alst)
    (cons (list nm 1 (nth 7 tb) (length (nth 5 tb))) alst)))

;; pasma (rzedy stolow): stol dolacza do pasma, gdy zakresy Y pokrywaja sie
;; w > 50 % mniejszej wysokosci -> (stoly-z-bid pasma); pasmo = (bid ylo yhi)
(defun sc:bands (tabs / srt bands tb bd hit ovl hgt nid out ymap)
  (setq srt (sc:msort tabs (function (lambda (ta tc) (< (+ (cadr ta) (cadddr ta))
                                                          (+ (cadr tc) (cadddr tc))))))
        nid 0)
  (foreach tb srt
    (setq hit nil)
    (foreach bd bands
      (if (not hit)
        (progn
          (setq ovl (- (min (caddr bd) (cadddr tb)) (max (cadr bd) (cadr tb)))
                hgt (min (- (caddr bd) (cadr bd)) (- (cadddr tb) (cadr tb))))
          (if (> ovl (* 0.5 hgt)) (setq hit bd)))))
    (if hit
      (setq bands (subst (list (car hit) (min (cadr hit) (cadr tb)) (max (caddr hit) (cadddr tb)))
                         hit bands)
            ymap  (cons (cons (nth 4 tb) (car hit)) ymap))
      (setq bands (cons (list nid (cadr tb) (cadddr tb)) bands)
            ymap  (cons (cons (nth 4 tb) nid) ymap)
            nid   (1+ nid))))
  (foreach tb tabs
    (setq out (cons (sc:setnth tb 8 (cdr (assoc (nth 4 tb) ymap))) out)))
  (list (reverse out) (reverse bands)))

(defun sc:bmid (bd) (* 0.5 (+ (cadr bd) (caddr bd))))

;; nazwa rzedu stolu z numeru wiersza paneli (1 = gorny)
(defun sc:rowname (ridx nrows)
  (cond ((or (= ridx 1) (= nrows 1)) "G")
        ((= ridx nrows) "D")
        ((and (= nrows 3) (= ridx 2)) "S")
        (T (strcat "R" (itoa ridx)))))

(defun sc:nearrow (rows yy / kk best bestd dd row)
  (setq kk 1)
  (foreach row rows
    (setq dd (abs (- (caddr row) yy)))
    (if (or (null bestd) (< dd bestd)) (setq bestd dd best kk))
    (setq kk (1+ kk)))
  best)

;;; --------------------------------------------------------------------------
;;; Kreskowania: petle granic z DXF (jak KRESKSTOL), kolor
;;; --------------------------------------------------------------------------
;;; (sc:loops el) -> (nil petle) albo (powod nil); petla = (ok pkt odc),
;;; pkt = ((idx x y) ...) w OCS kreskowania.

(defun sc:code (cur) (if cur (caar cur) -1))

(defun sc:codesp (cur codes / ok cd)
  (setq ok T)
  (foreach cd codes
    (if (and ok (= (sc:code cur) cd))
      (setq cur (cdr cur))
      (setq ok nil)))
  ok)

(defun sc:drop (lst cnt)
  (repeat cnt (setq lst (cdr lst)))
  lst)

(defun sc:loops (el / cur idx nlp lpn err flg ok pts segs nvx nedg kk
                      pr pr0 pr2 etyp nsrc res)
  (setq cur el idx 0)
  (while (and cur (/= (sc:code cur) 91))
    (setq cur (cdr cur) idx (1+ idx)))
  (if (null cur)
    (setq err "brak grupy 91")
    (setq nlp (cdar cur) cur (cdr cur) idx (1+ idx) lpn 0))
  (while (and (null err) (< lpn nlp))
    (if (/= (sc:code cur) 92)
      (setq err "brak grupy 92")
      (progn
        (setq flg (cdar cur) cur (cdr cur) idx (1+ idx)
              ok T pts nil segs nil)
        (if (= 2 (logand flg 2))
          (progn
            (while (member (sc:code cur) '(72 73))
              (setq cur (cdr cur) idx (1+ idx)))
            (if (/= (sc:code cur) 93)
              (setq err "brak grupy 93")
              (progn
                (setq nvx (cdar cur) cur (cdr cur) idx (1+ idx) kk 0)
                (while (and (null err) (< kk nvx))
                  (if (/= (sc:code cur) 10)
                    (setq err "brak wierzcholka 10")
                    (progn
                      (setq pr  (car cur)
                            pts (cons (list idx (cadr pr) (caddr pr)) pts)
                            cur (cdr cur)
                            idx (1+ idx))
                      (if (= (sc:code cur) 42)
                        (progn
                          (if (> (abs (cdar cur)) 1e-9) (setq ok nil))
                          (setq cur (cdr cur) idx (1+ idx))))))
                  (setq kk (1+ kk)))
                (setq pts (reverse pts))
                (if (cdr pts)
                  (progn
                    (setq pr0 (car pts) pr pr0)
                    (foreach pr2 (cdr pts)
                      (setq segs (cons (list (car pr) (car pr2)) segs)
                            pr   pr2))
                    (setq segs (cons (list (car pr) (car pr0)) segs)))))))
          (if (/= (sc:code cur) 93)
            (setq err "brak grupy 93")
            (progn
              (setq nedg (cdar cur) cur (cdr cur) idx (1+ idx) kk 0)
              (while (and (null err) (< kk nedg))
                (if (/= (sc:code cur) 72)
                  (setq err "brak typu krawedzi 72")
                  (progn
                    (setq etyp (cdar cur) cur (cdr cur) idx (1+ idx))
                    (cond
                      ((= etyp 1)
                       (if (sc:codesp cur '(10 11))
                         (setq pr   (car cur)
                               pr2  (cadr cur)
                               pts  (cons (list (1+ idx) (cadr pr2) (caddr pr2))
                                          (cons (list idx (cadr pr) (caddr pr)) pts))
                               segs (cons (list idx (1+ idx)) segs)
                               cur  (cddr cur)
                               idx  (+ idx 2))
                         (setq err "odcinek bez grup 10/11")))
                      ((= etyp 2)
                       (if (sc:codesp cur '(10 40 50 51 73))
                         (setq ok nil cur (sc:drop cur 5) idx (+ idx 5))
                         (setq err "luk o nieznanej budowie")))
                      ((= etyp 3)
                       (if (sc:codesp cur '(10 11 40 50 51 73))
                         (setq ok nil cur (sc:drop cur 6) idx (+ idx 6))
                         (setq err "elipsa o nieznanej budowie")))
                      (T (setq err "splajn w granicy")))))
                (setq kk (1+ kk)))
              (setq pts (reverse pts)))))
        (if (and (null err) (= (sc:code cur) 97))
          (progn
            (setq nsrc (cdar cur) cur (cdr cur) idx (1+ idx))
            (repeat nsrc
              (if (= (sc:code cur) 330)
                (setq cur (cdr cur) idx (1+ idx))
                (setq err "brak grupy 330")))))
        (setq res (cons (list ok pts segs flg) res))))
    (setq lpn (1+ lpn)))
  (if err (list err nil) (list nil (reverse res))))

;; obrysy petli jednego kreskowania bez wysp: petla lezaca wewnatrz innej
;; petli tego samego kreskowania (np. wyspa wokol tekstu przy kreskowaniu
;; przez wskazanie punktu) nie jest czescia stringu; z identycznych zostaje
;; pierwsza. boxes = ((indeks obrys) ...)
(defun sc:outer (boxes / out itm oth inside ba bb)
  (foreach itm boxes
    (setq inside nil ba (cadr itm))
    (foreach oth boxes
      (setq bb (cadr oth))
      (if (and (not inside) (/= (car oth) (car itm))
               (>= (car ba) (- (car bb) 0.01)) (>= (cadr ba) (- (cadr bb) 0.01))
               (<= (caddr ba) (+ (caddr bb) 0.01)) (<= (cadddr ba) (+ (cadddr bb) 0.01))
               ;; identyczne obrysy: zostaje ta o mniejszym indeksie
               (or (< (car oth) (car itm))
                   (> (- (sc:boxw bb) (sc:boxw ba)) 0.02)
                   (> (- (- (cadddr bb) (cadr bb)) (- (cadddr ba) (cadr ba))) 0.02)))
        (setq inside T)))
    (if (not inside) (setq out (cons itm out))))
  (reverse out))

(defun sc:boxw (box) (- (caddr box) (car box)))

;; znak osi X ukladu OCS kreskowania: normalna +Z -> 1.0, -Z -> -1.0,
;; inna (kreskowanie nachylone) -> nil
(defun sc:sgn (el / ext)
  (setq ext (cdr (assoc 210 el)))
  (cond ((null ext) 1.0)
        ((and (< (abs (car ext)) 1e-6) (< (abs (cadr ext)) 1e-6))
         (if (> (caddr ext) 0.0) 1.0 -1.0))
        (T nil)))

;; zakres petli w WCS: (x1 y1 x2 y2) albo nil
(defun sc:lbox (lp sg / pt xw bx1 by1 bx2 by2)
  (foreach pt (cadr lp)
    (setq xw (* sg (cadr pt)))
    (if (or (null bx1) (< xw bx1)) (setq bx1 xw))
    (if (or (null bx2) (> xw bx2)) (setq bx2 xw))
    (if (or (null by1) (< (caddr pt) by1)) (setq by1 (caddr pt)))
    (if (or (null by2) (> (caddr pt) by2)) (setq by2 (caddr pt))))
  (if bx1 (list bx1 by1 bx2 by2)))

;; szybki test kreskowania bez ActiveX: czy ktorys wierzcholek granicy
;; (grupy 10 po pierwszej = punkt elewacji) lezy przy obszarze.
;; Brak wierzcholkow -> T.
(defun sc:hatchnear (el sg pbox mrg / pair skip1 hit any xw)
  (setq skip1 T hit nil any nil)
  (foreach pair el
    (if (and (= 10 (car pair)) (not hit))
      (if skip1
        (setq skip1 nil)
        (progn
          (setq any T xw (* sg (cadr pair)))
          (if (and (>= xw (- (car pbox) mrg)) (<= xw (+ (caddr pbox) mrg))
                   (>= (caddr pair) (- (cadr pbox) mrg)) (<= (caddr pair) (+ (cadddr pbox) mrg)))
            (setq hit T))))))
  (if any hit T))

;; klucz koloru: true color (420) > jawny (62) > wg warstwy
(defun sc:colkey (el / val)
  (cond ((setq val (cdr (assoc 420 el))) (strcat "T" (itoa val)))
        ((and (setq val (cdr (assoc 62 el))) (/= val 256) (/= val 0))
         (strcat "C" (itoa val)))
        (T (strcat "L" (strcase (cdr (assoc 8 el)))))))

;; kolor warstwy jako kolor jawny (62 420 nil)
(defun sc:laycol (lay / rec c62 obj c420)
  (setq rec (tblsearch "LAYER" lay)
        c62 (if (and rec (cdr (assoc 62 rec))) (abs (cdr (assoc 62 rec))) 7))
  (setq obj (vl-catch-all-apply 'tblobjname (list "LAYER" lay)))
  (if (and obj (not (vl-catch-all-error-p obj)))
    (setq c420 (cdr (assoc 420 (entget obj)))))
  (list c62 c420 nil))

;; kolor kreskowania do zapisu: (62 420 430); true color (420) ma pierwszenstwo
;; (jak w sc:colkey); wg warstwy / bloku -> kolor warstwy
(defun sc:colspec (el / c62 c420)
  (setq c62 (cdr (assoc 62 el)) c420 (cdr (assoc 420 el)))
  (cond
    (c420 (list (if (and c62 (/= c62 256) (/= c62 0)) c62 nil) c420 (cdr (assoc 430 el))))
    ((or (null c62) (= c62 256) (= c62 0)) (sc:laycol (cdr (assoc 8 el))))
    (T (list c62 nil nil))))

(defun sc:colname (spec / val)
  (cond
    ((null spec) "brak")
    ((cadr spec)
     (setq val (cadr spec))
     (strcat "RGB " (itoa (logand (lsh val -16) 255)) ","
             (itoa (logand (lsh val -8) 255)) "," (itoa (logand val 255))))
    (T (strcat "kolor " (itoa (car spec))))))

;; lista DXF z nowym kolorem: stare 62/420/430 z naglowka encji usuniete,
;; nowe wstawione zaraz po warstwie (8)
(defun sc:setcolor (el spec / out pr inhdr)
  (setq inhdr T)
  (foreach pr el
    (cond
      ((and inhdr (= (car pr) 100) (/= (cdr pr) "AcDbEntity"))
       (setq inhdr nil out (cons pr out)))
      ((and inhdr (member (car pr) '(62 420 430))) nil)
      ((and inhdr (= (car pr) 8))
       (setq out (cons pr out))
       (if (car spec) (setq out (cons (cons 62 (car spec)) out)))
       (if (cadr spec) (setq out (cons (cons 420 (cadr spec)) out)))
       (if (caddr spec) (setq out (cons (cons 430 (caddr spec)) out))))
      (T (setq out (cons pr out)))))
  (reverse out))

;; kolor encji zgodny z planem? Przy true color porownywany tylko 420 (62 to
;; przyblizenie, ktore CAD liczy sam); przy kolorze ACI - 62 i brak 420
(defun sc:colok (el spec)
  (if (cadr spec)
    (equal (cdr (assoc 420 el)) (cadr spec))
    (and (equal (cdr (assoc 62 el)) (car spec)) (null (cdr (assoc 420 el))))))

;;; --------------------------------------------------------------------------
;;; Odczyt obszaru - wspolny dla STRCOPY i STRPASTE
;;; --------------------------------------------------------------------------
;;; Rekordy:
;;;   napis  = (ename surowy czysty x y klucz sc:parse)
;;;   czesc  = pary "PID" "HEN" "BOX" "CX" "CY" "HLAY" "LIDX", po pomiarze
;;;            "PAN" "RIDX" "NROWS" "BID" "TABS" "PERR" "LABS", potem "KEY"
;;;   string = pary "KEY" "PARTS" "LABS" "ROW" "RIDX" "PAN" "KIND" "CX" "CY"
;;;            "HATS" "BIDS" "TABS" "TEXT" "IDENT"

;; pomiar czesci na stolach -> (panele ridx nrows bid (uchwyty stolow) blad
;; (id paneli)). Panele = panele wiersza pod srodkiem czesci, ktorych SRODEK
;; lezy w zakresie X czesci (kreskowanie wystajace za stol albo krotsze o
;; mniej niz pol panelu daje dokladna liczbe). id panelu = "uchwyt:wiersz:nr" -
;; string liczy panele bez powtorzen (kreskowania na sobie nie dubluja).
(defun sc:measure (prt tgrid / box px1 py1 px2 py2 cy tb rows row ridx kk cnt pan
                       both ri rn bid hdl err xc ids kx)
  (setq box (sc:g prt "BOX")
        px1 (car box) py1 (cadr box) px2 (caddr box) py2 (cadddr box)
        cy  (sc:g prt "CY")
        pan 0)
  (foreach tb (sc:gcands tgrid px1 px2)
    (if (and (< (car tb) px2) (> (caddr tb) px1)
             (<= (cadr tb) cy) (>= (cadddr tb) cy) (nth 5 tb))
      (progn
        (setq rows (nth 5 tb) kk 1 ridx nil both 0)
        (foreach row rows
          (if (and (null ridx) (<= (car row) cy) (>= (cadr row) cy)) (setq ridx kk))
          (if (and (> (caddr row) py1) (< (caddr row) py2)) (setq both (1+ both)))
          (setq kk (1+ kk)))
        (if (null ridx) (setq ridx (sc:nearrow rows cy)))
        (setq cnt 0 kx 0)
        (foreach xc (nth 3 (nth (1- ridx) rows))
          (if (and (>= xc px1) (<= xc px2))
            (setq cnt (1+ cnt)
                  ids (cons (strcat (if (nth 9 tb) (nth 9 tb) "?") ":" (itoa ridx) ":" (itoa kx))
                            ids)))
          (setq kx (1+ kx)))
        (cond
          ((> both 1)
           (setq err "kreskowanie obejmuje oba rzedy paneli stolu"))
          ((and (> cnt 0) ri (/= (sc:rowname ri rn) (sc:rowname ridx (length rows))))
           (setq err "kreskowanie lezy na stolach w roznych rzedach paneli")))
        (if (> cnt 0)
          (setq pan (+ pan cnt) ri ridx rn (length rows) bid (nth 8 tb)
                hdl (cons (nth 9 tb) hdl))))))
  (if (and (null err) (null ri))
    (setq err "kreskowanie nie przykrywa paneli zadnego stolu"))
  (list pan ri rn bid (sc:msort hdl (function sc:strless)) err ids))

;; unikalne klucze napisow
(defun sc:ukeys (labs / out lab)
  (foreach lab labs (if (not (member (nth 5 lab) out)) (setq out (cons (nth 5 lab) out))))
  (reverse out))

;; string z czesci o jednym kluczu -> rekord albo nil (blad do raportu)
(defun sc:mkstring (key sparts labs / slabs lab prt rn rns pan wsum cx cy hats bids ths thd
                        err ex ey txt inf ridx pids pk)
  (foreach lab labs (if (= (nth 5 lab) key) (setq slabs (cons lab slabs))))
  (setq slabs (reverse slabs)
        txt   (if slabs (nth 2 (car slabs)) key)
        inf   (if slabs (nth 6 (car slabs)) nil)
        pan 0 wsum 0.0 cx 0.0 cy 0.0)
  (foreach prt sparts
    (if (sc:g prt "PERR")
      (setq err (sc:g prt "PERR") ex (sc:g prt "CX") ey (sc:g prt "CY"))
      (progn
        (setq rn (sc:rowname (sc:g prt "RIDX") (sc:g prt "NROWS")))
        (if (not (member rn rns)) (setq rns (cons rn rns)))
        (if (null ridx) (setq ridx (sc:g prt "RIDX")))
        (foreach pk (sc:g prt "PIDS") (if (not (member pk pids)) (setq pids (cons pk pids))))
        (setq cx   (+ cx (* (sc:g prt "PAN") (sc:g prt "CX")))
              cy   (+ cy (* (sc:g prt "PAN") (sc:g prt "CY")))
              wsum (+ wsum (sc:g prt "PAN")))
        (if (not (member (sc:g prt "HEN") hats)) (setq hats (cons (sc:g prt "HEN") hats)))
        (if (not (member (sc:g prt "BID") bids)) (setq bids (cons (sc:g prt "BID") bids)))
        (foreach thd (sc:g prt "TABS") (if (not (member thd ths)) (setq ths (cons thd ths)))))))
  ;; panele bez powtorzen (petle / kreskowania na sobie nie dubluja liczby)
  (setq pan (length pids))
  (cond
    (err
     (sc:err (strcat "\"" txt "\": " err " - string pominiety") ex ey)
     nil)
    ((> (length rns) 1)
     (sc:err (strcat "\"" txt "\": czesci stringu w roznych rzedach stolu ("
                     (sc:join (reverse rns) " i ") ") - string musi lezec na jednej wysokosci")
             (/ cx wsum) (/ cy wsum))
     nil)
    (T
     (list (cons "KEY" key) (cons "PARTS" sparts) (cons "LABS" slabs)
           (cons "ROW" (car rns)) (cons "RIDX" ridx) (cons "PAN" pan)
           (cons "KIND" (strcat (car rns) (itoa pan)))
           (cons "CX" (/ cx wsum)) (cons "CY" (/ cy wsum))
           (cons "HATS" (reverse hats)) (cons "BIDS" bids)
           (cons "TABS" (sc:msort ths (function sc:strless)))
           (cons "TEXT" txt) (cons "IDENT" inf)))))

;; -> lista par: ("STRS" string ...) ("BANDS" pasmo ...) ("NTAB" . n)
;;    ("OUTL" (ename czysty x y klucz) ...)  napisy spoza obszaru do *SC-NEAR*
;;    ("WIDTH" . szerokosc panelu dla stolow bez bryl albo nil)
;; strict = T (STRCOPY): napis musi byc nazwa stringu; kreskowanie bez napisu
;;          jest pomijane (do sprawdzenia)
;; strict = nil (STRPASTE): napis dowolny (tylko laczy kreskowania w string),
;;          kreskowanie bez napisu = BLAD
(defun sc:readarea (poly pbox lablay tlays strict wdef / ss idx en el tb tabs nlay nfall
                      wid names res bands tgrid labs outl raw cln pnt inf key nlong
                      parts pid sg prs lp lb li nbad ntilt ptx pty pgrid best bestd
                      dd prt lab slays nign kept meas plabs pkeys hkeys cur kk
                      grp str strs nunl itm srt ltxt ninvl nfree mlabs lbx need cands
                      hts hlim box nbig lbs lb2 nisl ovl bestov)
  ;; --- stoly ---
  (princ "\nZbieram stoly")
  (setq *SC-BLKBOX* nil nlay 0 nfall 0)
  (if (and wdef (<= wdef 0.0)) (setq wdef nil))
  (if (setq ss (ssget "_X" (list '(0 . "INSERT") (cons 410 (getvar "CTAB")))))
    (progn
      (setq idx 0)
      (repeat (sslength ss)
        (setq en (ssname ss idx) idx (1+ idx) el (entget en))
        (if (member (strcase (cdr (assoc 8 el))) tlays)
          (progn
            (setq nlay (1+ nlay))
            (if (= 0 (rem nlay 250)) (princ "."))
            (setq pnt (trans (cdr (assoc 10 el)) en 0))
            (if (and (>= (car pnt) (- (car pbox) *SC-IMARG*))
                     (<= (car pnt) (+ (caddr pbox) *SC-IMARG*))
                     (>= (cadr pnt) (- (cadr pbox) *SC-IMARG*))
                     (<= (cadr pnt) (+ (cadddr pbox) *SC-IMARG*))
                     (setq tb (sc:tabrec en el))
                     (sc:boxnear (sc:tbox tb) pbox *SC-TMARG*))
              (progn
                (setq tabs (cons tb tabs))
                (if (null (nth 5 tb)) (setq nfall (1+ nfall)))
                (setq names (sc:bump names (sc:blkname en el) tb)))))))))
  ;; --- stoly bez bryl: szerokosc panelu ---
  (if (> nfall 0)
    (progn
      (princ (strcat "\n  Stolow BEZ bryl paneli: " (itoa nfall)
                     " - panele policze z obrysu bloku i szerokosci panelu."))
      (initget 6)
      (setq wid (getdist (strcat "\nSzerokosc panelu wzdluz stolu (z przerwa) [m]"
                                 (if wdef (strcat " <" (rtos wdef 2 3) ">") "") ": ")))
      (if (null wid) (setq wid wdef))
      (if wid
        (progn
          (setq *SC-PANELW* wid)
          (setq tabs (mapcar (function (lambda (tx) (if (nth 5 tx) tx (sc:fallrows tx wid)))) tabs))
          (sc:chk (strcat "stoly bez bryl paneli: " (itoa nfall) " - panele policzone z obrysu"
                          " bloku i szerokosci " (rtos wid 2 3) " m (obrys moga powiekszac kola"
                          " palowania - sprawdz liczby paneli w raporcie)")
                  nil nil))
        (sc:err (strcat "stoly bez bryl paneli: " (itoa nfall) " - nie podano szerokosci panelu,"
                        " kreskowania na nich nie zostana policzone")
                nil nil))))
  (setq res (sc:bands tabs) tabs (car res) bands (cadr res))
  (setq tgrid (sc:mkgrid tabs 'sc:tbox))
  (sc:info (strcat "Stoly w obszarze: " (itoa (length tabs)) " (blokow na warstwach stolow: "
                   (itoa nlay) "), z bryl paneli: " (itoa (- (length tabs) nfall))
                   ", bez bryl: " (itoa nfall) "; rzedow stolow (pasm): " (itoa (length bands))))
  (setq srt (reverse (sc:msort names (function (lambda (na nb) (< (cadr na) (cadr nb)))))) kk 0)
  (foreach itm srt
    (if (< kk 8)
      (sc:info (strcat "  " (itoa (cadr itm)) " x \"" (car itm) "\" - "
                       (if (> (caddr itm) 0)
                         (strcat (itoa (caddr itm)) " paneli w wierszu, wierszy: " (itoa (cadddr itm)))
                         "bez bryl paneli"))))
    (setq kk (1+ kk)))
  ;; --- napisy ---
  (princ "\nZbieram napisy")
  (setq nlong 0 ninvl 0 nfree 0)
  (if (setq ss (ssget "_X" (list '(0 . "TEXT,MTEXT") (cons 410 (getvar "CTAB")))))
    (progn
      (setq idx 0)
      (repeat (sslength ss)
        (setq en (ssname ss idx) idx (1+ idx) el (entget en))
        (if (= (strcase (cdr (assoc 8 el))) lablay)
          (progn
            (setq pnt (sc:tpoint en el) raw (sc:rawtext el))
            (if pnt
              ;; punkt napisu = srodek jego obrysu (napis wyrownany do lewej
              ;; zaczyna sie w innym miejscu niz lezy)
              (setq lbx (sc:labbox en el pnt)
                    pnt (list (* 0.5 (+ (car lbx) (caddr lbx))) (* 0.5 (+ (cadr lbx) (cadddr lbx))))))
            (cond
              ((null pnt) nil)
              ((null raw)
               (if (sc:inarea (car pnt) (cadr pnt) poly pbox) (setq nlong (1+ nlong))))
              (T
               (setq cln (sc:trim (if (= "MTEXT" (cdr (assoc 0 el))) (sc:mtx raw) raw))
                     inf (sc:parse cln)
                     key (if inf (sc:idkey inf) (strcat "?" (sc:normtxt cln))))
               (cond
                 ((sc:inarea (car pnt) (cadr pnt) poly pbox)
                  (cond
                    ((or (= cln "") (sc:invonly cln)) (setq ninvl (1+ ninvl)))
                    ((and strict (null inf))
                     (sc:chk (strcat "napis \"" cln "\" nie jest nazwa stringu (ST..-INV..-STR..)"
                                     " - pominiety")
                             (car pnt) (cadr pnt)))
                    (T (setq labs (cons (list en raw cln (car pnt) (cadr pnt) key inf lbx) labs)))))
                 ((and inf (sc:nearbox (car pnt) (cadr pnt) pbox *SC-NEAR*))
                  (setq outl (cons (list en cln (car pnt) (cadr pnt) key) outl)))))))))))
  (if (> ninvl 0)
    (sc:info (strcat "Napisy inwerterow (bez czlonu STR) na warstwie napisow w obszarze - pominiete: "
                     (itoa ninvl))))
  (if (> nlong 0)
    (sc:chk (strcat "napisy MTEXT dluzsze niz 250 znakow w obszarze: " (itoa nlong)
                    " - pominiete (nie da sie ich bezpiecznie zmienic)")
            nil nil))
  ;; --- kreskowania: kazda petla granicy = czesc ---
  (princ "\nZbieram kreskowania")
  (setq pid 0 nbad 0 ntilt 0 nisl 0)
  (if (setq ss (ssget "_X" (list '(0 . "HATCH") (cons 410 (getvar "CTAB")))))
    (progn
      (setq idx 0)
      (repeat (sslength ss)
        (setq en (ssname ss idx) idx (1+ idx) el (entget en) sg (sc:sgn el))
        (cond
          ((null sg)
           (if (setq lb (sc:bbox en))
             (if (sc:boxnear lb pbox 0.0) (setq ntilt (1+ ntilt)))))
          ((sc:hatchnear el sg pbox (+ *SC-HMARG* 60.0))
           (setq prs (sc:loops el) li 0 lbs nil)
           (if (car prs)
             (progn
               (setq nbad (1+ nbad))
               (setq prs (list nil (if (setq lb (sc:bbox en)) (list (list 'BOX lb)) nil)))))
           ;; obrysy petli; petle-wyspy wokol tekstu (flaga 8) i petle lezace
           ;; wewnatrz innej petli tego kreskowania nie sa czesciami stringu
           (foreach lp (cadr prs)
             (setq lb (if (eq (car lp) 'BOX) (cadr lp) (sc:lbox lp sg)))
             (cond
               ((null lb) nil)
               ((and (nth 3 lp) (= 8 (logand (nth 3 lp) 8))) (setq nisl (1+ nisl)))
               (T (setq lbs (cons (list li lb) lbs))))
             (setq li (1+ li)))
           (setq lbs  (reverse lbs)
                 lb2  (sc:outer lbs)
                 nisl (+ nisl (- (length lbs) (length lb2))))
           (foreach itm lb2
             (setq lb (cadr itm))
             (if (sc:boxnear lb pbox *SC-HMARG*)
               (setq pid   (1+ pid)
                     parts (cons (list (cons "PID" pid) (cons "HEN" en) (cons "BOX" lb)
                                       (cons "CX" (* 0.5 (+ (car lb) (caddr lb))))
                                       (cons "CY" (* 0.5 (+ (cadr lb) (cadddr lb))))
                                       (cons "HLAY" (strcase (cdr (assoc 8 el))))
                                       (cons "LIDX" (car itm)))
                                 parts)))))))))
  ;; --- napis -> czesci pod nim: kazda czesc wysokosci rzedu stolu, na ktora
  ;;     zachodzi TEKST napisu (napis w przerwie miedzy dwoma kreskowaniami
  ;;     jednego stringu nalezy do obu); awaryjnie najblizsza do *SC-LFAR*.
  ;;     Kreskowania wyzsze niz 1.5 x mediana (np. obszary) nie biora napisow. ---
  (foreach prt parts (setq hts (cons (sc:pheight prt) hts)))
  (setq hlim  (if hts (* 1.5 (sc:median hts)) 0.0)
        pgrid (sc:mkgrid (vl-remove-if-not (function (lambda (pq) (<= (sc:pheight pq) hlim))) parts)
                         'sc:pbox))
  (foreach lab labs
    (setq ptx   (nth 3 lab) pty (nth 4 lab) lbx (nth 7 lab)
          need  (min 1.0 (* 0.25 (- (caddr lbx) (car lbx))))
          cands nil best nil bestd nil)
    ;; kandydat = (czesc zachodzenieX 0/1): srodek napisu w zakresie Y czesci
    ;; dokladnie (0) albo z tolerancja *SC-LTOL* (1), tekst zachodzi na czesc
    ;; w X o co najmniej need
    (foreach prt (sc:gcands pgrid (- (car lbx) *SC-LFAR*) (+ (caddr lbx) *SC-LFAR*))
      (setq box (sc:g prt "BOX")
            ovl (- (min (caddr box) (caddr lbx)) (max (car box) (car lbx))))
      (if (>= ovl need)
        (cond
          ((and (<= (cadr box) pty) (>= (cadddr box) pty))
           (setq cands (cons (list prt ovl 0) cands)))
          ((and (<= (- (cadr box) *SC-LTOL*) pty) (>= (+ (cadddr box) *SC-LTOL*) pty))
           (setq cands (cons (list prt ovl 1) cands)))))
      (setq dd (sc:bdist ptx pty box))
      (if (and (<= dd *SC-LFAR*) (or (null bestd) (< dd bestd)))
        (setq best prt bestd dd)))
    ;; srodek wewnatrz czesci ma pierwszenstwo przed tolerancja (napis przy
    ;; krawedzi rzedu nie lapie drugiego rzedu); czesci ledwie muskane
    ;; (< 25 % najwiekszego zachodzenia) odpadaja (tekst wystajacy na sasiada)
    (if (vl-some (function (lambda (cq) (= 0 (caddr cq)))) cands)
      (setq cands (vl-remove-if-not (function (lambda (cq) (= 0 (caddr cq)))) cands)))
    (setq bestov 0.0)
    (foreach itm cands (if (> (cadr itm) bestov) (setq bestov (cadr itm))))
    (setq cands (mapcar (function car)
                        (vl-remove-if-not (function (lambda (cq) (>= (cadr cq) (* 0.25 bestov))))
                                          cands)))
    (if (and (null cands) best)
      (progn
        (if (> bestd *SC-LTOL*)
          (sc:chk (strcat "napis \"" (nth 2 lab) "\" lezy obok kreskowania ("
                          (rtos bestd 2 2) " m) - przypisany do najblizszego")
                  ptx pty))
        (setq cands (list best))))
    (cond
      ((and (null cands) strict)
       (sc:err (strcat "napis \"" (nth 2 lab) "\" nie lezy na kreskowaniu (nic do "
                       (rtos *SC-LFAR* 2 1) " m) - popraw polozenie napisu")
               ptx pty))
      ((null cands)
       ;; nowy obszar: napis bez kreskowania pomijany; jesli to napis stringu,
       ;; jego kreskowanie zostanie bez napisu i to bedzie zgloszone jako blad
       (setq nfree (1+ nfree))
       (sc:chk (strcat "napis \"" (nth 2 lab) "\" nie lezy na kreskowaniu (nic do "
                       (rtos *SC-LFAR* 2 1) " m) - pominiety")
               ptx pty))
      (T
       (foreach prt cands
         (setq cur (assoc (sc:g prt "PID") plabs))
         (if cur
           (setq plabs (subst (cons (car cur) (cons lab (cdr cur))) cur plabs))
           (setq plabs (cons (list (sc:g prt "PID") lab) plabs)))
         (if (not (member (sc:g prt "HLAY") slays))
           (setq slays (cons (sc:g prt "HLAY") slays))))
       (setq mlabs (cons lab mlabs)))))
  ;; dalej tylko napisy lezace na kreskowaniach
  (setq labs (reverse mlabs))
  ;; --- czesci stringow: warstwy kreskowan spod napisow, srodek w obszarze,
  ;;     wysokosc rzedu stolu ---
  (setq nign 0 nbig 0)
  (foreach prt parts
    (cond
      ((assoc (sc:g prt "PID") plabs) (setq kept (cons prt kept)))
      ((not (sc:inarea (sc:g prt "CX") (sc:g prt "CY") poly pbox)) nil)
      ((> (sc:pheight prt) hlim) (setq nbig (1+ nbig)))
      ((member (sc:g prt "HLAY") slays) (setq kept (cons prt kept)))
      (T (setq nign (1+ nign)))))
  ;; --- pomiar na stolach ---
  (setq parts nil)
  (foreach prt kept
    (setq meas (sc:measure prt tgrid))
    (setq parts (cons (append (list (cons "PAN" (nth 0 meas)) (cons "RIDX" (nth 1 meas))
                                    (cons "NROWS" (nth 2 meas)) (cons "BID" (nth 3 meas))
                                    (cons "TABS" (nth 4 meas)) (cons "PERR" (nth 5 meas))
                                    (cons "PIDS" (nth 6 meas))
                                    (cons "LABS" (reverse (cdr (assoc (sc:g prt "PID") plabs)))))
                              prt)
                      parts)))
  ;; --- klucze czesci: z wlasnych napisow; czesc bez napisu dostaje klucz
  ;;     swojego kreskowania, gdy wszystkie jego napisy maja ten sam klucz ---
  (foreach prt parts
    (foreach key (sc:ukeys (sc:g prt "LABS"))
      (setq cur (assoc (sc:g prt "HEN") hkeys))
      (cond
        ((null cur) (setq hkeys (cons (list (sc:g prt "HEN") key) hkeys)))
        ((not (member key (cdr cur)))
         (setq hkeys (subst (append cur (list key)) cur hkeys))))))
  (setq kept nil nunl 0)
  (foreach prt parts
    (setq pkeys (sc:ukeys (sc:g prt "LABS")))
    (cond
      ((> (length pkeys) 1)
       (setq ltxt nil)
       (foreach lab (sc:g prt "LABS")
         (if (not (member (nth 2 lab) ltxt)) (setq ltxt (cons (nth 2 lab) ltxt))))
       (sc:err (strcat "rozne napisy na jednym kreskowaniu (" (sc:join (reverse ltxt) ", ")
                       ") - jeden string = jeden napis")
               (sc:g prt "CX") (sc:g prt "CY")))
      ((= (length pkeys) 1) (setq kept (cons (sc:s prt "KEY" (car pkeys)) kept)))
      ((and (setq cur (assoc (sc:g prt "HEN") hkeys)) (= 1 (length (cdr cur))))
       (setq kept (cons (sc:s prt "KEY" (cadr cur)) kept)))
      (T
       (setq nunl (1+ nunl))
       (if strict
         (sc:chk "kreskowanie bez napisu - pominiete (nie nalezy do zadnego stringu)"
                 (sc:g prt "CX") (sc:g prt "CY"))
         (progn
           (setq *SC-UNL* (cons (list (sc:g prt "HEN") (sc:g prt "CX") (sc:g prt "CY")) *SC-UNL*))
           (sc:errsoft (strcat "kreskowanie bez napisu - kazdy nowy string musi miec napis"
                               " (moze byc skopiowany), inaczej nie wiadomo, czyje to kreskowanie")
                       (sc:g prt "CX") (sc:g prt "CY")))))))
  ;; --- stringi: czesci o tym samym kluczu ---
  (foreach prt kept
    (setq cur (assoc (sc:g prt "KEY") grp))
    (if cur
      (setq grp (subst (cons (car cur) (cons prt (cdr cur))) cur grp))
      (setq grp (cons (list (sc:g prt "KEY") prt) grp))))
  (foreach cur grp
    (if (setq str (sc:mkstring (car cur) (reverse (cdr cur)) labs))
      (setq strs (cons str strs))))
  (sc:info (strcat "Napisy stringow na kreskowaniach w obszarze: " (itoa (length labs))
                   (if (> nfree 0) (strcat " (poza kreskowaniami, pominiete: " (itoa nfree) ")") "")
                   "; czesci kreskowan (petli) stringow: " (itoa (length parts))
                   (if (> nunl 0) (strcat ", bez napisu: " (itoa nunl)) "")
                   (if (> nign 0) (strcat "; na innych warstwach (pominiete): " (itoa nign)) "")
                   (if (> nbig 0) (strcat "; wyzsze niz rzad stolu, np. obszary (pominiete): "
                                          (itoa nbig)) "")
                   (if (> nisl 0) (strcat "; wysp wewnatrz kreskowan (np. wokol tekstu, pominiete): "
                                          (itoa nisl)) "")
                   (if (> ntilt 0) (strcat "; nachylone (pominiete): " (itoa ntilt)) "")
                   (if (> nbad 0) (strcat "; z nieczytelna granica (liczone z obwiedni): "
                                          (itoa nbad)) "")))
  (sc:info (strcat "Warstwy kreskowan stringow: "
                   (if slays (sc:join (reverse slays) ", ") "(brak - zaden napis nie lezy na kreskowaniu)")))
  (list (cons "STRS" (reverse strs)) (cons "BANDS" bands) (cons "NTAB" (length tabs))
        (cons "OUTL" outl) (cons "WIDTH" wid)))

;; liczniki rodzajow -> ((rodzaj . n) ...) wg nazwy
(defun sc:kcount (kinds / out kd cur)
  (foreach kd kinds
    (if (setq cur (assoc kd out))
      (setq out (subst (cons kd (1+ (cdr cur))) cur out))
      (setq out (cons (cons kd 1) out))))
  (sc:msort out (function (lambda (ka kb) (< (car ka) (car kb))))))

(defun sc:kindtxt (kc / out itm)
  (foreach itm kc (setq out (cons (strcat (car itm) " x " (itoa (cdr itm))) out)))
  (sc:join (reverse out) ", "))

;; najczestsza wartosc (remis -> wieksza)
(defun sc:mode (nums / cnts nn cur best)
  (foreach nn nums
    (if (setq cur (assoc nn cnts))
      (setq cnts (subst (cons nn (1+ (cdr cur))) cur cnts))
      (setq cnts (cons (cons nn 1) cnts))))
  (foreach cur cnts
    (if (or (null best) (> (cdr cur) (cdr best))
            (and (= (cdr cur) (cdr best)) (> (car cur) (car best))))
      (setq best cur)))
  (if best (car best) 1))

;;; ==========================================================================
;;; STRCOPY - odczyt starego obszaru do CSV
;;; ==========================================================================

;; zapis CSV -> T / nil
(defun sc:writecsv (path invrecs strs hdef wid / fh iv str inf spec)
  (if (setq fh (open path "w"))
    (progn
      (write-line "Typ;Klucz;Stacja;Inwerter;String;Tekst;Rzad;Panele;Kolor62;Kolor420;Kolor430;Czesci;Pasma;X;Y" fh)
      (write-line "META;wersja;1" fh)
      (write-line (strcat "META;zrodlo;" (sc:csvfld (strcat (getvar "DWGPREFIX") (getvar "DWGNAME")))) fh)
      (write-line (strcat "META;rzedy_na_grupe;" (itoa hdef)) fh)
      (if wid (write-line (strcat "META;szerokosc_panelu;" (sc:num wid 3)) fh))
      ;; inwerter = (klucz inf spec pasm stringi)
      (foreach iv invrecs
        (setq spec (nth 2 iv))
        (write-line (strcat "INV;" (sc:csvfld (car iv)) ";"
                            (if (car (cadr iv)) (car (cadr iv)) "") ";"
                            (itoa (nth 4 (cadr iv))) ";;;;;"
                            (sc:cstr (car spec)) ";" (sc:cstr (cadr spec)) ";"
                            (sc:csvfld (caddr spec)) ";;" (itoa (nth 3 iv)) ";;")
                    fh))
      (foreach str strs
        (setq inf  (sc:g str "IDENT")
              spec (sc:colspec (entget (car (sc:g str "HATS")))))
        (write-line (strcat "STR;" (sc:csvfld (sc:g str "KEY")) ";"
                            (if (car inf) (car inf) "") ";"
                            (itoa (nth 4 inf)) ";" (itoa (nth 5 inf)) ";"
                            (sc:csvfld (sc:g str "TEXT")) ";" (sc:g str "ROW") ";"
                            (itoa (sc:g str "PAN")) ";"
                            (sc:cstr (car spec)) ";" (sc:cstr (cadr spec)) ";"
                            (sc:csvfld (caddr spec)) ";"
                            (itoa (length (sc:g str "PARTS"))) ";"
                            (itoa (length (sc:g str "BIDS"))) ";"
                            (sc:num (sc:g str "CX") 2) ";" (sc:num (sc:g str "CY") 2))
                    fh))
      (close fh)
      T)
    nil))

(defun c:STRCOPY ( / *error* pa poly pbox lablay tlays res strs keys lab str invs inv cur
                     iv hs hen ck cols cc dom spec nbs bids x1 x2 hdef invrecs kc pmed
                     csvp strs2 nb itm)
  (defun *error* (msg)
    (if (and msg (not (wcmatch (strcase msg) "*BREAK*,*CANCEL*,*EXIT*,*ANUL*")))
      (princ (strcat "\nSTRCOPY - blad: " msg)))
    (princ))
  (sc:reset)
  (princ "\n=== STRCOPY: stringi ze STAREGO obszaru -> plik CSV ===")
  (cond
    ((null (setq pa (sc:askpoly "\nWskaz POLILINIE obszaru w ORYGINALE (stringi w jej wnetrzu): ")))
     (princ "\nNie wskazano polilinii obszaru. Koniec."))
    ((null (setq lablay (sc:asklab "\nWskaz przykladowy napis stringu (np. ST11-INV30-STR5): ")))
     (princ "\nNie wskazano napisu. Koniec."))
    ((null (setq tlays (sc:asktabs)))
     (princ "\nNie wskazano bloku stolu. Koniec."))
    (T
     (setq poly (car pa) pbox (cadr pa))
     (setq res  (sc:readarea poly pbox lablay tlays T *SC-PANELW*)
           strs (sc:g res "STRS"))
     ;; --- ten sam string takze tuz za granica obszaru ---
     (setq keys (mapcar (function (lambda (sx) (sc:g sx "KEY"))) strs))
     (foreach lab (sc:g res "OUTL")
       (if (member (nth 4 lab) keys)
         (sc:chk (strcat "napis \"" (nth 1 lab) "\" jest takze POZA obszarem - string moze tam"
                         " biec dalej (liczba paneli bylaby za mala); obejmij caly string polilinia")
                 (nth 2 lab) (nth 3 lab))))
     ;; --- stringi nietypowe ---
     (setq pmed (sc:median (mapcar (function (lambda (sx) (sc:g sx "PAN"))) strs)))
     (foreach str strs
       (if (or (> (length (sc:g str "PARTS")) 2) (> (length (sc:g str "BIDS")) 2)
               (and pmed (> (sc:g str "PAN") (* 1.5 pmed))))
         (sc:chk (strcat "\"" (sc:g str "TEXT") "\": " (itoa (length (sc:g str "PARTS")))
                         " kreskowan, " (itoa (length (sc:g str "BIDS"))) " rzedow stolow, "
                         (itoa (sc:g str "PAN")) " paneli - nietypowy string, sprawdz napisy")
                 (sc:g str "CX") (sc:g str "CY"))))
     ;; --- inwertery: (klucz inf stringi...) ---
     (foreach str strs
       (setq inv (sc:invkey (sc:g str "IDENT")) cur (assoc inv invs))
       (if cur
         (setq invs (subst (append cur (list str)) cur invs))
         (setq invs (cons (list inv (sc:g str "IDENT") str) invs))))
     (setq invs (sc:msort invs (function (lambda (ia ib) (sc:infless (cadr ia) (cadr ib))))))
     (foreach iv invs
       ;; kolor dominujacy kreskowan inwertera
       (setq hs nil cols nil)
       (foreach str (cddr iv)
         (foreach hen (sc:g str "HATS")
           (if (not (member hen hs))
             (progn
               (setq hs (cons hen hs)
                     ck (sc:colkey (entget hen))
                     cc (assoc ck cols))
               (if cc
                 (setq cols (subst (list ck (1+ (cadr cc)) (caddr cc)) cc cols))
                 (setq cols (cons (list ck 1 hen) cols)))))))
       (setq dom nil)
       (foreach cc cols (if (or (null dom) (> (cadr cc) (cadr dom))) (setq dom cc)))
       (setq spec (sc:colspec (entget (caddr dom))))
       (if (= "L" (substr (car dom) 1 1))
         (sc:info (strcat (car iv) ": kreskowania maja kolor WG WARSTWY - zapisany kolor warstwy ("
                          (sc:colname spec) ")")))
       (foreach str (cddr iv)
         (foreach hen (sc:g str "HATS")
           (if (/= (sc:colkey (entget hen)) (car dom))
             (sc:chk (strcat "\"" (sc:g str "TEXT") "\": kolor kreskowania inny niz reszta "
                             (car iv) " - do STRPASTE idzie kolor dominujacy ("
                             (sc:colname spec) ")")
                     (sc:g str "CX") (sc:g str "CY")))))
       ;; rzedy stolow i zasieg X
       (setq bids nil x1 nil x2 nil)
       (foreach str (cddr iv)
         (foreach nb (sc:g str "BIDS") (if (not (member nb bids)) (setq bids (cons nb bids))))
         (foreach itm (sc:g str "PARTS")
           (if (or (null x1) (< (car (sc:g itm "BOX")) x1)) (setq x1 (car (sc:g itm "BOX"))))
           (if (or (null x2) (> (caddr (sc:g itm "BOX")) x2)) (setq x2 (caddr (sc:g itm "BOX"))))))
       (setq nbs (cons (length bids) nbs))
       (setq invrecs (cons (list (car iv) (cadr iv) spec (length bids) (cddr iv)) invrecs))
       (setq kc (sc:kcount (mapcar (function (lambda (sx) (sc:g sx "KIND"))) (cddr iv))))
       (sc:info (strcat (car iv) ": " (itoa (length (cddr iv))) " stringow (" (sc:kindtxt kc)
                        "), " (sc:colname spec) ", rzedow stolow: " (itoa (length bids))
                        ", szerokosc ~" (rtos (- x2 x1) 2 0) " m")))
     (setq invrecs (reverse invrecs)
           hdef    (sc:mode nbs))
     (sc:info (strcat "Stringi w obszarze: " (itoa (length strs)) " ("
                      (sc:kindtxt (sc:kcount (mapcar (function (lambda (sx) (sc:g sx "KIND"))) strs)))
                      "); G = gorny rzad stolu, D = dolny, liczba = panele"))
     (sc:info (strcat "Rzedow stolow na grupe inwertera (domyslnie dla STRPASTE): " (itoa hdef)))
     (if (null strs) (sc:err "w obszarze nie ma zadnego stringu (napis na kreskowaniu)" nil nil))
     ;; --- CSV (tylko bez bledow) ---
     (cond
       (*SC-ERRS*
        (sc:report "STRCOPY")
        (princ "\n\nCSV NIE zostal zapisany - popraw BLEDY i uruchom STRCOPY ponownie."))
       (T
        (if (or (= 0 (getvar "DWGTITLED")) (= "" (getvar "DWGPREFIX")))
          (setq csvp (getfiled "Zapisz dane stringow (CSV)" "strcopy" "csv" 1))
          (setq csvp (strcat (getvar "DWGPREFIX") (sc:noext (getvar "DWGNAME")) "_strcopy.csv")))
        (setq strs2 nil)
        (foreach iv invrecs
          (setq strs2 (append strs2 (sc:msort (nth 4 iv)
                                              (function (lambda (sa sb)
                                                          (sc:infless (sc:g sa "IDENT") (sc:g sb "IDENT"))))))))
        (cond
          ((null csvp) (sc:err "nie wybrano pliku CSV - dane NIE zapisane" nil nil))
          ((sc:writecsv csvp invrecs strs2 hdef (sc:g res "WIDTH"))
           (setenv "STRCOPY_CSV" csvp)
           (sc:info (strcat "Zapisano: " csvp)))
          (T (sc:err (strcat "nie mozna zapisac pliku " csvp " (otwarty w Excelu?)") nil nil)))
        (sc:report "STRCOPY")
        (if (and csvp (null *SC-ERRS*))
          (princ (strcat "\n\nDane " (itoa (length strs)) " stringow zapisane do:\n" csvp
                         "\nTeraz otworz NOWY rysunek i uruchom STRPASTE.")))))
     (sc:askcircles)))
  (princ))

;;; ==========================================================================
;;; STRPASTE - nowy obszar: kontrola zestawu, grupy, numery, zapis
;;; ==========================================================================

;; CSV z STRCOPY -> (("META" (NAZWA . wartosc) ...) ("INVS" inw ...) ("STRS" str ...)
;;                   ("NBAD" . n)) albo (("ERR" . komunikat))
;; inw = (klucz inf (62 420 430) pasm)
;; str = (klucz kluczInw nrSTR tekst rodzaj inf)
(defun sc:readcsv (path / fh lines line flds typ meta invs strs nbad inf ikey spec kd pn)
  (if (null (setq fh (open path "r")))
    (list (cons "ERR" (strcat "nie mozna otworzyc pliku " path)))
    (progn
      (setq lines (sc:readlines fh) nbad 0)
      (close fh)
      (foreach line lines
        (if (and (> (strlen line) 2) (= (ascii line) 239)) (setq line (substr line 4)))
        (setq flds (sc:csvsplit line ";")
              typ  (strcase (sc:trim (car flds))))
        (cond
          ((= typ "META")
           (setq meta (cons (cons (strcase (sc:trim (nth 1 flds))) (sc:trim (nth 2 flds))) meta)))
          ((= typ "INV")
           (setq ikey (sc:trim (nth 1 flds))
                 inf  (sc:parse (strcat ikey "-STR1"))
                 spec (list (sc:toint (nth 8 flds)) (sc:toint (nth 9 flds))
                            (if (= (sc:trim (nth 10 flds)) "") nil (sc:trim (nth 10 flds)))))
           (if (and inf (or (car spec) (cadr spec)))
             (setq invs (cons (list (sc:invkey inf) inf spec (sc:toint (nth 12 flds))) invs))
             (setq nbad (1+ nbad))))
          ((= typ "STR")
           (setq inf (sc:parse (sc:trim (nth 5 flds))))
           (if (null inf) (setq inf (sc:parse (sc:trim (nth 1 flds)))))
           (setq pn (sc:toint (nth 7 flds))
                 kd (strcase (sc:trim (nth 6 flds))))
           (if (and inf pn (> pn 0) (/= kd ""))
             (setq strs (cons (list (sc:idkey inf) (sc:invkey inf) (nth 5 inf)
                                    (if (= (sc:trim (nth 5 flds)) "") (sc:idkey inf) (sc:trim (nth 5 flds)))
                                    (strcat kd (itoa pn)) inf)
                              strs))
             (setq nbad (1+ nbad))))
          ((member typ '("" "TYP")) nil)
          (T (setq nbad (1+ nbad)))))
      (list (cons "META" meta) (cons "INVS" (reverse invs)) (cons "STRS" (reverse strs))
            (cons "NBAD" nbad)))))

;; kontrola danych z CSV -> nil gdy OK, inaczej opis problemu
(defun sc:csvcheck (data / keys ikeys orec res iv)
  (foreach iv (sc:g data "INVS")
    (cond
      (res nil)
      ((member (car iv) ikeys)
       (setq res (strcat "inwerter " (car iv) " wystepuje w pliku dwa razy (wiersze INV)")))
      (T (setq ikeys (cons (car iv) ikeys)))))
  (foreach orec (sc:g data "STRS")
    (cond
      (res nil)
      ((member (car orec) keys)
       (setq res (strcat "string " (car orec) " wystepuje w pliku dwa razy")))
      ((null (assoc (cadr orec) (sc:g data "INVS")))
       (setq res (strcat "brak wiersza INV z kolorem inwertera " (cadr orec))))
      (T (setq keys (cons (car orec) keys)))))
  res)

;; kontrola zestawu: rodzaje stringow nowego obszaru = oryginal -> T / nil
(defun sc:setcheck (okc nkc strs / kinds itm kd on nn ok str lab)
  (setq ok T)
  (foreach itm (append okc nkc)
    (if (not (member (car itm) kinds)) (setq kinds (cons (car itm) kinds))))
  (foreach kd (sc:msort kinds (function sc:strless))
    (setq on (cdr (assoc kd okc)) nn (cdr (assoc kd nkc)))
    (if (null on) (setq on 0))
    (if (null nn) (setq nn 0))
    (if (/= on nn)
      (progn
        (setq ok nil)
        (sc:errsoft (strcat "ZESTAW SIE NIE ZGADZA - " kd " (" (cadr (sc:kindparts kd)) " paneli, "
                            (car (sc:kindparts kd)) "): w oryginale " (itoa on)
                        ", w nowym obszarze " (itoa nn)
                        (if (> nn on)
                          (strcat " (o " (itoa (- nn on)) " za duzo)")
                          (strcat " (brakuje " (itoa (- on nn)) ")")))
                nil nil)
        (foreach str strs
          (if (= (sc:g str "KIND") kd)
            (if (and (null (assoc kd okc)) (> (length (sc:g str "LABS")) 1))
              ;; ten sam tekst napisu na kilku osobnych kreskowaniach = jeden
              ;; string (zasada "patrz na numer") - najczestsza przyczyna
              ;; nieistniejacego rodzaju, np. G50
              (progn
                (sc:chk (strcat "\"" (sc:g str "TEXT") "\": " kd " (" (itoa (sc:g str "PAN"))
                                " paneli) - ten sam napis na " (itoa (length (sc:g str "LABS")))
                                " napisach / " (itoa (length (sc:g str "HATS")))
                                " kreskowaniach laczy je w JEDEN string; jesli to rozne stringi,"
                                " nadaj im rozne napisy")
                        nil nil)
                (foreach lab (sc:g str "LABS")
                  (sc:circ (nth 3 lab) (nth 4 lab) *SC-YELLOW*
                           (strcat "SPRAWDZ: \"" (sc:g str "TEXT") "\" - ten sam napis na "
                                   (itoa (length (sc:g str "LABS"))) " kreskowaniach = JEDEN string "
                                   (itoa (sc:g str "PAN")) " paneli; jesli to rozne stringi, nadaj"
                                   " im rozne napisy"))))))))))
  ok)

;; pasma ze stringami, numerowane od wybranej strony -> ((bid . ai) ...)
(defun sc:actbands (strs bands / bids str bid lst out kk bd)
  (foreach str strs
    (foreach bid (sc:g str "BIDS")
      (if (not (member bid bids)) (setq bids (cons bid bids)))))
  (foreach bd bands (if (member (car bd) bids) (setq lst (cons bd lst))))
  (setq lst (sc:msort lst (if (= *SC-VFROM* "Gory")
                            (function (lambda (ba bc) (> (sc:bmid ba) (sc:bmid bc))))
                            (function (lambda (ba bc) (< (sc:bmid ba) (sc:bmid bc)))))))
  (setq kk 0)
  (foreach bd lst (setq out (cons (cons (car bd) kk) out) kk (1+ kk)))
  out)

;; kotwica stringu: czesc w pasmie najblizszym startu (remis: blizej startowej
;; strony w X) -> (ai x)
(defun sc:anchor (str amap / prt ai cx bai bx)
  (foreach prt (sc:g str "PARTS")
    (setq ai (cdr (assoc (sc:g prt "BID") amap)) cx (sc:g prt "CX"))
    (if (or (null bai) (< ai bai)
            (and (= ai bai) (if (= *SC-HFROM* "Lewa") (< cx bx) (> cx bx))))
      (setq bai ai bx cx)))
  (list bai bx))

;; kolejnosc przegladu: pas po pasie; w pasie wg X kotwicy - w pasie 0 od
;; wybranej strony, w kolejnych na zmiane (waz); remis: pasmo, wiersz
(defun sc:sweepless (sa sb / ta tc dir xa xb)
  (setq ta (sc:g sa "STRIPE") tc (sc:g sb "STRIPE"))
  (cond
    ((< ta tc) T)
    ((> ta tc) nil)
    (T
     (setq dir (if (equal (= 0 (rem ta 2)) (= *SC-HFROM* "Lewa")) 1.0 -1.0)
           xa  (* dir (sc:g sa "AX"))
           xb  (* dir (sc:g sb "AX")))
     (cond
       ((< xa (- xb 0.01)) T)
       ((> xa (+ xb 0.01)) nil)
       ((< (sc:g sa "AI") (sc:g sb "AI")) T)
       ((> (sc:g sa "AI") (sc:g sb "AI")) nil)
       (T (< (sc:g sa "RIDX") (sc:g sb "RIDX")))))))

;; kolejnosc czytania w grupie: pasmo od startu, w pasmie od startowej strony
(defun sc:readless (sa sb / xa xb)
  (setq xa (sc:g sa "AX") xb (sc:g sb "AX"))
  (if (= *SC-HFROM* "Prawa") (setq xa (- xa) xb (- xb)))
  (cond
    ((< (sc:g sa "AI") (sc:g sb "AI")) T)
    ((> (sc:g sa "AI") (sc:g sb "AI")) nil)
    ((< xa (- xb 0.01)) T)
    ((> xa (+ xb 0.01)) nil)
    (T (< (sc:g sa "RIDX") (sc:g sb "RIDX")))))

;; ile stringow rodzaju kd ma inwerter inv w oryginale
(defun sc:quota (ostrs inv kd / nn orec)
  (setq nn 0)
  (foreach orec ostrs
    (if (and (= (nth 1 orec) inv) (= (nth 4 orec) kd)) (setq nn (1+ nn))))
  nn)

;; przydzial do inwerterow: dla kazdego rodzaju stringi w kolejnosci
;; przegladu po kolei do inwerterow wg liczby ich stringow tego rodzaju
;; -> ((klucz . inwerter) ...)
(defun sc:greedy (sw invorder ostrs / kinds sx kd lst inv need gmap)
  (foreach sx sw
    (if (not (member (sc:g sx "KIND") kinds)) (setq kinds (cons (sc:g sx "KIND") kinds))))
  (foreach kd kinds
    (setq lst nil)
    (foreach sx sw (if (= (sc:g sx "KIND") kd) (setq lst (cons sx lst))))
    (setq lst (reverse lst))
    (foreach inv invorder
      (setq need (sc:quota ostrs inv kd))
      (repeat need
        (if lst
          (setq gmap (cons (cons (sc:g (car lst) "KEY") inv) gmap)
                lst  (cdr lst))))))
  gmap)

;; blizniaki: string gorny i dolny na DOKLADNIE tych samych stolach, z ta
;; sama liczba paneli -> ((klucz . kluczBlizniaka) ...)
(defun sc:twins (strs / sig str mp cur out sta stb)
  (foreach str strs
    (setq sig (strcat (sc:join (sc:g str "TABS") ",") "|" (itoa (sc:g str "PAN"))))
    (if (setq cur (assoc sig mp))
      (setq mp (subst (append cur (list str)) cur mp))
      (setq mp (cons (list sig str) mp))))
  (foreach cur mp
    (if (= 2 (length (cdr cur)))
      (progn
        (setq sta (cadr cur) stb (caddr cur))
        (if (/= (sc:g sta "ROW") (sc:g stb "ROW"))
          (setq out (cons (cons (sc:g sta "KEY") (sc:g stb "KEY"))
                          (cons (cons (sc:g stb "KEY") (sc:g sta "KEY")) out)))))))
  out)

;; srodki grup -> ((inwerter cx cy) ...)
(defun sc:centers (strs gmap / out str inv cur)
  (foreach str strs
    (setq inv (cdr (assoc (sc:g str "KEY") gmap)) cur (assoc inv out))
    (if cur
      (setq out (subst (list inv (+ (cadr cur) (sc:g str "CX")) (+ (caddr cur) (sc:g str "CY"))
                             (1+ (cadddr cur)))
                       cur out))
      (setq out (cons (list inv (sc:g str "CX") (sc:g str "CY") 1) out))))
  (mapcar (function (lambda (cq) (list (car cq) (/ (cadr cq) (cadddr cq)) (/ (caddr cq) (cadddr cq)))))
          out))

;; jednostki zamiany: para blizniakow w tej samej grupie albo pojedynczy
;; string -> ((sygnatura inwerter ux uy waga (klucze)) ...)
(defun sc:units (strs gmap tw / smap done str key tk trec inv out)
  (setq smap (mapcar (function (lambda (sx) (cons (sc:g sx "KEY") sx))) strs))
  (foreach str strs
    (setq key (sc:g str "KEY"))
    (if (not (member key done))
      (progn
        (setq inv  (cdr (assoc key gmap))
              tk   (cdr (assoc key tw))
              trec (if (and tk (equal (cdr (assoc tk gmap)) inv)) (cdr (assoc tk smap)) nil))
        (if trec
          (setq out  (cons (list (sc:join (sc:msort (list (sc:g str "KIND") (sc:g trec "KIND"))
                                                    (function sc:strless))
                                          "+")
                                 inv
                                 (* 0.5 (+ (sc:g str "CX") (sc:g trec "CX")))
                                 (* 0.5 (+ (sc:g str "CY") (sc:g trec "CY")))
                                 2.0 (list key tk))
                           out)
                done (cons key (cons tk done)))
          (setq out  (cons (list (sc:g str "KIND") inv (sc:g str "CX") (sc:g str "CY") 1.0
                                 (list key))
                           out)
                done (cons key done))))))
  out)

(defun sc:d2 (ux uy cen)
  (+ (* (- ux (cadr cen)) (- ux (cadr cen))) (* (- uy (caddr cen)) (- uy (caddr cen)))))

;; zysk zamiany jednostek ua (grupa A) i ub (grupa B): suma kwadratow
;; odleglosci od srodkow grup przed - po
(defun sc:swapgain (ua ub cents / ca cb)
  (setq ca (assoc (cadr ua) cents) cb (assoc (cadr ub) cents))
  (- (+ (* (nth 4 ua) (sc:d2 (nth 2 ua) (nth 3 ua) ca))
        (* (nth 4 ub) (sc:d2 (nth 2 ub) (nth 3 ub) cb)))
     (+ (* (nth 4 ua) (sc:d2 (nth 2 ua) (nth 3 ua) cb))
        (* (nth 4 ub) (sc:d2 (nth 2 ub) (nth 3 ub) ca)))))

(defun sc:doswap (gmap ua ub / out pr)
  (foreach pr gmap
    (setq out (cons (cond ((member (car pr) (nth 5 ua)) (cons (car pr) (cadr ub)))
                          ((member (car pr) (nth 5 ub)) (cons (car pr) (cadr ua)))
                          (T pr))
                    out)))
  (reverse out))

;; odleglosc dwoch prostokatow (0 gdy zachodza)
(defun sc:boxdist (ba bb / dxx dyy)
  (setq dxx (max 0.0 (- (car ba) (caddr bb)) (- (car bb) (caddr ba)))
        dyy (max 0.0 (- (cadr ba) (cadddr bb)) (- (cadr bb) (cadddr ba))))
  (sqrt (+ (* dxx dxx) (* dyy dyy))))

;; odstep sasiedztwa stringow: 1.3 x mediana przerwy w pionie miedzy
;; KRESKOWANIAMI kolejnych rzedow stolow, co najmniej 3 m (z kreskowan, nie
;; z obrysow stolow - obrys bloku bez bryl powiekszaja kola palowania)
(defun sc:nbdist (strs / ext str prt bid cur lst gaps prev bd)
  (foreach str strs
    (foreach prt (sc:g str "PARTS")
      (setq bid (sc:g prt "BID") cur (assoc bid ext))
      (if cur
        (setq ext (subst (list bid (min (cadr cur) (cadr (sc:g prt "BOX")))
                               (max (caddr cur) (cadddr (sc:g prt "BOX"))))
                         cur ext))
        (setq ext (cons (list bid (cadr (sc:g prt "BOX")) (cadddr (sc:g prt "BOX"))) ext)))))
  (setq lst (sc:msort ext (function (lambda (ba bc) (> (sc:bmid ba) (sc:bmid bc))))))
  (foreach bd lst
    (if prev (setq gaps (cons (- (cadr prev) (caddr bd)) gaps)))
    (setq prev bd))
  (if gaps (max 3.0 (* 1.3 (sc:median gaps))) 3.0))

;; sasiedzi: stringi, ktorych kreskowania leza blizej niz dnb
;; -> ((klucz kluczSasiada ...) ...)
(defun sc:adjacency (strs dnb / sa sb nbs adj pa pb near)
  (foreach sa strs
    (setq nbs nil)
    (foreach sb strs
      (if (/= (sc:g sa "KEY") (sc:g sb "KEY"))
        (progn
          (setq near nil)
          (foreach pa (sc:g sa "PARTS")
            (foreach pb (sc:g sb "PARTS")
              (if (and (not near) (<= (sc:boxdist (sc:g pa "BOX") (sc:g pb "BOX")) dnb))
                (setq near T))))
          (if near (setq nbs (cons (sc:g sb "KEY") nbs))))))
    (setq adj (cons (cons (sc:g sa "KEY") nbs) adj)))
  adj)

;; kawalki grup (skladowe spojne wsrod sasiadow) -> ((inwerter (klucz ...)) ...)
(defun sc:comps (keys gmap adj / seen out key inv queue cur nb comp)
  (foreach key keys
    (if (not (member key seen))
      (progn
        (setq inv (cdr (assoc key gmap)) queue (list key) seen (cons key seen) comp nil)
        (while queue
          (setq cur (car queue) queue (cdr queue) comp (cons cur comp))
          (foreach nb (cdr (assoc cur adj))
            (if (and (not (member nb seen)) (equal (cdr (assoc nb gmap)) inv))
              (setq seen (cons nb seen) queue (cons nb queue)))))
        (setq out (cons (list inv comp) out)))))
  out)

;; suma odleglosci stringow od srodkow ich grup [m]
(defun sc:spread (strs gmap / cents str cen tot)
  (setq cents (sc:centers strs gmap) tot 0.0)
  (foreach str strs
    (setq cen (assoc (cdr (assoc (sc:g str "KEY") gmap)) cents)
          tot (+ tot (sqrt (sc:d2 (sc:g str "CX") (sc:g str "CY") cen)))))
  tot)

;; porzadkowanie: zamiana jednostek tego samego rodzaju miedzy grupami,
;; od najwiekszego zysku (> *SC-SWAPMIN*); zamiana, ktora rozrywa grupe na
;; wiecej kawalkow, jest odrzucana -> (gmap . liczba zamian)
(defun sc:tidy (strs gmap tw adj / keys nsw go cents units cands ua ub gain cand pc0 gm2 done ntry)
  (setq keys (mapcar (function (lambda (sx) (sc:g sx "KEY"))) strs)
        nsw 0 go T)
  (while (and go (< nsw *SC-SWAPMAX*))
    (setq cents (sc:centers strs gmap)
          units (sc:units strs gmap tw)
          cands nil
          ua    units)
    (while ua
      (setq ub (cdr ua))
      (while ub
        (if (and (= (car (car ua)) (car (car ub)))
                 (/= (cadr (car ua)) (cadr (car ub))))
          (progn
            (setq gain (sc:swapgain (car ua) (car ub) cents))
            (if (> gain *SC-SWAPMIN*) (setq cands (cons (list gain (car ua) (car ub)) cands)))))
        (setq ub (cdr ub)))
      (setq ua (cdr ua)))
    (setq cands (sc:msort cands (function (lambda (ca cb) (> (car ca) (car cb)))))
          pc0   (length (sc:comps keys gmap adj))
          done  nil
          ntry  0)
    (while (and cands (not done) (< ntry 20))
      (setq cand  (car cands)
            cands (cdr cands)
            ntry  (1+ ntry)
            gm2   (sc:doswap gmap (cadr cand) (caddr cand)))
      (if (<= (length (sc:comps keys gm2 adj)) pc0)
        (setq gmap gm2 nsw (1+ nsw) done T)))
    (if (not done) (setq go nil)))
  (cons gmap nsw))

;; numery w grupach: dla kazdego inwertera i rodzaju stringi w kolejnosci
;; czytania dostaja numery STR tego inwertera i rodzaju rosnaco
;; -> ((klucz . rekordZOryginalu) ...)
(defun sc:number (strs gmap ostrs invorder / nmap inv kinds orec kd mine ids sx)
  (foreach inv invorder
    (setq kinds nil)
    (foreach orec ostrs
      (if (and (= (nth 1 orec) inv) (not (member (nth 4 orec) kinds)))
        (setq kinds (cons (nth 4 orec) kinds))))
    (foreach kd kinds
      (setq mine nil ids nil)
      (foreach sx strs
        (if (and (= (sc:g sx "KIND") kd) (= (cdr (assoc (sc:g sx "KEY") gmap)) inv))
          (setq mine (cons sx mine))))
      (foreach orec ostrs
        (if (and (= (nth 1 orec) inv) (= (nth 4 orec) kd)) (setq ids (cons orec ids))))
      (setq mine (sc:msort (reverse mine) (function sc:readless))
            ids  (sc:msort ids (function (lambda (oa ob) (< (nth 2 oa) (nth 2 ob))))))
      (while (and mine ids)
        (setq nmap (cons (cons (sc:g (car mine) "KEY") (car ids)) nmap)
              mine (cdr mine)
              ids  (cdr ids)))))
  nmap)

;; kotwice wszystkich stringow: "AI" (pasmo od startu) i "AX"
(defun sc:anchors (strs amap)
  (mapcar (function (lambda (sx / an)
                      (setq an (sc:anchor sx amap))
                      (sc:s (sc:s sx "AI" (car an)) "AX" (cadr an))))
          strs))

;; przydzial dla danej liczby rzedow stolow na grupe (stringi z kotwicami)
;; -> (stringi gmap nmap liczbaZamian kawalkow suma_odleglosci kawalki)
(defun sc:assign (strs ostrs oinvs hrows adj / sw invorder gmap tres nsw nmap keys comps asn)
  (setq strs (mapcar (function (lambda (sx) (sc:s sx "STRIPE" (/ (sc:g sx "AI") hrows)))) strs))
  (setq sw       (sc:msort strs (function sc:sweepless))
        invorder (mapcar (function car) oinvs)
        gmap     (sc:greedy sw invorder ostrs)
        nsw      0)
  ;; tylko stringi z przydzialem (w trybie Dopasuj nadmiarowe zostaja bez)
  (setq asn (vl-remove-if-not (function (lambda (sx) (assoc (sc:g sx "KEY") gmap))) strs))
  (if (> (length invorder) 1)
    (setq tres (sc:tidy asn gmap (sc:twins asn) adj)
          gmap (car tres)
          nsw  (cdr tres)))
  (setq nmap  (sc:number asn gmap ostrs invorder)
        keys  (mapcar (function (lambda (sx) (sc:g sx "KEY"))) asn)
        comps (sc:comps keys gmap adj))
  (list strs gmap nmap nsw (length comps) (sc:spread asn gmap) comps))

;;; --------------------------------------------------------------------------
;;; Grupy w SKUPISKACH (jak INWERTERY w ZLICZ-PANELE.lsp)
;;; --------------------------------------------------------------------------
;;; Obszar dzielony na pol rekurencyjnie: lista inwerterow (w kolejnosci
;;; numerow) na pol, pierwsza polowa dostaje czesc obszaru przy narozniku
;;; startu. Ciecie wg rodzajow: pierwsza czesc bierze z kazdego rodzaju tyle
;;; stringow, ile maja jej inwertery w oryginale - pierwsze w kolejnosci
;;; rzedami (ciecie miedzy rzedami stolow, rzad na granicy dzielony od jednego
;;; albo drugiego konca) albo kolumnami (ciecie w poprzek rzedow); kazda
;;; kolejnosc tez od konca (druga czesc bierze ostatnie). Wybierany jest
;;; podzial z najzwartszymi czesciami (obwod^2 / pole obrysu wg rzedow, ksztalt
;;; *SC-ASPECT*) + kara za czesci zachodzace na siebie w tym samym rzedzie.
;;; Potem porzadkowanie (zamiany jak w trybie Pasy).

;; zakres pasma w poprzek (Y) do polowy przerwy od sasiednich pasm ze
;; stringami -> ((bid y1 y2) ...)
(defun sc:bspans (bands amap / lst out kk bd prv nxt)
  (foreach bd bands (if (assoc (car bd) amap) (setq lst (cons bd lst))))
  (setq lst (sc:msort lst (function (lambda (ba bc) (< (sc:bmid ba) (sc:bmid bc)))))
        kk  0)
  (foreach bd lst
    (setq prv (if (> kk 0) (nth (1- kk) lst))
          nxt (nth (1+ kk) lst)
          out (cons (list (car bd)
                          (if prv (* 0.5 (+ (caddr prv) (cadr bd))) (cadr bd))
                          (if nxt (* 0.5 (+ (caddr bd) (cadr nxt))) (caddr bd)))
                    out)
          kk  (1+ kk)))
  out)

;; zasieg X w pasmach: dopisanie do ext zakresow czesci stringu
;; -> ((bid x1 x2) ...)
(defun sc:extadd (ext itms / itm bid cur)
  (foreach itm itms
    (setq bid (car itm) cur (assoc bid ext))
    (cond
      ((null bid))
      (cur (setq ext (subst (list bid (min (cadr cur) (cadr itm)) (max (caddr cur) (caddr itm)))
                            cur ext)))
      (T (setq ext (cons itm ext)))))
  ext)

;; zasieg stringu w pasmach
(defun sc:sext (str)
  (sc:extadd nil (mapcar (function (lambda (prt / box)
                                     (setq box (sc:g prt "BOX"))
                                     (list (sc:g prt "BID") (car box) (caddr box))))
                         (sc:g str "PARTS"))))

;; zasieg czesci (listy stringow)
(defun sc:pext (strs / ext str)
  (foreach str strs (setq ext (sc:extadd ext (sc:g str "EXT"))))
  ext)

;; zwartosc czesci: obwod^2 / (16 * pole) jej obrysu wg rzedow, we
;; wspolrzednych (X / *SC-ASPECT*, Y) - 1.0 = kwadrat; sasiednie rzedy bez
;; wspolnego odcinka (czesc "zawinieta" przez koniec rzedu) = bardzo duza
(defun sc:compact (ext / itm sp rows row prv bad right left pts nn ii per area pa pb)
  (foreach itm ext
    (if (setq sp (assoc (car itm) *SC-BSPAN*))
      (setq rows (cons (list (/ (cadr itm) *SC-ASPECT*) (/ (caddr itm) *SC-ASPECT*)
                             (cadr sp) (caddr sp))
                       rows))))
  (if (null rows)
    1.0
    (progn
      ;; rzedy od gornego
      (setq rows (sc:msort rows (function (lambda (ra rb) (> (+ (caddr ra) (cadddr ra))
                                                             (+ (caddr rb) (cadddr rb)))))))
      (foreach row rows
        (if (and prv (< (min (cadr row) (cadr prv)) (max (car row) (car prv)))) (setq bad T))
        (setq prv   row
              right (append right (list (list (cadr row) (cadddr row)) (list (cadr row) (caddr row))))
              left  (cons (list (car row) (caddr row)) (cons (list (car row) (cadddr row)) left))))
      (setq pts (append right left) nn (length pts) ii 0 per 0.0 area 0.0)
      (repeat nn
        (setq pa   (nth ii pts)
              pb   (nth (rem (1+ ii) nn) pts)
              per  (+ per (distance pa pb))
              area (+ area (- (* (car pa) (cadr pb)) (* (car pb) (cadr pa))))
              ii   (1+ ii)))
      (setq area (abs (/ area 2.0)))
      (if bad
        1e6
        (max 1e-6 (/ (* per per) (* 16.0 (max area 1e-9))))))))

;; jak bardzo czesc z kc grupami odbiega od dobrego ksztaltu (0 = dobrze);
;; czesc o ksztalcie paska kc grup jest jeszcze dobra
(defun sc:ccost (ext kc)
  (max 0.0 (- (log (sc:compact ext))
              (log (/ (* (+ 1.0 kc) (+ 1.0 kc)) (* 4.0 kc))))))

;; dlugosc, na jakiej dwie czesci zachodza na siebie w tych samych pasmach [m]
(defun sc:overlap (ea eb / ra rb tot)
  (setq tot 0.0)
  (foreach ra ea
    (if (setq rb (assoc (car ra) eb))
      (setq tot (+ tot (max 0.0 (- (min (caddr ra) (caddr rb)) (max (cadr ra) (cadr rb))))))))
  tot)

;; kolejnosc rzedami: pasmo od startu, w pasmie od strony startu
;; (rev = T -> w pasmie od drugiej strony)
(defun sc:ordrows (strs rev / sx)
  (setq sx (if (= *SC-HFROM* "Lewa") 1.0 -1.0))
  (if rev (setq sx (- sx)))
  (sc:msort strs (function (lambda (sa sb)
                             (cond
                               ((< (sc:g sa "AI") (sc:g sb "AI")) T)
                               ((> (sc:g sa "AI") (sc:g sb "AI")) nil)
                               (T (< (* sx (sc:g sa "AX")) (* sx (sc:g sb "AX")))))))))

;; kolejnosc kolumnami: X od strony startu, potem pasmo od startu
(defun sc:ordcols (strs / sx)
  (setq sx (if (= *SC-HFROM* "Lewa") 1.0 -1.0))
  (sc:msort strs (function (lambda (sa sb / xa xb)
                             (setq xa (* sx (sc:g sa "CX")) xb (* sx (sc:g sb "CX")))
                             (cond
                               ((< xa (- xb 0.01)) T)
                               ((> xa (+ xb 0.01)) nil)
                               (T (< (sc:g sa "AI") (sc:g sb "AI"))))))))

;; ciecie wg rodzajow: z kazdego rodzaju pierwsze need stringow kolejnosci
;; ord -> (wziete reszta)
(defun sc:kcut (ord need / left tk rs sx cur)
  (setq left need)
  (foreach sx ord
    (setq cur (assoc (sc:g sx "KIND") left))
    (if (and cur (> (cdr cur) 0))
      (setq tk   (cons sx tk)
            left (subst (cons (car cur) (1- (cdr cur))) cur left))
      (setq rs (cons sx rs))))
  (list (reverse tk) (reverse rs)))

;; ile stringow kazdego rodzaju maja inwertery invs w oryginale, najwyzej
;; tyle, ile jest (avail) -> ((rodzaj . liczba) ...)
(defun sc:need (invs ostrs avail / out kc nn inv)
  (foreach kc avail
    (setq nn 0)
    (foreach inv invs (setq nn (+ nn (sc:quota ostrs inv (car kc)))))
    (setq out (cons (cons (car kc) (min nn (cdr kc))) out)))
  out)

(defun sc:keys (strs) (mapcar (function (lambda (sx) (sc:g sx "KEY"))) strs))

;; dzielenie na pol: stringi strs na inwertery invs (w kolejnosci numerow)
;; -> ((inwerter string ...) ...)
(defun sc:bisect (strs invs ostrs / kk k1 k2 inv1 inv2 avail need1 need2 f0 ord pr pa pb sc bsc best)
  (setq kk (length invs))
  (cond
    ((= kk 1) (list (cons (car invs) strs)))
    ((null strs) (mapcar (function list) invs))
    (T
     (setq k1    (/ (1+ kk) 2)
           k2    (- kk k1)
           inv1  (car (sc:splitn invs k1))
           inv2  (cadr (sc:splitn invs k1))
           avail (sc:kcount (mapcar (function (lambda (sx) (sc:g sx "KIND"))) strs))
           need1 (sc:need inv1 ostrs avail)
           need2 (mapcar (function (lambda (kc) (cons (car kc) (- (cdr kc) (cdr (assoc (car kc) need1))))))
                         avail)
           ;; string przy narozniku startu - musi byc w pierwszej czesci,
           ;; inaczej numeracja nie zaczynalaby sie od naroznika
           f0    (sc:g (car (sc:ordrows strs nil)) "KEY"))
     (foreach ord (list (sc:ordrows strs nil) (sc:ordrows strs T) (sc:ordcols strs))
       (foreach pr (list (sc:kcut ord need1) (reverse (sc:kcut (reverse ord) need2)))
         (setq pa (car pr) pb (cadr pr)
               sc (+ (max (sc:ccost (sc:pext pa) k1) (sc:ccost (sc:pext pb) k2))
                     (* *SC-MIXW* (/ (sc:overlap (sc:pext pa) (sc:pext pb)) *SC-SW*))
                     (if (member f0 (sc:keys pa)) 0.0 100.0)))
         (if (or (null bsc) (< sc (- bsc 1e-9))) (setq bsc sc best pr))))
     (append (sc:bisect (car best) inv1 ostrs) (sc:bisect (cadr best) inv2 ostrs)))))

;; lista -> (pierwsze nn reszta)
(defun sc:splitn (lst nn / hd)
  (repeat nn (setq hd (cons (car lst) hd) lst (cdr lst)))
  (list (reverse hd) lst))

;; przydzial SKUPISKAMI (stringi z kotwicami)
;; -> (stringi gmap nmap liczbaZamian kawalkow suma_odleglosci kawalki)
(defun sc:assignc (strs ostrs oinvs bands amap adj / invorder parts part sx gmap tres nsw nmap keys
                      comps asn wds)
  (setq *SC-BSPAN* (sc:bspans bands amap)
        strs       (mapcar (function (lambda (sx) (sc:s sx "EXT" (sc:sext sx)))) strs))
  ;; typowa dlugosc stringu (kara za zachodzenie czesci liczona w stringach)
  (foreach sx strs
    (setq wds (cons (apply (function +) (mapcar (function (lambda (itm) (- (caddr itm) (cadr itm))))
                                                (sc:g sx "EXT")))
                    wds)))
  (setq *SC-SW*  (max 1.0 (if wds (sc:median wds) 1.0))
        invorder (mapcar (function car) oinvs)
        parts    (sc:bisect strs invorder ostrs)
        nsw      0)
  (foreach part parts
    (foreach sx (cdr part) (setq gmap (cons (cons (sc:g sx "KEY") (car part)) gmap))))
  (setq asn (vl-remove-if-not (function (lambda (sx) (assoc (sc:g sx "KEY") gmap))) strs))
  (if (> (length invorder) 1)
    (setq tres (sc:tidy asn gmap (sc:twins asn) adj)
          gmap (car tres)
          nsw  (cdr tres)))
  (setq nmap  (sc:number asn gmap ostrs invorder)
        keys  (sc:keys asn)
        comps (sc:comps keys gmap adj))
  (list strs gmap nmap nsw (length comps) (sc:spread asn gmap) comps))

;; raport grup + kontrola "grupa w kilku kawalkach" i "daleko od grupy"
(defun sc:groupinfo (strs gmap invorder amap comps / inv mine sx ais x1 x2 cx cy dds md dd kc nb
                        pcs big cmp kx ky)
  (setq nb (length amap))
  (foreach inv invorder
    ;; kawalki grupy: najwiekszy zostaje, pozostale do sprawdzenia
    (setq pcs nil big nil)
    (foreach cmp comps (if (= (car cmp) inv) (setq pcs (cons (cadr cmp) pcs))))
    (foreach cmp pcs (if (or (null big) (> (length cmp) (length big))) (setq big cmp)))
    (if (> (length pcs) 1)
      (foreach cmp pcs
        (if (not (eq cmp big))
          (progn
            (setq kx 0.0 ky 0.0)
            (foreach sx strs
              (if (member (sc:g sx "KEY") cmp)
                (setq kx (+ kx (sc:g sx "CX")) ky (+ ky (sc:g sx "CY")))))
            (sc:chk (strcat inv ": " (itoa (length cmp)) " string(i) oddzielone od reszty grupy"
                            " (grupa w " (itoa (length pcs)) " kawalkach) - sprawdz, czy tak moze"
                            " zostac, albo zmien strone startu / uklad grup (Skupiska / Pasy,"
                            " liczba rzedow na grupe)")
                    (/ kx (length cmp)) (/ ky (length cmp)))))))
    (setq mine nil ais nil x1 nil x2 nil cx 0.0 cy 0.0 dds nil)
    (foreach sx strs
      (if (= (cdr (assoc (sc:g sx "KEY") gmap)) inv) (setq mine (cons sx mine))))
    (foreach sx mine
      (foreach dd (sc:g sx "BIDS")
        (if (not (member (cdr (assoc dd amap)) ais)) (setq ais (cons (cdr (assoc dd amap)) ais))))
      (foreach dd (sc:g sx "PARTS")
        (if (or (null x1) (< (car (sc:g dd "BOX")) x1)) (setq x1 (car (sc:g dd "BOX"))))
        (if (or (null x2) (> (caddr (sc:g dd "BOX")) x2)) (setq x2 (caddr (sc:g dd "BOX")))))
      (setq cx (+ cx (sc:g sx "CX")) cy (+ cy (sc:g sx "CY"))))
    (if mine
      (progn
        (setq cx (/ cx (length mine)) cy (/ cy (length mine))
              ais (sc:msort ais (function <))
              kc (sc:kcount (mapcar (function (lambda (sz) (sc:g sz "KIND"))) mine)))
        (sc:info (strcat "  " inv ": " (itoa (length mine)) " stringow (" (sc:kindtxt kc)
                         "), rzedy stolow " (itoa (1+ (car ais))) "-" (itoa (1+ (last ais)))
                         " z " (itoa nb) " (liczac od " (if (= *SC-VFROM* "Gory") "gory" "dolu")
                         "), szerokosc ~" (rtos (- x2 x1) 2 0) " m"))
        (foreach sx mine
          (setq dds (cons (distance (list cx cy) (list (sc:g sx "CX") (sc:g sx "CY"))) dds)))
        (setq md (sc:median dds))
        (foreach sx mine
          (setq dd (distance (list cx cy) (list (sc:g sx "CX") (sc:g sx "CY"))))
          (if (and (> dd (* *SC-FARK* md)) (> dd *SC-FARMIN*))
            (sc:chk (strcat "\"" (sc:g sx "TEXT") "\" -> " inv ": lezy daleko od swojej grupy ("
                            (rtos dd 2 0) " m od srodka, mediana " (rtos md 2 0)
                            " m) - zwykle za malo stringow tego rodzaju (" (sc:g sx "KIND")
                            ") przy grupie")
                    (sc:g sx "CX") (sc:g sx "CY"))))))))

;; plan zapisu -> (napisy kreskowania); napis = (ename nowy stary x y),
;; kreskowanie = (ename spec x y inwerter)
(defun sc:mkplan (strs nmap oinvs partial / labplan hatplan hmap str orec inv spec lab ntxt hen cur conf
                     unl)
  (foreach str strs
    (setq orec (cdr (assoc (sc:g str "KEY") nmap))
          inv  (nth 1 orec)
          spec (caddr (assoc inv oinvs)))
    ;; tryb Dopasuj: string bez numeru -> napis XX-XX-XX, kreskowanie biale
    (if (and (null orec) partial)
      (setq orec (list "XX-XX-XX" "XX" 0 "XX-XX-XX" (sc:g str "KIND") nil)
            inv  "XX"
            spec (list 7 nil nil)))
    (if (null orec)
      ;; nie powinno sie zdarzyc po kontroli zestawu - zabezpieczenie
      (sc:err (strcat "\"" (sc:g str "TEXT") "\": nie dostal numeru z oryginalu - NIE zmieniony")
              (sc:g str "CX") (sc:g str "CY"))
      (progn
        (if (= inv "XX")
          (sc:chk (strcat "\"" (sc:g str "TEXT") "\" (" (sc:g str "KIND") "): nadmiarowy - bez numeru"
                          " z oryginalu -> napis XX-XX-XX, kreskowanie biale"
                          (if (> (length (sc:g str "LABS")) 1)
                            (strcat " (ten sam napis na " (itoa (length (sc:g str "LABS")))
                                    " napisach - moze to kilka stringow?)")
                            ""))
                  (sc:g str "CX") (sc:g str "CY")))
        (foreach lab (sc:g str "LABS")
          (setq ntxt (if (= inv "XX") "XX-XX-XX" (sc:newtext (nth 1 lab) (nth 6 lab) (nth 3 orec))))
          (setq labplan (cons (list (nth 0 lab) ntxt (nth 1 lab) (nth 3 lab) (nth 4 lab)) labplan)))
        (foreach hen (sc:g str "HATS")
          (setq cur (assoc hen hmap))
          (cond
            ((null cur)
             (setq hmap (cons (list hen inv spec (sc:g str "CX") (sc:g str "CY")) hmap)))
            ((/= (cadr cur) inv)
             (if (not (member hen conf))
               (progn
                 (setq conf (cons hen conf))
                 (sc:err (strcat "jedno kreskowanie nalezy do stringow dwoch inwerterow (" (cadr cur)
                                 " i " inv ") - kolor NIE zmieniony, rozdziel kreskowanie")
                         (nth 3 cur) (nth 4 cur))))))))))
  ;; tryb Dopasuj: kreskowania bez napisu -> biale
  (if partial
    (foreach unl *SC-UNL*
      (if (not (assoc (car unl) hmap))
        (progn
          (setq hmap (cons (list (car unl) "XX" (list 7 nil nil) (cadr unl) (caddr unl)) hmap))
          (sc:chk "kreskowanie bez napisu -> kolor bialy" (cadr unl) (caddr unl))))))
  (foreach cur hmap
    (if (not (member (car cur) conf))
      (setq hatplan (cons (list (car cur) (caddr cur) (nth 3 cur) (nth 4 cur) (cadr cur)) hatplan))))
  (list (reverse labplan) hatplan))

;; CSV planu -> T / nil
(defun sc:plancsv (path strs gmap nmap / fh srt str orec)
  (if (setq fh (open path "w"))
    (progn
      (write-line "Inwerter;NowyString;StaryNapis;Rodzaj;Panele;Pasmo;X;Y;Kreskowan;Napisow" fh)
      (setq srt (sc:msort (vl-remove-if-not (function (lambda (sx) (assoc (sc:g sx "KEY") nmap))) strs)
                          (function (lambda (sa sb)
                                      (sc:infless (nth 5 (cdr (assoc (sc:g sa "KEY") nmap)))
                                                  (nth 5 (cdr (assoc (sc:g sb "KEY") nmap))))))))
      (foreach str srt
        (setq orec (cdr (assoc (sc:g str "KEY") nmap)))
        (write-line (strcat (sc:csvfld (nth 1 orec)) ";" (sc:csvfld (nth 3 orec)) ";"
                            (sc:csvfld (sc:g str "TEXT")) ";" (sc:g str "KIND") ";"
                            (itoa (sc:g str "PAN")) ";" (itoa (1+ (sc:g str "AI"))) ";"
                            (sc:num (sc:g str "CX") 2) ";" (sc:num (sc:g str "CY") 2) ";"
                            (itoa (length (sc:g str "HATS"))) ";" (itoa (length (sc:g str "LABS"))))
                    fh))
      ;; nadmiarowe (tryb Dopasuj)
      (foreach str strs
        (if (null (assoc (sc:g str "KEY") nmap))
          (write-line (strcat "\"XX\";\"XX-XX-XX\";" (sc:csvfld (sc:g str "TEXT")) ";" (sc:g str "KIND") ";"
                              (itoa (sc:g str "PAN")) ";" (itoa (1+ (sc:g str "AI"))) ";"
                              (sc:num (sc:g str "CX") 2) ";" (sc:num (sc:g str "CY") 2) ";"
                              (itoa (length (sc:g str "HATS"))) ";" (itoa (length (sc:g str "LABS"))))
                      fh)))
      (close fh)
      T)
    nil))

;; tekst skrocony do raportu
(defun sc:short (txt) (if (> (strlen txt) 40) (strcat (substr txt 1 37) "...") txt))

;; zapis w jednym UNDO + kontrola po zapisie -> (napisow kreskowan)
(defun sc:write (doc labplan hatplan / lp hp el wfail nl nh)
  (vla-startundomark doc)
  (setq *SC-UNDO* T)
  (foreach lp labplan
    (setq el (entget (car lp)))
    (cond
      ((sc:locked (cdr (assoc 8 el)))
       (setq wfail (cons (car lp) wfail))
       (sc:err (strcat "napis \"" (sc:short (nth 2 lp)) "\": warstwa \"" (cdr (assoc 8 el))
                       "\" zablokowana - NIE zmieniony")
               (nth 3 lp) (nth 4 lp)))
      ((null (entmod (subst (cons 1 (cadr lp)) (assoc 1 el) el)))
       (setq wfail (cons (car lp) wfail))
       (sc:err (strcat "napis \"" (sc:short (nth 2 lp)) "\": entmod odrzucil zmiane - NIE zmieniony")
               (nth 3 lp) (nth 4 lp)))
      (T (entupd (car lp)))))
  (foreach hp hatplan
    (setq el (entget (car hp)))
    (cond
      ((sc:locked (cdr (assoc 8 el)))
       (setq wfail (cons (car hp) wfail))
       (sc:err (strcat "kreskowanie (" (nth 4 hp) "): warstwa \"" (cdr (assoc 8 el))
                       "\" zablokowana - kolor NIE zmieniony")
               (nth 2 hp) (nth 3 hp)))
      ((null (entmod (sc:setcolor el (cadr hp))))
       (setq wfail (cons (car hp) wfail))
       (sc:err (strcat "kreskowanie (" (nth 4 hp) "): entmod odrzucil zmiane - kolor NIE zmieniony")
               (nth 2 hp) (nth 3 hp)))
      (T (entupd (car hp)))))
  (vla-endundomark doc)
  (setq *SC-UNDO* nil)
  ;; kontrola po zapisie: ponowny odczyt z rysunku
  (setq nl 0 nh 0)
  (foreach lp labplan
    (cond
      ((= (cdr (assoc 1 (entget (car lp)))) (cadr lp)) (setq nl (1+ nl)))
      ((not (member (car lp) wfail))
       (sc:err (strcat "napis \"" (sc:short (nth 2 lp)) "\": po zapisie tekst inny niz w planie")
               (nth 3 lp) (nth 4 lp)))))
  (foreach hp hatplan
    (cond
      ((sc:colok (entget (car hp)) (cadr hp)) (setq nh (1+ nh)))
      ((not (member (car hp) wfail))
       (sc:err (strcat "kreskowanie (" (nth 4 hp) "): po zapisie kolor inny niz w planie")
               (nth 2 hp) (nth 3 hp)))))
  (list nl nh))

(defun c:STRPASTE ( / *error* doc dflt csvp data ometa oinvs ostrs bad pa lablay tlays res
                      strs okc nkc ok ans hdef hrows asg gmap nmap nsw amap plan ppath wr
                      adj evals hh minp best etxt ev partial shown nunused orec
                      xtra xkeys kc on sur lst gaps kd nn xs sidesok bilp alls)
  (defun *error* (msg)
    (if (and doc *SC-UNDO*) (progn (vla-endundomark doc) (setq *SC-UNDO* nil)))
    (if (and msg (not (wcmatch (strcase msg) "*BREAK*,*CANCEL*,*EXIT*,*ANUL*")))
      (princ (strcat "\nSTRPASTE - blad: " msg)))
    (princ))
  (setq doc (vla-get-activedocument (vlax-get-acad-object)))
  (sc:reset)
  (princ "\n=== STRPASTE: stringi z pliku STRCOPY -> NOWY obszar ===")
  (setq dflt (getenv "STRCOPY_CSV"))
  (if (= dflt "") (setq dflt nil))
  (setq csvp (getfiled "Plik z danymi STRCOPY (CSV)"
                       (if dflt dflt (getvar "DWGPREFIX")) "csv" 0))
  (cond
    ((null csvp) (princ "\nNie wybrano pliku. Koniec."))
    ((sc:g (setq data (sc:readcsv csvp)) "ERR")
     (princ (strcat "\n" (sc:g data "ERR") ". Koniec.")))
    ((null (sc:g data "STRS"))
     (princ "\nW pliku nie ma stringow (wierszy STR) - to nie jest plik STRCOPY? Koniec."))
    ((setq bad (sc:csvcheck data))
     (princ (strcat "\nPlik niepoprawny: " bad ". Koniec.")))
    (T
     (setq ometa (sc:g data "META") oinvs (sc:g data "INVS") ostrs (sc:g data "STRS"))
     (setq oinvs (sc:msort oinvs (function (lambda (ia ib) (sc:infless (cadr ia) (cadr ib))))))
     (setq okc (sc:kcount (mapcar (function (lambda (orec) (nth 4 orec))) ostrs)))
     (princ (strcat "\nPlik: " csvp
                    "\n  stringow: " (itoa (length ostrs)) ", inwerterow: " (itoa (length oinvs))
                    " (" (sc:kindtxt okc) ")"))
     (sc:info (strcat "Plik STRCOPY: " csvp))
     (if (sc:g ometa "ZRODLO") (sc:info (strcat "  oryginal: " (sc:g ometa "ZRODLO"))))
     (sc:info (strcat "  stringow: " (itoa (length ostrs)) " (" (sc:kindtxt okc) "), inwerterow: "
                      (itoa (length oinvs))
                      (if (> (sc:g data "NBAD") 0)
                        (strcat ", wierszy nieczytelnych: " (itoa (sc:g data "NBAD")))
                        "")))
     (cond
       ((null (setq pa (sc:askpoly "\nWskaz POLILINIE NOWEGO obszaru (przeniesione stoly): ")))
        (princ "\nNie wskazano polilinii obszaru. Koniec."))
       ((null (setq lablay (sc:asklab "\nWskaz przykladowy napis stringu w nowym obszarze: ")))
        (princ "\nNie wskazano napisu. Koniec."))
       ((null (setq tlays (sc:asktabs)))
        (princ "\nNie wskazano bloku stolu. Koniec."))
       (T
        (setq res  (sc:readarea (car pa) (cadr pa) lablay tlays nil
                                (if *SC-PANELW* *SC-PANELW* (sc:tonum (sc:g ometa "SZEROKOSC_PANELU"))))
              strs (sc:g res "STRS"))
        (setq nkc (sc:kcount (mapcar (function (lambda (sx) (sc:g sx "KIND"))) strs)))
        (sc:info (strcat "Nowy obszar: stringow " (itoa (length strs)) " (" (sc:kindtxt nkc) ")"))
        (setq ok (sc:setcheck okc nkc strs) partial nil shown nil)
        (if *SC-ERRS* (setq ok nil))
        ;; tylko bledy "miekkie" (zestaw / kreskowanie bez napisu): mozna
        ;; dopasowac tyle, ile sie da; reszta -> XX-XX-XX i kolor bialy
        (if (and (not ok) strs (= (length *SC-ERRS*) *SC-NSOFT*))
          (progn
            ;; strona startu juz teraz - bilans pokazuje konkretne niepotrzebne miejsca
            (sc:asksides)
            (setq sidesok T
                  amap (sc:actbands strs (sc:g res "BANDS")))
            (sc:bilans okc nkc (sc:pickxtra (sc:anchors strs amap) okc nkc))
            (if (setq bilp (sc:bilcsv)) (sc:info (strcat "Bilans miejsc zapisany: " bilp)))
            (sc:report "STRPASTE")
            (setq shown T)
            (initget "Przerwij Dopasuj")
            (setq ans (getkword (strcat "\n\nZestaw sie nie zgadza. Dopasuj = numery z oryginalu dostana"
                                        " stringi pasujace rodzajem, nadmiarowe -> napis XX-XX-XX i kolor"
                                        " bialy (kreskowania bez napisu tez biale)."
                                        "\n[Przerwij/Dopasuj] <Przerwij>: ")))
            (if (= ans "Dopasuj")
              (setq partial T ok T
                    ;; rozbieznosci zestawu zostaja w raporcie jako uwagi
                    *SC-CHKS* (append *SC-ERRS* (vl-remove-if
                                                  (function (lambda (msg)
                                                              (vl-string-search "rodzaj, ktorego liczba" msg)))
                                                  *SC-CHKS*))
                    *SC-ERRS* nil *SC-CIRCS* nil *SC-NSOFT* 0))))
        (cond
          ((not ok)
           (if (not shown) (sc:report "STRPASTE"))
           (princ "\n\nNIC nie zostalo zmienione - popraw BLEDY i uruchom STRPASTE ponownie."))
          (T
           ;; --- pytania (gdy juz padly przy bilansie - bez powtorki) ---
           (if (not sidesok) (sc:asksides))
           ;; --- kotwice, sasiedztwo; ocena kazdej liczby rzedow na grupe:
           ;;     najmniej kawalkow grup, przy remisie liczba z oryginalu, potem
           ;;     najmniejsza suma odleglosci od srodkow grup ---
           (setq amap (sc:actbands strs (sc:g res "BANDS"))
                 strs (sc:anchors strs amap)
                 xtra nil)
           ;; --- tryb Dopasuj: nadmiarowe stringi wybierane PRZED ukladaniem -
           ;;     w kazdym rodzaju te OSTATNIE od strony startu (start od dolu ->
           ;;     nadmiar na gorze), zeby po drodze nie zostaly wolne (biale)
           ;;     miejsca; rodzaj nieobecny w oryginale - caly nadmiarowy.
           ;;     Liczba i dlugosc stringow z oryginalu bez zmian. ---
           (if partial
             (progn
               (foreach kc nkc
                 (setq on  (cdr (assoc (car kc) okc))
                       sur (- (cdr kc) (if on on 0)))
                 (if (> sur 0)
                   (progn
                     (setq lst (vl-remove-if-not (function (lambda (sx) (= (sc:g sx "KIND") (car kc))))
                                                 strs)
                           lst (reverse (sc:msort lst (function sc:readless))))
                     (repeat sur
                       (setq xtra (cons (car lst) xtra) lst (cdr lst))))))
               (setq alls  strs
                     xkeys (mapcar (function (lambda (sx) (sc:g sx "KEY"))) xtra)
                     strs  (vl-remove-if (function (lambda (sx) (member (sc:g sx "KEY") xkeys))) strs))
               ;; bialy string PRZED stringiem z numerem (od strony startu) =
               ;; wolne miejsce po drodze -> NIEMOZLIWE, nic nie zmieniane
               (setq gaps (vl-remove-if-not
                            (function (lambda (xs) (vl-some (function (lambda (ms) (sc:readless xs ms))) strs)))
                            xtra))
               (if gaps
                 (progn
                   (setq *SC-ERRS* nil *SC-CIRCS* nil)
                   (foreach xs gaps
                     (setq kd (sc:g xs "KIND") on (cdr (assoc kd okc)) nn (cdr (assoc kd nkc)))
                     (sc:err (strcat "\"" (sc:g xs "TEXT") "\" " kd " w rzedzie stolow "
                                     (itoa (1+ (sc:g xs "AI"))) " (liczac od "
                                     (if (= *SC-VFROM* "Gory") "gory" "dolu") "): "
                                     (if (null on)
                                       (strcat "rodzaju " kd " NIE MA w oryginale"
                                               (if (> (length (sc:g xs "LABS")) 1)
                                                 (strcat " - ten sam napis na "
                                                         (itoa (length (sc:g xs "LABS")))
                                                         " napisach laczy kilka stringow, nadaj im rozne napisy")
                                                 ""))
                                       (strcat "w nowym obszarze " (itoa nn) " stringow " kd
                                               ", w oryginale " (itoa on) " - nadmiar tego rodzaju lezy"
                                               " przed stringami z numerami (dlugosci stringow sie nie zmienia)")))
                             (sc:g xs "CX") (sc:g xs "CY")))
                   ;; propozycja nowego ustawienia (CSV), rysunek bez zmian
                   (setq hdef (sc:toint (sc:g ometa "RZEDY_NA_GRUPE")))
                   (if (or (null hdef) (< hdef 1)) (setq hdef 2))
                   (sc:proposal alls ostrs oinvs okc hdef)
                   (sc:report "STRPASTE")
                   (princ (strcat "\n\nNIEMOZLIWE bez wolnych (bialych) miejsc po drodze - "
                                  (itoa (length gaps)) " nadmiarowych stringow lezy przed koncem obszaru"
                                  " (lista w BLEDY, propozycja nowego ustawienia w BILANSIE)."))
                   (initget "Tak Nie")
                   (setq ans (getkword (strcat "\nRysowac MIMO TO (biale stringi zostana po drodze, bledy"
                                               " zostaja w raporcie)? [Tak/Nie] <Nie>: ")))
                   (if (/= ans "Tak")
                     (progn
                       (princ (strcat "\nRysunek NIE zostal zmieniony. Popraw napisy / uklad stolow"
                                      " (patrz propozycja CSV) albo zacznij od drugiej strony."))
                       (sc:askcircles)
                       (exit))
                     (princ "\nRysuje mimo bialych stringow po drodze - bledy zostaja w raporcie."))))))
           (setq adj  (sc:adjacency strs (sc:nbdist strs))
                 hdef (sc:toint (sc:g ometa "RZEDY_NA_GRUPE")))
           (if (or (null hdef) (< hdef 1)) (setq hdef 2))
           ;; --- uklad grup: Skupiska = podzial obszaru na pol (jak INWERTERY),
           ;;     Pasy = pasy po N rzedow stolow przegladane kolumnami ---
           (initget "Skupiska Pasy")
           (setq ans (getkword (strcat "\nUklad grup inwerterow [Skupiska/Pasy] <" *SC-MODE* ">: ")))
           (if ans (setq *SC-MODE* ans))
           (if (= *SC-MODE* "Skupiska")
             (progn
               (princ "\nUkladam grupy inwerterow (skupiska)...")
               (setq asg (sc:assignc strs ostrs oinvs (sc:g res "BANDS") amap adj) hrows nil)
               (princ (strcat " kawalkow grup: " (itoa (nth 4 asg)) ", suma odleglosci od srodkow: "
                              (rtos (nth 5 asg) 2 0) " m")))
             (progn
               (princ "\nUkladam grupy inwerterow (pasy)")
               (setq evals nil hh 1)
               ;; najwyzej 12 wariantow (duze obszary: kazdy wariant to pelne ukladanie)
               (while (<= hh (min 12 (length amap)))
                 (princ ".")
                 (setq evals (cons (cons hh (sc:assign strs ostrs oinvs hh adj)) evals)
                       hh    (1+ hh)))
               (setq evals (reverse evals) minp nil best nil etxt nil)
               (foreach ev evals (if (or (null minp) (< (nth 5 ev) minp)) (setq minp (nth 5 ev))))
               (foreach ev evals
                 (if (and (= (car ev) (min hdef (length amap) 12)) (= (nth 5 ev) minp)) (setq best ev)))
               (if (null best)
                 (foreach ev evals
                   (if (and (= (nth 5 ev) minp) (or (null best) (< (nth 6 ev) (nth 6 best))))
                     (setq best ev))))
               (foreach ev evals
                 (setq etxt (cons (strcat (itoa (car ev)) " -> " (itoa (nth 5 ev)) " kaw. / "
                                          (rtos (nth 6 ev) 2 0) " m")
                                  etxt)))
               (setq etxt (sc:join (reverse etxt) "; "))
               (princ (strcat "\n  Rzedow na grupe -> kawalkow grup / suma odleglosci od srodkow: " etxt))
               (initget 6)
               (setq hrows (getint (strcat "\nRzedow stolow na grupe jednego inwertera (oryginal: "
                                           (itoa hdef) ", najzwartsze grupy: " (itoa (car best))
                                           ") <" (itoa (car best)) ">: ")))
               (if (null hrows) (setq hrows (car best)))
               ;; --- przydzial wybrany (wartosc spoza ocenionych: ulozony teraz) ---
               (setq asg (cdr (assoc (min hrows (length amap)) evals)))
               (if (null asg) (setq asg (sc:assign strs ostrs oinvs (min hrows (length amap)) adj)))))
           (setq strs (append (nth 0 asg) xtra) gmap (nth 1 asg) nmap (nth 2 asg) nsw (nth 3 asg))
           (sc:info (strcat "Numeracja od strony: " *SC-HFROM* ", pierwsze rzedy od: " *SC-VFROM*
                            (if hrows
                              (strcat ", uklad grup: pasy, rzedow stolow na grupe: " (itoa hrows)
                                      " (oryginal: " (itoa hdef) ")")
                              ", uklad grup: skupiska (podzial obszaru na pol, jak INWERTERY)")
                            "; rzedow stolow ze stringami: " (itoa (length amap))))
           (if hrows
             (sc:info (strcat "Ocena (rzedow na grupe -> kawalkow grup / suma odleglosci od srodkow): "
                              etxt)))
           (sc:info (strcat "Grupy inwerterow: " (itoa (length oinvs)) ", kawalkow grup: "
                            (itoa (nth 4 asg)) ", zamian przy porzadkowaniu: " (itoa nsw)))
           (sc:groupinfo strs gmap (mapcar (function car) oinvs) amap (nth 6 asg))
           (setq plan (sc:mkplan strs nmap oinvs partial))
           ;; numery z oryginalu, ktore nie trafily do nowego obszaru
           ;; brakujace miejsca (numery bez stringu) do bilansu + CSV bilansu
           (setq nunused (sc:bilmissing ostrs nmap))
           (if (and *SC-BIL* (setq bilp (sc:bilcsv)))
             (sc:info (strcat "Bilans miejsc zapisany: " bilp)))
           (if partial
             (sc:info (strcat "Tryb Dopasuj: stringow z numerem " (itoa (length nmap))
                              ", nadmiarowych (XX-XX-XX, bialy) "
                              (itoa (- (length strs) (length nmap)))
                              ", numerow z oryginalu nieuzytych " (itoa nunused))))
           (sc:info (strcat "Do zmiany: napisow " (itoa (length (car plan)))
                            ", kreskowan (kolor) " (itoa (length (cadr plan)))))
           (setq ppath (strcat (getvar "DWGPREFIX") (sc:noext (getvar "DWGNAME")) "_strpaste.csv"))
           (if (sc:plancsv ppath strs gmap nmap)
             (sc:info (strcat "Plan zapisany: " ppath))
             (sc:chk (strcat "nie mozna zapisac planu " ppath " (otwarty w Excelu?)") nil nil))
           (sc:report "STRPASTE")
           (initget "Tak Nie")
           (setq ans (getkword (strcat "\n\nZapisac zmiany (" (itoa (length (car plan))) " napisow, "
                                       (itoa (length (cadr plan))) " kreskowan)? [Tak/Nie] <Tak>: ")))
           (if (= ans "Nie")
             (princ "\nRysunek bez zmian.")
             (progn
               (setq wr (sc:write doc (car plan) (cadr plan)))
               (princ (strcat "\nZmieniono napisow: " (itoa (car wr)) " z " (itoa (length (car plan)))
                              ", kreskowan: " (itoa (cadr wr)) " z " (itoa (length (cadr plan)))
                              " (potwierdzone kontrola po zapisie; cofniecie: jedno U)."))
               (if (or (< (car wr) (length (car plan))) (< (cadr wr) (length (cadr plan))))
                 (sc:print "BLEDY ZAPISU" *SC-ERRS*))))))
        (sc:askcircles)))))
  (princ))

(princ "\nSTRCOPY.lsp wczytany. Polecenia: STRCOPY (w oryginale -> CSV), STRPASTE (w nowym rysunku)")
(princ)
