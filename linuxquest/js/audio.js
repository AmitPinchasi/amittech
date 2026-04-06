/* ============================================================
   LINUXQUEST - AUDIO.JS
   Web Audio API sounds - terminal/hacker theme
   ============================================================ */

let audioCtx = null;

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

/* Correct: terminal beep sequence */
function playCorrect() {
  playTone(880, 0.06, 'square', 0.07, 0.00);
  playTone(1109, 0.06, 'square', 0.07, 0.07);
  playTone(1319, 0.14, 'square', 0.08, 0.14);
}

/* Wrong: descending error tone */
function playWrong() {
  playTone(300, 0.10, 'sawtooth', 0.07, 0.00);
  playTone(220, 0.12, 'sawtooth', 0.07, 0.10);
  playTone(160, 0.20, 'sawtooth', 0.05, 0.22);
}

/* Click: keyboard click */
function playClick() {
  playTone(1200, 0.03, 'square', 0.04, 0.00);
}

/* Level up: system ready jingle */
function playLevelUp() {
  const notes = [440, 554, 659, 880, 1109, 1319, 1760];
  notes.forEach((freq, i) => {
    playTone(freq, 0.12, 'square', 0.07, i * 0.07);
  });
}

/* Encounter clear: success beeps */
function playEncounterClear() {
  playTone(659, 0.08, 'square', 0.07, 0.00);
  playTone(880, 0.08, 'square', 0.07, 0.09);
  playTone(1109, 0.08, 'square', 0.07, 0.18);
  playTone(1319, 0.25, 'square', 0.09, 0.27);
}

/* Zone clear: access granted sequence */
function playZoneClear() {
  const melody = [440, 554, 659, 880, 659, 554, 880, 1109, 1319, 1760];
  melody.forEach((freq, i) => {
    playTone(freq, 0.15, 'square', 0.07, i * 0.09);
  });
}

/* Game over: system crash sound */
function playGameOver() {
  playTone(330, 0.18, 'sawtooth', 0.07, 0.00);
  playTone(277, 0.18, 'sawtooth', 0.07, 0.14);
  playTone(220, 0.18, 'sawtooth', 0.07, 0.28);
  playTone(165, 0.50, 'sawtooth', 0.09, 0.46);
}

/* Hint: soft ping */
function playHint() {
  playTone(554, 0.08, 'sine', 0.05, 0.00);
  playTone(659, 0.10, 'sine', 0.05, 0.07);
}

/* Streak: rapid fire beeps */
function playStreak() {
  const notes = [659, 880, 1109, 1319, 1760];
  notes.forEach((freq, i) => {
    playTone(freq, 0.08, 'square', 0.06, i * 0.05);
  });
}

/* Menu select: terminal navigation */
function playMenuSelect() {
  playTone(880, 0.06, 'square', 0.05, 0.00);
}
