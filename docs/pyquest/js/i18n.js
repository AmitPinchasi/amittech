/* ============================================================
   PYQUEST - I18N.JS
   Hebrew UI strings
   ============================================================ */

const STRINGS = {
  // Screen titles
  menuTitle: 'PyQuest',
  menuSubtitle: 'ממלכות הקוד',
  worldMapTitle: 'מפת העולם',
  hallTitle: 'היכל האגדות',
  hallSubtitle: 'אלופי הפייתון',

  // Challenge type labels
  type_output_oracle: 'נביא הפלט',
  type_spell_completion: 'השלמת לחש',
  type_corruption_scan: 'סריקת שחיתות',
  type_name_binding: 'כריכת שמות',

  // Challenge instructions
  instr_output_oracle: 'מה יוציא הקוד?',
  instr_spell_completion: 'השלם את הרווחים להשלמת הלחש.',
  instr_corruption_scan: 'מצא את השחיתות. מה לא בסדר בקוד?',
  instr_name_binding: 'קשר כל מונח להגדרתו. לחץ על מונח, ואחר כך על ההתאמה שלו.',

  // Result messages
  correct_title: 'לחש מוצלח!',
  wrong_title: 'זוהתה שחיתות!',
  wrong_flavor: 'הבנתי... המשך',
  correct_label: 'תשובה נכונה:',

  // XP / rewards
  xp_gained: '+{xp} XP',
  hp_lost: '-{hp} HP',
  perfect_bonus: '+30 XP (מושלם!)',
  streak_bonus: '+{xp} XP (רצף!)',
  replay_penalty: '(50% XP - חזרה)',

  // Encounter
  enc_cleared: 'עימות הושלם!',
  enc_xp_earned: '+{xp} XP הושג',
  enc_hp_remaining: 'HP שנותר: {hp}',
  stars_3: '3 כוכבים!',
  stars_2: '2 כוכבים',
  stars_1: 'כוכב אחד',

  // Zone clear
  zone_purified: 'אזור טוהר!',
  boss_defeated: '{boss} הובס!',
  zone_clear_xp_total: 'סך XP שהושג',

  // Zone/encounter breakdowns
  challenges_solved: 'אתגרים נפתרו',
  bonus_xp: 'XP בונוס',
  zone_total: 'סך אזור {zone}',

  // Game over
  game_over_title: 'שגיאת זמן ריצה',
  game_over_sub: 'TypeError: hero not found',
  game_over_context: 'נפלת ב-"{zone}", עימות {enc}',

  // Buttons
  btn_start: 'התחל משחק חדש',
  btn_continue: 'המשך',
  btn_hall: 'היכל האגדות',
  btn_back: 'חזור',
  btn_back_to_map: 'חזור למפה',
  btn_retry: 'נסה שוב',
  btn_world_map: 'מפת העולם',
  btn_hall_back: 'חזור לתפריט',
  btn_reveal_continue: 'המשך',
  btn_reveal_wrong: 'הבנתי... המשך',
  btn_submit: 'שלח',

  // Hint
  hint_free: 'רמז ({n} חינם)',
  hint_paid: 'רמז (-10 HP)',
  hint_none_left: 'אין עוד רמזים',
  hint_used: 'רמז שומש',

  // Streak
  hot_streak: 'רצף לוהט!',
  streak_sub: '+10 XP על התשובה הנכונה הבאה',

  // Level titles
  level_1: 'מחפש תחביר',
  level_2: 'חוקר משתנים',
  level_3: 'חניך מאתר שגיאות',
  level_4: 'אביר הקוד',
  level_5: 'מפענח פונקציות',
  level_6: 'מפקד מחלקות',
  level_7: 'אדון המודולים',
  level_8: 'בקיא אלגוריתמים',
  level_9: 'כותב קוד נקי',
  level_10: 'ארכון פייתון',

  // Hall
  hall_empty: 'אין אגדות עדיין. היה הראשון!',

  // Status
  status_locked: 'נעול',
  status_available: 'זמין',
  status_complete: 'הושלם',

  // Encounter cards
  enc_locked_desc: 'השלם את העימות הקודם תחילה',
  enc_boss_desc: 'קרב בוס - {n} אתגרים',
  enc_normal_desc: '{n} אתגרים',

  // Misc
  level_up: 'עליית רמה!',
  new_level: 'אתה כעת ברמה {level}: {title}!',
  zone_locked_msg: 'השלם את אזור {prev} לביטול הנעילה.',
  enc_locked_msg: 'השלם עימותים קודמים תחילה.',
  boss_label: 'בוס:',
  zone_label: 'אזור',
  tagline: 'שלוט בפייתון. הביס את השחיתות. הצל את הממלכה.',
  level_label: 'רמה',
  replay_xp_suffix: ' (50% חזרה)',
};

/**
 * Get a translated string, replacing {key} placeholders.
 * @param {string} key
 * @param {Object} [vars]
 * @returns {string}
 */
function t(key, vars) {
  let str = STRINGS[key];
  if (str === undefined) {
    console.warn('[i18n] Missing key:', key);
    return key;
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return str;
}
