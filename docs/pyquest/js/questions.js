/* ============================================================
   PYQUEST - QUESTIONS.JS
   Render and evaluate all 4 challenge types
   ============================================================ */

// ============================================================
// TYPE LABEL MAPPING
// ============================================================

const TYPE_LABELS = {
  output_oracle:    'נביא הפלט',
  spell_completion: 'השלמת לחש',
  corruption_scan:  'סריקת שחיתות',
  name_binding:     'כריכת שמות',
};

const TYPE_INSTRUCTIONS = {
  output_oracle:    'מה יוציא הקוד הזה?',
  spell_completion: 'השלם את הרווחים להשלמת הלחש.',
  corruption_scan:  'מצא את השחיתות - מה לא בסדר בקוד?',
  name_binding:     'קשר כל מונח להגדרתו. לחץ על מונח, ואחר כך על ההתאמה שלו.',
};

// ============================================================
// RENDER DISPATCH
// ============================================================

/**
 * Render a challenge into #challenge-content.
 * @param {Object} challenge - Challenge data object
 * @param {number} zoneId - Current zone ID (for styling)
 * @param {Object} hintState - { hintsLeft: number, hintUsed: boolean }
 */
function renderChallenge(challenge, zoneId, hintState) {
  const content = document.getElementById('challenge-content');
  const badge = document.getElementById('challenge-type-badge');
  const narrative = document.getElementById('challenge-narrative');

  badge.textContent = TYPE_LABELS[challenge.type] || challenge.type;
  badge.className = `challenge-type-badge badge-${challenge.type}`;

  // Set instruction as narrative if no custom narrative
  narrative.textContent = challenge.narrative || TYPE_INSTRUCTIONS[challenge.type];

  // Update hint button
  updateHintButton(hintState);

  // Clear hint box
  const hintBox = document.getElementById('hint-box');
  hintBox.classList.add('hidden');
  document.getElementById('hint-text').textContent = '';

  // Render type-specific content
  switch (challenge.type) {
    case 'output_oracle':
      content.innerHTML = renderOutputOracle(challenge, zoneId);
      attachOutputOracleListeners(challenge);
      break;
    case 'spell_completion':
      content.innerHTML = renderSpellCompletion(challenge, zoneId);
      attachSpellCompletionListeners(challenge);
      break;
    case 'corruption_scan':
      content.innerHTML = renderCorruptionScan(challenge, zoneId);
      attachCorruptionScanListeners(challenge);
      break;
    case 'name_binding':
      content.innerHTML = renderNameBinding(challenge, zoneId);
      attachNameBindingListeners(challenge);
      break;
    default:
      content.innerHTML = '<p>Unknown challenge type.</p>';
  }

  fadeIn(content);
}

/**
 * Update the hint button based on hints remaining.
 */
function updateHintButton(hintState) {
  const btn = document.getElementById('btn-hint');
  const label = document.getElementById('hint-label');
  if (hintState.hintsLeft > 0) {
    btn.className = 'btn btn-hint';
    label.textContent = `רמז (${hintState.hintsLeft} חינם)`;
    btn.disabled = false;
  } else {
    btn.className = 'btn btn-hint';
    label.textContent = 'רמז (-10 HP)';
    btn.disabled = false;
  }
  if (hintState.hintUsed) {
    label.textContent = 'ראה רמז';
    btn.disabled = true;
  }
}

// ============================================================
// OUTPUT ORACLE
// ============================================================

function renderOutputOracle(challenge, zoneId) {
  const codeHtml = renderCodeBlock(challenge.code);

  // Shuffle options so the correct answer isn't always in the same position
  const shuffled = challenge.options
    .map((text, origIdx) => ({ text, origIdx }))
    .sort(() => Math.random() - 0.5);

  const optionsHtml = shuffled.map((item, i) => {
    const letter = String.fromCharCode(65 + i); // A, B, C, D
    return `
      <button class="option-btn" data-orig-index="${item.origIdx}" id="opt-${i}">
        <span class="option-label">${letter}</span>
        <span class="option-text">${escapeHtml(item.text)}</span>
      </button>
    `;
  }).join('');

  return `
    ${codeHtml}
    <div class="options-grid">
      ${optionsHtml}
    </div>
  `;
}

function attachOutputOracleListeners(challenge) {
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;
      const origIdx = parseInt(btn.dataset.origIndex);
      document.querySelectorAll('.option-btn').forEach(b => b.classList.add('disabled'));
      btn.classList.add('selected');
      const correct = origIdx === challenge.correct;
      window.game.handleAnswer(correct, origIdx);
    });
  });
}

// ============================================================
// SPELL COMPLETION
// ============================================================

function renderSpellCompletion(challenge, zoneId) {
  // Split template by ___ and build code with inputs
  const parts = challenge.codeTemplate.split('___');
  let codeInner = '';
  parts.forEach((part, i) => {
    codeInner += highlightPython(part);
    if (i < parts.length - 1) {
      codeInner += `<input
        type="text"
        class="code-blank-input"
        id="blank-${i}"
        data-index="${i}"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="???"
        dir="ltr"
      >`;
    }
  });

  return `
    <div class="code-block-wrapper">
      <div class="code-block-header">
        <div class="code-block-dots">
          <div class="code-dot code-dot-red"></div>
          <div class="code-dot code-dot-yellow"></div>
          <div class="code-dot code-dot-green"></div>
        </div>
        <span class="code-block-label">python</span>
      </div>
      <pre class="code-block" dir="ltr">${codeInner}</pre>
    </div>
    <div class="spell-submit-area">
      <button class="btn btn-primary" id="btn-spell-submit">שלח תשובה</button>
    </div>
  `;
}

function attachSpellCompletionListeners(challenge) {
  // Focus first input
  const firstInput = document.getElementById('blank-0');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 100);
  }

  // Enter key on inputs
  document.querySelectorAll('.code-blank-input').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') submitSpellCompletion(challenge);
    });
  });

  // Submit button
  const submitBtn = document.getElementById('btn-spell-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => submitSpellCompletion(challenge));
  }
}

function submitSpellCompletion(challenge) {
  const submitBtn = document.getElementById('btn-spell-submit');
  if (submitBtn) submitBtn.disabled = true;

  // Collect all blank values
  const userAnswers = [];
  let idx = 0;
  while (true) {
    const input = document.getElementById('blank-' + idx);
    if (!input) break;
    userAnswers.push(input.value.trim().toLowerCase());
    input.disabled = true;
    idx++;
  }

  // Compare with expected answers
  const expected = challenge.answers.map(a => a.trim().toLowerCase());
  const correct = userAnswers.length === expected.length &&
    userAnswers.every((ans, i) => ans === expected[i]);

  // Visual feedback on inputs
  for (let i = 0; i < expected.length; i++) {
    const inp = document.getElementById('blank-' + i);
    if (inp) {
      const isCorrect = userAnswers[i] === expected[i];
      inp.classList.add(isCorrect ? 'correct' : 'wrong');
    }
  }

  window.game.handleAnswer(correct, userAnswers);
}

// ============================================================
// CORRUPTION SCAN
// ============================================================

function renderCorruptionScan(challenge, zoneId) {
  const codeHtml = renderCodeBlock(challenge.code);

  // Shuffle options so correct answer position is random
  const shuffled = challenge.options
    .map((text, origIdx) => ({ text, origIdx }))
    .sort(() => Math.random() - 0.5);

  const optionsHtml = shuffled.map((item, i) => {
    const letter = String.fromCharCode(65 + i);
    return `
      <button class="option-btn" data-orig-index="${item.origIdx}" id="opt-${i}">
        <span class="option-label">${letter}</span>
        <span class="option-text">${escapeHtml(item.text)}</span>
      </button>
    `;
  }).join('');

  return `
    ${codeHtml}
    <p class="challenge-type-title">בחר את השחיתות:</p>
    <div class="options-grid">
      ${optionsHtml}
    </div>
  `;
}

function attachCorruptionScanListeners(challenge) {
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;
      document.querySelectorAll('.option-btn').forEach(b => b.classList.add('disabled'));
      btn.classList.add('selected');
      const origIdx = parseInt(btn.dataset.origIndex);
      window.game.handleAnswer(origIdx === challenge.correct, origIdx);
    });
  });
}

// ============================================================
// NAME BINDING
// ============================================================

let nameBindingState = null;

function renderNameBinding(challenge, zoneId) {
  // Shuffle definitions
  const pairs = challenge.pairs;
  const shuffledDefs = [...pairs.map((p, i) => ({ def: p.definition, origIdx: i }))]
    .sort(() => Math.random() - 0.5);

  nameBindingState = {
    pairs,
    shuffledDefs,
    selectedTerm: null,
    matched: {},   // termIdx -> defIdx
    submitted: false,
  };

  const termsHtml = pairs.map((p, i) => `
    <div class="binding-item" id="term-${i}" data-term-idx="${i}">
      ${escapeHtml(p.term)}
    </div>
  `).join('');

  const defsHtml = shuffledDefs.map((d, i) => `
    <div class="binding-item" id="def-${i}" data-def-pos="${i}" data-orig-idx="${d.origIdx}">
      ${escapeHtml(d.def)}
    </div>
  `).join('');

  return `
    <div class="name-binding-container">
      <div class="binding-column">
        <div class="binding-column-label">Terms</div>
        ${termsHtml}
      </div>
      <div class="binding-column">
        <div class="binding-column-label">Definitions</div>
        ${defsHtml}
      </div>
    </div>
    <div class="binding-submit-area">
      <button class="btn btn-primary hidden" id="btn-binding-submit">Submit Matches</button>
    </div>
  `;
}

function attachNameBindingListeners(challenge) {
  const state = nameBindingState;

  // Term click handlers
  document.querySelectorAll('[id^="term-"]').forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('paired') || el.classList.contains('disabled')) return;
      const termIdx = parseInt(el.dataset.termIdx);

      // Deselect if same term clicked again
      if (state.selectedTerm === termIdx) {
        state.selectedTerm = null;
        document.querySelectorAll('[id^="term-"]').forEach(t => t.classList.remove('selected'));
        return;
      }

      // Select this term
      state.selectedTerm = termIdx;
      document.querySelectorAll('[id^="term-"]').forEach(t => {
        t.classList.toggle('selected', parseInt(t.dataset.termIdx) === termIdx);
      });
    });
  });

  // Definition click handlers
  document.querySelectorAll('[id^="def-"]').forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('paired') || el.classList.contains('disabled')) return;
      if (state.selectedTerm === null) return;

      const defPos = parseInt(el.dataset.defPos);
      const origIdx = parseInt(el.dataset.origIdx);
      const termIdx = state.selectedTerm;

      // Record the match (term index -> original def index)
      state.matched[termIdx] = origIdx;

      // Mark as paired
      const termEl = document.getElementById('term-' + termIdx);
      termEl.classList.add('paired');
      termEl.classList.remove('selected');
      el.classList.add('paired');
      el.innerHTML = '<span class="binding-pair-indicator">✓</span>' + el.innerHTML;

      state.selectedTerm = null;
      document.querySelectorAll('[id^="term-"]').forEach(t => t.classList.remove('selected'));

      // Check if all matched
      if (Object.keys(state.matched).length === state.pairs.length) {
        const submitBtn = document.getElementById('btn-binding-submit');
        if (submitBtn) {
          submitBtn.classList.remove('hidden');
          fadeIn(submitBtn);
        }
      }
    });
  });

  // Submit handler
  const submitBtn = document.getElementById('btn-binding-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (state.submitted) return;
      state.submitted = true;
      submitBtn.disabled = true;

      // Evaluate: each term index must match its own index (term[i] pairs with def[i])
      let allCorrect = true;
      for (let i = 0; i < state.pairs.length; i++) {
        const matchedDefIdx = state.matched[i];
        if (matchedDefIdx !== i) {
          allCorrect = false;
          break;
        }
      }

      // Show visual feedback
      for (let i = 0; i < state.pairs.length; i++) {
        const termEl = document.getElementById('term-' + i);
        const matchedDefIdx = state.matched[i];
        const isCorrect = matchedDefIdx === i;
        if (termEl) {
          termEl.classList.remove('paired');
          termEl.classList.add(isCorrect ? 'correct-reveal' : 'wrong-pair');
        }
        // Find the def element
        document.querySelectorAll('[id^="def-"]').forEach(el => {
          if (parseInt(el.dataset.origIdx) === i) {
            el.classList.remove('paired');
            el.classList.add(isCorrect ? 'correct-reveal' : 'correct-reveal'); // always show correct
          }
        });
      }

      window.game.handleAnswer(allCorrect, state.matched);
    });
  }
}

// ============================================================
// HINT RENDERING
// ============================================================

/**
 * Apply a hint for the current challenge type.
 * @param {Object} challenge
 * @param {string} hintText - The hint text to display
 */
function showHintForChallenge(challenge, hintText) {
  const hintBox = document.getElementById('hint-box');
  const hintTextEl = document.getElementById('hint-text');
  hintBox.classList.remove('hidden');
  hintTextEl.textContent = hintText;
  fadeIn(hintBox);
}

/**
 * Apply type-specific hint mechanic (in addition to showing text hint).
 * @param {Object} challenge
 */
function applyHintMechanic(challenge) {
  switch (challenge.type) {
    case 'output_oracle':
    case 'corruption_scan': {
      // Eliminate one wrong option (use origIndex since options were shuffled)
      const options = document.querySelectorAll('.option-btn:not(.disabled)');
      const wrongOptions = [];
      options.forEach(btn => {
        if (parseInt(btn.dataset.origIndex) !== challenge.correct) {
          wrongOptions.push(btn);
        }
      });
      if (wrongOptions.length > 0) {
        const toElim = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        toElim.classList.add('disabled');
        toElim.style.opacity = '0.25';
      }
      break;
    }
    case 'spell_completion': {
      // Reveal first character of first empty answer
      const input = document.getElementById('blank-0');
      if (input && input.value === '') {
        const firstChar = challenge.answers[0][0];
        input.placeholder = firstChar + '...';
      }
      break;
    }
    case 'name_binding': {
      // Reveal one correct pairing visually
      if (nameBindingState) {
        // Find first unmatched term
        for (let i = 0; i < nameBindingState.pairs.length; i++) {
          if (!nameBindingState.matched.hasOwnProperty(i)) {
            // Highlight the correct def for this term
            document.querySelectorAll('[id^="def-"]').forEach(el => {
              if (parseInt(el.dataset.origIdx) === i) {
                el.style.border = '2px solid #eab308';
              }
            });
            break;
          }
        }
      }
      break;
    }
  }
}

// ============================================================
// REVEAL SCREEN
// ============================================================

/**
 * Render the answer reveal screen.
 * @param {Object} params
 */
function renderReveal(params) {
  const {
    correct,
    challenge,
    xpGained,
    hpLost,
    isStreak,
    isPerfect,
    streakBonus,
  } = params;

  const titleEl = document.getElementById('reveal-title');
  titleEl.textContent = correct ? 'לחש מוצלח!' : 'זוהתה שחיתות!';
  titleEl.className = `reveal-title ${correct ? 'correct' : 'wrong'}`;

  // Correct answer display
  const answerBox = document.getElementById('reveal-answer-box');
  answerBox.innerHTML = formatCorrectAnswer(challenge);

  // Explanation
  document.getElementById('reveal-explanation').textContent =
    challenge.explanation || '';

  // Rewards
  const rewards = document.getElementById('reveal-rewards');
  rewards.innerHTML = '';

  if (correct && xpGained > 0) {
    const xpBadge = document.createElement('div');
    xpBadge.className = 'reward-badge reward-xp';
    xpBadge.textContent = '+' + xpGained + ' XP';
    rewards.appendChild(xpBadge);
  }

  if (correct && streakBonus > 0) {
    const streakBadge = document.createElement('div');
    streakBadge.className = 'reward-badge reward-xp';
    streakBadge.textContent = 'רצף +' + streakBonus + ' XP';
    rewards.appendChild(streakBadge);
  }

  if (correct && isPerfect) {
    const perfBadge = document.createElement('div');
    perfBadge.className = 'reward-badge reward-xp';
    perfBadge.textContent = 'מושלם +30 XP';
    rewards.appendChild(perfBadge);
  }

  if (!correct && hpLost > 0) {
    const hpBadge = document.createElement('div');
    hpBadge.className = 'reward-badge reward-hp-loss';
    hpBadge.textContent = '-' + hpLost + ' HP';
    rewards.appendChild(hpBadge);
  }

  // Continue button label
  const continueBtn = document.getElementById('btn-reveal-continue');
  continueBtn.textContent = correct ? 'המשך' : 'הבנתי... המשך';
  continueBtn.className = 'btn btn-primary';
}

/**
 * Format the correct answer for display.
 */
function formatCorrectAnswer(challenge) {
  switch (challenge.type) {
    case 'output_oracle':
    case 'corruption_scan':
      return escapeHtml(challenge.options[challenge.correct]);
    case 'spell_completion':
      return challenge.answers.join(', ');
    case 'name_binding':
      return challenge.pairs
        .map(p => `${escapeHtml(p.term)} → ${escapeHtml(p.definition)}`)
        .join('<br>');
    default:
      return '';
  }
}
