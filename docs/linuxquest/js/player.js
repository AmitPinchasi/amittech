/* ============================================================
   LINUXQUEST - PLAYER.JS
   HP/XP/level logic - Sysadmin rank progression
   ============================================================ */

const LEVEL_TABLE = [
  { level: 1,  title: 'מתמחה',               xpRequired: 0    },
  { level: 2,  title: 'טכנאי',               xpRequired: 100  },
  { level: 3,  title: 'אדמין ג\'וניור',      xpRequired: 250  },
  { level: 4,  title: 'מנהל מערכת',          xpRequired: 500  },
  { level: 5,  title: 'מאסטר שורת פקודה',   xpRequired: 900  },
  { level: 6,  title: 'מומחה הרשאות',        xpRequired: 1400 },
  { level: 7,  title: 'מהנדס DevOps',        xpRequired: 2000 },
  { level: 8,  title: 'חוקר אבטחה',          xpRequired: 2700 },
  { level: 9,  title: 'האקר קרנל',           xpRequired: 3500 },
  { level: 10, title: 'הסופריוזר',           xpRequired: 4500 },
];

const MAX_HP = 100;
const BASE_XP_CORRECT = 25;
const PERFECT_BONUS_XP = 30;
const STREAK_BONUS_XP = 10;
const WRONG_HP_PENALTY = 20;
const HINT_HP_PENALTY = 10;
const REPLAY_XP_MULTIPLIER = 0.5;
const STREAK_THRESHOLD = 3;

function getLevelInfo(xp) {
  let current = LEVEL_TABLE[0];
  for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_TABLE[i].xpRequired) {
      current = LEVEL_TABLE[i];
      break;
    }
  }
  const nextEntry = LEVEL_TABLE.find(l => l.level === current.level + 1);
  return {
    level: current.level,
    title: current.title,
    xpRequired: current.xpRequired,
    nextXP: nextEntry ? nextEntry.xpRequired : null,
  };
}

function getXPPercent(xp) {
  const info = getLevelInfo(xp);
  if (info.nextXP === null) return 100;
  const range = info.nextXP - info.xpRequired;
  const progress = xp - info.xpRequired;
  return Math.min(100, Math.round((progress / range) * 100));
}

function applyXP(player, xpGain, isReplay) {
  const effectiveGain = isReplay ? Math.floor(xpGain * REPLAY_XP_MULTIPLIER) : xpGain;
  const oldLevel = getLevelInfo(player.xp).level;
  const newXP = player.xp + effectiveGain;
  const newInfo = getLevelInfo(newXP);
  return {
    newXP,
    effectiveGain,
    oldLevel,
    newLevel: newInfo.level,
    newTitle: newInfo.title,
    leveledUp: newInfo.level > oldLevel,
  };
}

function calculateStars(hp) {
  if (hp >= 80) return 3;
  if (hp >= 40) return 2;
  return 1;
}

function calculateEncounterXP(params) {
  const { correctCount, streakBonusApplied, isPerfect } = params;
  const base = correctCount * BASE_XP_CORRECT;
  const perfectBonus = isPerfect ? PERFECT_BONUS_XP : 0;
  const streakBonus = streakBonusApplied ? STREAK_BONUS_XP : 0;
  return { base, perfectBonus, streakBonus, total: base + perfectBonus + streakBonus };
}

function hasStreak(streak) {
  return streak >= STREAK_THRESHOLD;
}

function clampHP(hp) {
  return Math.max(0, Math.min(MAX_HP, hp));
}

function getHPPercent(hp) {
  return Math.round((clampHP(hp) / MAX_HP) * 100);
}

function getHPClass(hp) {
  if (hp <= 20) return 'critical';
  if (hp <= 40) return 'danger';
  return '';
}
