window.ZONE_8 = {
  id: 8,
  name: "פיקוד המערכת",
  subtitle: "systemctl, journalctl, apt",
  color: "#b4befe",
  boss: "השירות הנכשל",
  encounters: [
    {
      id: 0,
      name: "שליטה בשירותים",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/2 - ניהול המערכת/2.1 - שירותים ולוגים/2.1 - שירותים ולוגים - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          narrative: "אתה נכנס לחדר השליטה. על המסכים פועלים עשרות שירותים. אתה צריך לבדוק את מצב שרת nginx.",
          prompt: "מה מציגה הפקודה systemctl status nginx?",
          context: [
            "$ systemctl status nginx",
            "* nginx.service - A high performance web server",
            "   Loaded: loaded (/lib/systemd/system/nginx.service)",
            "   Active: active (running) since Mon 2025-01-01 10:00:00"
          ],
          options: [
            "מריצה את שירות nginx מחדש",
            "מציגה אם השירות פעיל, מופסק, ומתי הוא התחיל",
            "מציגה את גרסת nginx המותקנת",
            "מציגה את ה-config של nginx"
          ],
          correct: 1,
          explanation: "systemctl status מציגה את המצב הנוכחי של השירות: האם הוא active (running) או inactive (dead), מתי הוא התחיל, ואת שורות הלוג האחרונות שלו.",
          hint: "status - מצב. מה אתה מצפה לראות כשאתה שואל על מצב שירות?"
        },
        {
          type: "command_forge",
          narrative: "nginx עובד עכשיו, אבל בכל פעם שהשרת מאותחל הוא לא מתחיל אוטומטית. אתה צריך לתקן את זה.",
          prompt: "השלם את הפקודה כדי שnginx יתחיל אוטומטית בכל אתחול מערכת.",
          commandTemplate: "systemctl ___ nginx",
          answers: ["enable"],
          explanation: "systemctl enable יוצר symlinks במיקומים שsystemd בודק בזמן אתחול, כך שהשירות יתחיל אוטומטית. זה שונה מ-start שמתחיל את השירות רק עכשיו.",
          hint: "אנו רוצים להפעיל (enable) את השירות לאתחול אוטומטי, לא רק להתחיל (start) אותו עכשיו."
        },
        {
          type: "terminal_oracle",
          narrative: "אתה רוצה לראות סקירה כללית של כל השירותים הפעילים במערכת.",
          prompt: "מה מציגה הפקודה הזאת?",
          context: [
            "$ systemctl list-units --type=service --state=active | head -5",
            "  UNIT                    LOAD   ACTIVE SUB     DESCRIPTION",
            "  cron.service            loaded active running Regular background program processing daemon",
            "  dbus.service            loaded active running D-Bus System Message Bus",
            "  networking.service      loaded active running Raise network interfaces",
            "  nginx.service           loaded active running A high performance web server",
            "  ssh.service             loaded active running OpenBSD Secure Shell server"
          ],
          options: [
            "רק שירות ה-cron",
            "כל השירותים הפעילים, עם הגבלה לחמש שורות ראשונות",
            "כל יחידות systemd מכל הסוגים",
            "שירותים שנכשלו בלבד"
          ],
          correct: 1,
          explanation: "list-units --type=service מסנן רק שירותים (ולא טיימרים, sockets וכדומה). --state=active מציג רק שירותים פעילים. head -5 מגביל לחמש תוצאות ראשונות.",
          hint: "שלושת הדגלים מצטברים: type, state, וה-head מגביל את הפלט."
        },
        {
          type: "flag_map",
          narrative: "systemctl תומך במספר פעולות שונות על שירותים. עליך לקשר כל פעולה למשמעותה.",
          pairs: [
            { term: "start", definition: "הפעל את השירות עכשיו" },
            { term: "stop", definition: "עצור את השירות עכשיו" },
            { term: "enable", definition: "הפעל את השירות אוטומטית בכל אתחול" },
            { term: "disable", definition: "אל תפעיל את השירות בעת אתחול" }
          ],
          explanation: "ב-systemd יש הבחנה חשובה בין הפעלה מיידית (start/stop) לבין הגדרת התנהגות באתחול (enable/disable). שירות יכול להיות enabled אבל stopped, ולהיפך.",
          hint: "start/stop פועלים על המצב הנוכחי. enable/disable פועלים על מה שיקרה בפעם הבאה שהמחשב יאותחל."
        }
      ]
    },
    {
      id: 1,
      name: "קריאת הלוגים",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/2 - ניהול המערכת/2.2 - מנהל חבילות/2.2 - מנהל חבילות - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          narrative: "משהו השתבש לפני שעה ואתה צריך לבדוק את הלוגים האחרונים של המערכת.",
          prompt: "מה עושה הפקודה journalctl -n 5?",
          context: [
            "$ journalctl -n 5",
            "Jan 01 10:55:01 server kernel: eth0: renamed from veth...",
            "Jan 01 10:56:14 server sshd: Accepted publickey for user",
            "Jan 01 10:57:02 server nginx: 127.0.0.1 GET /api/status 200",
            "Jan 01 10:58:45 server cron: pam_unix(cron:session): session opened",
            "Jan 01 10:59:59 server kernel: Out of memory: Kill process 1234"
          ],
          options: [
            "מציגה לוגים מ-5 שעות אחרונות",
            "מציגה 5 שורות הלוג האחרונות",
            "מציגה לוגים מ-5 ימים אחרונים",
            "מציגה לוגים של 5 שירותים"
          ],
          correct: 1,
          explanation: "הדגל -n מגיע מ-number of lines. journalctl -n 5 מציגה את 5 הרשומות האחרונות ביומן המערכת. זה שימושי לבדיקה מהירה של מה קרה לאחרונה.",
          hint: "הדגל -n עם מספר - חשוב על head ו-tail שגם הם משתמשים ב-n."
        },
        {
          type: "command_forge",
          narrative: "nginx חוזר לשגות ואתה צריך לראות רק את הלוגים הספציפיים שלו, לא של כל המערכת.",
          prompt: "השלם את הפקודה כדי לראות רק את הלוגים של שירות nginx.",
          commandTemplate: "journalctl ___ nginx",
          answers: ["-u"],
          explanation: "הדגל -u מגיע מ-unit. journalctl -u nginx מציגה רק את הרשומות ביומן שנוצרו על ידי שירות nginx, מה שמאפשר לזהות בעיות ספציפיות לאותו שירות.",
          hint: "אנו מסננים לפי unit (יחידת systemd). הדגל הוא אות אחת שמייצגת unit."
        },
        {
          type: "terminal_oracle",
          narrative: "אתה רוצה לעקוב אחרי לוגים בזמן אמת בזמן שאתה מבצע בדיקות.",
          prompt: "מה עושה journalctl -f?",
          context: [
            "$ journalctl -f",
            "-- Logs begin at Mon 2025-01-01. --",
            "Jan 01 11:00:01 server cron[1234]: (user) CMD (/home/user/check.sh)",
            "Jan 01 11:01:05 server nginx: 127.0.0.1 - GET /index.html 200",
            "..."
          ],
          options: [
            "מסנן (filter) לוגים לפי מילת חיפוש",
            "מציגה רק לוגים של כשלים (failures)",
            "עוקבת אחרי הלוג בזמן אמת ומציגה שורות חדשות כשנוספות",
            "מציגה לוגים מהאתחול הראשון של המערכת"
          ],
          correct: 2,
          explanation: "הדגל -f מגיע מ-follow, בדומה ל-tail -f. הפקודה נשארת פעילה ומדפיסה שורות חדשות כשנוספות ליומן. שימושי לניטור בזמן ריצה.",
          hint: "הדגל -f משמש גם ב-tail -f. מה עושה tail -f?"
        },
        {
          type: "flag_map",
          narrative: "journalctl תומך בדגלים שונים לסינון ועיון בלוגים. עליך לקשר כל דגל למשמעותו.",
          pairs: [
            { term: "-n N", definition: "הצג N שורות הלוג האחרונות" },
            { term: "-u unit", definition: "הצג לוגים של שירות ספציפי בלבד" },
            { term: "-b", definition: "הצג לוגים מאז האתחול האחרון" },
            { term: "-f", definition: "עקוב אחרי הלוג בזמן אמת" }
          ],
          explanation: "journalctl הוא כלי עוצמתי לניהול היומן של systemd. שילוב של דגלים מאפשר סינון מדויק: journalctl -u nginx -n 50 -b מציג 50 שורות אחרונות של nginx מאז האתחול.",
          hint: "חשוב על המקבילות: -n כמו head/tail, -u כמו grep לשירות, -b מאז boot, -f כמו tail -f."
        }
      ]
    },
    {
      id: 2,
      name: "בוס - השירות הנכשל",
      isBoss: true,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/2 - ניהול המערכת/2.1 - שירותים ולוגים/2.1 - שירותים ולוגים - הרצאה/",
      challenges: [
        {
          type: "pipe_builder",
          narrative: "nginx נכשל לפני שעה ואתה צריך למצוא את השגיאות בלוגים שלו בדיוק.",
          goal: "מצא שגיאות בלוגי nginx מהשעה האחרונה",
          options: [
            "journalctl -u nginx --since \"1 hour ago\" | grep -i \"error\"",
            "grep -i \"error\" | journalctl -u nginx",
            "journalctl --since \"1 hour ago\" -u nginx > error",
            "journalctl -u nginx | find \"error\""
          ],
          correct: 0,
          explanation: "journalctl -u nginx מסנן ללוגים של nginx בלבד. --since \"1 hour ago\" מגביל לשעה האחרונה. הפלט עובר ל-grep -i (case insensitive) שמוצא שורות עם error.",
          hint: "צריך לשרשר: journalctl עם פילטרים של שירות וזמן, ואז grep למציאת שגיאות."
        },
        {
          type: "command_forge",
          narrative: "אתה צריך להתקין את htop כדי לנטר את המערכת. השתמש במנהל החבילות apt.",
          prompt: "השלם את הפקודה כדי להתקין את htop.",
          commandTemplate: "sudo apt ___ htop",
          answers: ["install"],
          explanation: "הפקודה apt install מתקינה חבילות מהמאגרים המוגדרים. sudo נדרש כי התקנת חבילות דורשת הרשאות root. לאחר apt install מומלץ לאשר עם y כשנשאלים.",
          hint: "מה הפעולה שאתה רוצה לבצע על החבילה? להתקין = install."
        },
        {
          type: "script_debug",
          narrative: "סקריפט שדרוג המערכת שלך תמיד נכשל עם שגיאות על חבילות שלא נמצאות. הסתכל על הסקריפט.",
          script: "#!/bin/bash\necho \"Starting system upgrade...\"\napt upgrade -y\necho \"Done!\"",
          filename: "upgrade.sh",
          options: [
            "צריך להוסיף sudo לפני apt upgrade",
            "צריך להפעיל apt update לפני apt upgrade כדי לעדכן את רשימת החבילות",
            "הדגל -y אינו קיים ב-apt upgrade",
            "צריך להוסיף --fix-broken לפקודה"
          ],
          correct: 1,
          explanation: "apt upgrade מנסה לשדרג חבילות לפי רשימת הגרסאות המקומית. בלי apt update קודם, הרשימה עלולה להיות ישנה ו-apt לא יידע שיש גרסאות חדשות. הסדר הנכון הוא תמיד: update ואז upgrade.",
          hint: "apt עובד עם רשימת חבילות מקומית. מה צריך לקרות לפני שמנסים לשדרג?"
        },
        {
          type: "terminal_oracle",
          narrative: "לפני שמתקין חבילה אתה רוצה לוודא שהיא קיימת ולקרוא את תיאורה.",
          prompt: "מה עושה הפקודה apt search htop?",
          context: [
            "$ apt search htop",
            "Sorting... Done",
            "Full Text Search... Done",
            "htop/jammy 3.0.5-7 amd64",
            "  interactive processes viewer",
            "iftop/jammy 1.0~pre4-7 amd64",
            "  displays bandwidth usage on an interface by host"
          ],
          options: [
            "מתקינה את htop",
            "מציגה מידע על חבילות שמתאימות לחיפוש htop",
            "מסירה את htop אם הוא מותקן",
            "בודקת אם htop זמין לשדרוג"
          ],
          correct: 1,
          explanation: "apt search מחפש בשמות ובתיאורים של חבילות. הפלט מציג את שם החבילה, גרסתה, ארכיטקטורה, ותיאור קצר. שימושי לגלות חבילות לפני התקנתן.",
          hint: "search - חיפוש. הפקודה לא משנה שום דבר במערכת, רק מחפשת ומציגה מידע."
        }
      ]
    }
  ]
};
