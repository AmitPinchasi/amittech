---
date: 2026-07-06
description: פרומיסים ו-async-await בג'אווהסקריפט מוסברים בפשטות - מה זה קוד אסינכרוני, איך פרומיס עובר בין מצבים, ולמה async-await הוא רק תחביר נוח מעל פרומיסים.
tags:
  - JavaScript
  - פרונטאנד
---

# פרומיסים ו-async-await מוסברים

בקשות רשת, טיימרים, קריאת קבצים - כל אלה לוקחים זמן, ולא אפשר פשוט "לעצור" את הדפדפן ולחכות שהם יסתיימו. ג'אווהסקריפט פותרת את זה עם קוד אסינכרוני, ופרומיסים (promises) הם הכלי המרכזי לניהול הקוד הזה בצורה שאפשר לקרוא אותה בלי להשתגע.

## למה בכלל צריך את זה

תארו לעצמכם שאתם מבקשים נתונים משרת. הבקשה יכולה לקחת חצי שנייה, שנייה, או יותר. אם ג'אווהסקריפט הייתה "קופאת" ומחכה, כל הדף היה נתקע באותו זמן - אי אפשר היה ללחוץ על שום דבר. במקום זה, ג'אווהסקריפט שולחת את הבקשה, וממשיכה מיד הלאה עם שאר הקוד, ומתעדכנת מאוחר יותר כשהתשובה חוזרת. פרומיס הוא בעצם "הבטחה" - אובייקט שמייצג ערך שעוד לא קיים, אבל יגיע בעתיד.

## שלושת המצבים של פרומיס

פרומיס תמיד נמצא באחד משלושה מצבים:

- **pending** - ממתין, עדיין לא הסתיים.
- **fulfilled** - הצליח, יש ערך.
- **rejected** - נכשל, יש שגיאה.

```javascript
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    const success = true;
    if (success) {
      resolve("הצלחה!");
    } else {
      reject("משהו נכשל");
    }
  }, 1000);
});
```

## then ו-catch - הדרך הישנה יותר

לפני שהיה `async/await`, טיפלו בתוצאה של פרומיס עם `.then` להצלחה ו-`.catch` לכישלון:

```javascript
promise
  .then((result) => console.log(result))
  .catch((error) => console.log("שגיאה:", error));
```

כשיש כמה פעולות אסינכרוניות ברצף, אפשר לשרשר `.then` אחד אחרי השני, אבל זה נהיה מסורבל מהר, במיוחד עם הרבה שלבים - זה מה שנקרא לפעמים "פירמידת אבדון" (callback pyramid).

## async/await - אותו דבר, קריא הרבה יותר

`async/await` לא מחליף פרומיסים - הוא תחביר נוח מעליהם, שגורם לקוד אסינכרוני להיראות ולהתקרא כמו קוד רגיל, שורה אחרי שורה:

```javascript
async function getData() {
  try {
    const result = await promise;
    console.log(result);
  } catch (error) {
    console.log("שגיאה:", error);
  }
}
```

`await` אומר לג'אווהסקריפט "עצור כאן עד שהפרומיס הזה מסתיים, ורק אז המשך לשורה הבאה" - אבל בלי לחסום את שאר הדפדפן, רק את הפונקציה הספציפית הזאת. `try/catch` תופס שגיאות בדיוק כמו בקוד סינכרוני רגיל, במקום `.catch` נפרד.

חשוב לזכור - `await` אפשרי רק בתוך פונקציה שמוגדרת עם `async` לפניה. זה הכלל הראשון שכל מתחיל שוכח, ואז מקבל שגיאת syntax מוזרה.

## דוגמה מלאה - מ-then ל-async/await

הנה אותה פעולה בדיוק, בשתי הגרסאות, כדי לראות את ההבדל בקריאות:

```javascript
// עם then
function loadUser(id) {
  return fetch(`/api/users/${id}`)
    .then((res) => res.json())
    .then((user) => {
      console.log(user.name);
      return user;
    })
    .catch((error) => console.log("נכשל:", error));
}

// עם async/await - אותו דבר בדיוק, קריא יותר
async function loadUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`);
    const user = await res.json();
    console.log(user.name);
    return user;
  } catch (error) {
    console.log("נכשל:", error);
  }
}
```

## Promise.all - הרצת כמה פעולות במקביל

לפעמים רוצים כמה בקשות שירוצו בו-זמנית, ולא אחת אחרי השנייה. `Promise.all` מחכה שכולן יסתיימו:

```javascript
async function loadDashboard() {
  const [user, orders, notifications] = await Promise.all([
    fetch("/api/user").then((r) => r.json()),
    fetch("/api/orders").then((r) => r.json()),
    fetch("/api/notifications").then((r) => r.json()),
  ]);
}
```

אם כל בקשה הייתה עם `await` בנפרד, בזו אחר זו, הזמן הכולל היה סכום שלוש הבקשות. עם `Promise.all` הן רצות במקביל, והזמן הכולל הוא בערך זמן הבקשה הכי איטית מבין השלוש. חשוב לדעת - אם אחת הבקשות נכשלת, `Promise.all` נכשל כולו מיד.

## איפה זה פוגש אתכם בריאקט

כמעט כל שליפת נתונים בריאקט משתמשת בפרומיסים, בדרך כלל בתוך `useEffect`, עם `async/await`:

```jsx
useEffect(() => {
  async function loadUser() {
    const res = await fetch(`/api/users/${userId}`);
    const data = await res.json();
    setUser(data);
  }
  loadUser();
}, [userId]);
```

שימו לב - אי אפשר לשים `async` ישירות על פונקציית ה-`useEffect` עצמה, לכן מגדירים פונקציה פנימית נפרדת וקוראים לה.

בקורס [צד לקוח](https://amittech.dev/צד-לקוח/) פרומיסים ו-async/await מתורגלים לעומק לפני שמגיעים לשליפת נתונים בריאקט, כדי שהמעבר יהיה חלק.

## לסיכום

פרומיס הוא אובייקט שמייצג ערך שיגיע בעתיד, ועובר בין מצבי pending, fulfilled ו-rejected. `async/await` הוא תחביר נוח שהופך קוד עם פרומיסים לקריא כמו קוד רגיל, עם `try/catch` לטיפול בשגיאות. זה כלי שכל מפתח פרונטאנד משתמש בו כל יום, בלי יוצא מן הכלל.

יש לכם קוד אסינכרוני שמתנהג לא כמו שציפיתם? תביאו אותו לדיסקורד.

[הצטרפו לקהילה בדיסקורד](https://discord.gg/ef5PQAAca2)
