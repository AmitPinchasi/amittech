window.ZONE_1 = {
  id: 1,
  name: "ממלכת הקבצים",
  subtitle: "pwd, ls, cd, cat, touch, mkdir, cp, mv, find",
  color: "#89b4fa",
  boss: "שד הכאוס",
  encounters: [
    {
      id: 0,
      name: "מפת הקבצים",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.2 - ניווט בקבצים/1.2 - ניווט בקבצים - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          prompt: "agent47@fileserver:~$",
          command: "pwd",
          context: null,
          options: ["/home/agent47", "/root", "/", "/home"],
          correct: 0,
          narrative: "אתה מחובר לשרת הקבצים. מה הנתיב הנוכחי שלך?",
          explanation: "pwd (print working directory) מדפיסה את הנתיב המלא של התיקייה הנוכחית. תמיד תדע איפה אתה.",
          hint: "pwd = print working directory."
        },
        {
          type: "command_forge",
          prompt: "agent47@fileserver:~$",
          commandTemplate: "ls ___",
          answers: ["-la"],
          acceptedAlternatives: [["-la", "-al", "-l -a", "-a -l"]],
          narrative: "הצג את כל הקבצים כולל קבצים מוסתרים, עם פרטים מלאים.",
          explanation: "ls -la = -l (פרטים מלאים) + -a (כולל קבצים מוסתרים שמתחילים ב-.). הצגה: הרשאות, בעלים, גודל, תאריך, שם.",
          hint: "-l לפרטים מלאים, -a לקבצים מוסתרים. ניתן לשלב אותם."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@fileserver:/home/agent47$",
          command: "cd ..",
          context: null,
          options: ["עובר לתיקייה /home", "עובר לתיקייה /", "נשאר במקום", "שגיאה"],
          correct: 0,
          narrative: "התרחק מהתיקייה הנוכחית.",
          explanation: "cd .. עובר לתיקייה האב (parent). מ-/home/agent47 מגיעים ל-/home. מ-/home מגיעים ל-/. .. = תיקייה אב, . = תיקייה נוכחית.",
          hint: ".. הוא קיצור לתיקייה האב."
        },
        {
          type: "flag_map",
          pairs: [
            { term: "pwd", definition: "Print current directory path" },
            { term: "cd ~", definition: "Go to home directory" },
            { term: "cd -", definition: "Go to previous directory" },
            { term: "ls -a", definition: "Show hidden files (dotfiles)" }
          ],
          narrative: "ארבע פקודות ניווט בסיסיות.",
          explanation: "pwd=איפה אני, cd ~=בית, cd -=אחורה, ls -a=כולל מוסתרים. אלה הכלים הבסיסיים לניווט בטרמינל.",
          hint: "חשוב על כל אחת: איפה, לאן, אחורה, מה."
        }
      ]
    },
    {
      id: 1,
      name: "בית הקבצים",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.2 - ניווט בקבצים/1.2 - ניווט בקבצים - הרצאה/",
      challenges: [
        {
          type: "command_forge",
          prompt: "agent47@fileserver:~$",
          commandTemplate: "touch ___",
          answers: ["notes.txt"],
          narrative: "צור קובץ טקסט חדש בתיקייה הנוכחית.",
          explanation: "touch יוצר קובץ ריק חדש אם לא קיים, או מעדכן את timestamp אם קיים. שימושי ליצירת קבצים מהיר.",
          hint: "touch + שם קובץ. הסיומת .txt מסמנת קובץ טקסט."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@fileserver:~$",
          command: "cat /etc/hostname",
          context: ["fileserver-01"],
          options: ["מציג את תוכן הקובץ /etc/hostname", "עורך את הקובץ", "מוחק את הקובץ", "מעתיק את הקובץ"],
          correct: 0,
          narrative: "קרא את שם המחשב מהקובץ.",
          explanation: "cat (concatenate) מציגה את תוכן קובץ. /etc/hostname מכיל את שם המארח. cat שימושי לקבצים קצרים; לקבצים ארוכים עדיף less.",
          hint: "cat = concatenate. מציגה תוכן קובץ."
        },
        {
          type: "command_forge",
          prompt: "agent47@fileserver:~$",
          commandTemplate: "cp notes.txt ___",
          answers: ["backup.txt"],
          narrative: "שמור עותק של הקובץ לפני עריכה.",
          explanation: "cp (copy) מעתיקה קובץ. תחביר: cp מקור יעד. להעתקת תיקיות: cp -r (recursive). mv משנה שם או מעביר.",
          hint: "cp מקור יעד. הקובץ המקורי נשאר."
        },
        {
          type: "flag_map",
          pairs: [
            { term: "touch file.txt", definition: "Create empty file or update timestamp" },
            { term: "mkdir -p a/b/c", definition: "Create nested directories" },
            { term: "rm -rf dir/", definition: "Delete directory and all contents" },
            { term: "cp -r src/ dst/", definition: "Copy directory recursively" }
          ],
          narrative: "פקודות ניהול קבצים מתקדמות.",
          explanation: "touch ליצירה, mkdir -p לתיקיות מקוננות, rm -rf למחיקה (זהירות!), cp -r להעתקת תיקיות. -p ו-r הם דגלים חשובים לזכור.",
          hint: "שים לב לדגלים: -p = parents, -r = recursive, -f = force."
        }
      ]
    },
    {
      id: 2,
      name: "בוס - שד הכאוס",
      isBoss: true,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.2 - ניווט בקבצים/1.2 - ניווט בקבצים - הרצאה/",
      challenges: [
        {
          type: "command_forge",
          prompt: "agent47@fileserver:~$",
          commandTemplate: "find ___ -name '*.log'",
          answers: ["/var/log", "."],
          acceptedAlternatives: [["/var/log", ".", "/", "/var"]],
          narrative: "שד הכאוס פיזר לוגים בכל מקום. מצא אותם.",
          explanation: "find חיפוש רקורסיבי בכל תת-תיקיות. תחביר: find [נתיב] [תנאי]. -name לחיפוש לפי שם, תומך בתבניות wildcard כמו *.log.",
          hint: "find [נתיב] -name [תבנית]. . = תיקייה נוכחית."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@fileserver:~$",
          command: "head -n 3 /var/log/syslog",
          context: [
            "Jan 15 08:00:01 fileserver-01 systemd[1]: Started Session 1.",
            "Jan 15 08:00:02 fileserver-01 kernel: [    0.000000] Linux version 5.15",
            "Jan 15 08:00:03 fileserver-01 sshd[847]: Server listening on 0.0.0.0 port 22."
          ],
          options: ["מציגה 3 שורות ראשונות של הקובץ", "מציגה 3 שורות אחרונות", "מחפשת 'n 3' בקובץ", "מציגה 3 קבצים"],
          correct: 0,
          narrative: "בדוק את תחילת קובץ הלוג.",
          explanation: "head מציגה את ההתחלה של קובץ. -n 3 = 3 שורות ראשונות. ברירת מחדל: 10 שורות. tail מציגה את הסוף.",
          hint: "head = ראש = התחלה. -n קובע כמה שורות."
        },
        {
          type: "script_debug",
          filename: "navigate.sh",
          script: "#!/bin/bash\ncd /tmp\nls -la\ncd /nonexistent && echo 'found it'\necho 'done'",
          options: [
            "cd /nonexistent fails silently - should use || for error handling",
            "ls -la is invalid",
            "echo needs quotes",
            "Missing shebang"
          ],
          correct: 0,
          narrative: "סקריפט הניווט קורס בשקט. מצא למה.",
          explanation: "&& מריץ את הפקודה הבאה רק אם הקודמת הצליחה. cd /nonexistent נכשל (exit code != 0), אז echo 'found it' לא יופעל. || מריץ אם נכשל. צריך טיפול בשגיאות.",
          hint: "&& = רק אם הצליח. || = רק אם נכשל. ל-cd לנתיב לא קיים - צריך ||."
        },
        {
          type: "pipe_builder",
          goal: "Find all .txt files in current directory, show only first 5 results",
          options: [
            "find . -name '*.txt' | head -5",
            "head -5 | find . -name '*.txt'",
            "find . '*.txt' | head",
            "ls *.txt | find | head -5"
          ],
          correct: 0,
          narrative: "שלב find עם head לתוצאות מוגבלות.",
          explanation: "find . -name '*.txt' מוצא כל קבצי .txt. | head -5 מגביל ל-5 תוצאות ראשונות. זה צינור פשוט ויעיל.",
          hint: "find מחזיר שורה לכל קובץ. | head -5 לוקח 5 ראשונות."
        }
      ]
    }
  ]
};
