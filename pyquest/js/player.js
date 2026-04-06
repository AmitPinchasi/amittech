/* ============================================================
   PYQUEST - PLAYER.JS
   HP/XP/level logic
   ============================================================ */

const LEVEL_TABLE = [
  { level: 1,  title: 'מחפש תחביר',         xpRequired: 0    },
  { level: 2,  title: 'חוקר משתנים',         xpRequired: 100  },
  { level: 3,  title: 'חניך מאתר שגיאות',    xpRequired: 250  },
  { level: 4,  title: 'אביר הקוד',           xpRequired: 500  },
  { level: 5,  title: 'מפענח פונקציות',      xpRequired: 900  },
  { level: 6,  title: 'מפקד מחלקות',         xpRequired: 1400 },
  { level: 7,  title: 'אדון המודולים',        xpRequired: 2000 },
  { level: 8,  title: 'בקיא אלגוריתמים',     xpRequired: 2700 },
  { level: 9,  title: 'כותב קוד נקי',        xpRequired: 3500 },
  { level: 10, title: 'ארכון פייתון',         xpRequired: 4500 },
];

const MAX_HP = 100;
const BASE_XP_CORRECT = 25;
const PERFECT_BONUS_XP = 30;
const STREAK_BONUS_XP = 10;
const WRONG_HP_PENALTY = 20;
const HINT_HP_PENALTY = 10;
const REPLAY_XP_MULTIPLIER = 0.5;
const STREAK_THRESHOLD = 3;

/**
 * Get level info for a given XP total.
 * @param {number} xp
 * @returns {{ level: number, title: string, xpRequired: number, nextXP: number|null }}
 */
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

/**
 * Calculate XP progress as a percentage for the XP bar.
 * @param {number} xp
 * @returns {number} 0-100
 */
function getXPPercent(xp) {
  const info = getLevelInfo(xp);
  if (info.nextXP === null) return 100; // Max level
  const range = info.nextXP - info.xpRequired;
  const progress = xp - info.xpRequired;
  return Math.min(100, Math.round((progress / range) * 100));
}

/**
 * Apply XP to player, return new level info and whether level changed.
 * @param {Object} player - { hp, xp, level, streak }
 * @param {number} xpGain
 * @param {boolean} isReplay
 * @returns {{ newXP: number, oldLevel: number, newLevel: number, newTitle: string, leveledUp: boolean }}
 */
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

/**
 * Calculate stars earned for an encounter.
 * @param {number} hp - HP remaining after encounter
 * @returns {number} 1, 2, or 3
 */
function calculateStars(hp) {
  if (hp >= 80) return 3;
  if (hp >= 40) return 2;
  return 1;
}

/**
 * Calculate total XP for finishing an encounter.
 * @param {Object} params
 * @returns {{ base: number, perfectBonus: number, streakBonus: number, total: number }}
 */
function calculateEncounterXP(params) {
  const { correctCount, streakBonusApplied, isPerfect } = params;
  const base = correctCount * BASE_XP_CORRECT;
  const perfectBonus = isPerfect ? PERFECT_BONUS_XP : 0;
  const streakBonus = streakBonusApplied ? STREAK_BONUS_XP : 0;
  return {
    base,
    perfectBonus,
    streakBonus,
    total: base + perfectBonus + streakBonus,
  };
}

/**
 * Check if player has enough streak for bonus.
 * @param {number} streak
 * @returns {boolean}
 */
function hasStreak(streak) {
  return streak >= STREAK_THRESHOLD;
}

/**
 * Clamp HP between 0 and MAX_HP.
 * @param {number} hp
 * @returns {number}
 */
function clampHP(hp) {
  return Math.max(0, Math.min(MAX_HP, hp));
}

/**
 * Get HP bar percentage.
 * @param {number} hp
 * @returns {number} 0-100
 */
function getHPPercent(hp) {
  return Math.round((clampHP(hp) / MAX_HP) * 100);
}

/**
 * Get HP bar CSS class based on current HP.
 * @param {number} hp
 * @returns {string}
 */
function getHPClass(hp) {
  if (hp <= 20) return 'critical';
  if (hp <= 40) return 'danger';
  return '';
}
