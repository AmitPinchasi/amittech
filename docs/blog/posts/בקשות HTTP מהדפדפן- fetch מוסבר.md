---
date: 2026-06-03
description: fetch מוסבר בפשטות - איך שולחים בקשות HTTP מהדפדפן, איך שולחים GET ו-POST, למה fetch לא נכשל על שגיאת שרת, וטיפול נכון בתשובות ובשגיאות רשת.
tags:
  - JavaScript
  - HTTP
  - פרונטאנד
---

# בקשות HTTP מהדפדפן - fetch מוסבר

כל אתר שמציג נתונים מהשרת - רשימת מוצרים, פרופיל משתמש, תוצאות חיפוש - צריך דרך לבקש את המידע הזה מהדפדפן. `fetch` היא הפונקציה המובנית בדפדפן לשליחת בקשות HTTP, וכמעט כל קוד ריאקט שמדבר עם שרת עובר דרכה, בין אם ישירות או דרך ספרייה שעוטפת אותה.

## בקשת GET בסיסית

`fetch` מקבלת כתובת URL, ומחזירה פרומיס:

```javascript
async function getUsers() {
  const response = await fetch("/api/users");
  const data = await response.json();
  console.log(data);
}
```

שימו לב לשני שלבי `await` - הראשון מחכה לתשובה מהשרת (ה-headers והסטטוס), והשני מחכה שהגוף (body) של התשובה יומר מ-JSON גולמי לאובייקט ג'אווהסקריפט שאפשר לעבוד איתו. הרבה מתחילים שוכחים את ה-`await` השני, ומקבלים אובייקט מוזר במקום הנתונים עצמם.

## המלכודת הכי חשובה - fetch לא נכשל על שגיאת HTTP

זו הנקודה שהכי מפתיעה מתחילים, ולכן חשוב להדגיש אותה. `fetch` נכשל (זורק שגיאה) רק אם יש בעיית רשת אמיתית - אין חיבור לאינטרנט, השרת לא זמין בכלל. אבל אם השרת כן מגיב, גם עם קוד שגיאה כמו 404 או 500, `fetch` רואה בזה "הצלחה" מבחינתה - היא הצליחה לקבל תשובה, גם אם התשובה היא שגיאה.

```javascript
async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);

  if (!response.ok) {
    throw new Error(`שגיאת שרת: ${response.status}`);
  }

  return response.json();
}
```

`response.ok` הוא `true` רק כשהסטטוס בין 200 ל-299. חובה לבדוק את זה בעצמכם - אחרת קוד שמצפה לנתונים תקינים עלול לקבל אובייקט שגיאה בלי לדעת.

## בקשת POST - שליחת נתונים לשרת

לשליחת נתונים, למשל טופס הרשמה, צריך לציין את השיטה, את הכותרות (headers), ואת הגוף (body) בתור מחרוזת JSON:

```javascript
async function createUser(userData) {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error("יצירת המשתמש נכשלה");
  }

  return response.json();
}

createUser({ name: "רועי", email: "roi@example.com" });
```

`JSON.stringify` הופך את האובייקט הג'אווהסקריפטי למחרוזת JSON, כי גוף בקשת HTTP הוא תמיד טקסט, לא אובייקט. הכותרת `Content-Type: application/json` מודיעה לשרת איך לפרש את הטקסט הזה.

## טיפול בשגיאות - הדפוס המלא

שילוב של `try/catch` עם בדיקת `response.ok` נותן טיפול מלא בשני סוגי הכישלון האפשריים - כישלון רשת וכישלון שרת:

```javascript
async function safeFetch(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`שגיאה: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log("הבקשה נכשלה:", error.message);
    return null;
  }
}
```

## שימוש ב-fetch בתוך קומפוננטת ריאקט

הדפוס הנפוץ ביותר הוא לשלב `fetch` בתוך `useEffect`, עם ניהול מצבי טעינה ושגיאה:

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error("לא נמצא");
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [userId]);

  if (loading) return <p>טוען...</p>;
  if (error) return <p>שגיאה: {error}</p>;
  return <h1>{user.name}</h1>;
}
```

שלושת מצבי הסטייט - `loading`, `error` ו-`user` עצמו - הם הדפוס הסטנדרטי לכל שליפת נתונים בריאקט, וכדאי להכיר אותו היטב לפני שעוברים לכלים שעושים את זה אוטומטית כמו React Query.

## ביטול בקשה עם AbortController

לפעמים רוצים לבטל בקשה שכבר לא רלוונטית, למשל אם המשתמש עבר לעמוד אחר לפני שהתשובה חזרה:

```javascript
const controller = new AbortController();

fetch("/api/data", { signal: controller.signal });

// במקום אחר, למשל בפונקציית ניקוי של useEffect
controller.abort();
```

זה מונע מצב שבו קומפוננטה שכבר לא קיימת מנסה לעדכן סטייט מבקשה ישנה שהגיעה באיחור.

בקורס [צד לקוח](https://amittech.dev/צד-לקוח/) יש תרגילים מעשיים על עבודה עם fetch מול שרת אמיתי, כולל טיפול בשגיאות בצורה נכונה מהשלב הראשון.

## לסיכום

`fetch` שולחת בקשות HTTP ומחזירה פרומיס, אבל חשוב לזכור שהיא לא נכשלת על שגיאות שרת - חובה לבדוק `response.ok` בעצמכם. שילוב עם `async/await`, `try/catch`, וניהול מצבי טעינה ושגיאה הוא הדפוס הבסיסי שכל מפתח פרונטאנד צריך לשלוט בו.

יש לכם בקשת fetch שלא מתנהגת כמו שציפיתם? תשתפו בדיסקורד.

[הצטרפו לקהילה בדיסקורד](https://discord.gg/ef5PQAAca2)
