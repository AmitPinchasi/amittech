# פירוק לערכים סינגולריים - SVD

בסוף השיעור הקודם נשארנו עם בעיה: הפירוק לערכים עצמיים יפה, אבל הוא לא עובד תמיד. הוא דורש מטריצה ריבועית, והוא נכשל על מטריצות מסוימות. פירוק **SVD** (Singular Value Decomposition) הוא הגרסה שעובדת **על כל מטריצה שהיא**, ריבועית או לא, ובלי שום יוצא מן הכלל. הוא כנראה הכלי היחיד והשימושי ביותר בכל האלגברה הלינארית היישומית.

## ההצהרה

כל מטריצה $M$ בגודל $m \times n$ ניתנת לכתיבה כמכפלה של שלוש מטריצות:

$$
M \;=\; U\,\Sigma\,V^{*}
$$

- ה $U$ בגודל $m \times m$ היא **אוניטרית**, כלומר מסובבת בלבד (מהשיעור על כפל מטריצות).
- ה $\Sigma$ בגודל $m \times n$ היא **אלכסונית**, וכל איברי האלכסון שלה ממשיים ואי-שליליים. היא **מותחת בלבד**.
- ה $V^{*}$ בגודל $n \times n$ היא שוב **אוניטרית**, כלומר מסובבת בלבד.

ובעברית פשוטה, וזו כל התובנה:

> **כל מטריצה, בלי יוצא מן הכלל, היא בסך הכל: סיבוב, אחר כך מתיחה לאורך הצירים, אחר כך סיבוב נוסף.**

## התמונה שאסור לשכוח - מעגל שהופך לאליפסה

הדרך הכי טובה לראות את זה היא להפעיל את המטריצה על מעגל היחידה, כלומר על כל הוקטורים שאורכם 1. התוצאה תמיד, תמיד, תהיה **אליפסה**.

<div dir="ltr" style="text-align:center;margin:1.5rem 0"><svg viewBox="0 0 380 320" width="100%" style="max-width:420px" role="img" aria-label="מעגל היחידה עובר סיבוב, מתיחה וסיבוב והופך לאליפסה"><title>SVD כסיבוב, מתיחה וסיבוב</title><g stroke="currentColor" opacity="0.28"><path d="M20 160 H360 M190 24 V296"/></g><g transform="translate(190,160)"><g><g><g><circle cx="0" cy="0" r="48" fill="#10b981" fill-opacity="0.14" stroke="#10b981" stroke-width="2.5" vector-effect="non-scaling-stroke"/><line x1="0" y1="0" x2="48" y2="0" stroke="#3b82f6" stroke-width="3.5" vector-effect="non-scaling-stroke"/><line x1="0" y1="0" x2="0" y2="-48" stroke="#f59e0b" stroke-width="3.5" vector-effect="non-scaling-stroke"/><animateTransform attributeName="transform" type="rotate" values="0 0 0; 0 0 0; -30 0 0; -30 0 0; 0 0 0" keyTimes="0;0.08;0.25;0.92;1" dur="13s" repeatCount="indefinite"/></g><animateTransform attributeName="transform" type="scale" values="1 1; 1 1; 2.6 0.85; 2.6 0.85; 1 1" keyTimes="0;0.32;0.5;0.92;1" dur="13s" repeatCount="indefinite"/></g><animateTransform attributeName="transform" type="rotate" values="0 0 0; 0 0 0; -55 0 0; -55 0 0; 0 0 0" keyTimes="0;0.57;0.75;0.92;1" dur="13s" repeatCount="indefinite"/></g></g><g font-size="15" text-anchor="middle"><text x="190" y="26" fill="#a855f7" opacity="0">V* מסובב<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.1;0.3;0.34;1" dur="13s" repeatCount="indefinite"/></text><text x="190" y="26" fill="#a855f7" opacity="0">Σ מותח לאורך הצירים<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.34;0.4;0.55;0.59;1" dur="13s" repeatCount="indefinite"/></text><text x="190" y="26" fill="#a855f7" opacity="0">U מסובב שוב<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.59;0.65;0.9;1" dur="13s" repeatCount="indefinite"/></text></g><text x="190" y="312" fill="currentColor" font-size="14" text-anchor="middle" opacity="0.75">מעגל נכנס, אליפסה יוצאת. תמיד</text></svg></div>

שימו לב להבדל מהשיעור הקודם: שם שני הסיבובים היו הפוכים זה לזה ($V$ ואז $V^{-1}$, כלומר חוזרים בדיוק לנקודת המבט המקורית). כאן שני הסיבובים הם **עצמאיים לגמרי** - מסתובבים בכיוון אחד, מותחים, ומסתובבים בכיוון אחר לגמרי. בדיוק החופש הנוסף הזה הוא מה שמאפשר ל-SVD לעבוד על כל מטריצה.

## הערכים הסינגולריים - כמה מתחנו בכל כיוון

איברי האלכסון של $\Sigma$, המסומנים $\sigma_1, \sigma_2, \ldots$, נקראים **הערכים הסינגולריים** של $M$, והם תמיד מסודרים **מהגדול לקטן**. גאומטרית הם פשוט **אורכי חצאי הצירים של האליפסה** שקיבלנו:

- ה$\sigma_1$ הוא הכיוון שבו המטריצה מותחת הכי הרבה.
- ה$\sigma_2$ הוא הכיוון הבא, ניצב אליו, וכן הלאה.
- ערך סינגולרי **אפס** אומר שהכיוון הזה נמעך לחלוטין, כלומר מידע אבד.

העמודות של $U$ נקראות **הוקטורים הסינגולריים השמאליים** ושל $V$ **הוקטורים הסינגולריים הימניים**. הקשר לשיעור הקודם ישיר ומסודר:

- הוקטורים הסינגולריים השמאליים של $M$ הם הוקטורים העצמיים של $M\,M^{*}$.
- הוקטורים הסינגולריים הימניים של $M$ הם הוקטורים העצמיים של $M^{*}M$.
- הערכים הסינגולריים השונים מאפס הם **השורשים הריבועיים** של הערכים העצמיים השונים מאפס של שתי המטריצות האלה.

כלומר SVD הוא לא רעיון חדש לגמרי, אלא הדרך החכמה להחיל את הרעיון של ערכים עצמיים גם על מטריצות שאין להם.

## הקסם המעשי - זריקת הזנב

וכאן מגיע השימוש שהפך את SVD לכלי הכי חשוב בתחום. כשמחשבים את הערכים הסינגולריים של מטריצה אמיתית, כמעט תמיד מקבלים תמונה כזאת: כמה ערכים גדולים מאוד בהתחלה, ואז זנב ארוך של ערכים זעירים.

<div dir="ltr" style="text-align:center;margin:1.5rem 0"><svg viewBox="0 0 420 240" width="100%" style="max-width:460px" role="img" aria-label="ערכים סינגולריים יורדים, שומרים רק את הגדולים"><title>קירוב בדרגה נמוכה</title><line x1="42" y1="180" x2="392" y2="180" stroke="currentColor" opacity="0.45"/><g fill="#3b82f6"><rect x="52" y="40" width="22" height="140" rx="3"/><rect x="82" y="93" width="22" height="87" rx="3"><animate attributeName="opacity" values="0.18;0.18;1;1;1;1;1;1;0.18" dur="10s" repeatCount="indefinite" keyTimes="0.0;0.195;0.25;0.445;0.5;0.695;0.75;0.945;1.0"/></rect><rect x="112" y="127" width="22" height="53" rx="3"><animate attributeName="opacity" values="0.18;0.18;1;1;1;1;1;1;0.18" dur="10s" repeatCount="indefinite" keyTimes="0.0;0.195;0.25;0.445;0.5;0.695;0.75;0.945;1.0"/></rect><rect x="142" y="146" width="22" height="34" rx="3"><animate attributeName="opacity" values="0.18;0.18;0.18;0.18;1;1;1;1;0.18" dur="10s" repeatCount="indefinite" keyTimes="0.0;0.195;0.25;0.445;0.5;0.695;0.75;0.945;1.0"/></rect><rect x="172" y="159" width="22" height="21" rx="3"><animate attributeName="opacity" values="0.18;0.18;0.18;0.18;1;1;1;1;0.18" dur="10s" repeatCount="indefinite" keyTimes="0.0;0.195;0.25;0.445;0.5;0.695;0.75;0.945;1.0"/></rect><rect x="202" y="167" width="22" height="13" rx="3"><animate attributeName="opacity" values="0.18;0.18;0.18;0.18;1;1;1;1;0.18" dur="10s" repeatCount="indefinite" keyTimes="0.0;0.195;0.25;0.445;0.5;0.695;0.75;0.945;1.0"/></rect><rect x="232" y="171" width="22" height="9" rx="3"><animate attributeName="opacity" values="0.18;0.18;0.18;0.18;0.18;0.18;1;1;0.18" dur="10s" repeatCount="indefinite" keyTimes="0.0;0.195;0.25;0.445;0.5;0.695;0.75;0.945;1.0"/></rect><rect x="262" y="174" width="22" height="6" rx="3"><animate attributeName="opacity" values="0.18;0.18;0.18;0.18;0.18;0.18;1;1;0.18" dur="10s" repeatCount="indefinite" keyTimes="0.0;0.195;0.25;0.445;0.5;0.695;0.75;0.945;1.0"/></rect><rect x="292" y="176" width="22" height="4" rx="3"><animate attributeName="opacity" values="0.18;0.18;0.18;0.18;0.18;0.18;1;1;0.18" dur="10s" repeatCount="indefinite" keyTimes="0.0;0.195;0.25;0.445;0.5;0.695;0.75;0.945;1.0"/></rect><rect x="322" y="177" width="22" height="3" rx="3"><animate attributeName="opacity" values="0.18;0.18;0.18;0.18;0.18;0.18;1;1;0.18" dur="10s" repeatCount="indefinite" keyTimes="0.0;0.195;0.25;0.445;0.5;0.695;0.75;0.945;1.0"/></rect></g><line x1="78" y1="26" x2="78" y2="192" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="6 4"><animate attributeName="x1" values="78;78;138;138;228;228;378;378;78" dur="10s" repeatCount="indefinite" keyTimes="0.0;0.195;0.25;0.445;0.5;0.695;0.75;0.945;1.0"/><animate attributeName="x2" values="78;78;138;138;228;228;378;378;78" dur="10s" repeatCount="indefinite" keyTimes="0.0;0.195;0.25;0.445;0.5;0.695;0.75;0.945;1.0"/></line><g font-size="13" fill="currentColor"><text x="52" y="206" opacity="0.7" font-family="monospace">σ1</text><text x="82" y="206" opacity="0.7" font-family="monospace">σ2</text><text x="112" y="206" opacity="0.7" font-family="monospace">σ3</text><text x="322" y="206" opacity="0.7" font-family="monospace">σ10</text></g><text x="210" y="232" fill="#ef4444" font-size="14" text-anchor="middle">שומרים את הגדולים משמאל לקו, זורקים את הזנב</text></svg></div>

הרעיון פשוט: אם $\sigma_7$ ואילך קטנים בטירוף, הם כמעט לא תורמים למטריצה. אז פשוט **מוחקים אותם** ובונים מחדש את $M$ רק מ-$k$ הערכים הגדולים. מקבלים מטריצה $M_k$ שדומה ל-$M$ עד כדי שגיאה זניחה, אבל דורשת הרבה פחות מספרים כדי לאחסן אותה. זה נקרא **קירוב בדרגה נמוכה** (low-rank approximation), ומשפט ידוע מבטיח שזה הקירוב **הטוב ביותר** האפשרי מבין כל המטריצות בדרגה $k$.
