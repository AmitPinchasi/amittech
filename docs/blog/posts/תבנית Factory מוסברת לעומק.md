---
date: 2026-03-30
description: תבנית Factory מוסברת לעומק עם דוגמת קוד - איך מרכזים את הלוגיקה של יצירת אובייקטים במקום אחד, ומתי כדאי להשתמש ב-Factory Method לעומת Abstract Factory.
tags:
  - תבניות עיצוב
  - תכנות
---

# תבנית Factory מוסברת לעומק

בכל מערכת שגדלה, מגיע רגע שבו יצירת אובייקט הופכת מסתם `SomeClass()` פשוט לתהליך עם לוגיקה - צריך להחליט איזה תת-סוג ליצור, עם אילו ברירות מחדל, ולפעמים תלוי בקונפיגורציה חיצונית. תבנית Factory קיימת בדיוק בשביל לרכז את ההחלטה הזאת במקום אחד, במקום לפזר אותה בכל מקום בקוד שיוצר את האובייקט.

## הבעיה - יצירה מפוזרת ומורכבת

נניח שיש לכם מערכת שמייצרת מסמכים - PDF, Word, HTML - ולכל סוג יש מחלקה נפרדת עם קונסטרוקטור משלה. בלי Factory, כל מקום בקוד שצריך ליצור מסמך צריך לדעת בעצמו איזו מחלקה ליצור ואיך.

```python
def export_report(report_type, data):
    if report_type == "pdf":
        exporter = PdfExporter(compression=True, font="Arial")
    elif report_type == "word":
        exporter = WordExporter(template="default")
    elif report_type == "html":
        exporter = HtmlExporter(minify=True)
    return exporter.export(data)
```

הבעיה היא שכל מקום בקוד שצריך ליצור exporter כזה חוזר על אותה לוגיקת בחירה, וכל שינוי בברירות המחדל - למשל שינוי הפונט של PDF - דורש עדכון בכל מקום שיוצר PDF exporter.

## הפתרון - Factory Method

Factory מרכז את לוגיקת היצירה בפונקציה או מחלקה אחת, שמחזירה את האובייקט הנכון לפי הפרמטרים שהיא מקבלת.

```python
class ExporterFactory:
    @staticmethod
    def create_exporter(report_type):
        if report_type == "pdf":
            return PdfExporter(compression=True, font="Arial")
        elif report_type == "word":
            return WordExporter(template="default")
        elif report_type == "html":
            return HtmlExporter(minify=True)
        raise ValueError(f"Unknown report type: {report_type}")


def export_report(report_type, data):
    exporter = ExporterFactory.create_exporter(report_type)
    return exporter.export(data)
```

עכשיו כל שינוי בברירות המחדל של PDF exporter קורה במקום אחד בלבד. וקוד שקורא ל-`export_report` לא צריך לדעת שום פרט על איך בדיוק כל exporter נבנה - הוא רק מבקש exporter מהסוג הנכון ומקבל אובייקט מוכן לשימוש.

## למה זה יותר מסתם "פונקציית עזר"

ההבדל בין Factory לפונקציית עזר רגילה הוא בכוונה - Factory קיים ספציפית כדי להסתיר את החלטת "איזו מחלקה קונקרטית ליצור" מהקוד הקורא. זה חשוב במיוחד כשיש היררכיה של מחלקות עם ממשק משותף - הקוד הקורא עובד רק מול הממשק המשותף, `Exporter`, ולא צריך לדעת בכלל שקיימות שלוש מחלקות שונות מתחתיו. זה מפחית תלות (coupling) בין הקוד שמשתמש באובייקטים לבין הקוד שיוצר אותם.

## Abstract Factory - כשצריך משפחות שלמות של אובייקטים

Factory Method פותר את בעיית יצירת אובייקט בודד. Abstract Factory הולך צעד נוסף - הוא יוצר משפחות שלמות של אובייקטים קשורים שצריכים להתאים אחד לשני. דוגמה קלאסית - מערכת שתומכת בכמה "ערכות עיצוב" (themes), וכל ערכה מגדירה סט שלם של כפתורים, שדות טקסט וחלונות שצריכים להתאים ויזואלית זה לזה. `AbstractFactory` מגדיר ממשק ליצירת כל הרכיבים, וכל תת-מחלקה קונקרטית - `DarkThemeFactory`, `LightThemeFactory` - יודעת ליצור את כל המשפחה בסגנון עקבי אחד. זה מונע מצב שבו בטעות משלבים כפתור מערכת אחת עם שדה טקסט מערכת אחרת.

## Factory מול Dependency Injection

יש חפיפה מסוימת בין Factory ל-Dependency Injection - שתיהן עוסקות בהפרדה בין "מי משתמש באובייקט" לבין "מי יוצר אותו". ההבדל המרכזי הוא שFactory מתאים כשצריך להחליט בזמן ריצה איזה תת-סוג קונקרטי ליצור על סמך פרמטר, בעוד ש-DI מתאים יותר כשהתלות עצמה קבועה מראש ורק מוזרקת מבחוץ במקום שהמחלקה תיצור אותה בעצמה. בפרויקטים גדולים, לרוב רואים את שתיהן יחד - Factory שיודע ליצור את הסוג הנכון, שמוזרק כתלות למחלקות שמשתמשות בו.

בקורס [ארכיטקטורת תוכנה](https://amittech.dev/ארכיטקטורת-תוכנה/) שלנו עוברים על Factory לצד תבניות יצירה נוספות ומראים איפה בדיוק הגבול בינה לבין Dependency Injection.

יש לכם קוד יצירה שמתפזר בכל מקום ותהיתם אם Factory יעזור? [הצטרפו לקהילה בדיסקורד](https://discord.gg/ef5PQAAca2) ותביאו את הדוגמה שלכם.

## לסיכום

תבנית Factory מרכזת החלטת יצירה שהתפזרה בכל מקום למקום אחד ברור, ונותנת לקוד הקורא לעבוד מול ממשק משותף בלי להכיר את המחלקות הקונקרטיות. Factory Method מתאים ליצירת אובייקט בודד לפי פרמטר בזמן ריצה, ו-Abstract Factory מתאים כשצריך ליצור יחד משפחה שלמה של אובייקטים שחייבים להתאים זה לזה.
