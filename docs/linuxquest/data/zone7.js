window.ZONE_7 = {
  id: 7,
  name: "אדון הזמן",
  subtitle: "crontab, cron syntax, scheduled tasks",
  color: "#89dceb",
  boss: "כאוס חצות",
  encounters: [
    {
      id: 0,
      name: "דקדוק הזמן",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.8 - משימות מתוזמנות/1.8 - משימות מתוזמנות - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          narrative: "אתה נכנס לחדר שעונים עתיק. על הקיר תלויים לוחות זמנים של משימות אוטומטיות. אתה רוצה לראות מה מתוזמן כבר.",
          prompt: "מה עושה הפקודה crontab -l?",
          context: [
            "$ crontab -l",
            "30 2 * * * /home/user/backup.sh",
            "0 9 * * 1 /home/user/weekly_report.sh"
          ],
          options: [
            "מוחקת את כל הcrontab",
            "פותחת את הcrontab לעריכה",
            "מציגה את תוכן הcrontab הנוכחי",
            "מריצה את כל המשימות המתוזמנות מיד"
          ],
          correct: 2,
          explanation: "הדגל -l מגיע מ-list. הפקודה crontab -l מציגה את כל המשימות המתוזמנות של המשתמש הנוכחי. כל שורה היא משימה נפרדת עם חמישה שדות זמן ואחריהם הפקודה.",
          hint: "הדגל -l מגיע מהמילה list."
        },
        {
          type: "command_forge",
          narrative: "אתה צריך להוסיף משימה חדשה לcrontab. עליך לפתוח אותו לעריכה.",
          prompt: "השלם את הפקודה כדי לפתוח את הcrontab לעריכה.",
          commandTemplate: "crontab ___",
          answers: ["-e"],
          explanation: "הדגל -e מגיע מ-edit. הפקודה crontab -e פותחת את קובץ הcrontab בעורך הטקסט המוגדר במערכת (בדרך כלל nano או vim), ומאפשרת להוסיף, לשנות או למחוק משימות.",
          hint: "הדגל הוא אות אחת שמייצגת edit."
        },
        {
          type: "terminal_oracle",
          narrative: "אתה מסתכל על cron entry שמכיל חמישה כוכביות. מה זה אומר?",
          prompt: "מה המשמעות של cron job עם חמישה כוכביות?",
          context: [
            "* * * * * /home/user/check.sh"
          ],
          options: [
            "הסקריפט לעולם לא ירוץ",
            "הסקריפט ירוץ פעם ביום",
            "הסקריפט ירוץ כל דקה",
            "הסקריפט ירוץ כל שעה"
          ],
          correct: 2,
          explanation: "כוכבית בכל שדה פירושה כל ערך אפשרי. חמש כוכביות אומר: כל דקה, כל שעה, כל יום בחודש, כל חודש, כל יום בשבוע - כלומר הפקודה תרוץ כל דקה.",
          hint: "כוכבית אחת = כל ערך. כשכל חמשת השדות הם כוכבית, מה התדירות הגבוהה ביותר האפשרית?"
        },
        {
          type: "flag_map",
          narrative: "cron משתמש בחמישה שדות לתיאור מועד הריצה. עליך לקשר כל מיקום לשדה שהוא מייצג.",
          pairs: [
            { term: "שדה ראשון (0-59)", definition: "דקה" },
            { term: "שדה שני (0-23)", definition: "שעה" },
            { term: "שדה שלישי (1-31)", definition: "יום בחודש" },
            { term: "שדה חמישי (0-6)", definition: "יום בשבוע (0=ראשון)" }
          ],
          explanation: "סדר שדות ה-cron הוא: דקה שעה יום-בחודש חודש יום-בשבוע. ניתן לזכור את זה עם המשפט: Minute Hour DayOfMonth Month DayOfWeek.",
          hint: "הסדר הוא מהיחידה הקטנה ביותר לגדולה ביותר, ואז יום בשבוע בסוף."
        }
      ]
    },
    {
      id: 1,
      name: "תבניות לוח הזמנים",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.8 - משימות מתוזמנות/1.8 - משימות מתוזמנות - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          narrative: "אתה קורא cron job שנראה פשוט. שני מספרים ואז שלוש כוכביות.",
          prompt: "מה המשמעות של cron entry זה?",
          context: [
            "30 2 * * * /home/user/backup.sh"
          ],
          options: [
            "כל 30 דקות בשעה 2",
            "כל יום בשעה 02:30",
            "ב-30 בחודש בשעה 2",
            "כל יומיים בשעה 2:30"
          ],
          correct: 1,
          explanation: "השדה הראשון (30) הוא הדקה, השני (2) הוא השעה, ושלוש הכוכביות אומרות כל יום, כל חודש, כל יום בשבוע. יחד: כל יום בשעה 02:30.",
          hint: "זכור את הסדר: דקה, שעה, יום-בחודש, חודש, יום-בשבוע."
        },
        {
          type: "command_forge",
          narrative: "אתה צריך להריץ סקריפט כל 15 דקות. התחביר */N אומר כל N יחידות.",
          prompt: "השלם את cron expression כדי להריץ script.sh כל 15 דקות.",
          commandTemplate: "___/15 * * * * /home/user/script.sh",
          answers: ["*"],
          explanation: "התחביר */15 בשדה הדקות אומר כל 15 דקות (0, 15, 30, 45). הכוכבית לפני הנטייה היא חובה - היא מייצגת את הטווח הכולל שממנו נוצרת החלוקה.",
          hint: "*/N אומר כל N יחידות. מה הסמל שמייצג את הטווח הכולל?"
        },
        {
          type: "terminal_oracle",
          narrative: "cron job עם 0 בהתחלה, 4 אחריו, ואז כוכביות עם 0 בסוף.",
          prompt: "מה המשמעות של cron entry זה?",
          context: [
            "0 4 * * 0 /home/user/weekly_clean.sh"
          ],
          options: [
            "כל יום בשעה 4:00",
            "כל שנה בינואר בשעה 4:00",
            "כל ראשון בשעה 04:00",
            "כל 4 שעות ביום ראשון"
          ],
          correct: 2,
          explanation: "השדה החמישי (0) הוא יום בשבוע, כאשר 0 מייצג יום ראשון (Sunday). השדות הראשון והשני (0 4) אומרים דקה 0, שעה 4. ביחד: כל יום ראשון בשעה 04:00.",
          hint: "השדה האחרון הוא יום בשבוע, כאשר 0 = ראשון (Sunday). בדוק את שדות הדקה והשעה."
        },
        {
          type: "flag_map",
          narrative: "cron תומך בכמה תחביר מיוחדים מעבר למספרים פשוטים. עליך לקשר כל תחביר למשמעותו.",
          pairs: [
            { term: "*/5", definition: "כל 5 יחידות" },
            { term: "1,3,5", definition: "ב-1, ב-3 וב-5" },
            { term: "1-5", definition: "מ-1 עד 5 (רצף)" },
            { term: "@daily", definition: "פעם ביום בחצות (00:00)" }
          ],
          explanation: "cron תומך בתחביר עשיר: */N לחלוקה, פסיקים לרשימות, מקף לטווחים, ו-@ macros לתבניות נפוצות כמו @daily, @weekly, @reboot.",
          hint: "*/N = כל N. פסיק מפריד ערכים ספציפיים. מקף יוצר טווח רצוף."
        }
      ]
    },
    {
      id: 2,
      name: "בוס - כאוס חצות",
      isBoss: true,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.8 - משימות מתוזמנות/1.8 - משימות מתוזמנות - הרצאה/",
      challenges: [
        {
          type: "script_debug",
          narrative: "מישהו הגדיר cron job שאמור לרוץ בתחילת כל שעה, אבל המשימה לא מתבצעת בכלל. הסתכל על ה-crontab entry.",
          script: "60 * * * * /home/user/script.sh",
          filename: "crontab entry",
          options: [
            "חסרה נטייה אחורית לפני /home",
            "שדה הדקות לא יכול להיות 60, הטווח הוא 0-59",
            "צריך להוסיף כוכבית שישית",
            "הנתיב לסקריפט חייב להיות יחסי"
          ],
          correct: 1,
          explanation: "שדה הדקות בcron תקף רק בטווח 0-59. הערך 60 אינו חוקי ו-cron יתעלם מהכניסה כולה. כדי להריץ בתחילת כל שעה יש להשתמש ב-0 * * * *.",
          hint: "בדוק את הטווח החוקי של שדה הדקות. השעה מחזורית - מה הדקה האחרונה בשעה?"
        },
        {
          type: "terminal_oracle",
          narrative: "עמית נכנס לפאניקה - הוא הריץ פקודה ועכשיו כל לוח הזמנים שלו נמחק.",
          prompt: "איזו פקודה מוחקת את כל הcrontab של המשתמש?",
          context: [
            "$ crontab -r",
            "$ crontab -l",
            "no crontab for user"
          ],
          options: [
            "crontab -d",
            "crontab -c",
            "crontab -r",
            "crontab --reset"
          ],
          correct: 2,
          explanation: "הדגל -r מגיע מ-remove. הפקודה crontab -r מוחקת את כל קובץ הcrontab של המשתמש ללא אישור ואין דרך לשחזר אותו. זוהי פקודה מסוכנת שיש להיזהר ממנה.",
          hint: "הדגל הוא אות אחת שמייצגת remove. הזהר - הפקודה הזאת אינה מבקשת אישור."
        },
        {
          type: "pipe_builder",
          narrative: "יש לך עשרות cron jobs ואתה צריך למצוא במהירות אילו מהם קשורים לגיבויים.",
          goal: "הצג רק את cron jobs שמכילים את המילה backup",
          options: [
            "crontab -l | grep \"backup\"",
            "grep \"backup\" | crontab -l",
            "crontab -l > grep backup",
            "crontab --search backup"
          ],
          correct: 0,
          explanation: "הפקודה crontab -l מציגה את כל המשימות, ואז ה-pipe מעביר את הפלט ל-grep שמסנן ומציג רק שורות המכילות את המילה backup.",
          hint: "crontab -l מפיק את הרשימה. grep יכול לסנן את הפלט דרך pipe."
        },
        {
          type: "command_forge",
          narrative: "אתה כותב cron job שמריץ סקריפט גיבוי בשעה 3 בלילה כל יום, בכל חודש.",
          prompt: "השלם את שדה החודש בcron expression כדי שיתאים לכל חודש.",
          commandTemplate: "0 3 * ___ * /home/user/backup.sh",
          answers: ["*"],
          explanation: "כוכבית בשדה החודש (השדה הרביעי) פירושה כל חודש. יחד עם 0 (דקה 0), 3 (שעה 3), * (כל יום), * (כל חודש), * (כל יום בשבוע) - המשמעות היא כל יום בשעה 03:00.",
          hint: "אנו רוצים שהסקריפט ירוץ בכל חודש ללא הגבלה. מה הסמל שאומר 'כל ערך' בcron?"
        }
      ]
    }
  ]
};
