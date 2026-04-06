/* ============================================================
   PYQUEST - GAME.JS
   State machine, main entry point, event wiring
   ============================================================ */

// ============================================================
// ZONE DATA REGISTRY
// ============================================================

const ZONES = [
  window.ZONE_0, window.ZONE_1, window.ZONE_2, window.ZONE_3, window.ZONE_4,
  window.ZONE_5, window.ZONE_6, window.ZONE_7, window.ZONE_8, window.ZONE_9,
];

// ============================================================
// GAME STATE
// ============================================================

const state = {
  screen: 'menu',
  zoneId: 0,
  encounterId: 0,
  challengeIdx: 0,
  hintsLeft: 2,
  hintUsed: false,
  encounterXP: 0,
  encounterCorrectCount: 0,
  encounterTotalChallenges: 0,
  allCorrectSoFar: true,
  streakBonusApplied: false,
  isReplay: false,
  pendingLevelUp: null,  // { newLevel, newTitle } if leveled up
};

let save = null;

// ============================================================
// SAVE HELPERS
// ============================================================

function saveGame() {
  persistSave(save);
}

// ============================================================
// NAVIGATION
// ============================================================

/**
 * Navigate to a screen and perform associated setup.
 * @param {string} screenId
 */
function navigateTo(screenId) {
  state.screen = screenId;
  showScreen(screenId);
}

// ============================================================
// MENU SCREEN
// ============================================================

function initMenu() {
  navigateTo('screen-menu');
  startCodeRain();

  // Show/hide Continue button
  const continueBtn = document.getElementById('btn-continue');
  if (hasSave()) {
    continueBtn.classList.remove('hidden');
  } else {
    continueBtn.classList.add('hidden');
  }
}

// ============================================================
// WORLD MAP
// ============================================================

function goToWorldMap() {
  stopCodeRain();
  renderWorldMap(save, ZONES);
  navigateTo('screen-world-map');
}

// ============================================================
// ZONE SELECT
// ============================================================

function goToZoneSelect(zoneId) {
  state.zoneId = zoneId;
  renderZoneSelect(save, ZONES[zoneId]);
  updateHUD(save.player, zoneId);
  navigateTo('screen-zone-select');
}

// ============================================================
// ENCOUNTER
// ============================================================

/**
 * Start an encounter from the beginning.
 * @param {number} zoneId
 * @param {number} encounterId
 */
function startEncounter(zoneId, encounterId, forceReset) {
  state.zoneId = zoneId;
  state.encounterId = encounterId;
  state.challengeIdx = 0;
  state.hintsLeft = 2;
  state.hintUsed = false;
  state.encounterXP = 0;
  state.encounterCorrectCount = 0;
  state.allCorrectSoFar = true;
  state.streakBonusApplied = false;

  // Check if this is a replay
  const existingStatus = getEncounterStatus(save, zoneId, encounterId);
  state.isReplay = existingStatus && existingStatus.stars > 0;

  // Reset HP only at the start of a zone (first encounter) or on forced retry after game-over.
  // HP persists across encounters within the same zone.
  if (encounterId === 0 || forceReset) {
    save.player.hp = MAX_HP;
    save.player.streak = 0;
  }
  saveGame();

  const zone = ZONES[zoneId];
  const encounter = zone.encounters[encounterId];
  state.encounterTotalChallenges = encounter.challenges.length;

  updateHUD(save.player, zoneId);

  // Apply zone class to challenge screen
  const challengeScreen = document.getElementById('screen-challenge');
  challengeScreen.className = `screen hud-visible zone-${zoneId}`;

  // Apply zone class to reveal screen
  const revealScreen = document.getElementById('screen-answer-reveal');
  revealScreen.className = `screen zone-${zoneId}`;

  showNextChallenge();
}

/**
 * Show the next challenge in the current encounter.
 */
function showNextChallenge() {
  const zone = ZONES[state.zoneId];
  const encounter = zone.encounters[state.encounterId];
  const challenge = encounter.challenges[state.challengeIdx];

  // Update progress label
  document.getElementById('challenge-progress').textContent =
    `${state.challengeIdx + 1} / ${encounter.challenges.length}`;
  document.getElementById('challenge-encounter-name').textContent = encounter.name;

  // Reset hint state for this challenge
  state.hintUsed = false;

  // Render challenge
  renderChallenge(challenge, state.zoneId, {
    hintsLeft: state.hintsLeft,
    hintUsed: false,
  });

  navigateTo('screen-challenge');
  updateHUD(save.player, state.zoneId);
}

// ============================================================
// ANSWER HANDLING
// ============================================================

/**
 * Called by questions.js when player submits an answer.
 * @param {boolean} correct
 * @param {*} userAnswer - The raw answer (for display)
 */
function handleAnswer(correct, userAnswer) {
  const zone = ZONES[state.zoneId];
  const encounter = zone.encounters[state.encounterId];
  const challenge = encounter.challenges[state.challengeIdx];

  let xpGained = 0;
  let hpLost = 0;
  let streakBonus = 0;

  if (correct) {
    playCorrect();
    flashScreen(true);

    // Base XP
    xpGained = BASE_XP_CORRECT;

    // Streak bonus
    save.player.streak = (save.player.streak || 0) + 1;
    if (save.player.streak >= STREAK_THRESHOLD) {
      streakBonus = STREAK_BONUS_XP;
      state.streakBonusApplied = true;
      showStreakBanner();
      playStreak();
    }

    state.encounterCorrectCount++;

    // Apply XP (with replay modifier)
    const rawGain = xpGained + streakBonus; // xpGained=25, streakBonus=10 if streak
    const xpResult = applyXP(save.player, rawGain, state.isReplay);
    save.player.xp = xpResult.newXP;
    // effectiveGain is the actual amount added (may be halved for replay)
    const displayXP = xpResult.effectiveGain;
    xpGained = state.isReplay ? Math.floor(BASE_XP_CORRECT * REPLAY_XP_MULTIPLIER) : BASE_XP_CORRECT;
    streakBonus = state.isReplay ? Math.floor(streakBonus * REPLAY_XP_MULTIPLIER) : streakBonus;

    state.encounterXP += displayXP;

    // Check level up
    if (xpResult.leveledUp) {
      save.player.level = xpResult.newLevel;
      state.pendingLevelUp = {
        newLevel: xpResult.newLevel,
        newTitle: xpResult.newTitle,
      };
    }

    showXPFloat(displayXP);

  } else {
    playWrong();
    flashScreen(false);

    hpLost = WRONG_HP_PENALTY;
    save.player.hp = clampHP(save.player.hp - hpLost);
    save.player.streak = 0;
    state.allCorrectSoFar = false;

    shakeHPBar();
    hideStreakBanner();
  }

  updateHUD(save.player, state.zoneId);
  saveGame();

  // Check if game over
  if (save.player.hp <= 0) {
    showGameOver();
    return;
  }

  // Show reveal screen
  renderReveal({
    correct,
    challenge,
    xpGained,
    hpLost,
    isStreak: save.player.streak >= STREAK_THRESHOLD,
    streakBonus,
    isPerfect: state.allCorrectSoFar && state.challengeIdx === encounter.challenges.length - 1,
  });

  navigateTo('screen-answer-reveal');
}

// ============================================================
// REVEAL CONTINUE
// ============================================================

/**
 * Called when player clicks Continue on reveal screen.
 */
function onRevealContinue() {
  // Handle level-up modal
  if (state.pendingLevelUp) {
    const { newLevel, newTitle } = state.pendingLevelUp;
    state.pendingLevelUp = null;
    playLevelUp();
    showModal(`
      <h2 style="font-family: var(--font-pixel); font-size: 16px; color: #a855f7; margin-bottom: 16px;">עליית רמה!</h2>
      <p style="font-size: 24px; margin-bottom: 8px;">רמה ${newLevel}</p>
      <p style="color: #eab308; font-family: var(--font-pixel); font-size: 12px;">${newTitle}</p>
    `, advanceFromReveal);
    return;
  }
  advanceFromReveal();
}

function advanceFromReveal() {
  const zone = ZONES[state.zoneId];
  const encounter = zone.encounters[state.encounterId];

  state.challengeIdx++;

  if (state.challengeIdx >= encounter.challenges.length) {
    // Encounter complete
    completeEncounter();
  } else {
    showNextChallenge();
  }
}

// ============================================================
// ENCOUNTER COMPLETE
// ============================================================

function completeEncounter() {
  playEncounterClear();

  const stars = calculateStars(save.player.hp);

  // Add perfect bonus
  let totalXP = state.encounterXP;
  if (state.allCorrectSoFar) {
    const perfectBonus = state.isReplay
      ? Math.floor(PERFECT_BONUS_XP * REPLAY_XP_MULTIPLIER)
      : PERFECT_BONUS_XP;
    totalXP += perfectBonus;
    const xpResult = applyXP(save.player, perfectBonus, false);
    save.player.xp = xpResult.newXP;
    if (xpResult.leveledUp) {
      save.player.level = xpResult.newLevel;
      state.pendingLevelUp = {
        newLevel: xpResult.newLevel,
        newTitle: xpResult.newTitle,
      };
    }
  }

  markEncounterComplete(save, state.zoneId, state.encounterId, stars);
  saveGame();

  // Check if all encounters in zone are done
  const allDone = [0, 1, 2].every(i => {
    const s = getEncounterStatus(save, state.zoneId, i);
    return s && s.stars > 0;
  });

  // Update encounter complete screen
  document.getElementById('enc-xp-earned').textContent =
    '+' + totalXP + ' XP הושג' + (state.isReplay ? ' (50% חזרה)' : '');
  document.getElementById('enc-hp-remaining').textContent =
    'HP שנותר: ' + save.player.hp;

  animateStars(stars);
  navigateTo('screen-encounter-complete');

  // Store whether zone is now complete
  state.zoneJustCompleted = allDone && getZoneStatus(save, state.zoneId) === 'complete';
}

// ============================================================
// ZONE CLEAR
// ============================================================

function showZoneClear() {
  playZoneClear();

  const zone = ZONES[state.zoneId];

  document.getElementById('zone-clear-title').textContent = zone.name + ' - טוהר!';
  document.getElementById('zone-clear-boss').textContent =
    zone.boss + ' הובס!';

  // XP breakdown
  const breakdown = document.getElementById('zone-clear-xp');
  const totalZoneXP = [0, 1, 2].reduce((sum, i) => {
    const enc = zone.encounters[i];
    return sum + enc.challenges.length * BASE_XP_CORRECT;
  }, 0);

  breakdown.innerHTML = `
    <div class="xp-line"><span>אתגרים נפתרו</span><span>${state.encounterCorrectCount * BASE_XP_CORRECT} XP</span></div>
    <div class="xp-line"><span>XP בונוס</span><span>${state.encounterXP} XP</span></div>
    <div class="xp-line total"><span>סך אזור ${state.zoneId}</span><span>${save.player.xp} XP</span></div>
  `;

  // Level up banner
  const levelUpBanner = document.getElementById('level-up-banner');
  if (state.pendingLevelUp) {
    levelUpBanner.classList.remove('hidden');
    document.getElementById('level-up-text').textContent =
      `עליית רמה! כעת: ${state.pendingLevelUp.newTitle}`;
    state.pendingLevelUp = null;
    playLevelUp();
  } else {
    levelUpBanner.classList.add('hidden');
  }

  navigateTo('screen-zone-clear');
}

// ============================================================
// GAME OVER
// ============================================================

function showGameOver() {
  playGameOver();
  const zone = ZONES[state.zoneId];
  document.getElementById('game-over-context').textContent =
    `נפלת ב-"${zone.name}", עימות ${state.encounterId + 1}`;
  navigateTo('screen-game-over');
}

// ============================================================
// HINT SYSTEM
// ============================================================

function useHint() {
  if (state.hintUsed) return;

  const zone = ZONES[state.zoneId];
  const encounter = zone.encounters[state.encounterId];
  const challenge = encounter.challenges[state.challengeIdx];

  // Deduct HP if no free hints
  if (state.hintsLeft <= 0) {
    save.player.hp = clampHP(save.player.hp - HINT_HP_PENALTY);
    shakeHPBar();
    updateHUD(save.player, state.zoneId);
    saveGame();

    if (save.player.hp <= 0) {
      showGameOver();
      return;
    }
  } else {
    state.hintsLeft--;
  }

  state.hintUsed = true;
  playHint();

  // Show hint text
  showHintForChallenge(challenge, challenge.hint || 'No hint available.');

  // Apply type-specific mechanic
  applyHintMechanic(challenge);

  // Update hint button
  updateHintButton({ hintsLeft: state.hintsLeft, hintUsed: true });
}

// ============================================================
// EVENT WIRING
// ============================================================

function wireEvents() {
  // --- Menu ---
  document.getElementById('btn-new-game').addEventListener('click', () => {
    playClick();
    wipeSave();
    save = loadSave();
    goToWorldMap();
  });

  document.getElementById('btn-continue').addEventListener('click', () => {
    playClick();
    save = loadSave();
    goToWorldMap();
  });

  // --- World Map ---
  // (Zone node clicks are handled inside renderWorldMap)

  // --- Zone Select ---
  document.getElementById('btn-back-to-map').addEventListener('click', () => {
    playClick();
    goToWorldMap();
  });

  // --- Challenge ---
  document.getElementById('btn-hint').addEventListener('click', () => {
    useHint();
  });

  // --- Answer Reveal ---
  document.getElementById('btn-reveal-continue').addEventListener('click', () => {
    playClick();
    onRevealContinue();
  });

  // --- Encounter Complete ---
  document.getElementById('btn-enc-continue').addEventListener('click', () => {
    playClick();
    if (state.zoneJustCompleted) {
      state.zoneJustCompleted = false;
      showZoneClear();
    } else {
      goToZoneSelect(state.zoneId);
    }
  });

  // --- Zone Clear ---
  document.getElementById('btn-zone-map').addEventListener('click', () => {
    playClick();
    goToWorldMap();
  });

  // --- Game Over ---
  document.getElementById('btn-retry').addEventListener('click', () => {
    playClick();
    startEncounter(state.zoneId, state.encounterId, true); // forceReset=true on game-over retry
  });

  document.getElementById('btn-go-world-map').addEventListener('click', () => {
    playClick();
    goToWorldMap();
  });

}

// ============================================================
// INIT
// ============================================================

/**
 * Main entry point. Called on DOMContentLoaded.
 */
function init() {
  save = loadSave();
  wireEvents();
  initMenu();
}

// Expose game API for UI callbacks
window.game = {
  goToZoneSelect,
  startEncounter,
  handleAnswer,
  goToWorldMap,
};

document.addEventListener('DOMContentLoaded', init);
