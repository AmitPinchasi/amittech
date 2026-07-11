---
date: 2026-06-14
description: מדריך מעשי לעבודה עם JSON ובקשות HTTP בפייתון - שימוש במודול requests לשליחת בקשות לשרת, ומודול json לפענוח ויצירה של נתונים, עם דוגמאות קוד מלאות.
tags:
  - פייתון
  - JSON
  - מדריך
---

# איך עובדים עם JSON ובקשות HTTP בפייתון

בואו נדבר בכנות. כמעט כל תוכנית פייתון שמדברת עם העולם החיצון - עם שרת, עם שירות ענן, עם אתר אחר - עושה את זה דרך שני כלים - בקשות HTTP כדי לשלוח ולקבל מידע, ו-JSON כדי לארוז את המידע הזה בפורמט שקל לקרוא גם למחשב וגם לבני אדם. אם אתם רוצים לכתוב תוכנית שמתקשרת עם משהו מעבר לקובץ מקומי, זה בדיוק הצמד שאתם צריכים.

## מה זה בכלל JSON

JSON, ראשי תיבות של JavaScript Object Notation, הוא פורמט טקסט לייצוג נתונים - מספרים, מחרוזות, רשימות ומילונים. הוא נראה כמעט זהה למילון בפייתון:

```json
{
    "name": "דנה",
    "age": 28,
    "is_active": true,
    "skills": ["Python", "SQL"]
}
```

הסיבה שהוא כל כך נפוץ היא שכמעט כל שפת תכנות יודעת לקרוא ולכתוב אותו, אז הוא הפך לשפה משותפת לתקשורת בין מערכות שונות - שרת שכתוב ב-Node.js יכול לדבר עם תוכנית פייתון בלי בעיה, כי שניהם "מדברים" JSON.

## שליחת בקשה עם requests

המודול `requests` הוא הדרך הסטנדרטית בפייתון לשלוח בקשות HTTP. בקשת GET, שמבקשת מידע משרת, נראית ככה:

```python
import requests

response = requests.get("https://api.example.com/users/1")
print(response.status_code)
```

`response.status_code` מספר לכם מה קרה - 200 אומר שהכל תקין, 404 אומר שהמשאב לא נמצא, 401 או 403 אומרים שאין לכם הרשאה. תמיד שווה לבדוק את זה לפני שממשיכים לעבד את התוצאה.

## הפיכת התשובה למילון פייתון

כשהשרת מחזיר JSON, לא צריך לפרסר אותו ידנית - ל-`requests` יש מתודה מובנית בשביל זה:

```python
if response.status_code == 200:
    data = response.json()
    print(data["name"])
    print(data["skills"])
else:
    print("הבקשה נכשלה")
```

`response.json()` הופך את הטקסט שהתקבל למילון פייתון רגיל, עם כל הגישה הנוחה של סוגריים מרובעים ומפתחות שאתם רגילים אליה.

## שליחת נתונים בבקשת POST

כשרוצים לא רק לבקש מידע אלא לשלוח מידע חדש - למשל ליצור משתמש - משתמשים בבקשת POST, ומעבירים את הנתונים כמילון בפרמטר `json`:

```python
new_user = {
    "name": "יובל",
    "age": 24
}

response = requests.post("https://api.example.com/users", json=new_user)
print(response.status_code)
print(response.json())
```

`requests` דואג להמיר את המילון ל-JSON ולשלוח אותו עם הכותרות הנכונות, כך שלא צריך לטפל בזה ידנית.

## המודול json - להמיר בעצמכם

לפעמים אתם לא עובדים עם בקשות HTTP בכלל, אלא רק רוצים להמיר בין מילון פייתון לטקסט JSON - למשל כדי לשמור נתונים לקובץ. פה נכנס המודול המובנה `json`:

```python
import json

user = {"name": "רון", "age": 30, "skills": ["Python", "Git"]}

json_text = json.dumps(user, ensure_ascii=False, indent=2)
print(json_text)
```

`json.dumps` הופך מילון פייתון למחרוזת JSON. הפרמטר `ensure_ascii=False` חשוב במיוחד כשעובדים בעברית - בלעדיו, כל האותיות העבריות יומרו לקודים לא קריאים. `indent=2` פשוט מסדר את הפלט להיות קריא לעין.

והכיוון ההפוך - להמיר מחרוזת JSON חזרה למילון - נעשה עם `json.loads`:

```python
text = '{"name": "רון", "age": 30}'
data = json.loads(text)
print(data["name"])
```

## קריאה וכתיבה של קובצי JSON

לעבודה עם קבצים ישירות יש שתי מתודות שחוסכות שלב:

```python
import json

user = {"name": "מאיה", "age": 26}

with open("user.json", "w", encoding="utf-8") as f:
    json.dump(user, f, ensure_ascii=False, indent=2)

with open("user.json", "r", encoding="utf-8") as f:
    loaded = json.load(f)
    print(loaded["name"])
```

שימו לב להבדל - `dump` ו-`load` (בלי ה-s) עובדים ישירות מול קובץ פתוח, בעוד ש-`dumps` ו-`loads` עובדים מול מחרוזות בזיכרון.

## טיפול בשגיאות שקורות בפועל

בקוד אמיתי, בקשת רשת יכולה להיכשל בכמה דרכים - השרת יכול להיות למטה, החיבור לאינטרנט יכול להתנתק באמצע, או שהתשובה שמתקבלת בכלל לא JSON תקין. שווה להתרגל לעטוף בקשות ב-try/except במקום להניח שהכל תמיד יעבוד:

```python
import requests
import json

try:
    response = requests.get("https://api.example.com/users/1", timeout=5)
    response.raise_for_status()
    data = response.json()
    print(data)
except requests.exceptions.Timeout:
    print("הבקשה לקחה יותר מדי זמן")
except requests.exceptions.RequestException as e:
    print(f"שגיאת רשת: {e}")
except json.JSONDecodeError:
    print("התשובה שהתקבלה לא הייתה JSON תקין")
```

`raise_for_status()` זורק שגיאה אוטומטית אם קוד הסטטוס מעיד על כישלון, כך שלא צריך לבדוק כל קוד סטטוס ידנית. הפרמטר `timeout` חשוב לא פחות - בלעדיו, אם השרת פשוט לא עונה, התוכנית שלכם יכולה להיתקע ולחכות לנצח.

## מחברים הכל ביחד

דוגמה שמשלבת בקשה, שמירה, וקריאה חזרה:

```python
import requests
import json

response = requests.get("https://api.example.com/users/1")

if response.status_code == 200:
    user_data = response.json()
    with open("saved_user.json", "w", encoding="utf-8") as f:
        json.dump(user_data, f, ensure_ascii=False, indent=2)
    print("הנתונים נשמרו בהצלחה")
else:
    print(f"שגיאה: {response.status_code}")
```

זו בדיוק תבנית העבודה שחוזרת על עצמה בהמון סקריפטים אמיתיים - קבלת מידע מרשת, ושמירה שלו מקומית לשימוש מאוחר יותר.

אם עדיין לא ממש בטוחים עם מילונים, פונקציות וקבצים בפייתון, כדאי לחזק את הבסיס דרך [קורס התכנות הבסיסי שלנו](https://amittech.dev/תכנות-בסיסי/) לפני שקופצים לעבודה עם רשת ו-API.

ואם משהו לא עובד לכם עם בקשה או פענוח JSON - שתפו את השגיאה בקהילה בדיסקורד, לרוב זו טעות קטנה שקל למצוא בעזרה של עוד זוג עיניים.

[הצטרפו לקהילה בדיסקורד](https://discord.gg/ef5PQAAca2)
