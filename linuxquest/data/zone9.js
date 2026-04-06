window.ZONE_9 = {
  id: 9,
  name: "עומק המערכת",
  subtitle: "מבנה ספריות, /proc, דיסקים, mount",
  color: "#ff6c6b",
  boss: "תולעת השורש",
  encounters: [
    {
      id: 0,
      name: "אנטומיית לינוקס",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/2 - ניהול המערכת/2.3 - מערכת הקבצים/2.3 - מערכת הקבצים - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          narrative: "אתה יורד לעומק המערכת. הספרייה /etc היא לב ההגדרות של לינוקס. מה תמצא שם?",
          prompt: "מה יציג הפלט של הפקודה?",
          context: [
            "$ ls /etc | head -5",
            "apt",
            "bash.bashrc",
            "crontab",
            "hosts",
            "passwd"
          ],
          options: [
            "קבצי לוגים של המערכת",
            "קבצי הגדרות ותצורה של המערכת",
            "קבצי ההפעלה של תוכניות",
            "קבצים זמניים שנמחקים באתחול"
          ],
          correct: 1,
          explanation: "הספרייה /etc מכילה קבצי תצורה של המערכת. hosts מגדיר שמות מחשבים, passwd מכיל מידע על משתמשים, apt מכיל הגדרות מנהל החבילות. כמעט כל תצורת מערכת נמצאת כאן.",
          hint: "etc - מגיע מ-etcetera. כאן שומרים את ה'שאר' - כלומר את כל ההגדרות."
        },
        {
          type: "command_forge",
          narrative: "אתה רוצה לקרוא את מידע המעבד ישירות מהקרנל דרך מערכת הקבצים הווירטואלית /proc.",
          prompt: "השלם את הפקודה כדי לקרוא את מידע ה-CPU.",
          commandTemplate: "cat /proc/___",
          answers: ["cpuinfo"],
          explanation: "הקובץ /proc/cpuinfo מכיל מידע מפורט על המעבד: שם הדגם, מספר ה-cores, מהירות ה-clock, ויכולות כמו virtualization. הנתונים מגיעים ישירות מהקרנל בזמן אמת.",
          hint: "אנו מחפשים מידע על ה-CPU. הקובץ ב-/proc נקרא בשם ממש תיאורי."
        },
        {
          type: "terminal_oracle",
          narrative: "כשאתה מנסה להפנות שגיאות ל-/dev/null הן פשוט נעלמות. מה זה /dev/null?",
          prompt: "מה הוא /dev/null?",
          context: [
            "$ echo \"test\" > /dev/null",
            "$ cat /dev/null",
            "$"
          ],
          options: [
            "ספרייה ריקה לאחסון קבצים זמניים",
            "התקן וירטואלי שמשמיד כל נתון שנכתב אליו",
            "קובץ לוג מיוחד של הקרנל",
            "נקודת mount של כונן חיצוני"
          ],
          correct: 1,
          explanation: "/dev/null הוא התקן תו מיוחד שמשמיד כל מה שנכתב אליו. קריאה ממנו מחזירה EOF מיד. משתמשים בו להשתקת פלט לא רצוי, לדוגמה: command 2>/dev/null.",
          hint: "null פירושו כלום. מה קורה כשאתה כותב משהו ל-cat /dev/null?"
        },
        {
          type: "flag_map",
          narrative: "מבנה הספריות של לינוקס הוא תקני ומוגדר. עליך לקשר כל ספרייה לתפקידה.",
          pairs: [
            { term: "/etc", definition: "קבצי תצורה של המערכת" },
            { term: "/var/log", definition: "קבצי לוגים של המערכת והשירותים" },
            { term: "/tmp", definition: "קבצים זמניים שנמחקים באתחול" },
            { term: "/proc", definition: "מערכת קבצים וירטואלית עם נתוני קרנל בזמן אמת" }
          ],
          explanation: "מבנה ה-FHS (Filesystem Hierarchy Standard) מגדיר את מיקום הספריות בלינוקס. הבנת המבנה חיונית לאבחון בעיות: לוגים ב-/var/log, הגדרות ב-/etc, ומידע חי על המערכת ב-/proc.",
          hint: "var = variable (משתנה לאורך זמן), proc = processes (תהליכים ומידע קרנל), tmp = temporary."
        }
      ]
    },
    {
      id: 1,
      name: "דיסקים וצירופים",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/2 - ניהול המערכת/2.3 - מערכת הקבצים/2.3 - מערכת הקבצים - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          narrative: "השרת מתריע שהדיסק כמעט מלא. אתה צריך לבדוק את מצב השטח הפנוי.",
          prompt: "מה מציגה הפקודה df -h?",
          context: [
            "$ df -h",
            "Filesystem      Size  Used Avail Use% Mounted on",
            "/dev/sda1        50G   45G  5.0G  90% /",
            "/dev/sdb1       200G   80G  120G  40% /data",
            "tmpfs           4.0G  100M  3.9G   3% /run"
          ],
          options: [
            "מציגה את גודל כל קובץ בספרייה הנוכחית",
            "מציגה שימוש בדיסק לכל partition בפורמט קריא לאנוש",
            "מוצאת קבצים שתופסים הכי הרבה מקום",
            "מציגה מהירות קריאה וכתיבה לדיסק"
          ],
          correct: 1,
          explanation: "הפקודה df מגיעה מ-disk free. הדגל -h מגיע מ-human-readable ומציג את הגדלים ב-GB ו-MB במקום bytes. הפלט מציג לכל מערכת קבצים את הגודל הכולל, הנפח המשומש, הפנוי, האחוז, ונקודת ה-mount.",
          hint: "df = disk free. h = human readable. מה אתה מצפה לראות כשבודקים שטח פנוי בדיסק?"
        },
        {
          type: "command_forge",
          narrative: "אתה רוצה לראות את כל ההתקנים המחוברים למערכת, כולל כוננים שאין להם partitions מוגדרים.",
          prompt: "השלם את הפקודה כדי להציג את כל ההתקנים הבלוקיים, כולל ריקים.",
          commandTemplate: "lsblk ___",
          answers: ["-a"],
          explanation: "lsblk מציגה התקנים בלוקיים (כוננים) בצורת עץ. הדגל -a מגיע מ-all ומציג גם התקנים ריקים שבדרך כלל מוסתרים. שימושי לאבחון כוננים שלא מזוהים.",
          hint: "אנו רוצים לראות הכל, כולל התקנים ריקים. הדגל הוא אות אחת שמייצגת all."
        },
        {
          type: "terminal_oracle",
          narrative: "אתה צריך לבדוק ספציפית כמה מקום נשאר ב-partition השורש.",
          prompt: "מה מציגה הפקודה df -h /?",
          context: [
            "$ df -h /",
            "Filesystem      Size  Used Avail Use% Mounted on",
            "/dev/sda1        50G   45G  5.0G  90% /"
          ],
          options: [
            "מציגה את כל ה-partitions",
            "מציגה רק את שימוש הדיסק של ה-partition שמכיל את /",
            "מציגה את גודל הספרייה /",
            "מחזירה שגיאה כי / לא ניתן לבדיקה"
          ],
          correct: 1,
          explanation: "כשמעבירים נתיב ל-df, היא מציגה רק את ה-partition שמכיל את אותו נתיב. df -h / מציגה רק את ה-root partition, מה שמאפשר לבדוק במהירות אם השורש מתמלא.",
          hint: "df מקבלת נתיב כארגומנט ומציגה את ה-partition שמכיל אותו."
        },
        {
          type: "flag_map",
          narrative: "ניהול דיסקים בלינוקס כולל מספר פקודות וקבצים. עליך לקשר כל פקודה או קובץ לתפקידו.",
          pairs: [
            { term: "lsblk", definition: "הצג התקנים בלוקיים בצורת עץ" },
            { term: "df -h", definition: "הצג שטח פנוי בדיסק בפורמט קריא לאנוש" },
            { term: "/etc/fstab", definition: "הגדרות mount אוטומטי של partitions באתחול" },
            { term: "mount -a", definition: "הרכב את כל ה-partitions המוגדרים ב-fstab" }
          ],
          explanation: "ניהול אחסון בלינוקס: lsblk לרשימת התקנים, df לשטח פנוי, /etc/fstab להגדרת mount אוטומטי, ו-mount -a לביצוע ה-mount ידנית. שינוי fstab לא תקין יכול למנוע אתחול.",
          hint: "fstab = filesystem table. mount -a = mount all. lsblk = list block devices."
        }
      ]
    },
    {
      id: 2,
      name: "בוס - תולעת השורש",
      isBoss: true,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/2 - ניהול המערכת/2.3 - מערכת הקבצים/2.3 - מערכת הקבצים - הרצאה/",
      challenges: [
        {
          type: "pipe_builder",
          narrative: "אתה חוקר מערכת חשודה. אתה יודע שתוכנות עם הרשאת SUID רצות עם הרשאות הבעלים שלהן ועלולות להיות מסוכנות.",
          goal: "מצא את 10 הקבצים הראשונים עם הרשאת SUID במערכת כולה, תוך השתקת שגיאות הרשאות",
          options: [
            "find / -perm -4000 2>/dev/null | head -10",
            "find / -perm -4000 | head -10 2>/dev/null",
            "find / -suid 2>/dev/null | head -10",
            "ls -R / | grep suid | head -10"
          ],
          correct: 0,
          explanation: "find / מחפש בכל המערכת. -perm -4000 מוצא קבצים עם ה-SUID bit מוגדר. 2>/dev/null מנתב שגיאות הרשאות (כמו ספריות שלא ניתן לגשת) ל-/dev/null. head -10 מגביל לעשרה תוצאות.",
          hint: "צריך להשתיק שגיאות הרשאות (stderr) לפני ה-pipe, ולהגביל את מספר התוצאות עם head."
        },
        {
          type: "script_debug",
          narrative: "סקריפט ביקורת מערכת שנכתב לדו\"ח אבטחה חוזר עם שגיאות awk. הגרסה הנוכחית שבורה.",
          script: "#!/bin/bash\necho \"System Audit Report\"\nMEM=$(grep \"MemTotal\" /proc/meminfo | awk {print $2})\necho \"Total RAM: $MEM kB\"",
          filename: "audit.sh",
          options: [
            "grep צריך דגל -i לחיפוש case-insensitive",
            "הביטוי של awk חסר גרשיים - צריך להיות awk '{print $2}'",
            "המשתנה MEM צריך להיכתב באותיות קטנות",
            "צריך להשתמש ב-cat במקום grep"
          ],
          correct: 1,
          explanation: "awk דורש שהתוכנית שלו תהיה מוקפת בגרשיים כדי ש-shell לא יפרש את הסוגריים המסולסלים. ללא גרשיים, ה-shell מפרש את { כהתחלת בלוק פקודות וה-$2 כמשתנה shell. הצורה הנכונה היא awk '{print $2}'.",
          hint: "הסוגריים המסולסלים של awk צריכים להיות בתוך גרשיים כדי ש-shell לא יפרש אותם."
        },
        {
          type: "terminal_oracle",
          narrative: "אתה חוקר את מצב הזיכרון של המערכת. הקרנל חושף מידע זה דרך /proc.",
          prompt: "מה מציגה הפקודה?",
          context: [
            "$ grep \"MemTotal\" /proc/meminfo",
            "MemTotal:       16384000 kB"
          ],
          options: [
            "כמות הזיכרון הפנוי כרגע",
            "כמות הזיכרון הכוללת של המערכת ב-kB",
            "כמות ה-swap המוגדרת",
            "כמות הזיכרון שבשימוש על ידי הקרנל"
          ],
          correct: 1,
          explanation: "הקובץ /proc/meminfo מכיל מידע מפורט על מצב הזיכרון. הרשומה MemTotal מציגה את סך הזיכרון הפיזי הזמין למערכת ב-kilobytes. grep מסנן לשורה הספציפית הזאת.",
          hint: "MemTotal = Memory Total. הכמות מוצגת ב-kB (kilobytes)."
        },
        {
          type: "command_forge",
          narrative: "כחלק מחקירת המערכת, אתה רוצה לראות את שם דגם המעבד.",
          prompt: "השלם את הפקודה כדי לקרוא את מידע ה-CPU ולסנן לשם הדגם.",
          commandTemplate: "cat /proc/___ | grep \"model name\" | head -1",
          answers: ["cpuinfo"],
          explanation: "הקובץ /proc/cpuinfo מכיל שורות רבות עבור כל core. grep \"model name\" מסנן לשורות עם שם הדגם, ו-head -1 מציג רק את הראשונה (כי כל ה-cores זהים). זו שיטה מהירה לזהות את סוג המעבד.",
          hint: "הקובץ ב-/proc עם מידע על CPU נקרא בשם שמתאר בדיוק מה הוא מכיל."
        }
      ]
    }
  ]
};
