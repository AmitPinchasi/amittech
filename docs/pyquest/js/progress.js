/* ============================================================
   PYQUEST - PROGRESS.JS
   localStorage save/load, zone unlock logic
   ============================================================ */

const SAVE_KEY = 'pyquest_save';

const DEFAULT_SAVE = {
  player: {
    hp: 100,
    xp: 0,
    level: 1,
    streak: 0,
    hintsUsedThisEncounter: 0,
  },
  zones: {
    '0': { status: 'in_progress', encounters: {} },
    '1': { status: 'locked', encounters: {} },
    '2': { status: 'locked', encounters: {} },
    '3': { status: 'locked', encounters: {} },
    '4': { status: 'locked', encounters: {} },
    '5': { status: 'locked', encounters: {} },
    '6': { status: 'locked', encounters: {} },
    '7': { status: 'locked', encounters: {} },
    '8': { status: 'locked', encounters: {} },
    '9': { status: 'locked', encounters: {} },
  },
  highScores: [],
};

/**
 * Deep clone an object (simple JSON-safe version).
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Load save from localStorage. Returns default if none found.
 * @returns {Object}
 */
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return deepClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle missing keys from older saves
    const save = deepClone(DEFAULT_SAVE);
    if (parsed.player) Object.assign(save.player, parsed.player);
    if (parsed.zones) {
      for (const [k, v] of Object.entries(parsed.zones)) {
        save.zones[k] = v;
      }
    }
    if (parsed.highScores) save.highScores = parsed.highScores;
    return save;
  } catch (e) {
    console.warn('[progress] Failed to load save:', e);
    return deepClone(DEFAULT_SAVE);
  }
}

/**
 * Persist save to localStorage.
 * @param {Object} save
 */
function persistSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) {
    console.warn('[progress] Failed to save:', e);
  }
}

/**
 * Check if a save exists (for "Continue" button).
 * @returns {boolean}
 */
function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

/**
 * Wipe all save data.
 */
function wipeSave() {
  localStorage.removeItem(SAVE_KEY);
}

/**
 * Check if a zone is unlocked.
 * Zone 0 is always unlocked.
 * Zone N is unlocked when all 3 encounters of Zone N-1 are complete.
 * @param {Object} save
 * @param {number} zoneId
 * @returns {boolean}
 */
function isZoneUnlocked(save, zoneId) {
  if (zoneId === 0) return true;
  const prevZone = save.zones[String(zoneId - 1)];
  if (!prevZone) return false;
  if (prevZone.status === 'complete') return true;
  // Also check if all 3 encounters of prev zone are done
  const encs = prevZone.encounters || {};
  return (
    encs['0'] && encs['1'] && encs['2'] &&
    encs['0'].stars > 0 && encs['1'].stars > 0 && encs['2'].stars > 0
  );
}

/**
 * Check if an encounter is unlocked.
 * Encounter 0 is always available if zone is unlocked.
 * Encounter N requires encounter N-1 to be complete.
 * @param {Object} save
 * @param {number} zoneId
 * @param {number} encounterId
 * @returns {boolean}
 */
function isEncounterUnlocked(save, zoneId, encounterId) {
  if (!isZoneUnlocked(save, zoneId)) return false;
  if (encounterId === 0) return true;
  const zoneData = save.zones[String(zoneId)];
  if (!zoneData) return false;
  const prev = zoneData.encounters[String(encounterId - 1)];
  return prev && prev.stars > 0;
}

/**
 * Get encounter completion status.
 * @param {Object} save
 * @param {number} zoneId
 * @param {number} encounterId
 * @returns {{stars: number}|null}
 */
function getEncounterStatus(save, zoneId, encounterId) {
  const zone = save.zones[String(zoneId)];
  if (!zone) return null;
  return zone.encounters[String(encounterId)] || null;
}

/**
 * Mark an encounter complete with stars.
 * Also checks and updates zone completion.
 * @param {Object} save
 * @param {number} zoneId
 * @param {number} encounterId
 * @param {number} stars - 1, 2, or 3
 */
function markEncounterComplete(save, zoneId, encounterId, stars) {
  const key = String(zoneId);
  if (!save.zones[key]) save.zones[key] = { status: 'in_progress', encounters: {} };
  const existing = save.zones[key].encounters[String(encounterId)];
  // Only update if new stars are higher (allow replaying for better score)
  if (!existing || stars > existing.stars) {
    save.zones[key].encounters[String(encounterId)] = { stars };
  }
  // Check if zone is now complete (all 3 encounters done)
  const encs = save.zones[key].encounters;
  if (encs['0'] && encs['1'] && encs['2'] &&
      encs['0'].stars > 0 && encs['1'].stars > 0 && encs['2'].stars > 0) {
    save.zones[key].status = 'complete';
    // Unlock next zone
    const nextKey = String(zoneId + 1);
    if (save.zones[nextKey] && save.zones[nextKey].status === 'locked') {
      save.zones[nextKey].status = 'in_progress';
    }
  }
}

/**
 * Get all encounter stars for a zone (for world map display).
 * @param {Object} save
 * @param {number} zoneId
 * @returns {number[]} Array of 3 star values (0 if not done)
 */
function getZoneStars(save, zoneId) {
  const zone = save.zones[String(zoneId)];
  if (!zone) return [0, 0, 0];
  return [0, 1, 2].map(i => {
    const enc = zone.encounters[String(i)];
    return enc ? enc.stars : 0;
  });
}

/**
 * Add a high score entry, keeping only top 5.
 * @param {Object} save
 * @param {string} name
 * @param {number} xp
 * @param {number} level
 */
function addHighScore(save, name, xp, level) {
  const entry = { name, xp, level, date: new Date().toLocaleDateString() };
  save.highScores.push(entry);
  save.highScores.sort((a, b) => b.xp - a.xp);
  save.highScores = save.highScores.slice(0, 5);
}

/**
 * Get zone overall status: 'locked', 'in_progress', 'complete'
 */
function getZoneStatus(save, zoneId) {
  if (!isZoneUnlocked(save, zoneId)) return 'locked';
  const zone = save.zones[String(zoneId)];
  if (!zone) return 'locked';
  return zone.status || 'in_progress';
}
