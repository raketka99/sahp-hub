'use strict';

/* ============================================================
   SAHP HUB OS — Theme Engine
   Tři témata: modern (výchozí), terminal (zlatočerný), win98
   ============================================================ */

const THEMES = {
  modern: {
    label: 'Modern',
    '--th-bg':            '#060f18',
    '--th-bg-panel':      '#07101c',
    '--th-bg-card':       '#0b1622',
    '--th-bg-hover':      'rgba(59,158,255,0.08)',
    '--th-accent':        '#3b9eff',
    '--th-accent-dim':    'rgba(59,158,255,0.15)',
    '--th-accent-rgb':    '59,158,255',
    '--th-text':          '#d0e8ff',
    '--th-text-mid':      '#8ab8d8',
    '--th-text-dim':      '#3a6080',
    '--th-border':        '#1a3050',
    '--th-border-bright': '#2a4870',
    '--th-font':          "'Inter', sans-serif",
    '--th-radius-sm':     '4px',
    '--th-radius-md':     '6px',
    '--th-radius-lg':     '8px',
    '--th-radius-xl':     '12px',
    '--th-radius-btn':    '6px',
    '--th-titlebar-bg':   'linear-gradient(180deg, #0f2035 0%, #0c1b2e 100%)',
    '--th-titlebar-border':'#1a3050',
    '--th-win-bg':        '#f1c232',
    '--th-win-border':    '#1e3a5a',
    '--th-btn-bg':        'rgba(59,158,255,0.1)',
    '--th-btn-border':    'rgba(59,158,255,0.3)',
    '--th-btn-color':     '#3b9eff',
    '--th-taskbar-bg':    'rgba(7,16,28,0.96)',
    '--th-taskbar-border':'#1a3050',
    '--th-settings-bg':   '#09162a',
    '--th-shadow':        '0 8px 40px rgba(0,0,0,0.65)',
    '--th-glow':          '0 0 0 1px rgba(59,158,255,0.06)',
  },

  terminal: {
    label: 'Terminál',
    '--th-bg':            '#f1c232',
    '--th-bg-panel':      '#05060a',
    '--th-bg-card':       '#080a0f',
    '--th-bg-hover':      'rgba(255,204,0,0.08)',
    '--th-accent':        '#ffcc00',
    '--th-accent-dim':    'rgba(255,204,0,0.15)',
    '--th-accent-rgb':    '255,204,0',
    '--th-text':          '#d8dce6',
    '--th-text-mid':      '#aab0be',
    '--th-text-dim':      '#444',
    '--th-border':        '#151820',
    '--th-border-bright': '#252830',
    '--th-font':          "'JetBrains Mono', 'Courier New', monospace",
    '--th-radius-sm':     '2px',
    '--th-radius-md':     '2px',
    '--th-radius-lg':     '3px',
    '--th-radius-xl':     '3px',
    '--th-radius-btn':    '2px',
    '--th-titlebar-bg':   'linear-gradient(180deg, #0d1018 0%, #080c12 100%)',
    '--th-titlebar-border':'#1a1e28',
    '--th-win-bg':        '#05060a',
    '--th-win-border':    '#252830',
    '--th-btn-bg':        'rgba(255,204,0,0.1)',
    '--th-btn-border':    'rgba(255,204,0,0.35)',
    '--th-btn-color':     '#ffcc00',
    '--th-taskbar-bg':    'rgba(3,4,8,0.97)',
    '--th-taskbar-border':'#1a1e28',
    '--th-settings-bg':   '#05060a',
    '--th-shadow':        '0 8px 40px rgba(0,0,0,0.85)',
    '--th-glow':          '0 0 0 1px rgba(255,204,0,0.05)',
  },

  win98: {
    label: 'Win 98',
    '--th-bg':            '#008080',
    '--th-bg-panel':      '#c0c0c0',
    '--th-bg-card':       '#d4d0c8',
    '--th-bg-hover':      'rgba(0,0,128,0.1)',
    '--th-accent':        '#000080',
    '--th-accent-dim':    'rgba(0,0,128,0.15)',
    '--th-accent-rgb':    '0,0,128',
    '--th-text':          '#000000',
    '--th-text-mid':      '#222222',
    '--th-text-dim':      '#707070',
    '--th-border':        '#808080',
    '--th-border-bright': '#ffffff',
    '--th-font':          "'Tahoma', 'MS Sans Serif', sans-serif",
    '--th-radius-sm':     '0px',
    '--th-radius-md':     '0px',
    '--th-radius-lg':     '0px',
    '--th-radius-xl':     '0px',
    '--th-radius-btn':    '0px',
    '--th-titlebar-bg':   'linear-gradient(90deg, #000080 0%, #1084d0 100%)',
    '--th-titlebar-border':'#0a0a5a',
    '--th-win-bg':        '#d4d0c8',
    '--th-win-border':    '#808080',
    '--th-btn-bg':        '#d4d0c8',
    '--th-btn-border':    '#808080',
    '--th-btn-color':     '#000000',
    '--th-taskbar-bg':    '#c0c0c0',
    '--th-taskbar-border':'#808080',
    '--th-settings-bg':   '#d4d0c8',
    '--th-shadow':        '2px 2px 0 #000000',
    '--th-glow':          'none',
  }
};

const ThemeEngine = {
  KEY: 'saspHub_theme_v1',

  applyTheme(id) {
    const theme = THEMES[id];
    if (!theme) return;
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      if (key.startsWith('--')) root.style.setProperty(key, value);
    });
    root.setAttribute('data-theme', id);
    try { localStorage.setItem(this.KEY, id); } catch (e) {}
  },

  loadTheme() {
    let id = 'modern';
    try { id = localStorage.getItem(this.KEY) || 'modern'; } catch (e) {}
    if (!THEMES[id]) id = 'modern';
    this.applyTheme(id);
    return id;
  },

  currentTheme() {
    try { return localStorage.getItem(this.KEY) || 'modern'; } catch (e) { return 'modern'; }
  }
};

// Apply immediately on script load (before DOM ready) to prevent flash
ThemeEngine.loadTheme();
