---
date: 2026-06-27
description: שליפת נתונים עם React Query מוסברת בפשטות - למה fetch עם useEffect ידני מסתבך מהר, ואיך useQuery נותן קאשינג, רענון אוטומטי וטיפול בשגיאות בלי מאמץ.
tags:
  - ריאקט
  - פרונטאנד
---

# שליפת נתונים עם React Query

אחרי שכותבים כמה פעמים את אותו דפוס - `useState` לנתונים, `useState` לטעינה, `useState` לשגיאה, ו-`useEffect` שקורא ל-`fetch` - מתחילים להבין שיש כאן קוד חוזר שמתבקש להיפתר בצורה טובה יותר. React Query (היום נקרא רשמית TanStack Query) היא הספרייה שהפכה לסטנדרט לפתרון הבעיה הזאת.

## הבעיה עם fetch ידני ב-useEffect

הדפוס הידני עובד, אבל הוא מסתיר כמה בעיות שמופיעות רק כשהאפליקציה גדלה:

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <p>טוען...</p>;
  if (error) return <p>שגיאה: {error}</p>;
  return <h1>{user.name}</h1>;
}
```

מה שהקוד הזה **לא** עושה - אם שתי קומפוננטות שונות שולפות את אותו משתמש בו-זמנית, הן שולחות שתי בקשות רשת נפרדות במקום לשתף תוצאה. אם המשתמש עוזב את העמוד וחוזר אליו, הנתונים נטענים מחדש מאפס, גם אם עברו רק שתי שניות. ואם הבקשה נכשלת, אין מנגנון אוטומטי לנסות שוב.

## useQuery - הפתרון של React Query

```jsx
import { useQuery } from "@tanstack/react-query";

function UserProfile({ userId }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetch(`/api/users/${userId}`).then((res) => res.json()),
  });

  if (isLoading) return <p>טוען...</p>;
  if (error) return <p>שגיאה: {error.message}</p>;
  return <h1>{user.name}</h1>;
}
```

`queryKey` הוא מזהה ייחודי לנתונים האלה - React Query משתמש בו כדי לדעת "האם כבר יש לי את הנתונים האלה בקאש?". `queryFn` היא הפונקציה שבפועל מביאה את הנתונים. React Query מטפל אוטומטית בטעינה, שגיאות, וקאשינג, בלי שצריך לכתוב `useState` אחד בעצמכם.

## מה מקבלים בחינם

- **קאשינג אוטומטי** - אם שתי קומפוננטות מבקשות אותו `queryKey`, React Query שולח בקשת רשת אחת בלבד ומשתף את התוצאה בין שתיהן.
- **רענון ברקע** - כשחוזרים לטאב אחרי שהיה ברקע, או כשחוזרים לעמוד, React Query יכול לרענן את הנתונים אוטומטית בלי לחסום את הממשק - המשתמש רואה קודם את הנתונים הישנים מהקאש, ומתעדכן ברגע שהחדשים מגיעים.
- **ניסיון חוזר אוטומטי** - אם בקשה נכשלת בגלל בעיית רשת זמנית, React Query מנסה שוב אוטומטית לפי הגדרה ניתנת לשליטה.
- **מניעת בקשות כפולות** - אם אותה בקשה כבר "בדרך", React Query לא שולח אותה שוב, אלא ממתין לתוצאה הקיימת.

## useMutation - שינוי נתונים בשרת

בעוד `useQuery` מיועד לשליפת נתונים, `useMutation` מיועד לפעולות ששולחות שינוי לשרת - יצירה, עדכון, מחיקה:

```jsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

function CreateUserForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newUser) =>
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    mutation.mutate({ name: "משתמש חדש" });
  }

  return (
    <form onSubmit={handleSubmit}>
      <button disabled={mutation.isPending}>
        {mutation.isPending ? "שולח..." : "צור משתמש"}
      </button>
    </form>
  );
}
```

`invalidateQueries` היא הקסם כאן - אחרי יצירת משתמש בהצלחה, היא "מסמנת" את הרשימה הקיימת ברשימת המשתמשים כלא-עדכנית, מה שגורם ל-React Query לרענן אותה אוטומטית בכל מקום שהיא מוצגת, בלי צורך לנהל את זה ידנית.

## מתי כדאי React Query, ומתי זה overkill

לפרויקט קטן עם קריאת רשת אחת בודדת, `fetch` פשוט בתוך `useEffect` עדיין סביר. אבל ברגע שיש כמה עמודים ששולפים נתונים, נתונים שמשותפים בין קומפוננטות, או צורך אמיתי בקאשינג ורענון חכם, React Query חוסך המון קוד חוזר ובאגים עדינים סביב מרוצי מצב (race conditions) שקל מאוד לפספס בקוד ידני.

## חשוב לזכור - זה לא ניהול state כללי

טעות נפוצה היא לחשוב על React Query כתחליף לניהול state כמו Context או Zustand. React Query מתמחה במיוחד בנתונים ש**מגיעים משרת** - זה נקרא לפעמים "server state", בניגוד ל"client state" כמו האם תפריט פתוח או מה נכתב בשדה טופס. השני עדיין דורש כלים אחרים.

בקורס [צד לקוח](https://amittech.dev/צד-לקוח/) יש פרק שמשווה בין הדפוס הידני של fetch ל-React Query בפרויקט אמיתי, כדי לראות בעיניים כמה קוד נחסך וכמה באגים נעלמים.

## לסיכום

React Query פותרת את הבעיות שמופיעות כשמנהלים שליפת נתונים ידנית - קאשינג, רענון, ומצבי טעינה ושגיאה - עם `useQuery` לשליפה ו-`useMutation` לשינוי נתונים. היא לא מחליפה ניהול state רגיל, אלא מתמחה ספציפית בנתונים שמגיעים משרת.

מתלבטים אם הפרויקט שלכם צריך React Query? תשאלו בדיסקורד.

[הצטרפו לקהילה בדיסקורד](https://discord.gg/ef5PQAAca2)
