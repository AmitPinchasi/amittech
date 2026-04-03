/* ============================================================
   LINUXQUEST - I18N.JS
   Hebrew UI strings
   ============================================================ */

const STRINGS = {
  menuTitle: 'LinuxQuest',
  menuSubtitle: 'מסע הטרמינל',
  worldMapTitle: '$ ls -la /servers/',
  hallTitle: '$ cat /etc/hall_of_fame',
  hallSubtitle: 'גיבורי הטרמינל',

  type_terminal_oracle: 'נביא הפלט',
  type_command_forge:   'השלמת פקודה',
  type_script_debug:    'איתור באגים',
  type_flag_map:        'מיפוי פקודות',
  type_pipe_builder:    'בניית צינור',

  instr_terminal_oracle: 'מה יוציא הטרמינל?',
  instr_command_forge:   'השלם את הפקודה החסרה.',
  instr_script_debug:    'מצא את הבאג בסקריפט.',
  instr_flag_map:        'קשר כל פקודה לתיאורה. לחץ על פקודה, ואחר כך על ההתאמה שלה.',
  instr_pipe_builder:    'בחר את הצינור הנכון להשגת המטרה.',

  correct_title: 'פקודה בוצעה!',
  wrong_title:   'שגיאה בביצוע!',
  wrong_flavor:  'הבנתי... המשך',
  correct_label: 'תשובה נכונה:',

  xp_gained:    '+{xp} XP',
  hp_lost:      '-{hp} HP',
  perfect_bonus: '+30 XP (מושלם!)',
  streak_bonus:  '+{xp} XP (רצף!)',
  replay_penalty: '(50% XP - חזרה)',

  enc_cleared:       'משימה הושלמה!',
  enc_xp_earned:     '+{xp} XP הושג',
  enc_hp_remaining:  'HP שנותר: {hp}',
  stars_3: '3 כוכבים!',
  stars_2: '2 כוכבים',
  stars_1: 'כוכב אחד',

  zone_purified:     'שרת אובטח!',
  boss_defeated:     '{boss} הובס!',
  zone_clear_xp_total: 'סך XP שהושג',

  challenges_solved: 'אתגרים נפתרו',
  bonus_xp:          'XP בונוס',
  zone_total:        'סך Zone {zone}',

  game_over_title:   'Segmentation Fault',
  game_over_sub:     'Core dumped. Process terminated.',
  game_over_context: 'נפלת ב-"{zone}", עימות {enc}',

  btn_start:       '$ ./new_game.sh',
  btn_continue:    '$ ./continue.sh',
  btn_hall:        '$ cat hall_of_fame.txt',
  btn_back:        'cd ..',
  btn_back_to_map: 'cd /servers/',
  btn_retry:       '$ ./retry.sh',
  btn_world_map:   '$ cd /servers/',
  btn_hall_back:   '$ exit',
  btn_reveal_continue: 'המשך',
  btn_reveal_wrong:    'הבנתי... המשך',
  btn_submit:          'Execute',

  hint_free:      'Hint ({n} free)',
  hint_paid:      'Hint (-10 HP)',
  hint_none_left: 'No hints left',
  hint_used:      'Hint shown',

  hot_streak:  'רצף לוהט!',
  streak_sub:  '+10 XP על התשובה הנכונה הבאה',

  level_1:  'מתמחה',
  level_2:  'טכנאי',
  level_3:  'אדמין ג\'וניור',
  level_4:  'מנהל מערכת',
  level_5:  'מאסטר שורת פקודה',
  level_6:  'מומחה הרשאות',
  level_7:  'מהנדס DevOps',
  level_8:  'חוקר אבטחה',
  level_9:  'האקר קרנל',
  level_10: 'הסופריוזר',

  hall_empty: 'אין גיבורים עדיין. היה הראשון!',

  status_locked:    'נעול',
  status_available: 'זמין',
  status_complete:  'מאובטח',

  enc_locked_desc:  'השלם את העימות הקודם תחילה',
  enc_boss_desc:    'קרב בוס - {n} אתגרים',
  enc_normal_desc:  '{n} אתגרים',

  level_up:       'עליית רמה!',
  new_level:      'אתה כעת ברמה {level}: {title}!',
  zone_locked_msg: 'אבטח את Zone {prev} לביטול הנעילה.',
  enc_locked_msg:  'השלם עימותים קודמים תחילה.',
  boss_label:      'Boss:',
  zone_label:      'Zone',
  tagline:         'שלוט בטרמינל. הביס את תולעת השורש. השב את המערכת.',
  level_label:     'רמה',
  replay_xp_suffix: ' (50% חזרה)',
};

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
