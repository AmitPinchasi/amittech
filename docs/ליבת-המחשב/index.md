# קורס ליבת המחשב

קורס מעמיק שלוקח אתכם למסע לתוך הליבה של המחשב. מארגון המחשב וייצוג בינארי, דרך תכנות באסמבלי, שפת C, מערכת הפעלה לינוקס, הקרנל, הנדסה הפוכה, ארכיטקטורת מעבד, תכנות רשת ומקביליות מתקדמת. קורס שנותן הבנה אמיתית של מה שקורה מתחת למכסה המנוע.

## תוכן הקורס

### פרק 0 - ארגון המחשב
איך המחשב בנוי, ייצוג מידע בינארי, טבלאות אמת ולוגיקה דיגיטלית.

### פרק 1 - אסמבלי 16 ביט
תכנות ישירות עם המעבד ב-Real Mode. רגיסטרים, מחסנית, מחרוזות, מערכים, פסיקות, קלט ופלט. כולל פרויקט מסכם.

### פרק 2 - אסמבלי 32 ביט
מעבר ל-Protected Mode. טבלת ה-GDT, ה-Context Switch, מנגנון ה-Paging, טיפול ב-Page Fault, ומבנה מערכת הפעלה מודרנית.

### פרק 3 - שפת C
הבסיס, פוינטרים, בקרת זרימה, מודולריות, סטראקטים, ה-Preprocessor, סקופ ודיבוג עם GDB.

### פרק 4 - ספריית libc
מחרוזות, קבצים, זיכרון דינמי, מספרים, פעולות מערכת, אלגוריתמים (qsort, bsearch), טיפול בשגיאות. כולל פרויקט מסכם.

### פרק 5 - לינוקס
קריאות מערכת (syscalls), תהליכים (fork, exec, wait), ה-Loader ופורמט ELF, סיגנלים, מתארי קבצים (file descriptors), צינורות (pipes) ו-IPC, מיפוי זכרון (mmap), תהליכונים (threads ו-pthreads), מערכת הקבצים /proc, ספריות משותפות ו-dynamic linking, פורמט ELF לעומק. כולל פרויקט מסכם - כתיבת shell פשוט.

### פרק 6 - הקרנל של לינוקס
הקדמה לקרנל ומודולים, ה-syscall מבפנים, מתזמן התהליכים (CFS), ניהול זכרון (buddy allocator, page faults, COW), מערכת הקבצים הוירטואלית (VFS), הקצאת זכרון בקרנל (kmalloc, slab), פסיקות ו-exceptions, דרייברים (character devices), מחסנית הרשת (sk_buff, TCP/IP), סנכרון בקרנל (spinlocks, RCU), אבטחה (ASLR, seccomp, namespaces, cgroups), דיבוג קרנל (ftrace, perf, eBPF). כולל פרויקט מסכם - כתיבת דרייבר תו.

### פרק 7 - הנדסה הפוכה
הקדמה ל-RE, דפוסים באסמבלי (זיהוי מבני C בדיסאסמבלי), GDB מתקדם, כלי Ghidra, ניתוח תוכנות זדוניות, מבוא לניצול חולשות (buffer overflow, ROP, format strings), טכניקות אנטי-הנדסה הפוכה. כולל פרויקט מסכם - אתגר RE רב-שלבי.

### פרק 8 - ארכיטקטורת מעבד
צינור ההוראות (pipeline), חיזוי הסתעפויות (branch prediction), זכרון מטמון (cache, MESI, false sharing), ביצוע שלא בסדר (out-of-order execution, Spectre/Meltdown), זכרון וירטואלי בחומרה (page table walk, TLB, huge pages). כולל פרויקט מסכם - ניתוח ביצועים.

### 9 - קומפילציה ולינקוג
שלבי הקומפילציה (preprocessing, compilation, assembly, linking), הלינקר (symbol resolution, relocations, static libraries), סקריפטים של הלינקר, אופטימיזציות של הקומפיילר (inlining, loop unrolling, LTO, PGO). כולל פרויקט מסכם - בניית תוכנית freestanding.

### פרק 10 - C מתקדם
אסמבלי בתוך C (inline assembly), התנהגות לא מוגדרת (undefined behavior), טריקים ביטיים, מודל הזכרון (volatile, C11 atomics, memory barriers), מצביעי פונקציות ו-callbacks, פולימורפיזם ב-C. כולל פרויקט מסכם - מערכת פלאגינים.

### פרק 11 - תכנות רשת
סוקטים (TCP client/server), שרת TCP מתקדם (fork, threads, select, poll, epoll), UDP ו-raw sockets (ping, packet sniffing), פרוטוקול HTTP מאפס. כולל פרויקט מסכם - שרת צ'אט.

### פרק 12 - מקביליות מתקדמת
דפוסי תכנות מקבילי (producer-consumer, thread pool, reader-writer, barrier), מבני נתונים ללא נעילה (lock-free stack, SPSC queue, CAS), io_uring, תכנות אסינכרוני עם event loop. כולל פרויקט מסכם - ספריית thread pool.

---

## פרויקטים

הקורס כולל פרויקט מסכם בסוף כל פרק מרכזי:

- **פרויקט אסמבלי 16 ביט** - כתיבת תוכנה שלמה באסמבלי, כולל גרפיקה ועבודה עם חומרה
- **פרויקט אסמבלי 32 ביט** - בניית רכיבי מערכת הפעלה: paging, context switch, וטיפול בפסיקות
- **פרויקט libc** - פרויקט מסכם בשפת C עם ספריית libc
- **פרויקט לינוקס** - כתיבת mini-shell עם piping, redirection וסיגנלים
- **פרויקט קרנל** - כתיבת character device driver עם key-value store
- **פרויקט הנדסה הפוכה** - אתגר RE רב-שלבי עם אנטי-דיבוג
- **פרויקט ארכיטקטורה** - ניתוח ביצועים עם perf ומדידות cache/branch prediction
- **פרויקט קומפילציה** - בניית תוכנית freestanding ללא libc
- **פרויקט C מתקדם** - מערכת פלאגינים עם dlopen וfunction pointers
- **פרויקט רשת** - שרת צ'אט מרובה לקוחות
- **פרויקט מקביליות** - ספריית thread pool עם futures

## למי מתאים הקורס

הקורס מתאים למי שרוצה להבין באמת איך מחשב עובד. מתאים למפתחים שרוצים להתמקצע בתכנות low-level, אבטחת מידע, פיתוח מערכות הפעלה, מערכות משובצות, או הנדסה לאחור. נדרש ידע בסיסי בתכנות.

## למה הקורס הזה

- **עומק אמיתי** - מייצוג בינארי ועד כתיבת דרייברים בקרנל, כולל הבנה של כל שכבה
- **תכנות באסמבלי** - כולל 16 ביט ו-32 ביט, עם הבנה מעמיקה של Protected Mode ו-Paging
- **שפת C מקצועית** - פוינטרים, ניהול זיכרון, inline assembly, lock-free data structures
- **הקרנל מבפנים** - scheduler, memory management, VFS, drivers, networking stack
- **הנדסה הפוכה** - GDB, Ghidra, exploitation, anti-RE techniques
- **ארכיטקטורת מעבד** - pipeline, cache, branch prediction, out-of-order execution
- **פרקטי ומעשי** - כל מושג מלווה בקוד עובד ופרויקטים שמחברים הכל יחד
- **בסיס לקריירה** - הידע הזה הוא יתרון משמעותי בתפקידי סייבר, embedded, פיתוח מערכות הפעלה ו-reverse engineering
- **250+ שיעורים** שבנויים בצורה מדורגת עם תרגילים ופתרונות
