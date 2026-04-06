window.ZONE_2 = {
  id: 2,
  name: "נפש הטרמינל",
  subtitle: "משתני סביבה, הפניות, צינורות",
  color: "#cba6f7",
  boss: "הצינור השבור",
  encounters: [
    {
      id: 0,
      name: "חנות המשתנים",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.3 - אז מה זה באש/1.3 - אז מה זה באש - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          prompt: "agent47@shellserver:~$",
          command: "echo $HOME",
          context: null,
          options: ["/home/agent47", "$HOME", "home", "None"],
          correct: 0,
          narrative: "גלה את ערך משתנה הבית.",
          explanation: "משתני סביבה מאוחסנים בזיכרון ה-shell. $HOME מכיל את נתיב תיקיית הבית. echo $VAR מדפיסה את ערך המשתנה.",
          hint: "$HOME הוא משתנה סביבה. echo מדפיסה ערכים."
        },
        {
          type: "command_forge",
          prompt: "agent47@shellserver:~$",
          commandTemplate: "echo $___",
          answers: ["PATH"],
          narrative: "הצג את נתיבי החיפוש של bash.",
          explanation: "$PATH מכיל רשימת תיקיות מופרדות ב-: שבהן bash מחפש פקודות. כשמקלידים 'ls', bash מחפש 'ls' בכל תיקיה ב-$PATH.",
          hint: "PATH = הנתיב שבו bash מחפש פקודות."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@shellserver:~$",
          command: "export MY_VAR=hello; echo $MY_VAR",
          context: null,
          options: ["hello", "MY_VAR=hello", "$MY_VAR", "export: command not found"],
          correct: 0,
          narrative: "הגדר משתנה סביבה חדש והדפס אותו.",
          explanation: "export מגדיר משתנה ומעביר אותו לתהליכי ילד. MY_VAR=hello מגדיר, echo $MY_VAR מדפיס. ; מריץ שתי פקודות ברצף.",
          hint: "export מגדיר משתנה. echo $NAME מדפיסו."
        },
        {
          type: "flag_map",
          pairs: [
            { term: "$HOME", definition: "Path to user home directory" },
            { term: "$PATH", definition: "Colon-separated executable search directories" },
            { term: "$USER", definition: "Current logged-in username" },
            { term: "$SHELL", definition: "Path to current shell executable" }
          ],
          narrative: "ארבעה משתני סביבה חיוניים.",
          explanation: "$HOME נתיב הבית, $PATH היכן לחפש פקודות, $USER שם המשתמש, $SHELL המעטפת הנוכחית. כולם זמינים בכל session.",
          hint: "כל משתנה מתאר היבט של הסביבה הנוכחית."
        }
      ]
    },
    {
      id: 1,
      name: "זרמי הנתונים",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.3 - אז מה זה באש/1.3 - אז מה זה באש - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          prompt: "agent47@shellserver:~$",
          command: 'echo "hello" > output.txt',
          context: null,
          options: ["יוצר/מחליף את output.txt עם התוכן 'hello'", "מוסיף 'hello' לסוף output.txt", "מדפיס 'hello' למסך", "שגיאה - > לא חוקי"],
          correct: 0,
          narrative: "שלח פלט לקובץ במקום למסך.",
          explanation: "> מפנה stdout לקובץ, מחליף תוכן קיים. >> מוסיף לסוף. לאחר הרצה, cat output.txt יציג 'hello'.",
          hint: "> כותב לקובץ (מחליף). >> מוסיף לקובץ."
        },
        {
          type: "command_forge",
          prompt: "agent47@shellserver:~$",
          commandTemplate: "ls /nonexistent ___ /dev/null",
          answers: ["2>"],
          narrative: "הסתר שגיאות - שלח אותן ל-/dev/null.",
          explanation: "2> מפנה stderr (שגיאות, file descriptor 2) לקובץ. /dev/null הוא ה'פח' של לינוקס - כל מה שנשלח אליו נעלם. 1> = stdout, 2> = stderr.",
          hint: "2 = file descriptor של stderr. > = הפנה לקובץ. /dev/null = שום מקום."
        },
        {
          type: "pipe_builder",
          goal: "List only directories in /etc (lines starting with 'd')",
          options: [
            "ls -la /etc | grep '^d'",
            "grep '^d' | ls -la /etc",
            "ls /etc | grep -d",
            "find /etc -type d | ls"
          ],
          correct: 0,
          narrative: "סנן רק תיקיות מתוך רשימת הקבצים.",
          explanation: "ls -la מציג עם הרשאות. שורות תיקיות מתחילות ב-'d' (directory). grep '^d' מסנן שורות שמתחילות ב-d. ^ = התחלת שורה.",
          hint: "ls -la מציג רשאות. תיקיות מתחילות ב-d. grep '^d' מסנן."
        },
        {
          type: "flag_map",
          pairs: [
            { term: ">", definition: "Redirect stdout to file (overwrite)" },
            { term: ">>", definition: "Redirect stdout to file (append)" },
            { term: "|", definition: "Pipe stdout of one command to stdin of next" },
            { term: "2>", definition: "Redirect stderr to file" }
          ],
          narrative: "ארבעה אופרטורי הפניה.",
          explanation: "> כותב (מחליף), >> מוסיף, | מעביר בין פקודות, 2> לשגיאות. אלה כלי יסוד של bash. ניתן לשלב: cmd > out.txt 2>/dev/null",
          hint: "כל אחד שולח נתון למקום אחר. > ו->> מדברים על כתיבה."
        }
      ]
    },
    {
      id: 2,
      name: "בוס - הצינור השבור",
      isBoss: true,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.3 - אז מה זה באש/1.3 - אז מה זה באש - הרצאה/",
      challenges: [
        {
          type: "script_debug",
          filename: "backup.sh",
          script: "#!/bin/bash\nname=agent47\necho \"Backing up files for $name\"\ncp /home/$name/* /backup/\necho \"Backup complete for $name\"",
          options: [
            "Missing quotes around $name in cp command - spaces in paths could break it",
            "Wrong shebang",
            "cp syntax is backwards",
            "Missing mkdir for /backup/"
          ],
          correct: 0,
          narrative: "סקריפט הגיבוי נכשל עם שמות קבצים שיש בהם רווח.",
          explanation: "כאשר משתנה מכיל רווחים, יש לעטוף ב-\". cp /home/$name/* יתפרק אם יש רווח ב-name. הנכון: cp \"/home/$name/\"* /backup/",
          hint: "תמיד עטוף משתנים במרכאות כפולות כדי להתמודד עם רווחים."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@shellserver:~$",
          command: "echo 'error msg' 2>/dev/null",
          context: null,
          options: ["error msg", "כלום - stdout מוצג, 2> לא משפיע כאן", "error msg לנעלם", "שגיאה"],
          correct: 0,
          narrative: "מה יוצא כאשר מפנים stderr אבל echo כותב ל-stdout?",
          explanation: "echo כותב ל-stdout (file descriptor 1), לא ל-stderr (2). 2>/dev/null מפנה רק שגיאות. echo 'error msg' מדפיס כרגיל כי זה stdout.",
          hint: "echo כותב ל-stdout (1), לא stderr (2). 2> משפיע רק על stderr."
        },
        {
          type: "pipe_builder",
          goal: "Count unique users in /etc/passwd (first field, colon separator)",
          options: [
            "cut -d: -f1 /etc/passwd | sort | uniq | wc -l",
            "wc -l | cut -d: -f1 /etc/passwd",
            "cat /etc/passwd | uniq | cut | sort",
            "sort /etc/passwd | cut -f1 | wc"
          ],
          correct: 0,
          narrative: "חלץ, מיין, ייחד וספור משתמשים ייחודיים.",
          explanation: "cut -d: -f1 חותך לפי : ולוקח שדה 1 (שם משתמש). sort ממיין. uniq מסיר כפילויות. wc -l סופר שורות. סדר חשוב: חתוך > מיין > ייחד > ספור.",
          hint: "cut חותך עמודות, sort ממיין, uniq מסיר כפילויות, wc -l סופר."
        },
        {
          type: "command_forge",
          prompt: "agent47@shellserver:~$",
          commandTemplate: "echo 'new entry' ___ /var/log/custom.log",
          answers: [">>"],
          narrative: "הוסף שורה לסוף קובץ הלוג מבלי למחוק את תוכנו.",
          explanation: ">> מוסיף לסוף קובץ קיים. > מחליף כל התוכן. לתוספת לוגים תמיד השתמש ב->>, אחרת תמחק היסטוריה.",
          hint: ">> = append = הוספה לסוף. > = overwrite = החלפה."
        }
      ]
    }
  ]
};
