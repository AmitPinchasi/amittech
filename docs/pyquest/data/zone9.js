/* ============================================================
   ZONE 9 - Sanctum of Clarity
   Clean Code: meaningful names, naming conventions,
   comments, single responsibility, pure functions,
   avoiding magic numbers
   ============================================================ */

window.ZONE_9 = {
  id: 9,
  name: "מקדש הבהירות",
  subtitle: "קוד נקי",
  color: "#f1f5f9",
  boss: "מקודד הכאוס",
  encounters: [
    {
      id: 0,
      name: "אולמות השמות",
      isBoss: false,
      challenges: [
        {
          type: "name_binding",
          narrative: "לכל ישות במקדש יש קונבנציית שמות נכונה. קשר אותן.",
          pairs: [
            { term: "variable / function", definition: "snake_case: my_variable, calculate_area" },
            { term: "class", definition: "PascalCase (CamelCase): MyClass, UserAccount" },
            { term: "constant", definition: "UPPER_SNAKE_CASE: MAX_RETRIES, PI_VALUE" },
            { term: "private attribute", definition: "Leading underscore: _internal, _cache" },
          ],
          explanation: "קונבנציות שמות בפייתון: snake_case למשתנים/פונקציות, PascalCase למחלקות, UPPER_SNAKE_CASE לקבועים, קו תחתון בודד בהתחלה לפרטי/פנימי.",
          hint: "PEP 8 הוא מדריך הסגנון של פייתון. חשוב: אותיות קטנות עם קווי תחתון, ALL CAPS לקבועים, TitleCase למחלקות.",
        },
        {
          type: "corruption_scan",
          narrative: "לפונקציה זו יש הפרת קוד נקי ראשית. נסה לזהות אותה.",
          code: 'def f(x, y, z):\n    r = x * y * z\n    return r',
          options: [
            "Meaningless names: f, x, y, z, r reveal nothing about purpose",
            "The function should use a for loop",
            "r should be called result",
            "Nothing is wrong, short names are efficient",
          ],
          correct: 0,
          explanation: "f, x, y, z, r הם שמות חסרי משמעות. קוד נקי צריך לקרוא כמו פרוזה: def calculate_volume(length, width, height): return length * width * height. שמות צריכים לגלות כוונה.",
          hint: "עקרון קוד נקי מרכזי כאן: הקוד צריך לגלות את כוונתו דרך שמות.",
        },
        {
          type: "output_oracle",
          narrative: "איזה שימוש בקבוע עומד בעקרונות קוד נקי?",
          code: '# Option A:\nfor i in range(3):\n    print(f"Retry {i}")\n\n# Option B:\nMAX_RETRIES = 3\nfor i in range(MAX_RETRIES):\n    print(f"Retry {i}")',
          options: [
            "Option B: MAX_RETRIES is a named constant, 3 is a magic number in Option A",
            "Option A: shorter and more direct",
            "Both are equivalent and acceptable",
            "Neither follows clean code",
          ],
          correct: 0,
          explanation: "מספרים קסומים כמו 3 אין להם הקשר. אם MAX_RETRIES = 3 מופיע במקומות רבים, שינויו דורש מציאת כל המופעים. קבוע בשם MAX_RETRIES מסביר את המשמעות וקל לעדכן.",
          hint: "'מספר קסום' הוא מספר ספרותי בקוד ללא הסבר. קבועים בשם מסבירים את המטרה.",
        },
        {
          type: "spell_completion",
          narrative: "החלף את המספר הקסום בקבוע משמעותי.",
          codeTemplate: 'MAX_CONNECTIONS = ___\n\nif active_connections >= MAX_CONNECTIONS:\n    reject_connection()',
          answers: ["100"],
          explanation: "במקום לכתוב את המספר הספרותי בתנאי, אנו מגדירים MAX_CONNECTIONS = 100. כל ערך מספרי מקובל כאן; הנקודה היא ששם הקבוע גורם לקוד להיות מתועד מעצמו.",
          hint: "כל ערך מספרי מתאים כאן. המפתח הוא שמות הקבוע כך שהתנאי נקרא בטבעיות.",
        },
      ],
    },
    {
      id: 1,
      name: "מקדש טוהר הפונקציות",
      isBoss: false,
      challenges: [
        {
          type: "output_oracle",
          narrative: "שתי פונקציות: אחת טהורה, אחת לא טהורה. איזו עומדת בעקרונות קוד נקי?",
          code: '# Option A - calculates AND prints\ndef display_area(radius):\n    area = 3.14159 * radius ** 2\n    print(f"Area: {area}")\n\n# Option B - separate concerns\ndef calculate_area(radius):\n    return 3.14159 * radius ** 2\n\ndef display_area(area):\n    print(f"Area: {area}")',
          options: [
            "Option B: Single responsibility - each function does one thing",
            "Option A: Fewer lines is always better",
            "Both follow clean code equally",
            "Neither is correct",
          ],
          correct: 0,
          explanation: "עקרון האחריות הבודדת: כל פונקציה צריכה לעשות דבר אחד. אפשרות B מפרידה חישוב מהצגה. לפונקציה של אפשרות A לא ניתן לעשות שימוש חוזר לחישוב בלבד.",
          hint: "עקרון האחריות הבודדת אומר שפונקציה צריכה לעשות דבר אחד. איזו אפשרות משיגה זאת?",
        },
        {
          type: "corruption_scan",
          narrative: "הערה זו היא הפרת קוד נקי. מצא מדוע.",
          code: '# Add 1 to counter\ncounter += 1\n\n# Check if user is admin\nif user.role == "admin":\n    grant_access()',
          options: [
            "Comments explain 'what' not 'why' - good code is self-documenting",
            "Comments should use triple quotes",
            "counter is not a meaningful name",
            "Nothing is wrong",
          ],
          correct: 0,
          explanation: "קוד טוב צריך להיות מתועד מעצמו דרך שמות ברורים. הערות כמו '# Add 1 to counter' חוזרות על הברור. הערות צריכות להסביר למה, לא מה. הקוד כבר מראה מה קורה.",
          hint: "עקרון קוד נקי: הקוד מסביר מה קורה דרך שמות ברורים. הערות מסבירות למה, לא מה.",
        },
        {
          type: "spell_completion",
          narrative: "החלף את המספר הקסום בקבוע קוד נקי.",
          codeTemplate: 'import math\n\ndef calculate_area(radius):\n    return ___ * radius**2',
          answers: ["math.pi"],
          explanation: "שימוש ב-math.pi במקום 3.14 או 3.14159 הוא נקי יותר: הוא מדויק יותר, מתועד מעצמו, ומשתמש בקבוע ידוע. הימנע ממספרים קסומים עבור קבועים מתמטיים.",
          hint: "למודול math של פייתון יש קבוע מדויק עבור פאי. גש אליו כ-math.pi.",
        },
        {
          type: "name_binding",
          narrative: "התאם כל עקרון קוד נקי לתיאורו.",
          pairs: [
            { term: "DRY", definition: "Don't Repeat Yourself - avoid code duplication" },
            { term: "KISS", definition: "Keep It Simple Stupid - prefer simple solutions" },
            { term: "YAGNI", definition: "You Aren't Gonna Need It - don't add unused features" },
            { term: "SRP", definition: "Single Responsibility Principle - one function, one job" },
          ],
          explanation: "DRY מבטל חזרות. KISS מעדיף פשטות. YAGNI נמנע מתכונות מוקדמות מדי. SRP שומר פונקציות ממוקדות. עקרונות אלו מנחים קוד נקי וניתן לתחזוקה.",
          hint: "DRY=כפילות, KISS=מורכבות, YAGNI=תכונות מוקדמות, SRP=מספר אחריויות.",
        },
      ],
    },
    {
      id: 2,
      name: "בוס - מקודד הכאוס",
      isBoss: true,
      challenges: [
        {
          type: "corruption_scan",
          narrative: "מקודד הכאוס מציג קוד פגום עמוק עם הפרות מרובות. זהה את הבעיה העיקרית.",
          code: 'def p(d):\n    # process data\n    x = []\n    for i in d:\n        if i > 0:\n            x.append(i * 2)\n    print(x)\n    return x',
          options: [
            "Function does two things: modifies data AND prints (violates SRP)",
            "Variable 'x' should be named 'result'",
            "for loop should be a list comprehension",
            "p and d are too short but everything else is fine",
          ],
          correct: 0,
          explanation: "ההפרה העיקרית היא SRP: הפונקציה גם משנה נתונים וגם מדפיסה אותם. תופעות לוואי (הדפסה) צריכות להיות נפרדות מחישוב. גם p ו-d הם שמות גרועים, אבל SRP היא הבעיה האדריכלית העיקרית.",
          hint: "הסתכל מה הפונקציה עושה צעד אחר צעד. האם היא עושה יותר מדבר אחד?",
        },
        {
          type: "output_oracle",
          narrative: "פונקציה טהורה מול פונקציה לא טהורה. מה מבטיחה הטהורה?",
          code: '# Pure function\ndef add(a, b):\n    return a + b\n\n# Impure function  \ntotal = 0\ndef add_to_total(x):\n    global total\n    total += x\n\nprint(add(3, 4))\nprint(add(3, 4))\nadd_to_total(3)\nadd_to_total(3)\nprint(total)',
          options: ["7\n7\n6", "7\n6\n6", "7\n7\n3", "6\n6\n6"],
          correct: 0,
          explanation: "add() היא טהורה: אותם קלטים תמיד נותנים אותו פלט (3+4=7 בשתי הפעמים). add_to_total() היא לא טהורה: היא משנה מצב גלובלי. שתי קריאות ל-add_to_total(3) גורמות ל-total=6.",
          hint: "פונקציה טהורה תמיד מחזירה את אותו פלט לאותו קלט. פונקציות לא טהורות יש להן תופעות לוואי.",
        },
        {
          type: "name_binding",
          narrative: "קישור אחרון: התאם כל ריח קוד לתיאורו.",
          pairs: [
            { term: "magic number", definition: "A literal number in code with no explanation of its meaning" },
            { term: "long function", definition: "A function doing too many things, hard to test and understand" },
            { term: "dead code", definition: "Unreachable or unused code that clutters the codebase" },
            { term: "global variable", definition: "State shared across functions, making code hard to reason about" },
          ],
          explanation: "ריחות קוד מציינים בעיות עיצוב פוטנציאליות. מספרים קסומים מסתירים כוונה. פונקציות ארוכות מפרות SRP. קוד מת מוסיף רעש. משתנים גלובליים יוצרים תלויות בלתי נראות.",
          hint: "כל ריח הוא סימן אזהרה. חשוב מה הופך קוד לקשה לקריאה, בדיקה או שינוי.",
        },
      ],
    },
  ],
};
