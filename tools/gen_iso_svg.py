"""產生 Step 5 (OLL 角塊) 的等角投影 SVG 圖 — 最終版。

使用模擬器直接產生正確的 3D viewer 對應顏色。
但 OLL 階段只關心 U 面的黃色分佈, 側面使用灰色簡化。
只有 U 面的黃/非黃和側面的黃色位置是重點。

策略: U 面顯示黃色(Y)和灰色(非Y), 側面只顯示中心色和黃色位。
"""

import copy, math

# ===== 模擬器 =====
W, Y, R, O, G, B = "W", "Y", "R", "O", "G", "B"
X = "X"  # gray placeholder

def solved_cube():
    colors = [W, Y, G, B, R, O]
    return [[[c for _ in range(3)] for _ in range(3)] for c in colors]

def rcw(f):
    n = len(f); return [[f[n-1-j][i] for j in range(n)] for i in range(n)]

def rccw(f):
    n = len(f); return [[f[j][n-1-i] for j in range(n)] for i in range(n)]

def r180(f): return rcw(rcw(f))

def apply_x(c):
    d = copy.deepcopy(c)
    d[0], d[2], d[1], d[3] = copy.deepcopy(d[2]), copy.deepcopy(d[1]), r180(d[3]), r180(d[0])
    d[4] = rcw(d[4]); d[5] = rccw(d[5]); return d

def apply_x2(c): return apply_x(apply_x(c))

def apply_R(c):
    d = copy.deepcopy(c); d[4] = rcw(d[4])
    for i in range(3):
        d[0][i][2], d[2][i][2], d[1][i][2], d[3][2-i][0] = \
            d[2][i][2], d[1][i][2], d[3][2-i][0], d[0][i][2]
    return d

def apply_U(c):
    d = copy.deepcopy(c); d[0] = rcw(d[0])
    t = [d[2][0][j] for j in range(3)]
    for j in range(3): d[2][0][j] = d[4][0][j]
    for j in range(3): d[4][0][j] = d[3][0][j]
    for j in range(3): d[3][0][j] = d[5][0][j]
    for j in range(3): d[5][0][j] = t[j]
    return d

def apply_move(c, m):
    if m == 'x2': return apply_x2(c)
    ms = {'R': apply_R, 'U': apply_U}
    b = m.replace("'", "").replace("2", ""); f = ms[b]
    if "'" in m: return f(f(f(c)))
    if "2" in m: return f(f(c))
    return f(c)

def apply_algo(c, s):
    for m in s.split(): c = apply_move(c, m)
    return c

def yc(c):
    return sum(1 for x in [c[0][0][0], c[0][0][2], c[0][2][0], c[0][2][2]] if x == Y)


# ===== SVG =====
S = 18
COS30 = math.cos(math.radians(30))
SIN30 = math.sin(math.radians(30))
OX, OY = 70, 114

CMAP = {"W": "#fff", "Y": "#ffd500", "R": "#b71234", "O": "#ff5800",
        "G": "#009b48", "B": "#0046ad", "X": "#ddd"}

def iso(gx, gy, gz):
    sx = OX + S * COS30 * (gx - gy)
    sy = OY - S * SIN30 * (gx + gy) - S * gz
    return f"{sx:.1f},{sy:.1f}"

def u_cell(col, row):
    gy, gx = 3 - col, row
    return [iso(gx, gy, 3), iso(gx, gy-1, 3), iso(gx+1, gy-1, 3), iso(gx+1, gy, 3)]

def left_cell(col, row):
    y = 3 - col
    return [iso(0, y, 3-row), iso(0, y-1, 3-row), iso(0, y-1, 3-row-1), iso(0, y, 3-row-1)]

def right_cell(col, row):
    x = col
    return [iso(x+1, 0, 3-row), iso(x, 0, 3-row), iso(x, 0, 3-row-1), iso(x+1, 0, 3-row-1)]

def poly(pts, color_name):
    fill = CMAP.get(color_name, color_name)
    stroke = "#333" if color_name != X else "#bbb"
    return f'<polygon points="{" ".join(pts)}" fill="{fill}" stroke="{stroke}" stroke-width="0.7"/>'


def sim_to_oll_grids(cube):
    """將模擬結果轉為 OLL 示意圖格: U 面 Y/X, 側面只顯中心和相鄰黃。"""
    # U face: yellow or gray
    def uy(v): return Y if v == Y else X
    u = [
        [uy(cube[0][0][2]), uy(cube[0][1][2]), uy(cube[0][2][2])],
        [uy(cube[0][0][1]), Y, uy(cube[0][2][1])],  # center always Y
        [uy(cube[0][0][0]), uy(cube[0][1][0]), uy(cube[0][2][0])],
    ]

    # Left face (R): top row = R[2] (adjacent to U after x2)
    # Center = R, show Y only where it appears
    def lf_cell(r, c):
        if r == 0:
            v = cube[4][2][c]
            return Y if v == Y else X
        elif r == 1 and c == 1:
            return R  # center
        return X

    lf = [[lf_cell(r, c) for c in range(3)] for r in range(3)]

    # Right face (F after x2 = Blue): top row = F[2], cols reversed
    # rf[0][0] = F[2][2], rf[0][1] = F[2][1], rf[0][2] = F[2][0]
    def rf_cell(r, c):
        if r == 0:
            fc = 2 - c  # reversed columns
            v = cube[2][2][fc]
            return Y if v == Y else X
        elif r == 1 and c == 1:
            return B  # center (Blue after x2!)
        return X

    rf = [[rf_cell(r, c) for c in range(3)] for r in range(3)]

    return u, lf, rf


def build_svg(u, lf, rf, arrows=None):
    lines = ['<svg xmlns="http://www.w3.org/2000/svg" '
             'viewBox="0 0 140 120" width="140" height="120">']

    arrow_colors = ["#e74c3c", "#3498db", "#27ae60"]
    for i, c in enumerate(arrow_colors):
        lines.append(
            f'<marker id="a{i}" viewBox="0 0 10 10" refX="9" refY="5" '
            f'markerWidth="5" markerHeight="5" orient="auto-start-reverse">'
            f'<path d="M0,0 L10,5 L0,10z" fill="{c}"/></marker>')

    for r in range(3):
        for c in range(3):
            lines.append(poly(u_cell(c, r), u[r][c]))
    for r in range(3):
        for c in range(3):
            lines.append(poly(left_cell(c, r), lf[r][c]))
    for r in range(3):
        for c in range(3):
            lines.append(poly(right_cell(c, r), rf[r][c]))

    if arrows:
        for ax1, ay1, ax2, ay2, ci in arrows:
            lines.append(
                f'<line x1="{ax1}" y1="{ay1}" x2="{ax2}" y2="{ay2}" '
                f'stroke="{arrow_colors[ci]}" stroke-width="2" '
                f'marker-end="url(#a{ci})"/>')

    lines.append("</svg>")
    return "\n".join(lines)


def build_from_sim(cube, arrows=None):
    u, lf, rf = sim_to_oll_grids(cube)
    return build_svg(u, lf, rf, arrows)


def solved_svg():
    u = [[Y]*3 for _ in range(3)]
    lf = [[X,X,X],[X,R,X],[X,X,X]]
    rf = [[X,X,X],[X,B,X],[X,X,X]]
    return build_svg(u, lf, rf)


# ===== 產生 =====
SUNE = "R U R' U R U2 R'"
ANTI = "R U2 R' U' R U' R'"

# 5A: Sune (setup=Anti-Sune)
c = apply_algo(solved_cube(), f"x2 {ANTI}")
print("=== 5A BEFORE ==="); print(build_from_sim(c))
print("\n=== 5A AFTER ==="); print(solved_svg())

# 5B: Anti-Sune (setup=Sune)
c = apply_algo(solved_cube(), f"x2 {SUNE}")
print("\n=== 5B BEFORE ==="); print(build_from_sim(c))
print("\n=== 5B AFTER ==="); print(solved_svg())

# 5C: 0 corner (setup=Anti-Sune x2)
c = apply_algo(solved_cube(), f"x2 {ANTI} {ANTI}")
print("\n=== 5C BEFORE ==="); print(build_from_sim(c, arrows=[(38.8, 33.0, 101.2, 33.0, 0)]))
c2 = apply_algo(copy.deepcopy(c), SUNE)
print("\n=== 5C AFTER ==="); print(build_from_sim(c2))

# 5D: 2 corners - Headlights (setup = Sune U Anti-Sune, solve = Sune U' Anti-Sune)
c = apply_algo(solved_cube(), f"x2 {SUNE} U {ANTI}")
assert yc(c) == 2, f"Expected 2 corners, got {yc(c)}"
print("\n=== 5D BEFORE ==="); print(build_from_sim(c))
print("\n=== 5D AFTER ==="); print(solved_svg())

# Verify
c_verify = apply_algo(copy.deepcopy(c), f"{SUNE} U' {ANTI}")
assert yc(c_verify) == 4, "5D solve failed!"
print("\n# All verifications passed!")

# Print iso grid summaries
for label, algo in [
    ("5A", f"x2 {ANTI}"),
    ("5B", f"x2 {SUNE}"),
    ("5C", f"x2 {ANTI} {ANTI}"),
    ("5D", f"x2 {SUNE} U {ANTI}"),
]:
    c = apply_algo(solved_cube(), algo)
    u, lf, rf = sim_to_oll_grids(c)
    corners = f"u00={u[0][0]} u02={u[0][2]} u20={u[2][0]} u22={u[2][2]}"
    sides = f"lf00={lf[0][0]} lf02={lf[0][2]} rf00={rf[0][0]} rf02={rf[0][2]}"
    print(f"# {label}: {corners} | {sides}")
