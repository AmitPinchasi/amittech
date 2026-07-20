"""Conservative text-width estimation for auto-sizing SVG shapes.

Widths are estimates (the real font is Heebo with system fallbacks), so every
value is padded by SLACK to keep text inside its shape even under fallback fonts.
"""

SLACK = 1.12

MONO_CHAR = 0.62


def _char_width(ch):
    o = ord(ch)
    if 0x0590 <= o <= 0x05FF:
        return 0.58
    if ch.isdigit() or ch.isupper():
        return 0.62
    if ch.islower():
        return 0.50
    if ch == " ":
        return 0.30
    return 0.36


def text_width(s, size, mono=False):
    if not s:
        return 0.0
    if mono:
        return len(s) * MONO_CHAR * size * SLACK
    return sum(_char_width(c) for c in s) * size * SLACK
