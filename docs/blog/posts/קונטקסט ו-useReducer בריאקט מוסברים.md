---
date: 2026-07-02
description: קונטקסט ו-useReducer בריאקט מוסברים בפשטות - איך פותרים prop drilling עם createContext, ומתי useReducer עדיף על useState לניהול לוגיקת state מורכבת.
tags:
  - ריאקט
  - ניהול סטייט
  - פרונטאנד
---

# קונטקסט ו-useReducer בריאקט מוסברים

לפני שמגיעים לספריות ניהול state חיצוניות, כדאי להכיר שני כלים מובנים בריאקט עצמה שפותרים חלק גדול מהבעיות - Context לשיתוף נתונים בין קומפוננטות רחוקות, ו-`useReducer` לניהול לוגיקת state מורכבת יותר מ-`useState` פשוט.

## הבעיה ש-Context פותר - prop drilling

תארו לעצמכם שצריך להעביר את פרטי המשתמש המחובר מקומפוננטת האב הראשית, דרך כמה שכבות של קומפוננטות ביניים, עד לכפתור קטן עמוק בעץ הקומפוננטות שרק צריך להציג את השם שלו:

```jsx
function App() {
  const user = { name: "דנה" };
  return <Layout user={user} />;
}

function Layout({ user }) {
  return <Sidebar user={user} />;
}

function Sidebar({ user }) {
  return <UserMenu user={user} />;
}

function UserMenu({ user }) {
  return <p>שלום {user.name}</p>;
}
```

`Layout` ו-`Sidebar` לא בכלל צריכים את `user`, הם רק "מעבירים אותו הלאה" כדי שהוא יגיע ל-`UserMenu`. זה נקרא prop drilling, וזה נהיה מכאיב במיוחד כשעץ הקומפוננטות עמוק, או כשכמה קומפוננטות שונות באמצע צריכות "לנקב" את אותם props דרכן.

## הפתרון - createContext ו-useContext

Context נותן דרך "לשדר" נתונים לכל קומפוננטה בעץ, בלי להעביר אותם דרך כל שכבה באמצע:

```jsx
const UserContext = createContext(null);

function App() {
  const user = { name: "דנה" };
  return (
    <UserContext.Provider value={user}>
      <Layout />
    </UserContext.Provider>
  );
}

function Layout() {
  return <Sidebar />;
}

function Sidebar() {
  return <UserMenu />;
}

function UserMenu() {
  const user = useContext(UserContext);
  return <p>שלום {user.name}</p>;
}
```

`UserContext.Provider` "עוטף" חלק מעץ הקומפוננטות ומספק לו ערך, ו-`useContext(UserContext)` מאפשר לכל קומפוננטה בתוך העטיפה הזאת לגשת לערך ישירות, בלי קשר לכמה שכבות עמוק היא נמצאת. `Layout` ו-`Sidebar` לא צריכות לדעת בכלל ש-`UserMenu` צריך את `user`.

## מתי כדאי Context, ומתי זה יותר מדי

Context נהדר לנתונים "גלובליים" שהרבה קומפוננטות שונות צריכות - משתמש מחובר, ערכת נושא (theme), הגדרות שפה. הוא פחות מתאים לניהול state שמשתנה הרבה ומהר, כי כל שינוי בערך של Context גורם לכל הקומפוננטות שמשתמשות בו (עם `useContext`) להתרנדר מחדש, גם אם רק חלק קטן מהמידע השתנה. לניהול state תכוף ומהיר בפרויקטים גדולים, לרוב פונים לספריות ייעודיות.

## useReducer - כשuseState כבר לא מספיק

`useState` מצוין לערכים פשוטים, אבל כשלוגיקת העדכון של state נהיית מורכבת - כמה סוגי פעולות שונות שכולן משפיעות על אותו state - `useReducer` נותן מבנה ברור יותר. הוא עובד עם פונקציית "רדיוסר" (reducer) שמקבלת state נוכחי ופעולה (action), ומחזירה state חדש:

```jsx
function cartReducer(state, action) {
  switch (action.type) {
    case "add":
      return [...state, action.item];
    case "remove":
      return state.filter((item) => item.id !== action.id);
    case "clear":
      return [];
    default:
      return state;
  }
}

function Cart() {
  const [cart, dispatch] = useReducer(cartReducer, []);

  function addItem(item) {
    dispatch({ type: "add", item });
  }

  function removeItem(id) {
    dispatch({ type: "remove", id });
  }

  return (
    <div>
      <p>פריטים בעגלה: {cart.length}</p>
      <button onClick={() => addItem({ id: 1, name: "מוצר" })}>הוסף</button>
    </div>
  );
}
```

במקום כמה פונקציות `set` נפרדות שכל אחת עלולה לעדכן את ה-state בצורה קצת שונה, כל הלוגיקה מרוכזת במקום אחד - הרדיוסר - וקוראים לה תמיד באותה צורה, דרך `dispatch({ type: "..." })`. זה הופך את הקוד לקל יותר לעקוב אחריו, במיוחד כשיש הרבה סוגי עדכונים אפשריים.

## השילוב החזק - Context ו-useReducer ביחד

דפוס נפוץ מאוד הוא לשלב את שני הכלים - `useReducer` מנהל את הלוגיקה, ו-`Context` משתף את ה-state והפונקציה `dispatch` עם כל האפליקציה, בלי prop drilling:

```jsx
const CartContext = createContext(null);

function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, []);
  return (
    <CartContext.Provider value={{ cart, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

function ProductButton({ product }) {
  const { dispatch } = useContext(CartContext);
  return (
    <button onClick={() => dispatch({ type: "add", item: product })}>
      הוסף לעגלה
    </button>
  );
}
```

השילוב הזה הוא בעצם "ניהול state גלובלי" קל משקל, בלי להוסיף שום ספרייה חיצונית - מתאים היטב לפרויקטים בגודל בינוני שלא צריכים את כל היכולות המתקדמות של ספריות ניהול state ייעודיות.

## מתי כן כדאי לעבור לספרייה חיצונית

השילוב של Context ו-useReducer מתחיל להרגיש מכביד בפרויקטים גדולים מאוד, במיוחד כשיש הרבה "מקורות" state נפרדים שמתעדכנים בתדירות גבוהה, כי כאמור, כל שינוי גורם לרינדור מחדש רחב. במקרים כאלה, ספריות ייעודיות נותנות שליטה עדינה יותר על מה בדיוק מתרנדר מחדש ומתי.

בקורס [צד לקוח](https://amittech.dev/צד-לקוח/) יש פרק שלם שבונה מנהל עגלת קניות עם Context ו-useReducer מאפס, בדיוק כדי להבין את הדפוס לפני שקופצים לספריות חיצוניות.

## לסיכום

Context פותר prop drilling על ידי שיתוף נתונים ישירות עם כל קומפוננטה בעץ, ו-useReducer נותן מבנה ברור לניהול לוגיקת state שמורכבת מדי בשביל useState רגיל. השילוב של שניהם נותן פתרון ניהול state גלובלי מובנה בריאקט, בלי תלות בספרייה חיצונית, שמתאים למגוון רחב של פרויקטים.

מתלבטים אם להשתמש ב-Context או בספרייה חיצונית בפרויקט שלכם? תשאלו בדיסקורד.

[הצטרפו לקהילה בדיסקורד](https://discord.gg/ef5PQAAca2)
