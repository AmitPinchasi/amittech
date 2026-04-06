/* ============================================================
   ZONE 7 - Import Archives
   Modules: import, from...import, os, datetime, json,
   requests, string module, time module
   ============================================================ */

window.ZONE_7 = {
  id: 7,
  name: "ארכיון הייבוא",
  subtitle: "מודולים",
  color: "#94a3b8",
  boss: "שד התלויות",
  encounters: [
    {
      id: 0,
      name: "כספות os ו-sys",
      isBoss: false,
      challenges: [
        {
          type: "corruption_scan",
          narrative: "מטייל מנסה לקבל את הספריה הנוכחית. מצא את השגיאה בקוד שלו.",
          code: 'import os\ncurrent = os.get_cwd()\nprint(current)',
          options: [
            "os.get_cwd() does not exist; the correct function is os.getcwd()",
            "import os should be from os import getcwd",
            "current should be path, not current",
            "Nothing is wrong",
          ],
          correct: 0,
          explanation: "הפונקציה הנכונה היא os.getcwd() (get current working directory). אין os.get_cwd(). זה יעלה AttributeError.",
          hint: "שם הפונקציה ל-'get current working directory' הוא קיצור נפוץ. ללא קו תחתון.",
        },
        {
          type: "output_oracle",
          narrative: "מודול os חושף את הטיפוס של רשימת הספריה שלו.",
          code: 'import os\nfiles = os.listdir(".")\nprint(type(files))',
          options: ["<class 'list'>", "<class 'tuple'>", "<class 'dict'>", "<class 'str'>"],
          correct: 0,
          explanation: "os.listdir() מחזיר רשימה של מחרוזות (שמות קבצים/תיקיות). הטיפוס הוא <class 'list'>.",
          hint: "os.listdir() מחזיר אוסף של שמות קבצים. איזה טיפוס פייתון מחזיק אוסף מסודר וניתן לשינוי?",
        },
        {
          type: "name_binding",
          narrative: "התאם כל מודול למטרתו העיקרית.",
          pairs: [
            { term: "os", definition: "Operating system interfaces: files, directories, environment" },
            { term: "json", definition: "Encode and decode JSON data format" },
            { term: "datetime", definition: "Work with dates and times" },
            { term: "math", definition: "Mathematical functions like sqrt, floor, and constants" },
          ],
          explanation: "os מספק ממשקי מערכת הפעלה, json מטפל בסריאליזציה של נתונים, datetime עובד עם זמן, math מספק פעולות מתמטיות.",
          hint: "חשוב על המטרה המרכזית: פעולות מערכת, פורמט נתונים, טיפול בזמן, או פונקציות מתמטיות.",
        },
        {
          type: "spell_completion",
          narrative: "ייבא רק את תת-המודול path מ-os.",
          codeTemplate: '___ os import path\nexists = path.exists("/tmp")\nprint(type(exists))',
          answers: ["from"],
          explanation: "'from module import something' מייבא פריטים ספציפיים ממודול. 'from os import path' נותן גישה ישירה ל-os.path ללא הקידומת 'os.'.",
          hint: "מילת המפתח שמתחילה את התבנית 'from module import name'.",
        },
      ],
    },
    {
      id: 1,
      name: "מקדש json ו-datetime",
      isBoss: false,
      challenges: [
        {
          type: "spell_completion",
          narrative: "השלם את קוד הסריאליזציה להמרת נתוני פייתון למחרוזת JSON.",
          codeTemplate: 'import json\ndata = {"name": "Shir", "level": 5}\njson_str = json.___(data)\nprint(type(json_str))',
          answers: ["dumps"],
          explanation: "json.dumps() (dump to string) ממיר dict/list של פייתון למחרוזת בפורמט JSON. json.loads() עושה את ההיפך (load from string). json.dump()/load() עובדים עם קבצים.",
          hint: "הפונקציה להמרת אובייקטי פייתון למחרוזת JSON (לא קובץ). 'dumps' = dump to string.",
        },
        {
          type: "output_oracle",
          narrative: "datetime חושף את השנה מתאריך ספציפי.",
          code: 'from datetime import datetime\nquest_date = datetime(2024, 6, 15)\nprint(quest_date.year)\nprint(quest_date.month)\nprint(quest_date.strftime("%Y-%m-%d"))',
          options: ["2024\n6\n2024-06-15", "2024\n15\n2024-06-15", "2024\n6\n15-06-2024", "Error"],
          correct: 0,
          explanation: "datetime(2024,6,15) יוצר תאריך. .year=2024, .month=6. strftime('%Y-%m-%d') מפרמט אותו כ-'YYYY-MM-DD': '2024-06-15'.",
          hint: ".year ו-.month הם מאפיינים. strftime() מפרמט תאריך. %Y=שנה בת 4 ספרות, %m=חודש, %d=יום.",
        },
        {
          type: "output_oracle",
          narrative: "json.loads() קורא את מגילת JSON העתיקה. איזה נתון פייתון צץ?",
          code: 'import json\njson_str = \'{"name": "Lyra", "level": 7, "active": true}\'\ndata = json.loads(json_str)\nprint(data["name"])\nprint(type(data["active"]))',
          options: ["Lyra\n<class 'bool'>", "Lyra\n<class 'str'>", "Lyra\nTrue", "Error"],
          correct: 0,
          explanation: "json.loads() מפרסר מחרוזות JSON לאובייקטי פייתון. JSON 'true' הופך לפייתון True (bool). מפתח 'name' נותן 'Lyra'. type(True) הוא <class 'bool'>.",
          hint: "json.loads() ממיר JSON לפייתון. JSON 'true'/'false' הופכים לפייתון True/False (booleans).",
        },
        {
          type: "corruption_scan",
          narrative: "לתבנית ייבוא מודול יש בעיית הצללה. מצא אותה.",
          code: 'from math import *\nfrom random import *\nresult = sqrt(16)\nprint(result)',
          options: [
            "Wildcard imports can cause name collisions and pollute the namespace",
            "sqrt is not in the math module",
            "random module should be imported separately",
            "Nothing is wrong",
          ],
          correct: 0,
          explanation: "ייבוא wildcard (from x import *) מזהם את המרחב שמות ועלול לגרום להתנגשויות שמות. אם שני מודולים מגדירים פונקציה עם אותו שם, הייבוא המאוחר יותר גובר בשקט. תמיד יבא באופן מפורש.",
          hint: "מה קורה כאשר שני מודולים מגדירים פונקציה עם אותו שם, ואתה מייבא הכל משניהם?",
        },
      ],
    },
    {
      id: 2,
      name: "בוס - שד התלויות",
      isBoss: true,
      challenges: [
        {
          type: "output_oracle",
          narrative: "השד בוחן את ידיעתך בתבנית מודול requests.",
          code: '# Simulated requests usage\nclass FakeResponse:\n    def __init__(self, status, data):\n        self.status_code = status\n        self._data = data\n    def json(self):\n        return self._data\n\nresponse = FakeResponse(200, {"result": "ok"})\nif response.status_code == 200:\n    print("Success")\n    print(response.json()["result"])',
          options: ["Success\nok", "Success\n{'result': 'ok'}", "200\nok", "Error"],
          correct: 0,
          explanation: "status_code 200 פירושו הצלחה. response.json() מחזיר את ה-dict. ['result'] ניגש למפתח 'result' עם ערך 'ok'.",
          hint: "HTTP 200 פירושו OK/הצלחה. response.json() מפרסר את גוף התגובה כ-JSON ומחזיר dict פייתון.",
        },
        {
          type: "spell_completion",
          narrative: "השלם את כינוי המודול לקונבנציה נפוצה של פייתון.",
          codeTemplate: 'import numpy ___ np\n# Now use np.array instead of numpy.array',
          answers: ["as"],
          explanation: "'import module as alias' יוצר שם קצר יותר. 'import numpy as np' היא הקונבנציה האוניברסלית. 'as' היא מילת המפתח לכינוי ייבוא.",
          hint: "מילת המפתח בין שם המודול לכינוי ב-'import module ___ alias'.",
        },
        {
          type: "name_binding",
          narrative: "התאם כל פונקציה של json לפעולה שלה.",
          pairs: [
            { term: "json.dumps()", definition: "Convert Python object to JSON string" },
            { term: "json.loads()", definition: "Parse JSON string into Python object" },
            { term: "json.dump()", definition: "Write Python object as JSON to a file" },
            { term: "json.load()", definition: "Read JSON from a file into Python object" },
          ],
          explanation: "dumps/loads עובדות עם מחרוזות. dump/load עובדות עם קבצים. הסיומת 's' פירושה 'string'. עזר לזיכרון: dumps = dump to String, loads = load from String.",
          hint: "ה-'s' ב-dumps/loads מייצג 'string'. ללא 's' פירושו שאתה עובד עם אובייקטי קובץ.",
        },
      ],
    },
  ],
};
