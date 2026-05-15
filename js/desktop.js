'use strict';

/* ============================================================
   SASP HUB OS — Desktop Environment
   ============================================================ */

// ── Responsive Scale System ──────────────────────────────────
// The entire #desktop is scaled via CSS transform so the OS
// fits any viewport size. All mouse events report viewport
// coordinates; offsetLeft/Top report desktop (pre-transform)
// coordinates. Use _mx() to convert viewport→desktop space.
let DESKTOP_REF_W = 1920;
let DESKTOP_REF_H = 1080;
let _desktopScale = 1;

function _mx(v) { return v / _desktopScale; }

function _updateDesktopScale() {
  const s = Math.min(window.innerWidth / DESKTOP_REF_W, window.innerHeight / DESKTOP_REF_H);
  _desktopScale = Math.max(0.25, s); // floor at 25%, no ceiling (scales up on bigger screens)
  const desktop = document.getElementById('desktop');
  if (!desktop) return;
  desktop.style.width     = (window.innerWidth  / _desktopScale) + 'px';
  desktop.style.height    = (window.innerHeight / _desktopScale) + 'px';
  desktop.style.transform = `scale(${_desktopScale})`;

  // Re-maximize any currently maximized windows to fill the new desktop size
  if (typeof Desktop !== 'undefined' && Desktop.wm) {
    const newW = Math.round(window.innerWidth  / _desktopScale);
    const newH = Math.round(window.innerHeight / _desktopScale);
    for (const win of Object.values(Desktop.wm.windows)) {
      if (win.maximized) {
        win.el.style.width  = newW + 'px';
        win.el.style.height = (newH - 48) + 'px';
      }
    }
  }
}

window.addEventListener('resize', _updateDesktopScale);

// ── App Manifest ────────────────────────────────────────────
const APPS = [
  {
    id:        'mdt',
    name:      'MDT',
    icon:      'fa-solid fa-shield-halved',
    url:       'apps/mdt/index.html',
    width:     1400,
    height:    860,
    minWidth:  900,
    minHeight: 580
  },
  {
    id:        'notepad',
    name:      'Notepad',
    icon:      'fa-solid fa-file-lines',
    url:       'apps/notepad/index.html',
    width:     780,
    height:    520,
    minWidth:  480,
    minHeight: 320
  },
  {
    id:               'kalkulator',
    name:             'Kalkulačka',
    icon:             'fa-solid fa-calculator',
    url:              'apps/kalkulator/index.html',
    width:            340,
    height:           520,
    minWidth:         300,
    minHeight:        440,
    resizeCornersOnly: true
  },
  {
    id:        'malovani',
    name:      'Malování',
    icon:      'fa-solid fa-paintbrush',
    url:       'apps/malovani/index.html',
    width:     1000,
    height:    700,
    minWidth:  600,
    minHeight: 420
  }
];

// ── Auth ─────────────────────────────────────────────────────
const Auth = {
  KEY: 'saspHub_officer_v1',
  _data: null,

  load() {
    // Try localStorage (remembered)
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) { this._data = JSON.parse(raw); return true; }
    } catch (e) {}
    // Try sessionStorage (logged in this tab but not remembered)
    try {
      const raw = sessionStorage.getItem(this.KEY);
      if (raw) { this._data = JSON.parse(raw); return true; }
    } catch (e) {}
    return false;
  },

  save(badge, firstName, lastName, remember) {
    this._data = { badge, firstName, lastName };
    // Always write to localStorage so iframes (MDT etc.) can read it
    localStorage.setItem(this.KEY, JSON.stringify(this._data));
    // sessionStorage mirrors it; cleared on tab close if not remembered
    sessionStorage.setItem(this.KEY, JSON.stringify(this._data));
    if (!remember) {
      // Mark for cleanup on unload
      sessionStorage.setItem(this.KEY + '_noremember', '1');
    } else {
      sessionStorage.removeItem(this.KEY + '_noremember');
    }
  },

  get() { return this._data; }
};

// ── Clock ─────────────────────────────────────────────────────
const Clock = {
  DAYS:   ['Neděle','Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota'],
  MONTHS: ['ledna','února','března','dubna','května','června',
           'července','srpna','září','října','listopadu','prosince'],

  tick() {
    const now = new Date();
    const hh  = String(now.getHours()).padStart(2,'0');
    const mm  = String(now.getMinutes()).padStart(2,'0');
    const time = `${hh}:${mm}`;
    const dateL = `${this.DAYS[now.getDay()]}, ${now.getDate()}. ${this.MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    const dd = String(now.getDate()).padStart(2,'0');
    const mo = String(now.getMonth()+1).padStart(2,'0');
    const dateS = `${dd}.${mo}.${now.getFullYear()}`;

    const el = id => document.getElementById(id);
    const loginClock = el('loginClock');
    const loginDate  = el('loginDate');
    const tbTime     = el('tbTime');
    const tbDate     = el('tbDate');
    if (loginClock) loginClock.textContent = time;
    if (loginDate)  loginDate.textContent  = dateL;
    if (tbTime)     tbTime.textContent     = time;
    if (tbDate)     tbDate.textContent     = dateS;
  },

  start() {
    this.tick();
    setInterval(() => this.tick(), 1000);
  }
};

// ── Boot ─────────────────────────────────────────────────────
const Boot = {
  LINES: [
    { text: 'SASP HUB OS  v1.0.0',                             cls: 'boot-line-title', delay: 0   },
    { text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', cls: 'boot-line-sep',   delay: 200 },
    { text: '[  OK  ] Spouštění jádra systému',                 cls: 'boot-line-ok',   delay: 550 },
    { text: '[  OK  ] Načítání systémové konfigurace',          cls: 'boot-line-ok',   delay: 850 },
    { text: '[  OK  ] Inicializace souborového systému',        cls: 'boot-line-ok',   delay: 1100 },
    { text: '[  OK  ] Spouštění síťových služeb',               cls: 'boot-line-ok',   delay: 1380 },
    { text: '[  OK  ] Připojování k SASP dispatch síti',        cls: 'boot-line-ok',   delay: 1650 },
    { text: '[ INFO ] Načítání aplikační sady SASP...',         cls: 'boot-line-info', delay: 1940 },
    { text: '[  OK  ] MDT Terminál               — připraven',  cls: 'boot-line-ok',   delay: 2200 },
    { text: '[  OK  ] Notepad                    — připraven',  cls: 'boot-line-ok',   delay: 2340 },
    { text: '[  OK  ] Kalkulačka                 — připravena', cls: 'boot-line-ok',   delay: 2420 },
    { text: '[  OK  ] Malování                   — připraveno', cls: 'boot-line-ok',   delay: 2500 },
    { text: '[ INFO ] Všechny systémy funkční',                 cls: 'boot-line-info', delay: 2640 },
    { text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', cls: 'boot-line-sep',   delay: 2720 },
  ],

  run(onDone) {
    const container = document.getElementById('bootLines');
    this.LINES.forEach(line => {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = `boot-line ${line.cls}`;
        el.textContent = line.text;
        container.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
      }, line.delay);
    });
    const total = this.LINES[this.LINES.length - 1].delay + 700;
    setTimeout(() => {
      const overlay = document.getElementById('bootOverlay');
      overlay.style.transition = 'opacity 0.55s ease';
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.style.display = 'none'; onDone(); }, 580);
    }, total);
  }
};

// ── Window Manager ────────────────────────────────────────────
class WindowManager {
  constructor() {
    this.windows        = {};
    this.zCounter       = 100;
    this._pendingRestore = {};
    this._restoring      = false;
    this._setupGlobalListeners();
  }

  open(app) {
    // If already open — focus or unminimize
    if (this.windows[app.id]) {
      const win = this.windows[app.id];
      if (win.minimized) this._unminimize(app.id);
      else               this._focus(app.id);
      return;
    }

    // Calculate position (cascade stagger or restored values)
    const restore = this._pendingRestore[app.id];
    const count = Object.keys(this.windows).length;
    const dW    = window.innerWidth  / _desktopScale;
    const dH    = window.innerHeight / _desktopScale;
    const maxW  = dW - 80;
    const maxH  = dH - 90;
    const w = restore ? restore.width  : Math.min(app.width  || 1000, maxW);
    const h = restore ? restore.height : Math.min(app.height || 700,  maxH);
    const x = restore ? restore.left   : Math.max(20, Math.round((dW - w) / 2) + count * 28);
    const y = restore ? restore.top    : Math.max(10, Math.round((dH - 48 - h) / 2) + count * 22);

    // Build window element
    const el = document.createElement('div');
    el.className   = 'window';
    el.dataset.appId = app.id;
    el.style.cssText = `width:${w}px;height:${h}px;left:${x}px;top:${y}px;z-index:${++this.zCounter}`;

    el.innerHTML = `
      <div class="win-titlebar">
        <div class="win-title-left">
          <i class="${app.icon} win-title-icon"></i>
          <span class="win-title-text">${app.name}</span>
        </div>
        <div class="win-controls">
          <button class="win-btn win-min" data-action="minimize" data-id="${app.id}" title="Minimalizovat">
            <i class="fa-solid fa-minus"></i>
          </button>
          <button class="win-btn win-max" data-action="maximize" data-id="${app.id}" title="Maximalizovat">
            <i class="fa-regular fa-square"></i>
          </button>
          <button class="win-btn win-close" data-action="close" data-id="${app.id}" title="Zavřít">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
      <div class="win-body">
        <iframe
          src="${app.url}?hub=1${Auth._data ? `&badge=${encodeURIComponent(Auth._data.badge)}&firstName=${encodeURIComponent(Auth._data.firstName)}&lastName=${encodeURIComponent(Auth._data.lastName)}` : ''}"
          class="win-iframe"
          title="${app.name}"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads"
        ></iframe>
      </div>
      ${app.resizeCornersOnly
        ? `<div class="win-rh win-rh-ne" data-dir="ne"></div>
           <div class="win-rh win-rh-se" data-dir="se"></div>
           <div class="win-rh win-rh-sw" data-dir="sw"></div>
           <div class="win-rh win-rh-nw" data-dir="nw"></div>`
        : `<div class="win-rh win-rh-n"  data-dir="n"></div>
           <div class="win-rh win-rh-ne" data-dir="ne"></div>
           <div class="win-rh win-rh-e"  data-dir="e"></div>
           <div class="win-rh win-rh-se" data-dir="se"></div>
           <div class="win-rh win-rh-s"  data-dir="s"></div>
           <div class="win-rh win-rh-sw" data-dir="sw"></div>
           <div class="win-rh win-rh-w"  data-dir="w"></div>
           <div class="win-rh win-rh-nw" data-dir="nw"></div>`}
    `;

    document.getElementById('windowsContainer').appendChild(el);

    // Register
    this.windows[app.id] = {
      el, app,
      minimized: false,
      maximized: false,
      prevRect: null,
      taskbarBtn: null
    };

    this._setupDrag(el.querySelector('.win-titlebar'), el, app.id);
    this._setupResize(el, app);
    el.addEventListener('mousedown', () => this._focus(app.id));

    if (TaskbarPins.isPinned(app.id)) {
      const pinBtn = document.querySelector(`#taskbarPins [data-pin-id="${app.id}"]`);
      if (pinBtn) {
        pinBtn.classList.add('running');
        pinBtn.classList.remove('minimized');
        this.windows[app.id].taskbarBtn = pinBtn;
      }
    } else {
      this._addTaskbarBtn(app);
    }
    this._focusVisuals(app.id);
    if (!this._restoring) this._persistState();
  }

  // ── Focus ──────────────────────────────────────────────────
  _focus(id) {
    if (!this.windows[id]) return;
    this.windows[id].el.style.zIndex = ++this.zCounter;
    this._focusVisuals(id);
  }

  _focusVisuals(id) {
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    this.windows[id]?.el.classList.add('focused');
    document.querySelectorAll('.tb-win-btn, .tb-pin-btn').forEach(b => b.classList.remove('active'));
    this.windows[id]?.taskbarBtn?.classList.add('active');
  }

  // ── Minimize ───────────────────────────────────────────────
  _minimize(id) {
    if (!this.windows[id]) return;
    const win = this.windows[id];
    win.el.classList.add('win-minimizing');
    setTimeout(() => {
      win.el.style.display = 'none';
      win.el.classList.remove('win-minimizing');
    }, 150);
    win.minimized = true;
    win.taskbarBtn?.classList.remove('active');
    win.taskbarBtn?.classList.add('minimized');
  }

  _unminimize(id) {
    if (!this.windows[id]) return;
    const win = this.windows[id];
    win.el.style.display = '';
    win.minimized = false;
    win.taskbarBtn?.classList.remove('minimized');
    this._focus(id);
  }

  // ── Maximize ───────────────────────────────────────────────
  _maximize(id) {
    if (!this.windows[id]) return;
    const win = this.windows[id];
    if (win.maximized) {
      const r = win.prevRect;
      win.el.style.cssText = `width:${r.w}px;height:${r.h}px;left:${r.x}px;top:${r.y}px;z-index:${win.el.style.zIndex}`;
      win.el.classList.remove('maximized');
      win.maximized = false;
    } else {
      win.prevRect = {
        w: win.el.offsetWidth,  h: win.el.offsetHeight,
        x: win.el.offsetLeft,   y: win.el.offsetTop
      };
      const mdW = Math.round(window.innerWidth  / _desktopScale);
      const mdH = Math.round(window.innerHeight / _desktopScale);
      win.el.style.cssText = `width:${mdW}px;height:${mdH - 48}px;left:0;top:0;z-index:${win.el.style.zIndex}`;
      win.el.classList.add('maximized');
      win.maximized = true;
    }
  }

  // ── Close ──────────────────────────────────────────────────
  _close(id) {
    if (!this.windows[id]) return;
    const win = this.windows[id];
    win.el.remove();
    if (TaskbarPins.isPinned(id)) {
      const pinBtn = document.querySelector(`#taskbarPins [data-pin-id="${id}"]`);
      if (pinBtn) pinBtn.classList.remove('running', 'active', 'minimized');
    } else {
      win.taskbarBtn?.remove();
    }
    delete this.windows[id];
    this._persistState();
  }

  // ── Taskbar Button ─────────────────────────────────────────
  _addTaskbarBtn(app) {
    const btn = document.createElement('button');
    btn.className    = 'tb-win-btn active';
    btn.dataset.appId = app.id;
    btn.title        = app.name;
    btn.innerHTML    = `<i class="${app.icon}"></i><span>${app.name}</span>`;
    btn.addEventListener('click', () => {
      const win = this.windows[app.id];
      if (!win) return;
      if (win.minimized) {
        this._unminimize(app.id);
      } else if (parseInt(win.el.style.zIndex) >= this.zCounter && !win.minimized) {
        this._minimize(app.id);
      } else {
        this._focus(app.id);
      }
    });
    btn.addEventListener('contextmenu', e => {
      e.preventDefault(); e.stopPropagation();
      ContextMenu._showTaskbarWinMenu(_mx(e.clientX), _mx(e.clientY), app.id);
    });
    document.getElementById('taskbarWindows').appendChild(btn);
    this.windows[app.id].taskbarBtn = btn;
  }

  // ── Drag ───────────────────────────────────────────────────
  _setupDrag(titlebar, winEl, id) {
    titlebar.addEventListener('mousedown', e => {
      if (e.target.closest('.win-controls')) return;
      const win = this.windows[id];
      if (!win || win.maximized) return;
      e.preventDefault();
      this._focus(id);
      const ox = _mx(e.clientX) - winEl.offsetLeft;
      const oy = _mx(e.clientY) - winEl.offsetTop;
      const onMove = e => {
        winEl.style.left = (_mx(e.clientX) - ox) + 'px';
        winEl.style.top  = Math.max(0, _mx(e.clientY) - oy) + 'px';
      };
      const stopDrag = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', stopDrag);
        document.querySelectorAll('.win-iframe').forEach(f => f.style.pointerEvents = '');
      };
      document.querySelectorAll('.win-iframe').forEach(f => f.style.pointerEvents = 'none');
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', stopDrag);
    });
    // Double-click titlebar → maximize/restore
    titlebar.addEventListener('dblclick', e => {
      if (e.target.closest('.win-controls')) return;
      this._maximize(id);
    });
  }

  // ── Resize ─────────────────────────────────────────────────
  _setupResize(winEl, app) {
    winEl.querySelectorAll('.win-rh').forEach(handle => {
      handle.addEventListener('mousedown', e => {
        e.stopPropagation(); e.preventDefault();
        const win = this.windows[app.id];
        if (!win || win.maximized) return;
        this._focus(app.id);
        const dir        = handle.dataset.dir;
        const sw         = winEl.offsetWidth,  sh = winEl.offsetHeight;
        const initLeft   = winEl.offsetLeft,   initTop = winEl.offsetTop;
        // Anchored edges — these never move during this resize operation
        const rightEdge  = initLeft + sw;
        const bottomEdge = initTop  + sh;
        const minW       = app.minWidth  || 300;
        const minH       = app.minHeight || 200;
        const onMove = e => {
          let newW = sw, newH = sh, newX = initLeft, newY = initTop;
          // Compute size directly from mouse→fixed-edge distance → no dead zone at min size
          if (dir.includes('e')) { newW = Math.max(minW, _mx(e.clientX) - initLeft);  }
          if (dir.includes('s')) { newH = Math.max(minH, _mx(e.clientY) - initTop);   }
          if (dir.includes('w')) { newW = Math.max(minW, rightEdge  - _mx(e.clientX)); newX = rightEdge  - newW; }
          if (dir.includes('n')) { newH = Math.max(minH, bottomEdge - _mx(e.clientY)); newY = bottomEdge - newH; }
          winEl.style.width  = newW + 'px';
          winEl.style.height = newH + 'px';
          winEl.style.left   = newX + 'px';
          winEl.style.top    = Math.max(0, newY) + 'px';
        };
        const stopResize = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup',   stopResize);
          // Re-enable iframe pointer events
          document.querySelectorAll('.win-iframe').forEach(f => f.style.pointerEvents = '');
          this._persistState();
        };
        // Disable iframe pointer events so fast mouse moves don't get swallowed by the iframe
        document.querySelectorAll('.win-iframe').forEach(f => f.style.pointerEvents = 'none');
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   stopResize);
      });
    });
  }

  // ── Persist / Restore open windows ───────────────────────────
  _persistState() {
    if (this._restoring) return;
    const state = {};
    for (const [id, win] of Object.entries(this.windows)) {
      if (!APPS.find(a => a.id === id)) continue;
      const el = win.el;
      state[id] = {
        left:      win.maximized && win.prevRect ? win.prevRect.x : el.offsetLeft,
        top:       win.maximized && win.prevRect ? win.prevRect.y : el.offsetTop,
        width:     win.maximized && win.prevRect ? win.prevRect.w : el.offsetWidth,
        height:    win.maximized && win.prevRect ? win.prevRect.h : el.offsetHeight,
        minimized: win.minimized,
        maximized: win.maximized,
        prevRect:  win.prevRect,
        zIndex:    parseInt(el.style.zIndex) || 100
      };
    }
    try { sessionStorage.setItem('saspHub_openWindows_v1', JSON.stringify(state)); } catch(e) {}
  }

  _restoreState() {
    try {
      const raw = sessionStorage.getItem('saspHub_openWindows_v1');
      if (!raw) return;
      const state = JSON.parse(raw);
      const entries = Object.entries(state).sort((a, b) => (a[1].zIndex || 0) - (b[1].zIndex || 0));
      this._restoring = true;
      for (const [id, s] of entries) {
        const app = APPS.find(a => a.id === id);
        if (!app) continue;
        this._pendingRestore[id] = s;
        this.open(app);
        delete this._pendingRestore[id];
        const win = this.windows[id];
        if (!win) continue;
        if (s.maximized && s.prevRect) {
          win.prevRect  = s.prevRect;
          const rsW = Math.round(window.innerWidth  / _desktopScale);
          const rsH = Math.round(window.innerHeight / _desktopScale);
          win.el.style.cssText = `width:${rsW}px;height:${rsH - 48}px;left:0;top:0;z-index:${win.el.style.zIndex}`;
          win.el.classList.add('maximized');
          win.maximized = true;
        }
        if (s.minimized) {
          win.el.style.display = 'none';
          win.minimized = true;
          win.taskbarBtn?.classList.remove('active');
          win.taskbarBtn?.classList.add('minimized');
        }
      }
      this._restoring = false;
      this._persistState();
    } catch(e) { this._restoring = false; }
  }

  // ── Global button listener ─────────────────────────────────
  _setupGlobalListeners() {
    document.addEventListener('click', e => {
      const btn    = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id     = btn.dataset.id;
      if (!id) return;
      if (action === 'minimize') this._minimize(id);
      if (action === 'maximize') this._maximize(id);
      if (action === 'close')    this._close(id);
    });
  }
}

// ── System ────────────────────────────────────────────────────
const System = {
  logout() {
    localStorage.removeItem(Auth.KEY);
    sessionStorage.removeItem(Auth.KEY);
    sessionStorage.removeItem('saspHub_openWindows_v1');
    Auth._data = null;
    sessionStorage.setItem('saspHub_skipBoot', '1');
    location.reload();
  },

  shutdown() {
    document.getElementById('launcherPopup').style.display = 'none';
    const desk = document.getElementById('desktop');
    desk.style.transition = 'opacity 0.5s ease';
    desk.style.opacity = '0';
    const overlay = document.getElementById('shutdownOverlay');
    setTimeout(() => {
      desk.style.display = 'none';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.7s ease';
      overlay.style.display = 'flex';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        overlay.style.opacity = '1';
      }));
      // window.close() is blocked by browsers for user-opened tabs
      setTimeout(() => {
        const icon = overlay.querySelector('.shutdown-icon');
        if (icon) icon.addEventListener('click', () => System.powerOn());
      }, 800);
    }, 500);
  },

  powerOn() {
    const overlay = document.getElementById('shutdownOverlay');
    overlay.style.transition = 'opacity 0.5s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.style.opacity = '';
      const desk = document.getElementById('desktop');
      desk.style.opacity = '0';
      desk.style.display = 'block';
      desk.style.transition = 'opacity 0.5s ease';
      requestAnimationFrame(() => requestAnimationFrame(() => { desk.style.opacity = '1'; }));
    }, 500);
  }
};
// ── Avatar Settings ─────────────────────────────────────────
const AvatarSettings = {
  KEY: 'saspHub_avatar_v1',

  get() {
    try { return localStorage.getItem(this.KEY) || null; } catch (e) { return null; }
  },

  applyFromStorage() {
    this._applyAll(this.get());
  },

  _applyAll(dataUrl) {
    [
      ['launcherAvatarIcon', 'launcherAvatarImg'],
      ['owAvatarIcon',       'owAvatarImg'],
      ['avatarPreviewIcon',  'avatarPreviewImg']
    ].forEach(([iconId, imgId]) => {
      const icon = document.getElementById(iconId);
      const img  = document.getElementById(imgId);
      if (!icon || !img) return;
      if (dataUrl) {
        img.src          = dataUrl;
        img.style.display  = 'block';
        icon.style.display = 'none';
      } else {
        img.style.display  = 'none';
        icon.style.display = '';
      }
    });
  },

  _updatePreview() {
    const icon = document.getElementById('avatarPreviewIcon');
    const img  = document.getElementById('avatarPreviewImg');
    if (!icon || !img) return;
    const dataUrl = this.get();
    if (dataUrl) {
      img.src = dataUrl;
      img.style.display  = 'block';
      icon.style.display = 'none';
    } else {
      img.style.display  = 'none';
      icon.style.display = '';
    }
  },

  _onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this._showError('Vyberte pros\u00edm soubor obr\u00e1zku (JPG, PNG, WebP \u2026)');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      try {
        localStorage.setItem(this.KEY, dataUrl);
      } catch (err) {
        this._showError('Obr\u00e1zek je p\u0159\u00edli\u0161 velk\u00fd pro ulo\u017een\u00ed. Pou\u017eijte men\u0161\u00ed soubor.');
        return;
      }
      this._applyAll(dataUrl);
      this._hideError();
    };
    reader.readAsDataURL(file);
  },

  _reset() {
    localStorage.removeItem(this.KEY);
    this._applyAll(null);
    this._hideError();
  },

  _showError(msg) {
    const el = document.getElementById('avatarError');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  },

  _hideError() {
    const el = document.getElementById('avatarError');
    if (el) el.style.display = 'none';
  }
};

// ── Theme Settings ───────────────────────────────────────────
const ThemeSettings = {
  init() {
    this._updateTileStates();
    const grid = document.getElementById('themeGrid');
    if (!grid) return;
    grid.addEventListener('click', e => {
      const tile = e.target.closest('.theme-tile');
      if (!tile) return;
      if (tile.classList.contains('theme-tile--disabled')) return;
      const id = tile.dataset.themeId;
      if (!id) return;
      ThemeEngine.applyTheme(id);
      this._updateTileStates();
    });
  },

  _updateTileStates() {
    const current = ThemeEngine.currentTheme();
    document.querySelectorAll('.theme-tile').forEach(tile => {
      tile.classList.toggle('active', tile.dataset.themeId === current);
    });
  }
};

// ── Wallpaper Settings ────────────────────────────────────────
const WallpaperSettings = {
  KEY: 'saspHub_wallpaper_v1',

  DEFAULT_BG: 'assets/sasp_logo.png',

  applyFromStorage() {
    try {
      const saved = localStorage.getItem(this.KEY);
      this._apply(saved || null);
    } catch (e) { this._apply(null); }
  },

  _apply(dataUrl) {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    const src = dataUrl || this.DEFAULT_BG;
    desktop.style.backgroundImage    = `url(${src})`;
    desktop.style.backgroundSize     = dataUrl ? 'cover' : '30%';
    desktop.style.backgroundPosition = 'center';
    desktop.style.backgroundRepeat   = 'no-repeat';
  },

  show() {
    const modal = document.getElementById('settingsModal');
    modal.style.display = 'flex';
    this._updatePreview();
    AvatarSettings._updatePreview();
    ThemeSettings._updateTileStates();
    ThemeSettings.init();

    document.getElementById('settingsCloseBtn').onclick = () => this.hide();
    modal.querySelector('.settings-backdrop').onclick   = () => this.hide();
    document.getElementById('wallpaperResetBtn').onclick = () => this._reset();
    document.getElementById('avatarResetBtn').onclick   = () => AvatarSettings._reset();

    const fileInput = document.getElementById('wallpaperInput');
    // Replace to avoid duplicate listeners
    const fresh = fileInput.cloneNode(true);
    fileInput.replaceWith(fresh);
    fresh.addEventListener('change', e => this._onFileChange(e));

    const avatarInput = document.getElementById('avatarInput');
    const freshAvatar = avatarInput.cloneNode(true);
    avatarInput.replaceWith(freshAvatar);
    freshAvatar.addEventListener('change', e => AvatarSettings._onFileChange(e));
  },

  hide() {
    document.getElementById('settingsModal').style.display = 'none';
  },

  _updatePreview() {
    const box   = document.getElementById('wallpaperPreview');
    const label = document.getElementById('wallpaperPreviewLabel');
    try {
      const saved = localStorage.getItem(this.KEY);
      if (saved) {
        box.style.backgroundImage    = `url(${saved})`;
        box.style.backgroundSize     = 'cover';
        box.style.backgroundPosition = 'center';
        box.style.backgroundRepeat   = '';
        if (label) label.textContent = 'Vlastn\u00ed tapeta';
      } else {
        box.style.backgroundImage    = `url(${this.DEFAULT_BG})`;
        box.style.backgroundSize     = '30%';
        box.style.backgroundPosition = 'center';
        box.style.backgroundRepeat   = 'no-repeat';
        if (label) label.textContent = 'V\u00fdchoz\u00ed tapeta (SASP)';
      }
    } catch (e) {}
  },

  _onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this._showError('Vyberte pros\u00edm soubor obr\u00e1zku (JPG, PNG, WebP \u2026)');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      try {
        localStorage.setItem(this.KEY, dataUrl);
      } catch (err) {
        this._showError('Obr\u00e1zek je p\u0159\u00edli\u0161 velk\u00fd pro ulo\u017een\u00ed. Pou\u017eijte men\u0161\u00ed soubor.');
        return;
      }
      this._apply(dataUrl);
      this._updatePreview();
      this._hideError();
    };
    reader.readAsDataURL(file);
  },

  _reset() {
    localStorage.removeItem(this.KEY);
    this._apply(null);
    this._updatePreview();
    this._hideError();
  },

  _showError(msg) {
    const el = document.getElementById('wallpaperError');
    el.textContent    = msg;
    el.style.display  = 'block';
  },

  _hideError() {
    const el = document.getElementById('wallpaperError');
    if (el) el.style.display = 'none';
  }
};
// ── Desktop Grid ────────────────────────────────────────────
const GRID_W  = 106;
const GRID_H  = 112;
const GRID_PX = 14;
const GRID_PY = 14;

function gridSnap(x, y) {
  const col = Math.max(0, Math.round((x - GRID_PX) / GRID_W));
  const row = Math.max(0, Math.round((y - GRID_PY) / GRID_H));
  return { x: GRID_PX + col * GRID_W, y: GRID_PY + row * GRID_H };
}

function gridFreeSlot(excludeIds = []) {
  const used = new Set();
  Object.entries(DesktopItems._positions).forEach(([id, pos]) => {
    if (excludeIds.includes(id)) return;
    const col = Math.max(0, Math.round((pos.x - GRID_PX) / GRID_W));
    const row = Math.max(0, Math.round((pos.y - GRID_PY) / GRID_H));
    used.add(`${col},${row}`);
  });
  const maxRows = Math.max(3, Math.floor((window.innerHeight / _desktopScale - 48 - GRID_PY * 2) / GRID_H));
  for (let col = 0; col < 30; col++) {
    for (let row = 0; row < maxRows; row++) {
      if (!used.has(`${col},${row}`)) return { x: GRID_PX + col * GRID_W, y: GRID_PY + row * GRID_H };
    }
  }
  return { x: GRID_PX, y: GRID_PY };
}

// ── Desktop Items (custom folders / text docs on desktop) ─────
const DesktopItems = {
  KEY:       'saspHub_desktopItems_v1',
  NAMES_KEY: 'saspHub_iconNames_v1',
  POS_KEY:   'saspHub_iconPositions_v1',
  _items: [],
  _names: {},
  _positions: {},

  load() {
    try { this._items     = JSON.parse(localStorage.getItem(this.KEY))       || []; } catch(e) { this._items = []; }
    try { this._names     = JSON.parse(localStorage.getItem(this.NAMES_KEY))  || {}; } catch(e) { this._names = {}; }
    try { this._positions = JSON.parse(localStorage.getItem(this.POS_KEY))    || {}; } catch(e) { this._positions = {}; }
  },

  _save()      { localStorage.setItem(this.KEY,       JSON.stringify(this._items)); },
  _saveNames() { localStorage.setItem(this.NAMES_KEY, JSON.stringify(this._names)); },
  _savePos()   { localStorage.setItem(this.POS_KEY,   JSON.stringify(this._positions)); },

  labelFor(appId) { return this._names[appId] || null; },
  posFor(id)      { return this._positions[id] || null; },

  setPos(id, x, y) {
    this._positions[id] = { x, y };
    this._savePos();
  },

  createFolder(dropX, dropY) {
    const id = 'custom_' + Date.now();
    let name = 'Nová složka';
    let n = 1;
    const used = this._items.map(i => i.name);
    while (used.includes(name)) { n++; name = `Nová složka (${n})`; }
    const item = { id, type: 'folder', name, folderId: null };
    this._items.push(item);
    if (dropX != null) {
      const s = gridSnap(dropX, dropY);
      this._positions[id] = { x: s.x, y: s.y };
    }
    this._save(); this._savePos();
    const el = this._buildIconEl(item);
    this._appendToDesktop(el, id);
    IconDrag.setup(el);
    setTimeout(() => DesktopItems.rename(el), 80);
  },

  createTextDoc(dropX, dropY) {
    const id = 'custom_' + Date.now();
    let name = 'Nový dokument.txt';
    let n = 1;
    const used = this._items.map(i => i.name);
    while (used.includes(name)) { n++; name = `Nový dokument (${n}).txt`; }
    const item = { id, type: 'textdoc', name, folderId: null };
    this._items.push(item);
    if (dropX != null) {
      const s = gridSnap(dropX, dropY);
      this._positions[id] = { x: s.x, y: s.y };
    }
    this._save(); this._savePos();
    const el = this._buildIconEl(item);
    this._appendToDesktop(el, id);
    IconDrag.setup(el);
    setTimeout(() => DesktopItems.rename(el), 80);
  },

  createNotepadNote(dropX, dropY, noteId) {
    const id = 'custom_' + noteId;
    let name = 'Nová poznámka';
    let n = 1;
    const used = this._items.map(i => i.name);
    while (used.includes(name)) { n++; name = `Nová poznámka (${n})`; }
    const item = { id, type: 'notepadnote', name, noteId, folderId: null };
    this._items.push(item);
    if (dropX != null) {
      const s = gridSnap(dropX, dropY);
      this._positions[id] = { x: s.x, y: s.y };
    }
    this._save(); this._savePos();
    const el = this._buildIconEl(item);
    this._appendToDesktop(el, id);
    IconDrag.setup(el);
    setTimeout(() => DesktopItems.rename(el, () => QuickNote.openNote(noteId)), 80);
  },

  remove(id, iconEl) {
    // Send to Trash instead of permanent delete
    iconEl.remove();
    Trash.send(id);
    Object.keys(FolderManager._explorerWins).forEach(wid => FolderManager._refreshAll(wid));
  },

  rename(iconEl, onCommit) {
    const labelEl = iconEl.querySelector('.di-label');
    if (!labelEl) return;
    const prev = labelEl.textContent;
    const input = document.createElement('input');
    input.type      = 'text';
    input.value     = prev;
    input.className = 'di-rename-input';
    labelEl.replaceWith(input);
    input.focus(); input.select();

    const commit = () => {
      const newName = input.value.trim() || prev;
      const span = document.createElement('span');
      span.className   = 'di-label';
      span.textContent = newName;
      input.replaceWith(span);
      const id = iconEl.dataset.appId;
      const customItem = this._items.find(i => i.id === id);
      if (customItem) {
        customItem.name = newName;
        this._save();
        FolderManager.updateTitle(id, newName);
        if (customItem.type === 'notepadnote' && customItem.noteId) {
          try {
            const raw = localStorage.getItem(QuickNote.STORAGE_KEY);
            const noteArr = raw ? JSON.parse(raw) : [];
            const noteEntry = noteArr.find(n => n.id === customItem.noteId);
            if (noteEntry) {
              noteEntry.title = newName;
              localStorage.setItem(QuickNote.STORAGE_KEY, JSON.stringify(noteArr));
              const iframe = document.querySelector('.window[data-app-id="notepad"] .win-iframe');
              iframe?.contentWindow?.postMessage({ type: 'reloadNotes' }, '*');
            }
          } catch (e) {}
        }
      } else {
        this._names[id] = newName;
        this._saveNames();
      }
      onCommit?.();
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = prev;  input.blur(); }
      e.stopPropagation();
    });
  },

  openItem(item) {
    if (item.type === 'folder') {
      FolderManager.openNew(item);
    } else if (item.type === 'textdoc') {
      const fakeApp = {
        id:        'basicnote_' + item.id,
        name:      item.name,
        icon:      'fa-solid fa-file-lines',
        url:       'apps/basicnote/index.html?docId=' + encodeURIComponent(item.id),
        width:     640, height: 460, minWidth: 320, minHeight: 200
      };
      Desktop.wm.open(fakeApp);
    } else if (item.type === 'notepadnote') {
      QuickNote.openNote(item.noteId);
    }
  },

  moveToFolder(itemId, folderId) {
    const item = this._items.find(i => i.id === itemId);
    if (!item || item.folderId === folderId) return;
    // Prevent moving a folder into itself or any of its descendants
    if (folderId && item.type === 'folder') {
      let cur = folderId;
      while (cur) {
        if (cur === itemId) return;
        cur = this._items.find(i => i.id === cur)?.folderId || null;
      }
    }
    item.folderId = folderId || null;
    if (folderId) delete this._positions[itemId];
    this._save(); this._savePos();
    document.querySelector(`#desktopIcons [data-app-id="${itemId}"]`)?.remove();
    if (!folderId) {
      const el = this._buildIconEl(item);
      this._appendToDesktop(el, itemId);
      IconDrag.setup(el);
    }
    Object.keys(FolderManager._explorerWins).forEach(wid => FolderManager._refreshAll(wid));
  },

  _appendToDesktop(el, id) {
    let pos = this._positions[id];
    if (!pos) {
      pos = gridFreeSlot([id]);
      this._positions[id] = pos;
      this._savePos();
    }
    const s = gridSnap(pos.x, pos.y);
    el.style.left = s.x + 'px';
    el.style.top  = s.y + 'px';
    document.getElementById('desktopIcons').appendChild(el);
  },

  _buildIconEl(item) {
    const iconCls = item.type === 'folder' ? 'fa-solid fa-folder' : 'fa-solid fa-file-lines';
    const el = document.createElement('div');
    el.className      = 'desktop-icon';
    el.dataset.appId  = item.id;
    el.dataset.custom = '1';
    el.dataset.type   = item.type;
    el.innerHTML = `
      <div class="di-icon-wrap"><i class="${iconCls}"></i></div>
      <span class="di-label">${item.name}</span>
    `;
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (!el.classList.contains('selected')) {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        el.classList.add('selected');
      }
    });
    el.addEventListener('dblclick', () => this.openItem(item));
    return el;
  },

  renderAll() {
    // Render only top-level (not in any folder) custom items
    this._items.filter(i => !i.folderId).forEach(item => {
      const el = this._buildIconEl(item);
      this._appendToDesktop(el, item.id);
      IconDrag.setup(el);
    });
  }
};

// ── Folder Manager (Explorer) ─────────────────────────────────
const FolderManager = {
  _explorerWins: {}, // winId → { folderId, history[], histIdx }
  _counter: 0,

  openNew(folderItem) {
    // Focus existing window showing this exact folder
    for (const [wid, st] of Object.entries(this._explorerWins)) {
      if (st.folderId === folderItem.id && Desktop.wm.windows[wid]) {
        Desktop.wm.windows[wid].minimized ? Desktop.wm._unminimize(wid) : Desktop.wm._focus(wid);
        return;
      }
    }
    this._createWindow(folderItem.id);
  },

  _createWindow(startFolderId) {
    const winId = 'explorer_' + (++this._counter);
    const name  = DesktopItems._items.find(i => i.id === startFolderId)?.name || 'Složka';
    const count = Object.keys(Desktop.wm.windows).length;
    const w = 760, h = 500;
    const dW = window.innerWidth  / _desktopScale;
    const dH = window.innerHeight / _desktopScale;
    const x = Math.max(20, Math.round((dW - w) / 2) + count * 28);
    const y = Math.max(10, Math.round((dH - 48 - h) / 2) + count * 22);

    const el = document.createElement('div');
    el.className     = 'window';
    el.dataset.appId = winId;
    el.style.cssText = `width:${w}px;height:${h}px;left:${x}px;top:${y}px;z-index:${++Desktop.wm.zCounter}`;
    el.innerHTML = `
      <div class="win-titlebar">
        <div class="win-title-left">
          <i class="fa-solid fa-folder-open win-title-icon"></i>
          <span class="win-title-text">${name}</span>
        </div>
        <div class="win-controls">
          <button class="win-btn win-min"   data-action="minimize" data-id="${winId}"><i class="fa-solid fa-minus"></i></button>
          <button class="win-btn win-max"   data-action="maximize" data-id="${winId}"><i class="fa-regular fa-square"></i></button>
          <button class="win-btn win-close" data-action="close"    data-id="${winId}"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      <div class="win-body explorer-layout">
        <div class="explorer-sidebar" id="expSidebar_${winId}"></div>
        <div class="explorer-main">
          <div class="explorer-toolbar">
            <button class="exp-nav-btn" id="expBack_${winId}" disabled title="Zpět"><i class="fa-solid fa-arrow-left"></i></button>
            <button class="exp-nav-btn" id="expFwd_${winId}"  disabled title="Vpřed"><i class="fa-solid fa-arrow-right"></i></button>
            <div class="exp-breadcrumb" id="expBreadcrumb_${winId}"></div>
            <div class="exp-toolbar-right">
              <button class="exp-action-btn" data-exp-new="folder"  data-exp-win="${winId}" title="Nová složka"><i class="fa-solid fa-folder-plus"></i></button>
              <button class="exp-action-btn" data-exp-new="textdoc" data-exp-win="${winId}" title="Nový dokument"><i class="fa-solid fa-file-circle-plus"></i></button>
            </div>
          </div>
          <div class="explorer-content" id="expContent_${winId}"><div class="exp-drop-overlay"><i class="fa-solid fa-arrow-down-to-bracket"></i><span>Přesunout sem</span></div></div>
        </div>
      </div>
      <div class="win-resize-handle" data-resize="${winId}"></div>
    `;

    document.getElementById('windowsContainer').appendChild(el);
    const fakeApp = { id: winId, minWidth: 420, minHeight: 300 };
    Desktop.wm.windows[winId] = { el, app: fakeApp, minimized: false, maximized: false, prevRect: null, taskbarBtn: null };
    Desktop.wm._setupDrag(el.querySelector('.win-titlebar'), el, winId);
    Desktop.wm._setupResize(el.querySelector('.win-resize-handle'), el, fakeApp);
    el.addEventListener('mousedown', () => Desktop.wm._focus(winId));
    Desktop.wm._addTaskbarBtn({ id: winId, icon: 'fa-solid fa-folder-open', name });
    Desktop.wm._focusVisuals(winId);

    this._explorerWins[winId] = { folderId: startFolderId, history: [startFolderId], histIdx: 0 };

    document.getElementById(`expBack_${winId}`).addEventListener('click', () => this._goBack(winId));
    document.getElementById(`expFwd_${winId}`).addEventListener('click',  () => this._goFwd(winId));
    el.querySelectorAll('[data-exp-new]').forEach(btn =>
      btn.addEventListener('click', () => this._createItem(winId, btn.dataset.expNew))
    );

    // Drop on content area (item dragged from desktop)
    const content = document.getElementById(`expContent_${winId}`);
    content.addEventListener('dragover', e => e.preventDefault());
    content.addEventListener('drop', e => {
      e.preventDefault();
      const itemId = e.dataTransfer?.getData('text/plain');
      const st = this._explorerWins[winId];
      if (itemId && st && itemId !== st.folderId) DesktopItems.moveToFolder(itemId, st.folderId);
    });

    this._refreshAll(winId);
  },

  _navigateTo(winId, folderId) {
    const st = this._explorerWins[winId];
    if (!st || st.folderId === folderId) return;
    st.history = st.history.slice(0, st.histIdx + 1);
    st.history.push(folderId);
    st.histIdx++;
    st.folderId = folderId;
    this._refreshAll(winId);
  },

  _goBack(winId) {
    const st = this._explorerWins[winId];
    if (!st || st.histIdx <= 0) return;
    st.folderId = st.history[--st.histIdx];
    this._refreshAll(winId);
  },

  _goFwd(winId) {
    const st = this._explorerWins[winId];
    if (!st || st.histIdx >= st.history.length - 1) return;
    st.folderId = st.history[++st.histIdx];
    this._refreshAll(winId);
  },

  _refreshAll(winId) {
    if (!Desktop.wm.windows[winId]) { delete this._explorerWins[winId]; return; }
    this._refreshNavBtns(winId);
    this._refreshTitlebar(winId);
    this._refreshBreadcrumbs(winId);
    this._refreshSidebar(winId);
    this._refreshContent(winId);
  },

  _refreshNavBtns(winId) {
    const st = this._explorerWins[winId]; if (!st) return;
    const back = document.getElementById(`expBack_${winId}`);
    const fwd  = document.getElementById(`expFwd_${winId}`);
    if (back) back.disabled = st.histIdx <= 0;
    if (fwd)  fwd.disabled  = st.histIdx >= st.history.length - 1;
  },

  _refreshTitlebar(winId) {
    const st = this._explorerWins[winId]; if (!st) return;
    const name = st.folderId === null ? 'Plocha' : (DesktopItems._items.find(i => i.id === st.folderId)?.name || 'Složka');
    Desktop.wm.windows[winId]?.el.querySelector('.win-title-text')?.textContent && (
      Desktop.wm.windows[winId].el.querySelector('.win-title-text').textContent = name
    );
    const tb = Desktop.wm.windows[winId]?.taskbarBtn;
    if (tb) tb.querySelector('span').textContent = name;
  },

  _refreshBreadcrumbs(winId) {
    const st = this._explorerWins[winId];
    const bc = document.getElementById(`expBreadcrumb_${winId}`);
    if (!st || !bc) return;
    bc.innerHTML = '';

    const homeBtn = document.createElement('button');
    homeBtn.className = 'bc-seg' + (st.folderId === null ? ' bc-seg--current' : '');
    homeBtn.innerHTML = '<i class="fa-solid fa-desktop"></i><span>Plocha</span>';
    if (st.folderId === null) {
      homeBtn.disabled = true;
    } else {
      homeBtn.addEventListener('click', () => this._navigateTo(winId, null));
    }
    bc.appendChild(homeBtn);

    this._getPath(st.folderId).forEach((folder, idx, arr) => {
      const sep = document.createElement('span');
      sep.className = 'bc-sep-arrow';
      sep.textContent = '›';
      bc.appendChild(sep);

      const seg = document.createElement('button');
      const isCurrent = idx === arr.length - 1;
      seg.className = 'bc-seg' + (isCurrent ? ' bc-seg--current' : '');
      seg.textContent = folder.name;
      if (!isCurrent) seg.addEventListener('click', () => this._navigateTo(winId, folder.id));
      else seg.disabled = true;
      bc.appendChild(seg);
    });
  },

  _getPath(folderId) {
    const path = [];
    let cur = DesktopItems._items.find(i => i.id === folderId);
    while (cur) { path.unshift(cur); cur = cur.folderId ? DesktopItems._items.find(i => i.id === cur.folderId) : null; }
    return path;
  },

  _refreshSidebar(winId) {
    const st = this._explorerWins[winId];
    const sb = document.getElementById(`expSidebar_${winId}`);
    if (!st || !sb) return;
    sb.innerHTML = '<div class="exp-sidebar-title">Složky</div>';

    // Desktop drop target row
    const desktopRow = document.createElement('div');
    desktopRow.className = 'exp-tree-item exp-tree-desktop' + (st.folderId === null ? ' active' : '');
    desktopRow.style.paddingLeft = '8px';
    desktopRow.innerHTML = '<i class="fa-solid fa-desktop exp-tree-icon"></i><span class="exp-tree-label">Plocha</span>';
    desktopRow.addEventListener('click', () => this._navigateTo(winId, null));
    desktopRow.addEventListener('dragover', e => { e.preventDefault(); desktopRow.classList.add('drop-target'); });
    desktopRow.addEventListener('dragleave', () => desktopRow.classList.remove('drop-target'));
    desktopRow.addEventListener('drop', e => {
      e.preventDefault(); desktopRow.classList.remove('drop-target');
      const srcId = e.dataTransfer?.getData('text/plain');
      if (srcId) DesktopItems.moveToFolder(srcId, null);
    });
    sb.appendChild(desktopRow);

    const rootFolders = DesktopItems._items.filter(i => i.type === 'folder' && !i.folderId);
    if (!rootFolders.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:10px 14px;font-size:11px;color:var(--th-text-dim)';
      empty.textContent = 'Žádné složky';
      sb.appendChild(empty);
      return;
    }
    const pathIds = new Set(this._getPath(st.folderId).map(f => f.id));
    const list = document.createElement('div');
    list.className = 'exp-tree-list';
    rootFolders.forEach(f => list.appendChild(this._buildTreeNode(f, 0, winId, pathIds)));
    sb.appendChild(list);
  },

  _buildTreeNode(folder, depth, winId, pathIds) {
    const st = this._explorerWins[winId];
    const children = DesktopItems._items.filter(i => i.type === 'folder' && i.folderId === folder.id);
    const isActive = st?.folderId === folder.id;
    const inPath   = pathIds?.has(folder.id);

    const wrap = document.createElement('div');
    wrap.className = 'exp-tree-wrap';

    const row = document.createElement('div');
    row.className = 'exp-tree-item' + (isActive ? ' active' : '');
    row.style.paddingLeft = (8 + depth * 16) + 'px';

    const expandBtn = document.createElement('span');
    expandBtn.className = 'exp-tree-expand';
    expandBtn.innerHTML = children.length ? '<i class="fa-solid fa-caret-right"></i>' : '';

    const iconEl = document.createElement('i');
    iconEl.className = 'fa-solid fa-folder exp-tree-icon';

    const label = document.createElement('span');
    label.className = 'exp-tree-label';
    label.textContent = folder.name;

    row.append(expandBtn, iconEl, label);
    wrap.appendChild(row);
    row.addEventListener('click', () => this._navigateTo(winId, folder.id));

    // Drop target: drag item onto sidebar folder row
    row.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); row.classList.add('drop-target'); });
    row.addEventListener('dragleave', () => row.classList.remove('drop-target'));
    row.addEventListener('drop', e => {
      e.preventDefault(); e.stopPropagation();
      row.classList.remove('drop-target');
      const srcId = e.dataTransfer?.getData('text/plain');
      if (srcId && srcId !== folder.id) DesktopItems.moveToFolder(srcId, folder.id);
    });

    if (children.length) {
      const childContainer = document.createElement('div');
      childContainer.className = 'exp-tree-children';
      childContainer.style.display = inPath ? '' : 'none';
      if (inPath) {
        expandBtn.querySelector('i')?.classList.replace('fa-caret-right', 'fa-caret-down');
        iconEl.className = 'fa-solid fa-folder-open exp-tree-icon';
      }
      children.forEach(c => childContainer.appendChild(this._buildTreeNode(c, depth + 1, winId, pathIds)));
      wrap.appendChild(childContainer);

      expandBtn.addEventListener('click', e => {
        e.stopPropagation();
        const open = childContainer.style.display !== 'none';
        childContainer.style.display = open ? 'none' : '';
        const caret = expandBtn.querySelector('i');
        if (caret) caret.className = open ? 'fa-solid fa-caret-right' : 'fa-solid fa-caret-down';
        iconEl.className = open ? 'fa-solid fa-folder exp-tree-icon' : 'fa-solid fa-folder-open exp-tree-icon';
      });
    }
    return wrap;
  },

  _refreshContent(winId) {
    const st = this._explorerWins[winId];
    const content = document.getElementById(`expContent_${winId}`);
    if (!st || !content) return;
    content.innerHTML = '<div class="exp-drop-overlay"><i class="fa-solid fa-arrow-down-to-bracket"></i><span>Přesunout sem</span></div>';

    // Allow HTML5 drop of explorer icons into the content area (folder→folder)
    content.addEventListener('dragover', e => { e.preventDefault(); content.classList.add('drop-target'); });
    content.addEventListener('dragleave', e => { if (!content.contains(e.relatedTarget)) content.classList.remove('drop-target'); });
    content.addEventListener('drop', e => {
      e.preventDefault(); content.classList.remove('drop-target');
      const srcId = e.dataTransfer?.getData('text/plain');
      if (srcId && st && srcId !== st.folderId) DesktopItems.moveToFolder(srcId, st.folderId);
    });

    const children = [
      ...DesktopItems._items.filter(i => i.folderId === st.folderId && i.type === 'folder'),
      ...DesktopItems._items.filter(i => i.folderId === st.folderId && i.type !== 'folder')
    ];

    if (!children.length) {
      const empty = document.createElement('div');
      empty.className = 'exp-empty';
      empty.textContent = 'Tato složka je prázdná';
      content.appendChild(empty);
      return;
    }
    children.forEach(item => content.appendChild(this._buildContentIcon(item, winId)));
  },

  _buildContentIcon(item, winId) {
    const iconCls = item.type === 'folder' ? 'fa-solid fa-folder' : 'fa-solid fa-file-lines';
    const el = document.createElement('div');
    el.className      = 'desktop-icon exp-icon';
    el.dataset.appId  = item.id;
    el.dataset.custom = '1';
    el.dataset.type   = item.type;
    el.dataset.expWin = winId;
    el.innerHTML = `<div class="di-icon-wrap"><i class="${iconCls}"></i></div><span class="di-label">${item.name}</span>`;

    el.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll(`#expContent_${winId} .desktop-icon`).forEach(i => i.classList.remove('selected'));
      el.classList.add('selected');
    });
    el.addEventListener('dblclick', () => {
      if (item.type === 'folder') this._navigateTo(winId, item.id);
      else DesktopItems.openItem(item);
    });

    el.setAttribute('draggable', 'true');
    el.addEventListener('dragstart', e => {
      e.stopPropagation();
      e.dataTransfer.setData('text/plain', item.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    if (item.type === 'folder') {
      el.addEventListener('dragover',  e => { e.preventDefault(); e.stopPropagation(); el.classList.add('drop-target'); });
      el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
      el.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation();
        el.classList.remove('drop-target');
        const srcId = e.dataTransfer?.getData('text/plain');
        if (srcId && srcId !== item.id) DesktopItems.moveToFolder(srcId, item.id);
      });
    }
    return el;
  },

  _createItem(winId, type) {
    const st = this._explorerWins[winId]; if (!st) return;
    const id = 'custom_' + Date.now();
    let name = type === 'folder' ? 'Nová složka' : 'Nový dokument.txt';
    let n = 1;
    const used = DesktopItems._items.map(i => i.name);
    while (used.includes(name)) { n++; name = type === 'folder' ? `Nová složka (${n})` : `Nový dokument (${n}).txt`; }
    DesktopItems._items.push({ id, type, name, folderId: st.folderId });
    DesktopItems._save();
    this._refreshContent(winId);
    this._refreshSidebar(winId);
    setTimeout(() => {
      const icon = document.querySelector(`#expContent_${winId} [data-app-id="${id}"]`);
      if (icon) DesktopItems.rename(icon);
    }, 60);
  },

  closeFolder(folderId) {
    Object.entries(this._explorerWins).forEach(([winId, st]) => {
      if (!st.history.includes(folderId)) return;
      const valid = st.history.filter(id => id !== folderId);
      if (!valid.length) {
        if (Desktop.wm.windows[winId]) Desktop.wm._close(winId);
        delete this._explorerWins[winId];
      } else {
        st.history = valid;
        st.histIdx = Math.min(st.histIdx, valid.length - 1);
        st.folderId = valid[st.histIdx];
        this._refreshAll(winId);
      }
    });
  },

  updateTitle() {
    Object.keys(this._explorerWins).forEach(wid => this._refreshAll(wid));
  },

  addIconToWindow(folderId) {
    Object.entries(this._explorerWins).forEach(([wid, st]) => {
      if (st.folderId === folderId) { this._refreshContent(wid); this._refreshSidebar(wid); }
    });
  },

  removeIconFromWindows() {
    Object.keys(this._explorerWins).forEach(wid => { this._refreshContent(wid); this._refreshSidebar(wid); });
  }
};

// ── Icon Drag ─────────────────────────────────────────────────
const IconDrag = {
  // Custom desktop icon: repositionable + drag-to-folder
  setup(el) {
    // HTML5 draggable for dropping into folder windows
    el.setAttribute('draggable', 'true');
    el.addEventListener('dragstart', e => {
      if (el._mouseMoving) { e.preventDefault(); return; }
      e.dataTransfer.setData('text/plain', el.dataset.appId);
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));

    // Mouse drag for repositioning on desktop
    this._addMouseDrag(el, false);

    // Folder drop-target highlight on other folder icons
    el.addEventListener('dragover', e => {
      if (el.dataset.type === 'folder') { e.preventDefault(); el.classList.add('drop-target'); }
    });
    el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
    el.addEventListener('drop', e => {
      e.preventDefault();
      el.classList.remove('drop-target');
      if (el.dataset.type !== 'folder') return;
      const itemId = e.dataTransfer?.getData('text/plain');
      if (itemId && itemId !== el.dataset.appId) {
        DesktopItems.moveToFolder(itemId, el.dataset.appId);
      }
    });
  },

  // Built-in app icon: only repositionable
  setupBuiltIn(el) {
    this._addMouseDrag(el, true);
  },

  _addMouseDrag(el, builtIn) {
    el.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      if (e.target.closest('.di-rename-input')) return;

      const startX = _mx(e.clientX), startY = _mx(e.clientY); // desktop coords
      let moved = false;
      const origLeft = parseInt(el.style.left) || 0;
      const origTop  = parseInt(el.style.top)  || 0;
      const ox = _mx(e.clientX) - origLeft;
      const oy = _mx(e.clientY) - origTop;
      let ghost = null;
      let extras = []; // { el, origLeft, origTop, ghost } for other selected icons

      const onMove = mv => {
        if (!moved && (Math.abs(_mx(mv.clientX) - startX) > 5 || Math.abs(_mx(mv.clientY) - startY) > 5)) {
          moved = true;
          el._mouseMoving = true;
          el.classList.add('dragging');
          el.style.zIndex = '99';

          // Create ghost for primary icon
          // Appended to #desktop so position:fixed re-anchors into desktop coordinate space
          ghost = el.cloneNode(true);
          ghost.className = el.className + ' drag-ghost';
          ghost.style.width  = el.offsetWidth  + 'px';
          ghost.style.height = el.offsetHeight + 'px';
          ghost.style.left   = el.style.left;
          ghost.style.top    = el.style.top;
          document.getElementById('desktop').appendChild(ghost);

          // Multi-drag: also ghost all other selected desktop icons
          if (el.classList.contains('selected')) {
            document.querySelectorAll('#desktopIcons .desktop-icon.selected').forEach(other => {
              if (other === el) return;
              const oL = parseInt(other.style.left) || 0;
              const oT = parseInt(other.style.top)  || 0;
              const oGhost = other.cloneNode(true);
              oGhost.className = other.className + ' drag-ghost';
              oGhost.style.width  = other.offsetWidth  + 'px';
              oGhost.style.height = other.offsetHeight + 'px';
              oGhost.style.left   = other.style.left;
              oGhost.style.top    = other.style.top;
              oGhost.style.zIndex = '98';
              document.getElementById('desktop').appendChild(oGhost);
              other.classList.add('dragging');
              extras.push({ el: other, origLeft: oL, origTop: oT, ghost: oGhost });
            });
          }
        }
        if (!moved) return;

        // Move primary ghost with cursor (in desktop coordinate space)
        const nx = _mx(mv.clientX) - ox;
        const ny = _mx(mv.clientY) - oy;
        if (ghost) {
          ghost.style.left = nx + 'px';
          ghost.style.top  = ny + 'px';
        }

        // Move extra ghosts by same delta (desktop coords)
        const dx = _mx(mv.clientX) - startX;
        const dy = _mx(mv.clientY) - startY;
        extras.forEach(mg => {
          mg.ghost.style.left = (mg.origLeft + dx) + 'px';
          mg.ghost.style.top  = (mg.origTop  + dy) + 'px';
        });

        // Keep actual icons in original place (ghosts do the visual)
        el.style.left = origLeft + 'px';
        el.style.top  = origTop  + 'px';

        // Highlight trash icon under cursor (for all draggable icons)
        // getBoundingClientRect() is viewport space, mv.clientX/Y is viewport space → no _mx needed
        const trashEl = document.getElementById('trashIcon');
        if (trashEl && trashEl !== el) {
          const r = trashEl.getBoundingClientRect();
          trashEl.classList.toggle('drop-target', mv.clientX >= r.left && mv.clientX <= r.right && mv.clientY >= r.top && mv.clientY <= r.bottom);
        }

        if (!builtIn) {
          // Highlight folder icons under cursor (skip selected extras)
          document.querySelectorAll('#desktopIcons .desktop-icon[data-type="folder"]').forEach(f => {
            if (f === el || extras.find(x => x.el === f)) return;
            const r = f.getBoundingClientRect();
            f.classList.toggle('drop-target', mv.clientX >= r.left && mv.clientX <= r.right && mv.clientY >= r.top && mv.clientY <= r.bottom);
          });
          // Highlight open explorer windows under cursor
          document.querySelectorAll('.window[data-app-id^="explorer_"]').forEach(w => {
            const r = w.getBoundingClientRect();
            const over = mv.clientX >= r.left && mv.clientX <= r.right && mv.clientY >= r.top && mv.clientY <= r.bottom;
            w.querySelector('.explorer-content')?.classList.toggle('drop-target', over);
          });
        }
      };

      const onUp = up => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        el._mouseMoving = false;
        if (ghost) { ghost.remove(); ghost = null; }
        extras.forEach(mg => { mg.ghost.remove(); mg.el.classList.remove('dragging'); });

        if (!moved) { extras = []; return; }
        el.classList.remove('dragging');
        el.style.zIndex = '';
        document.querySelectorAll('.desktop-icon.drop-target').forEach(f => f.classList.remove('drop-target'));
        document.querySelectorAll('.explorer-content.drop-target').forEach(c => c.classList.remove('drop-target'));

        // Check if dropped onto trash icon (both getBoundingClientRect and up.clientX/Y are viewport space)
        const trashDrop = document.getElementById('trashIcon');
        if (trashDrop && trashDrop !== el && el.dataset.trash !== '1') {
          const r = trashDrop.getBoundingClientRect();
          if (up.clientX >= r.left && up.clientX <= r.right && up.clientY >= r.top && up.clientY <= r.bottom) {
            el.remove();
            Trash.send(el.dataset.appId);
            extras.forEach(mg => { mg.el.remove(); Trash.send(mg.el.dataset.appId); });
            extras = [];
            return;
          }
        }

        if (!builtIn) {
          // Check if dropped onto an open explorer window
          let explorerTarget = null;
          document.querySelectorAll('.window[data-app-id^="explorer_"]').forEach(w => {
            const r = w.getBoundingClientRect();
            if (up.clientX >= r.left && up.clientX <= r.right && up.clientY >= r.top && up.clientY <= r.bottom) {
              explorerTarget = w.dataset.appId;
            }
          });
          if (explorerTarget) {
            const st = FolderManager._explorerWins[explorerTarget];
            if (st) {
              DesktopItems.moveToFolder(el.dataset.appId, st.folderId);
              extras.forEach(mg => DesktopItems.moveToFolder(mg.el.dataset.appId, st.folderId));
              extras = [];
              return;
            }
          }

          // Check if dropped onto a folder icon
          let targetFolder = null;
          document.querySelectorAll('#desktopIcons .desktop-icon[data-type="folder"]').forEach(f => {
            if (f === el || extras.find(x => x.el === f)) return;
            const r = f.getBoundingClientRect();
            if (up.clientX >= r.left && up.clientX <= r.right && up.clientY >= r.top && up.clientY <= r.bottom) {
              targetFolder = f.dataset.appId;
            }
          });
          if (targetFolder) {
            DesktopItems.moveToFolder(el.dataset.appId, targetFolder);
            extras.forEach(mg => DesktopItems.moveToFolder(mg.el.dataset.appId, targetFolder));
            extras = [];
            return;
          }
        }

        // Snap primary icon to grid (desktop coords)
        const snapped = gridSnap(_mx(up.clientX) - ox, _mx(up.clientY) - oy);
        el.style.left = snapped.x + 'px';
        el.style.top  = snapped.y + 'px';
        DesktopItems.setPos(el.dataset.appId, snapped.x, snapped.y);

        // Snap all extra icons by same delta (desktop coords)
        const dx = _mx(up.clientX) - startX;
        const dy = _mx(up.clientY) - startY;
        extras.forEach(mg => {
          const s = gridSnap(mg.origLeft + dx, mg.origTop + dy);
          mg.el.style.left = s.x + 'px';
          mg.el.style.top  = s.y + 'px';
          DesktopItems.setPos(mg.el.dataset.appId, s.x, s.y);
        });
        extras = [];
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
};

// ── Context Menu ──────────────────────────────────────────────
const ContextMenu = {
  _el: null,

  init() {
    this._el = document.getElementById('contextMenu');

    document.addEventListener('contextmenu', e => {
      // Always block inside non-explorer windows and overlays
      const explorerWin = e.target.closest('.window[data-app-id^="explorer_"]');
      const anyWin      = e.target.closest('.window');

      if (!explorerWin && anyWin)              return; // inside other window
      if (e.target.closest('#taskbar')) { e.preventDefault(); return; }
      if (e.target.closest('#launcherPopup'))  return;
      if (e.target.closest('#settingsModal'))  return;
      if (e.target.closest('#bootOverlay'))    return;
      if (e.target.closest('#loginOverlay'))   return;

      e.preventDefault();

      if (explorerWin) {
        const winId  = explorerWin.dataset.appId;
        const iconEl = e.target.closest('.exp-icon');
        if (iconEl) {
          this._showIconMenu(_mx(e.clientX), _mx(e.clientY), iconEl, winId);
        } else if (e.target.closest('.explorer-content')) {
          this._showExplorerMenu(_mx(e.clientX), _mx(e.clientY), winId);
        }
        return;
      }

      const iconEl = e.target.closest('.desktop-icon');
      if (iconEl) {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        iconEl.classList.add('selected');
        if (iconEl.dataset.trash === '1') {
          this._showTrashMenu(_mx(e.clientX), _mx(e.clientY));
        } else {
          this._showIconMenu(_mx(e.clientX), _mx(e.clientY), iconEl, null);
        }
      } else if (e.target.closest('#desktopIcons') || e.target.closest('#desktop')) {
        this._showDesktopMenu(_mx(e.clientX), _mx(e.clientY));
      }
    });

    document.addEventListener('click',   e => { if (!e.target.closest('#contextMenu')) this.hide(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.hide(); });
  },

  hide() { if (this._el) this._el.style.display = 'none'; },

  _show(x, y, items) {
    const el = this._el;
    el.innerHTML = '';
    items.forEach(item => {
      if (item === 'sep') {
        const sep = document.createElement('div');
        sep.className = 'ctx-sep';
        el.appendChild(sep);
        return;
      }
      const btn = document.createElement('button');
      btn.className = 'ctx-item' + (item.danger ? ' ctx-item--danger' : '');
      if (item.disabled) btn.disabled = true;
      btn.innerHTML = `<i class="${item.icon}"></i><span>${item.label}</span>`;
      btn.addEventListener('click', ev => { ev.stopPropagation(); this.hide(); item.action?.(); });
      el.appendChild(btn);
    });

    el.style.display = 'block';
    el.style.left = '-9999px'; el.style.top = '-9999px';
    const menuW = el.offsetWidth  || 210;
    const menuH = el.offsetHeight || 40;
    let cx = x, cy = y;
    const _cmVW = window.innerWidth  / _desktopScale;
    const _cmVH = window.innerHeight / _desktopScale;
    if (cx + menuW > _cmVW - 8)  cx = _cmVW - menuW - 8;
    if (cy + menuH > _cmVH - 56) cy = _cmVH - menuH - 56;
    if (cy < 4) cy = 4;
    el.style.left = cx + 'px';
    el.style.top  = cy + 'px';
  },


  _showTaskbarPinMenu(x, y, appId) {
    const app = APPS.find(a => a.id === appId);
    if (!app) return;
    const win = Desktop.wm?.windows[appId];
    const items = [];
    if (win) {
      items.push({
        icon:   win.minimized ? 'fa-regular fa-window-restore' : 'fa-solid fa-arrow-up-right-from-square',
        label:  win.minimized ? 'Obnovit' : 'Otevřít',
        action: () => win.minimized ? Desktop.wm._unminimize(appId) : Desktop.wm._focus(appId)
      });
      items.push({
        icon:   'fa-solid fa-window-minimize',
        label:  'Minimalizovat',
        disabled: win.minimized,
        action: () => Desktop.wm._minimize(appId)
      });
      items.push({ icon: 'fa-solid fa-xmark', label: 'Zavřít', danger: true, action: () => Desktop.wm._close(appId) });
      items.push('sep');
    } else {
      items.push({ icon: 'fa-solid fa-arrow-up-right-from-square', label: 'Otevřít', action: () => Desktop.wm.open(app) });
      items.push('sep');
    }
    items.push({ icon: 'fa-solid fa-thumbtack', label: 'Odepnout z panelu', action: () => TaskbarPins.unpin(appId) });
    this._show(x, y, items);
  },

  _showTaskbarWinMenu(x, y, appId) {
    const win = Desktop.wm?.windows[appId];
    if (!win) return;
    const app = APPS.find(a => a.id === appId);
    const isMin = win.minimized;
    const items = [];
    if (app) {
      items.push({
        icon:   isMin ? 'fa-regular fa-window-restore' : 'fa-solid fa-arrow-up-right-from-square',
        label:  isMin ? 'Obnovit' : 'Otevřít',
        action: () => isMin ? Desktop.wm._unminimize(appId) : Desktop.wm._focus(appId)
      });
      items.push('sep');
    }
    items.push({
      icon:   isMin ? 'fa-regular fa-window-restore' : 'fa-solid fa-window-minimize',
      label:  isMin ? 'Obnovit' : 'Minimalizovat',
      action: () => isMin ? Desktop.wm._unminimize(appId) : Desktop.wm._minimize(appId)
    });
    items.push({ icon: 'fa-solid fa-xmark', label: 'Zavřít', danger: true, action: () => Desktop.wm._close(appId) });
    if (app && !TaskbarPins.isPinned(appId)) {
      items.push('sep');
      items.push({ icon: 'fa-solid fa-thumbtack', label: 'Připnout do panelu', action: () => TaskbarPins.pin(appId) });
    }
    this._show(x, y, items);
  },

  _showExplorerMenu(x, y, winId) {
    this._show(x, y, [
      {
        icon:   'fa-solid fa-folder-plus',
        label:  'Nová složka',
        action: () => FolderManager._createItem(winId, 'folder')
      },
      {
        icon:   'fa-solid fa-file-circle-plus',
        label:  'Nový textový dokument',
        action: () => FolderManager._createItem(winId, 'textdoc')
      }
    ]);
  },

  _showDesktopMenu(x, y) {
    this._show(x, y, [
      {
        icon:   'fa-solid fa-folder-plus',
        label:  'Nová složka',
        action: () => DesktopItems.createFolder(x, y)
      },
      {
        icon:   'fa-solid fa-file-lines',
        label:  'Nová poznámka',
        action: () => QuickNote.create(x, y)
      },
      {
        icon:   'fa-solid fa-note-sticky',
        label:  'Nová sticky poznámka',
        action: () => StickyNotes.create(x, y)
      },
      'sep',
      {
        icon:   'fa-solid fa-image',
        label:  'Změnit tapetu',
        action: () => WallpaperSettings.show()
      },
      {
        icon:   'fa-solid fa-gear',
        label:  'Nastavení',
        action: () => WallpaperSettings.show()
      }
    ]);
  },

  _showTrashMenu(x, y) {
    const items = [
      { icon: 'fa-solid fa-folder-open', label: 'Otevřít', action: () => TrashWindow.open() }
    ];
    if (!Trash.isEmpty()) {
      items.push('sep');
      items.push({ icon: 'fa-solid fa-trash', label: 'Vyprázdnit koš', danger: true, action: () => Trash.empty() });
    }
    this._show(x, y, items);
  },

  _showIconMenu(x, y, iconEl, winId) {
    const id        = iconEl.dataset.appId;
    const isCustom  = iconEl.dataset.custom  === '1';
    const inFolder  = iconEl.dataset.inFolder === '1' || winId !== null;
    const itemType  = iconEl.dataset.type;
    const builtIn   = APPS.find(a => a.id === id);
    const customItem = isCustom ? DesktopItems._items.find(i => i.id === id) : null;

    const items = [];

    // "Open" for built-in apps, textdocs and folders
    if (builtIn) {
      items.push({
        icon:   'fa-solid fa-arrow-up-right-from-square',
        label:  'Otevřít',
        action: () => Desktop.wm.open(builtIn)
      });
      items.push('sep');
      items.push({
        icon:   'fa-solid fa-desktop',
        label:  'Odebrat z plochy',
        danger: true,
        action: () => {
          iconEl.remove();
          PinnedApps.hide(id);
          Desktop._updateLauncherBtn(id);
        }
      });
      items.push(
        TaskbarPins.isPinned(id) ? {
          icon:   'fa-solid fa-thumbtack',
          label:  'Odepnout z panelu',
          action: () => TaskbarPins.unpin(id)
        } : {
          icon:   'fa-solid fa-thumbtack',
          label:  'Připnout do panelu',
          action: () => TaskbarPins.pin(id)
        }
      );
      items.push('sep');
    } else if (isCustom && customItem) {
      items.push({
        icon:   'fa-solid fa-arrow-up-right-from-square',
        label:  'Otevřít',
        action: () => DesktopItems.openItem(customItem)
      });
      items.push('sep');
    }

    items.push({
      icon:   'fa-solid fa-pencil',
      label:  'Přejmenovat',
      action: () => DesktopItems.rename(iconEl)
    });

    // Move between desktop ↔ folder
    if (isCustom && inFolder) {
      items.push({
        icon:   'fa-solid fa-desktop',
        label:  'Přesunout na plochu',
        action: () => DesktopItems.moveToFolder(id, null)
      });
    }

    if (isCustom) {
      items.push({
        icon:   'fa-solid fa-trash',
        label:  'Přesunout do koše',
        danger: true,
        action: () => DesktopItems.remove(id, iconEl)
      });
    }

    this._show(x, y, items);
  }
};

// ── Quick Notepad Note ────────────────────────────────────────
const QuickNote = {
  STORAGE_KEY: 'saspHub_notepad_v1',

  create(dropX, dropY) {
    // Create the note in Notepad storage
    let notes = [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      notes = raw ? JSON.parse(raw) : [];
    } catch (e) {}

    const noteId = Date.now().toString();
    const note = { id: noteId, title: '', content: '', updated: new Date().toISOString() };
    notes.unshift(note);

    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes)); } catch (e) {}

    // Create a desktop icon linked to this note
    DesktopItems.createNotepadNote(dropX, dropY, noteId);
  },

  openNote(noteId) {
    const notepadApp = APPS.find(a => a.id === 'notepad');
    if (notepadApp) Desktop.wm.open(notepadApp);
    const tryFocus = (attempts) => {
      const iframe = document.querySelector('.window[data-app-id="notepad"] .win-iframe');
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'focusNote', id: noteId }, '*');
      } else if (attempts > 0) {
        setTimeout(() => tryFocus(attempts - 1), 200);
      }
    };
    setTimeout(() => tryFocus(10), 150);
  }
};

// ── Sticky Notes ─────────────────────────────────────────────
const StickyNotes = {
  KEY: 'saspHub_stickies_v1',
  _notes: [],
  _zBase: 4,
  _zTop: 4,

  COLORS: [
    { bg: '#fdf97c', header: '#f0e432', text: '#3a2e00' },  // žlutá
    { bg: '#b8f0b8', header: '#72d772', text: '#0d3d0d' },  // zelená
    { bg: '#ffd5a0', header: '#ffb84d', text: '#5a2e00' },  // oranžová
    { bg: '#c8c8ff', header: '#9999ee', text: '#1a1a5a' },  // modrá/fialová
    { bg: '#ffb8c8', header: '#ff8099', text: '#5a0015' },  // růžová
  ],

  load() {
    try { this._notes = JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { this._notes = []; }
  },

  _save() { localStorage.setItem(this.KEY, JSON.stringify(this._notes)); },

  create(x, y) {
    const id   = 'sticky_' + Date.now();
    const note = { id, x: Math.max(20, x || 220), y: Math.max(20, y || 180), w: 220, h: 185, text: '', colorIdx: 0 };
    this._notes.push(note);
    this._save();
    const el = this._buildNoteEl(note);
    document.getElementById('desktopIcons').appendChild(el);
    el.querySelector('.sticky-textarea')?.focus();
  },

  remove(id) {
    this._notes = this._notes.filter(n => n.id !== id);
    this._save();
    document.querySelector(`.sticky-note[data-sticky-id="${id}"]`)?.remove();
  },

  _update(id, fields) {
    const note = this._notes.find(n => n.id === id);
    if (!note) return;
    Object.assign(note, fields);
    this._save();
  },

  renderAll() {
    this._notes.forEach(note => {
      const el = this._buildNoteEl(note);
      document.getElementById('desktopIcons').appendChild(el);
    });
  },

  _buildNoteEl(note) {
    const c = this.COLORS[note.colorIdx ?? 0] || this.COLORS[0];
    const el = document.createElement('div');
    el.className = 'sticky-note';
    el.dataset.stickyId = note.id;
    el.style.cssText = `left:${note.x}px;top:${note.y}px;width:${note.w}px;height:${note.h}px;z-index:${++this._zTop};background:${c.bg}`;

    el.innerHTML = `
      <div class="sticky-header" style="background:${c.header}">
        <div class="sticky-colors">
          ${this.COLORS.map((col, i) =>
            `<span class="sticky-color-dot${i === (note.colorIdx ?? 0) ? ' active' : ''}"
              data-ci="${i}" style="background:${col.header}" title="Barva"></span>`
          ).join('')}
        </div>
        <button class="sticky-close-btn" title="Zavřít"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="sticky-body">
        <textarea class="sticky-textarea" placeholder="Pište poznámku…" spellcheck="false"></textarea>
      </div>
      <div class="sticky-resize-handle"></div>
    `;

    const textarea = el.querySelector('.sticky-textarea');
    textarea.value = note.text || '';

    // Bring to front on click — stop propagation so rubber-band doesn't trigger
    el.addEventListener('mousedown', e => {
      e.stopPropagation();
      el.style.zIndex = ++this._zTop;
    });

    // Close
    el.querySelector('.sticky-close-btn').addEventListener('click', e => {
      e.stopPropagation();
      StickyNotes.remove(note.id);
    });

    // Color change
    el.querySelectorAll('.sticky-color-dot').forEach(dot => {
      dot.addEventListener('click', e => {
        e.stopPropagation();
        const idx = Number(dot.dataset.ci);
        StickyNotes._changeColor(note, el, idx);
      });
    });

    // Text save (debounced)
    let saveTimer = null;
    textarea.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        StickyNotes._update(note.id, { text: textarea.value });
        note.text = textarea.value;
      }, 600);
    });

    this._setupDrag(el.querySelector('.sticky-header'), el, note);
    this._setupResize(el.querySelector('.sticky-resize-handle'), el, note);
    return el;
  },

  _changeColor(note, el, colorIdx) {
    const c = this.COLORS[colorIdx];
    el.style.background = c.bg;
    el.querySelector('.sticky-header').style.background = c.header;
    el.querySelectorAll('.sticky-textarea').forEach(t => t.style.color = c.text);
    el.querySelectorAll('.sticky-color-dot').forEach(d => {
      d.classList.toggle('active', Number(d.dataset.ci) === colorIdx);
    });
    this._update(note.id, { colorIdx });
    note.colorIdx = colorIdx;
  },

  _setupDrag(headerEl, noteEl, note) {
    headerEl.addEventListener('mousedown', e => {
      if (e.target.closest('.sticky-close-btn') || e.target.closest('.sticky-color-dot')) return;
      e.preventDefault(); e.stopPropagation();
      noteEl.style.zIndex = ++StickyNotes._zTop;
      const ox = _mx(e.clientX) - noteEl.offsetLeft;
      const oy = _mx(e.clientY) - noteEl.offsetTop;
      const onMove = mv => {
        noteEl.style.left = Math.max(0, _mx(mv.clientX) - ox) + 'px';
        noteEl.style.top  = Math.max(0, _mx(mv.clientY) - oy) + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        StickyNotes._update(note.id, { x: noteEl.offsetLeft, y: noteEl.offsetTop });
        note.x = noteEl.offsetLeft; note.y = noteEl.offsetTop;
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  },

  _setupResize(handleEl, noteEl, note) {
    handleEl.addEventListener('mousedown', e => {
      e.stopPropagation(); e.preventDefault();
      const sx = e.clientX, sy = e.clientY;
      const sw = noteEl.offsetWidth, sh = noteEl.offsetHeight;
      const onMove = mv => {
        noteEl.style.width  = Math.max(180, sw + mv.clientX - sx) + 'px';
        noteEl.style.height = Math.max(120, sh + mv.clientY - sy) + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        StickyNotes._update(note.id, { w: noteEl.offsetWidth, h: noteEl.offsetHeight });
        note.w = noteEl.offsetWidth; note.h = noteEl.offsetHeight;
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
};

// ── Calendar Popup ────────────────────────────────────────────
const CalendarPopup = {
  _el: null,
  _year: null,
  _month: null,
  _visible: false,

  CZ_MONTHS: ['Leden','Únor','Březen','Duben','Květen','Červen',
              'Červenec','Srpen','Září','Říjen','Listopad','Prosinec'],
  CZ_DAYS:   ['Po','Út','St','Čt','Pá','So','Ne'],

  init() {
    const clockWrap = document.querySelector('.taskbar-clock-wrap');
    if (!clockWrap) return;

    clockWrap.addEventListener('click', e => {
      e.stopPropagation();
      this.toggle();
    });

    document.addEventListener('click', e => {
      if (!this._visible) return;
      if (!e.target.closest('#calendarPopup') && !e.target.closest('.taskbar-clock-wrap')) {
        this.hide();
      }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.hide(); });

    // Build the element and attach to desktop
    const el = document.createElement('div');
    el.className = 'calendar-popup';
    el.id = 'calendarPopup';
    el.style.display = 'none';
    document.getElementById('desktop').appendChild(el);
    this._el = el;
  },

  toggle() { this._visible ? this.hide() : this.show(); },

  show() {
    const now = new Date();
    this._year  = now.getFullYear();
    this._month = now.getMonth();
    this._render();
    this._el.style.display = 'block';
    this._visible = true;
  },

  hide() {
    if (this._el) this._el.style.display = 'none';
    this._visible = false;
  },

  _render() {
    const year = this._year, month = this._month;
    const now  = new Date();
    const today = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };

    // Monday-first grid start
    let startDow = new Date(year, month, 1).getDay(); // 0=Sun
    if (startDow === 0) startDow = 7;
    startDow -= 1; // 0=Mon

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    // Prev-month filler
    for (let i = 0; i < startDow; i++) {
      const d = new Date(year, month, -startDow + i + 1);
      cells.push({ day: d.getDate(), cls: 'cal-day other-month' });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = year === today.y && month === today.m && d === today.d;
      cells.push({ day: d, cls: 'cal-day' + (isToday ? ' today' : '') });
    }
    // Next-month filler (always complete to 42 cells = 6 rows)
    let next = 1;
    while (cells.length < 42) cells.push({ day: next++, cls: 'cal-day other-month' });

    this._el.innerHTML = `
      <div class="cal-header">
        <button class="cal-nav-btn" id="calPrevBtn" title="Předchozí měsíc">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <div class="cal-month-label">${this.CZ_MONTHS[month]} ${year}</div>
        <button class="cal-nav-btn" id="calNextBtn" title="Další měsíc">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
      <div class="cal-grid">
        ${this.CZ_DAYS.map(d => `<div class="cal-day-header">${d}</div>`).join('')}
        ${cells.map(c => `<div class="${c.cls}">${c.day}</div>`).join('')}
      </div>
      <div class="cal-footer">
        <button class="cal-today-btn" id="calTodayBtn">Dnes</button>
      </div>
    `;

    this._el.querySelector('#calPrevBtn').addEventListener('click', e => {
      e.stopPropagation();
      let m = month - 1, y = year;
      if (m < 0) { m = 11; y--; }
      this._year = y; this._month = m; this._render();
    });
    this._el.querySelector('#calNextBtn').addEventListener('click', e => {
      e.stopPropagation();
      let m = month + 1, y = year;
      if (m > 11) { m = 0; y++; }
      this._year = y; this._month = m; this._render();
    });
    this._el.querySelector('#calTodayBtn').addEventListener('click', e => {
      e.stopPropagation();
      this._year  = now.getFullYear();
      this._month = now.getMonth();
      this._render();
    });
    // Prevent clicks inside popup from bubbling to document (which would close it)
    this._el.addEventListener('click', e => e.stopPropagation());
  }
};

// ── Trash ─────────────────────────────────────────────────────
const Trash = {
  KEY: 'saspHub_trash_v1',
  _items: [], // { item, position, deletedAt, children }

  load() {
    try { this._items = JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { this._items = []; }
  },

  _save() { localStorage.setItem(this.KEY, JSON.stringify(this._items)); },

  getAll() { return [...this._items]; },

  isEmpty() { return this._items.length === 0; },

  send(id) {
    const item = DesktopItems._items.find(i => i.id === id);
    if (!item) return;
    const collect = (targetId, arr = []) => {
      const it = DesktopItems._items.find(i => i.id === targetId);
      if (!it) return arr;
      arr.push(it);
      DesktopItems._items.filter(i => i.folderId === targetId).forEach(c => collect(c.id, arr));
      return arr;
    };
    const all = collect(id);
    const pos = DesktopItems._positions[id];
    const entry = { item, position: pos || null, deletedAt: Date.now(), children: all.slice(1) };
    this._items.push(entry);
    const cleanIds = new Set(all.map(i => i.id));
    cleanIds.forEach(cid => { delete DesktopItems._positions[cid]; });
    DesktopItems._items = DesktopItems._items.filter(i => !cleanIds.has(i.id));
    DesktopItems._save(); DesktopItems._savePos();
    if (item.type === 'folder') FolderManager.closeFolder(id);
    this._save();
    this._updateIcon();
    TrashWindow.refresh();
  },

  restore(deletedAt) {
    const idx = this._items.findIndex(e => e.deletedAt === deletedAt);
    if (idx === -1) return;
    const entry = this._items[idx];
    this._items.splice(idx, 1);
    this._save();
    DesktopItems._items.push(entry.item, ...entry.children);
    if (entry.position) DesktopItems._positions[entry.item.id] = entry.position;
    DesktopItems._save(); DesktopItems._savePos();
    if (!entry.item.folderId) {
      const el = DesktopItems._buildIconEl(entry.item);
      DesktopItems._appendToDesktop(el, entry.item.id);
      IconDrag.setup(el);
    }
    Object.keys(FolderManager._explorerWins).forEach(wid => FolderManager._refreshAll(wid));
    this._updateIcon();
    TrashWindow.refresh();
  },

  deletePermanent(deletedAt) {
    const idx = this._items.findIndex(e => e.deletedAt === deletedAt);
    if (idx === -1) return;
    this._items.splice(idx, 1);
    this._save();
    this._updateIcon();
    TrashWindow.refresh();
  },

  empty() {
    this._items = [];
    this._save();
    this._updateIcon();
    TrashWindow.refresh();
  },

  _updateIcon() {
    const el = document.getElementById('trashIcon');
    if (!el) return;
    const icon = el.querySelector('i');
    if (icon) icon.className = this.isEmpty() ? 'fa-regular fa-trash-can' : 'fa-solid fa-trash-can trash-full';
  }
};

// ── Trash Window ──────────────────────────────────────────────
const TrashWindow = {
  WIN_ID: 'trash_window',

  open() {
    const wm = Desktop.wm;
    if (wm.windows[this.WIN_ID]) {
      if (wm.windows[this.WIN_ID].minimized) wm._unminimize(this.WIN_ID);
      else wm._focus(this.WIN_ID);
      return;
    }
    const count = Object.keys(wm.windows).length;
    const w = 640, h = 420;
    const _tDW = window.innerWidth  / _desktopScale;
    const _tDH = window.innerHeight / _desktopScale;
    const x = Math.round((_tDW - w) / 2) + count * 24;
    const y = Math.round((_tDH - 48 - h) / 2) + count * 18;
    const el = document.createElement('div');
    el.className     = 'window';
    el.dataset.appId = this.WIN_ID;
    el.style.cssText = `width:${w}px;height:${h}px;left:${x}px;top:${y}px;z-index:${++wm.zCounter}`;
    el.innerHTML = `
      <div class="win-titlebar">
        <div class="win-title-left">
          <i class="fa-solid fa-trash-can win-title-icon"></i>
          <span class="win-title-text">Koš</span>
        </div>
        <div class="win-controls">
          <button class="win-btn win-min" data-action="minimize" data-id="${this.WIN_ID}" title="Minimalizovat"><i class="fa-solid fa-minus"></i></button>
          <button class="win-btn win-max" data-action="maximize" data-id="${this.WIN_ID}" title="Maximalizovat"><i class="fa-regular fa-square"></i></button>
          <button class="win-btn win-close" data-action="close" data-id="${this.WIN_ID}" title="Zavřít"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      <div class="win-body trash-win-body">
        <div class="trash-toolbar">
          <button class="trash-empty-btn" id="trashEmptyBtn"><i class="fa-solid fa-trash"></i> Vyprázdnit koš</button>
        </div>
        <div class="trash-content" id="trashContent"></div>
      </div>
      <div class="win-resize-handle" data-resize="${this.WIN_ID}"></div>
    `;
    document.getElementById('windowsContainer').appendChild(el);
    const fakeApp = { id: this.WIN_ID, minWidth: 400, minHeight: 260 };
    wm.windows[this.WIN_ID] = { el, app: fakeApp, minimized: false, maximized: false, prevRect: null, taskbarBtn: null };
    wm._setupDrag(el.querySelector('.win-titlebar'), el, this.WIN_ID);
    wm._setupResize(el.querySelector('.win-resize-handle'), el, fakeApp);
    el.addEventListener('mousedown', () => wm._focus(this.WIN_ID));
    wm._addTaskbarBtn({ id: this.WIN_ID, icon: 'fa-solid fa-trash-can', name: 'Koš' });
    wm._focusVisuals(this.WIN_ID);

    el.querySelector('#trashEmptyBtn').addEventListener('click', () => { if (!Trash.isEmpty()) Trash.empty(); });

    el.querySelector('#trashContent').addEventListener('contextmenu', e => {
      e.preventDefault(); e.stopPropagation();
      const row = e.target.closest('.trash-row');
      if (row) {
        const deletedAt = Number(row.dataset.deletedAt);
        ContextMenu._show(e.clientX, e.clientY, [
          { icon: 'fa-solid fa-rotate-left', label: 'Obnovit', action: () => Trash.restore(deletedAt) },
          { icon: 'fa-solid fa-trash', label: 'Trvale smazat', danger: true, action: () => Trash.deletePermanent(deletedAt) }
        ]);
      } else if (!Trash.isEmpty()) {
        ContextMenu._show(e.clientX, e.clientY, [
          { icon: 'fa-solid fa-trash', label: 'Vyprázdnit koš', danger: true, action: () => Trash.empty() }
        ]);
      }
    });

    this._renderContent();
  },

  refresh() {
    if (!Desktop.wm?.windows[this.WIN_ID]) return;
    this._renderContent();
  },

  _renderContent() {
    const content = document.getElementById('trashContent');
    if (!content) return;
    content.innerHTML = '';
    const items = Trash.getAll();
    if (!items.length) {
      const msg = document.createElement('div');
      msg.className = 'trash-empty-msg';
      msg.innerHTML = '<i class="fa-regular fa-trash-can"></i><span>Koš je prázdný</span>';
      content.appendChild(msg);
      return;
    }
    items.slice().sort((a, b) => b.deletedAt - a.deletedAt).forEach(entry => {
      const row = document.createElement('div');
      row.className = 'trash-row';
      row.dataset.deletedAt = entry.deletedAt;
      const iconCls = entry.item.type === 'folder' ? 'fa-solid fa-folder' : 'fa-solid fa-file-lines';
      const d = new Date(entry.deletedAt);
      const dateStr = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}  ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      row.innerHTML = `
        <i class="${iconCls} trash-row-icon"></i>
        <span class="trash-row-name">${entry.item.name}</span>
        <span class="trash-row-date">${dateStr}</span>
        <span class="trash-row-type">${entry.item.type === 'folder' ? 'Složka' : 'Textový dokument'}</span>
      `;
      content.appendChild(row);
    });
  }
};

// ── Pinned Built-in Apps ────────────────────────────────────
const PinnedApps = {
  KEY: 'saspHub_pinnedApps_v1',
  _hidden: new Set(),

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      this._hidden = new Set(raw ? JSON.parse(raw) : []);
    } catch { this._hidden = new Set(); }
  },

  isHidden(appId) { return this._hidden.has(appId); },

  hide(appId) { this._hidden.add(appId);    this._save(); },
  show(appId) { this._hidden.delete(appId); this._save(); },

  _save() {
    localStorage.setItem(this.KEY, JSON.stringify([...this._hidden]));
  }
};

// ── Taskbar Pins ──────────────────────────────────────────────
const TaskbarPins = {
  KEY: 'saspHub_taskbarPins_v1',
  _pins: [],

  load() {
    try { this._pins = JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { this._pins = []; }
  },

  isPinned(appId) { return this._pins.includes(appId); },

  pin(appId) {
    if (this.isPinned(appId)) return;
    this._pins.push(appId);
    this._save();
    this._renderBtn(appId);
  },

  unpin(appId) {
    this._pins = this._pins.filter(id => id !== appId);
    this._save();
    document.querySelector(`#taskbarPins [data-pin-id="${appId}"]`)?.remove();
    // If the app is currently running, add a regular taskbar window button
    const win = Desktop.wm?.windows[appId];
    if (win) {
      const app = APPS.find(a => a.id === appId);
      if (app) {
        Desktop.wm._addTaskbarBtn(app);
        if (win.minimized) {
          win.taskbarBtn?.classList.remove('active');
          win.taskbarBtn?.classList.add('minimized');
        } else {
          Desktop.wm._focusVisuals(appId);
        }
      }
    }
  },

  renderAll() {
    this._pins.forEach(id => this._renderBtn(id));
  },

  _renderBtn(appId) {
    const app = APPS.find(a => a.id === appId);
    if (!app) return;
    if (document.querySelector(`#taskbarPins [data-pin-id="${appId}"]`)) return;
    const btn = document.createElement('button');
    btn.className    = 'tb-pin-btn';
    btn.dataset.pinId = appId;
    btn.title        = app.name;
    btn.innerHTML    = `<i class="${app.icon}"></i>`;

    // Reflect running state if app is already open
    const win = Desktop.wm?.windows[appId];
    if (win) {
        // Remove the regular tb-win-btn if it exists
        win.taskbarBtn?.remove();
    }

    btn.addEventListener('click', () => {
      const w = Desktop.wm?.windows[appId];
      if (!w) {
        Desktop.wm.open(app);
      } else if (w.minimized) {
        Desktop.wm._unminimize(appId);
      } else if (parseInt(w.el.style.zIndex) >= Desktop.wm.zCounter && !w.minimized) {
        Desktop.wm._minimize(appId);
      } else {
        Desktop.wm._focus(appId);
      }
    });

    btn.addEventListener('contextmenu', e => {
      e.preventDefault(); e.stopPropagation();
      ContextMenu._showTaskbarPinMenu(_mx(e.clientX), _mx(e.clientY), appId);
    });

    document.getElementById('taskbarPins').appendChild(btn);
  },

  _save() { localStorage.setItem(this.KEY, JSON.stringify(this._pins)); }
};

// ── Rubber-band Multi-Select ──────────────────────────────────
const RubberBand = {
  _boxEl: null,

  init() {
    this._boxEl = document.getElementById('selectionBox');
    document.getElementById('desktop').addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      if (e.target.closest('.desktop-icon')) return;
      if (e.target.closest('.window')) return;
      if (e.target.closest('.sticky-note')) return;
      if (e.target.closest('#taskbar')) return;
      if (e.target.closest('#launcherPopup')) return;
      if (e.target.closest('#officerWidget')) return;
      if (e.target.closest('#contextMenu')) return;
      if (e.target.closest('#settingsModal')) return;

      const startX = _mx(e.clientX), startY = _mx(e.clientY); // desktop coords
      let selecting = false;

      const onMove = mv => {
        if (!selecting && (Math.abs(_mx(mv.clientX) - startX) > 4 || Math.abs(_mx(mv.clientY) - startY) > 4)) {
          selecting = true;
          document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        }
        if (!selecting) return;

        const x1 = Math.min(startX, _mx(mv.clientX));
        const y1 = Math.min(startY, _mx(mv.clientY));
        const x2 = Math.max(startX, _mx(mv.clientX));
        const y2 = Math.max(startY, _mx(mv.clientY));

        this._boxEl.style.display = 'block';
        this._boxEl.style.left   = x1 + 'px';
        this._boxEl.style.top    = y1 + 'px';
        this._boxEl.style.width  = (x2 - x1) + 'px';
        this._boxEl.style.height = (y2 - y1) + 'px';

        // getBoundingClientRect() is in viewport space; convert to desktop space for comparison
        document.querySelectorAll('#desktopIcons .desktop-icon').forEach(icon => {
          const r = icon.getBoundingClientRect();
          icon.classList.toggle('selected',
            r.left / _desktopScale < x2 && r.right  / _desktopScale > x1 &&
            r.top  / _desktopScale < y2 && r.bottom / _desktopScale > y1
          );
        });
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (selecting) RubberBand._suppressNextClick = true;
        selecting = false;
        this._boxEl.style.display = 'none';
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
};

// ── Taskbar Preview (Windows-style hover thumbnail + peek) ────
const TaskbarPreview = {
  _popup:      null,
  _currentId:  null,
  _showTimer:  null,
  _hideTimer:  null,
  _peeking:    false,

  init() {
    const taskbar = document.getElementById('taskbar');

    taskbar.addEventListener('mouseover', e => {
      const btn = e.target.closest('.tb-pin-btn, .tb-win-btn');
      if (!btn) return;
      const appId = btn.dataset.pinId || btn.dataset.appId;
      if (!appId) return;
      this._clearTimers();
      if (this._currentId === appId && this._popup) return;
      this._showTimer = setTimeout(() => this._show(btn, appId), 420);
    });

    taskbar.addEventListener('mouseout', e => {
      const btn = e.target.closest('.tb-pin-btn, .tb-win-btn');
      if (!btn) return;
      const to = e.relatedTarget;
      if (to?.closest?.('#tb-preview-popup')) return;
      this._clearTimers();
      this._scheduleHide();
    });
  },

  _show(btn, appId) {
    this._currentId = appId;
    document.getElementById('tb-preview-popup')?.remove();

    const win = Desktop.wm?.windows[appId];
    const app = APPS.find(a => a.id === appId);
    if (!app) return;

    const popup = document.createElement('div');
    popup.id = 'tb-preview-popup';

    const btnRect = btn.getBoundingClientRect();

    // thumbInner declared here so RAF closure can reach it in both branches
    let thumbInner = null;

    if (win && !win.minimized) {
      popup.className = 'tb-preview-popup';

      const header = document.createElement('div');
      header.className = 'tb-preview-header';

      const title = document.createElement('div');
      title.className   = 'tb-preview-title';
      title.textContent = app.name;

      const closeBtn = document.createElement('button');
      closeBtn.className = 'tb-preview-close-btn';
      closeBtn.title     = 'Zavřít';
      closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      closeBtn.addEventListener('click', e => {
        e.stopPropagation();
        Desktop.wm._close(appId);
        this.hide();
      });

      header.appendChild(title);
      header.appendChild(closeBtn);

      thumbInner = this._buildThumb(win);
      const thumb = document.createElement('div');
      thumb.className = 'tb-preview-thumb';
      thumb.appendChild(thumbInner);

      thumb.addEventListener('mouseenter', () => this._startPeek(appId));
      thumb.addEventListener('mouseleave', () => this._endPeek());
      thumb.addEventListener('click', () => {
        if (win.minimized) Desktop.wm._unminimize(appId);
        else               Desktop.wm._focus(appId);
        this.hide();
      });

      popup.appendChild(header);
      popup.appendChild(thumb);
    } else {
      // ── Not running or minimized: simple name label ───────
      popup.className   = 'tb-preview-label';
      popup.textContent = app.name;
    }

    // Add hidden first so browser can measure width but won't paint it
    popup.style.visibility = 'hidden';
    document.getElementById('desktop').appendChild(popup);
    this._popup = popup;

    popup.addEventListener('mouseenter', () => this._clearTimers());
    popup.addEventListener('mouseleave', e => {
      const to = e.relatedTarget;
      if (to?.closest?.('.tb-pin-btn, .tb-win-btn')) return;
      this._endPeek();
      this._scheduleHide();
    });

    // RAF 1: position popup while still invisible
    // btnRect is in viewport space; convert center to desktop space for left style
    requestAnimationFrame(() => {
      const pw    = popup.offsetWidth;
      const cxD   = (btnRect.left + btnRect.width / 2) / _desktopScale; // desktop coords
      const rawL  = cxD - pw / 2;
      const maxL  = window.innerWidth / _desktopScale - pw - 8;
      popup.style.left = Math.max(8, Math.min(maxL, rawL)) + 'px';
      popup.style.visibility = '';
      popup.classList.add('tb-preview-ready');

      // RAF 2: thumbnail clone is already at correct scale from frame 1;
      // now fade it in so there is zero chance of seeing unscaled state
      if (thumbInner) {
        requestAnimationFrame(() => {
          thumbInner.style.transition = 'opacity 0.1s ease';
          thumbInner.style.opacity    = '1';
        });
      }
    });
  },

  _buildThumb(win) {
    const winEl = win.el;
    const app   = win.app;
    const W     = winEl.offsetWidth  || 800;
    const H     = winEl.offsetHeight || 500;
    const MAX_W = 224;
    const MAX_H = 160;

    // Scale to fit inside MAX_W × MAX_H, preserving aspect ratio
    const scale = Math.min(MAX_W / W, MAX_H / H);
    const tw    = Math.round(W * scale);
    const th    = Math.round(H * scale);

    // Titlebar height from the real element (fallback 32px)
    const titlebarEl = winEl.querySelector('.win-titlebar');
    const tbH = titlebarEl ? Math.round(titlebarEl.offsetHeight * scale) : 32;

    // Build the thumbnail purely from scratch — no cloneNode, no CSS class baggage
    const outer = document.createElement('div');
    outer.style.cssText = [
      `width:${tw}px`, `height:${th}px`,
      'overflow:hidden', 'position:relative',
      'border-radius:4px', 'flex-shrink:0',
      'opacity:0',                    // faded in by _show() RAF
      'border:1px solid rgba(255,255,255,0.07)',
    ].join(';');

    // ── Fake titlebar ──────────────────────────────────────
    const tbBg = win.el.classList.contains('focused')
      ? 'rgba(var(--th-accent-rgb),0.18)' : 'rgba(255,255,255,0.05)';
    const tb = document.createElement('div');
    tb.style.cssText = [
      'position:absolute', 'top:0', 'left:0', `right:0`,
      `height:${tbH}px`,
      `background:${tbBg}`,
      'display:flex', 'align-items:center', 'gap:5px',
      `padding:0 ${Math.round(8 * scale)}px`,
      'box-sizing:border-box',
      `border-bottom:1px solid rgba(255,255,255,0.07)`,
    ].join(';');

    const iconSize = Math.max(8, Math.round(13 * scale));
    const fontSize = Math.max(7, Math.round(12 * scale));
    tb.innerHTML = `
      <i class="${app.icon}" style="font-size:${iconSize}px;color:var(--th-accent,#4a9eff);opacity:0.85;flex-shrink:0;"></i>
      <span style="font-size:${fontSize}px;color:var(--th-text,#fff);font-family:Inter,sans-serif;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500;opacity:0.9;">${app.name}</span>
    `;

    // ── Window body ────────────────────────────────────────
    const body = document.createElement('div');
    body.style.cssText = [
      'position:absolute', `top:${tbH}px`, 'left:0', 'right:0', 'bottom:0',
      'background:linear-gradient(170deg,#081422 0%,#0b1a2d 100%)',
      'display:flex', 'align-items:center', 'justify-content:center',
    ].join(';');

    if (win.minimized) {
      body.innerHTML = `<i class="${app.icon}" style="font-size:${Math.round(28*scale)}px;opacity:0.18;color:var(--th-text,#fff);"></i>`;
    } else {
      body.innerHTML = `<i class="${app.icon}" style="font-size:${Math.round(28*scale)}px;opacity:0.12;color:var(--th-accent,#4a9eff);"></i>`;
    }

    outer.appendChild(tb);
    outer.appendChild(body);
    return outer;
  },

  _startPeek(activeId) {
    if (this._peeking) return;
    this._peeking = true;
    Object.entries(Desktop.wm.windows).forEach(([id, win]) => {
      if (id === activeId) return;
      win.el.style.transition = 'opacity 0.15s ease';
      win.el.style.opacity    = '0.06';
    });
    const icons = document.getElementById('desktopIcons');
    if (icons) {
      icons.style.transition = 'opacity 0.15s ease';
      icons.style.opacity    = '0.06';
    }
  },

  _endPeek() {
    if (!this._peeking) return;
    this._peeking = false;
    Object.values(Desktop.wm.windows).forEach(win => {
      win.el.style.transition = 'opacity 0.2s ease';
      win.el.style.opacity    = '';
      setTimeout(() => { win.el.style.transition = ''; }, 220);
    });
    const icons = document.getElementById('desktopIcons');
    if (icons) {
      icons.style.transition = 'opacity 0.2s ease';
      icons.style.opacity    = '';
      setTimeout(() => { icons.style.transition = ''; }, 220);
    }
  },

  hide() {
    this._endPeek();
    this._clearTimers();
    document.getElementById('tb-preview-popup')?.remove();
    this._popup     = null;
    this._currentId = null;
  },

  _clearTimers() {
    clearTimeout(this._showTimer);
    clearTimeout(this._hideTimer);
    this._showTimer = null;
    this._hideTimer = null;
  },

  _scheduleHide() {
    this._hideTimer = setTimeout(() => this.hide(), 180);
  }
};

// ── Desktop ───────────────────────────────────────────────────
const Desktop = {
  wm: null,

  init() {
    _updateDesktopScale();

    this.wm = new WindowManager();
    DesktopItems.load();
    PinnedApps.load();
    TaskbarPins.load();
    Trash.load();
    StickyNotes.load();
    this._renderIcons();
    DesktopItems.renderAll();
    StickyNotes.renderAll();
    ContextMenu.init();
    RubberBand.init();
    TaskbarPins.renderAll();
    this._setupLauncher();
    this._renderLauncherApps();
    this._renderOfficerWidget();
    ThemeEngine.loadTheme();
    WallpaperSettings.applyFromStorage();
    AvatarSettings.applyFromStorage();
    CalendarPopup.init();
    TaskbarPreview.init();
    this.wm._restoreState();
  },


  _renderOfficerWidget() {
    const officer = Auth.get();
    if (!officer) return;
    const el = document.getElementById('owBadge');
    const nm = document.getElementById('owName');
    if (el) el.textContent = `#${officer.badge}`;
    if (nm) nm.textContent = `${officer.firstName} ${officer.lastName}`;
  },

  _renderIcons() {
    const container = document.getElementById('desktopIcons');
    APPS.forEach((app, idx) => {
      if (PinnedApps.isHidden(app.id)) return;
      const displayName = DesktopItems.labelFor(app.id) || app.name;
      const el = document.createElement('div');
      el.className     = 'desktop-icon';
      el.dataset.appId = app.id;
      el.innerHTML = `
        <div class="di-icon-wrap"><i class="${app.icon}"></i></div>
        <span class="di-label">${displayName}</span>
      `;

      // Position: saved or grid slot
      let pos = DesktopItems.posFor(app.id);
      if (!pos) {
        pos = gridFreeSlot([app.id]);
        DesktopItems.setPos(app.id, pos.x, pos.y);
      }
      const snp = gridSnap(pos.x, pos.y);
      el.style.left = snp.x + 'px';
      el.style.top  = snp.y + 'px';

      el.addEventListener('click', e => {
        e.stopPropagation();
        if (!el.classList.contains('selected')) {
          document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
          el.classList.add('selected');
        }
      });
      el.addEventListener('dblclick', () => this.wm.open(app));
      container.appendChild(el);
      IconDrag.setupBuiltIn(el);
    });

    // Deselect on desktop click
    document.getElementById('desktop').addEventListener('click', e => {
      if (!e.target.closest('.desktop-icon')) {
        if (RubberBand._suppressNextClick) { RubberBand._suppressNextClick = false; return; }
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      }
    });

    // HTML5 drop from explorer onto desktop
    const desktopIcons = document.getElementById('desktopIcons');
    desktopIcons.addEventListener('dragover', e => {
      if (e.dataTransfer?.types.includes('text/plain')) e.preventDefault();
    });
    desktopIcons.addEventListener('drop', e => {
      e.preventDefault();
      const itemId = e.dataTransfer?.getData('text/plain');
      if (!itemId) return;
      const item = DesktopItems._items.find(i => i.id === itemId);
      if (item && item.folderId !== null) {
        const s = gridSnap(e.clientX - 40, e.clientY - 40);
        DesktopItems._positions[itemId] = s;
        DesktopItems.moveToFolder(itemId, null);
      }
    });

    // Koš icon
    this._renderTrashIcon();
  },

  _renderTrashIcon() {
    const container = document.getElementById('desktopIcons');
    const el = document.createElement('div');
    el.className     = 'desktop-icon';
    el.id            = 'trashIcon';
    el.dataset.appId = '__trash__';
    el.dataset.trash = '1';
    const iconCls = Trash.isEmpty() ? 'fa-regular fa-trash-can' : 'fa-solid fa-trash-can trash-full';
    el.innerHTML = `
      <div class="di-icon-wrap"><i class="${iconCls}"></i></div>
      <span class="di-label">Koš</span>
    `;

    // Position: saved or default (bottom of first column)
    let pos = DesktopItems.posFor('__trash__');
    if (!pos) {
      const maxRows = Math.max(3, Math.floor((window.innerHeight / _desktopScale - 48 - GRID_PY * 2) / GRID_H));
      pos = { x: GRID_PX, y: GRID_PY + (maxRows - 1) * GRID_H };
    }
    const snp = gridSnap(pos.x, pos.y);
    el.style.left = snp.x + 'px';
    el.style.top  = snp.y + 'px';

    el.addEventListener('click', e => {
      e.stopPropagation();
      if (!el.classList.contains('selected')) {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        el.classList.add('selected');
      }
    });
    el.addEventListener('dblclick', () => TrashWindow.open());

    // HTML5 drag-and-drop target
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drop-target'); });
    el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
    el.addEventListener('drop', e => {
      e.preventDefault(); e.stopPropagation();
      el.classList.remove('drop-target');
      const itemId = e.dataTransfer?.getData('text/plain');
      if (itemId && itemId !== '__trash__') {
        const iconEl = document.querySelector(`#desktopIcons [data-app-id="${itemId}"]`) ||
                       document.querySelector(`[data-app-id="${itemId}"]`);
        if (iconEl) iconEl.remove();
        Trash.send(itemId);
      }
    });

    container.appendChild(el);
    // Draggable (repositionable)
    IconDrag.setupBuiltIn(el);
  },

  _setupLauncher() {
    const btn   = document.getElementById('launcherBtn');
    const popup = document.getElementById('launcherPopup');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = popup.style.display !== 'none';
      popup.style.display = open ? 'none' : 'block';
      btn.classList.toggle('active', !open);
      if (!open) {
        const s = document.getElementById('launcherSearch');
        if (s) { s.value = ''; s.focus(); }
        // reset hidden items on reopen
        document.querySelectorAll('.launcher-app-btn').forEach(b => b.style.display = '');
      }
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('#launcherPopup') && !e.target.closest('#launcherBtn')) {
        popup.style.display = 'none';
        btn.classList.remove('active');
      }
    });
  },

  _renderLauncherApps() {
    const grid = document.getElementById('launcherGrid');
    APPS.forEach(app => {
      const btn = document.createElement('button');
      btn.className = 'launcher-app-btn';
      btn.dataset.appId = app.id;
      if (!PinnedApps.isHidden(app.id)) btn.classList.add('is-pinned');
      btn.innerHTML = `<i class="${app.icon}"></i><span>${app.name}</span><span class="launcher-pin-dot"></span>`;
      btn.addEventListener('click', () => {
        this.wm.open(app);
        document.getElementById('launcherPopup').style.display = 'none';
        document.getElementById('launcherBtn').classList.remove('active');
      });
      btn.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation();
        const onDesktop = !PinnedApps.isHidden(app.id);
        ContextMenu._show(e.clientX, e.clientY, [
          {
            icon:   'fa-solid fa-arrow-up-right-from-square',
            label:  'Otevřít',
            action: () => {
              Desktop.wm.open(app);
              document.getElementById('launcherPopup').style.display = 'none';
              document.getElementById('launcherBtn').classList.remove('active');
            }
          },
          'sep',
          onDesktop ? {
            icon:   'fa-solid fa-desktop',
            label:  'Odebrat z plochy',
            danger: true,
            action: () => {
              const icon = document.querySelector(`#desktopIcons [data-app-id="${app.id}"]`);
              if (icon) icon.remove();
              PinnedApps.hide(app.id);
              Desktop._updateLauncherBtn(app.id);
            }
          } : {
            icon:   'fa-solid fa-desktop',
            label:  'Přidat na plochu',
            action: () => {
              PinnedApps.show(app.id);
              Desktop._addBuiltInIcon(app);
              Desktop._updateLauncherBtn(app.id);
            }
          }
        ]);
      });
      grid.appendChild(btn);
    });
    // Officer info in footer
    const officer = Auth.get();
    if (officer && officer.firstName) {
      const row = document.getElementById('launcherOfficer');
      if (row) {
        row.innerHTML = `
          <div class="launcher-officer-avatar">
            <i class="fa-solid fa-user" id="launcherAvatarIcon"></i>
            <img id="launcherAvatarImg" class="launcher-avatar-img" style="display:none" alt="" />
          </div>
          <div class="launcher-officer-info">
            <div class="launcher-officer-name">${officer.firstName} ${officer.lastName}</div>
            <div class="launcher-officer-badge">Odznak \u0023${officer.badge}</div>
          </div>
        `;
      }
    }
    // Search filter
    const searchInput = document.getElementById('launcherSearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        document.querySelectorAll('.launcher-app-btn').forEach(btn => {
          const name = btn.querySelector('span')?.textContent.toLowerCase() ?? '';
          btn.style.display = name.includes(q) ? '' : 'none';
        });
      });
    }
    // Logout / Shutdown / Settings
    document.getElementById('launcherLogoutBtn')?.addEventListener('click', () => System.logout());
    document.getElementById('launcherShutdownBtn')?.addEventListener('click', () => System.shutdown());
    document.getElementById('launcherSettingsBtn')?.addEventListener('click', () => {
      document.getElementById('launcherPopup').style.display = 'none';
      document.getElementById('launcherBtn').classList.remove('active');
      WallpaperSettings.show();
    });
  },

  _addBuiltInIcon(app) {
    const container = document.getElementById('desktopIcons');
    const displayName = DesktopItems.labelFor(app.id) || app.name;
    const el = document.createElement('div');
    el.className     = 'desktop-icon';
    el.dataset.appId = app.id;
    el.innerHTML = `
      <div class="di-icon-wrap"><i class="${app.icon}"></i></div>
      <span class="di-label">${displayName}</span>
    `;
    let pos = DesktopItems.posFor(app.id);
    if (!pos) {
      pos = gridFreeSlot([app.id]);
      DesktopItems.setPos(app.id, pos.x, pos.y);
    }
    const snp = gridSnap(pos.x, pos.y);
    el.style.left = snp.x + 'px';
    el.style.top  = snp.y + 'px';
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (!el.classList.contains('selected')) {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        el.classList.add('selected');
      }
    });
    el.addEventListener('dblclick', () => this.wm.open(app));
    container.appendChild(el);
    IconDrag.setupBuiltIn(el);
  },

  _updateLauncherBtn(appId) {
    const btn = document.querySelector(`#launcherGrid [data-app-id="${appId}"]`);
    if (!btn) return;
    btn.classList.toggle('is-pinned', !PinnedApps.isHidden(appId));
  }
};

// ── Login ─────────────────────────────────────────────────────
const Login = {
  show() {
    const overlay = document.getElementById('loginOverlay');
    overlay.style.display = 'flex';
    this._prefill();

    const submit = () => this._submit();
    document.getElementById('loginBtn').addEventListener('click', submit);
    ['loginBadge','loginFirst','loginLast'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') submit();
      });
    });
  },

  _prefill() {
    const data = Auth.get();
    if (!data) return;
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && val) el.value = val;
    };
    set('loginBadge', data.badge);
    set('loginFirst', data.firstName);
    set('loginLast',  data.lastName);
    document.getElementById('loginRemember').checked = !!localStorage.getItem(Auth.KEY);
  },

  _submit() {
    const badge    = document.getElementById('loginBadge').value.trim();
    const first    = document.getElementById('loginFirst').value.trim();
    const last     = document.getElementById('loginLast').value.trim();
    const remember = document.getElementById('loginRemember').checked;

    let valid = true;
    [['loginBadge', badge], ['loginFirst', first], ['loginLast', last]].forEach(([id, val]) => {
      if (!val) {
        const el = document.getElementById(id);
        el.classList.add('lf-error');
        el.closest('.lf-wrap').style.borderBottomColor = 'rgba(255,77,106,0.6)';
        setTimeout(() => {
          el.classList.remove('lf-error');
          el.closest('.lf-wrap').style.borderBottomColor = '';
        }, 800);
        valid = false;
      }
    });
    if (!valid) return;

    Auth.save(badge, first, last, remember);

    const overlay = document.getElementById('loginOverlay');
    overlay.style.transition = 'opacity 0.45s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
      this._showDesktop();
    }, 470);
  },

  _showDesktop() {
    const desktop = document.getElementById('desktop');
    desktop.style.opacity = '0';
    desktop.style.display = 'block';
    desktop.style.transition = 'opacity 0.38s ease';
    requestAnimationFrame(() =>
      requestAnimationFrame(() => { desktop.style.opacity = '1'; })
    );
    Desktop.init();
  }
};

// ── Main Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Clock.start();

  // Cleanup: if user didn't check "remember", clear localStorage on tab close
  window.addEventListener('pagehide', () => {
    Desktop.wm?._persistState();
    if (sessionStorage.getItem(Auth.KEY + '_noremember')) {
      localStorage.removeItem(Auth.KEY);
    }
  });

  if (Auth.load()) {
    // Already authenticated — skip boot + login
    document.getElementById('bootOverlay').style.display = 'none';
    const desktop = document.getElementById('desktop');
    desktop.style.display = 'block';
    Desktop.init();
  } else if (sessionStorage.getItem('saspHub_skipBoot')) {
    // Logged out — skip boot, go straight to login
    sessionStorage.removeItem('saspHub_skipBoot');
    document.getElementById('bootOverlay').style.display = 'none';
    Login.show();
  } else {
    Boot.run(() => Login.show());
  }
});
