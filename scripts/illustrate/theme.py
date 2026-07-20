"""Palette and embedded CSS for generated SVGs.

The palette is baked into each SVG (an SVG loaded through <img> cannot read the
page's CSS variables), with light values as default and dark values behind
prefers-color-scheme. Colors derive from the site's Horizon tokens.
"""

LIGHT = {
    "ink": "#0a1628",
    "card": "#ffffff",
    "chip": "#eef1f6",
    "border": "#c3cddc",
    "accent": "#4361ee",
    "accent_tint": "#eef1fe",
    "pink": "#e0175d",
    "edge": "#64748b",
    "muted": "#718096",
}

DARK = {
    "ink": "#edf3fc",
    "card": "#0e1f38",
    "chip": "#152a49",
    "border": "#385582",
    "accent": "#7b90f5",
    "accent_tint": "#1a2c55",
    "pink": "#ff5c93",
    "edge": "#8296b3",
    "muted": "#8296b3",
}

FONT_STACK = "'Heebo','Segoe UI',system-ui,sans-serif"
MONO_STACK = "ui-monospace,'SF Mono',Menlo,monospace"


def _vars(p):
    return (
        "--ink:{ink};--card:{card};--chip:{chip};--border:{border};"
        "--accent:{accent};--accent-tint:{accent_tint};--pink:{pink};"
        "--edge:{edge};--muted:{muted};".format(**p)
    )


def base_css(animated=False):
    css = [
        "svg{" + _vars(LIGHT) + "}",
        "@media (prefers-color-scheme: dark){svg{" + _vars(DARK) + "}}",
        ".n-box{fill:var(--card);stroke:var(--border);stroke-width:1.5;}",
        ".n-dia{fill:var(--accent-tint);stroke:var(--accent);stroke-width:1.5;}",
        ".n-hl{fill:var(--card);stroke:var(--pink);stroke-width:2;}",
        ".n-cell{fill:var(--card);stroke:var(--border);stroke-width:1.2;}",
        ".n-code-bg{fill:var(--chip);stroke:var(--border);stroke-width:1.2;}",
        ".t{font-family:%s;font-size:15px;font-weight:500;fill:var(--ink);direction:rtl;}" % FONT_STACK,
        ".t-b{font-family:%s;font-size:16px;font-weight:700;fill:var(--ink);direction:rtl;}" % FONT_STACK,
        ".code{font-family:%s;font-size:13px;fill:var(--ink);direction:ltr;}" % MONO_STACK,
        ".lbl{font-family:%s;font-size:13px;font-weight:600;fill:var(--accent);direction:rtl;}" % FONT_STACK,
        ".small{font-family:%s;font-size:12px;fill:var(--muted);direction:rtl;}" % FONT_STACK,
        ".idx{font-family:%s;font-size:12px;fill:var(--muted);}" % MONO_STACK,
        ".edge{stroke:var(--edge);stroke-width:1.6;fill:none;}",
        ".arrhead{fill:var(--edge);}",
    ]
    if animated:
        css.append(
            "@media (prefers-reduced-motion: reduce){"
            "*{animation:none !important;}}"
        )
    return "\n".join(css)
