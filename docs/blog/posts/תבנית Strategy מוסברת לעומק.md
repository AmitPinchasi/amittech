---
date: 2026-03-23
description: תבנית Strategy מוסברת לעומק עם דוגמת קוד - איך מחליפים שרשרת if-else ארוכה במחלקות נפרדות שאפשר להחליף בזמן ריצה, ומתי זה משתלם ומתי זה תקורה מיותרת.
tags:
  - תבניות עיצוב
  - תכנות
---

# תבנית Strategy מוסברת לעומק

כמעט כל מפתח נתקל באותו דפוס - פונקציה שמתחילה עם if-else פשוט, וכל חודש מישהו מוסיף לה עוד תנאי, עד שהיא הופכת למפלצת של מאה שורות שאף אחד לא רוצה לגעת בה. תבנית Strategy קיימת בדיוק בשביל למנוע את זה, ובעזרת דוגמה אחת פשוטה אפשר לראות למה היא כל כך שימושית.

## הבעיה - if-else שגדל לנצח

נניח שיש לכם מערכת חישוב עמלת משלוח, ובהתחלה יש רק שיטת חישוב אחת. חצי שנה אחר כך, יש כבר שלוש שיטות שונות - לפי משקל, לפי מרחק, ולפי מחיר קבוע ללקוחות VIP.

```python
def calculate_shipping(order, method):
    if method == "weight":
        return order.weight * 2.5
    elif method == "distance":
        return order.distance * 1.2
    elif method == "flat_vip":
        return 15
    else:
        raise ValueError("Unknown method")
```

זה עובד, אבל כל שיטת חישוב חדשה דורשת חזרה לפונקציה הזאת ועריכה שלה - מה שסותר את עיקרון הפתיחות והרחבה מ-SOLID, שאומר שאמורים להיות מסוגלים להוסיף התנהגות בלי לשנות קוד קיים.

## הפתרון - כל אסטרטגיה כמחלקה נפרדת

תבנית Strategy מציעה להפוך כל שיטת חישוב למחלקה נפרדת, שכולן מיישמות אותה ממשק משותף - במקרה הזה, מתודה בשם `calculate`.

```python
from abc import ABC, abstractmethod

class ShippingStrategy(ABC):
    @abstractmethod
    def calculate(self, order):
        pass


class WeightBasedShipping(ShippingStrategy):
    def calculate(self, order):
        return order.weight * 2.5


class DistanceBasedShipping(ShippingStrategy):
    def calculate(self, order):
        return order.distance * 1.2


class FlatVipShipping(ShippingStrategy):
    def calculate(self, order):
        return 15


class Order:
    def __init__(self, weight, distance, shipping_strategy):
        self.weight = weight
        self.distance = distance
        self.shipping_strategy = shipping_strategy

    def get_shipping_cost(self):
        return self.shipping_strategy.calculate(self)
```

עכשיו הוספת שיטת חישוב חדשה - למשל תעריף מיוחד לחגים - היא יצירת מחלקה חדשה שמיישמת את `ShippingStrategy`, בלי לגעת בקוד הקיים בכלל. `Order` עצמה לא יודעת כלום על ההיגיון הפנימי של כל שיטה, היא רק מחזיקה הפניה לאסטרטגיה ומפעילה אותה.

## החלפה בזמן ריצה

יתרון נוסף של Strategy הוא שאפשר להחליף את האסטרטגיה בזמן ריצה, לא רק בזמן יצירת האובייקט. אם לקוח משדרג לחברות VIP באמצע השימוש באפליקציה, מספיק להחליף את האסטרטגיה שההזמנה שלו מחזיקה, בלי שום שינוי מבני נוסף.

```python
order = Order(weight=5, distance=10, shipping_strategy=WeightBasedShipping())
print(order.get_shipping_cost())  # 12.5

order.shipping_strategy = FlatVipShipping()
print(order.get_shipping_cost())  # 15
```

## Strategy מול פונקציות מועברות כפרמטר

בשפות שתומכות בפונקציות כאזרחים מהמעלה הראשונה, כמו Python או JavaScript, אפשר לפעמים להשיג אותו אפקט בלי מחלקות בכלל - פשוט מעבירים פונקציה כפרמטר במקום אובייקט. זה עובד מצוין כשהאסטרטגיה היא חישוב פשוט וחסר מצב. הגרסה עם מחלקות מלאה עדיפה כשלכל אסטרטגיה יש הגדרות משלה, מצב פנימי, או תלויות משלה - למשל אם `DistanceBasedShipping` צריכה לפנות לשירות חיצוני שמחשב מרחק בפועל.

## מתי Strategy מוגזם

לא כל if-else צריך להפוך למחלקה. אם יש רק שני מקרים שלא צפויים להשתנות בקרוב, ה-if-else הפשוט קריא יותר מחמש מחלקות ומחלקת בסיס מופשטת. Strategy משתלמת כשיש - או צפוי להיות - יותר משני-שלושה מקרים, כשלוגיקת המקרים מורכבת מספיק כדי להצדיק מחלקה נפרדת, וכשיש סבירות אמיתית שיתווספו עוד מקרים בעתיד. הפעלת התבנית "כי אולי בעתיד" בלי צורך אמיתי כרגע היא תקורה מיותרת שרק מקשה לקרוא את הקוד.

בקורס [ארכיטקטורת תוכנה](https://amittech.dev/ארכיטקטורת-תוכנה/) שלנו עוברים על Strategy לצד תבניות עיצוב נוספות, עם דגש על מתי כדאי להשתמש בכל אחת ומתי היא רק תוספת מיותרת.

יש לכם if-else שגדל מעבר לשליטה וחשבתם להפוך אותו ל-Strategy? [הצטרפו לקהילה בדיסקורד](https://discord.gg/ef5PQAAca2) ותשתפו את המקרה שלכם.

## לסיכום

תבנית Strategy מחליפה שרשרת if-else שגדלה לנצח בקבוצת מחלקות, כל אחת מיישמת אותו ממשק, שאפשר להוסיף אליהן בלי לגעת בקוד הקיים ולהחליף ביניהן בזמן ריצה. היא לא מתאימה לכל מקרה - כשיש רק שני-שלושה מקרים פשוטים שלא צפויים לגדול, if-else פשוט עדיין הבחירה הנכונה.
