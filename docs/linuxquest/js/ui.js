/* ============================================================
   LINUXQUEST - UI.JS
   DOM helpers, screen transitions, HUD, bash highlighting,
   code-rain canvas, world map and zone-select rendering
   ============================================================ */

const HUD_SCREENS = new Set(['screen-challenge', 'screen-zone-select']);

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
// HUD
// ============================================================

function updateHUD(player, zoneId) {
  const hpPercent = getHPPercent(player.hp);
  const xpPercent = getXPPercent(player.xp);
  const levelInfo = getLevelInfo(player.xp);

  document.getElementById('hp-bar').style.width = hpPercent + '%';
  document.getElementById('xp-bar').style.width = xpPercent + '%';
  document.getElementById('hp-text').textContent = player.hp + '/' + MAX_HP;
  document.getElementById('xp-text').textContent = player.xp + ' XP';
  document.getElementById('hud-level').textContent = 'Lv.' + levelInfo.level;
  document.getElementById('hud-title').textContent = levelInfo.title;
  document.getElementById('hud-zone').textContent = 'Zone ' + zoneId;

  const hpBar = document.getElementById('hp-bar');
  hpBar.className = 'bar-fill hp-fill';
  const cls = getHPClass(player.hp);
  if (cls) hpBar.classList.add(cls);
}

function shakeHPBar() {
  const track = document.querySelector('.hp-track');
  if (!track) return;
  track.classList.remove('shake');
  void track.offsetWidth;
  track.classList.add('shake');
  setTimeout(() => track.classList.remove('shake'), 500);
}

function flashScreen(correct) {
  const body = document.body;
  body.classList.remove('crack-flash', 'correct-flash');
  void body.offsetWidth;
  body.classList.add(correct ? 'correct-flash' : 'crack-flash');
  setTimeout(() => body.classList.remove('crack-flash', 'correct-flash'), 400);
}

// ============================================================
// BASH SYNTAX HIGHLIGHTING
// ============================================================

const BASH_KEYWORDS = [
  'if', 'then', 'else', 'elif', 'fi', 'for', 'in', 'do', 'done',
  'while', 'until', 'case', 'esac', 'function', 'return', 'exit',
  'break', 'continue', 'local', 'export', 'readonly', 'unset',
  'source', 'shift', 'trap', 'select',
];

const BASH_BUILTINS = [
  'echo', 'read', 'printf', 'cd', 'pwd', 'ls', 'mkdir', 'rmdir',
  'rm', 'cp', 'mv', 'touch', 'cat', 'head', 'tail', 'less', 'more',
  'grep', 'sed', 'awk', 'sort', 'uniq', 'wc', 'cut', 'tr', 'find',
  'chmod', 'chown', 'chgrp', 'sudo', 'su', 'whoami', 'id', 'groups',
  'ps', 'top', 'kill', 'jobs', 'bg', 'fg', 'nohup', 'nice',
  'man', 'which', 'whereis', 'type', 'help', 'history',
  'env', 'set', 'unset', 'export', 'declare',
  'systemctl', 'journalctl', 'apt', 'dpkg', 'yum', 'dnf',
  'ssh', 'scp', 'rsync', 'curl', 'wget',
  'tar', 'gzip', 'gunzip', 'zip', 'unzip',
  'df', 'du', 'mount', 'umount', 'lsblk', 'fdisk',
  'crontab', 'at', 'sleep',
  'uname', 'hostname', 'uptime', 'free', 'lscpu',
];

function highlightBash(code) {
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = html.split('\n');
  const processed = lines.map(line => {
    // Handle shebang line
    if (line.startsWith('#!')) {
      return `<span class="shebang">${line}</span>`;
    }

    // Find comment start (# not inside strings)
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

    // Keywords
    const kwRe = new RegExp('\\b(' + BASH_KEYWORDS.join('|') + ')\\b', 'g');
    codePart = codePart.replace(kwRe, '<span class="kw">$1</span>');

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

    // Strings (single and double-quoted)
    codePart = replaceOutsideTags(codePart,
      /(&quot;[^&]*?&quot;|&#39;[^&#]*?&#39;|"[^"]*?"|'[^']*?')/g,
      '<span class="str">$1</span>');

    // Variables: $VAR, ${VAR}, $1 $2 etc
    codePart = replaceOutsideTags(codePart,
      /(\$\{[^}]+\}|\$[a-zA-Z_][a-zA-Z0-9_]*|\$[0-9#@*?])/g,
      '<span class="var">$1</span>');

    // Numbers
    codePart = replaceOutsideTags(codePart,
      /\b(\d+)\b/g,
      '<span class="num">$1</span>');

    // Builtins/commands (at start of line or after pipe/semicolon)
    const builtinRe = new RegExp('(?<=^|\\||;|&amp;&amp;|\\|\\||\\s)(' + BASH_BUILTINS.join('|') + ')(?=\\s|$)', 'g');
    codePart = replaceOutsideTags(codePart, builtinRe, '<span class="builtin">$1</span>');

    // Flags: -flag and --flag
    codePart = replaceOutsideTags(codePart,
      /\s(--?[a-zA-Z][a-zA-Z0-9-]*)/g,
      ' <span class="flag">$1</span>');

    // Pipe operator
    codePart = replaceOutsideTags(codePart,
      /(\|(?!&gt;)|&amp;&amp;|\|\|)/g,
      '<span class="op">$1</span>');

    // Redirect operators
    codePart = replaceOutsideTags(codePart,
      /((?:&gt;&gt;|&gt;|2&gt;|&gt;&amp;|&lt;))/g,
      '<span class="redir">$1</span>');

    const commentHtml = commentPart
      ? '<span class="cmt">' + commentPart + '</span>'
      : '';

    return codePart + commentHtml;
  });

  return processed.join('\n');
}

/**
 * Render a terminal window code block for bash.
 */
function renderCodeBlock(code, label) {
  const highlighted = highlightBash(code);
  const blockLabel = label || 'bash';
  return `
    <div class="code-block-wrapper">
      <div class="code-block-header">
        <div class="code-block-dots">
          <div class="code-dot code-dot-red"></div>
          <div class="code-dot code-dot-yellow"></div>
          <div class="code-dot code-dot-green"></div>
        </div>
        <span class="code-block-label">${blockLabel}</span>
      </div>
      <pre class="code-block" dir="ltr">${highlighted}</pre>
    </div>
  `;
}

/**
 * Render a terminal window with a prompt line.
 */
function renderTerminalBlock(prompt, command, contextLines) {
  const promptHtml = `<span class="term-prompt">${escapeHtml(prompt)}</span> `;
  const cmdHtml = highlightBash(command);

  let contextHtml = '';
  if (contextLines && contextLines.length > 0) {
    contextHtml = contextLines.map(l => `<div class="term-output-line">${escapeHtml(l)}</div>`).join('');
  }

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
        ${contextHtml}
        <div class="terminal-cmd-line">${promptHtml}<span class="term-command">${cmdHtml}</span></div>
      </div>
    </div>
  `;
}

// ============================================================
// WORLD MAP RENDERING
// ============================================================

const ZONE_ICONS = {
  0: '[BOOT]', 1: '[FILES]', 2: '[SHELL]', 3: '[AUTH]', 4: '[TEXT]',
  5: '[PROC]', 6: '[SCRIPT]', 7: '[CRON]', 8: '[SVC]', 9: '[ROOT]',
};

function renderWorldMap(save, zones) {
  const chain = document.getElementById('zone-chain');
  chain.innerHTML = '';

  zones.forEach((zone, i) => {
    const status = getZoneStatus(save, i);
    const stars = getZoneStars(save, i);
    const isLocked = status === 'locked';
    const isComplete = status === 'complete';
    const isActive = !isLocked && !isComplete;

    if (i > 0) {
      const connector = document.createElement('div');
      connector.className = 'zone-connector' + (
        getZoneStatus(save, i - 1) === 'complete' ? ' done' : ''
      );
      chain.appendChild(connector);
    }

    const node = document.createElement('div');
    node.className = `zone-node zone-${i}${isLocked ? ' locked' : ''}${isComplete ? ' completed' : ''}${isActive ? ' active' : ''}`;

    const starsHtml = [0, 1, 2].map(j => {
      const s = stars[j] || 0;
      const filled = s > 0;
      return `<span class="star-small ${filled ? 'star-filled' : 'star-empty'}">${filled ? '*' : '.'}</span>`;
    }).join('');

    const statusIcon = isLocked ? '[LOCKED]' : isComplete ? '[OK]' : ZONE_ICONS[i];

    node.innerHTML = `
      <div class="zone-node-header">
        <span class="zone-node-number">Zone ${i}</span>
        <span class="zone-node-status-icon term-icon">${statusIcon}</span>
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

  const levelInfo = getLevelInfo(save.player.xp);
  document.getElementById('map-player-level').textContent = 'רמה ' + levelInfo.level;
  document.getElementById('map-player-title').textContent = levelInfo.title;
  document.getElementById('map-player-xp').textContent = save.player.xp + ' XP';
}

// ============================================================
// ZONE SELECT RENDERING
// ============================================================

function renderZoneSelect(save, zone) {
  const zoneId = zone.id;

  document.getElementById('zone-select-name').textContent = zone.name;
  document.getElementById('zone-select-subtitle').textContent = zone.subtitle;
  document.getElementById('zone-select-boss').textContent = 'Boss: ' + zone.boss;

  const screen = document.getElementById('screen-zone-select');
  screen.className = 'screen hud-visible active zone-' + zoneId;

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
      return `<span class="star-small ${s <= stars ? 'star-filled' : 'star-empty'}">${s <= stars ? '*' : '.'}</span>`;
    }).join('');

    const iconText = !unlocked ? '[LOCKED]' : enc.isBoss ? '[BOSS]' : stars > 0 ? '[DONE]' : '[GO]';

    card.innerHTML = `
      <div class="encounter-icon term-icon">${iconText}</div>
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

function animateStars(stars) {
  const display = document.getElementById('stars-display');
  display.innerHTML = '';
  for (let i = 1; i <= 3; i++) {
    const span = document.createElement('span');
    span.className = `star-icon star-large ${i <= stars ? 'star-filled' : 'star-empty'}`;
    span.textContent = i <= stars ? '*' : '.';
    display.appendChild(span);
    setTimeout(() => span.classList.add('appear', `appear-delay-${i}`), 50 * i);
  }
}

// ============================================================
// XP FLOAT LABEL
// ============================================================

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

function hideStreakBanner() {
  const banner = document.getElementById('streak-banner');
  banner.classList.add('hidden');
  banner.classList.remove('entering', 'exiting');
  if (streakBannerTimeout) clearTimeout(streakBannerTimeout);
}

// ============================================================
// MODAL
// ============================================================

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

function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ============================================================
// CODE RAIN CANVAS (bash commands)
// ============================================================

const CODE_RAIN_WORDS = [
  'ls', 'grep', 'chmod', 'sudo', 'awk', 'find', 'kill', 'sed',
  'cat', 'ps', 'cd', 'rm', 'man', 'ssh', 'curl', 'top', 'env',
  'apt', 'bash', 'echo', 'mkdir', 'touch', 'tail', 'head', 'wc',
  'sort', 'uniq', 'cut', 'tar', 'df', 'du', 'cp', 'mv', 'uname',
  'whoami', 'export', 'chmod', 'chown', '2>/dev/null', '|', '>>',
  '$PATH', '$HOME', '$USER', 'systemctl', 'crontab', 'journalctl',
  './run.sh', '#!', '-la', '-aux', 'root', '/etc/', '/var/log',
];

let rainDrops = [];
let rainAnimFrame = null;

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
        speed: 0.3 + Math.random() * 0.7,
        word: CODE_RAIN_WORDS[Math.floor(Math.random() * CODE_RAIN_WORDS.length)],
        opacity: 0.2 + Math.random() * 0.5,
        size: 9 + Math.floor(Math.random() * 5),
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    rainDrops.forEach(drop => {
      ctx.globalAlpha = drop.opacity * 0.7;
      ctx.fillStyle = '#00ff41';
      ctx.font = `${drop.size}px "Fira Code", "Share Tech Mono", monospace`;
      ctx.fillText(drop.word, drop.x, drop.y);
      drop.y += drop.speed;
      if (drop.y > canvas.height + 40) {
        drop.y = -40;
        drop.x = Math.random() * canvas.width;
        drop.word = CODE_RAIN_WORDS[Math.floor(Math.random() * CODE_RAIN_WORDS.length)];
        drop.speed = 0.3 + Math.random() * 0.7;
        drop.opacity = 0.15 + Math.random() * 0.4;
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

function stopCodeRain() {
  if (rainAnimFrame) {
    cancelAnimationFrame(rainAnimFrame);
    rainAnimFrame = null;
  }
}

// ============================================================
// UTILITY
// ============================================================

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fadeIn(el) {
  el.classList.remove('fade-in');
  void el.offsetWidth;
  el.classList.add('fade-in');
}
