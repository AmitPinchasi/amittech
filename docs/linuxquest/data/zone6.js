window.ZONE_6 = {
  id: 6,
  name: "כימיית הסקריפטים",
  subtitle: "bash scripting, control flow, functions",
  color: "#f9e2af",
  boss: "שגיאת הלוגיקה",
  encounters: [
    {
      id: 0,
      name: "הסקריפט הראשון",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.7 - סקריפטים/1.7 - סקריפטים - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          narrative: "אתה עומד בכניסה למעבדה. על הלוח הראשון כתוב שורה מסתורית: #!/bin/bash",
          prompt: "מה תפקידה של שורת ה-shebang בתחילת סקריפט?",
          context: [
            "#!/bin/bash",
            "echo \"Hello, World!\""
          ],
          options: [
            "היא הערה שמסבירה מה הסקריפט עושה",
            "היא מגדירה לאיזה תוכנית להעביר את הסקריפט לריצה",
            "היא מגדירה את שם הסקריפט",
            "היא מייבאת ספריות חיצוניות"
          ],
          correct: 1,
          explanation: "שורת ה-shebang (‎#!/bin/bash) אומרת למערכת ההפעלה באיזו תוכנית להריץ את הסקריפט. הסמל ! אחרי # הוא שגורם לפירוש המיוחד הזה.",
          hint: "הסמל # בדרך כלל מציין הערה, אבל השילוב #! בתחילת הקובץ הוא מיוחד."
        },
        {
          type: "command_forge",
          narrative: "כתבת סקריפט, אבל כשאתה מנסה להריץ אותו מקבל שגיאת הרשאות. אתה צריך לתת לו הרשאת ריצה.",
          prompt: "השתמש ב-chmod כדי להפוך את script.sh לקובץ הניתן להרצה.",
          commandTemplate: "chmod ___ script.sh",
          answers: ["+x"],
          acceptedAlternatives: ["a+x", "u+x", "755", "0755"],
          explanation: "chmod +x מוסיף הרשאת ריצה (execute) לקובץ. בלי זה המערכת תסרב להריץ את הסקריפט גם אם תוכנו תקין לחלוטין.",
          hint: "אנו רוצים להוסיף (‎+) הרשאת execute (x)."
        },
        {
          type: "terminal_oracle",
          narrative: "הסקריפט greet.sh מקבל שם כארגומנט ומדפיס ברכה. אתה מריץ אותו עם הארגומנט Shit.",
          prompt: "מה תהיה הפלט של הפקודה?",
          context: [
            "$ cat greet.sh",
            "#!/bin/bash",
            "echo \"Hello, $1\"",
            "",
            "$ ./greet.sh Shir"
          ],
          options: [
            "Hello, $1",
            "Hello, Shir",
            "Hello,",
            "שגיאה: משתנה לא מוגדר"
          ],
          correct: 1,
          explanation: "המשתנה $1 מכיל את הארגomנט הראשון שהועבר לסקריפט. כאשר מריצים ./greet.sh Shir, הערך של $1 הוא Shir, ולכן הפלט יהיה Hello, Shir."
          hint: "ב-bash, $1 מתחלף בארגומנט הראשון שהועבר בשורת הפקודה."
        },
        {
          type: "flag_map",
          narrative: "במעבדה יש לוח עם משתנים מיוחדים של bash. עליך לקשר כל משתנה להגדרתו.",
          pairs: [
            { term: "$0", definition: "שם הסקריפט עצמו" },
            { term: "$1", definition: "הארגומנט הראשון שהועבר לסקריפט" },
            { term: "$#", definition: "מספר הארגומנטים שהועברו" },
            { term: "$@", definition: "כל הארגומנטים כרשימה" }
          ],
          explanation: "משתני ה-positional parameters של bash ($0, $1, $#, $@) הם כלי מרכזי לכתיבת סקריפטים גמישים שמגיבים לקלט מהמשתמש.",
          hint: "המספר אחרי $ מציין את מיקום הארגומנט. $0 הוא הסקריפט עצמו, $1 הוא הראשון שאחריו."
        }
      ]
    },
    {
      id: 1,
      name: "זרימת שליטה",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.7 - סקריפטים/1.7 - סקריפטים - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          narrative: "אתה בוחן בלוק if קלאסי. 5 גדול מ-3, אבל האם bash יודע את זה?",
          prompt: "מה תהיה הפלט של הקוד?",
          context: [
            "if [ 5 -gt 3 ]; then",
            "    echo \"yes\"",
            "else",
            "    echo \"no\"",
            "fi"
          ],
          options: [
            "no",
            "yes",
            "true",
            "1"
          ],
          correct: 1,
          explanation: "האופרטור -gt (greater than) בודק אם המספר השמאלי גדול מהימני. 5 -gt 3 מחזיר true, ולכן הבלוק then מתבצע ומודפס yes.",
          hint: "gt מגיע מ-greater than. האם 5 גדול מ-3?"
        },
        {
          type: "command_forge",
          narrative: "אתה כותב תנאי שבודק אם קובץ קיים לפני שמנסה לקרוא ממנו.",
          prompt: "השלם את תנאי הבדיקה שבודק אם $file הוא קובץ רגיל.",
          commandTemplate: "if [ ___ \"$file\" ]; then",
          answers: ["-f"],
          explanation: "הדגל -f בודק האם הנתיב מצביע על קובץ רגיל (file) שקיים. זה שונה מ-e שבודק כל סוג של קובץ, ומ-d שבודק ספרייה.",
          hint: "הדגל הוא אות אחת שמייצגת file."
        },
        {
          type: "terminal_oracle",
          narrative: "לולאת for פשוטה רצה על רשימת מספרים ומדפיסה כל אחד.",
          prompt: "מה תהיה הפלט של הקוד?",
          context: [
            "for i in 1 2 3; do",
            "    echo $i",
            "done"
          ],
          options: [
            "1 2 3",
            "123",
            "1\n2\n3",
            "i\ni\ni"
          ],
          correct: 2,
          explanation: "לולאת for עוברת על כל ערך ברשימה ומריצה את גוף הלולאה עבורו. הפקודה echo מדפיסה כל ערך בשורה נפרדת, ולכן הפלט הוא 1, 2 ו-3 בשלוש שורות.",
          hint: "echo מוסיף שבירת שורה בסוף כל הדפסה."
        },
        {
          type: "flag_map",
          narrative: "בdash יש אופרטורים מיוחדים לבדיקות בתוך סוגריים מרובעים. עליך לקשר כל אופרטור להגדרתו.",
          pairs: [
            { term: "-eq", definition: "שווה (equal)" },
            { term: "-gt", definition: "גדול מ- (greater than)" },
            { term: "-f", definition: "הנתיב הוא קובץ רגיל" },
            { term: "-d", definition: "הנתיב הוא ספרייה" }
          ],
          explanation: "bash משתמש באופרטורים מילוליים (-eq, -gt) לבדיקות מספריות ובדגלים (-f, -d) לבדיקות קבצים. הסוגריים המרובעים [ ] הם למעשה פקודה בפני עצמה.",
          hint: "האותיות מייצגות את המילה האנגלית: eq=equal, gt=greater than, f=file, d=directory."
        }
      ]
    },
    {
      id: 2,
      name: "בוס - שגיאת הלוגיקה",
      isBoss: true,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.7 - סקריפטים/1.7 - סקריפטים - הרצאה/",
      challenges: [
        {
          type: "script_debug",
          narrative: "סקריפט גיבוי חשוב נכשל. כל הקבצים ב-/home צריכים להועתק ל-/backup, אבל משהו לא עובד.",
          script: "#!/bin/bash\nfor file in /home/*; do\n    cp file /backup/\ndone",
          filename: "backup.sh",
          options: [
            "חסרה נקודה-פסיק אחרי /home/*",
            "המשתנה file צריך להיות $file בתוך הלולאה",
            "צריך להשתמש ב-mv במקום cp",
            "cp דורש את הדגל -r"
          ],
          correct: 1,
          explanation: "בתוך לולאת for, הגישה למשתנה חייבת להיות עם סימן $. הפקודה cp file /backup/ מנסה להעתיק קובץ ששמו המילולי file, שלא קיים. הפקודה הנכונה היא cp $file /backup/.",
          hint: "בbash, כדי להשתמש בערך של משתנה צריך להוסיף לפניו $. בלי זה bash מתייחס לזה כמחרוזת מילולית."
        },
        {
          type: "terminal_oracle",
          narrative: "לאחר הרצת פקודה, אתה רוצה לדעת האם היא הצליחה. אתה בודק את קוד היציאה.",
          prompt: "מה יהיה הפלט של echo $? לאחר פקודה שהצליחה?",
          context: [
            "$ cp file.txt /backup/",
            "$ echo $?"
          ],
          options: [
            "1",
            "true",
            "0",
            "success"
          ],
          correct: 2,
          explanation: "המשתנה $? מכיל את קוד היציאה של הפקודה האחרונה. קוד 0 מציין הצלחה, וכל ערך אחר מציין שגיאה. זהו מוסכמה אוניברסלית בתוכנות לינוקס.",
          hint: "ב-Unix, 0 פירושו הצלחה. ערכים חיוביים מציינים שגיאות שונות."
        },
        {
          type: "pipe_builder",
          narrative: "אתה מריץ סקריפט גיבוי ורוצה לראות את הפלט על המסך ובמקביל לשמור אותו בקובץ לוג, כולל שגיאות.",
          goal: "הרץ את backup.sh כך שגם stdout וגם stderr יופיעו על המסך וישמרו ל-backup.log",
          options: [
            "./backup.sh 2>&1 | tee backup.log",
            "./backup.sh | tee backup.log",
            "./backup.sh > backup.log 2>&1",
            "./backup.sh 2>/dev/null | tee backup.log"
          ],
          correct: 0,
          explanation: "הביטוי 2>&1 מפנה את stderr (2) לאותו יעד של stdout (1). לאחר מכן tee מציג את הפלט המשולב על המסך ובמקביל כותב אותו לקובץ backup.log.",
          hint: "tee מאפשר לראות את הפלט ולשמור אותו בו-זמנית. אבל קודם צריך לוודא שגם שגיאות נכנסות לצינור."
        },
        {
          type: "command_forge",
          narrative: "אתה צריך לשמור את תאריך היום כמחרוזת בתוך משתנה. הפקודה date +%Y%m%d מחזירה את התאריך, אבל איך מכניסים אותה למשתנה?",
          prompt: "השלם את הפקודה כדי ללכוד את הפלט של date לתוך המשתנה result.",
          commandTemplate: "result=___(date +%Y%m%d)",
          answers: ["$("],
          explanation: "התחביר $(...) מבצע command substitution - הוא מריץ את הפקודה בתוך הסוגריים ומחליף את כל הביטוי בפלט שלה. זה הדרך המודרנית, עדיפה על backticks.",
          hint: "בbash יש דרך לרוץ פקודה ולהכניס את הפלט שלה ישירות לתוך ביטוי. היא נראית כמו סימן דולר ואז סוגריים."
        }
      ]
    }
  ]
};
