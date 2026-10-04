"""Generuje oswietlenie.dxf (R12, jednostki: cm, poczatek = wewnetrzny naroznik
lewa sciana / sciana z oknem po stronie podlogi; os Y w gore od sciany przy prysznicu)."""
H = 364.5  # glebokosc lazienki - y z rzutu (od okna) przeliczany na y DXF
W = 332.5

out = []
def e(*pairs):
    for code, val in pairs:
        out.append(f"{code}\n{val}")

def line(layer, x1, y1, x2, y2):
    e((0, "LINE"), (8, layer), (10, x1), (20, H - y1), (11, x2), (21, H - y2))

def rect(layer, x, y, w, h):
    for a, b, c, d in [(x, y, x + w, y), (x + w, y, x + w, y + h), (x + w, y + h, x, y + h), (x, y + h, x, y)]:
        line(layer, a, b, c, d)

def circle(layer, x, y, r):
    e((0, "CIRCLE"), (8, layer), (10, x), (20, H - y), (40, r))

def text(layer, x, y, s, h=6):
    e((0, "TEXT"), (8, layer), (10, x), (20, H - y), (40, h), (1, s),
      (72, 1), (73, 2), (11, x), (21, H - y))

LAYERS = {"SCIANY": 8, "WYPOSAZENIE": 9, "OSWIETLENIE": 30, "NASTROJ": 6,
          "GLOSNIK": 5, "WYWIEW": 4, "WYMIARY": 7}
e((0, "SECTION"), (2, "TABLES"), (0, "TABLE"), (2, "LAYER"), (70, len(LAYERS)))
for name, col in LAYERS.items():
    e((0, "LAYER"), (2, name), (70, 0), (62, col), (6, "CONTINUOUS"))
e((0, "ENDTAB"), (0, "ENDSEC"), (0, "SECTION"), (2, "ENTITIES"))

# obrys pomieszczenia, okno, drzwi
rect("SCIANY", 0, 0, W, H)
line("SCIANY", 102, -3, 280, -3); text("SCIANY", 191, -14, "OKNO")
line("SCIANY", W, 259, W + 80, 259); text("SCIANY", W + 40, 350, "WEJSCIE")
# wyposazenie
rect("WYPOSAZENIE", 26, 31.5, 178, 77.5); text("WYPOSAZENIE", 115, 70, "WANNA", 10)
rect("WYPOSAZENIE", 288, 31.5, 44.5, 215.5)
rect("WYPOSAZENIE", 296, 58, 26, 30); rect("WYPOSAZENIE", 296, 176, 26, 30)
rect("WYPOSAZENIE", 0, 156, 22, 50); rect("WYPOSAZENIE", 22, 163, 50, 36)
text("WYPOSAZENIE", 25, 222, "WC")
rect("WYPOSAZENIE", 5, 288, 132, 70.5); text("WYPOSAZENIE", 104, 352, "PRYSZNIC")
# oswietlenie glowne i prysznic
for tag, x, y in [("L1", 245, 73), ("L2", 245, 191), ("L3", 245, 309),
                  ("L4", 120, 191), ("L5", 71, 323)]:
    circle("OSWIETLENIE", x, y, 10); text("OSWIETLENIE", x, y, tag)
# swiatlo przy lustrach (pasy na scianie po bokach luster)
for y in (38, 108, 156, 226):
    rect("OSWIETLENIE", 326.5, y - 2, 6, 4)
text("OSWIETLENIE", 312, 132, "M")
# nastrojowe
line("NASTROJ", 26, 6, 204, 6); text("NASTROJ", 115, 18, "A")
line("NASTROJ", 284.5, 31.5, 284.5, 247); text("NASTROJ", 276, 258, "A")
# glosnik, wywiew
circle("GLOSNIK", 182.5, 250, 10); text("GLOSNIK", 182.5, 250, "G")
circle("WYWIEW", 55, 250, 10); text("WYWIEW", 55, 250, "W")

e((0, "ENDSEC"), (0, "EOF"))
open("oswietlenie.dxf", "w", newline="\r\n").write("\n".join(out) + "\n")
print("zapisano oswietlenie.dxf")
