/**
 * What the model is told, and what it is given.
 *
 * `framing.md` settles this: the model drafts, and it is never asked for a fact.
 * It receives verified details and phrases them. Everything below exists to keep
 * that true even when the model would rather be helpful.
 */

export type DraftSubject =
  | {
      kind: 'catalogue'
      title: string
      /** From the verified list. The only facts the model may state. */
      detail: string[]
      warnings: string[]
      /** The route for this move's authority type, where the list gives one. */
      route: string | null
      authorityName: string | null
      authorityType: string | null
    }
  | {
      kind: 'custom'
      title: string
    }

const SHARED_RULES = `
כללים שאין לחרוג מהם:
- אל תוסיף שום עובדה שלא נמסרה לך. לא שם טופס, לא מחלקה, לא מספר טלפון, לא כתובת אתר, ולא שלב בנוהל.
- אם פרט חסר כדי שהבקשה תהיה שלמה, השאר במקומו סוגריים מרובעים עם תיאור קצר של מה שחסר. אל תמציא אותו ואל תשמיט אותו בשקט.
- פרטים אישיים — שם, מספר תעודת זהות, מספר חשבון, טלפון — תמיד נשארים כסוגריים מרובעים. לא נמסרו לך והם יושלמו לפני השליחה.
- כתוב בעברית, בגוף ראשון, בפנייה מנומסת ועניינית. בלי הקדמות ארוכות ובלי התנצלויות.
- אורך: בין חמש לשתים עשרה שורות. בקשה, לא מכתב.
- החזר את גוף הבקשה בלבד. בלי כותרת, בלי הסבר על מה שכתבת, ובלי טקסט עוטף.
`.trim()

export function systemPrompt(subject: DraftSubject): string {
  if (subject.kind === 'custom') {
    return `
אתה מנסח בקשה רשמית עבור אדם שעובר דירה בישראל.

הפריט הזה נוסף בידי המשתמש ואינו מופיע ברשימה המאומתת של הפרויקט. **אין לך עליו
שום מידע מאומת** — לא מי הגורם שאליו פונים, לא באיזה ערוץ, ולא מה נדרש.

הדבר היחיד שידוע לך הוא שם הפריט, והוא נושא הבקשה. נסח בקשה כללית **על הנושא
הזה** — לא בקשה לעדכון כתובת, אלא אם שם הפריט הוא אכן עדיין כזה. הכתובת החדשה
היא הקשר, ולא בהכרח מה שמבקשים.

**הנמען הוא עובדה שלא נמסרה לך.** לכן שורת הפנייה היא תמיד סוגריים מרובעים —
`לכבוד [נמען]` — ולעולם לא ניחוש, גם לא ניחוש סביר ולא ניחוש עם לוכסן בין שתי
אפשרויות. אותו כלל חל על כל דבר אחר שלא נמסר לך.

${SHARED_RULES}
`.trim()
  }

  const facts = [
    `שם הפריט: ${subject.title}`,
    subject.authorityName ? `הרשות: ${subject.authorityName}` : null,
    subject.authorityType ? `סוג הרשות: ${subject.authorityType}` : null,
    subject.route ? `המסלול המאומת: ${subject.route}` : null,
    ...subject.detail.map((line) => `פרט מאומת: ${line}`),
    ...subject.warnings.map((line) => `אזהרה שיש להביא בחשבון: ${line}`),
  ]
    .filter((line): line is string => line !== null)
    .join('\n')

  return `
אתה מנסח בקשה רשמית עבור אדם שעובר דירה בישראל.

להלן כל מה שידוע על הפריט. **זה כל המידע שיש לך, והוא מאומת.** כל דבר שאינו
מופיע כאן — אינך יודע אותו.

${facts}

נסח בקשה שאפשר לשלוח כמו שהיא אחרי קריאה אחת. אם המסלול המאומת מציין ערוץ
מסוים, התאם את הניסוח אליו.

${SHARED_RULES}
`.trim()
}

export const userPrompt = (address: string, title: string): string =>
  `נושא הבקשה: ${title}\nהכתובת החדשה: ${address}\n\nנסח את הבקשה.`
