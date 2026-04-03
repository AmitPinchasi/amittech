window.ZONE_4 = {
  id: 4,
  name: "מפגע הטקסט",
  subtitle: "grep, sed, awk, sort, uniq, wc, cut",
  color: "#fab387",
  boss: "שד הלוגים",
  encounters: [
    {
      id: 0,
      name: "ציד הדפוסים",
      isBoss: false,
      challenges: [
        {
          type: "terminal_oracle",
          prompt: "agent47@textserver:~$",
          command: "grep 'ERROR' /var/log/syslog",
          context: [
            "Jan 15 09:12:33 srv kernel: ERROR: disk I/O failure",
            "Jan 15 09:15:07 srv app[1234]: ERROR: connection refused"
          ],
          options: [
            "מציגה רק שורות המכילות 'ERROR'",
            "מציגה את כל הקובץ",
            "מוחקת שורות עם ERROR",
            "מספרת שורות עם ERROR"
          ],
          correct: 0,
          narrative: "מצא שגיאות בלוג המערכת.",
          explanation: "grep מחפשת דפוס (pattern) ומציגה שורות תואמות. 'ERROR' = מחרוזת חיפוש. grep רגיש לאותיות גדולות/קטנות - לחיפוש ללא הבדל: grep -i.",
          hint: "grep = global regular expression print. מציגה שורות עם התבנית."
        },
        {
          type: "command_forge",
          prompt: "agent47@textserver:~$",
          commandTemplate: "grep ___ 'error' /var/log/auth.log",
          answers: ["-i"],
          narrative: "חפש 'error' ללא הבדל בין אותיות גדולות/קטנות.",
          explanation: "grep -i = case-insensitive. יתאים ל-error, Error, ERROR, eRrOr. שימושי כשאין ודאות לגבי אותיות.",
          hint: "-i = ignore case. מוצא error, Error, ERROR."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@textserver:~$",
          command: "grep -c 'Failed' /var/log/auth.log",
          options: [
            "מספר מספרי של שורות המכילות 'Failed'",
            "מציגה שורות עם 'Failed'",
            "מוחקת שורות עם 'Failed'",
            "שגיאה - -c לא קיים"
          ],
          correct: 0,
          narrative: "ספור כמה ניסיונות כניסה נכשלו.",
          explanation: "grep -c (count) מחזירה את מספר השורות התואמות, לא את השורות עצמן. שימושי לסטטיסטיקה מהירה.",
          hint: "-c = count. מחזיר מספר, לא שורות."
        },
        {
          type: "flag_map",
          pairs: [
            { term: "grep -v pattern", definition: "Show lines NOT matching pattern (invert match)" },
            { term: "grep -n pattern", definition: "Show line numbers with matching lines" },
            { term: "grep -r pattern dir/", definition: "Search recursively in all files under directory" },
            { term: "grep -E 'pat1|pat2'", definition: "Extended regex: match either pattern1 or pattern2" }
          ],
          narrative: "ארבעה דגלי grep חיוניים.",
          explanation: "-v = הפוך (לא מתאים), -n = מספרי שורות, -r = רקורסיבי, -E = regex מורחב. שילוב: grep -rn 'ERROR' /var/log/ = מצא בכל הלוגים עם מספרי שורות.",
          hint: "-v הפוך, -n שורות, -r רקורסיבי, -E regex."
        }
      ]
    },
    {
      id: 1,
      name: "אלכימיית הטקסט",
      isBoss: false,
      challenges: [
        {
          type: "terminal_oracle",
          prompt: "agent47@textserver:~$",
          command: "echo 'hello world linux' | awk '{print $2}'",
          options: [
            "world",
            "hello",
            "linux",
            "hello world linux"
          ],
          correct: 0,
          narrative: "חלץ את המילה השנייה.",
          explanation: "awk '{print $N}' מדפיסה את השדה ה-N. $1=שדה ראשון, $2=שני, $NF=אחרון. ברירת מחדל: מפריד = רווח. -F: להגדרת מפריד אחר.",
          hint: "awk $1=ראשון, $2=שני. ברירת מחדל: מפריד = רווח."
        },
        {
          type: "command_forge",
          prompt: "agent47@textserver:~$",
          commandTemplate: "sort ___r numbers.txt",
          answers: ["-n"],
          narrative: "מיין מספרים בסדר יורד (גדול לקטן).",
          explanation: "sort -n מיין לפי ערך מספרי (לא אלפביתי). -r = reverse = הפוך. ללא -n, '10' יגיע לפני '2' כי '1' < '2' אלפביתית.",
          hint: "-n = numeric sort. -r = reverse. נדרש לשניהם יחד."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@textserver:~$",
          command: "printf \"apple\\nbanana\\napple\\norange\\nbanana\\napple\\n\" | sort | uniq -c | sort -nr",
          options: [
            "3 apple\n2 banana\n1 orange (sorted by count)",
            "apple\nbanana\norange (sorted alphabetically)",
            "3\n2\n1 (counts only)",
            "Error: uniq requires sorted input"
          ],
          correct: 0,
          narrative: "ספור תדירות של פריטים.",
          explanation: "sort ממיין (uniq עובד רק על שורות רצופות), uniq -c סופר כפילויות ומוסיף ספירה, sort -nr ממיין לפי ספירה בסדר יורד. תבנית קלאסית.",
          hint: "sort > uniq -c > sort -nr. הסדר חשוב."
        },
        {
          type: "flag_map",
          pairs: [
            { term: "sed 's/old/new/g'", definition: "Replace all occurrences of 'old' with 'new'" },
            { term: "awk -F: '{print $1}'", definition: "Print first field using colon as delimiter" },
            { term: "cut -d, -f2", definition: "Cut second field from CSV (comma-delimited)" },
            { term: "wc -l", definition: "Count number of lines in input" }
          ],
          narrative: "ארבעת כלי עיבוד הטקסט המרכזיים.",
          explanation: "sed לחיפוש/החלפה, awk לעיבוד עמודות עם delimiter מותאם, cut לחיתוך עמודות פשוט, wc לספירה. כולם פועלים טוב עם pipes.",
          hint: "sed = stream editor, awk = column processor, cut = simple field cutter, wc = word count."
        }
      ]
    },
    {
      id: 2,
      name: "בוס - שד הלוגים",
      isBoss: true,
      challenges: [
        {
          type: "pipe_builder",
          goal: "Extract all unique IP addresses from access.log (IPs are first field)",
          options: [
            "awk '{print $1}' access.log | sort | uniq",
            "grep -E '[0-9]+\\.[0-9]+' access.log | sort",
            "cut -f1 access.log | sort -u",
            "sort access.log | awk '{print $1}'"
          ],
          correct: 0,
          narrative: "שד הלוגים מסתיר בין מיליוני שורות. חלץ כתובות IP ייחודיות.",
          explanation: "awk '{print $1}' חולץ שדה ראשון (IP). sort ממיין (נדרש לuniq). uniq מסיר כפילויות. תוצאה: רשימה של כתובות IP ייחודיות.",
          hint: "awk $1 = שדה ראשון. sort לפני uniq. uniq = ייחודי."
        },
        {
          type: "terminal_oracle",
          prompt: "agent47@textserver:~$",
          command: "wc -l access.log",
          context: ["15847 access.log"],
          options: [
            "מספר השורות בקובץ (15847 בקשות)",
            "מספר המילים בקובץ",
            "גודל הקובץ בבתים",
            "מספר התווים"
          ],
          correct: 0,
          narrative: "כמה בקשות רשומות בלוג?",
          explanation: "wc = word count. wc -l = line count. wc -w = word count. wc -c = character count. access.log: שורה אחת = בקשת HTTP אחת.",
          hint: "wc -l = lines, wc -w = words, wc -c = characters."
        },
        {
          type: "script_debug",
          filename: "analyze.sh",
          script: "#!/bin/bash\nawk -F ' ' '{print $2}' access.log | sort | uniq -c | sort -nr | head -10",
          options: [
            "The delimiter in -F ' ' has an extra space but the real issue is that HTTP method is field 6 in standard Apache logs, not field 2",
            "awk syntax is wrong",
            "sort -nr should be sort -rn",
            "head -10 should be tail -10"
          ],
          correct: 0,
          narrative: "הסקריפט מחזיר תוצאות שגויות.",
          explanation: "ב-Apache access.log, שדה 6 הוא שיטת HTTP. -F ' ' מיותר (רווח הוא ברירת מחדל). לחילוץ שיטות HTTP: awk '{print $6}'. חשוב להכיר את מבנה הלוג.",
          hint: "חפש מה format הלוג לפני שמחלץ שדות. Apache access.log: IP - user [date] \"METHOD URL PROTO\" status size."
        },
        {
          type: "pipe_builder",
          goal: "Find top 5 IPs making most requests in access.log",
          options: [
            "awk '{print $1}' access.log | sort | uniq -c | sort -nr | head -5",
            "grep -c access.log | head -5",
            "sort access.log | head -5 | awk '{print $1}'",
            "awk '{print $1}' access.log | head -5 | sort | uniq"
          ],
          correct: 0,
          narrative: "מי תוקף? מצא את 5 כתובות ה-IP הכי פעילות.",
          explanation: "חלץ IPs > מיין > ספור כפילויות > מיין לפי ספירה (יורד) > 5 ראשונות. סדר הצינורות הזה הוא דפוס קלאסי לניתוח לוגים.",
          hint: "awk > sort > uniq -c > sort -nr > head. הסדר קריטי."
        }
      ]
    }
  ]
};
