"""Render independently authored replacements for externally sourced lesson graphics.

Run from the repository root with python scripts/illustrate/original_assets.py.
The drawings express protocols, algorithms and truth tables from first principles.
No third-party image is read by this renderer.
"""

from html import escape
from itertools import product
from pathlib import Path

from theme import base_css


OUTPUT = Path(__file__).resolve().parents[2] / 'docs/images/originals'


class Drawing:
    def __init__(self, title, width=800, height=450):
        self.title = title
        self.width = width
        self.height = height
        self.parts = []
        self.text(width / 2, 36, title, size=22, rtl=True)

    def text(self, x, y, value, size=17, anchor='middle', rtl=False, color='ink'):
        direction = 'rtl' if rtl else 'ltr'
        self.parts.append(
            f'<text x="{x}" y="{y}" text-anchor="{anchor}" direction="{direction}" '
            f'font-size="{size}" fill="var(--{color})">{escape(str(value))}</text>'
        )

    def box(self, x, y, width, height, label='', fill='chip'):
        self.parts.append(
            f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="12" '
            f'fill="var(--{fill})" stroke="var(--border)" stroke-width="2"/>'
        )
        if label:
            self.text(x + width / 2, y + height / 2 + 6, label)

    def line(self, x1, y1, x2, y2, arrow=False, color='edge'):
        marker = ' marker-end="url(#arrow)"' if arrow else ''
        self.parts.append(
            f'<path d="M{x1},{y1} L{x2},{y2}" fill="none" '
            f'stroke="var(--{color})" stroke-width="2.5"{marker}/>'
        )

    def wire(self, points):
        self.parts.append(
            '<polyline points="' + ' '.join(f'{x},{y}' for x, y in points)
            + '" fill="none" stroke="var(--edge)" stroke-width="2.5"/>'
        )

    def node(self, x, y, value, radius=23, color='accent-tint'):
        self.parts.append(
            f'<circle cx="{x}" cy="{y}" r="{radius}" fill="var(--{color})" '
            'stroke="var(--accent)" stroke-width="2"/>'
        )
        self.text(x, y + 6, value)

    def save(self, name, extra_css=''):
        OUTPUT.mkdir(parents=True, exist_ok=True)
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.width} {self.height}" '
            f'width="{self.width}" height="{self.height}" role="img" aria-label="{escape(self.title, quote=True)}">'
            f'<title>{escape(self.title)}</title><style>{base_css()}\n'
            'text{font-family:Segoe UI,Arial,sans-serif;}\n' + extra_css + '</style>'
            '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" '
            'orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L8,4 L0,8 Z" '
            'fill="var(--edge)"/></marker></defs>'
            f'<rect width="{self.width}" height="{self.height}" rx="16" fill="var(--card)"/>'
            + '\n'.join(self.parts) + '</svg>\n'
        )
        (OUTPUT / f'{name}.svg').write_text(svg, encoding='utf-8')


def table(name, title, headers, rows, cell=110):
    drawing = Drawing(title, max(480, cell * len(headers) + 60), 135 + len(rows) * 38)
    left = (drawing.width - cell * len(headers)) / 2
    for row_number, row in enumerate([headers] + list(rows)):
        for column, value in enumerate(row):
            x = left + cell * column
            y = 65 + row_number * 38
            drawing.box(x, y, cell - 4, 34, str(value), 'accent-tint' if row_number == 0 else 'chip')
    drawing.save(name)


def sequence(name, title, actors, messages, footer=''):
    width = 900
    drawing = Drawing(title, width, 190 + 76 * len(messages))
    xs = [110 + i * 680 / (len(actors) - 1) for i in range(len(actors))]
    for x, actor in zip(xs, actors):
        drawing.box(x - 88, 65, 176, 46, actor)
        drawing.line(x, 115, x, drawing.height - 70)
    for index, (sender, receiver, label) in enumerate(messages):
        y = 157 + index * 76
        drawing.text((xs[sender] + xs[receiver]) / 2, y - 12, label, size=15)
        drawing.line(xs[sender], y, xs[receiver], y, arrow=True)
    drawing.text(width / 2, drawing.height - 24, footer, size=15, rtl=True)
    drawing.save(name)


def linked_lists(name, a, b, shared):
    drawing = Drawing('רשימות מקושרות וחוליות משותפות', 880, 350)
    drawing.text(55, 125, 'A')
    drawing.text(55, 275, 'B')
    for values, y in [(a, 120), (b, 270)]:
        for i, value in enumerate(values):
            x = 120 + i * 105
            drawing.node(x, y, value)
            if i:
                drawing.line(x - 82, y, x - 25, y, arrow=True)
        if shared:
            drawing.line(120 + (len(values) - 1) * 105 + 24, y, 492, 195, arrow=True)
        else:
            drawing.line(120 + (len(values) - 1) * 105 + 24, y, 480, y, arrow=True)
            drawing.text(530, y + 5, 'None')
    for i, value in enumerate(shared):
        x = 520 + i * 110
        drawing.node(x, 195, value, color='chip')
        if i:
            drawing.line(x - 85, 195, x - 25, 195, arrow=True)
    drawing.text(440, 325, 'החיבור מציין את אותה חוליה בזיכרון' if shared else 'שתי רשימות נפרדות בזיכרון', rtl=True)
    drawing.save(name)


def trees():
    points = [(400, 105), (220, 205), (580, 205), (120, 305), (310, 305), (495, 305), (685, 305)]
    edges = [(0, 1), (0, 2), (1, 3), (1, 4), (2, 5), (2, 6)]
    for name, title, order in [
        ('dfs', 'חיפוש לעומק - DFS', [0, 1, 3, 4, 2, 5, 6]),
        ('bfs', 'חיפוש לרוחב - BFS', list(range(7))),
    ]:
        drawing = Drawing(title, 800, 440)
        for a, b in edges:
            drawing.line(*points[a], *points[b])
        for i, (x, y) in enumerate(points):
            drawing.parts.append(f'<g class="visit-{order.index(i)}">')
            drawing.node(x, y, order.index(i) + 1, radius=29)
            drawing.parts.append('</g>')
        drawing.text(400, 380, 'המספרים מציינים את סדר הביקור, משמאל לימין בכל פיצול', size=17, rtl=True)
        drawing.text(400, 411, '1 → 2 → 3 → 4 → 5 → 6 → 7', color='accent')
        # The complete order remains readable without motion or on reduced-motion devices.
        css = ''
        if name == 'bfs':
            css = '@keyframes visit{0%,12%{stroke-width:7;stroke:var(--pink)}14%,100%{stroke-width:2}}'
            for i in range(7):
                css += f'.visit-{i} circle{{animation:visit 14s {i * 2}s infinite;}}'
            css += '@media(prefers-reduced-motion:reduce){*{animation:none!important}}'
        drawing.save(name, css)
    drawing = Drawing('דוגמה לעץ חיפוש בינארי', 800, 390)
    for a, b in edges:
        drawing.line(*points[a], *points[b])
    for point, value in zip(points, [8, 3, 10, 1, 6, 9, 14]):
        drawing.node(*point, value)
    drawing.text(400, 365, 'ערכים קטנים משמאל, ערכים גדולים מימין', rtl=True)
    drawing.save('binary-search-tree')


def topology():
    from math import cos, sin, tau
    drawing = Drawing('טופולוגיות רשת', 900, 680)
    for i, label in enumerate(['Star', 'Ring', 'Mesh', 'Bus', 'Tree']):
        left = 25 + (i % 3) * 290
        top = 75 + (i // 3) * 290
        drawing.box(left, top, 270, 260, fill='card')
        drawing.text(left + 135, top + 32, label, size=20)
        center = (left + 135, top + 155)
        points = [(center[0] + 82 * cos(tau * j / 5 - tau / 4), center[1] + 82 * sin(tau * j / 5 - tau / 4)) for j in range(5)]
        if label == 'Star':
            for point in points:
                drawing.line(*center, *point)
            drawing.node(*center, '', radius=12)
        elif label == 'Ring':
            for j in range(5):
                drawing.line(*points[j], *points[(j + 1) % 5])
        elif label == 'Mesh':
            for a in range(5):
                for b in range(a + 1, 5):
                    drawing.line(*points[a], *points[b])
        elif label == 'Bus':
            points = [(left + 45 + j * 60, top + 110 + (j % 2) * 90) for j in range(4)]
            drawing.line(left + 25, top + 155, left + 245, top + 155)
            for x, y in points:
                drawing.line(x, y, x, top + 155)
        else:
            points = [(left + 135, top + 85), (left + 75, top + 150), (left + 195, top + 150), (left + 40, top + 220), (left + 105, top + 220), (left + 165, top + 220), (left + 230, top + 220)]
            for a, b in [(0, 1), (0, 2), (1, 3), (1, 4), (2, 5), (2, 6)]:
                drawing.line(*points[a], *points[b])
        for point in points:
            drawing.node(*point, '', radius=10)
    drawing.save('network-topology')


def ascii_table():
    controls = 'NUL SOH STX ETX EOT ENQ ACK BEL BS HT LF VT FF CR SO SI DLE DC1 DC2 DC3 DC4 NAK SYN ETB CAN EM SUB ESC FS GS RS US'.split()
    drawing = Drawing('טבלת ASCII - ערכים 0 עד 127', 1020, 1090)
    for group in range(4):
        left = 20 + group * 250
        drawing.box(left, 60, 235, 34, 'DEC     HEX     CHAR', fill='accent-tint')
        for row in range(32):
            value = group * 32 + row
            char = controls[value] if value < 32 else chr(value)
            if value == 32:
                char = 'SPACE'
            if value == 127:
                char = 'DEL'
            y = 117 + row * 29
            drawing.text(left + 35, y, value, size=15)
            drawing.text(left + 105, y, f'{value:02X}', size=15)
            drawing.text(left + 185, y, char, size=15)
    drawing.save('ascii-table')


def reference_graphics():
    drawing = Drawing('מבנה היררכי של תיקיות', 850, 420)
    folders = [(325, 70, 'Home'), (75, 190, 'Documents'), (325, 190, 'Pictures'), (575, 190, 'Projects'), (475, 310, 'Work'), (675, 310, 'Learning')]
    for parent, child in [(0, 1), (0, 2), (0, 3), (3, 4), (3, 5)]:
        drawing.line(folders[parent][0] + 75, folders[parent][1] + 55, folders[child][0] + 75, folders[child][1], arrow=True)
    for x, y, label in folders:
        drawing.box(x, y, 150, 55, label, fill='accent-tint')
    drawing.text(425, 400, 'כל תיקייה יכולה להכיל קבצים ותיקיות נוספות', rtl=True)
    drawing.save('folder-tree')

    drawing = Drawing('דוגמה לממשק של מנוע חיפוש', 800, 340)
    drawing.box(40, 65, 720, 240, fill='card')
    drawing.box(40, 65, 720, 38, 'search.example')
    drawing.text(400, 155, 'חיפוש מידע', size=28, rtl=True)
    drawing.box(130, 185, 540, 48, 'איך מחשב מריץ תוכנה?')
    drawing.box(330, 250, 140, 36, 'חיפוש', fill='accent-tint')
    drawing.save('search-interface')

    drawing = Drawing('פתיחת סייר הקבצים באמצעות המקלדת', 720, 260)
    drawing.box(90, 95, 200, 90, 'Windows', fill='accent-tint')
    drawing.text(350, 151, '+', size=35)
    drawing.box(420, 95, 120, 90, 'E', fill='accent-tint')
    drawing.text(360, 230, 'לחצו על שני המקשים יחד', rtl=True)
    drawing.save('windows-e')

    drawing = Drawing('ציור באמצעות תווי טקסט', 660, 290)
    for i, line in enumerate(['       /\\', '  ____/  \\____', ' /   o       /', '<           <', ' \\__________\\']):
        drawing.parts.append(f'<text x="150" y="{90 + i * 30}" xml:space="preserve" style="font-family:Consolas,monospace;font-size:23px;fill:var(--ink)">{escape(line)}</text>')
    drawing.save('ascii-fish')

    drawing = Drawing('היררכיית שמות DNS', 800, 420)
    boxes = [(310, 65, 180, 45, '.'), (100, 175, 180, 45, 'com.'), (510, 175, 180, 45, 'org.'), (100, 280, 180, 45, 'example.com.'), (510, 280, 180, 45, 'example.org.')]
    for x1, y1, x2, y2 in [(400, 110, 190, 175), (400, 110, 600, 175), (190, 220, 190, 280), (600, 220, 600, 280)]:
        drawing.line(x1, y1, x2, y2, arrow=True)
    for box in boxes:
        drawing.box(*box)
    drawing.text(400, 385, 'האצלת סמכות מהשורש אל התחומים שמתחתיו', rtl=True)
    drawing.save('dns-hierarchy')

    drawing = Drawing('אובייקט, מחלקה ומטה־מחלקה בפייתון', 650, 400)
    for y, label in [(75, 'type'), (180, 'MyClass'), (285, 'instance')]:
        drawing.box(225, y, 200, 60, label)
    for y in [180, 285]:
        drawing.line(325, y, 325, y - 45, arrow=True)
        drawing.text(440, y - 20, 'instance of', anchor='start', size=15)
    drawing.save('metaclass')

    drawing = Drawing('חלק מהיררכיית החריגות בפייתון 3', 950, 480)
    levels = [('BaseException', 380, 65), ('Exception', 380, 160), ('ArithmeticError', 80, 270), ('LookupError', 380, 270), ('OSError', 680, 270), ('ZeroDivisionError', 80, 380), ('IndexError / KeyError', 380, 380), ('FileNotFoundError', 680, 380)]
    for a, b in [(0, 1), (1, 2), (1, 3), (1, 4), (2, 5), (3, 6), (4, 7)]:
        drawing.line(levels[a][1] + 95, levels[a][2] + 50, levels[b][1] + 95, levels[b][2])
    for label, x, y in levels:
        drawing.box(x, y, 190, 50, label)
    drawing.save('python-exceptions')

    sequence('ntlm', 'אימות NTLM - חילופי ההודעות', ['Client', 'Server'], [(0, 1, '1  NEGOTIATE'), (1, 0, '2  CHALLENGE'), (0, 1, '3  AUTHENTICATE')], 'הלקוח מחשב תגובה לאתגר באמצעות פרטי האימות שלו')
    sequence('ntlm-relay', 'העברת הודעות באימות NTLM', ['Client', 'Relay', 'Server'], [(0, 1, '1  NEGOTIATE'), (1, 2, '2  NEGOTIATE'), (2, 1, '3  CHALLENGE'), (1, 0, '4  CHALLENGE'), (0, 1, '5  AUTHENTICATE'), (1, 2, '6  AUTHENTICATE')], 'התווך מעביר את ההודעות אל השירות שאליו הוא מתחבר')
    sequence('kerberos', 'מסלול הכרטיסים ב־Kerberos', ['Client', 'KDC (AS / TGS)', 'Service'], [(0, 1, '1  AS-REQ'), (1, 0, '2  AS-REP + TGT'), (0, 1, '3  TGS-REQ + TGT'), (1, 0, '4  TGS-REP + service ticket'), (0, 2, '5  AP-REQ + service ticket'), (2, 0, '6  AP-REP (mutual authentication)')], 'הכרטיס לשירות שונה מהכרטיס הראשוני - TGT')
    drawing = Drawing('דוגמת עבודה במסוף Metasploit', 850, 330)
    drawing.box(35, 65, 780, 220)
    for i, line in enumerate(['$ msfconsole -q', 'msf6 > help', 'msf6 > search type:auxiliary scanner', 'msf6 > info auxiliary/scanner/portscan/tcp']):
        drawing.text(60, 108 + i * 44, line, anchor='start', size=19)
    drawing.text(425, 310, 'המחשה של פקודות מסוף', rtl=True, size=15)
    drawing.save('metasploit-console')

    table('packet-list', 'המחשה של רשימת מנות שנלכדו', ['No.', 'Source', 'Destination', 'Protocol'], [
        ['1', '192.0.2.10', '192.0.2.53', 'DNS'],
        ['2', '192.0.2.53', '192.0.2.10', 'DNS'],
        ['3', '192.0.2.10', '198.51.100.8', 'TCP'],
        ['4', '198.51.100.8', '192.0.2.10', 'TCP'],
        ['5', '192.0.2.10', '198.51.100.8', 'HTTP'],
    ], cell=175)
    table('inner-join', 'צירוף רשומות לפי מזהה משותף', ['A.id', 'B.id', 'INNER JOIN'], [['1', '2', '2'], ['2', '3', '3'], ['3', '4', '']])
    table('union', 'איחוד ערכים ללא כפילויות', ['A.id', 'B.id', 'UNION'], [['1', '2', '1'], ['2', '3', '2'], ['3', '4', '3'], ['', '', '4']])


def gate(drawing, x, y, label):
    drawing.box(x, y, 100, 64, label, fill='accent-tint')


def gate_diagrams():
    functions = {
        'nand': lambda a, b: int(not (a and b)),
        'and': lambda a, b: a & b,
        'or': lambda a, b: a | b,
        'nor': lambda a, b: int(not (a or b)),
        'xor': lambda a, b: a ^ b,
    }
    for name, function in functions.items():
        table(f'{name}-truth', f'טבלת אמת - {name.upper()}', ['A', 'B', 'Q'], [[a, b, function(a, b)] for a, b in product([0, 1], repeat=2)])
    table('not-truth', 'טבלת אמת - NOT', ['A', 'Q'], [[0, 1], [1, 0]])
    table('half-adder-truth', 'טבלת אמת - Half Adder', ['A', 'B', 'Sum', 'Carry'], [[a, b, a ^ b, a & b] for a, b in product([0, 1], repeat=2)])
    table('full-adder-truth', 'טבלת אמת - Full Adder', ['A', 'B', 'Cin', 'Sum', 'Cout'], [[a, b, c, (a + b + c) % 2, (a + b + c) // 2] for a, b, c in product([0, 1], repeat=3)])
    for state in [None, (0, 0), (1, 0), (0, 1), (1, 1)]:
        drawing = Drawing('שער NAND - הפלט הוא שלילת AND', 650, 250)
        a, b, q = ('A', 'B', 'Q') if state is None else (*state, int(not all(state)))
        gate(drawing, 270, 100, 'NAND')
        for label, y in [(a, 115), (b, 150)]:
            drawing.text(100, y + 6, label, size=23)
            drawing.line(130, y, 270, y)
        drawing.line(370, 132, 515, 132, arrow=True)
        drawing.text(550, 139, q, size=23)
        drawing.text(325, 220, 'Q = NOT (A AND B)', color='accent')
        drawing.save('nand-symbol' if state is None else f'nand-{a}{b}')

    drawing = Drawing('מימוש NOT בעזרת NAND', 700, 260)
    drawing.text(65, 143, 'A')
    drawing.wire([(90, 137), (200, 137), (200, 115), (290, 115)])
    drawing.wire([(200, 137), (200, 155), (290, 155)])
    gate(drawing, 290, 103, 'NAND')
    drawing.line(390, 135, 580, 135, arrow=True)
    drawing.text(620, 141, 'Q')
    drawing.text(350, 220, 'Q = NAND(A, A) = NOT A')
    drawing.save('not-circuit')

    drawing = Drawing('מימוש AND בעזרת NAND ו־NOT', 750, 270)
    for label, y in [('A', 115), ('B', 155)]:
        drawing.text(50, y + 6, label)
        drawing.line(70, y, 220, y)
    gate(drawing, 220, 103, 'NAND')
    drawing.line(320, 135, 450, 135, arrow=True)
    gate(drawing, 450, 103, 'NOT')
    drawing.line(550, 135, 660, 135, arrow=True)
    drawing.text(700, 141, 'Q')
    drawing.text(375, 230, 'Q = NOT NAND(A, B) = A AND B')
    drawing.save('and-circuit')

    for kind in ['or', 'nor']:
        drawing = Drawing(f'מימוש {kind.upper()} משערים פשוטים', 900, 350)
        for label, y in [('A', 115), ('B', 245)]:
            drawing.text(45, y + 6, label)
            drawing.line(65, y, 140, y)
            gate(drawing, 140, y - 32, 'NOT')
        drawing.wire([(240, 115), (330, 115), (330, 160), (430, 160)])
        drawing.wire([(240, 245), (330, 245), (330, 200), (430, 200)])
        gate(drawing, 430, 148, 'NAND')
        if kind == 'nor':
            drawing.line(530, 180, 650, 180, arrow=True)
            gate(drawing, 650, 148, 'NOT')
            drawing.line(750, 180, 830, 180, arrow=True)
        else:
            drawing.line(530, 180, 830, 180, arrow=True)
        drawing.text(860, 186, 'Q')
        drawing.text(450, 320, 'NOT(NOT A AND NOT B) = A OR B' if kind == 'or' else 'Q = NOT (A OR B)')
        drawing.save(f'{kind}-circuit')

    for kind, first, second, final in [('xor', 'NAND', 'OR', 'AND'), ('half-adder', 'XOR', 'AND', None)]:
        drawing = Drawing('מימוש XOR' if kind == 'xor' else 'מחבר חצי - Half Adder', 850, 360)
        drawing.text(50, 120, 'A')
        drawing.text(50, 270, 'B')
        drawing.wire([(75, 115), (160, 115), (160, 100), (300, 100)])
        drawing.wire([(160, 115), (160, 230), (300, 230)])
        drawing.wire([(75, 265), (210, 265), (210, 140), (300, 140)])
        drawing.wire([(210, 265), (210, 270), (300, 270)])
        drawing.node(160, 115, '', radius=4)
        drawing.node(210, 265, '', radius=4)
        gate(drawing, 300, 88, first)
        gate(drawing, 300, 218, second)
        if final:
            drawing.wire([(400, 120), (490, 120), (490, 165), (590, 165)])
            drawing.wire([(400, 250), (490, 250), (490, 205), (590, 205)])
            gate(drawing, 590, 153, final)
            drawing.line(690, 185, 780, 185, arrow=True)
            drawing.text(810, 191, 'Q')
        else:
            drawing.line(400, 120, 650, 120, arrow=True)
            drawing.line(400, 250, 650, 250, arrow=True)
            drawing.text(730, 126, 'Sum')
            drawing.text(730, 256, 'Carry')
        drawing.save(f'{kind}-circuit')

    drawing = Drawing('מחבר מלא - Full Adder', 1050, 520)
    # Net labels identify connections without ambiguous crossings.
    for x, y, label, inputs, output in [
        (180, 100, 'XOR', ['A', 'B'], 'P'),
        (700, 100, 'XOR', ['P', 'Cin'], 'Sum'),
        (180, 280, 'AND', ['A', 'B'], 'G'),
        (700, 280, 'AND', ['P', 'Cin'], 'H'),
        (440, 415, 'OR', ['G', 'H'], 'Cout'),
    ]:
        gate(drawing, x, y, label)
        for index, value in enumerate(inputs):
            drawing.text(x - 80, y + 21 + index * 30, value)
            drawing.line(x - 50, y + 16 + index * 30, x, y + 16 + index * 30)
        drawing.line(x + 100, y + 32, x + 180, y + 32, arrow=True)
        drawing.text(x + 225, y + 38, output)
    drawing.text(525, 230, 'אותה אות מסמנת את אותו חיבור חשמלי', rtl=True)
    drawing.save('full-adder-circuit')

    drawing = Drawing('מחבר 8 ביט - שרשור הנשיאה', 1120, 330)
    for bit in range(8):
        x = 80 + bit * 125
        drawing.box(x, 130, 90, 90, f'FA {bit}', fill='accent-tint')
        drawing.text(x + 45, 90, f'A{bit}  B{bit}')
        drawing.line(x + 45, 100, x + 45, 130, arrow=True)
        drawing.line(x + 45, 220, x + 45, 255, arrow=True)
        drawing.text(x + 45, 280, f'S{bit}')
        drawing.line(x - 35, 175, x, 175, arrow=True)
    drawing.text(28, 165, 'Cin', size=15)
    drawing.line(1045, 175, 1080, 175, arrow=True)
    drawing.text(1083, 150, 'Cout', size=15)
    drawing.text(560, 315, 'הנשיאה עוברת מהביט הנמוך לביט הגבוה', rtl=True)
    drawing.save('ripple-adder')

    drawing = Drawing('מודל מפסקים לשער NAND', 750, 470)
    drawing.text(250, 85, '+V')
    drawing.line(250, 100, 250, 130)
    drawing.box(225, 130, 50, 80, 'R')
    drawing.line(250, 210, 250, 255)
    drawing.line(250, 230, 520, 230, arrow=True)
    drawing.text(560, 236, 'Q')
    for y, label in [(255, 'A'), (340, 'B')]:
        drawing.node(250, y, '', radius=4)
        drawing.node(250, y + 45, '', radius=4)
        drawing.line(250, y, 285, y + 35)
        drawing.text(320, y + 28, label)
    drawing.line(250, 300, 250, 340)
    drawing.line(250, 385, 250, 410)
    drawing.line(225, 410, 275, 410)
    drawing.line(235, 419, 265, 419)
    drawing.text(500, 330, 'שני מפסקים סגורים מורידים את Q לאפס', size=16, rtl=True)
    drawing.save('nand-switches')


def main():
    topology()
    ascii_table()
    trees()
    reference_graphics()
    linked_lists('list-shared', ['a1', 'a2'], ['b1', 'b2', 'b3'], ['c1', 'c2', 'c3'])
    linked_lists('list-example-1', [4, 1], [5, 6, 1], [8, 4, 5])
    linked_lists('list-example-2', [1, 9, 1], [3], [2, 4])
    linked_lists('list-disjoint', [2, 6, 4], [1, 5], [])
    gate_diagrams()
    print(f'Rendered {len(list(OUTPUT.glob("*.svg")))} original SVGs')


if __name__ == '__main__':
    main()
