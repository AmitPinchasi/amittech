/* ============================================================
   LINUXQUEST - GAME.JS
   State machine, main entry point, event wiring
   ============================================================ */

const ZONES = [
  window.ZONE_0, window.ZONE_1, window.ZONE_2, window.ZONE_3, window.ZONE_4,
  window.ZONE_5, window.ZONE_6, window.ZONE_7, window.ZONE_8, window.ZONE_9,
];

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
  pendingLevelUp: null,
  zoneJustCompleted: false,
};

let save = null;

function saveGame() {
  persistSave(save);
}

function navigateTo(screenId) {
  state.screen = screenId;
  showScreen(screenId);
}

function initMenu() {
  navigateTo('screen-menu');
  startCodeRain();
  const continueBtn = document.getElementById('btn-continue');
  if (hasSave()) {
    continueBtn.classList.remove('hidden');
  } else {
    continueBtn.classList.add('hidden');
  }
}

function goToWorldMap() {
  stopCodeRain();
  renderWorldMap(save, ZONES);
  navigateTo('screen-world-map');
}

function goToZoneSelect(zoneId) {
  state.zoneId = zoneId;
  renderZoneSelect(save, ZONES[zoneId]);
  updateHUD(save.player, zoneId);
  navigateTo('screen-zone-select');
}

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

  const existingStatus = getEncounterStatus(save, zoneId, encounterId);
  state.isReplay = existingStatus && existingStatus.stars > 0;

  if (encounterId === 0 || forceReset) {
    save.player.hp = MAX_HP;
    save.player.streak = 0;
  }
  saveGame();

  const zone = ZONES[zoneId];
  const encounter = zone.encounters[encounterId];
  state.encounterTotalChallenges = encounter.challenges.length;

  updateHUD(save.player, zoneId);

  const challengeScreen = document.getElementById('screen-challenge');
  challengeScreen.className = `screen hud-visible zone-${zoneId}`;

  const revealScreen = document.getElementById('screen-answer-reveal');
  revealScreen.className = `screen zone-${zoneId}`;

  showNextChallenge();
}

function showNextChallenge() {
  const zone = ZONES[state.zoneId];
  const encounter = zone.encounters[state.encounterId];
  const challenge = encounter.challenges[state.challengeIdx];

  document.getElementById('challenge-progress').textContent =
    `${state.challengeIdx + 1} / ${encounter.challenges.length}`;
  document.getElementById('challenge-encounter-name').textContent = encounter.name;

  state.hintUsed = false;

  renderChallenge(challenge, state.zoneId, {
    hintsLeft: state.hintsLeft,
    hintUsed: false,
  });

  navigateTo('screen-challenge');
  updateHUD(save.player, state.zoneId);
}

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

    xpGained = BASE_XP_CORRECT;

    save.player.streak = (save.player.streak || 0) + 1;
    if (save.player.streak >= STREAK_THRESHOLD) {
      streakBonus = STREAK_BONUS_XP;
      state.streakBonusApplied = true;
      showStreakBanner();
      playStreak();
    }

    state.encounterCorrectCount++;

    const rawGain = xpGained + streakBonus;
    const xpResult = applyXP(save.player, rawGain, state.isReplay);
    save.player.xp = xpResult.newXP;
    const displayXP = xpResult.effectiveGain;
    xpGained = state.isReplay ? Math.floor(BASE_XP_CORRECT * REPLAY_XP_MULTIPLIER) : BASE_XP_CORRECT;
    streakBonus = state.isReplay ? Math.floor(streakBonus * REPLAY_XP_MULTIPLIER) : streakBonus;

    state.encounterXP += displayXP;

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

  if (save.player.hp <= 0) {
    showGameOver();
    return;
  }

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

function onRevealContinue() {
  if (state.pendingLevelUp) {
    const { newLevel, newTitle } = state.pendingLevelUp;
    state.pendingLevelUp = null;
    playLevelUp();
    showModal(`
      <h2 style="font-family: var(--font-terminal); font-size: 14px; color: #00ff41; margin-bottom: 16px;">$ sudo promote --user agent47</h2>
      <p style="font-size: 22px; margin-bottom: 8px; font-family: var(--font-code);">רמה ${newLevel}</p>
      <p style="color: #00ff41; font-family: var(--font-terminal); font-size: 12px;">${newTitle}</p>
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
    completeEncounter();
  } else {
    showNextChallenge();
  }
}

function completeEncounter() {
  playEncounterClear();

  const stars = calculateStars(save.player.hp);

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

  const allDone = [0, 1, 2].every(i => {
    const s = getEncounterStatus(save, state.zoneId, i);
    return s && s.stars > 0;
  });

  document.getElementById('enc-xp-earned').textContent =
    '+' + totalXP + ' XP הושג' + (state.isReplay ? ' (50% חזרה)' : '');
  document.getElementById('enc-hp-remaining').textContent =
    'HP שנותר: ' + save.player.hp;

  animateStars(stars);
  navigateTo('screen-encounter-complete');

  state.zoneJustCompleted = allDone && getZoneStatus(save, state.zoneId) === 'complete';
}

function showZoneClear() {
  playZoneClear();

  const zone = ZONES[state.zoneId];

  document.getElementById('zone-clear-title').textContent = zone.name + ' - מאובטח!';
  document.getElementById('zone-clear-boss').textContent = zone.boss + ' הובס!';

  const breakdown = document.getElementById('zone-clear-xp');
  breakdown.innerHTML = `
    <div class="xp-line"><span>אתגרים נפתרו</span><span>${state.encounterCorrectCount * BASE_XP_CORRECT} XP</span></div>
    <div class="xp-line"><span>XP בונוס</span><span>${state.encounterXP} XP</span></div>
    <div class="xp-line total"><span>סך Zone ${state.zoneId}</span><span>${save.player.xp} XP</span></div>
  `;

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

function showGameOver() {
  playGameOver();
  const zone = ZONES[state.zoneId];
  document.getElementById('game-over-context').textContent =
    `נפלת ב-"${zone.name}", עימות ${state.encounterId + 1}`;
  navigateTo('screen-game-over');
}

function useHint() {
  if (state.hintUsed) return;

  const zone = ZONES[state.zoneId];
  const encounter = zone.encounters[state.encounterId];
  const challenge = encounter.challenges[state.challengeIdx];

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

  showHintForChallenge(challenge, challenge.hint || 'No hint available.');
  applyHintMechanic(challenge);
  updateHintButton({ hintsLeft: state.hintsLeft, hintUsed: true });
}

function wireEvents() {
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

  document.getElementById('btn-back-to-map').addEventListener('click', () => {
    playClick();
    goToWorldMap();
  });

  document.getElementById('btn-hint').addEventListener('click', () => {
    useHint();
  });

  document.getElementById('btn-reveal-continue').addEventListener('click', () => {
    playClick();
    onRevealContinue();
  });

  document.getElementById('btn-enc-continue').addEventListener('click', () => {
    playClick();
    if (state.zoneJustCompleted) {
      state.zoneJustCompleted = false;
      showZoneClear();
    } else {
      goToZoneSelect(state.zoneId);
    }
  });

  document.getElementById('btn-zone-map').addEventListener('click', () => {
    playClick();
    goToWorldMap();
  });

  document.getElementById('btn-retry').addEventListener('click', () => {
    playClick();
    startEncounter(state.zoneId, state.encounterId, true);
  });

  document.getElementById('btn-go-world-map').addEventListener('click', () => {
    playClick();
    goToWorldMap();
  });

}

function init() {
  save = loadSave();
  wireEvents();
  initMenu();
}

window.game = {
  goToZoneSelect,
  startEncounter,
  handleAnswer,
  goToWorldMap,
};

document.addEventListener('DOMContentLoaded', init);
