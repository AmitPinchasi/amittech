window.ZONE_5 = {
  id: 5,
  name: "שליטת תהליכים",
  subtitle: "ps, kill, signals, jobs, bg, fg",
  color: "#a6e3a1",
  boss: "צבא הזומבים",
  encounters: [
    {
      id: 0,
      name: "עין התהליכים",
      isBoss: false,
      challenges: [
        {
          type: "terminal_oracle",
          prompt: "agent47@procserver:~$",
          command: "ps aux | head -4",
          context: [
            "USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND",
            "root           1  0.0  0.1 168672  8396 ?        Ss   08:00   0:02 /sbin/init",
            "root           2  0.0  0.0      0     0 ?        S    08:00   0:00 [kthreadd]",
            "agent47     1089  0.0  0.1  12548  5120 pts/0    Ss   09:12   0:00 -bash"
          ],
          options: [
            "כל התהליכים הפעילים עם CPU, RAM, שם",
            "רק תהליכי המשתמש הנוכחי",
            "תהליכים ממוינים לפי CPU",
            "תהליכים שנכשלו"
          ],
          correct: 0,
          narrative: "ראה את כל התהליכים הפעילים במערכת.",
          explanation: "ps aux: a=כל המשתמשים, u=פורמט מפורט (CPU,MEM), x=גם תהליכים ללא טרמינל. PID=מזהה תהליך, %CPU, %MEM, STAT=סטטוס.",
          hint: "ps aux = process status, all users, user format, including background."
        },
        {
          type: "command_forge",
          prompt: "agent47@procserver:~$",
          commandTemplate: "pgrep ___",
          answers: ["nginx"],
          narrative: "מצא את ה-PID של שרת nginx.",
          explanation: "pgrep מחזיר PID לפי שם תהליך. pgrep nginx = מציג PID של כל תהליכי nginx. pidof nginx עושה דבר דומה. מהיר יותר מ-ps aux | grep nginx.",
          hint: "pgrep [שם] = מציג PID. pgrep nginx = מוצא nginx."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@procserver:~$",
          command: "ps aux | grep nginx | grep -v grep",
          context: [
            "www-data  1234  0.1  0.5  45000 20000 ?  S  09:00 0:05 nginx: worker",
            "www-data  1235  0.1  0.5  45000 20000 ?  S  09:00 0:05 nginx: worker"
          ],
          options: [
            "מציגה תהליכי nginx ללא שורת grep עצמה",
            "מציגה רק את תהליך grep",
            "מציגה את כל התהליכים",
            "שגיאה"
          ],
          correct: 0,
          narrative: "מדוע grep -v grep נדרש?",
          explanation: "ps aux | grep nginx מציגה גם את שורת grep עצמה ('grep nginx'). grep -v grep מסיר שורות המכילות 'grep'. pgrep מפתרת זאת אוטומטית.",
          hint: "grep -v = invert = הסתר שורות עם המילה. מסיר את grep מהתוצאות."
        },
        {
          type: "flag_map",
          pairs: [
            { term: "ps aux", definition: "Show all running processes with CPU/memory details" },
            { term: "top", definition: "Interactive real-time process monitor" },
            { term: "pgrep process", definition: "Find PID by process name" },
            { term: "ps aux --sort=-%cpu", definition: "Sort processes by CPU usage (descending)" }
          ],
          narrative: "ארבע פקודות לצפייה בתהליכים.",
          explanation: "ps aux = snapshot, top = live view, pgrep = מציאת PID, sort לסינון. top = Ctrl+C לצאת, Ctrl+Z להקפיא. htop הוא גרסה מורחבת יותר.",
          hint: "ps = snapshot, top = live. pgrep = find by name. sort לסידור."
        }
      ]
    },
    {
      id: 1,
      name: "שפת האותות",
      isBoss: false,
      challenges: [
        {
          type: "terminal_oracle",
          prompt: "agent47@procserver:~$",
          command: "kill -l | head -3",
          context: [
            " 1) SIGHUP  2) SIGINT  3) SIGQUIT  4) SIGILL  5) SIGTRAP",
            " 6) SIGABRT  7) SIGBUS  8) SIGFPE  9) SIGKILL 10) SIGUSR1",
            "11) SIGSEGV 12) SIGUSR2 13) SIGPIPE 14) SIGALRM 15) SIGTERM"
          ],
          options: [
            "רשימת כל האותות הזמינים עם מספריהם",
            "רשימת תהליכים שנהרגו",
            "קיצורי מקשים",
            "שגיאה - kill -l לא קיים"
          ],
          correct: 0,
          narrative: "גלה את שפת האותות של לינוקס.",
          explanation: "kill -l מציג את כל האותות. 9=SIGKILL (הרג מיידי), 15=SIGTERM (בקשה לסיום עדין), 2=SIGINT (כמו Ctrl+C). kill PID שולח SIGTERM כברירת מחדל.",
          hint: "kill -l = list signals. כל אות מציין צורת תקשורת עם תהליך."
        },
        {
          type: "command_forge",
          prompt: "agent47@procserver:~$",
          commandTemplate: "kill -___ 1234",
          answers: ["9"],
          acceptedAlternatives: [["9", "SIGKILL", "KILL"]],
          narrative: "תהליך מסרב להגיב. הרג אותו בכוח.",
          explanation: "kill -9 (SIGKILL) הורג תהליך מיידית, ללא אפשרות להתנגד. kill -15 (SIGTERM) מבקש מהתהליך לסיים בעצמו. SIGKILL = לא ניתן לחסימה. SIGTERM = ניתן לחסימה.",
          hint: "9 = SIGKILL = הרג מיידי. 15 = SIGTERM = בקשה עדינה."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@procserver:~$",
          command: "sleep 100",
          context: [
            "[Ctrl+Z]",
            "[1]+  Stopped                 sleep 100"
          ],
          options: [
            "Ctrl+Z מקפיא את התהליך ושולח אותו לרקע",
            "Ctrl+Z הורג את התהליך",
            "Ctrl+Z מבטל את הפקודה",
            "Ctrl+Z שומר את הפקודה"
          ],
          correct: 0,
          narrative: "מה עושה Ctrl+Z?",
          explanation: "Ctrl+Z שולח SIGTSTP (Stop) לתהליך - מקפיא אותו. התהליך עדיין קיים אבל לא רץ. לחזרה: fg להחזיר לחזית, bg להמשיך ברקע. kill %1 להרוג.",
          hint: "Ctrl+Z = SIGTSTP = קפא. fg = חזית, bg = רקע."
        },
        {
          type: "flag_map",
          pairs: [
            { term: "SIGINT (2)", definition: "Interrupt signal - sent by Ctrl+C" },
            { term: "SIGTERM (15)", definition: "Graceful termination request - process can clean up" },
            { term: "SIGKILL (9)", definition: "Immediate forced kill - cannot be blocked or ignored" },
            { term: "SIGTSTP (20)", definition: "Stop/suspend process - sent by Ctrl+Z" }
          ],
          narrative: "ארבעת האותות החשובים ביותר.",
          explanation: "SIGINT = הפסקה אינטראקטיבית, SIGTERM = בקשה עדינה (נכון להשתמש ראשון), SIGKILL = כוח (כאשר SIGTERM לא עוזר), SIGTSTP = השהייה זמנית.",
          hint: "Int=Ctrl+C, Term=בקשה עדינה, Kill=כוח, Tstp=הקפאה."
        }
      ]
    },
    {
      id: 2,
      name: "בוס - צבא הזומבים",
      isBoss: true,
      challenges: [
        {
          type: "terminal_oracle",
          prompt: "agent47@procserver:~$",
          command: "sleep 300 &",
          context: ["[1] 2847"],
          options: [
            "מריץ sleep ברקע, מחזיר מספר job [1] ו-PID 2847",
            "מריץ sleep ומחכה 300 שניות",
            "שגיאה - & לא חוקי",
            "מריץ sleep פעמים"
          ],
          correct: 0,
          narrative: "הפעל תהליך שיעבוד ברקע.",
          explanation: "& בסוף פקודה מריץ אותה ברקע. [1] = מספר job, 2847 = PID. הטרמינל זמין מיד. jobs מציג jobs פעילים. fg %1 = החזר job 1 לחזית.",
          hint: "& = background. [N] = job number. מיד חוזר לפרומפט."
        },
        {
          type: "command_forge",
          prompt: "agent47@procserver:~$",
          commandTemplate: "fg ___",
          answers: ["%1"],
          narrative: "החזר את ה-job הראשון לחזית.",
          explanation: "fg %N מביא job מספר N לחזית. bg %N מאפשר לו להמשיך ברקע. jobs מציג כל ה-jobs. %% = job האחרון.",
          hint: "fg %1 = foreground job 1. jobs מציג את הרשימה."
        },
        {
          type: "script_debug",
          filename: "monitor.sh",
          script: "#!/bin/bash\nPID=$(pgrep nginx)\nif [ $PID ]; then\n  echo \"nginx is running with PID: $PID\"\n  kill -0 $PID\n  echo \"Process alive: $?\"\nfi",
          options: [
            "Missing quotes around $PID - fails if nginx is not running (PID is empty)",
            "kill -0 is not valid",
            "pgrep returns wrong format",
            "if syntax is incorrect"
          ],
          correct: 0,
          narrative: "סקריפט הניטור קורס כשאין nginx.",
          explanation: "if [ $PID ] עם $PID ריק הופך ל-if [ ] שגורם לשגיאה. תיקון: if [ -n \"$PID\" ] או if [ \"$PID\" ]; then. תמיד עטוף משתנים במרכאות.",
          hint: "[ $PID ] כשPID ריק = [ ] = שגיאה syntax. תיקון: [ \"$PID\" ]."
        },
        {
          type: "pipe_builder",
          goal: "Find nginx process ID and send SIGTERM to it",
          options: [
            "pgrep nginx | xargs kill -15",
            "kill -15 | pgrep nginx",
            "ps aux | grep nginx | kill",
            "pgrep -f nginx && kill 15"
          ],
          correct: 0,
          narrative: "עצור את nginx בצורה עדינה.",
          explanation: "pgrep nginx מחזיר PID. xargs לוקח stdin ומשתמש בו כארגומנט לפקודה. pgrep nginx | xargs kill -15 = מצא PID ושלח SIGTERM.",
          hint: "xargs לוקח stdin כארגומנט. pgrep | xargs kill = מצא והרג."
        }
      ]
    }
  ]
};
