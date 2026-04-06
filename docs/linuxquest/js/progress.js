/* ============================================================
   LINUXQUEST - PROGRESS.JS
   localStorage save/load, zone unlock logic
   ============================================================ */

const SAVE_KEY = 'linuxquest_save';

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
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return deepClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw);
    const save = deepClone(DEFAULT_SAVE);
    if (parsed.player) Object.assign(save.player, parsed.player);
    if (parsed.zones) {
      for (const [k, v] of Object.entries(parsed.zones)) {
        save.zones[k] = v;
      }
    }
    return save;
  } catch (e) {
    console.warn('[progress] Failed to load save:', e);
    return deepClone(DEFAULT_SAVE);
  }
}

function persistSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) {
    console.warn('[progress] Failed to save:', e);
  }
}

function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

function wipeSave() {
  localStorage.removeItem(SAVE_KEY);
}

function isZoneUnlocked(save, zoneId) {
  if (zoneId === 0) return true;
  const prevZone = save.zones[String(zoneId - 1)];
  if (!prevZone) return false;
  if (prevZone.status === 'complete') return true;
  const encs = prevZone.encounters || {};
  return (
    encs['0'] && encs['1'] && encs['2'] &&
    encs['0'].stars > 0 && encs['1'].stars > 0 && encs['2'].stars > 0
  );
}

function isEncounterUnlocked(save, zoneId, encounterId) {
  if (!isZoneUnlocked(save, zoneId)) return false;
  if (encounterId === 0) return true;
  const zoneData = save.zones[String(zoneId)];
  if (!zoneData) return false;
  const prev = zoneData.encounters[String(encounterId - 1)];
  return prev && prev.stars > 0;
}

function getEncounterStatus(save, zoneId, encounterId) {
  const zone = save.zones[String(zoneId)];
  if (!zone) return null;
  return zone.encounters[String(encounterId)] || null;
}

function markEncounterComplete(save, zoneId, encounterId, stars) {
  const key = String(zoneId);
  if (!save.zones[key]) save.zones[key] = { status: 'in_progress', encounters: {} };
  const existing = save.zones[key].encounters[String(encounterId)];
  if (!existing || stars > existing.stars) {
    save.zones[key].encounters[String(encounterId)] = { stars };
  }
  const encs = save.zones[key].encounters;
  if (encs['0'] && encs['1'] && encs['2'] &&
      encs['0'].stars > 0 && encs['1'].stars > 0 && encs['2'].stars > 0) {
    save.zones[key].status = 'complete';
    const nextKey = String(zoneId + 1);
    if (save.zones[nextKey] && save.zones[nextKey].status === 'locked') {
      save.zones[nextKey].status = 'in_progress';
    }
  }
}

function getZoneStars(save, zoneId) {
  const zone = save.zones[String(zoneId)];
  if (!zone) return [0, 0, 0];
  return [0, 1, 2].map(i => {
    const enc = zone.encounters[String(i)];
    return enc ? enc.stars : 0;
  });
}

function getZoneStatus(save, zoneId) {
  if (!isZoneUnlocked(save, zoneId)) return 'locked';
  const zone = save.zones[String(zoneId)];
  if (!zone) return 'locked';
  return zone.status || 'in_progress';
}
