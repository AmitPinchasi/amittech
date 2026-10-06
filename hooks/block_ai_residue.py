"""Fail the build if a page still carries text left over from a chatbot draft.

Lessons are sometimes drafted with an assistant, and its side of the
conversation can survive into the published page: "בוודאי, הנה הגרסה
המתוקנת לכתיבה מימין לשמאל (RTL)..." sat in core 0.3 until a reader
spotted it, and core 7.8 had a "הערה למרצה" addressed to the instructor.
A reader takes either one as proof the lesson was not written by a person.

The patterns are deliberately narrow. The site's own voice uses "מעולה!",
"אם תרצו", "הנה דוגמה", "ביקשתם", "גרסה מתוקנת" (of patched code), an FAQ
"בהחלט." and quoted speech like "אני אשמח להרחיב" all the time, so none
of those are matched; every pattern here had zero hits
across docs/ when it was added. Fenced code blocks are skipped, and a line
that genuinely needs one of these phrases (say, a lesson quoting an
assistant) can carry <!-- ai-residue-ok --> to be let through.

The scan runs in on_files, before anything is rendered, so a bad page
stops `mkdocs serve` and the deploy within a second instead of after the
full build.
"""
import re

from mkdocs.exceptions import PluginError

ALLOW_MARKER = "ai-residue-ok"

PATTERNS = (
    # The assistant answering the author.
    r"^\W*(בוודאי|בשמחה|בהחלט|בטח)[,!.]\s*(הנה|אשמח|אני |נוכל|אוכל)",
    r"הנה (ה)?(גרסה|גירסה|נוסח|טקסט) (ה)?(מתוקנ|משופר|מעודכנ|ערוכ|מלא|סופי)",
    r"כמו שצריך בעברית|(לכתיבה|בכתיבה) מימין לשמאל",
    r"(כפי|כמו) שביקשת(?![םן])|לפי בקשתך|בהתאם לבקשתך",
    # Text meant for the instructor, not the student.
    r"הערה ל(מרצה|מורה|מדריך|מנחה)",
    # Offers to keep going.
    r"אם תרצה,? (אוכל|נוכל|אני יכול)|רוצה ש(אכין|אוסיף|אמשיך|ארחיב)",
    # ChatGPT citation debris.
    r"contentReference\[|oaicite|【\d|†source|turn\d+(search|view)\d+",
    # English-language assistant phrasing.
    r"(?i)^\W*(sure|certainly|of course)[,!]\s",
    r"(?i)i hope this helps|let me know if you|would you like me to|as an ai\b",
    r"(?i)here'?s (the|your) (updated|revised|corrected|improved|full)",
)
_COMPILED = [re.compile(p) for p in PATTERNS]


def _scan(text):
    in_code = False
    for n, line in enumerate(text.splitlines(), 1):
        if line.lstrip().startswith(("```", "~~~")):
            in_code = not in_code
            continue
        if in_code or ALLOW_MARKER in line:
            continue
        if any(p.search(line) for p in _COMPILED):
            yield n, line.strip()


def on_files(files, config):
    hits = []
    for f in files.documentation_pages():
        with open(f.abs_src_path, encoding="utf-8") as fh:
            text = fh.read()
        for n, line in _scan(text):
            hits.append("  %s:%d  %s" % (f.src_path, n, line[:160]))
    if hits:
        raise PluginError(
            "Leftover chatbot text in %d place(s); remove it, or mark a "
            "deliberate quote with <!-- %s -->:\n%s"
            % (len(hits), ALLOW_MARKER, "\n".join(hits))
        )
    return files
