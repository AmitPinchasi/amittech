/* ============================================================
   PYQUEST - AUDIO.JS
   Web Audio API sounds - no external files required
   ============================================================ */

let audioCtx = null;

/**
 * Get or create the AudioContext (must be created after user gesture).
 */
function getCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a simple tone.
 * @param {number} freq - Frequency in Hz
 * @param {number} duration - Duration in seconds
 * @param {string} type - Oscillator type
 * @param {number} gain - Volume 0-1
 * @param {number} [startDelay=0] - Delay before playing
 */
function playTone(freq, duration, type, gain, startDelay) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, ctx.currentTime + (startDelay || 0));
  gainNode.gain.setValueAtTime(gain || 0.1, ctx.currentTime + (startDelay || 0));
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (startDelay || 0) + duration);
  osc.start(ctx.currentTime + (startDelay || 0));
  osc.stop(ctx.currentTime + (startDelay || 0) + duration);
}

/**
 * Correct answer sound - ascending arpeggio.
 */
function playCorrect() {
  playTone(523, 0.12, 'square', 0.08, 0.00);
  playTone(659, 0.12, 'square', 0.08, 0.08);
  playTone(784, 0.20, 'square', 0.10, 0.16);
}

/**
 * Wrong answer sound - descending dissonant.
 */
function playWrong() {
  playTone(220, 0.15, 'sawtooth', 0.08, 0.00);
  playTone(196, 0.15, 'sawtooth', 0.08, 0.10);
  playTone(174, 0.25, 'sawtooth', 0.06, 0.20);
}

/**
 * Click / button press sound.
 */
function playClick() {
  playTone(880, 0.05, 'square', 0.05, 0.00);
}

/**
 * Level up fanfare.
 */
function playLevelUp() {
  const notes = [262, 330, 392, 523, 659, 784, 1046];
  notes.forEach((freq, i) => {
    playTone(freq, 0.15, 'square', 0.09, i * 0.08);
  });
}

/**
 * Encounter clear jingle.
 */
function playEncounterClear() {
  playTone(523, 0.10, 'square', 0.08, 0.00);
  playTone(659, 0.10, 'square', 0.08, 0.10);
  playTone(784, 0.10, 'square', 0.08, 0.20);
  playTone(1047, 0.30, 'square', 0.10, 0.30);
}

/**
 * Zone clear / boss defeat sound.
 */
function playZoneClear() {
  const melody = [262, 330, 392, 523, 392, 330, 523, 659, 784, 1047];
  melody.forEach((freq, i) => {
    playTone(freq, 0.18, 'square', 0.08, i * 0.1);
  });
}

/**
 * Game over sound.
 */
function playGameOver() {
  playTone(440, 0.20, 'sawtooth', 0.08, 0.00);
  playTone(392, 0.20, 'sawtooth', 0.08, 0.15);
  playTone(349, 0.20, 'sawtooth', 0.08, 0.30);
  playTone(262, 0.60, 'sawtooth', 0.10, 0.50);
}

/**
 * Hint used sound.
 */
function playHint() {
  playTone(440, 0.08, 'sine', 0.06, 0.00);
  playTone(550, 0.10, 'sine', 0.06, 0.06);
}

/**
 * Streak achieved sound.
 */
function playStreak() {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    playTone(freq, 0.10, 'square', 0.07, i * 0.06);
  });
}

/**
 * Menu navigation sound.
 */
function playMenuSelect() {
  playTone(660, 0.08, 'square', 0.06, 0.00);
}
