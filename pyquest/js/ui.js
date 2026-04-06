/* ============================================================
   PYQUEST - UI.JS
   DOM helpers, screen transitions, HUD updates, syntax highlighting,
   code-rain canvas, world map and zone-select rendering
   ============================================================ */

// ============================================================
// SCREEN MANAGEMENT
// ============================================================

const HUD_SCREENS = new Set(['screen-challenge', 'screen-zone-select']);

/**
 * Show a specific screen by ID, hide all others.
 * Automatically toggles HUD visibility.
 * @param {string} screenId
 */
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.classList.remove('hud-visible');
  });
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    if (HUD_SCREENS.has(screenId)) {
      target.classList.add('hud-visible');
      document.getElementById('hud').classList.remove('hidden');
    } else {
      document.getElementById('hud').classList.add('hidden');
    }
  }
}

// ============================================================
// HUD UPDATES
// ============================================================

/**
 * Update HUD bars and labels.
 * @param {Object} player - { hp, xp, level, streak }
 * @param {number} zoneId
 */
function updateHUD(player, zoneId) {
  const hpPercent = getHPPercent(player.hp);
  const xpPercent = getXPPercent(player.xp);
  const levelInfo = getLevelInfo(player.xp);

  const hpBar = document.getElementById('hp-bar');
  const xpBar = document.getElementById('xp-bar');
  const hpText = document.getElementById('hp-text');
  const xpText = document.getElementById('xp-text');
  const hudLevel = document.getElementById('hud-level');
  const hudTitle = document.getElementById('hud-title');
  const hudZone = document.getElementById('hud-zone');

  hpBar.style.width = hpPercent + '%';
  xpBar.style.width = xpPercent + '%';
  hpText.textContent = player.hp + '/' + MAX_HP;
  xpText.textContent = player.xp + ' XP';
  hudLevel.textContent = 'רמה ' + levelInfo.level;
  hudTitle.textContent = levelInfo.title;
  hudZone.textContent = 'אזור ' + zoneId;

  // Update HP bar class for danger state
  hpBar.className = 'bar-fill hp-fill';
  const cls = getHPClass(player.hp);
  if (cls) hpBar.classList.add(cls);

  // Apply zone color class to xp bar (swap zone class)
  xpBar.className = 'bar-fill xp-fill';
}

/**
 * Shake the HP bar (called on damage).
 */
function shakeHPBar() {
  const track = document.querySelector('.hp-track');
  if (!track) return;
  track.classList.remove('shake');
  void track.offsetWidth; // Reflow
  track.classList.add('shake');
  setTimeout(() => track.classList.remove('shake'), 500);
}

/**
 * Flash the screen background (correct/wrong).
 * @param {boolean} correct
 */
function flashScreen(correct) {
  const body = document.body;
  body.classList.remove('crack-flash', 'correct-flash');
  void body.offsetWidth;
  body.classList.add(correct ? 'correct-flash' : 'crack-flash');
  setTimeout(() => body.classList.remove('crack-flash', 'correct-flash'), 400);
}

// ============================================================
// SYNTAX HIGHLIGHTING
// ============================================================

const PY_KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield',
];

const PY_BUILTINS = [
  'print', 'input', 'len', 'range', 'type', 'int', 'str', 'float', 'bool',
  'list', 'dict', 'set', 'tuple', 'sorted', 'map', 'filter', 'enumerate',
  'zip', 'sum', 'max', 'min', 'abs', 'round', 'any', 'all', 'super',
  'isinstance', 'issubclass', 'hasattr', 'getattr', 'setattr', 'vars',
  'dir', 'help', 'id', 'hash', 'repr', 'format', 'open', 'reversed',
  'next', 'iter', 'object', 'property', 'staticmethod', 'classmethod',
];

/**
 * Apply simple regex-based Python syntax highlighting.
 * Returns HTML string with <span> tags.
 * @param {string} code
 * @returns {string}
 */
function highlightPython(code) {
  // Escape HTML first
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Process line by line to handle comments correctly
  const lines = html.split('\n');
  const processed = lines.map(line => {
    // Check for comment (find # not inside strings first)
    let commentStart = -1;
    let inStr = false;
    let strChar = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inStr) {
        if (ch === strChar && line[i - 1] !== '\\') inStr = false;
      } else {
        if (ch === '"' || ch === "'") { inStr = true; strChar = ch; }
        else if (ch === '#') { commentStart = i; break; }
      }
    }

    let codePart = commentStart >= 0 ? line.slice(0, commentStart) : line;
    const commentPart = commentStart >= 0 ? line.slice(commentStart) : '';

    // Keywords FIRST - no span tags exist yet so no false matches in HTML attributes.
    // (The bug was: keywords ran last and matched "class" inside class="builtin" etc.)
    const kwRe = new RegExp('\\b(' + PY_KEYWORDS.join('|') + ')\\b', 'g');
    codePart = codePart.replace(kwRe, '<span class="kw">$1</span>');

    // Function/class names after def/class (kw spans are already present)
    codePart = codePart.replace(
      /(<span class="kw">def<\/span>|<span class="kw">class<\/span>)\s+([a-zA-Z_]\w*)/g,
      '$1 <span class="fn">$2</span>'
    );

    // Helper: apply a replacement only to plain-text portions (outside existing span tags)
    function replaceOutsideTags(str, regex, replacement) {
      let result = '';
      let last = 0;
      const tagRe = /<[^>]+>/g;
      let m;
      while ((m = tagRe.exec(str)) !== null) {
        result += str.slice(last, m.index).replace(regex, replacement);
        result += m[0];
        last = m.index + m[0].length;
      }
      result += str.slice(last).replace(regex, replacement);
      return result;
    }

    // Highlight strings (only in non-tagged portions)
    codePart = replaceOutsideTags(codePart,
      /(f?&quot;[^&]*?&quot;|f?&#39;[^&#]*?&#39;|f?"[^"]*?"|f?'[^']*?')/g,
      '<span class="str">$1</span>');

    // Highlight numbers
    codePart = replaceOutsideTags(codePart, /\b(\d+\.?\d*)\b/g, '<span class="num">$1</span>');

    // Highlight builtins
    const builtinRe = new RegExp('\\b(' + PY_BUILTINS.join('|') + ')\\b(?=\\()', 'g');
    codePart = replaceOutsideTags(codePart, builtinRe, '<span class="builtin">$1</span>');

    const commentHtml = commentPart
      ? '<span class="cmt">' + commentPart + '</span>'
      : '';

    return codePart + commentHtml;
  });

  return processed.join('\n');
}

/**
 * Render a code block with terminal chrome.
 * @param {string} code
 * @param {string} [lang='python']
 * @returns {string} HTML string
 */
function renderCodeBlock(code) {
  const highlighted = highlightPython(code);
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
      <pre class="code-block" dir="ltr">${highlighted}</pre>
    </div>
  `;
}

// ============================================================
// WORLD MAP RENDERING
// ============================================================

const ZONE_ICONS = {
  0: '🏜️', 1: '🌿', 2: '💎', 3: '🔀', 4: '🔮',
  5: '🐊', 6: '🏰', 7: '📚', 8: '🌀', 9: '✨',
};

/**
 * Render the world map zone chain.
 * @param {Object} save
 * @param {Array} zones - ZONE_X data objects
 */
function renderWorldMap(save, zones) {
  const chain = document.getElementById('zone-chain');
  chain.innerHTML = '';

  zones.forEach((zone, i) => {
    const status = getZoneStatus(save, i);
    const stars = getZoneStars(save, i);
    const totalStars = stars.reduce((a, b) => a + b, 0);
    const isLocked = status === 'locked';
    const isComplete = status === 'complete';
    const isActive = !isLocked && !isComplete;

    // Connector line above (except first)
    if (i > 0) {
      const connector = document.createElement('div');
      connector.className = 'zone-connector' + (
        getZoneStatus(save, i - 1) === 'complete' ? ' done' : ''
      );
      chain.appendChild(connector);
    }

    // Zone node
    const node = document.createElement('div');
    node.className = `zone-node zone-${i}${isLocked ? ' locked' : ''}${isComplete ? ' completed' : ''}${isActive ? ' active' : ''}`;

    const starsHtml = [0, 1, 2].map(j => {
      const s = stars[j] || 0;
      const filled = s > 0;
      return `<span class="star-small ${filled ? 'star-filled' : 'star-empty'}">${filled ? '★' : '☆'}</span>`;
    }).join('');

    node.innerHTML = `
      <div class="zone-node-header">
        <span class="zone-node-number">אזור ${i}</span>
        <span class="zone-node-status-icon">${
          isLocked ? '🔒' : isComplete ? '✓' : ZONE_ICONS[i]
        }</span>
      </div>
      <div class="zone-node-name">${zone.name}</div>
      <div class="zone-node-subtitle">${zone.subtitle}</div>
      <div class="zone-node-stars">${starsHtml}</div>
      ${isLocked ? '<div class="zone-node-fog"></div>' : ''}
    `;

    if (!isLocked) {
      node.addEventListener('click', () => {
        playMenuSelect();
        window.game.goToZoneSelect(i);
      });
    }

    chain.appendChild(node);
  });

  // Update player info bar
  const levelInfo = getLevelInfo(save.player.xp);
  document.getElementById('map-player-level').textContent = 'רמה ' + levelInfo.level;
  document.getElementById('map-player-title').textContent = levelInfo.title;
  document.getElementById('map-player-xp').textContent = save.player.xp + ' XP';
}

// ============================================================
// ZONE SELECT RENDERING
// ============================================================

/**
 * Render zone select screen.
 * @param {Object} save
 * @param {Object} zone - Zone data object
 */
function renderZoneSelect(save, zone) {
  const zoneId = zone.id;

  // Update header
  document.getElementById('zone-select-name').textContent = zone.name;
  document.getElementById('zone-select-subtitle').textContent = zone.subtitle;
  document.getElementById('zone-select-boss').textContent = 'Boss: ' + zone.boss;

  // Apply zone class to screen
  const screen = document.getElementById('screen-zone-select');
  screen.className = 'screen hud-visible active zone-' + zoneId;

  // Render encounters
  const list = document.getElementById('encounters-list');
  list.innerHTML = '';

  zone.encounters.forEach((enc, i) => {
    const unlocked = isEncounterUnlocked(save, zoneId, i);
    const status = getEncounterStatus(save, zoneId, i);
    const stars = status ? status.stars : 0;

    const card = document.createElement('div');
    card.className = `encounter-card zone-${zoneId}` +
      (enc.isBoss ? ' encounter-boss' : '') +
      (!unlocked ? ' encounter-locked' : ' encounter-available') +
      (stars > 0 ? ' encounter-done' : '');

    const starsHtml = [1, 2, 3].map(s => {
      return `<span class="star-small ${s <= stars ? 'star-filled' : 'star-empty'}">${s <= stars ? '★' : '☆'}</span>`;
    }).join('');

    card.innerHTML = `
      <div class="encounter-icon">${
        !unlocked ? '🔒' : enc.isBoss ? '💀' : stars > 0 ? '✓' : '▶'
      }</div>
      <div class="encounter-info">
        <div class="encounter-name">${enc.name}</div>
        <div class="encounter-desc">${
          !unlocked ? 'השלם את העימות הקודם תחילה' :
          enc.isBoss ? 'קרב בוס - ' + enc.challenges.length + ' אתגרים' :
          enc.challenges.length + ' אתגרים'
        }</div>
      </div>
      <div class="encounter-stars">${starsHtml}</div>
    `;

    if (unlocked) {
      card.addEventListener('click', () => {
        playMenuSelect();
        window.game.startEncounter(zoneId, i);
      });
    }

    list.appendChild(card);
  });
}

// ============================================================
// STAR ANIMATION
// ============================================================

/**
 * Animate stars appearing in the encounter complete screen.
 * @param {number} stars - 1, 2, or 3
 */
function animateStars(stars) {
  const display = document.getElementById('stars-display');
  display.innerHTML = '';
  for (let i = 1; i <= 3; i++) {
    const span = document.createElement('span');
    span.className = `star-icon star-large ${i <= stars ? 'star-filled' : 'star-empty'}`;
    span.textContent = i <= stars ? '★' : '☆';
    display.appendChild(span);
    setTimeout(() => span.classList.add('appear', `appear-delay-${i}`), 50 * i);
  }
}

// ============================================================
// XP FLOAT LABEL
// ============================================================

/**
 * Show floating XP gain label near the XP bar.
 * @param {number} amount
 */
function showXPFloat(amount) {
  const bar = document.getElementById('xp-bar');
  if (!bar) return;
  const rect = bar.getBoundingClientRect();
  const label = document.createElement('div');
  label.className = 'xp-float-label';
  label.textContent = '+' + amount + ' XP';
  label.style.left = (rect.left + rect.width / 2) + 'px';
  label.style.top = (rect.top - 10) + 'px';
  document.body.appendChild(label);
  setTimeout(() => label.remove(), 1200);
}

// ============================================================
// STREAK BANNER
// ============================================================

let streakBannerTimeout = null;

/**
 * Show the streak banner for a few seconds.
 */
function showStreakBanner() {
  const banner = document.getElementById('streak-banner');
  banner.classList.remove('hidden', 'exiting');
  banner.classList.add('entering');
  if (streakBannerTimeout) clearTimeout(streakBannerTimeout);
  streakBannerTimeout = setTimeout(() => {
    banner.classList.add('exiting');
    setTimeout(() => {
      banner.classList.add('hidden');
      banner.classList.remove('entering', 'exiting');
    }, 300);
  }, 2500);
}

/**
 * Hide the streak banner immediately.
 */
function hideStreakBanner() {
  const banner = document.getElementById('streak-banner');
  banner.classList.add('hidden');
  banner.classList.remove('entering', 'exiting');
  if (streakBannerTimeout) clearTimeout(streakBannerTimeout);
}

// ============================================================
// MODAL
// ============================================================

/**
 * Show a modal with content.
 * @param {string} html
 * @param {Function} onClose
 */
function showModal(html, onClose) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  content.innerHTML = html;
  overlay.classList.remove('hidden');
  const closeBtn = document.getElementById('modal-close');
  closeBtn.onclick = () => {
    overlay.classList.add('hidden');
    if (onClose) onClose();
  };
}

/**
 * Hide modal.
 */
function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ============================================================
// CODE RAIN CANVAS
// ============================================================

const CODE_RAIN_WORDS = [
  'print', 'def', 'class', 'if', 'else', 'for', 'while', 'return',
  'import', 'from', 'try', 'except', 'True', 'False', 'None', 'in',
  'not', 'and', 'or', 'lambda', 'yield', 'with', 'as', 'pass',
  'break', 'continue', 'raise', 'finally', 'global', 'list', 'dict',
  'str', 'int', 'len', 'range', 'input', '[]', '{}', '()', ':=',
  'self', 'elif', '__init__', 'super', 'type', '0xFF', '\\n', '...',
];

let rainDrops = [];
let rainAnimFrame = null;

/**
 * Initialize and start the code rain canvas animation.
 */
function startCodeRain() {
  const canvas = document.getElementById('code-rain-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initDrops();
  }

  function initDrops() {
    const cols = Math.floor(canvas.width / 90);
    rainDrops = [];
    for (let i = 0; i < cols; i++) {
      rainDrops.push({
        x: i * 90 + Math.random() * 60,
        y: Math.random() * -canvas.height,
        speed: 0.4 + Math.random() * 0.8,
        word: CODE_RAIN_WORDS[Math.floor(Math.random() * CODE_RAIN_WORDS.length)],
        opacity: 0.3 + Math.random() * 0.6,
        size: 9 + Math.floor(Math.random() * 6),
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '500 12px "Fira Code", monospace';

    rainDrops.forEach(drop => {
      ctx.globalAlpha = drop.opacity * 0.7;
      ctx.fillStyle = '#06b6d4';
      ctx.font = `${drop.size}px "Fira Code", monospace`;
      ctx.fillText(drop.word, drop.x, drop.y);
      drop.y += drop.speed;
      if (drop.y > canvas.height + 40) {
        drop.y = -40;
        drop.x = Math.random() * canvas.width;
        drop.word = CODE_RAIN_WORDS[Math.floor(Math.random() * CODE_RAIN_WORDS.length)];
        drop.speed = 0.4 + Math.random() * 0.8;
        drop.opacity = 0.2 + Math.random() * 0.5;
      }
    });
    ctx.globalAlpha = 1;
    rainAnimFrame = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  if (rainAnimFrame) cancelAnimationFrame(rainAnimFrame);
  draw();
}

/**
 * Stop the code rain animation.
 */
function stopCodeRain() {
  if (rainAnimFrame) {
    cancelAnimationFrame(rainAnimFrame);
    rainAnimFrame = null;
  }
}

// ============================================================
// UTILITY
// ============================================================

/**
 * Escape HTML entities.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Add a fade-in animation to an element.
 * @param {HTMLElement} el
 */
function fadeIn(el) {
  el.classList.remove('fade-in');
  void el.offsetWidth;
  el.classList.add('fade-in');
}
