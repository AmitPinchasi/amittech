---
date: 2026-05-25
description: הוקים מותאמים אישית בריאקט מוסברים בפשטות - איך בונים custom hook שלכם, למה חייבים לשמור על הכינוי use, ודוגמה מלאה של useLocalStorage שאפשר להשתמש בה.
tags:
  - ריאקט
  - הוקים
  - פרונטאנד
---

# הוקים מותאמים אישית בריאקט - Custom Hooks

אחרי שמכירים את `useState`, `useEffect` ו-`useRef`, מגיע שלב טבעי - לגלות שאפשר לבנות הוקים משלכם. הוק מותאם אישית (custom hook) הוא לא תכונה מיוחדת של ריאקט עם תחביר חדש - הוא פשוט פונקציה רגילה שמשתמשת בהוקים אחרים בפנים, ומאפשרת לכם לחלץ לוגיקה חוזרת לקובץ אחד שאפשר להשתמש בו מכל קומפוננטה.

## הבעיה שהוקים מותאמים פותרים

תארו לעצמכם שבכמה קומפוננטות שונות אתם צריכים לעקוב אחרי גודל חלון הדפדפן. בלי custom hook, הייתם צריכים להעתיק את אותו קוד `useState` ו-`useEffect` בכל קומפוננטה בנפרד - קוד כפול, קשה לתחזוקה, וקל לשכוח לעדכן בכל מקום אם משהו משתנה.

```jsx
// חוזר על עצמו בכל קומפוננטה שצריכה את זה
function SomeComponent() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return <p>רוחב המסך: {width}</p>;
}
```

## חילוץ הלוגיקה להוק משלכם

custom hook הוא פשוט פונקציה שמתחילה במילה `use` (כלל חובה, לא המלצה - מיד נסביר למה), שמכילה בתוכה קריאות להוקים אחרים:

```jsx
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}
```

עכשיו כל קומפוננטה שצריכה את הרוחב פשוט קוראת להוק:

```jsx
function SomeComponent() {
  const width = useWindowWidth();
  return <p>רוחב המסך: {width}</p>;
}

function AnotherComponent() {
  const width = useWindowWidth();
  return width > 768 ? <DesktopView /> : <MobileView />;
}
```

הלוגיקה כתובה פעם אחת בלבד, ושתי הקומפוננטות משתמשות בה בלי שום קוד כפול. כל קומפוננטה שמשתמשת בהוק מקבלת state עצמאי משלה - כמו כל הוק אחר, אין שיתוף state בין קריאות שונות ל-`useWindowWidth`.

## למה השם חייב להתחיל ב-use

זה לא רק מוסכמה - זה כלל שריאקט וכלי הלינטינג מסתמכים עליו כדי לאכוף את "כללי ההוקים" (rules of hooks), למשל האיסור לקרוא להוק בתוך תנאי או לולאה. אם פונקציה שמשתמשת בהוקים בפנים לא מתחילה ב-`use`, כלי הבדיקה לא יודע שמדובר בהוק, ולא יתריע אם מישהו קורא לו בצורה לא חוקית, מה שעלול לגרום לבאגים קשים לאבחון.

## דוגמה שימושית - useLocalStorage

הנה custom hook נפוץ ושימושי במיוחד - הוק שמתנהג כמו `useState`, אבל שומר את הערך גם ב-`localStorage`, כך שהוא נשמר גם אחרי רענון הדף:

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
```

שימוש בו נראה בדיוק כמו `useState` רגיל:

```jsx
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage("theme", "light");

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      ערכת נושא נוכחית: {theme}
    </button>
  );
}
```

שימו לב לפרט חשוב - `useState` בדוגמה הזאת מקבל **פונקציה** כערך ראשוני, לא ערך ישירות. זה נקרא "אתחול עצל" (lazy initialization), ומבטיח שהקריאה ל-`localStorage.getItem` תרוץ רק פעם אחת, ברינדור הראשון, ולא בכל רינדור מחדש.

## custom hook שעוטף fetch

דוגמה נוספת שנפוצה מאוד היא הוק לשליפת נתונים, שמנהל בעצמו את מצבי הטעינה והשגיאה:

```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`);

  if (loading) return <p>טוען...</p>;
  if (error) return <p>שגיאה: {error}</p>;
  return <h1>{user.name}</h1>;
}
```

הוק כזה הוא בעצם גרסה פשוטה של מה שספריות כמו React Query עושות בצורה הרבה יותר מתקדמת, עם קאשינג וניהול חכם של בקשות כפולות.

## הכלל הזהב - לחלץ הוק רק כשיש חזרתיות אמיתית

לא כל שני `useState` ו-`useEffect` צריכים להפוך להוק משלכם. הכלל הטוב הוא לחלץ custom hook כשמזהים בפועל אותה לוגיקה חוזרת בשני מקומות או יותר, או כשלוגיקה מסוימת מספיק מורכבת שכדאי להפריד אותה מהקומפוננטה כדי שהקומפוננטה עצמה תישאר פשוטה לקריאה.

בקורס [צד לקוח](https://amittech.dev/צד-לקוח/) יש תרגיל שבו בונים כמה הוקים מותאמים אישית מאפס, כולל דיון מתי זה שווה את זה ומתי זה רק סיבוך מיותר.

## לסיכום

הוק מותאם אישית הוא פונקציה שמתחילה ב-`use` ומשתמשת בהוקים אחרים בפנים, ומאפשרת לחלץ לוגיקה חוזרת ולעשות בה שימוש חוזר בכמה קומפוננטות בלי כפילות קוד. זה לא תכונה מיוחדת עם כללים חדשים - זה בעצם רק שימוש חכם בהוקים שכבר מכירים, עטוף בפונקציה עם שם.

בניתם הוק מותאם אישית ורוצים משוב עליו? תשתפו בדיסקורד.

[הצטרפו לקהילה בדיסקורד](https://discord.gg/ef5PQAAca2)
