#!/usr/bin/env python3
"""
Generates the Max Intensity anatomy plates as engraving-style SVGs.

Why generated: the real 19th-century plates (Bourgery & Jacob, Krause,
Vesalius) are public domain, but they must be downloaded from Wellcome
Collection or Wikimedia Commons, and this build environment could not reach
either host. These plates copy the engraving language — contour lines and
directional cross-hatching, one ink, no fills — so the layer ships working.
Drop a real plate in with the same filename and the app picks it up unchanged.
See CREDITS.md.

Each plate is one ink (#F2EFE8) on a transparent ground. The app applies the
bone/red duotone with a CSS mask, so only the alpha channel matters.

Run:  python3 assets/anatomy/make-plates.py
"""
import math, os

INK = "#F2EFE8"
OUT = os.path.dirname(os.path.abspath(__file__))

ANGLES = [0, 20, 40, 60, 80, 100, 120, 140, 160]


def defs():
    out = ["<defs>"]
    for sp, tag in ((3.2, "d"), (5.5, "m"), (9, "l")):
        for a in ANGLES:
            out.append(
                f'<pattern id="h{tag}{a}" patternUnits="userSpaceOnUse" width="{sp}" height="{sp}" patternTransform="rotate({a})">'
                f'<line x1="0" y1="0" x2="0" y2="{sp}" stroke="{INK}" stroke-width="0.7"/></pattern>'
            )
    # cross-hatch for the darkest tone
    out.append(
        f'<pattern id="xh" patternUnits="userSpaceOnUse" width="4" height="4">'
        f'<line x1="0" y1="0" x2="0" y2="4" stroke="{INK}" stroke-width="0.6"/>'
        f'<line x1="0" y1="0" x2="4" y2="0" stroke="{INK}" stroke-width="0.6"/></pattern>'
    )
    out.append("</defs>")
    return "\n".join(out)


def nearest_angle(a):
    a = a % 180
    return min(ANGLES, key=lambda x: abs(x - a))


def shape(d, angle=45, tone="m", stroke=1.1, opacity=1.0, cls=""):
    """A closed path hatched along `angle` with tone d|m|l|x (x = cross)."""
    fill = "url(#xh)" if tone == "x" else f"url(#h{tone}{nearest_angle(angle)})"
    s = f'<path d="{d}" fill="{fill}" stroke="{INK}" stroke-width="{stroke}" stroke-linejoin="round"'
    if opacity != 1.0:
        s += f' opacity="{opacity}"'
    return s + "/>"


def line(d, w=1.0, opacity=1.0, dash=None):
    s = f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"'
    if opacity != 1.0:
        s += f' opacity="{opacity}"'
    if dash:
        s += f' stroke-dasharray="{dash}"'
    return s + "/>"


def ellipse_path(cx, cy, rx, ry, rot=0):
    """Closed ellipse as a path (so it can be hatched like any shape)."""
    pts = []
    for i in range(36):
        t = i / 36 * 2 * math.pi
        x, y = rx * math.cos(t), ry * math.sin(t)
        r = math.radians(rot)
        xr, yr = x * math.cos(r) - y * math.sin(r), x * math.sin(r) + y * math.cos(r)
        pts.append((cx + xr, cy + yr))
    return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + " Z"


def belly(x1, y1, x2, y2, w1, w2, bulge=1.0):
    """A muscle belly: a spindle between two points with widths at each end."""
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy)
    nx, ny = -dy / L, dx / L
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    wm = max(w1, w2) * bulge
    return (
        f"M{x1 + nx * w1:.1f},{y1 + ny * w1:.1f} "
        f"C{mx + nx * wm * 1.3:.1f},{my + ny * wm * 1.3:.1f} {mx + nx * wm * 1.3:.1f},{my + ny * wm * 1.3:.1f} {x2 + nx * w2:.1f},{y2 + ny * w2:.1f} "
        f"L{x2 - nx * w2:.1f},{y2 - ny * w2:.1f} "
        f"C{mx - nx * wm * 1.3:.1f},{my - ny * wm * 1.3:.1f} {mx - nx * wm * 1.3:.1f},{my - ny * wm * 1.3:.1f} {x1 - nx * w1:.1f},{y1 - ny * w1:.1f} Z"
    ), math.degrees(math.atan2(dy, dx))


def fibres(x1, y1, x2, y2, w, n=6, opacity=0.55):
    """Direction lines inside a belly, to sell the striation."""
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy)
    nx, ny = -dy / L, dx / L
    out = []
    for i in range(n):
        t = (i + 0.5) / n - 0.5
        o = t * w * 1.6
        # shorten towards the edges so the lines sit inside the spindle
        k = 1 - abs(t) * 1.3
        ax, ay = x1 + dx * (0.5 - 0.42 * k) + nx * o, y1 + dy * (0.5 - 0.42 * k) + ny * o
        bx, by = x1 + dx * (0.5 + 0.42 * k) + nx * o, y1 + dy * (0.5 + 0.42 * k) + ny * o
        out.append(line(f"M{ax:.1f},{ay:.1f} L{bx:.1f},{by:.1f}", 0.6, opacity))
    return "\n".join(out)


def svg(w, h, body, title):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}">\n'
        f"<title>{title}</title>\n{defs()}\n{body}\n</svg>\n"
    )


def frame(w, h):
    """Plate frame: double rule and a plate number, like a bound atlas."""
    return "\n".join([
        line(f"M18,18 H{w-18} V{h-18} H18 Z", 0.9, 0.7),
        line(f"M26,26 H{w-26} V{h-26} H26 Z", 0.5, 0.5),
    ])


# ------------------------------------------------------------------ skeleton
def skeleton():
    b = [frame(600, 900)]
    # skull
    b.append(shape(ellipse_path(300, 118, 64, 78), 90, "l", 1.3))
    b.append(line("M240,150 C244,178 262,198 300,206 C338,198 356,178 360,150", 1.2))  # jaw
    b.append(shape(ellipse_path(276, 118, 15, 11, -10), 20, "x", 0.8))  # orbits
    b.append(shape(ellipse_path(324, 118, 15, 11, 10), 160, "x", 0.8))
    b.append(shape("M300,128 L291,152 L300,157 L309,152 Z", 90, "d", 0.7))  # nasal
    b.append(line("M270,170 C285,180 315,180 330,170", 1.0))  # teeth line
    for x in range(274, 328, 6):
        b.append(line(f"M{x},170 L{x},178", 0.6, 0.8))
    b.append(line("M236,120 C232,100 240,72 262,58", 0.7, 0.6))  # temporal line
    # cervical spine
    for i in range(5):
        y = 196 + i * 11
        b.append(shape(f"M290,{y} H310 V{y+8} H290 Z", 0, "d", 0.7))
    # clavicles & shoulders
    b.append(line("M300,252 C270,244 232,238 200,246 C190,250 186,258 188,266", 1.6))
    b.append(line("M300,252 C330,244 368,238 400,246 C410,250 414,258 412,266", 1.6))
    b.append(shape(ellipse_path(196, 274, 17, 19), 60, "l", 1.0))  # humeral heads
    b.append(shape(ellipse_path(404, 274, 17, 19), 120, "l", 1.0))
    # sternum
    b.append(shape("M292,258 L308,258 L306,300 L310,392 L300,410 L290,392 L294,300 Z", 90, "m", 1.0))
    # ribs — arcs each side, widening then narrowing
    widths = [70, 92, 106, 114, 118, 116, 108, 96, 82]
    for i, w in enumerate(widths):
        y = 268 + i * 18
        drop = 26 + i * 3
        for sgn in (-1, 1):
            x0 = 300 + sgn * 8
            xe = 300 + sgn * w
            b.append(line(f"M{x0},{y+drop*0.55:.0f} C{x0+sgn*30},{y+drop*0.2:.0f} {xe-sgn*10},{y-6} {xe},{y+drop*0.45:.0f} C{xe+sgn*2},{y+drop*0.8:.0f} {xe-sgn*20},{y+drop+4} {x0+sgn*22},{y+drop:.0f}", 1.15))
            b.append(line(f"M{x0+sgn*4},{y+drop*0.7:.0f} C{x0+sgn*30},{y+drop*0.42:.0f} {xe-sgn*14},{y+4} {xe-sgn*3},{y+drop*0.5:.0f}", 0.5, 0.55))
    # thoracic + lumbar spine
    for i in range(12):
        y = 262 + i * 20
        b.append(shape(f"M291,{y} H309 V{y+13} H291 Z", 0, "d", 0.6, 0.85))
    for i in range(5):
        y = 505 + i * 21
        b.append(shape(f"M286,{y} H314 V{y+15} H286 Z", 0, "d", 0.8))
    # pelvis
    b.append(shape("M300,606 C262,590 218,598 200,632 C186,660 196,700 226,724 C246,740 270,746 288,742 L298,712 L302,712 L312,742 C330,746 354,740 374,724 C404,700 414,660 400,632 C382,598 338,590 300,606 Z", 30, "l", 1.3))
    b.append(shape("M300,612 C312,640 316,672 306,704 L300,714 L294,704 C284,672 288,640 300,612 Z", 90, "d", 0.8))  # sacrum
    b.append(line("M226,724 C236,700 248,690 262,690", 0.7, 0.7))
    b.append(line("M374,724 C364,700 352,690 338,690", 0.7, 0.7))
    # arms
    for sgn, sx in ((-1, 196), (1, 404)):
        ex = sx + sgn * -12
        b.append(shape(belly(sx, 292, ex, 440, 11, 9, 0.9)[0], 88, "l", 1.1))
        b.append(shape(ellipse_path(ex, 446, 16, 11), 0, "l", 0.9))
        b.append(shape(belly(ex - 6 * sgn, 456, ex - 20 * sgn, 596, 6, 5, 0.9)[0], 92, "l", 0.9))
        b.append(shape(belly(ex + 6 * sgn, 456, ex - 8 * sgn, 600, 5, 5, 0.9)[0], 92, "l", 0.9))
        # hand
        hx = ex - 14 * sgn
        b.append(shape(ellipse_path(hx, 626, 16, 22, 10 * sgn), 90, "l", 0.8))
        for k in range(4):
            fx = hx - 12 * sgn + k * 8 * sgn
            b.append(line(f"M{fx},646 L{fx - 2*sgn},692", 0.9))
    # legs
    for sgn, hx in ((-1, 262), (1, 338)):
        b.append(shape(ellipse_path(hx, 736, 18, 16), 45, "l", 1.0))  # femoral head region
        b.append(shape(belly(hx, 750, hx - 8 * sgn, 878, 12, 15, 0.85)[0], 90, "l", 1.2))
    b.append(shape(ellipse_path(254, 896, 15, 12), 0, "l", 0.9))
    b.append(shape(ellipse_path(346, 896, 15, 12), 0, "l", 0.9))
    b.append(line("M60,860 H180", 0.5, 0.5))
    b.append('<text x="60" y="852" font-family="serif" font-size="11" fill="%s" opacity=".6" letter-spacing="2">PL. I · OSSA · ANTERIOR</text>' % INK)
    return svg(600, 900, "\n".join(b), "Skeleton, anterior view")


# ---------------------------------------------------------------------- legs
def legs():
    b = [frame(600, 900)]
    # ---- LEFT: anterior thigh & shank ----
    ox = 160
    b.append(line(f"M{ox-70},60 C{ox-50},90 {ox-40},120 {ox-46},150", 1.0, 0.8))  # iliac crest
    b.append(shape(ellipse_path(ox - 26, 150, 34, 30, -20), 150, "l", 1.0))  # tensor / glute med
    d, a = belly(ox + 4, 140, ox - 48, 300, 14, 12, 1.0); b.append(shape(d, a, "m", 1.0)); b.append(fibres(ox + 4, 140, ox - 48, 300, 14))   # sartorius
    d, a = belly(ox - 6, 170, ox - 2, 440, 22, 14, 1.15); b.append(shape(d, a, "m", 1.2)); b.append(fibres(ox - 6, 170, ox - 2, 440, 22, 8))  # rectus femoris
    d, a = belly(ox - 40, 180, ox - 30, 430, 18, 12, 1.2); b.append(shape(d, a, "d", 1.1)); b.append(fibres(ox - 40, 180, ox - 30, 430, 18))  # vastus lateralis
    d, a = belly(ox + 26, 300, ox + 14, 448, 12, 22, 1.2); b.append(shape(d, a, "d", 1.1)); b.append(fibres(ox + 26, 300, ox + 14, 448, 14))  # vastus medialis
    d, a = belly(ox + 30, 170, ox + 22, 320, 12, 8, 1.0); b.append(shape(d, a, "l", 0.9))  # adductor longus
    b.append(shape(ellipse_path(ox - 4, 470, 20, 24), 0, "l", 1.2))  # patella
    b.append(shape(f"M{ox-22},492 L{ox+14},492 L{ox+10},520 L{ox-18},520 Z", 90, "m", 0.9))  # patellar tendon
    d, a = belly(ox - 14, 522, ox - 30, 760, 14, 7, 1.1); b.append(shape(d, a, "m", 1.1)); b.append(fibres(ox - 14, 522, ox - 30, 760, 14, 7))  # tibialis anterior
    d, a = belly(ox + 18, 530, ox + 22, 700, 12, 6, 1.0); b.append(shape(d, a, "d", 1.0))  # gastroc medial head (seen from front)
    d, a = belly(ox - 40, 526, ox - 44, 690, 8, 5, 1.0); b.append(shape(d, a, "d", 0.9))  # peroneus
    b.append(line(f"M{ox-6},522 C{ox-2},640 {ox-4},720 {ox-10},800", 0.9, 0.9))  # tibial crest
    b.append(shape(f"M{ox-36},790 C{ox-46},812 {ox-40},842 {ox-10},850 C{ox+30},856 {ox+50},840 {ox+40},824 L{ox+12},808 L{ox-4},792 Z", 10, "l", 1.0))  # foot
    # ---- RIGHT: posterior hip, thigh & calf ----
    ox = 420
    b.append(shape(f"M{ox-70},130 C{ox-60},96 {ox-10},92 {ox+30},110 C{ox+64},130 {ox+70},180 {ox+50},226 C{ox+30},260 {ox-30},262 {ox-58},236 C{ox-84},210 {ox-86},160 {ox-70},130 Z", 135, "d", 1.3))  # gluteus maximus
    for k in range(7):
        t = k / 6
        x1, y1 = ox - 62 + t * 40, 132 + t * 70
        x2, y2 = ox - 10 + t * 56, 200 + t * 44
        b.append(line(f"M{x1:.0f},{y1:.0f} L{x2:.0f},{y2:.0f}", 0.6, 0.5))
    d, a = belly(ox - 14, 262, ox - 30, 500, 22, 12, 1.15); b.append(shape(d, a, "m", 1.2)); b.append(fibres(ox - 14, 262, ox - 30, 500, 22, 8))  # biceps femoris
    d, a = belly(ox + 26, 258, ox + 24, 496, 16, 10, 1.15); b.append(shape(d, a, "m", 1.1)); b.append(fibres(ox + 26, 258, ox + 24, 496, 16, 6))  # semitendinosus
    d, a = belly(ox + 52, 300, ox + 44, 500, 10, 10, 1.0); b.append(shape(d, a, "d", 0.9))  # semimembranosus
    d, a = belly(ox - 52, 280, ox - 60, 470, 10, 8, 1.0); b.append(shape(d, a, "l", 0.9))  # vastus lateralis edge
    b.append(shape(ellipse_path(ox - 2, 522, 30, 20), 0, "l", 0.8, 0.8))  # popliteal
    d, a = belly(ox - 24, 546, ox - 10, 700, 20, 8, 1.25); b.append(shape(d, a, "d", 1.2)); b.append(fibres(ox - 24, 546, ox - 10, 700, 20, 8))  # gastroc lateral
    d, a = belly(ox + 24, 546, ox + 8, 706, 20, 8, 1.25); b.append(shape(d, a, "d", 1.2)); b.append(fibres(ox + 24, 546, ox + 8, 706, 20, 8))  # gastroc medial
    d, a = belly(ox - 34, 620, ox - 30, 760, 8, 6, 1.0); b.append(shape(d, a, "l", 0.9))  # soleus edge
    b.append(shape(f"M{ox-10},702 L{ox+8},702 L{ox+6},820 L{ox-6},820 Z", 90, "m", 0.9))  # achilles
    b.append(shape(f"M{ox-26},818 C{ox-40},830 {ox-36},854 {ox-6},858 C{ox+16},860 {ox+24},846 {ox+18},828 L{ox+8},818 Z", 0, "l", 1.0))  # heel
    b.append(line("M60,860 H180", 0.5, 0.5))
    b.append('<text x="60" y="852" font-family="serif" font-size="11" fill="%s" opacity=".6" letter-spacing="2">PL. II · MUSCULI MEMBRI INFERIORIS</text>' % INK)
    return svg(600, 900, "\n".join(b), "Muscles of the lower limb, anterior and posterior")


# ---------------------------------------------------------------------- back
def back():
    b = [frame(600, 900)]
    b.append(shape(ellipse_path(300, 88, 52, 62), 90, "l", 1.2))  # head, occipital
    b.append(line("M262,92 C272,124 328,124 338,92", 0.6, 0.5))
    b.append(shape("M280,146 L320,146 L326,196 L274,196 Z", 90, "m", 0.9))  # neck
    for x in (286, 300, 314):
        b.append(line(f"M{x},150 L{x},194", 0.6, 0.6))
    # trapezius diamond
    b.append(shape("M300,150 C320,190 400,214 460,234 C420,260 340,300 316,500 L300,540 L284,500 C260,300 180,260 140,234 C200,214 280,190 300,150 Z", 60, "m", 1.3))
    for k in range(6):
        t = k / 5
        b.append(line(f"M{300-6*t:.0f},{200+30*t:.0f} L{150+40*t:.0f},{238+8*t:.0f}", 0.6, 0.5))
        b.append(line(f"M{300+6*t:.0f},{200+30*t:.0f} L{450-40*t:.0f},{238+8*t:.0f}", 0.6, 0.5))
    b.append(line("M300,196 L300,540", 1.0, 0.8))  # spine line
    for i in range(16):
        y = 206 + i * 21
        b.append(line(f"M294,{y} L306,{y}", 0.7, 0.6))
    # deltoids
    b.append(shape("M140,232 C110,248 96,290 108,338 C124,356 156,352 176,330 C190,300 176,256 140,232 Z", 120, "d", 1.2))
    b.append(shape("M460,232 C490,248 504,290 492,338 C476,356 444,352 424,330 C410,300 424,256 460,232 Z", 60, "d", 1.2))
    for k in range(5):
        b.append(line(f"M{120+k*8},{250+k*4} C{118+k*6},{290} {128+k*6},{330} {150+k*4},{340}", 0.6, 0.45))
        b.append(line(f"M{480-k*8},{250+k*4} C{482-k*6},{290} {472-k*6},{330} {450-k*4},{340}", 0.6, 0.45))
    # infraspinatus / teres
    b.append(shape("M182,262 C220,270 250,300 258,330 C230,342 196,348 176,332 C170,312 172,284 182,262 Z", 30, "l", 1.0))
    b.append(shape("M418,262 C380,270 350,300 342,330 C370,342 404,348 424,332 C430,312 428,284 418,262 Z", 150, "l", 1.0))
    # latissimus fan
    b.append(shape("M296,352 C250,336 200,346 168,368 C140,420 150,500 196,574 C232,600 276,586 292,540 Z", 60, "d", 1.3))
    b.append(shape("M304,352 C350,336 400,346 432,368 C460,420 450,500 404,574 C368,600 324,586 308,540 Z", 120, "d", 1.3))
    for k in range(7):
        t = k / 6
        b.append(line(f"M{172+t*20:.0f},{372+t*120:.0f} C{220:.0f},{380+t*100:.0f} {270:.0f},{400+t*90:.0f} {292:.0f},{440+t*80:.0f}", 0.6, 0.5))
        b.append(line(f"M{428-t*20:.0f},{372+t*120:.0f} C{380:.0f},{380+t*100:.0f} {330:.0f},{400+t*90:.0f} {308:.0f},{440+t*80:.0f}", 0.6, 0.5))
    # erector spinae columns
    d, a = belly(286, 560, 280, 690, 12, 16, 1.1); b.append(shape(d, a, "m", 1.0)); b.append(fibres(286, 560, 280, 690, 12, 5))
    d, a = belly(314, 560, 320, 690, 12, 16, 1.1); b.append(shape(d, a, "m", 1.0)); b.append(fibres(314, 560, 320, 690, 12, 5))
    # obliques / glutes top
    b.append(shape("M196,580 C224,600 262,606 272,650 C250,680 210,684 190,660 C176,634 180,606 196,580 Z", 140, "l", 1.0))
    b.append(shape("M404,580 C376,600 338,606 328,650 C350,680 390,684 410,660 C424,634 420,606 404,580 Z", 40, "l", 1.0))
    b.append(shape("M300,700 C250,690 200,708 186,760 C176,820 220,860 290,850 L300,830 L310,850 C380,860 424,820 414,760 C400,708 350,690 300,700 Z", 135, "m", 1.2))
    # upper arms (triceps) cropped
    d, a = belly(114, 340, 90, 540, 18, 14, 1.1); b.append(shape(d, a, "m", 1.1)); b.append(fibres(114, 340, 90, 540, 18, 6))
    d, a = belly(486, 340, 510, 540, 18, 14, 1.1); b.append(shape(d, a, "m", 1.1)); b.append(fibres(486, 340, 510, 540, 18, 6))
    b.append(line("M60,860 H180", 0.5, 0.5))
    b.append('<text x="60" y="852" font-family="serif" font-size="11" fill="%s" opacity=".6" letter-spacing="2">PL. III · MUSCULI DORSI</text>' % INK)
    return svg(600, 900, "\n".join(b), "Muscles of the back and shoulder")


# --------------------------------------------------------------- torso/heart
def torso():
    b = [frame(600, 900)]
    # neck & clavicles
    b.append(line("M270,60 C276,110 268,140 240,160", 0.9, 0.7))
    b.append(line("M330,60 C324,110 332,140 360,160", 0.9, 0.7))
    b.append(line("M300,168 C260,158 200,152 150,168", 1.4))
    b.append(line("M300,168 C340,158 400,152 450,168", 1.4))
    # ribcage, lighter than the skeleton plate
    for i, w in enumerate([80, 104, 120, 130, 134, 132, 124, 110, 92]):
        y = 190 + i * 36
        for sgn in (-1, 1):
            x0 = 300 + sgn * 12
            xe = 300 + sgn * w
            b.append(line(f"M{x0},{y+26} C{x0+sgn*40},{y+8} {xe-sgn*12},{y-8} {xe},{y+18} C{xe+sgn*2},{y+40} {xe-sgn*24},{y+52} {x0+sgn*26},{y+50}", 0.9, 0.55))
    b.append(shape("M290,176 L310,176 L308,220 L312,330 L300,352 L288,330 L292,220 Z", 90, "l", 0.9, 0.7))
    # lungs, faint
    b.append(shape("M282,220 C240,214 196,250 190,330 C186,400 210,470 262,500 C284,500 290,470 288,430 Z", 100, "l", 0.8, 0.45))
    b.append(shape("M318,220 C360,214 404,250 410,330 C414,400 390,470 338,500 C316,500 310,470 312,430 Z", 80, "l", 0.8, 0.45))
    # great vessels
    b.append(shape("M286,236 C288,208 312,196 330,206 C346,214 348,240 340,260 L326,256 C330,244 326,226 312,226 C300,226 298,240 300,256 Z", 20, "m", 1.0))  # aortic arch
    b.append(shape("M262,262 C262,240 282,232 296,242 L296,262 Z", 160, "m", 0.9))  # pulmonary trunk
    b.append(line("M312,204 L310,176", 1.2)); b.append(line("M330,208 L340,180", 1.0)); b.append(line("M296,206 L286,178", 1.0))
    # heart
    b.append(shape("M268,262 C244,266 222,296 226,336 C232,386 268,424 306,452 C346,420 374,376 372,330 C370,292 346,264 316,268 C300,270 286,280 288,296 C282,278 276,266 268,262 Z", 135, "d", 1.5))
    b.append(line("M290,296 C300,330 306,380 306,450", 0.9, 0.85))  # interventricular groove
    b.append(line("M240,320 C270,320 300,312 330,300", 0.8, 0.7))  # coronary sulcus
    for k in range(5):
        t = k / 4
        b.append(line(f"M{250+t*20:.0f},{330+t*20:.0f} C{270+t*10:.0f},{380} {292:.0f},{420-t*10:.0f} {304:.0f},{446-t*20:.0f}", 0.5, 0.45))
    b.append(line("M330,300 C340,330 336,380 322,420", 0.6, 0.5))
    # diaphragm & abdominal wall
    b.append(line("M170,520 C220,470 380,470 430,520", 1.2, 0.8))
    b.append(line("M300,540 L300,780", 1.0, 0.7))  # linea alba
    for i in range(3):
        y = 560 + i * 62
        for sgn in (-1, 1):
            b.append(shape(f"M{300+sgn*6},{y} C{300+sgn*40},{y-6} {300+sgn*64},{y+6} {300+sgn*60},{y+50} C{300+sgn*40},{y+58} {300+sgn*12},{y+54} {300+sgn*6},{y+48} Z", 0, "l", 0.9, 0.85))
    b.append(shape("M226,540 C200,600 190,700 210,780 C230,790 250,760 250,700 C250,640 246,580 232,540 Z", 60, "l", 0.9, 0.8))
    b.append(shape("M374,540 C400,600 410,700 390,780 C370,790 350,760 350,700 C350,640 354,580 368,540 Z", 120, "l", 0.9, 0.8))
    b.append(line("M60,860 H180", 0.5, 0.5))
    b.append('<text x="60" y="852" font-family="serif" font-size="11" fill="%s" opacity=".6" letter-spacing="2">PL. IV · COR ET THORAX</text>' % INK)
    return svg(600, 900, "\n".join(b), "Heart and thorax, anterior view")


# ----------------------------------------------------------------------- arm
def arm():
    b = [frame(600, 900)]
    ox = 300
    b.append(shape("M220,120 C250,80 330,74 372,110 C392,140 386,190 360,218 C330,236 270,236 244,214 C214,190 206,150 220,120 Z", 45, "d", 1.3))  # deltoid
    for k in range(6):
        b.append(line(f"M{236+k*22},{120+ (k%2)*6} C{250+k*18},{160} {270+k*12},{200} {286+k*6},{222}", 0.6, 0.45))
    d, a = belly(ox - 20, 230, ox - 30, 470, 24, 12, 1.25); b.append(shape(d, a, "m", 1.3)); b.append(fibres(ox - 20, 230, ox - 30, 470, 24, 9))  # biceps
    d, a = belly(ox + 30, 236, ox + 34, 480, 20, 12, 1.15); b.append(shape(d, a, "d", 1.2)); b.append(fibres(ox + 30, 236, ox + 34, 480, 20, 7))  # triceps long head
    d, a = belly(ox + 54, 320, ox + 50, 480, 10, 8, 1.0); b.append(shape(d, a, "d", 0.9))  # triceps lateral
    d, a = belly(ox - 44, 380, ox - 40, 480, 8, 10, 1.0); b.append(shape(d, a, "l", 0.9))  # brachialis
    b.append(shape(ellipse_path(ox, 500, 44, 24), 0, "l", 0.9, 0.8))  # elbow
    d, a = belly(ox - 30, 520, ox - 46, 700, 18, 8, 1.15); b.append(shape(d, a, "m", 1.1)); b.append(fibres(ox - 30, 520, ox - 46, 700, 18, 7))  # brachioradialis
    d, a = belly(ox + 6, 526, ox + 4, 720, 16, 6, 1.1); b.append(shape(d, a, "m", 1.0)); b.append(fibres(ox + 6, 526, ox + 4, 720, 16, 6))  # flexors
    d, a = belly(ox + 36, 526, ox + 32, 700, 12, 6, 1.0); b.append(shape(d, a, "l", 0.9))
    b.append(shape(f"M{ox-30},730 C{ox-46},760 {ox-40},810 {ox-10},828 C{ox+20},836 {ox+44},816 {ox+40},780 L{ox+30},730 Z", 90, "l", 1.0))  # hand
    for k in range(4):
        fx = ox - 24 + k * 16
        b.append(line(f"M{fx},828 C{fx-2},850 {fx-2},870 {fx-4},886", 0.9))
    b.append(line("M60,860 H180", 0.5, 0.5))
    b.append('<text x="60" y="852" font-family="serif" font-size="11" fill="%s" opacity=".6" letter-spacing="2">PL. V · MUSCULI BRACHII</text>' % INK)
    return svg(600, 900, "\n".join(b), "Muscles of the arm")


PLATES = {
    "skeleton.svg": skeleton,
    "legs.svg": legs,
    "back.svg": back,
    "torso-heart.svg": torso,
    "arm.svg": arm,
}

if __name__ == "__main__":
    for name, fn in PLATES.items():
        path = os.path.join(OUT, name)
        with open(path, "w") as f:
            f.write(fn())
        print(f"wrote {name} ({os.path.getsize(path)//1024} KB)")
