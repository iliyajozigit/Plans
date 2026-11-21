
import './style.css';
import './smart.js';

const $ = (selector) => document.querySelector(selector);
const dateKey = (date = new Date()) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
const today = () => dateKey();

const formatDate = () =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

const defaultState = {
  date: today(),
  tasks: [],
  habits: [
    { id: 1, title: 'Read and learn', icon: '📚', done: false },
    { id: 2, title: 'Exercise and move', icon: '🏃', done: false },
    { id: 3, title: 'Drink water', icon: '💧', done: false },
    { id: 4, title: 'Plan your day', icon: '📝', done: false }
  ],
  xp: 0,
  water: 0,
  notes: '',
  earned: [],
  focusSessions: 0,
  profile: { displayName: 'Mylo Adventurer', gender: 'boy', bio: 'On my way to a better me', skin: '#d99b72', hairColor: '#49312f', hairStyle: 'wave', eyeColor: '#4b8177', outfitStyle: 'hoodie', outfitColor: '#7666df', accessory: 'glasses', background: 'blossom', unlocked: [], questClaims: {}, genderInitialized: true },
  gems: 120, streak: 0, longestStreak: 0, lastActiveDate: null,
  totalTasksCompleted: 0, totalHabitsCompleted: 0, xpByDate: {}, createdAt: today()
};


const waterTarget = () => state.settings?.waterTarget || 8;
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isDateKey = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};
const asBoolean = value => value === true || value === 1 || value === 'true';
const asNumber = (value, fallback = 0, max = Number.MAX_SAFE_INTEGER) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(Math.max(number, 0), max) : fallback;
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('myLifeState'));
    return isRecord(saved) ? saved : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function normalizeState(raw) {
  const source = isRecord(raw) ? raw : {};
  const next = { ...structuredClone(defaultState), ...source };

  next.profile = { ...defaultState.profile, ...(isRecord(source.profile) ? source.profile : {}) };
  if (!['boy', 'girl'].includes(next.profile.gender)) next.profile.gender = 'boy';
  if (isRecord(source.profile) && !asBoolean(source.profile.genderInitialized)) {
    next.profile.gender = 'boy';
    next.profile.hairStyle = 'short';
    next.profile.genderInitialized = true;
  }
  next.profile.displayName = String(next.profile.displayName ?? '').slice(0, 32);
  next.profile.bio = String(next.profile.bio ?? '');
  next.profile.unlocked = Array.isArray(next.profile.unlocked) ? next.profile.unlocked.filter(item => typeof item === 'string') : [];
  next.profile.questClaims = isRecord(next.profile.questClaims) ? next.profile.questClaims : {};

  next.tasks = (Array.isArray(source.tasks) ? source.tasks : []).filter(isRecord).map((task, index) => ({
    ...task,
    id: Number.isSafeInteger(Number(task.id)) ? Number(task.id) : Date.now() + index,
    title: String(task.title ?? '').slice(0, 100),
    done: asBoolean(task.done),
    rewardClaimed: asBoolean(task.rewardClaimed ?? task.done),
    countedComplete: asBoolean(task.countedComplete ?? task.done)
  }));
  next.habits = (Array.isArray(source.habits) ? source.habits : structuredClone(defaultState.habits))
    .filter(isRecord).map((habit, index) => ({
      ...habit,
      id: Number.isSafeInteger(Number(habit.id)) ? Number(habit.id) : index + 1,
      title: String(habit.title ?? '').slice(0, 80),
      icon: String(habit.icon ?? '•').slice(0, 8),
      done: asBoolean(habit.done),
      lastRewardDate: isDateKey(habit.lastRewardDate) ? habit.lastRewardDate : null
    }));
  next.goals = (Array.isArray(source.goals) ? source.goals : []).filter(isRecord).map((goal, index) => ({
    ...goal,
    id: Number.isSafeInteger(Number(goal.id)) ? Number(goal.id) : Date.now() + index,
    title: String(goal.title ?? '').slice(0, 90),
    done: asBoolean(goal.done)
  }));

  next.journal = isRecord(source.journal)
    ? Object.fromEntries(Object.entries(source.journal).filter(([, value]) => typeof value === 'string'))
    : {};
  next.settings = { theme: 'light', waterTarget: 8, ...(isRecord(source.settings) ? source.settings : {}) };
  next.settings.theme = next.settings.theme === 'dark' ? 'dark' : 'light';
  next.settings.waterTarget = Math.round(asNumber(next.settings.waterTarget, 8, 24)) || 8;

  next.date = isDateKey(source.date) ? source.date : today();
  next.createdAt = isDateKey(source.createdAt) ? source.createdAt : today();
  next.lastActiveDate = isDateKey(source.lastActiveDate) ? source.lastActiveDate : null;
  next.waterRewardDate = isDateKey(source.waterRewardDate) ? source.waterRewardDate : null;
  next.xp = asNumber(source.xp);
  next.gems = asNumber(source.gems, 120);
  next.water = Math.round(asNumber(source.water, 0, 24));
  next.focusSessions = Math.round(asNumber(source.focusSessions));
  next.streak = Math.round(asNumber(source.streak));
  next.longestStreak = Math.round(asNumber(source.longestStreak));
  next.totalTasksCompleted = Math.round(asNumber(source.totalTasksCompleted));
  next.totalHabitsCompleted = Math.round(asNumber(source.totalHabitsCompleted));
  next.notes = String(source.notes ?? '');
  next.earned = Array.isArray(source.earned) ? source.earned.filter(item => typeof item === 'string') : [];
  next.xpByDate = isRecord(source.xpByDate)
    ? Object.fromEntries(Object.entries(source.xpByDate).filter(([key, value]) => isDateKey(key) && Number.isFinite(Number(value))).map(([key, value]) => [key, asNumber(value)]))
    : {};
  return next;
}

let state = normalizeState(loadState());

function resetDailyData() {
  state.date = today();
  state.tasks = [];
  state.habits = state.habits.map(h => ({ ...h, done: false }));
  state.water = 0;
}

if (state.date !== today()) resetDailyData();

const badges = [
  { id: 'first-task', title: 'Strong start', description: 'Complete your first task', icon: '🚀', color: 'purple', target: 1, type: 'tasks' },
  { id: 'task-master', title: 'Task master', description: 'Finish 10 tasks', icon: '🎯', color: 'blue', target: 10, type: 'tasks' },
  { id: 'habit-starter', title: 'Habit starter', description: 'Complete your first habit', icon: '🌱', color: 'green', target: 1, type: 'habits' },
  { id: 'habit-master', title: 'Habit architect', description: 'Complete 4 habits in one day', icon: '🌳', color: 'emerald', target: 4, type: 'dailyHabits' },
  { id: 'water-lover', title: 'Health droplets', description: 'Log 8 glasses of water', icon: '💎', color: 'cyan', target: 8, type: 'water' },
  { id: 'focus-master', title: 'Focus master', description: 'Complete 5 focus sessions', icon: '⏱️', color: 'orange', target: 5, type: 'focus' },
  { id: 'xp-collector', title: 'XP hunter', description: 'Earn 100 XP', icon: '⭐', color: 'gold', target: 100, type: 'xp' },
  { id: 'legend', title: 'Mylo Legend', description: 'Reach 500 XP', icon: '👑', color: 'pink', target: 500, type: 'xp' }
];

const SYNC_TOKEN_KEY = 'myLifeToken';
const SYNC_USER_KEY = 'myLifeAccount';
const sync = { token: null, username: null, timer: null, retry: null, status: 'local', pending: false };
try {
  sync.token = localStorage.getItem(SYNC_TOKEN_KEY);
  sync.username = localStorage.getItem(SYNC_USER_KEY);
} catch {}

async function apiCall(route, options = {}) {
  const headers = { 'content-type': 'application/json' };
  if (sync.token) headers.authorization = 'Bearer ' + sync.token;
  let response;
  try {
    response = await fetch('/api' + route, { ...options, headers });
  } catch {
    const error = new Error('network');
    error.status = 0;
    throw error;
  }
  let body = {};
  try { body = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(body.error || 'request failed');
    error.status = response.status;
    throw error;
  }
  return body;
}

const DIRTY_KEY = 'myLifeDirty';
let retryDelay = 5000;
let lastPull = 0;

function isDirty() {
  try { return localStorage.getItem(DIRTY_KEY) === '1'; } catch { return false; }
}
function markDirty(value) {
  try { value ? localStorage.setItem(DIRTY_KEY, '1') : localStorage.removeItem(DIRTY_KEY); } catch {}
}
function syncLabelText() {
  if (sync.status === 'synced') return '☁️ Synced';
  if (sync.status === 'offline') return '⚠️ Offline: changes are saved here and will sync automatically';
  return '☁️ Syncing…';
}
function refreshSyncLabel() {
  const el = document.getElementById('sync-label');
  if (el) el.textContent = syncLabelText();
}

function scheduleSync() {
  if (!sync.token) return;
  markDirty(true);
  sync.pending = true;
  clearTimeout(sync.timer);
  sync.timer = setTimeout(pushState, 800);
}

async function pushState() {
  if (!sync.token) return;
  clearTimeout(sync.timer);
  sync.pending = false;
  sync.status = 'syncing';
  refreshSyncLabel();
  try {
    await apiCall('/state', { method: 'PUT', body: JSON.stringify({ state }) });
    sync.status = 'synced';
    markDirty(false);
    retryDelay = 5000;
    clearTimeout(sync.retry);
    sync.retry = null;
  } catch (error) {
    if (error.status === 401) { signOut(false); return; }
    sync.status = 'offline';
    sync.pending = true;
    markDirty(true);
    // Retry with a growing delay so a flaky connection heals without user action
    if (!sync.retry) {
      sync.retry = setTimeout(() => { sync.retry = null; pushState(); }, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 120000);
    }
  }
  refreshSyncLabel();
}

function replaceStateFromServer(remote) {
  state = normalizeState(remote);
  save_local_only();
}

function save_local_only() {
  try { localStorage.setItem('myLifeState', JSON.stringify(state)); } catch {}
}

async function pullState() {
  if (!sync.token) return;
  // Local edits made while offline must reach the server before anything is replaced
  if (isDirty()) return pushState();
  lastPull = Date.now();
  try {
    const result = await apiCall('/state');
    if (result.state) {
      replaceStateFromServer(result.state);
      render();
    } else {
      await pushState();
      return;
    }
    sync.status = 'synced';
  } catch (error) {
    if (error.status === 401) { signOut(false); return; }
    sync.status = 'offline';
  }
  refreshSyncLabel();
}

async function authenticate(mode, username, password) {
  const result = await apiCall('/' + mode, { method: 'POST', body: JSON.stringify({ username, password }) });
  sync.token = result.token;
  sync.username = result.username;
  try {
    localStorage.setItem(SYNC_TOKEN_KEY, result.token);
    localStorage.setItem(SYNC_USER_KEY, result.username);
  } catch {}
  const remote = await apiCall('/state');
  try { localStorage.setItem('myLifeLocalBackup', JSON.stringify(state)); } catch {}
  if (remote.state) replaceStateFromServer(remote.state);
  else await pushState();
  sync.status = 'synced';
  render();
  showToast('Signed in and your data is synced ☁️');
}

function signOut(notify = true) {
  if (sync.token && notify) apiCall('/logout', { method: 'POST' }).catch(() => {});
  sync.token = null;
  sync.username = null;
  sync.status = 'local';
  clearTimeout(sync.timer);
  clearTimeout(sync.retry);
  sync.retry = null;
  markDirty(false);
  try {
    localStorage.removeItem(SYNC_TOKEN_KEY);
    localStorage.removeItem(SYNC_USER_KEY);
  } catch {}
  if (notify) { render(); showToast('Signed out. Your data stays on this device.'); }
}

const SPROUT_MARK = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M12 21.5V12.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M12.6 12.8C12.6 8.6 15.2 6 19.8 6c0 4.3-2.6 6.8-7.2 6.8z" fill="currentColor"/><path d="M11.6 15.2C11.6 11.4 9.3 9.2 5 9.2c0 3.8 2.3 6 6.6 6z" fill="currentColor" opacity=".8"/></svg>';

function accountMarkup() {
  if (sync.token) {
    const label = syncLabelText();
    return '<div class="plus-panel account-panel" id="plus-account">' +
      '<div class="plus-heading"><div><span class="eyebrow">ACCOUNT</span><h2>My account</h2>' +
      '<p>Your data syncs across all your devices.</p></div></div>' +
      '<div class="settings-row"><div><strong>' + plusEscape(sync.username || '') + '</strong><small id="sync-label">' + label + '</small></div>' +
      '<button id="plus-signout" class="secondary-button" type="button">Sign out</button></div></div>';
  }
  return '<div class="plus-panel account-panel auth-card" id="plus-account">' +
    '<div class="auth-head"><span class="auth-mark" aria-hidden="true">' + SPROUT_MARK + '</span>' +
    '<div><h2>Save your progress</h2><p>Sign in to keep your data safe and use it on every device.</p></div></div>' +
    '<div class="auth-tabs" id="auth-tabs" role="tablist" aria-label="Account">' +
      '<button type="button" role="tab" id="auth-tab-login" data-mode="login" aria-selected="true">Sign in</button>' +
      '<button type="button" role="tab" id="auth-tab-register" data-mode="register" aria-selected="false">Create account</button>' +
    '</div>' +
    '<form id="plus-auth-form" class="auth-form" novalidate>' +
      '<label class="auth-field"><span>Username</span>' +
        '<input name="username" autocomplete="username" placeholder="e.g. ilia_22" maxlength="20" required>' +
        '<small>3–20 characters: letters, numbers or _</small></label>' +
      '<label class="auth-field"><span>Password</span>' +
        '<input name="password" type="password" autocomplete="current-password" placeholder="At least 6 characters" maxlength="100" required>' +
        '<small id="auth-pass-hint">Use at least 6 characters</small></label>' +
      '<button type="submit" class="primary-button auth-submit" id="auth-submit">Sign in</button>' +
      '<p id="plus-auth-error" class="account-error" role="alert"></p>' +
    '</form></div>';
}

function bindTabKeys(container) {
  if (!container) return;
  const tabs = [...container.querySelectorAll('[role="tab"]')];
  tabs.forEach((tab, index) => {
    tab.addEventListener('keydown', event => {
      const keys = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' };
      if (!(event.key in keys)) return;
      event.preventDefault();
      const target = keys[event.key] === 'first' ? 0
        : keys[event.key] === 'last' ? tabs.length - 1
        : (index + keys[event.key] + tabs.length) % tabs.length;
      tabs[target].focus();
      tabs[target].click();
    });
  });
}

function bindAccountPanel() {
  document.getElementById('plus-signout')?.addEventListener('click', () => signOut(true));
  const form = document.getElementById('plus-auth-form');
  if (!form) return;
  let mode = 'login';
  const tabs = document.querySelectorAll('#auth-tabs [role="tab"]');
  const submit = document.getElementById('auth-submit');
  const passInput = form.querySelector('input[name="password"]');
  const passHint = document.getElementById('auth-pass-hint');
  const setMode = next => {
    mode = next;
    tabs.forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.mode === next)));
    submit.textContent = next === 'login' ? 'Sign in' : 'Create account';
    passInput.autocomplete = next === 'login' ? 'current-password' : 'new-password';
    passHint.textContent = next === 'login' ? 'Enter your password' : 'Use at least 6 characters';
    document.getElementById('plus-auth-error').textContent = '';
  };
  tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
  bindTabKeys(document.getElementById('auth-tabs'));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(form);
    const username = String(data.get('username') || '').trim();
    const password = String(data.get('password') || '');
    const errorBox = document.getElementById('plus-auth-error');
    errorBox.textContent = '';
    if (!username || !password) { errorBox.textContent = 'Please fill in both fields'; return; }
    submit.disabled = true;
    submit.textContent = 'Please wait…';
    try {
      await authenticate(mode, username, password);
    } catch (error) {
      const messages = { 401: 'Wrong username or password', 409: 'This username is already taken' };
      errorBox.textContent = error.status === 0 ? 'Cannot reach the server (offline mode)' : (messages[error.status] || error.message || 'Something went wrong');
      submit.disabled = false;
      submit.textContent = mode === 'login' ? 'Sign in' : 'Create account';
    }
  });
}

let storageWarningShown = false;

function save() {
  try {
    localStorage.setItem('myLifeState', JSON.stringify(state));
    scheduleSync();
    return true;
  } catch (error) {
    console.warn('Mylo could not save local data:', error);
    if (!storageWarningShown && document.body) {
      storageWarningShown = true;
      showToast('Browser storage is unavailable; data will not persist after closing the page.');
    }
    return false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function getProgress(type) {
  switch (type) {
    case 'tasks':
      return state.totalTasksCompleted;
    case 'habits':
      return state.totalHabitsCompleted;
    case 'dailyHabits':
      return state.habits.filter(h => h.done).length;
    case 'water':
      return state.water;
    case 'focus':
      return state.focusSessions;
    case 'xp':
      return state.xp;
    default:
      return 0;
  }
}

function checkBadges() {
  badges.forEach(badge => {
    if (!state.earned.includes(badge.id) && getProgress(badge.type) >= badge.target) {
      state.earned.push(badge.id);
      showToast(`🏆 You unlocked the «${badge.title}» badge!`);
    }
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showUndoToast(message, onUndo) {
  const toast = document.createElement('div');
  toast.className = 'toast toast-undo';
  toast.setAttribute('role', 'status');
  const text = document.createElement('span');
  text.textContent = message;
  const undo = document.createElement('button');
  undo.type = 'button';
  undo.className = 'toast-action';
  undo.textContent = 'Undo';
  toast.append(text, undo);
  document.body.appendChild(toast);
  const close = () => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  };
  undo.addEventListener('click', () => { onUndo(); close(); showToast('Restored'); });
  setTimeout(close, 5000);
}

function recordActiveDay() {
  const current = today();
  if (state.lastActiveDate !== current) {
    if (state.lastActiveDate) {
      const gap = Math.round((new Date(current + 'T00:00:00') - new Date(state.lastActiveDate + 'T00:00:00')) / 86400000);
      state.streak = gap === 1 ? state.streak + 1 : 1;
    } else state.streak = 1;
    state.lastActiveDate = current;
    state.longestStreak = Math.max(state.longestStreak, state.streak);
  }
}
function refreshStreak() {
  if (!state.lastActiveDate) return;
  const gap = Math.round((new Date(today() + 'T00:00:00') - new Date(state.lastActiveDate + 'T00:00:00')) / 86400000);
  if (gap > 1 && state.streak !== 0) {
    state.streak = 0;
    save();
  }
}
function addXP(amount) {
  const levelBefore = getLevel();
  state.xp += amount;
  state.xpByDate[today()] = Number(state.xpByDate[today()] || 0) + amount;
  recordActiveDay();
  checkBadges();
  if (getLevel() > levelBefore) showToast(`🎉 You reached level ${getLevel()}!`);
}
function getLevel() {
  return Math.floor(state.xp / 100) + 1;
}

function getLevelProgress() {
  return state.xp % 100;
}

function getTaskPercent() {
  const total = state.tasks.length;
  if (!total) return 0;
  return Math.round(state.tasks.filter(t => t.done).length / total * 100);
}

function getHabitPercent() {
  return Math.round(
    state.habits.filter(h => h.done).length /
    Math.max(state.habits.length, 1) * 100
  );
}

const validViews = ['dashboard', 'planner', 'growth', 'profile', 'focus', 'journal', 'settings'];
let activeView = validViews.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'dashboard';

window.addEventListener('hashchange', () => {
  const view = location.hash.slice(1);
  if (validViews.includes(view) && view !== activeView) {
    activeView = view;
    render();
  }
});

function getOverallPercent() {
  const parts = [];
  if (state.tasks.length) parts.push(getTaskPercent());
  if (state.habits.length) parts.push(getHabitPercent());
  return parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
}

function render() {
  const completedTasks = state.tasks.filter(t => t.done).length;
  const completedHabits = state.habits.filter(h => h.done).length;
  const taskPercent = getTaskPercent();
  const habitPercent = getHabitPercent();

  $('#app').innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-icon" role="img" aria-label="Mylo"><svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d="M12 21.5V12.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M12.6 12.8C12.6 8.6 15.2 6 19.8 6c0 4.3-2.6 6.8-7.2 6.8z" fill="#fff"/><path d="M11.6 15.2C11.6 11.4 9.3 9.2 5 9.2c0 3.8 2.3 6 6.6 6z" fill="#fff" opacity=".8"/></svg></div>
          <div>
            <h2>Mylo</h2>
            <span>YOUR DAILY PROGRESS</span>
          </div>
        </div>

        <nav class="navigation">
          <p class="nav-label">Personal space</p>
          <a class="nav-item ${activeView === 'dashboard' ? 'active' : ''}" ${activeView === 'dashboard' ? 'aria-current="page"' : ''} href="#dashboard" data-view="dashboard"><span class="nav-symbol">⌂</span><span>Overview</span></a>
          <a class="nav-item ${activeView === 'planner' ? 'active' : ''}" ${activeView === 'planner' ? 'aria-current="page"' : ''} href="#planner" data-view="planner"><span class="nav-symbol">✓</span><span>Planner</span></a>
          <a class="nav-item ${activeView === 'growth' ? 'active' : ''}" ${activeView === 'growth' ? 'aria-current="page"' : ''} href="#growth" data-view="growth"><span class="nav-symbol">↗</span><span>Growth</span></a>
          <a class="nav-item ${activeView === 'profile' ? 'active' : ''}" ${activeView === 'profile' ? 'aria-current="page"' : ''} href="#profile" data-view="profile"><span class="nav-symbol">●</span><span>Character</span></a>
          <p class="nav-label">My tools</p>
          <a class="nav-item ${activeView === 'focus' ? 'active' : ''}" ${activeView === 'focus' ? 'aria-current="page"' : ''} href="#focus" data-view="focus"><span class="nav-symbol">◷</span><span>Focus</span></a>
          <a class="nav-item ${activeView === 'journal' ? 'active' : ''}" ${activeView === 'journal' ? 'aria-current="page"' : ''} href="#journal" data-view="journal"><span class="nav-symbol">▤</span><span>Journal</span></a>
          <a class="nav-item ${activeView === 'settings' ? 'active' : ''}" ${activeView === 'settings' ? 'aria-current="page"' : ''} href="#settings" data-view="settings"><span class="nav-symbol">⚙</span><span>Settings</span></a>
        </nav>

        <div class="sidebar-bottom">
          <div class="mini-level">
            <span>Current level</span>
            <strong>Level ${getLevel()}</strong>
            <div class="progress-track">
              <div style="width:${getLevelProgress()}%"></div>
            </div>
            <small>${getLevelProgress()} / 100 XP</small>
          </div>
          <div class="sidebar-footer">Made for a better you ✨</div>
        </div>
      </aside>

      <main class="main-content" id="app-main" tabindex="-1">

        <header class="topbar">
          <div>
            <span class="eyebrow">YOUR DAILY PROGRESS</span>
            <h1>${({dashboard:'Build your day',planner:'Daily planner',growth:'Your growth path',profile:'Character & shop',focus:'Focus space',journal:'Journal',settings:'Settings'})[activeView]}</h1>
            <p class="date-text" id="live-date">${formatDate()}</p>
          </div>

          <div class="topbar-right">
            <div class="level-pill">⭐ Level ${getLevel()}</div><div class="level-pill gem-wallet">💎 ${state.gems.toLocaleString('en-US')}</div>
            <button class="avatar profile-shortcut" data-view="profile" aria-label="Go to character" title="My character"><span class="profile-shortcut-mark" aria-hidden="true"><i></i><b></b><em></em></span></button>
          </div>
        </header>

        <section class="page-view ${activeView === 'dashboard' ? 'active' : ''}" data-page="dashboard">
        <section class="hero-card">
          <div class="hero-content">
            <span class="hero-label">A NEW DAY, A NEW CHANCE</span>
            <h2>One step a day,<br>better than yesterday.</h2>
            <p>Small steps add up to big results over time.</p>
            <a href="#planner" data-view="planner" class="hero-button">
              Start today's plan <span>→</span>
            </a>
          </div>

          <div class="hero-art">
            <div class="growth-card">
              <div class="growth-card-header">
                <span>YOUR PROGRESS</span>
                <span class="growth-live">● LIVE</span>
              </div>

              <div class="growth-content">
                <div class="growth-chart">
                  <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="48" class="chart-bg"/>
                    <circle cx="60" cy="60" r="48" class="chart-progress" style="stroke-dasharray:301.6;stroke-dashoffset:${301.6 * (1 - getOverallPercent() / 100)}"/>
                  </svg>
                  <div class="growth-percent">
                    <strong>${getOverallPercent()}%</strong>
                    <small>Progress</small>
                  </div>
                </div>

                <div class="growth-details">
                  <div class="growth-detail">
                    <span class="growth-dot purple-dot"></span>
                    <span>Tasks</span>
                    <strong>${completedTasks}/${state.tasks.length}</strong>
                  </div>
                  <div class="growth-detail">
                    <span class="growth-dot green-dot"></span>
                    <span>Habits</span>
                    <strong>${completedHabits}/${state.habits.length}</strong>
                  </div>
                  <div class="growth-detail">
                    <span class="growth-dot orange-dot"></span>
                    <span>Goals</span>
                    <strong>${state.goals.filter(g => g.done).length} of ${state.goals.length}</strong>
                  </div>
                </div>
              </div>

              <div class="growth-footer">
                <span>🌱</span>
                <span>Every step is new progress</span>
              </div>
            </div>

          </div>
        </section>

        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon purple">☑</div>
            <span>Tasks completed</span>
            <strong>${completedTasks}<small> / ${state.tasks.length}</small></strong>
            <div class="stat-progress">
              <div style="width:${taskPercent}%"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon green">◈</div>
            <span>Today's habits</span>
            <strong>${completedHabits}<small> / ${state.habits.length}</small></strong>
            <div class="stat-progress">
              <div style="width:${habitPercent}%"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon orange">⭐</div>
            <span>XP</span>
            <strong>${state.xp}<small> XP</small></strong>
            <div class="stat-progress">
              <div style="width:${getLevelProgress()}%"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon cyan">💧</div>
            <span>Water logged</span>
            <strong>${state.water}<small> / ${waterTarget()} glasses</small></strong>
            <div class="stat-progress">
              <div style="width:${Math.min(state.water / waterTarget() * 100, 100)}%"></div>
            </div>
          </div>
        </section>


        <section class="daily-path-panel">
          <div class="daily-path-heading">
            <div><span class="eyebrow">YOUR DAILY JOURNEY</span><h2>Today's path</h2><p>Every small step moves you forward.</p></div>
            <span class="daily-path-progress">${getOverallPercent()}%</span>
          </div>
          <div class="daily-path-steps">
            <a href="#planner" data-view="planner" class="daily-path-step ${completedTasks > 0 ? 'step-started' : ''}">
              <span class="daily-step-node">✓</span><span><strong>Plan</strong><small>${completedTasks} of ${state.tasks.length} tasks</small></span><b>→</b>
            </a>
            <a href="#planner" data-view="planner" class="daily-path-step ${completedHabits > 0 ? 'step-started' : ''}">
              <span class="daily-step-node">🌱</span><span><strong>Build a habit</strong><small>${completedHabits} of ${state.habits.length} habits</small></span><b>→</b>
            </a>
            <a href="#focus" data-view="focus" class="daily-path-step ${state.focusSessions > 0 ? 'step-started' : ''}">
              <span class="daily-step-node">◷</span><span><strong>Deep focus</strong><small>${state.focusSessions} sessions completed</small></span><b>→</b>
            </a>
            <a href="#journal" data-view="journal" class="daily-path-step">
              <span class="daily-step-node">✎</span><span><strong>Review your day</strong><small>Write a short note</small></span><b>→</b>
            </a>
          </div>
        </section>
        </section>

        <section class="page-view ${activeView === 'planner' ? 'active' : ''}" data-page="planner">
          <div class="page-intro"><span class="eyebrow">PLAN YOUR DAY</span><h2>Smart planner</h2><p>Manage your tasks and habits calmly.</p></div>
        <section class="content-grid">

          <div class="panel tasks-panel" id="tasks">
            <div class="section-heading">
              <div>
                <span class="eyebrow">DAILY PLANNER</span>
                <h2>Today's tasks</h2>
              </div>
              <span class="counter">${completedTasks}/${state.tasks.length}</span>
            </div>

            <form id="task-form" class="add-form">
              <input
                id="task-input"
                placeholder="What do you need to do?"
                maxlength="100"
                required
              >
              <button type="submit" aria-label="Add task">+</button>
            </form>

            <div class="task-list">
              ${state.tasks.length ? state.tasks.map(task => `
                <div class="task-item ${task.done ? 'completed' : ''}">
                  <button
                    class="task-check"
                    data-action="task-toggle"
                    data-id="${task.id}"
                    aria-label="${task.done ? 'Mark as not done' : 'Mark as done'}"
                  >${task.done ? '✓' : ''}</button>

                  <span>${escapeHTML(task.title)}</span>

                  <button
                    class="delete-button"
                    data-action="task-delete"
                    data-id="${task.id}"
                  >×</button>
                </div>
              `).join('') : `
                <div class="empty-state">
                  No tasks yet. Add your first one ✨
                </div>
              `}
            </div>
          </div>

          <div class="panel habits-panel" id="habits">
            <div class="section-heading">
              <div>
                <span class="eyebrow">BUILD YOURSELF</span>
                <h2>Daily habits</h2>
              </div>
              <span class="counter">${habitPercent}%</span>
            </div>

            <div class="habit-list">
              ${state.habits.map(habit => `
                <div class="habit-row">
                  <button
                    class="habit-item ${habit.done ? 'habit-done' : ''}"
                    data-action="habit-toggle"
                    data-id="${habit.id}"
                  >
                    <span class="habit-icon">${escapeHTML(habit.icon)}</span>
                    <span class="habit-title">${escapeHTML(habit.title)}</span>
                    <span class="habit-status">${habit.done ? '✓' : '+'}</span>
                  </button>
                  <button
                    class="delete-button"
                    data-action="habit-delete"
                    data-id="${habit.id}"
                    aria-label="Delete habit"
                  >×</button>
                </div>
              `).join('')}
            </div>
            <form id="habit-form" class="add-form">
              <input id="habit-input" placeholder="New habit..." maxlength="80" required>
              <button type="submit" aria-label="Add habit">+</button>
            </form>

            <div class="habit-summary">
              <div class="progress-track">
                <div style="width:${habitPercent}%"></div>
              </div>
              <small>
                ${completedHabits} of ${state.habits.length} habits done
              </small>
            </div>
          </div>
        </section>

        </section>

        <section class="page-view ${activeView === 'growth' ? 'active' : ''}" data-page="growth">
          <div class="page-intro"><span class="eyebrow">PERSONAL GROWTH</span><h2>Your growth path</h2><p>See your achievements and take the next steps.</p></div>
        <section class="panel achievements-panel" id="achievements">
          <div class="badge-hero">
            <div class="badge-hero-copy">
              <span class="eyebrow">YOUR JOURNEY · ACHIEVEMENT GALLERY</span>
              <h2>Hall of badges</h2>
              <p>Each badge marks a step you took toward growth.</p>
              <div class="badge-hero-progress">
                <div class="badge-hero-track"><span style="width:${Math.round(state.earned.length / badges.length * 100)}%"></span></div>
                <strong>${Math.round(state.earned.length / badges.length * 100)}% complete</strong>
              </div>
            </div>
            <div class="badge-trophy" aria-hidden="true"><span>🏆</span></div>
          </div>
          <div class="badge-overview">
            <div class="badge-overview-item"><span class="badge-overview-icon">🏅</span><div><strong>${state.earned.length}</strong><small>badges earned</small></div></div>
            <div class="badge-overview-item"><span class="badge-overview-icon">🔒</span><div><strong>${badges.length - state.earned.length}</strong><small>badges left</small></div></div>
            <div class="badge-overview-item"><span class="badge-overview-icon">⭐</span><div><strong>${state.xp}</strong><small>XP</small></div></div>
          </div>

          <div class="badge-filter-heading"><div><strong>Badge collection</strong><small>Track your progress</small></div><span>${state.earned.length} of ${badges.length}</span></div>
          <div class="badge-filters">
            <button class="filter-btn active" data-filter="all" aria-pressed="true">All</button>
            <button class="filter-btn" data-filter="earned" aria-pressed="false">Earned</button>
            <button class="filter-btn" data-filter="locked" aria-pressed="false">Locked</button>
          </div>

          <div class="badge-grid">
            ${badges.map(badge => {
              const earned = state.earned.includes(badge.id);
              const progress = Math.min(getProgress(badge.type), badge.target);
              const percent = Math.round(progress / badge.target * 100);

              return `
                <article
                  class="badge-card ${earned ? 'unlocked' : 'locked'} ${badge.color}"
                  data-badge="${badge.id}"
                  data-status="${earned ? 'earned' : 'locked'}"
                >
                  <div class="badge-card-topline">
                    <span class="badge-rarity-chip ${badge.target >= 500 ? 'rarity-legendary' : badge.target >= 100 || badge.target >= 10 ? 'rarity-epic' : 'rarity-rare'}">${badge.target >= 500 ? 'Legendary' : badge.target >= 100 || badge.target >= 10 ? 'Epic' : 'Special'}</span>
                    <span class="badge-lock">${earned ? '✓' : '🔒'}</span>
                  </div>
                  <div class="badge-emblem-wrap">
                    <div class="badge-emblem">${badgeArt(badge.id)}</div>
                  </div>
                  <div class="badge-card-copy">
                    <h3>${badge.title}</h3>
                    <p>${badge.description}</p>
                  </div>
                  <div class="badge-progress">
                    <div class="badge-progress-label"><small>${earned ? 'Badge earned' : 'Progress'}</small><strong>${earned ? '100' : percent}%</strong></div>
                    <div class="badge-progress-track"><div style="width:${earned ? 100 : percent}%"></div></div>
                    <small class="badge-progress-count">${earned ? '✓ Complete' : `${progress} of ${badge.target}`}</small>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </section>

        </section>

        <section class="page-view ${activeView === 'focus' ? 'active' : ''}" data-page="focus">
          <div class="page-intro"><span class="eyebrow">FOCUS & WELLBEING</span><h2>Focus space</h2><p>Make time for deep work and looking after yourself.</p></div>
        <section class="content-grid lower-grid">

          <div class="panel focus-panel" id="focus">
            <div class="section-heading">
              <div>
                <span class="eyebrow">DEEP WORK</span>
                <h2>Focus timer</h2>
              </div>
              <span class="focus-icon">◷</span>
            </div>

            <div class="timer" id="timer">25:00</div>
            <p class="timer-description">
              25 minutes of focus for what matters
            </p>

            <div class="timer-controls">
              <button id="timer-start" class="primary-button">${timerRunning ? "Pause" : timerSeconds < 25 * 60 ? "Resume" : "Start"}</button>
              <button id="timer-reset" class="secondary-button">Reset</button>
            </div>

            <small class="focus-count">
              Sessions completed: ${state.focusSessions}
            </small>
          </div>

          <div class="panel water-panel">
            <div class="section-heading">
              <div>
                <span class="eyebrow">STAY HYDRATED</span>
                <h2>Water tracker</h2>
              </div>
              <span class="water-icon">💧</span>
            </div>

            <div class="water-number">
              ${state.water}<small> / ${waterTarget()}</small>
            </div>

            <p>Glasses of water today</p>

            <div class="water-glasses">
              ${Array.from({ length: waterTarget() }, (_, i) => `
                <span class="${i < state.water ? 'filled' : ''}">💧</span>
              `).join('')}
            </div>

            <button class="primary-button water-add" id="water-add">
              + Log a glass
            </button>
          </div>
        </section>

        </section>

        <section class="page-view ${activeView === 'journal' ? 'active' : ''}" data-page="journal">
          <div class="page-intro"><h2>Journal</h2></div>
        </section>

        <section class="page-view ${activeView === 'profile' ? 'active' : ''} profile-page" data-page="profile"><div class="page-intro"><span class="eyebrow">YOUR CHARACTER · YOUR JOURNEY</span><h2>Character & shop</h2><p>Build your look, collect your experiences and see your progress.</p></div><div id="profile-experience"></div></section>
        <section class="page-view ${activeView === 'settings' ? 'active' : ''}" data-page="settings">
          <div class="page-intro"><span class="eyebrow">PREFERENCES</span><h2>Your settings</h2><p>Manage the app's look, your goals and your data backup.</p></div>
        </section>

        <footer class="footer">
          <span>MYLO ✦</span>
          <p>Small steps. Big changes.</p>
          <span>Built for your better self</span>
        </footer>

      </main>
    </div>
  `;

  bindEvents();
  updateTimerDisplay();
}

function bindEvents() {
  document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      activeView = link.dataset.view;
      document.querySelectorAll('[data-view]').forEach(item => item.classList.toggle('active', item.classList.contains('nav-item') && item.dataset.view === activeView));
      document.querySelectorAll('[data-page]').forEach(page => page.classList.toggle('active', page.dataset.page === activeView));
      const titles = { dashboard: 'Build your day', planner: 'Smart planner', growth: 'Your growth path', profile: 'Character & shop', focus: 'Focus space', journal: 'Journal', settings: 'Settings' };
      const heading = $('.topbar h1');
      if (heading) heading.innerHTML = `${titles[activeView]}`;
      history.replaceState(null, '', `#${activeView}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  $('#task-form').addEventListener('submit', e => {
    e.preventDefault();

    const input = $('#task-input');
    const title = input.value.trim();

    if (!title) return;

    state.tasks.push({
      id: Date.now(),
      title,
      done: false,
      rewardClaimed: false,
      countedComplete: false
    });

    input.value = '';
    save();
    render();
    showToast('New task added ✨');
  });

  $('#habit-form').addEventListener('submit', e => {
    e.preventDefault();
    const title = $('#habit-input').value.trim();
    if (!title) return;
    state.habits.push({ id: Date.now(), title: title.slice(0, 80), icon: '✦', done: false, lastRewardDate: null });
    save();
    render();
    showToast('New habit added ✨');
  });

  document.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset.id);

      if (button.dataset.action === 'task-toggle') {
        const task = state.tasks.find(t => t.id === id);
        if (!task) return;

        task.done = !task.done;
        if (task.done) {
          if (!task.countedComplete) { state.totalTasksCompleted++; task.countedComplete = true; }
          if (!task.rewardClaimed) { addXP(10); state.gems += 2; task.rewardClaimed = true; showToast('You earned 10 XP and 2 crystals!'); }
        }
      }

      if (button.dataset.action === 'habit-delete' || button.dataset.action === 'task-delete') {
        const isHabit = button.dataset.action === 'habit-delete';
        const list = isHabit ? state.habits : state.tasks;
        const index = list.findIndex(item => item.id === id);
        if (index >= 0) {
          const [removed] = list.splice(index, 1);
          showUndoToast(isHabit ? 'Habit deleted' : 'Task deleted', () => {
            list.splice(Math.min(index, list.length), 0, removed);
            save();
            render();
          });
        }
      }

      if (button.dataset.action === 'habit-toggle') {
        const habit = state.habits.find(h => h.id === id);
        if (!habit) return;

        habit.done = !habit.done;

        if (habit.done && habit.lastRewardDate !== today()) {
          addXP(10); state.gems += 2; state.totalHabitsCompleted++;
          habit.lastRewardDate = today();
          showToast('You earned 10 XP and 2 crystals for this habit!');
        }
      }

      checkBadges();
      save();
      render();
    });
  });

  document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
      });

      button.classList.add('active');

      document.querySelectorAll('.badge-card').forEach(card => {
        const filter = button.dataset.filter;
        card.style.display =
          filter === 'all' || card.dataset.status === filter ? '' : 'none';
      });
    });
  });

  $('#water-add').addEventListener('click', () => {
    if (state.water >= waterTarget()) {
      showToast('Daily water goal complete 💧');
      return;
    }

    state.water++;
    addXP(2);
    if (state.water >= waterTarget() && state.waterRewardDate !== today()) {
      state.gems += 3;
      state.waterRewardDate = today();
      showToast('Today\'s water goal done; you earned 3 crystals! 💎');
    }
    save();
    render();
  });

  $('#timer-start').addEventListener('click', toggleTimer);
  $('#timer-reset').addEventListener('click', resetTimer);
}

let timerSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;
let timerEndAt = null;

function updateTimerDisplay() {
  const timer = $('#timer');
  if (!timer) return;

  if (timerRunning && timerEndAt !== null) {
    timerSeconds = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
  }
  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const seconds = String(timerSeconds % 60).padStart(2, '0');
  timer.textContent = `${minutes}:${seconds}`;
}

function finishTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerEndAt = null;
  timerRunning = false;
  timerSeconds = 0;

  state.focusSessions++;
  addXP(25);
  state.gems += 3;
  save();
  showToast('Focus session complete!');
  timerSeconds = 25 * 60;
  render();
}

function toggleTimer() {
  if (timerRunning) {
    timerSeconds = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
    clearInterval(timerInterval);
    timerInterval = null;
    timerEndAt = null;
    timerRunning = false;
    updateTimerDisplay();
    $('#timer-start').textContent = 'Resume';
    return;
  }

  if (timerSeconds <= 0) timerSeconds = 25 * 60;
  timerRunning = true;
  timerEndAt = Date.now() + timerSeconds * 1000;
  $('#timer-start').textContent = 'Pause';

  timerInterval = setInterval(() => {
    updateTimerDisplay();
    if (timerSeconds <= 0) finishTimer();
  }, 250);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerEndAt = null;
  timerRunning = false;
  timerSeconds = 25 * 60;
  updateTimerDisplay();
  $('#timer-start').textContent = 'Start';
}

function updateClock() {
  const dateElement = $('#live-date');
  if (dateElement) dateElement.textContent = formatDate();
}

setInterval(() => {
  if (today() !== state.date) {
    resetDailyData();
    refreshStreak();
    save();
    render();
    showToast('A new day has started! ✨');
  } else {
    refreshStreak();
    updateClock();
  }
}, 30000);

checkBadges();
refreshStreak();
save();
render();


// Mylo Plus — incremental feature layer (keeps existing data and workflows).
const originalRender = render;
const plusDefaults = { theme: 'light', waterTarget: 8 };
state.goals = Array.isArray(state.goals) ? state.goals : [];
state.journal = state.journal && typeof state.journal === 'object' ? state.journal : {};
if (!state.journal[state.date] && state.notes) state.journal[state.date] = state.notes;
state.settings = { ...plusDefaults, ...(state.settings || {}) };

function plusEscape(value) {
  return escapeHTML(value ?? '');
}
function plusSave() {
  save();
}

const avatarCategories = [
 {id:'gender',label:'Gender',icon:'👤'},
 {id:'skin',label:'Skin tone',icon:'🎨'},
 {id:'faceShape',label:'Face shape',icon:'🙂'},
 {id:'hairStyle',label:'Hair style',icon:'💇'},
 {id:'hairColor',label:'Hair color',icon:'🖌️'},
 {id:'eyeStyle',label:'Eye shape',icon:'👁️'},
 {id:'eyeColor',label:'Eye color',icon:'🔵'},
 {id:'browStyle',label:'Eyebrows',icon:'〰️'},
 {id:'expression',label:'Expression',icon:'😊'},
 {id:'mouthStyle',label:'Mouth',icon:'👄'},
 {id:'faceDetail',label:'Face details',icon:'✨'},
 {id:'outfitStyle',label:'Outfit',icon:'👕'},
 {id:'outfitColor',label:'Outfit color',icon:'🎽'},
 {id:'accessory',label:'Accessory',icon:'🕶️'},
 {id:'background',label:'Background',icon:'🖼️'}
];
let activeAvatarCategory = 'skin';
const avatarChoices = {
 gender:[{value:'boy',label:'Boy',icon:'♂'},{value:'girl',label:'Girl',icon:'♀'}],
 skin:[['#f8d9c2','Very light'],['#efc49f','Light'],['#d99b72','Wheat'],['#bd805d','Caramel'],['#925c43','Brown'],['#684638','Dark']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 faceShape:[{value:'soft',label:'Oval',icon:'◯'},{value:'round',label:'Round',icon:'●'},{value:'square',label:'Square',icon:'▢'},{value:'heart',label:'Heart',icon:'♡'}],
 hairStyle:[{value:'short',label:'Short',icon:'⌁'},{value:'wave',label:'Wavy',icon:'〰'},{value:'curly',label:'Curly',icon:'❋'},{value:'long',label:'Long',icon:'〰'},{value:'bob',label:'Bob',icon:'⌒'},{value:'ponytail',label:'Ponytail',icon:'↗'},{value:'bun',label:'Bun',icon:'◉',cost:45},{value:'afro',label:'Afro',icon:'✿',cost:55}],
 hairColor:[['#292321','Black'],['#49312f','Brown'],['#87513a','Hazel'],['#d6a04d','Blonde'],['#a65e91','Lilac'],['#6376c9','Blue']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 eyeStyle:[{value:'soft',label:'Natural',icon:'◉'},{value:'round',label:'Round',icon:'●'},{value:'almond',label:'Almond',icon:'◖'},{value:'wide',label:'Wide',icon:'◎'}],
 eyeColor:[['#49362d','Brown'],['#4b8177','Teal'],['#5574aa','Blue'],['#747b8d','Grey'],['#67915a','Green']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 browStyle:[{value:'natural',label:'Natural',icon:'⌒'},{value:'soft',label:'Thin',icon:'﹏'},{value:'bold',label:'Bold',icon:'━'},{value:'arched',label:'Arched',icon:'⌃'}],
 expression:[{value:'happy',label:'Happy',icon:'☺'},{value:'excited',label:'Excited',icon:'✧'},{value:'confident',label:'Confident',icon:'⌣'},{value:'surprised',label:'Surprised',icon:'◉'},{value:'sleepy',label:'Calm',icon:'ᴗ'},{value:'wink',label:'Wink',icon:'😉'}],
 mouthStyle:[{value:'smile',label:'Smile',icon:'⌣'},{value:'grin',label:'Grin',icon:'◡'},{value:'neutral',label:'Neutral',icon:'—'},{value:'small',label:'Small',icon:'ᴗ'},{value:'open',label:'Open',icon:'◯'}],
 faceDetail:[{value:'none',label:'Plain',icon:'○'},{value:'freckles',label:'Freckles',icon:'⁙'},{value:'beauty',label:'Beauty mark',icon:'•'},{value:'blush',label:'Rosy cheeks',icon:'♡'}],
 outfitStyle:[{value:'tee',label:'T-shirt',icon:'▱'},{value:'hoodie',label:'Hoodie',icon:'▰'},{value:'jacket',label:'Jacket',icon:'▥',cost:45},{value:'varsity',label:'Varsity',icon:'▤',cost:65},{value:'artist',label:'Artist',icon:'◈',cost:55},{value:'sporty',label:'Team kit',icon:'▣',cost:50,isNew:true},{value:'vest',label:'Vest',icon:'▥',cost:40,isNew:true},{value:'hanfu',label:'Traditional',icon:'◈',cost:65,isNew:true}],
 outfitColor:[['#7666df','Purple'],['#4caa83','Green'],['#e77d9f','Pink'],['#4f83bd','Blue'],['#e59b4e','Orange'],['#38465d','Navy'],['#e8e5d8','Cream']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 accessory:[{value:'none',label:'No accessory',icon:'—'},{value:'glasses',label:'Glasses',icon:'▱'},{value:'round',label:'Round glasses',icon:'◎'},{value:'headphones',label:'Headphones',icon:'◖',cost:35},{value:'flower',label:'Flower',icon:'✿',cost:35},{value:'cap',label:'Cap',icon:'⌂',cost:45},{value:'bow',label:'Bow',icon:'⋈',cost:35},{value:'sunglasses',label:'Sunglasses',icon:'🕶',cost:40,isNew:true},{value:'crown',label:'Crown',icon:'♛',cost:70,isNew:true},{value:'beanie',label:'Beanie',icon:'▲',cost:45,isNew:true},{value:'star',label:'Star clip',icon:'★',cost:30,isNew:true},{value:'earrings',label:'Earrings',icon:'◦',cost:30,isNew:true},{value:'scarf',label:'Scarf',icon:'〰',cost:40,isNew:true}],
 background:[{value:'blossom',label:'Mint',icon:'◉'},{value:'meadow',label:'Meadow',icon:'◉'},{value:'ocean',label:'Ocean',icon:'◉'},{value:'sunset',label:'Sunset',icon:'◉'},{value:'lavender',label:'Lavender',icon:'◉'}]
};
let avatarSeq = 0;
function avatarMarkup(size, override) {
 const p={...(state.profile||{}),...(override||{})};
 const safe=(key,fallback)=>((avatarChoices[key]||[]).some(x=>x.value===p[key])?p[key]:fallback);
 const girl=safe('gender','boy')==='girl';
 const skin=safe('skin','#d99b72'), hair=safe('hairColor','#49312f');
 const eyes=safe('eyeColor','#49362d'), shirt=safe('outfitColor','#4caa83');
 const hairStyle=safe('hairStyle','wave'), faceShape=safe('faceShape','soft');
 const eyeStyle=safe('eyeStyle','soft'), browStyle=safe('browStyle','natural');
 const expression=safe('expression','happy'), mouthStyle=safe('mouthStyle','smile');
 const detail=safe('faceDetail','none'), outfitStyle=safe('outfitStyle','tee');
 const accessory=safe('accessory','none'), background=safe('background','blossom');
 const uid='av'+(++avatarSeq);
 const ink='#4a2f25', lipC=girl?'#c9646c':'#9e5553';
 const inset=girl?9:0;
 const facePath={
  soft:'M90 39 C65 39 48 58 49 88 L50 112 C51 139 68 157 90 158 C112 157 129 139 130 112 L131 88 C132 58 115 39 90 39Z',
  round:'M90 40 C61 40 46 62 48 94 L51 119 C55 145 71 158 90 158 C109 158 125 145 129 119 L132 94 C134 62 119 40 90 40Z',
  square:'M90 39 C64 39 49 56 49 84 L49 116 Q50 151 72 157 L108 157 Q130 151 131 116 L131 84 C131 56 116 39 90 39Z',
  heart:'M90 42 C68 28 48 51 49 82 L53 116 Q61 147 90 158 Q119 147 127 116 L131 82 C132 51 112 28 90 42Z'
 }[faceShape];
 const hairBack={
  short:'<path d="M45 91 Q38 38 70 22 Q101 7 125 29 Q145 49 135 103 L126 125 L116 81 L64 81 L55 124Z"/>',
  wave:'<path d="M43 92 Q34 42 66 22 Q98 4 126 28 Q149 49 137 105 L141 160 Q127 174 114 157 L111 91 L67 91 L64 157 Q48 173 38 158 L44 105Z"/>',
  long:'<path d="M42 91 Q35 38 67 21 Q99 4 127 28 Q149 49 137 103 L145 192 Q130 202 116 187 L110 94 L67 94 L63 187 Q47 202 35 190 L43 104Z"/>',
  bob:'<path d="M43 91 Q35 38 67 21 Q99 4 127 28 Q149 49 137 103 L137 151 Q125 165 111 150 L110 92 L67 92 L65 150 Q50 165 39 151Z"/>',
  ponytail:'<path d="M126 44 Q160 48 157 91 Q154 119 132 126 L119 105Z"/><path d="M43 91 Q35 39 67 22 Q99 5 127 29 Q149 50 137 103 L133 128 L47 128Z"/>',
  curly:'<circle cx="48" cy="63" r="17"/><circle cx="61" cy="39" r="20"/><circle cx="84" cy="25" r="21"/><circle cx="108" cy="27" r="21"/><circle cx="129" cy="43" r="20"/><circle cx="139" cy="67" r="17"/><path d="M42 70 Q35 119 48 157 L65 160 L68 83Z M138 70 Q146 119 132 157 L115 160 L112 83Z"/>',
  bun:'<circle cx="122" cy="30" r="18"/><path d="M43 91 Q35 39 67 22 Q99 5 127 29 Q149 50 137 103 L133 128 L47 128Z"/>',
  afro:'<circle cx="49" cy="66" r="21"/><circle cx="60" cy="43" r="23"/><circle cx="82" cy="28" r="24"/><circle cx="108" cy="29" r="24"/><circle cx="129" cy="45" r="23"/><circle cx="139" cy="69" r="21"/><circle cx="90" cy="17" r="19"/>'
 }[hairStyle]||'';
 const fringe={
  short:'<path d="M48 83 Q46 31 89 25 Q130 25 132 83 Q116 67 104 82 Q91 66 78 82 Q63 68 48 83Z"/>',
  wave:'<path d="M47 83 Q44 34 75 27 Q103 17 124 40 Q135 55 132 84 Q117 69 104 83 Q90 67 78 83 Q62 69 47 83Z"/>',
  long:'<path d="M47 83 Q44 31 89 24 Q130 25 133 83 Q117 67 104 82 Q90 66 78 83 Q62 67 47 83Z"/>',
  bob:'<path d="M47 83 Q44 31 89 24 Q130 25 133 83 Q117 67 104 82 Q90 66 78 83 Q62 67 47 83Z"/>',
  ponytail:'<path d="M47 83 Q44 31 89 24 Q130 25 133 83 Q117 67 104 82 Q90 66 78 83 Q62 67 47 83Z"/>',
  curly:'<circle cx="55" cy="65" r="15"/><circle cx="74" cy="45" r="17"/><circle cx="92" cy="39" r="18"/><circle cx="111" cy="45" r="17"/><circle cx="126" cy="65" r="15"/>',
  bun:'<path d="M47 83 Q44 31 89 24 Q130 25 133 83 Q117 67 104 82 Q90 66 78 83 Q62 67 47 83Z"/>',
  afro:'<path d="M48 84 Q44 44 68 32 Q90 16 115 31 Q137 43 132 84Z"/>'
 }[hairStyle]||'';
 const shoulderW=girl?'M38 238 C40 200 52 176 70 168 L90 181 L110 168 C128 176 140 200 142 238Z':'M28 238 C30 198 44 172 66 166 L90 180 L114 166 C136 172 150 198 152 238Z';
 const shirtFill='<path d="'+shoulderW+'" fill="var(--shirt)"/>';
 const shirtShade='<path d="'+shoulderW+'" fill="url(#'+uid+'sh)"/>';
 const clothes={
  tee:'<path d="M74 170 Q90 194 106 170" fill="none" stroke="#ffffffc2" stroke-width="4" stroke-linecap="round"/><path d="M34 232 Q44 204 62 192" fill="none" stroke="#00000014" stroke-width="3" stroke-linecap="round"/>',
  hoodie:'<path d="M68 172 Q90 136 112 172 Q106 188 90 190 Q74 188 68 172Z" fill="#00000026"/><path d="M86 186 V208 M94 186 V208" stroke="#ffffffb3" stroke-width="2.4" stroke-linecap="round"/><path d="M70 216 Q90 227 110 216 L110 234 H70Z" fill="#0000001c"/>',
  jacket:'<path d="M76 168 L92 204 L84 238 L60 238 L66 180Z" fill="#ffffff26"/><path d="M104 168 L88 204 L96 238 L120 238 L114 180Z" fill="#ffffff26"/><path d="M90 204 V238" stroke="#ffffffc2" stroke-width="2.6"/>',
  varsity:'<path d="M76 168 L92 204 L84 238 L60 238 L66 180Z" fill="#ffffff22"/><path d="M104 168 L88 204 L96 238 L120 238 L114 180Z" fill="#ffffff22"/><path d="M34 228 L48 196 M28 218 L44 186" stroke="#f4d16b" stroke-width="5" stroke-linecap="round"/><path d="M152 228 L138 196 M158 218 L142 186" stroke="#f4d16b" stroke-width="5" stroke-linecap="round"/><path d="M122 196 L124 202 L130 202 L125 206 L127 212 L122 208 L117 212 L119 206 L114 202 L120 202Z" fill="#fff"/>',
  artist:'<path d="M70 186 H110 L114 238 H66Z" fill="#f7dfb7"/><path d="M80 194 H100" stroke="#c88f57" stroke-width="3" stroke-linecap="round"/><circle cx="82" cy="212" r="3.2" fill="#e77d9f"/><circle cx="95" cy="222" r="3.2" fill="#4f83bd"/><circle cx="104" cy="206" r="3.2" fill="#4caa83"/>',
  sporty:'<path d="M60 184 H120" stroke="#ffffffc2" stroke-width="4" stroke-linecap="round"/><path d="M86 204 L96 204 L86 224" fill="none" stroke="#ffffffe6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
  vest:'<path d="M74 168 L90 200 L106 168 L114 238 H66Z" fill="#00000022"/><path d="M90 200 V238" stroke="#ffffffb0" stroke-width="2.4"/>',
  hanfu:'<path d="M74 168 L90 200 L76 238 H58Z" fill="#ffffff26"/><path d="M106 168 L90 200 L104 238 H122Z" fill="#ffffff26"/><path d="M90 200 V238" stroke="#f4d16b" stroke-width="3"/><path d="M60 230 H120" stroke="#f4d16b" stroke-width="2.4"/>'
 }[outfitStyle]||'';
 const eyeRx=eyeStyle==='wide'?10.4:eyeStyle==='round'?10:eyeStyle==='almond'?9:9.2;
 const eyeRy=eyeStyle==='wide'?12:eyeStyle==='round'?11.6:eyeStyle==='almond'?7:(girl?11.4:10.6);
 const eyeArt=(cx,mode,side)=>{
  const rx=eyeRx, ry=expression==='confident'?eyeRy*0.8:expression==='surprised'?eyeRy+1.2:eyeRy;
  if(mode==='closed') return '<path d="M'+(cx-rx)+' 102 Q'+cx+' '+(102+5)+' '+(cx+rx)+' 102" fill="none" stroke="'+ink+'" stroke-width="2.6" stroke-linecap="round"/>';
  const top=101-ry;
  let s='<ellipse cx="'+cx+'" cy="101" rx="'+rx+'" ry="'+ry+'" fill="#fffdf8"/>';
  s+='<ellipse cx="'+cx+'" cy="'+(101.8)+'" rx="'+(rx*0.66).toFixed(2)+'" ry="'+(ry*0.74).toFixed(2)+'" fill="'+eyes+'"/>';
  s+='<ellipse cx="'+cx+'" cy="101.8" rx="'+(rx*0.66).toFixed(2)+'" ry="'+(ry*0.74).toFixed(2)+'" fill="url(#'+uid+'ir)"/>';
  s+='<circle cx="'+cx+'" cy="102" r="'+(rx*0.3).toFixed(2)+'" fill="#1d1512"/>';
  s+='<circle cx="'+(cx+rx*0.28).toFixed(2)+'" cy="'+(101-ry*0.36).toFixed(2)+'" r="2.6" fill="#fff"/><circle cx="'+(cx-rx*0.3).toFixed(2)+'" cy="'+(101+ry*0.42).toFixed(2)+'" r="1.2" fill="#fff" opacity=".9"/>';
  s+='<path d="M'+(cx-rx-0.4)+' 101 Q'+cx+' '+(top-2.2).toFixed(2)+' '+(cx+rx+0.4)+' 101" fill="none" stroke="'+ink+'" stroke-width="2.1" stroke-linecap="round"/>';
  return s;
 };
 const leftMode=expression==='sleepy'?'closed':expression==='wink'?'closed':'open';
 const rightMode=expression==='sleepy'?'closed':'open';
 const eyesArt='<g class="av-eyes">'+eyeArt(74,leftMode,-1)+eyeArt(106,rightMode,1)+'</g>';
 const browWeight=browStyle==='bold'?(girl?3.6:4.6):browStyle==='soft'?2.1:3.1;
 const browPath=browStyle==='arched'?'M63 88 Q74 77 85 89 M95 89 Q106 77 117 88':expression==='surprised'?'M64 84 Q74 76 84 83 M96 83 Q106 76 116 84':'M64 89 Q74 83 84 89 M96 89 Q106 83 116 89';
 const mouth=expression==='surprised'||mouthStyle==='open'
  ? '<ellipse cx="90" cy="135" rx="6" ry="8" fill="#9e5553"/><ellipse cx="90" cy="131" rx="4" ry="2.4" fill="#ffffff80"/>'
  : expression==='confident'
   ? '<path d="M81 134 Q92 139 101 131" fill="none" stroke="'+lipC+'" stroke-width="3" stroke-linecap="round"/>'
   : mouthStyle==='neutral'
    ? '<path d="M82 135 H98" fill="none" stroke="'+lipC+'" stroke-width="2.8" stroke-linecap="round"/>'
    : mouthStyle==='grin'||expression==='excited'
     ? '<path d="M78 130 Q90 148 103 130 Q91 135 78 130Z" fill="#fff" stroke="'+lipC+'" stroke-width="2.2" stroke-linejoin="round"/>'
     : mouthStyle==='small'
      ? '<path d="M84 134 Q90 138 96 134" fill="none" stroke="'+lipC+'" stroke-width="2.4" stroke-linecap="round"/>'
      : '<path d="M79 131 Q90 145 102 131" fill="none" stroke="'+lipC+'" stroke-width="3" stroke-linecap="round"/>'+(girl?'<path d="M84 132.5 Q90 135.5 96 132.5" fill="none" stroke="#ffffff99" stroke-width="1.1" stroke-linecap="round"/>':'');
 const blush=detail==='blush'?0.8:girl?0.6:0.4;
 const faceDetail=detail==='freckles'
  ? '<g fill="#9c654b" opacity=".75"><circle cx="63" cy="119" r="1.5"/><circle cx="69" cy="122" r="1.4"/><circle cx="76" cy="120" r="1.3"/><circle cx="104" cy="120" r="1.3"/><circle cx="111" cy="122" r="1.4"/><circle cx="117" cy="119" r="1.5"/></g>'
  : detail==='beauty'?'<circle cx="115" cy="119" r="2" fill="#80513e"/>'
  : '<ellipse cx="66" cy="119" rx="9" ry="4.6" fill="#ee8791" opacity="'+blush+'"/><ellipse cx="114" cy="119" rx="9" ry="4.6" fill="#ee8791" opacity="'+blush+'"/>';
 const accessoryArt={
  glasses:'<g fill="#ffffff26" stroke="#34434a" stroke-width="3.2"><rect x="56" y="91" width="31" height="24" rx="9"/><rect x="93" y="91" width="31" height="24" rx="9"/><path d="M87 101 H93"/></g><path d="M61 97 Q64 94 69 94" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/><path d="M98 97 Q101 94 106 94" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>',
  round:'<g fill="#ffffff26" stroke="#34434a" stroke-width="3.2"><circle cx="72" cy="103" r="15"/><circle cx="108" cy="103" r="15"/><path d="M87 101 H93"/></g>',
  headphones:'<path d="M40 102 Q38 24 90 24 Q142 24 140 102" fill="none" stroke="#c77f2e" stroke-width="8"/><path d="M40 102 Q38 24 90 24 Q142 24 140 102" fill="none" stroke="#f4b860" stroke-width="3" opacity=".7"/><rect x="33" y="88" width="16" height="34" rx="8" fill="#e8a34d"/><rect x="131" y="88" width="16" height="34" rx="8" fill="#e8a34d"/>',
  flower:'<g transform="translate(127 43)" fill="#ef9cbd"><ellipse cy="-8" rx="5" ry="9"/><ellipse cy="8" rx="5" ry="9"/><ellipse cx="-8" rx="9" ry="5"/><ellipse cx="8" rx="9" ry="5"/><circle r="4.2" fill="#ffd45c"/></g>',
  cap:'<path d="M47 56 Q55 28 91 28 Q126 28 135 58 L132 68 Q91 59 46 74Z" fill="#4d9366"/><path d="M91 57 Q125 52 146 69 Q120 80 91 68Z" fill="#34764d"/><path d="M60 46 Q90 36 120 46" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="4" stroke-linecap="round"/>',
  bow:'<g fill="#e98eae"><path d="M91 49 Q62 24 65 52 Q69 67 91 55Z"/><path d="M91 49 Q120 24 117 52 Q113 67 91 55Z"/><circle cx="91" cy="52" r="5" fill="#f7cd65"/></g>',
  sunglasses:'<g fill="#22303a" stroke="#22303a" stroke-width="2"><rect x="54" y="91" width="34" height="24" rx="10"/><rect x="92" y="91" width="34" height="24" rx="10"/><path d="M88 100 H92" stroke-width="3"/></g><path d="M60 96 L70 96" stroke="#fff" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>',
  crown:'<path d="M56 38 L68 16 L80 31 L90 10 L100 31 L112 16 L124 38 Z" fill="#f7c948" stroke="#c99a1a" stroke-width="2" stroke-linejoin="round"/><circle cx="90" cy="28" r="3" fill="#e5484d"/>',
  beanie:'<path d="M44 58 Q48 22 90 20 Q132 22 136 58 Z" fill="#e5484d"/><rect x="42" y="50" width="96" height="12" rx="5" fill="#c13a3f"/><path d="M58 36 Q72 28 84 30" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>',
  star:'<path d="M128 36 L131 44 L140 44 L133 49 L136 58 L128 53 L120 58 L123 49 L116 44 L125 44Z" fill="#ffd45c" stroke="#c99a1a" stroke-width="1.2" stroke-linejoin="round"/>',
  earrings:'<circle cx="47" cy="124" r="3.4" fill="#ffd45c"/><circle cx="133" cy="124" r="3.4" fill="#ffd45c"/>',
  scarf:'<path d="M68 166 Q90 182 112 166 L116 180 Q90 196 64 180Z" fill="#f08a4b"/><path d="M104 176 L110 206 L100 207 L96 180Z" fill="#f08a4b"/>'
 }[accessory]||'';
 const shine='<path d="M58 44 Q90 20 122 44" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="5" stroke-linecap="round"/>';
 return '<div class="ml-avatar-stage '+(size||'large')+'" data-bg="'+background+'"><svg class="ml-avatar-person" viewBox="0 0 180 245" preserveAspectRatio="xMidYMid meet" role="img" aria-label="'+(girl?'Girl character':'Boy character')+'" focusable="false" style="--skin:'+skin+';--hair:'+hair+';--shirt:'+shirt+'">'
  +'<defs>'
  +'<radialGradient id="'+uid+'sg" cx=".42" cy=".34" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".24"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#4a2519" stop-opacity=".22"/></radialGradient>'
  +'<linearGradient id="'+uid+'sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>'
  +'<radialGradient id="'+uid+'ir" cx=".5" cy=".38" r=".62"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient>'
  +'</defs>'
  +'<ellipse cx="90" cy="240" rx="58" ry="5.5" fill="#1e3a2a" opacity=".14"/>'
  +'<path d="'+shoulderW+'" fill="#000" opacity=".2" transform="translate(0 6)"/>'+shirtFill+shirtShade+clothes
  +'<path d="M80 146 H100 L104 178 Q90 188 76 178 Z" fill="var(--skin)"/><path d="M80 146 H100 L101 158 Q90 166 79 158Z" fill="#000" opacity=".14"/>'
  +'<g transform="translate(90 150) scale(1.06) translate(-90 -150)">'+'<g fill="var(--hair)">'+hairBack+'</g>'
  +'<g fill="var(--skin)"><ellipse cx="49" cy="105" rx="8" ry="12"/><ellipse cx="131" cy="105" rx="8" ry="12"/></g>'
  +'<path d="M52 101 Q48 105 52 110" fill="none" stroke="'+ink+'" stroke-opacity=".2" stroke-width="1.4" stroke-linecap="round"/><path d="M128 101 Q132 105 128 110" fill="none" stroke="'+ink+'" stroke-opacity=".2" stroke-width="1.4" stroke-linecap="round"/>'
  +'<path d="'+facePath+'" fill="var(--skin)"/><path d="M52 124 Q90 166 128 124 Q124 156 90 160 Q56 156 52 124Z" fill="#000" opacity=".08"/>'
  +faceDetail
  +'<path d="M88 116 Q91 124 94 120" fill="none" stroke="'+ink+'" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/>'
  +'<path d="'+browPath+'" fill="none" stroke="var(--hair)" stroke-width="'+browWeight+'" stroke-linecap="round"/>'
  +eyesArt
  +mouth
  +'<g fill="var(--hair)">'+fringe+'</g>'+shine
  +accessoryArt+'</g>'
  +'</svg></div>';
}
function badgeArt(id) {
 const art = {
  'first-task':['#e8f7dc','#55a92a','<path d="M63 25 V79" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M66 29 L111 39 L66 51Z" fill="currentColor"/><path d="M76 63 L88 75 L111 52" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'],
  'task-master':['#e6f1ff','#4c83c5','<rect x="54" y="30" width="72" height="86" rx="12" fill="none" stroke="currentColor" stroke-width="7"/><path d="M73 55 L82 64 L101 44 M73 83 L82 92 L101 72" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'],
  'habit-starter':['#e8f7dc','#4b9d48','<path d="M90 112 Q48 85 69 39 Q116 39 111 80 Q108 98 90 112Z" fill="currentColor"/><path d="M90 112 Q89 77 109 56" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'],
  'habit-master':['#e4f4dc','#438e42','<path d="M90 112 V63 M90 83 Q52 84 52 52 Q82 44 90 72 Q98 44 128 52 Q128 84 90 83Z" fill="currentColor"/><path d="M75 112 H105" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>'],
  'water-lover':['#e3f5ff','#399ac7','<path d="M90 25 Q60 68 60 86 Q60 116 90 116 Q120 116 120 86 Q120 68 90 25Z" fill="currentColor"/><path d="M76 88 Q78 103 93 104" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'],
  'focus-master':['#fff0df','#d68a36','<circle cx="90" cy="78" r="43" fill="none" stroke="currentColor" stroke-width="8"/><path d="M90 48 V80 L111 91" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'],
  'xp-collector':['#fff4d7','#c58b22','<path d="M96 25 L54 82 H83 L76 119 L126 61 H96Z" fill="currentColor"/>'],
  'legend':['#fce8f0','#c77a9b','<path d="M50 55 L70 69 L90 37 L110 69 L130 55 L119 112 H61Z" fill="currentColor"/><circle cx="90" cy="82" r="8" fill="#fff"/>']
 };
 const [bg,ink,shape]=art[id]||art['first-task'];
 return '<svg viewBox="0 0 180 150" aria-hidden="true" style="--badge-ink:'+ink+'"><rect x="23" y="8" width="134" height="134" rx="38" fill="'+bg+'"/><g color="'+ink+'">'+shape+'</g></svg>';
}
let activeProfileTab = 'character';
let activeShopCat = 'all';
const avatarGroups = [
 {id:'look',label:'Look',icon:'🙂',cats:['gender','skin','faceShape','eyeStyle','eyeColor','browStyle','expression','mouthStyle','faceDetail']},
 {id:'hair',label:'Hair',icon:'💇',cats:['hairStyle','hairColor']},
 {id:'style',label:'Style',icon:'👕',cats:['outfitStyle','outfitColor','accessory','background']}
];
function catInfo(id){return avatarCategories.find(c=>c.id===id)||{label:id,icon:'✦'};}
function celebrate(){
 const layer=document.createElement('div');
 layer.className='confetti-layer';
 const colors=['#58cc02','#1cb0f6','#ffc800','#ff86d0','#ff9600','#ce82ff'];
 for(let i=0;i<46;i++){
  const c=document.createElement('span');
  c.className='confetti';
  c.style.left=(Math.random()*100)+'%';
  c.style.background=colors[i%colors.length];
  c.style.setProperty('--x',((Math.random()*120)-60)+'px');
  c.style.setProperty('--t',(1.1+Math.random()*0.9)+'s');
  c.style.animationDelay=(Math.random()*0.3)+'s';
  layer.appendChild(c);
 }
 document.body.appendChild(layer);
 setTimeout(()=>layer.remove(),2400);
}
function cheer(stage){
 stage.classList.remove('cheer');
 void stage.offsetWidth;
 stage.classList.add('cheer');
 ['💚','⭐','✨'].forEach((emoji,i)=>{
  const h=document.createElement('span');
  h.className='av-heart';
  h.textContent=emoji;
  h.style.left=(30+i*20)+'%';
  h.style.top='60%';
  h.style.setProperty('--dx',((i-1)*26)+'px');
  h.style.animationDelay=(i*0.08)+'s';
  stage.appendChild(h);
  setTimeout(()=>h.remove(),1200);
 });
 setTimeout(()=>stage.classList.remove('cheer'),650);
}
function rarityOf(cost){
 return cost>=55?{id:'epic',label:'Epic'}:cost>=40?{id:'rare',label:'Rare'}:{id:'common',label:'Common'};
}
function applyAvatarChoice(cat,val,main){
 const p=state.profile;
 const key=cat+':'+val;
 const item=(avatarChoices[cat]||[]).find(x=>x.value===val);
 if(!item)return;
 if(item.cost&&!p.unlocked.includes(key)){
  const cost=Number(item.cost);
  if(state.gems<cost){showToast('Not enough crystals. Complete tasks and habits to earn more.');return;}
  state.gems-=cost;
  p.unlocked.push(key);
  showToast('🎉 «'+item.label+'» added to your wardrobe!');
  celebrate();
 }
 p[cat]=val;
 plusSave();
 render();
}
function characterMarkup(p){
 const rail=avatarCategories.map(c=>'<button type="button" class="look-icon '+(c.id===activeAvatarCategory?'active':'')+'" data-avatar-tab="'+c.id+'" aria-label="'+c.label+'" title="'+c.label+'"><span aria-hidden="true">'+c.icon+'</span></button>').join('');
 const choices=(avatarChoices[activeAvatarCategory]||[]).map(item=>{
  const key=activeAvatarCategory+':'+item.value;
  const owned=!item.cost||p.unlocked.includes(key);
  const selected=p[activeAvatarCategory]===item.value;
  return '<button type="button" class="look-choice '+(selected?'selected':'')+(owned?'':' locked')+'" data-avatar-choice="'+activeAvatarCategory+'" data-avatar-value="'+item.value+'" aria-pressed="'+selected+'">'+
   '<span class="look-visual">'+avatarMarkup('mini',{[activeAvatarCategory]:item.value})+'</span>'+
   '<span class="look-name">'+item.label+'</span>'+
   (selected?'<span class="look-check" aria-hidden="true">✓</span>':'')+
   (owned?'':'<small class="price">💎 '+item.cost+'</small>')+
   '</button>';
 }).join('');
 return '<div class="look-layout">'+
  '<aside class="look-stage-card">'+avatarMarkup('large')+
      '<form id="simple-avatar-name" class="look-name-form"><input id="simple-avatar-name-input" name="displayName" maxlength="32" value="'+plusEscape(p.displayName||'')+'" placeholder="Character name" aria-label="Character name"><button type="submit">Save</button></form>'+
  '</aside>'+
  '<section class="look-editor">'+
   '<nav class="look-rail" aria-label="Character sections">'+rail+'</nav>'+
   '<div class="look-head"><h3>'+catInfo(activeAvatarCategory).label+'</h3></div>'+
   '<div class="look-options" style="--cols:'+Math.min(5,Math.max(2,Math.ceil(((avatarChoices[activeAvatarCategory]||[]).length)/2)))+'">'+(choices||'<p class="simple-avatar-empty">Nothing to show here.</p>')+'</div>'+
  '</section>'+
 '</div>';
}
function shopPool(){
 const pool=[];
 Object.keys(avatarChoices).forEach(cat=>avatarChoices[cat].forEach(item=>{if(item.cost)pool.push({cat,item});}));
 return pool;
}
function dayIndex(){
 const t=Date.parse(String(state.date||'')+'T00:00:00Z');
 return Number.isFinite(t)?Math.floor(t/864e5):0;
}
function dailyPicks(){
 const order=shopPool();
 let seed=7;
 const rand=()=>{seed=(seed*1664525+1013904223)>>>0; return seed/4294967296;};
 for(let i=order.length-1;i>0;i--){const j=Math.floor(rand()*(i+1)); [order[i],order[j]]=[order[j],order[i]];}
 const n=order.length, d=dayIndex();
 return [order[((2*d)%n+n)%n], order[((2*d+1)%n+n)%n]];
}
function shopCard({cat,item},p,featured){
 const key=cat+':'+item.value;
 const owned=p.unlocked.includes(key);
 const equipped=p[cat]===item.value;
 const r=rarityOf(item.cost);
 const action=equipped
  ? '<span class="shop-badge">✓ Equipped</span>'
  : owned
   ? '<button type="button" class="shop-action equip" data-shop-item="'+cat+'" data-shop-value="'+item.value+'">Wear</button>'
   : '<button type="button" class="shop-action buy '+(state.gems<item.cost?'short':'')+'" data-shop-item="'+cat+'" data-shop-value="'+item.value+'">💎 '+item.cost+' Buy</button>';
 return '<article class="shop-card '+(equipped?'equipped':'')+' '+(featured?'featured':'')+'">'+
  (item.isNew?'<span class="new-tag">New</span>':'')+
  '<span class="rarity r-'+r.id+'">'+r.label+'</span>'+
  '<div class="shop-visual">'+avatarMarkup('mini',{[cat]:item.value})+'</div>'+
  '<h4>'+item.label+'</h4><small>'+catInfo(cat).label+(owned&&!equipped?' · in wardrobe':'')+'</small>'+action+'</article>';
}
function shopMarkup(p){
 const premium=shopPool();
 const cats=[...new Set(premium.map(x=>x.cat))];
 const current=activeShopCat==='all'||cats.includes(activeShopCat)?activeShopCat:'all';
 const pills='<button type="button" class="look-cat '+(current==='all'?'active':'')+'" data-shop-cat="all">✨ All</button>'+cats.map(c=>{const info=catInfo(c);return '<button type="button" class="look-cat '+(c===current?'active':'')+'" data-shop-cat="'+c+'">'+info.icon+' '+info.label+'</button>';}).join('');
 const shown=premium.filter(x=>current==='all'||x.cat===current);
 const ownedCount=premium.filter(x=>p.unlocked.includes(x.cat+':'+x.item.value)).length;
 const picks=dailyPicks();
 return '<section class="shop-hero"><div><span class="eyebrow">SHOP</span><h3>Character shop</h3><p>Earn crystals from tasks, habits and focus sessions.</p></div><div class="shop-tally"><strong>'+ownedCount+'/'+premium.length+'</strong><small>in wardrobe</small></div></section>'+
  '<section class="daily-shop"><div class="look-head"><h3>🔥 Today’s picks</h3><span>Changes every day</span></div><div class="daily-grid">'+picks.map(x=>shopCard(x,p,true)).join('')+'</div></section>'+
  '<div class="shop-cats">'+pills+'</div>'+
  '<div class="look-head shop-head"><h3>All items</h3><span>'+shown.length+' items</span></div>'+
  '<div class="shop-grid">'+shown.map(x=>shopCard(x,p,false)).join('')+'</div>';
}
function mountProfile(main) {
 const root=main.querySelector('#profile-experience');
 if(!root)return;
 const p=state.profile;
 const gems='<div class="gem-balance"><span aria-hidden="true">💎</span><strong>'+state.gems.toLocaleString('en-US')+'</strong><small>crystals</small></div>';
 const tabs='<div class="profile-tabs" role="tablist">'+
  '<button type="button" role="tab" aria-selected="'+(activeProfileTab==='character')+'" class="profile-tab '+(activeProfileTab==='character'?'active':'')+'" data-profile-tab="character">🧑 My character</button>'+
  '<button type="button" role="tab" aria-selected="'+(activeProfileTab==='shop')+'" class="profile-tab '+(activeProfileTab==='shop'?'active':'')+'" data-profile-tab="shop">🛍 Shop</button>'+
  '</div>';
 root.innerHTML = '<div class="profile-bar">'+tabs+'</div>' + (activeProfileTab==='shop' ? shopMarkup(p) : characterMarkup(p));
  bindTabKeys(root.querySelector('.profile-tabs'));
 root.querySelectorAll('[data-profile-tab]').forEach(btn=>btn.addEventListener('click',()=>{
  activeProfileTab=btn.dataset.profileTab;
  mountProfile(main);
 }));
 root.querySelectorAll('[data-avatar-group]').forEach(btn=>btn.addEventListener('click',()=>{
  const g=avatarGroups.find(x=>x.id===btn.dataset.avatarGroup);
  if(g){activeAvatarCategory=g.cats[0];mountProfile(main);}
 }));
 root.querySelectorAll('[data-avatar-tab]').forEach(btn=>btn.addEventListener('click',()=>{
  activeAvatarCategory=btn.dataset.avatarTab;
  mountProfile(main);
 }));
 root.querySelectorAll('[data-avatar-choice]').forEach(btn=>btn.addEventListener('click',()=>{
  applyAvatarChoice(btn.dataset.avatarChoice,btn.dataset.avatarValue,main);
 }));
 root.querySelectorAll('[data-shop-cat]').forEach(btn=>btn.addEventListener('click',()=>{
  activeShopCat=btn.dataset.shopCat;
  mountProfile(main);
 }));
 root.querySelectorAll('[data-shop-item]').forEach(btn=>btn.addEventListener('click',()=>{
  applyAvatarChoice(btn.dataset.shopItem,btn.dataset.shopValue,main);
 }));
 root.querySelector('#simple-avatar-name')?.addEventListener('submit',e=>{
  e.preventDefault();
  const val=new FormData(e.currentTarget).get('displayName').trim();
  if(!val)return;
  p.displayName=val;
  plusSave();
  render();
  showToast('Character name saved.');
 });
 root.querySelector('.look-stage-card .ml-avatar-stage')?.addEventListener('click',e=>cheer(e.currentTarget));
}
function plusRender() {
  const draftTask = document.getElementById('task-input')?.value ?? '';
  const draftHabit = document.getElementById('habit-input')?.value ?? '';
  originalRender();
  if (draftTask) document.getElementById('task-input').value = draftTask;
  if (draftHabit) document.getElementById('habit-input').value = draftHabit;
  document.documentElement.dataset.theme = state.settings.theme;
  const main = document.querySelector('.main-content');
  if (!main) return;
  mountProfile(main);
  if (document.getElementById('plus-tools')) return;
  const section = document.createElement('section');
  section.id = 'plus-tools';
  section.className = 'plus-grid';
  section.innerHTML =
    '<div class="panel plus-panel" id="plus-goals">' +
      '<div class="plus-heading"><div><span class="eyebrow">YOUR BIG PICTURE</span><h2>My goals</h2><p>Write down what matters and move forward step by step.</p></div><span class="plus-chip">' + state.goals.filter(g => g.done).length + ' / ' + state.goals.length + ' done</span></div>' +
      '<form id="plus-goal-form" class="plus-form"><input name="title" maxlength="90" placeholder="e.g. learn a new skill..." required><button>Add goal +</button></form>' +
      '<div class="plus-goal-list">' + (state.goals.length ? state.goals.map(g => '<div class="plus-goal ' + (g.done ? 'done' : '') + '"><button data-plus="goal-toggle" data-id="' + g.id + '">' + (g.done ? '✓' : '○') + '</button><span>' + plusEscape(g.title) + '</span><button class="remove" data-plus="goal-delete" data-id="' + g.id + '">×</button></div>').join('') : '<div class="plus-empty">No goals yet. Add your first one.</div>') + '</div>' +
    '</div>' +
    '<div class="panel plus-panel" id="plus-journal">' +
      '<div class="plus-heading"><div><span class="eyebrow">DAILY REFLECTION</span><h2>Daily journal</h2><p>Events, ideas and what you learned.</p></div><span class="plus-chip">Auto-saved</span></div>' +
      '<textarea id="plus-journal-input" placeholder="What was valuable to you today?">' + plusEscape(state.journal[state.date] || '') + '</textarea>' +
      '<div class="plus-journal-foot"><span id="plus-journal-status">Saved only on this device.</span><span id="plus-journal-count">' + (state.journal[state.date] || '').length + ' characters</span></div>' +
    '</div>' +
    '<div class="panel plus-panel plus-backup">' +
      '<div class="plus-heading"><div><span class="eyebrow">YOUR DATA, YOUR CONTROL</span><h2>Data management</h2><p>Back up your data or restore it from a file.</p></div></div>' +
      '<div class="plus-actions"><button id="plus-export">↓ Download backup</button><label class="plus-import">↑ Restore backup<input id="plus-import-file" type="file" accept="application/json"></label></div>' +
      '<small class="plus-note">Tip: back up your data regularly. Clearing browser data can remove local information.</small>' +
    '</div>';
  const goalsPanel = section.querySelector('#plus-goals');
  const journalPanel = section.querySelector('#plus-journal');
  const backupPanel = section.querySelector('.plus-backup');
  const goalsWrap = document.createElement('div');
  const journalWrap = document.createElement('div');
  const backupWrap = document.createElement('div');
  goalsWrap.className = journalWrap.className = backupWrap.className = 'plus-grid';
  goalsWrap.appendChild(goalsPanel);
  journalWrap.appendChild(journalPanel);

  const pastEntries = Object.keys(state.journal)
    .filter(k => isDateKey(k) && k !== state.date && String(state.journal[k] || '').trim())
    .sort().reverse().slice(0, 30);
  const historyPanel = document.createElement('div');
  historyPanel.className = 'panel plus-panel';
  historyPanel.id = 'plus-journal-history';
  historyPanel.innerHTML =
    '<div class="plus-heading"><div><span class="eyebrow">PAST DAYS</span><h2>Past days</h2><p>Your earlier notes, newest first.</p></div></div>' +
    (pastEntries.length
      ? pastEntries.map(k => '<div class="plus-entry"><span><strong>' +
          plusEscape(new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(k + 'T00:00:00'))) +
          '</strong><br>' + plusEscape(state.journal[k]) + '</span></div>').join('')
      : '<div class="plus-empty">No notes for earlier days yet.</div>');
  journalWrap.appendChild(historyPanel);
  backupWrap.appendChild(backupPanel);
  main.querySelector('[data-page="growth"]').appendChild(goalsWrap);
  main.querySelector('[data-page="journal"]').appendChild(journalWrap);
  main.querySelector('[data-page="settings"]').appendChild(backupWrap);
  main.appendChild(section);
  const form = document.getElementById('plus-goal-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = new FormData(form).get('title').trim();
    if (!title) return;
    state.goals.push({ id: Date.now(), title, done: false });
    plusSave(); plusRender(); showToast('New goal added 🎯');
  });
  main.querySelectorAll('[data-plus]').forEach(button => button.addEventListener('click', () => {
    const id = Number(button.dataset.id);
    if (button.dataset.plus === 'goal-toggle') {
      const goal = state.goals.find(g => g.id === id);
      if (goal) goal.done = !goal.done;
    } else {
      state.goals = state.goals.filter(g => g.id !== id);
    }
    plusSave(); plusRender();
  }));
  const journal = document.getElementById('plus-journal-input');
  journal.addEventListener('input', () => {
    state.journal[state.date] = journal.value;
    state.notes = journal.value;
    plusSave();
    document.getElementById('plus-journal-status').textContent = 'Saved ✓';
    document.getElementById('plus-journal-count').textContent = journal.value.length + ' characters';
  });
  document.getElementById('plus-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'my-life-backup-' + state.date + '.json';
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Backup is ready');
  });
  document.getElementById('plus-import-file').addEventListener('change', event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!imported || !Array.isArray(imported.tasks) || !Array.isArray(imported.habits)) throw new Error('invalid');
        if (!confirm('Replace your current data with this backup?')) return;
        if (!isRecord(imported) || !Array.isArray(imported.tasks) || !Array.isArray(imported.habits)) throw new Error('invalid');
        state = normalizeState(imported);
        plusSave(); plusRender(); showToast('Data restored successfully');
      } catch { showToast('The selected file is not valid'); }
    };
    reader.readAsText(file);
  });
  const settingsWrap = document.createElement('div');
  settingsWrap.className = 'plus-grid';
  settingsWrap.innerHTML =
    '<div class="panel plus-panel" id="plus-settings">' +
      '<div class="plus-heading"><div><span class="eyebrow">PREFERENCES</span><h2>Appearance & goals</h2><p>Adjust the app’s look and your daily water goal.</p></div></div>' +
      '<div class="settings-row"><div><strong>Dark mode</strong><small>Light or dark look for the app</small></div>' +
        '<button id="plus-theme" class="secondary-button">' + (state.settings.theme === 'dark' ? '☀ Light mode' : '☾ Dark mode') + '</button></div>' +
      '<div class="settings-row"><div><strong>Daily water goal</strong><small>Between 1 and 24 glasses</small></div>' +
        '<form id="plus-water-form" class="settings-inline"><input id="plus-water-target" type="number" min="1" max="24" value="' + waterTarget() + '" aria-label="Daily water goal"><button class="primary-button">Save</button></form></div>' +
    '</div>' +
    accountMarkup();
  main.querySelector('[data-page="settings"]').prepend(settingsWrap);
  bindAccountPanel();

  document.getElementById('plus-theme').addEventListener('click', () => {
    state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
    plusSave(); plusRender();
  });
  document.getElementById('plus-water-form').addEventListener('submit', e => {
    e.preventDefault();
    const value = Math.round(Number(document.getElementById('plus-water-target').value));
    if (!Number.isFinite(value) || value < 1 || value > 24) {
      showToast('Water goal must be between 1 and 24 glasses');
      return;
    }
    state.settings.waterTarget = value;
    plusSave(); plusRender();
    showToast('Water goal saved 💧');
  });
}
function renderSafely() {
  try {
    plusRender();
  } catch (error) {
    console.error(error);
    const app = document.getElementById('app');
    if (app && !app.querySelector('.sidebar')) {
      app.innerHTML = '<div class="crash-card" role="alert"><h2>Something went wrong</h2>' +
        '<p>Your data is still saved on this device. Reloading usually fixes it.</p>' +
        '<button type="button" class="primary-button" onclick="location.reload()">Reload Mylo</button></div>';
    }
  }
}
render = renderSafely;
render();

// Keep signed-in devices in step: pull on load, when the tab returns, and when the connection comes back
if (sync.token) pullState();
window.addEventListener('online', () => { if (sync.token) (isDirty() ? pushState() : pullState()); });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && sync.token && !isDirty() && Date.now() - lastPull > 60000) pullState();
});
