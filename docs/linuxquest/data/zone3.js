window.ZONE_3 = {
  id: 3,
  name: "שומרי השערים",
  subtitle: "משתמשים, קבוצות, הרשאות",
  color: "#f38ba8",
  boss: "רוח ההרשאות",
  encounters: [
    {
      id: 0,
      name: "ממלכת הזהות",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.4 - הרשאות בלינוקס/1.4 - הרשאות בלינוקס - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          prompt: "agent47@authserver:~$",
          command: "id",
          context: ["uid=1001(agent47) gid=1001(agent47) groups=1001(agent47),27(sudo),1002(developers)"],
          options: [
            "מציגה UID, GID ואת כל הקבוצות של המשתמש",
            "מציגה רק את שם המשתמש",
            "מציגה תהליכים",
            "מציגה נתוני כניסה"
          ],
          correct: 0,
          narrative: "גלה את הזהות המלאה של המשתמש.",
          explanation: "id מציגה UID (User ID), GID (Group ID) ואת כל הקבוצות. uid=1001 = מספר משתמש, groups = קבוצות חברות.",
          hint: "id = identity. מציגה uid, gid, ואת כל הקבוצות."
        },
        {
          type: "command_forge",
          prompt: "agent47@authserver:~$",
          commandTemplate: "sudo ___",
          answers: ["-l"],
          narrative: "בדוק אילו פקודות מותר לך להריץ כ-root.",
          explanation: "sudo -l מציגה את כל הפקודות שהמשתמש הנוכחי רשאי להריץ דרך sudo. חשוב לבדיקת הרשאות.",
          hint: "sudo -l = list. מציגה הרשאות sudo של המשתמש."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@authserver:~$",
          command: "cat /etc/passwd | grep agent47",
          context: ["agent47:x:1001:1001:Agent 47,,,:/home/agent47:/bin/bash"],
          options: [
            "שם משתמש, סיסמה (x), UID, GID, תיאור, תיקיית בית, מעטפת",
            "רק שם משתמש וסיסמה",
            "שם משתמש ו-UID בלבד",
            "קבוצות המשתמש"
          ],
          correct: 0,
          narrative: "קרא את פרטי המשתמש מ-/etc/passwd.",
          explanation: "/etc/passwd: שם:סיסמה(x):UID:GID:תיאור:בית:מעטפת. הסיסמה בפועל ב-/etc/shadow (מוצפנת). x = סיסמה קיימת.",
          hint: "7 שדות מופרדים ב-:. הסיסמה היא x כי מאוחסנת ב-/etc/shadow."
        },
        {
          type: "flag_map",
          pairs: [
            { term: "whoami", definition: "Print current username" },
            { term: "id", definition: "Print UID, GID and all group memberships" },
            { term: "su username", definition: "Switch to another user account" },
            { term: "sudo command", definition: "Run command as root (superuser do)" }
          ],
          narrative: "ארבע פקודות זהות וגישה.",
          explanation: "whoami=שם, id=זהות מלאה, su=החלפת משתמש, sudo=הרצה כ-root. sudo בטוח יותר מ-su כי מתעד פעולות.",
          hint: "whoami פשוט, id מלא, su מחליף, sudo משדרג."
        }
      ]
    },
    {
      id: 1,
      name: "שפת ההרשאות",
      isBoss: false,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.4 - הרשאות בלינוקס/1.4 - הרשאות בלינוקס - הרצאה/",
      challenges: [
        {
          type: "terminal_oracle",
          prompt: "agent47@authserver:~$",
          command: "ls -l /etc/hosts",
          context: ["-rw-r--r-- 1 root root 223 Jan  1 12:00 /etc/hosts"],
          options: [
            "קובץ שניתן לקרוא ולכתוב על ידי root, קריאה בלבד לאחרים",
            "קובץ שניתן לקרוא ולכתוב על ידי כולם",
            "קובץ הרצה",
            "תיקייה"
          ],
          correct: 0,
          narrative: "פענח את מחרוזת ההרשאות.",
          explanation: "-rw-r--r--: - = קובץ, rw- = בעלים (read+write), r-- = קבוצה (read only), r-- = אחרים (read only). root הוא הבעלים.",
          hint: "3 קבוצות של 3 תווים: rwx=7, rw-=6, r--=4, ---=0."
        },
        {
          type: "command_forge",
          prompt: "agent47@authserver:~$",
          commandTemplate: "chmod ___ script.sh",
          answers: ["+x"],
          acceptedAlternatives: [["+x", "755", "u+x"]],
          narrative: "הפוך את הסקריפט להרצה.",
          explanation: "chmod +x מוסיף הרשאת הרצה לכולם. 755 = rwxr-xr-x (בעלים הכל, אחרים קרא+הרץ). u+x = רק לבעלים.",
          hint: "+x מוסיף execute permission. ניתן גם עם octal: 755."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@authserver:~$",
          command: "chmod 644 config.txt",
          context: ["-rw-r--r-- 1 agent47 agent47 1024 Jan 15 config.txt"],
          options: [
            "בעלים: קרא+כתוב, קבוצה: קרא בלבד, אחרים: קרא בלבד",
            "בעלים: הכל, קבוצה: קרא+הרץ, אחרים: קרא",
            "כולם: קרא+כתוב+הרץ",
            "בעלים: קרא בלבד, אחרים: ללא"
          ],
          correct: 0,
          narrative: "מה עושה chmod 644?",
          explanation: "644 = 6|4|4. 6=rw- (4+2=read+write), 4=r-- (read only), 4=r--. בעלים יכול לקרוא ולכתוב, כולם אחרים רק לקרוא. הגדרה נפוצה לקבצי config.",
          hint: "r=4, w=2, x=1. 6=r+w, 4=r only, 0=none."
        },
        {
          type: "flag_map",
          pairs: [
            { term: "chmod 777", definition: "Give all permissions to everyone (rwxrwxrwx)" },
            { term: "chmod 600", definition: "Owner read+write only, no permissions for others" },
            { term: "chmod 755", definition: "Owner all, group and others read+execute" },
            { term: "chown user:group", definition: "Change file owner and group" }
          ],
          narrative: "ערכי octal נפוצים לזיכרון.",
          explanation: "777 = כולם הכל (מסוכן!), 600 = פרטי (SSH keys), 755 = scripts ו-directories, chown לשינוי בעלות. 600 נפוץ ל-~/.ssh/id_rsa.",
          hint: "777 = הכל לכולם (מסוכן). 600 = פרטי. 755 = scripts. chown = בעלות."
        }
      ]
    },
    {
      id: 2,
      name: "בוס - רוח ההרשאות",
      isBoss: true,
      lectureUrl: "https://amittech.dev/לינוקס-בסיסי/1 - טרמינל/1.4 - הרשאות בלינוקס/1.4 - הרשאות בלינוקס - הרצאה/",
      challenges: [
        {
          type: "pipe_builder",
          goal: "Find all SUID files on the system (files with setuid bit)",
          options: [
            "find / -perm -4000 2>/dev/null",
            "ls -la / | grep suid",
            "find / -type s 2>/dev/null",
            "chmod -4000 / 2>/dev/null | find"
          ],
          correct: 0,
          narrative: "רוח ההרשאות מסתתרת בקבצי SUID. מצא אותה.",
          explanation: "find / -perm -4000 מוצאת קבצים עם SUID bit (-4000). 2>/dev/null מסתיר שגיאות 'permission denied'. SUID = הקובץ מורץ עם הרשאות הבעלים.",
          hint: "-perm -4000 = SUID bit. 2>/dev/null מסתיר שגיאות."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@authserver:~$",
          command: "ls -la /usr/bin/passwd",
          context: ["-rwsr-xr-x 1 root root 59640 Mar 14 /usr/bin/passwd"],
          options: [
            "passwd מורץ עם הרשאות root בגלל SUID bit (s)",
            "passwd רגיל ללא הרשאות מיוחדות",
            "passwd שייך ל-agent47",
            "passwd מוגן בקריאה בלבד"
          ],
          correct: 0,
          narrative: "passwd יכולה לשנות סיסמת root - כיצד?",
          explanation: "s במקום x = SUID bit. /usr/bin/passwd שייך ל-root ויש לו SUID, אז כל משתמש שמריץ passwd מקבל הרשאות root זמנית. זה מאפשר לשנות סיסמה.",
          hint: "s = SUID. הקובץ רץ עם הרשאות הבעלים (root), לא הרצים."
        },
        {
          type: "script_debug",
          filename: "setup.sh",
          script: "#!/bin/bash\nchmod 777 /etc/passwd\necho 'Permissions set'\nchmod 777 /etc/shadow\necho 'All done'",
          options: [
            "chmod 777 on /etc/passwd and /etc/shadow is a critical security vulnerability",
            "Missing sudo before chmod",
            "echo needs double quotes",
            "Wrong file paths"
          ],
          correct: 0,
          narrative: "סקריפט ההגדרה יוצר חור אבטחה ענק.",
          explanation: "/etc/passwd ו-/etc/shadow מכילים נתוני משתמשים וסיסמאות. chmod 777 מאפשר לכל משתמש לשנות אותם. ההרשאות הנכונות: /etc/passwd = 644, /etc/shadow = 640 או 000.",
          hint: "chmod 777 על קבצי מערכת = חור אבטחה קריטי!"
        },
        {
          type: "command_forge",
          prompt: "root@authserver:~#",
          commandTemplate: "chown ___:___ /var/app/data",
          answers: ["www-data", "www-data"],
          narrative: "העבר בעלות על ספריית האפליקציה למשתמש שירות.",
          explanation: "chown user:group file משנה בעלים וקבוצה. www-data הוא המשתמש הסטנדרטי לשרתי web (Apache/Nginx). הפרדה בין בעלות לקבוצה מגנה על נתונים.",
          hint: "chown USER:GROUP FILE. www-data הוא משתמש שרת web."
        }
      ]
    }
  ]
};
