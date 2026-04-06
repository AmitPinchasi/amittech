window.ZONE_0 = {
  id: 0,
  name: "אתחול ראשון",
  subtitle: "whoami, uname, echo, man",
  color: "#00ff41",
  boss: "המערכת הרפאים",
  encounters: [
    {
      id: 0,
      name: "מי אני?",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.1 - באש בסיסי/1.1 - באש בסיסי - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          prompt: "agent47@unknown:~$",
          command: "whoami",
          context: null,
          options: ["agent47", "root", "daemon", "nobody"],
          correct: 0,
          narrative: "מסוף חשוך מהבהב. הפקודה הראשונה שכל סיסאדמין מפעיל.",
          explanation: "whoami מדפיסה את שם המשתמש המחובר כרגע. הפקודה הכי בסיסית - תמיד הצעד הראשון במערכת לא מוכרת.",
          hint: "שם הפקודה הוא שאלה: מי אני?"
        },
        {
          type: "command_forge",
          prompt: "agent47@unknown:~$",
          commandTemplate: "___ -a",
          answers: ["uname"],
          narrative: "גלה את כל נתוני הקרנל והמערכת בפקודה אחת.",
          explanation: "uname -a מדפיסה את כל נתוני המערכת: שם הקרנל, שם המחשב, גרסת הקרנל, ארכיטקטורת המעבד ועוד. -a = all.",
          hint: "שם הפקודה מגיע מ-'unix name'."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@unknown:~$",
          command: 'echo "System compromised"',
          context: null,
          options: ["System compromised", '"System compromised"', "echo System compromised", "Error: permission denied"],
          correct: 0,
          narrative: "הדפס הודעה לטרמינל - הפקודה הפשוטה ביותר.",
          explanation: "echo מדפיסה טקסט לטרמינל ללא המרכאות. המרכאות הן חלק מהתחביר, לא מהפלט.",
          hint: "echo מדפיסה את התוכן - לא את המרכאות."
        },
        {
          type: "flag_map",
          pairs: [
            { term: "whoami", definition: "Print current logged-in username" },
            { term: "hostname", definition: "Print machine network name" },
            { term: "uname -r", definition: "Print kernel release version" },
            { term: "uptime", definition: "Show system running time and load" }
          ],
          narrative: "ארבע פקודות ראשונות לכל שרת לא מוכר.",
          explanation: "whoami=זהות, hostname=שם, uname -r=גרסה, uptime=זמן פעולה. ארבעתן ביחד נותנות תמונה מלאה על המערכת.",
          hint: "כל פקודה עונה על שאלה אחת: מי, איפה, מה גרסה, כמה זמן."
        }
      ]
    },
    {
      id: 1,
      name: "מדריך ההישרדות",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.1 - באש בסיסי/1.1 - באש בסיסי - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          prompt: "agent47@unknown:~$",
          command: "man ls",
          context: null,
          options: ["פותחת את דף המדריך של ls", "מריצה ls עם מצב man", "מתקינה את ls", "מציגה רשימת קבצים"],
          correct: 0,
          narrative: "הפקודה החשובה ביותר בלינוקס - זו שמלמדת אותך את כל השאר.",
          explanation: "man פותחת את דף המדריך של כל פקודה. מציגה תיאור מלא, כל הדגלים, ודוגמאות שימוש. לצאת: q.",
          hint: "man מגיע מ-manual. לצאת מדף man לוחצים q."
        },
        {
          type: "command_forge",
          prompt: "agent47@unknown:~$",
          commandTemplate: "man ___ network",
          answers: ["-k"],
          narrative: "חפש מילת מפתח בכל דפי המדריך.",
          explanation: "man -k מחפש מילת מפתח בתיאורי כל הפקודות. שקול לו: 'איזה פקודות קשורות ל-network?' הפקודה apropos עושה את אותו הדבר.",
          hint: "הדגל -k מגיע מ-keyword. זהה לפקודה apropos."
        },
        {
          type: "pipe_builder",
          goal: "Show only the first 5 lines of the ls man page",
          options: [
            "man ls | head -n 5",
            "head -n 5 | man ls",
            "man ls | tail -n 5",
            "man ls > head"
          ],
          correct: 0,
          narrative: "שלב שתי פקודות כדי לראות רק את תחילת דף המדריך.",
          explanation: "| (pipe) מעביר פלט של פקודה אחת לקלט של הבאה. man ls מפיק טקסט, head -n 5 לוקח 5 שורות ראשונות. סדר הפקודות בצינור חשוב.",
          hint: "| שולח פלט שמאלה לקלט ימינה. head לוקח את ההתחלה."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@unknown:~$",
          command: "ls --help",
          context: null,
          options: ["מדפיסה תיאור קצר של ls עם כל הדגלים", "פותחת דף man של ls", "מדפיסה שגיאה", "מתחילה מצב אינטראקטיבי"],
          correct: 0,
          narrative: "כמעט כל פקודת GNU תומכת בדגל שמסכם אותה.",
          explanation: "--help מדפיסה תיאור קצר ישירות לטרמינל. מהיר יותר מ-man כשצריך לבדוק דגל ספציפי. man = מדריך מלא, --help = סיכום מהיר.",
          hint: "הדגל --help מחזיר תוצאה מיידית - לא פותח דף man."
        }
      ]
    },
    {
      id: 2,
      name: "בוס - המערכת הרפאים",
      isBoss: true,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.1 - באש בסיסי/1.1 - באש בסיסי - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          prompt: "agent47@unknown:~$",
          command: "ps -x",
          context: [
            "  PID TTY      STAT   TIME COMMAND",
            "    1 ?        Ss     0:01 /sbin/init",
            "  847 ?        S      0:00 /usr/sbin/sshd",
            " 1024 pts/0    Ss     0:00 -bash"
          ],
          options: ["רשימת תהליכים פעילים של המשתמש", "רשימת קבצים", "גרסת הקרנל", "שגיאה - אין הרשאה"],
          correct: 0,
          narrative: "המערכת הרפאים מסתירה את תהליכיה. ps מגלה אותם.",
          explanation: "ps מציגה תהליכים רצים. -x כולל גם תהליכים שאינם קשורים לטרמינל, כמו שירותי מערכת. PID=מספר תהליך, STAT=סטטוס, COMMAND=שם.",
          hint: "ps = process status. -x מרחיב לתהליכים ברקע."
        },
        {
          type: "script_debug",
          filename: "diagnose.sh",
          script: "#!/usr/bin/bash\necho 'System Info:'\nuname -a\necho 'Uptime:'\nuptime",
          options: [
            "Wrong shebang path: should be #!/bin/bash",
            "echo requires double quotes",
            "uname -a is not valid",
            "Missing chmod +x first"
          ],
          correct: 0,
          narrative: "סקריפט האבחון מסרב לרוץ. מצא את הבאג.",
          explanation: "ה-shebang (#!/...) חייב להצביע על המיקום הנכון של bash. הנתיב הסטנדרטי הוא /bin/bash ולא /usr/bin/bash. לבדיקה: which bash.",
          hint: "ה-shebang הוא השורה הראשונה. /usr/bin/bash לא קיים בדרך כלל."
        },
        {
          type: "command_forge",
          prompt: "agent47@unknown:~$",
          commandTemplate: "___",
          answers: ["clear"],
          acceptedAlternatives: [["clear"]],
          narrative: "נקה את המסך לפני שהבוס מגיע.",
          explanation: "clear מנקה את מסך הטרמינל. קיצור מקשים: Ctrl+L עושה את אותו הדבר. הפרומפט עולה לראש המסך.",
          hint: "פקודה של 5 אותיות שמנקה הכל. קיצור: Ctrl+L."
        },
        {
          type: "pipe_builder",
          goal: "Show only the kernel name (first word of uname -a output)",
          options: [
            "uname -a | cut -d' ' -f1",
            "uname -a | head -1",
            "cut -d' ' -f1 | uname -a",
            "uname | grep -n 1"
          ],
          correct: 0,
          narrative: "הוכח שאתה מסוגל לשרשר פקודות.",
          explanation: "cut -d' ' חותך לפי delimiter רווח. -f1 לוקח רק את השדה הראשון. פלט uname -a: 'Linux hostname 5.15...' - שדה 1 = 'Linux'.",
          hint: "cut חותך עמודות. -d מגדיר מפריד, -f מגדיר עמודה."
        }
      ]
    }
  ]
};
