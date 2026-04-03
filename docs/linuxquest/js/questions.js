/* ============================================================
   LINUXQUEST - QUESTIONS.JS
   Render and evaluate all 5 challenge types:
   terminal_oracle, command_forge, script_debug, flag_map, pipe_builder
   ============================================================ */

const TYPE_LABELS = {
  terminal_oracle: 'נביא הפלט',
  command_forge:   'השלמת פקודה',
  script_debug:    'איתור באגים',
  flag_map:        'מיפוי פקודות',
  pipe_builder:    'בניית צינור',
};

const TYPE_INSTRUCTIONS = {
  terminal_oracle: 'מה יוציא הטרמינל?',
  command_forge:   'השלם את הפקודה החסרה.',
  script_debug:    'מצא את הבאג בסקריפט.',
  flag_map:        'קשר כל פקודה לתיאורה. לחץ על פקודה, ואחר כך על ההתאמה שלה.',
  pipe_builder:    'בחר את הצינור הנכון להשגת המטרה.',
};

// ============================================================
// RENDER DISPATCH
// ============================================================

function renderChallenge(challenge, zoneId, hintState) {
  const content = document.getElementById('challenge-content');
  const badge = document.getElementById('challenge-type-badge');
  const narrative = document.getElementById('challenge-narrative');

  badge.textContent = TYPE_LABELS[challenge.type] || challenge.type;
  badge.className = `challenge-type-badge badge-${challenge.type}`;

  narrative.textContent = challenge.narrative || TYPE_INSTRUCTIONS[challenge.type];

  updateHintButton(hintState);

  const hintBox = document.getElementById('hint-box');
  hintBox.classList.add('hidden');
  document.getElementById('hint-text').textContent = '';

  switch (challenge.type) {
    case 'terminal_oracle':
      content.innerHTML = renderTerminalOracle(challenge, zoneId);
      attachTerminalOracleListeners(challenge);
      break;
    case 'command_forge':
      content.innerHTML = renderCommandForge(challenge, zoneId);
      attachCommandForgeListeners(challenge);
      break;
    case 'script_debug':
      content.innerHTML = renderScriptDebug(challenge, zoneId);
      attachScriptDebugListeners(challenge);
      break;
    case 'flag_map':
      content.innerHTML = renderFlagMap(challenge, zoneId);
      attachFlagMapListeners(challenge);
      break;
    case 'pipe_builder':
      content.innerHTML = renderPipeBuilder(challenge, zoneId);
      attachPipeBuilderListeners(challenge);
      break;
    default:
      content.innerHTML = '<p>Unknown challenge type: ' + challenge.type + '</p>';
  }

  fadeIn(content);
}

function updateHintButton(hintState) {
  const btn = document.getElementById('btn-hint');
  const label = document.getElementById('hint-label');
  if (hintState.hintUsed) {
    label.textContent = 'Hint shown';
    btn.disabled = true;
  } else if (hintState.hintsLeft > 0) {
    label.textContent = `Hint (${hintState.hintsLeft} free)`;
    btn.disabled = false;
  } else {
    label.textContent = 'Hint (-10 HP)';
    btn.disabled = false;
  }
}

// ============================================================
// TYPE 1: TERMINAL ORACLE
// Predict command output - multiple choice
// ============================================================

function renderTerminalOracle(challenge, zoneId) {
  const prompt = challenge.prompt || 'agent@server:~$';
  const termHtml = renderTerminalBlock(prompt, challenge.command, challenge.context || null);

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
    ${termHtml}
    <div class="options-grid">
      ${optionsHtml}
    </div>
  `;
}

function attachTerminalOracleListeners(challenge) {
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
// TYPE 2: COMMAND FORGE
// Fill in missing parts of a command
// ============================================================

function renderCommandForge(challenge, zoneId) {
  const prompt = challenge.prompt || 'agent@server:~$';
  const parts = challenge.commandTemplate.split('___');

  let cmdInner = '';
  parts.forEach((part, i) => {
    cmdInner += highlightBash(part);
    if (i < parts.length - 1) {
      cmdInner += `<input
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
    <div class="terminal-window">
      <div class="terminal-titlebar">
        <div class="terminal-dots">
          <div class="terminal-dot dot-red"></div>
          <div class="terminal-dot dot-yellow"></div>
          <div class="terminal-dot dot-green"></div>
        </div>
        <span class="terminal-title">bash</span>
      </div>
      <div class="terminal-body" dir="ltr">
        <div class="terminal-cmd-line">
          <span class="term-prompt">${escapeHtml(prompt)}</span> <span class="term-command">${cmdInner}</span>
        </div>
      </div>
    </div>
    <div class="spell-submit-area">
      <button class="btn btn-primary" id="btn-spell-submit">Execute</button>
    </div>
  `;
}

function attachCommandForgeListeners(challenge) {
  const firstInput = document.getElementById('blank-0');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 100);
  }

  document.querySelectorAll('.code-blank-input').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') submitCommandForge(challenge);
    });
  });

  const submitBtn = document.getElementById('btn-spell-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => submitCommandForge(challenge));
  }
}

function submitCommandForge(challenge) {
  const submitBtn = document.getElementById('btn-spell-submit');
  if (submitBtn) submitBtn.disabled = true;

  const userAnswers = [];
  let idx = 0;
  while (true) {
    const input = document.getElementById('blank-' + idx);
    if (!input) break;
    userAnswers.push(input.value.trim().toLowerCase());
    input.disabled = true;
    idx++;
  }

  // Support acceptedAlternatives for flag synonyms (-la vs -al etc)
  const expected = challenge.answers.map(a => a.trim().toLowerCase());
  const alternatives = challenge.acceptedAlternatives || [];

  let correct = userAnswers.length === expected.length;
  if (correct) {
    correct = userAnswers.every((ans, i) => {
      const alts = alternatives[i] ? alternatives[i].map(a => a.trim().toLowerCase()) : [];
      return ans === expected[i] || alts.includes(ans);
    });
  }

  for (let i = 0; i < expected.length; i++) {
    const inp = document.getElementById('blank-' + i);
    if (inp) {
      const alts = alternatives[i] ? alternatives[i].map(a => a.trim().toLowerCase()) : [];
      const isCorrect = userAnswers[i] === expected[i] || alts.includes(userAnswers[i]);
      inp.classList.add(isCorrect ? 'correct' : 'wrong');
    }
  }

  window.game.handleAnswer(correct, userAnswers);
}

// ============================================================
// TYPE 3: SCRIPT DEBUG
// Find the bug in a bash script - multiple choice
// ============================================================

function renderScriptDebug(challenge, zoneId) {
  const highlighted = highlightBash(challenge.script || challenge.code || '');
  const filename = challenge.filename || 'script.sh';

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
    <div class="code-block-wrapper">
      <div class="code-block-header">
        <div class="code-block-dots">
          <div class="code-dot code-dot-red"></div>
          <div class="code-dot code-dot-yellow"></div>
          <div class="code-dot code-dot-green"></div>
        </div>
        <span class="code-block-label">${escapeHtml(filename)}</span>
      </div>
      <pre class="code-block" dir="ltr">${highlighted}</pre>
    </div>
    <p class="challenge-type-title">מצא את הבאג:</p>
    <div class="options-grid">
      ${optionsHtml}
    </div>
  `;
}

function attachScriptDebugListeners(challenge) {
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
// TYPE 4: FLAG MAP
// Match commands to descriptions
// ============================================================

let flagMapState = null;

function renderFlagMap(challenge, zoneId) {
  const pairs = challenge.pairs;
  const shuffledDefs = [...pairs.map((p, i) => ({ def: p.definition, origIdx: i }))]
    .sort(() => Math.random() - 0.5);

  flagMapState = {
    pairs,
    shuffledDefs,
    selectedTerm: null,
    matched: {},
    submitted: false,
  };

  const termsHtml = pairs.map((p, i) => `
    <div class="binding-item" id="term-${i}" data-term-idx="${i}" dir="ltr">
      <span class="term-text">${escapeHtml(p.term)}</span>
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
        <div class="binding-column-label">פקודות</div>
        ${termsHtml}
      </div>
      <div class="binding-column">
        <div class="binding-column-label">תיאורים</div>
        ${defsHtml}
      </div>
    </div>
    <div class="binding-submit-area">
      <button class="btn btn-primary hidden" id="btn-binding-submit">Submit</button>
    </div>
  `;
}

function attachFlagMapListeners(challenge) {
  const state = flagMapState;

  document.querySelectorAll('[id^="term-"]').forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('paired') || el.classList.contains('disabled')) return;
      const termIdx = parseInt(el.dataset.termIdx);

      if (state.selectedTerm === termIdx) {
        state.selectedTerm = null;
        document.querySelectorAll('[id^="term-"]').forEach(t => t.classList.remove('selected'));
        return;
      }

      state.selectedTerm = termIdx;
      document.querySelectorAll('[id^="term-"]').forEach(t => {
        t.classList.toggle('selected', parseInt(t.dataset.termIdx) === termIdx);
      });
    });
  });

  document.querySelectorAll('[id^="def-"]').forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('paired') || el.classList.contains('disabled')) return;
      if (state.selectedTerm === null) return;

      const origIdx = parseInt(el.dataset.origIdx);
      const termIdx = state.selectedTerm;

      state.matched[termIdx] = origIdx;

      const termEl = document.getElementById('term-' + termIdx);
      termEl.classList.add('paired');
      termEl.classList.remove('selected');
      el.classList.add('paired');
      el.innerHTML = '<span class="binding-pair-indicator">OK</span>' + el.innerHTML;

      state.selectedTerm = null;
      document.querySelectorAll('[id^="term-"]').forEach(t => t.classList.remove('selected'));

      if (Object.keys(state.matched).length === state.pairs.length) {
        const submitBtn = document.getElementById('btn-binding-submit');
        if (submitBtn) {
          submitBtn.classList.remove('hidden');
          fadeIn(submitBtn);
        }
      }
    });
  });

  const submitBtn = document.getElementById('btn-binding-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (state.submitted) return;
      state.submitted = true;
      submitBtn.disabled = true;

      let allCorrect = true;
      for (let i = 0; i < state.pairs.length; i++) {
        if (state.matched[i] !== i) {
          allCorrect = false;
          break;
        }
      }

      for (let i = 0; i < state.pairs.length; i++) {
        const termEl = document.getElementById('term-' + i);
        const isCorrect = state.matched[i] === i;
        if (termEl) {
          termEl.classList.remove('paired');
          termEl.classList.add(isCorrect ? 'correct-reveal' : 'wrong-pair');
        }
        document.querySelectorAll('[id^="def-"]').forEach(el => {
          if (parseInt(el.dataset.origIdx) === i) {
            el.classList.remove('paired');
            el.classList.add('correct-reveal');
          }
        });
      }

      window.game.handleAnswer(allCorrect, state.matched);
    });
  }
}

// ============================================================
// TYPE 5: PIPE BUILDER
// Choose the correct pipeline - multiple choice
// ============================================================

function renderPipeBuilder(challenge, zoneId) {
  const goalHtml = `
    <div class="pipe-goal">
      <span class="pipe-goal-label"># MISSION:</span>
      <span class="pipe-goal-text">${escapeHtml(challenge.goal)}</span>
    </div>
  `;

  const shuffled = challenge.options
    .map((text, origIdx) => ({ text, origIdx }))
    .sort(() => Math.random() - 0.5);

  const optionsHtml = shuffled.map((item, i) => {
    const letter = String.fromCharCode(65 + i);
    const highlighted = highlightBash(item.text);
    return `
      <button class="option-btn pipe-option" data-orig-index="${item.origIdx}" id="opt-${i}">
        <span class="option-label">${letter}</span>
        <pre class="pipe-option-code" dir="ltr">${highlighted}</pre>
      </button>
    `;
  }).join('');

  return `
    ${goalHtml}
    <div class="options-grid options-grid-single">
      ${optionsHtml}
    </div>
  `;
}

function attachPipeBuilderListeners(challenge) {
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
// HINT SYSTEM
// ============================================================

function showHintForChallenge(challenge, hintText) {
  const hintBox = document.getElementById('hint-box');
  const hintTextEl = document.getElementById('hint-text');
  hintBox.classList.remove('hidden');
  hintTextEl.textContent = hintText;
  fadeIn(hintBox);
}

function applyHintMechanic(challenge) {
  switch (challenge.type) {
    case 'terminal_oracle':
    case 'script_debug':
    case 'pipe_builder': {
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
    case 'command_forge': {
      const input = document.getElementById('blank-0');
      if (input && input.value === '') {
        const firstChar = challenge.answers[0][0];
        input.placeholder = firstChar + '...';
      }
      break;
    }
    case 'flag_map': {
      if (flagMapState) {
        for (let i = 0; i < flagMapState.pairs.length; i++) {
          if (!flagMapState.matched.hasOwnProperty(i)) {
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

function renderReveal(params) {
  const { correct, challenge, xpGained, hpLost, isStreak, isPerfect, streakBonus } = params;

  const titleEl = document.getElementById('reveal-title');
  titleEl.textContent = correct ? 'פקודה בוצעה!' : 'שגיאה בביצוע!';
  titleEl.className = `reveal-title ${correct ? 'correct' : 'wrong'}`;

  const answerBox = document.getElementById('reveal-answer-box');
  answerBox.innerHTML = formatCorrectAnswer(challenge);

  document.getElementById('reveal-explanation').textContent = challenge.explanation || '';

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

  const continueBtn = document.getElementById('btn-reveal-continue');
  continueBtn.textContent = correct ? 'המשך' : 'הבנתי... המשך';
  continueBtn.className = 'btn btn-primary';
}

function formatCorrectAnswer(challenge) {
  switch (challenge.type) {
    case 'terminal_oracle':
    case 'script_debug':
    case 'pipe_builder':
      return `<pre dir="ltr" style="font-family:var(--font-code);font-size:13px;color:#00ff41;">${escapeHtml(challenge.options[challenge.correct])}</pre>`;
    case 'command_forge':
      return `<pre dir="ltr" style="font-family:var(--font-code);font-size:13px;color:#00ff41;">${escapeHtml(challenge.answers.join(' '))}</pre>`;
    case 'flag_map':
      return challenge.pairs
        .map(p => `<div dir="ltr" style="font-family:var(--font-code);font-size:12px;">${escapeHtml(p.term)} - ${escapeHtml(p.definition)}</div>`)
        .join('');
    default:
      return '';
  }
}
