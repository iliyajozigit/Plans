
import './style.css';
import './smart.js';

const $ = (selector) => document.querySelector(selector);
const dateKey = (date = new Date()) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
const today = () => dateKey();

const formatDate = () =>
  new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

const defaultState = {
  date: today(),
  tasks: [],
  habits: [
    { id: 1, title: 'مطالعه و یادگیری', icon: '📚', done: false },
    { id: 2, title: 'ورزش و تحرک', icon: '🏃', done: false },
    { id: 3, title: 'نوشیدن آب', icon: '💧', done: false },
    { id: 4, title: 'برنامه‌ریزی روزانه', icon: '📝', done: false }
  ],
  xp: 0,
  water: 0,
  notes: '',
  earned: [],
  focusSessions: 0,
  profile: { displayName: 'ماجراجوی My Life', gender: 'boy', bio: 'در مسیر نسخه بهتر خودم', skin: '#d99b72', hairColor: '#49312f', hairStyle: 'wave', eyeColor: '#4b8177', outfitStyle: 'hoodie', outfitColor: '#7666df', accessory: 'glasses', background: 'blossom', unlocked: [], questClaims: {}, genderInitialized: true },
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
  if (!['boy', 'girl', 'neutral'].includes(next.profile.gender)) next.profile.gender = 'boy';
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
  { id: 'first-task', title: 'شروع قدرتمند', description: 'اولین وظیفه خود را کامل کن', icon: '🚀', color: 'purple', target: 1, type: 'tasks' },
  { id: 'task-master', title: 'استاد وظایف', description: '۱۰ وظیفه را به پایان برسان', icon: '🎯', color: 'blue', target: 10, type: 'tasks' },
  { id: 'habit-starter', title: 'شروع عادت‌ها', description: 'اولین عادت را انجام بده', icon: '🌱', color: 'green', target: 1, type: 'habits' },
  { id: 'habit-master', title: 'معمار عادت‌ها', description: '۴ عادت را در یک روز کامل کن', icon: '🌳', color: 'emerald', target: 4, type: 'dailyHabits' },
  { id: 'water-lover', title: 'قطره‌های سلامتی', description: '۸ لیوان آب ثبت کن', icon: '💎', color: 'cyan', target: 8, type: 'water' },
  { id: 'focus-master', title: 'استاد تمرکز', description: '۵ جلسه تمرکز انجام بده', icon: '⏱️', color: 'orange', target: 5, type: 'focus' },
  { id: 'xp-collector', title: 'شکارچی تجربه', description: '۱۰۰ امتیاز تجربه کسب کن', icon: '⭐', color: 'gold', target: 100, type: 'xp' },
  { id: 'legend', title: 'افسانه My Life', description: 'به ۵۰۰ امتیاز تجربه برس', icon: '👑', color: 'pink', target: 500, type: 'xp' }
];

let storageWarningShown = false;

function save() {
  try {
    localStorage.setItem('myLifeState', JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn('My Life could not save local data:', error);
    if (!storageWarningShown && document.body) {
      storageWarningShown = true;
      showToast('ذخیره‌سازی مرورگر در دسترس نیست؛ اطلاعات پس از بستن صفحه باقی نمی‌ماند.');
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
      showToast(`🏆 نشان «${badge.title}» را دریافت کردی!`);
    }
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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
  if (getLevel() > levelBefore) showToast(`🎉 به سطح ${getLevel()} رسیدی!`);
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
          <div class="brand-icon" aria-label="My Life">M</div>
          <div>
            <h2>My Life</h2>
            <span>YOUR DAILY PROGRESS</span>
          </div>
        </div>

        <nav class="navigation">
          <p class="nav-label">فضای شخصی</p>
          <a class="nav-item ${activeView === 'dashboard' ? 'active' : ''}" href="#dashboard" data-view="dashboard"><span class="nav-symbol">⌂</span><span>نمای کلی</span></a>
          <a class="nav-item ${activeView === 'planner' ? 'active' : ''}" href="#planner" data-view="planner"><span class="nav-symbol">✓</span><span>برنامه‌ریزی</span></a>
          <a class="nav-item ${activeView === 'growth' ? 'active' : ''}" href="#growth" data-view="growth"><span class="nav-symbol">↗</span><span>رشد من</span></a>
          <a class="nav-item ${activeView === 'profile' ? 'active' : ''}" href="#profile" data-view="profile"><span class="nav-symbol">●</span><span>شخصیت من</span></a>
          <p class="nav-label">ابزارهای من</p>
          <a class="nav-item ${activeView === 'focus' ? 'active' : ''}" href="#focus" data-view="focus"><span class="nav-symbol">◷</span><span>تمرکز</span></a>
          <a class="nav-item ${activeView === 'journal' ? 'active' : ''}" href="#journal" data-view="journal"><span class="nav-symbol">▤</span><span>دفتر شخصی</span></a>
          <a class="nav-item ${activeView === 'settings' ? 'active' : ''}" href="#settings" data-view="settings"><span class="nav-symbol">⚙</span><span>تنظیمات</span></a>
        </nav>

        <div class="sidebar-bottom">
          <div class="mini-level">
            <span>سطح فعلی</span>
            <strong>LV. ${getLevel()}</strong>
            <div class="progress-track">
              <div style="width:${getLevelProgress()}%"></div>
            </div>
            <small>${getLevelProgress()} / 100 XP</small>
          </div>
          <div class="sidebar-footer">Made for a better you ✨</div>
        </div>
      </aside>

      <main class="main-content" id="dashboard">

        <header class="topbar">
          <div>
            <span class="eyebrow">YOUR DAILY PROGRESS</span>
            <h1>${({dashboard:'روزت رو بساز',planner:'برنامه‌ریزی روزانه',growth:'مسیر رشد تو',profile:'شخصیت و افتخارات من',focus:'فضای تمرکز',journal:'دفتر شخصی',settings:'تنظیمات'})[activeView]}</h1>
            <p class="date-text" id="live-date">${formatDate()}</p>
          </div>

          <div class="topbar-right">
            <div class="level-pill">⭐ سطح ${getLevel()}</div><div class="level-pill gem-wallet">💎 ${state.gems.toLocaleString('fa-IR')}</div>
            <button class="avatar profile-shortcut" data-view="profile" aria-label="رفتن به پروفایل"><span class="profile-shortcut-mark" aria-hidden="true"><i></i><b></b><em></em></span></button>
          </div>
        </header>

        <section class="page-view ${activeView === 'dashboard' ? 'active' : ''}" data-page="dashboard">
        <section class="hero-card">
          <div class="hero-content">
            <span class="hero-label">A NEW DAY, A NEW CHANCE</span>
            <h2>هر روز، یک قدم<br>بهتر از دیروز باش.</h2>
            <p>پیشرفت‌های کوچک، در طول زمان نتایج بزرگی می‌سازند.</p>
            <a href="#planner" data-view="planner" class="hero-button">
              شروع برنامه امروز <span>←</span>
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
                    <small>پیشرفت</small>
                  </div>
                </div>

                <div class="growth-details">
                  <div class="growth-detail">
                    <span class="growth-dot purple-dot"></span>
                    <span>وظایف</span>
                    <strong>${completedTasks}/${state.tasks.length}</strong>
                  </div>
                  <div class="growth-detail">
                    <span class="growth-dot green-dot"></span>
                    <span>عادت‌ها</span>
                    <strong>${completedHabits}/${state.habits.length}</strong>
                  </div>
                  <div class="growth-detail">
                    <span class="growth-dot orange-dot"></span>
                    <span>اهداف</span>
                    <strong>${getLevel()} LV</strong>
                  </div>
                </div>
              </div>

              <div class="growth-footer">
                <span>🌱</span>
                <span>هر قدم، یک پیشرفت تازه</span>
              </div>
            </div>

          </div>
        </section>

        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon purple">☑</div>
            <span>وظایف تکمیل‌شده</span>
            <strong>${completedTasks}<small> / ${state.tasks.length}</small></strong>
            <div class="stat-progress">
              <div style="width:${taskPercent}%"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon green">◈</div>
            <span>عادت‌های امروز</span>
            <strong>${completedHabits}<small> / ${state.habits.length}</small></strong>
            <div class="stat-progress">
              <div style="width:${habitPercent}%"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon orange">⭐</div>
            <span>امتیاز تجربه</span>
            <strong>${state.xp}<small> XP</small></strong>
            <div class="stat-progress">
              <div style="width:${getLevelProgress()}%"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon cyan">💧</div>
            <span>آب نوشیده‌شده</span>
            <strong>${state.water}<small> / ${waterTarget()} لیوان</small></strong>
            <div class="stat-progress">
              <div style="width:${Math.min(state.water / waterTarget() * 100, 100)}%"></div>
            </div>
          </div>
        </section>


        <section class="daily-path-panel">
          <div class="daily-path-heading">
            <div><span class="eyebrow">YOUR DAILY JOURNEY</span><h2>مسیر امروزت</h2><p>هر قدم کوچیک، تو رو جلوتر می‌بره.</p></div>
            <span class="daily-path-progress">${getOverallPercent()}٪</span>
          </div>
          <div class="daily-path-steps">
            <a href="#planner" data-view="planner" class="daily-path-step ${completedTasks > 0 ? 'step-started' : ''}">
              <span class="daily-step-node">✓</span><span><strong>برنامه‌ریزی</strong><small>${completedTasks} از ${state.tasks.length} وظیفه</small></span><b>←</b>
            </a>
            <a href="#planner" data-view="planner" class="daily-path-step ${completedHabits > 0 ? 'step-started' : ''}">
              <span class="daily-step-node">🌱</span><span><strong>ساخت عادت</strong><small>${completedHabits} از ${state.habits.length} عادت</small></span><b>←</b>
            </a>
            <a href="#focus" data-view="focus" class="daily-path-step ${state.focusSessions > 0 ? 'step-started' : ''}">
              <span class="daily-step-node">◷</span><span><strong>تمرکز عمیق</strong><small>${state.focusSessions} جلسه کامل‌شده</small></span><b>←</b>
            </a>
            <a href="#journal" data-view="journal" class="daily-path-step">
              <span class="daily-step-node">✎</span><span><strong>مرور روز</strong><small>ثبت یک یادداشت کوتاه</small></span><b>←</b>
            </a>
          </div>
        </section>
        </section>

        <section class="page-view ${activeView === 'planner' ? 'active' : ''}" data-page="planner">
          <div class="page-intro"><span class="eyebrow">PLAN YOUR DAY</span><h2>برنامه‌ریزی هوشمند</h2><p>کارها و عادت‌هایت را با آرامش مدیریت کن.</p></div>
        <section class="content-grid">

          <div class="panel tasks-panel" id="tasks">
            <div class="section-heading">
              <div>
                <span class="eyebrow">DAILY PLANNER</span>
                <h2>وظایف امروز</h2>
              </div>
              <span class="counter">${completedTasks}/${state.tasks.length}</span>
            </div>

            <form id="task-form" class="add-form">
              <input
                id="task-input"
                placeholder="چه کاری باید انجام بدی؟"
                maxlength="100"
                required
              >
              <button type="submit">+</button>
            </form>

            <div class="task-list">
              ${state.tasks.length ? state.tasks.map(task => `
                <div class="task-item ${task.done ? 'completed' : ''}">
                  <button
                    class="task-check"
                    data-action="task-toggle"
                    data-id="${task.id}"
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
                  هنوز کاری ثبت نکردی. اولین وظیفه‌ات رو اضافه کن ✨
                </div>
              `}
            </div>
          </div>

          <div class="panel habits-panel" id="habits">
            <div class="section-heading">
              <div>
                <span class="eyebrow">BUILD YOURSELF</span>
                <h2>عادت‌های روزانه</h2>
              </div>
              <span class="counter">${habitPercent}%</span>
            </div>

            <div class="habit-list">
              ${state.habits.map(habit => `
                <div class="habit-row" style="display:flex;gap:8px;align-items:center">
                  <button
                    class="habit-item ${habit.done ? 'habit-done' : ''}"
                    style="flex:1"
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
                    aria-label="حذف عادت"
                  >×</button>
                </div>
              `).join('')}
            </div>
            <form id="habit-form" class="add-form">
              <input id="habit-input" placeholder="عادت جدید..." maxlength="80" required>
              <button type="submit">+</button>
            </form>

            <div class="habit-summary">
              <div class="progress-track">
                <div style="width:${habitPercent}%"></div>
              </div>
              <small>
                ${completedHabits} عادت از ${state.habits.length} عادت انجام شده
              </small>
            </div>
          </div>
        </section>

        </section>

        <section class="page-view ${activeView === 'growth' ? 'active' : ''}" data-page="growth">
          <div class="page-intro"><span class="eyebrow">PERSONAL GROWTH</span><h2>مسیر رشد تو</h2><p>دستاوردهایت را ببین و قدم‌های بعدی را بردار.</p></div>
        <section class="panel achievements-panel" id="achievements">
          <div class="badge-hero">
            <div class="badge-hero-copy">
              <span class="eyebrow">YOUR JOURNEY · ACHIEVEMENT GALLERY</span>
              <h2>تالار افتخارات</h2>
              <p>هر نشان، یادگاری از قدم‌هایی است که برای رشدت برداشته‌ای.</p>
              <div class="badge-hero-progress">
                <div class="badge-hero-track"><span style="width:${Math.round(state.earned.length / badges.length * 100)}%"></span></div>
                <strong>${Math.round(state.earned.length / badges.length * 100)}٪ تکمیل‌شده</strong>
              </div>
            </div>
            <div class="badge-trophy" aria-hidden="true"><span>🏆</span></div>
          </div>
          <div class="badge-overview">
            <div class="badge-overview-item"><span class="badge-overview-icon">🏅</span><div><strong>${state.earned.length}</strong><small>نشان دریافت‌شده</small></div></div>
            <div class="badge-overview-item"><span class="badge-overview-icon">🔒</span><div><strong>${badges.length - state.earned.length}</strong><small>نشان باقی‌مانده</small></div></div>
            <div class="badge-overview-item"><span class="badge-overview-icon">⭐</span><div><strong>${state.xp}</strong><small>امتیاز تجربه</small></div></div>
          </div>

          <div class="badge-filter-heading"><div><strong>مجموعه نشان‌ها</strong><small>مسیر پیشرفتت را دنبال کن</small></div><span>${state.earned.length} از ${badges.length}</span></div>
          <div class="badge-filters">
            <button class="filter-btn active" data-filter="all">همه</button>
            <button class="filter-btn" data-filter="earned">دریافت‌شده</button>
            <button class="filter-btn" data-filter="locked">قفل‌شده</button>
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
                    <span class="badge-rarity-chip ${badge.target >= 500 ? 'rarity-legendary' : badge.target >= 100 || badge.target >= 10 ? 'rarity-epic' : 'rarity-rare'}">${badge.target >= 500 ? 'افسانه‌ای' : badge.target >= 100 || badge.target >= 10 ? 'حماسی' : 'ویژه'}</span>
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
                    <div class="badge-progress-label"><small>${earned ? 'نشان دریافت شد' : 'میزان پیشرفت'}</small><strong>${earned ? '100' : percent}٪</strong></div>
                    <div class="badge-progress-track"><div style="width:${earned ? 100 : percent}%"></div></div>
                    <small class="badge-progress-count">${earned ? '✓ تکمیل‌شده' : `${progress} از ${badge.target}`}</small>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </section>

        </section>

        <section class="page-view ${activeView === 'focus' ? 'active' : ''}" data-page="focus">
          <div class="page-intro"><span class="eyebrow">FOCUS & WELLBEING</span><h2>فضای تمرکز</h2><p>برای کار عمیق و مراقبت از خودت زمان بساز.</p></div>
        <section class="content-grid lower-grid">

          <div class="panel focus-panel" id="focus">
            <div class="section-heading">
              <div>
                <span class="eyebrow">DEEP WORK</span>
                <h2>زمان تمرکز</h2>
              </div>
              <span class="focus-icon">◷</span>
            </div>

            <div class="timer" id="timer">25:00</div>
            <p class="timer-description">
              ۲۵ دقیقه تمرکز برای کارهای مهم
            </p>

            <div class="timer-controls">
              <button id="timer-start" class="primary-button">${timerRunning ? "توقف" : timerSeconds < 25 * 60 ? "ادامه" : "شروع"}</button>
              <button id="timer-reset" class="secondary-button">بازنشانی</button>
            </div>

            <small class="focus-count">
              جلسات کامل‌شده: ${state.focusSessions}
            </small>
          </div>

          <div class="panel water-panel">
            <div class="section-heading">
              <div>
                <span class="eyebrow">STAY HYDRATED</span>
                <h2>ردیاب آب</h2>
              </div>
              <span class="water-icon">💧</span>
            </div>

            <div class="water-number">
              ${state.water}<small> / ${waterTarget()}</small>
            </div>

            <p>لیوان آب امروز</p>

            <div class="water-glasses">
              ${Array.from({ length: waterTarget() }, (_, i) => `
                <span class="${i < state.water ? 'filled' : ''}">♧</span>
              `).join('')}
            </div>

            <button class="primary-button water-add" id="water-add">
              + ثبت یک لیوان
            </button>
          </div>
        </section>

        </section>

        <section class="page-view ${activeView === 'journal' ? 'active' : ''}" data-page="journal">
          <div class="page-intro"><h2>دفتر شخصی</h2></div>
        </section>

        <section class="page-view ${activeView === 'profile' ? 'active' : ''} profile-page" data-page="profile"><div class="page-intro"><span class="eyebrow">YOUR CHARACTER · YOUR JOURNEY</span><h2>شخصیت و افتخارات من</h2><p>ظاهر خودت را بساز، تجربه‌هایت را جمع کن و مسیر پیشرفتت را ببین.</p></div><div id="profile-experience"></div></section>
        <section class="page-view ${activeView === 'settings' ? 'active' : ''}" data-page="settings">
          <div class="page-intro"><span class="eyebrow">PREFERENCES</span><h2>تنظیمات فضای تو</h2><p>ظاهر برنامه، هدف‌ها و نسخه پشتیبان اطلاعاتت را مدیریت کن.</p></div>
        </section>

        <footer class="footer">
          <span>MY LIFE ✦</span>
          <p>Small steps. Big changes.</p>
          <span>ساخته‌شده برای نسخه بهتر تو</span>
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
      const titles = { dashboard: 'روزت رو بساز', planner: 'برنامه‌ریزی هوشمند', growth: 'مسیر رشد تو', profile: 'شخصیت و افتخارات من', focus: 'فضای تمرکز', journal: 'دفتر شخصی', settings: 'تنظیمات' };
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
    showToast('وظیفه جدید اضافه شد ✨');
  });

  $('#habit-form').addEventListener('submit', e => {
    e.preventDefault();
    const title = $('#habit-input').value.trim();
    if (!title) return;
    state.habits.push({ id: Date.now(), title: title.slice(0, 80), icon: '✦', done: false, lastRewardDate: null });
    save();
    render();
    showToast('عادت جدید اضافه شد ✨');
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
          if (!task.rewardClaimed) { addXP(10); state.gems += 2; task.rewardClaimed = true; showToast('۱۰ XP و ۲ کریستال گرفتی!'); }
        }
      }

      if (button.dataset.action === 'habit-delete') {
        state.habits = state.habits.filter(h => h.id !== id);
      }

      if (button.dataset.action === 'task-delete') {
        state.tasks = state.tasks.filter(t => t.id !== id);
      }

      if (button.dataset.action === 'habit-toggle') {
        const habit = state.habits.find(h => h.id === id);
        if (!habit) return;

        habit.done = !habit.done;

        if (habit.done && habit.lastRewardDate !== today()) {
          addXP(10); state.gems += 2; state.totalHabitsCompleted++;
          habit.lastRewardDate = today();
          showToast('۱۰ XP و ۲ کریستال برای این عادت گرفتی!');
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
      showToast('هدف روزانه آب تکمیل شده است 💧');
      return;
    }

    state.water++;
    addXP(2);
    if (state.water >= waterTarget() && state.waterRewardDate !== today()) {
      state.gems += 3;
      state.waterRewardDate = today();
      showToast('هدف آب امروز کامل شد؛ ۳ کریستال گرفتی! 💎');
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
  showToast('جلسه تمرکزت با موفقیت تمام شد!');
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
    $('#timer-start').textContent = 'ادامه';
    return;
  }

  if (timerSeconds <= 0) timerSeconds = 25 * 60;
  timerRunning = true;
  timerEndAt = Date.now() + timerSeconds * 1000;
  $('#timer-start').textContent = 'توقف';

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
  $('#timer-start').textContent = 'شروع';
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
    showToast('روز جدیدی آغاز شد! ✨');
  } else {
    refreshStreak();
    updateClock();
  }
}, 30000);

checkBadges();
refreshStreak();
save();
render();


// My Life Plus — incremental feature layer (keeps existing data and workflows).
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
 {id:'gender',label:'جنسیت',icon:'👤'},
 {id:'skin',label:'رنگ پوست',icon:'🎨'},
 {id:'faceShape',label:'فرم صورت',icon:'🙂'},
 {id:'hairStyle',label:'مدل مو',icon:'💇'},
 {id:'hairColor',label:'رنگ مو',icon:'🖌️'},
 {id:'eyeStyle',label:'فرم چشم',icon:'👁️'},
 {id:'eyeColor',label:'رنگ چشم',icon:'🔵'},
 {id:'browStyle',label:'ابرو',icon:'〰️'},
 {id:'expression',label:'حالت چهره',icon:'😊'},
 {id:'mouthStyle',label:'دهان',icon:'👄'},
 {id:'faceDetail',label:'جزئیات صورت',icon:'✨'},
 {id:'outfitStyle',label:'لباس',icon:'👕'},
 {id:'outfitColor',label:'رنگ لباس',icon:'🎽'},
 {id:'accessory',label:'اکسسوری',icon:'🕶️'},
 {id:'background',label:'پس‌زمینه',icon:'🖼️'}
];
let activeAvatarCategory = 'skin';
const avatarChoices = {
 gender:[{value:'boy',label:'پسر',icon:'♂'},{value:'girl',label:'دختر',icon:'♀'},{value:'neutral',label:'خنثی',icon:'◌'}],
 skin:[['#f8d9c2','خیلی روشن'],['#efc49f','روشن'],['#d99b72','گندمی'],['#bd805d','کاراملی'],['#925c43','قهوه‌ای'],['#684638','تیره']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 faceShape:[{value:'soft',label:'بیضی',icon:'◯'},{value:'round',label:'گرد',icon:'●'},{value:'square',label:'چهارگوش',icon:'▢'},{value:'heart',label:'قلبی',icon:'♡'}],
 hairStyle:[{value:'short',label:'کوتاه',icon:'⌁'},{value:'wave',label:'موج‌دار',icon:'〰'},{value:'curly',label:'فر',icon:'❋'},{value:'long',label:'بلند',icon:'〰'},{value:'bob',label:'مصری',icon:'⌒'},{value:'ponytail',label:'دم‌اسبی',icon:'↗'},{value:'bun',label:'جمع‌شده',icon:'◉',cost:45},{value:'afro',label:'فر حجیم',icon:'✿',cost:55}],
 hairColor:[['#292321','مشکی'],['#49312f','قهوه‌ای'],['#87513a','فندقی'],['#d6a04d','بلوند'],['#a65e91','یاسی'],['#6376c9','آبی']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 eyeStyle:[{value:'soft',label:'طبیعی',icon:'◉'},{value:'round',label:'گرد',icon:'●'},{value:'almond',label:'بادامی',icon:'◖'},{value:'wide',label:'درشت',icon:'◎'}],
 eyeColor:[['#49362d','قهوه‌ای'],['#4b8177','سبزآبی'],['#5574aa','آبی'],['#747b8d','خاکستری'],['#67915a','سبز']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 browStyle:[{value:'natural',label:'طبیعی',icon:'⌒'},{value:'soft',label:'ظریف',icon:'﹏'},{value:'bold',label:'پُر',icon:'━'},{value:'arched',label:'کمانی',icon:'⌃'}],
 expression:[{value:'happy',label:'شاد',icon:'☺'},{value:'excited',label:'هیجان‌زده',icon:'✧'},{value:'confident',label:'بااعتمادبه‌نفس',icon:'⌣'},{value:'surprised',label:'متعجب',icon:'◉'},{value:'sleepy',label:'آرام',icon:'ᴗ'},{value:'wink',label:'چشمک',icon:'😉'}],
 mouthStyle:[{value:'smile',label:'لبخند',icon:'⌣'},{value:'grin',label:'خنده',icon:'◡'},{value:'neutral',label:'معمولی',icon:'—'},{value:'small',label:'ظریف',icon:'ᴗ'},{value:'open',label:'باز',icon:'◯'}],
 faceDetail:[{value:'none',label:'ساده',icon:'○'},{value:'freckles',label:'کک‌ومک',icon:'⁙'},{value:'beauty',label:'خال کوچک',icon:'•'},{value:'blush',label:'گونه گلگون',icon:'♡'}],
 outfitStyle:[{value:'tee',label:'تی‌شرت',icon:'▱'},{value:'hoodie',label:'هودی',icon:'▰'},{value:'jacket',label:'کت',icon:'▥',cost:45},{value:'varsity',label:'دانشگاهی',icon:'▤',cost:65},{value:'artist',label:'هنری',icon:'◈',cost:55}],
 outfitColor:[['#7666df','بنفش'],['#4caa83','سبز'],['#e77d9f','صورتی'],['#4f83bd','آبی'],['#e59b4e','نارنجی'],['#38465d','سرمه‌ای'],['#e8e5d8','کرم']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 accessory:[{value:'none',label:'بدون اکسسوری',icon:'—'},{value:'glasses',label:'عینک',icon:'▱'},{value:'round',label:'عینک گرد',icon:'◎'},{value:'headphones',label:'هدفون',icon:'◖',cost:35},{value:'flower',label:'گل',icon:'✿',cost:35},{value:'cap',label:'کلاه',icon:'⌂',cost:45},{value:'bow',label:'پاپیون',icon:'⋈',cost:35}],
 background:[{value:'blossom',label:'سبز روشن',icon:'◉'},{value:'meadow',label:'نعنایی',icon:'◉'},{value:'ocean',label:'آبی',icon:'◉'},{value:'sunset',label:'هلویی',icon:'◉'},{value:'lavender',label:'یاسی',icon:'◉'}]
};
function avatarMarkup(size, override) {
 const p={...(state.profile||{}),...(override||{})};
 const safe=(key,fallback)=>((avatarChoices[key]||[]).some(x=>x.value===p[key])?p[key]:fallback);
 const skin=safe('skin','#d99b72'), hair=safe('hairColor','#49312f');
 const eyes=safe('eyeColor','#49362d'), shirt=safe('outfitColor','#4caa83');
 const hairStyle=safe('hairStyle','wave'), faceShape=safe('faceShape','soft');
 const eyeStyle=safe('eyeStyle','soft'), browStyle=safe('browStyle','natural');
 const expression=safe('expression','happy'), mouthStyle=safe('mouthStyle','smile');
 const detail=safe('faceDetail','none'), outfitStyle=safe('outfitStyle','tee');
 const accessory=safe('accessory','none'), background=safe('background','blossom');
 const facePath={
  soft:'M90 39 C65 39 48 58 49 88 L50 112 C51 139 68 157 90 158 C112 157 129 139 130 112 L131 88 C132 58 115 39 90 39Z',
  round:'M90 40 C61 40 46 62 48 94 L51 119 C55 145 71 158 90 158 C109 158 125 145 129 119 L132 94 C134 62 119 40 90 40Z',
  square:'M90 39 C64 39 49 56 49 84 L49 116 Q50 151 72 157 L108 157 Q130 151 131 116 L131 84 C131 56 116 39 90 39Z',
  heart:'M90 42 C68 28 48 51 49 82 L53 116 Q61 147 90 158 Q119 147 127 116 L131 82 C132 51 112 28 90 42Z'
 }[faceShape];
 const hairBack={
  short:'<path d="M45 91 Q38 38 70 22 Q101 7 125 29 Q145 49 135 103 L126 125 L116 81 L64 81 L55 124Z" fill="var(--hair)"/>',
  wave:'<path d="M43 92 Q34 42 66 22 Q98 4 126 28 Q149 49 137 105 L141 160 Q127 174 114 157 L111 91 L67 91 L64 157 Q48 173 38 158 L44 105Z" fill="var(--hair)"/>',
  long:'<path d="M42 91 Q35 38 67 21 Q99 4 127 28 Q149 49 137 103 L145 192 Q130 202 116 187 L110 94 L67 94 L63 187 Q47 202 35 190 L43 104Z" fill="var(--hair)"/>',
  bob:'<path d="M43 91 Q35 38 67 21 Q99 4 127 28 Q149 49 137 103 L137 151 Q125 165 111 150 L110 92 L67 92 L65 150 Q50 165 39 151Z" fill="var(--hair)"/>',
  ponytail:'<path d="M126 44 Q160 48 157 91 Q154 119 132 126 L119 105Z" fill="var(--hair)"/><path d="M43 91 Q35 39 67 22 Q99 5 127 29 Q149 50 137 103 L133 128 L47 128Z" fill="var(--hair)"/>',
  curly:'<g fill="var(--hair)"><circle cx="48" cy="63" r="17"/><circle cx="61" cy="39" r="20"/><circle cx="84" cy="25" r="21"/><circle cx="108" cy="27" r="21"/><circle cx="129" cy="43" r="20"/><circle cx="139" cy="67" r="17"/><path d="M42 70 Q35 119 48 157 L65 160 L68 83Z M138 70 Q146 119 132 157 L115 160 L112 83Z"/></g>',
  bun:'<circle cx="122" cy="30" r="18" fill="var(--hair)"/><path d="M43 91 Q35 39 67 22 Q99 5 127 29 Q149 50 137 103 L133 128 L47 128Z" fill="var(--hair)"/>',
  afro:'<g fill="var(--hair)"><circle cx="49" cy="66" r="21"/><circle cx="60" cy="43" r="23"/><circle cx="82" cy="28" r="24"/><circle cx="108" cy="29" r="24"/><circle cx="129" cy="45" r="23"/><circle cx="139" cy="69" r="21"/><circle cx="90" cy="17" r="19"/></g>'
 }[hairStyle]||'';
 const fringe={
  short:'<path d="M48 83 Q46 31 89 25 Q130 25 132 83 Q116 67 104 82 Q91 66 78 82 Q63 68 48 83Z" fill="var(--hair)"/>',
  wave:'<path d="M47 83 Q44 34 75 27 Q103 17 124 40 Q135 55 132 84 Q117 69 104 83 Q90 67 78 83 Q62 69 47 83Z" fill="var(--hair)"/>',
  long:'<path d="M47 83 Q44 31 89 24 Q130 25 133 83 Q117 67 104 82 Q90 66 78 83 Q62 67 47 83Z" fill="var(--hair)"/>',
  bob:'<path d="M47 83 Q44 31 89 24 Q130 25 133 83 Q117 67 104 82 Q90 66 78 83 Q62 67 47 83Z" fill="var(--hair)"/>',
  ponytail:'<path d="M47 83 Q44 31 89 24 Q130 25 133 83 Q117 67 104 82 Q90 66 78 83 Q62 67 47 83Z" fill="var(--hair)"/>',
  curly:'<g fill="var(--hair)"><circle cx="55" cy="65" r="15"/><circle cx="74" cy="45" r="17"/><circle cx="92" cy="39" r="18"/><circle cx="111" cy="45" r="17"/><circle cx="126" cy="65" r="15"/></g>',
  bun:'<path d="M47 83 Q44 31 89 24 Q130 25 133 83 Q117 67 104 82 Q90 66 78 83 Q62 67 47 83Z" fill="var(--hair)"/>',
  afro:'<path d="M48 84 Q44 44 68 32 Q90 16 115 31 Q137 43 132 84Z" fill="var(--hair)"/>'
 }[hairStyle]||'';
 const body='<path d="M55 160 Q68 145 80 148 L90 158 L100 148 Q114 145 125 160 Q145 177 151 238 H29 Q35 177 55 160Z" fill="var(--shirt)"/>';
 const clothes={
  tee:'<path d="M77 155 L90 169 L103 155" fill="none" stroke="#ffffffb8" stroke-width="4" stroke-linecap="round"/>',
  hoodie:'<path d="M70 159 Q90 136 110 159 L105 179 Q90 190 75 179Z" fill="#00000016"/><path d="M90 177 V237" stroke="#ffffff75" stroke-width="2.5"/>',
  jacket:'<path d="M76 155 L90 169 L104 155 L100 238 H80Z" fill="#ffffff2a"/><path d="M90 169 V237" stroke="#ffffffb8" stroke-width="3"/>',
  varsity:'<path d="M76 155 L90 169 L104 155 L100 238 H80Z" fill="#ffffff24"/><path d="M43 177 L57 162 L70 238 H49Z M137 177 L123 162 L110 238 H131Z" fill="#f4d16b"/>',
  artist:'<path d="M72 180 L108 180 L112 220 L68 220Z" fill="#f7dfb7"/><path d="M81 191 H99 M81 202 H99" stroke="#c88f57" stroke-width="4" stroke-linecap="round"/>'
 }[outfitStyle]||'';
 const eyeShape=eyeStyle==='round'?'rx="7" ry="8"':eyeStyle==='wide'?'rx="7.5" ry="9"':eyeStyle==='almond'?'rx="6.5" ry="4.5"':'rx="6" ry="6.5"';
 const eyeY=expression==='sleepy'?105:101;
 const eyesArt=expression==='wink'
  ? '<path d="M64 104 Q74 96 84 104" fill="none" stroke="var(--hair)" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="105" cy="101" '+eyeShape+' fill="#fff"/><ellipse cx="105" cy="102" rx="3.4" ry="4.2" fill="var(--eyes)"/><circle cx="106" cy="100" r="1.5" fill="#fff"/>'
  : expression==='sleepy'
   ? '<path d="M64 106 Q74 99 84 106 M96 106 Q106 99 116 106" fill="none" stroke="var(--hair)" stroke-width="3.5" stroke-linecap="round"/>'
   : '<ellipse cx="74" cy="'+eyeY+'" '+eyeShape+' fill="#fff"/><ellipse cx="106" cy="'+eyeY+'" '+eyeShape+' fill="#fff"/><ellipse cx="75" cy="'+(eyeY+1)+'" rx="3.8" ry="4.7" fill="var(--eyes)"/><ellipse cx="107" cy="'+(eyeY+1)+'" rx="3.8" ry="4.7" fill="var(--eyes)"/><circle cx="76.5" cy="'+(eyeY-1)+'" r="1.6" fill="#fff"/><circle cx="108.5" cy="'+(eyeY-1)+'" r="1.6" fill="#fff"/>';
 const browWeight=browStyle==='bold'?4.5:browStyle==='soft'?2.1:3.1;
 const browPath=browStyle==='arched'?'M63 88 Q74 77 85 89 M95 89 Q106 77 117 88':expression==='surprised'?'M64 84 Q74 77 84 84 M96 84 Q106 77 116 84':'M64 89 Q74 83 84 89 M96 89 Q106 83 116 89';
 const mouth=expression==='surprised'||mouthStyle==='open'
  ? '<ellipse cx="90" cy="135" rx="6" ry="8" fill="#9e5553"/>'
  : expression==='confident'
   ? '<path d="M81 134 Q92 139 101 131" fill="none" stroke="#9e5553" stroke-width="3" stroke-linecap="round"/>'
   : mouthStyle==='neutral'
    ? '<path d="M82 135 H98" fill="none" stroke="#9e5553" stroke-width="2.8" stroke-linecap="round"/>'
    : mouthStyle==='grin'||expression==='excited'
     ? '<path d="M78 130 Q90 148 103 130 Q91 135 78 130Z" fill="#fff" stroke="#9e5553" stroke-width="2.2" stroke-linejoin="round"/>'
     : mouthStyle==='small'
      ? '<path d="M84 134 Q90 138 96 134" fill="none" stroke="#9e5553" stroke-width="2.4" stroke-linecap="round"/>'
      : '<path d="M79 131 Q90 145 102 131" fill="none" stroke="#9e5553" stroke-width="3" stroke-linecap="round"/>';
 const faceDetail=detail==='freckles'
  ? '<g fill="#9c654b" opacity=".75"><circle cx="63" cy="119" r="1.5"/><circle cx="69" cy="122" r="1.4"/><circle cx="76" cy="120" r="1.3"/><circle cx="104" cy="120" r="1.3"/><circle cx="111" cy="122" r="1.4"/><circle cx="117" cy="119" r="1.5"/></g>'
  : detail==='beauty'?'<circle cx="115" cy="119" r="2" fill="#80513e"/>'
  : detail==='blush'?'<ellipse cx="68" cy="119" rx="10" ry="5" fill="#ee8791" opacity=".34"/><ellipse cx="112" cy="119" rx="10" ry="5" fill="#ee8791" opacity=".34"/>':'<ellipse cx="68" cy="119" rx="8" ry="4" fill="#ee8791" opacity=".22"/><ellipse cx="112" cy="119" rx="8" ry="4" fill="#ee8791" opacity=".22"/>';
 const accessoryArt={
  glasses:'<g fill="none" stroke="#34434a" stroke-width="3.2"><rect x="56" y="91" width="31" height="24" rx="9"/><rect x="93" y="91" width="31" height="24" rx="9"/><path d="M87 101 H93"/></g>',
  round:'<g fill="none" stroke="#34434a" stroke-width="3.2"><circle cx="72" cy="103" r="15"/><circle cx="108" cy="103" r="15"/><path d="M87 101 H93"/></g>',
  headphones:'<path d="M40 102 Q38 24 90 24 Q142 24 140 102" fill="none" stroke="#e8a34d" stroke-width="7"/><rect x="34" y="88" width="15" height="34" rx="7" fill="#e8a34d"/><rect x="131" y="88" width="15" height="34" rx="7" fill="#e8a34d"/>',
  flower:'<g transform="translate(127 43)" fill="#ef9cbd"><ellipse cy="-8" rx="5" ry="9"/><ellipse cy="8" rx="5" ry="9"/><ellipse cx="-8" rx="9" ry="5"/><ellipse cx="8" rx="9" ry="5"/><circle r="4" fill="#ffd45c"/></g>',
  cap:'<path d="M47 56 Q55 28 91 28 Q126 28 135 58 L132 68 Q91 59 46 74Z" fill="#4d9366"/><path d="M91 57 Q125 52 146 69 Q120 80 91 68Z" fill="#34764d"/>',
  bow:'<g fill="#e98eae"><path d="M91 49 Q62 24 65 52 Q69 67 91 55Z"/><path d="M91 49 Q120 24 117 52 Q113 67 91 55Z"/><circle cx="91" cy="52" r="5" fill="#f7cd65"/></g>'
 }[accessory]||'';
 return '<div class="ml-avatar-stage '+(size||'large')+'" data-bg="'+background+'"><svg class="ml-avatar-person" viewBox="0 0 180 245" preserveAspectRatio="xMidYMid meet" role="img" aria-label="شخصیت کارتونی شخصی‌سازی‌شده" focusable="false" style="--skin:'+skin+';--hair:'+hair+';--eyes:'+eyes+';--shirt:'+shirt+'">'
  +'<defs><linearGradient id="avatarFaceShade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#713f2c" stop-opacity=".10"/></linearGradient></defs>'
  +'<ellipse cx="90" cy="239" rx="48" ry="5.5" fill="#314b3520"/>'
  +body+clothes
  +'<path d="M77 139 H103 L104 165 Q90 174 76 165Z" fill="var(--skin)"/>'
  +hairBack
  +'<ellipse cx="49" cy="105" rx="8" ry="12" fill="var(--skin)"/><ellipse cx="131" cy="105" rx="8" ry="12" fill="var(--skin)"/>'
  +'<path d="'+facePath+'" fill="var(--skin)"/><path d="'+facePath+'" fill="url(#avatarFaceShade)"/>'
  +faceDetail
  +'<path d="'+browPath+'" fill="none" stroke="var(--hair)" stroke-width="'+browWeight+'" stroke-linecap="round"/>'
  +'<g class="av-eyes">'+eyesArt+'</g>'
  +'<path d="M90 107 Q86 116 90 119" fill="none" stroke="#a66e5b" stroke-width="1.8" stroke-linecap="round" opacity=".65"/>'
  +mouth
  +fringe
  +accessoryArt
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
 {id:'look',label:'ظاهر',icon:'🙂',cats:['gender','skin','faceShape','eyeStyle','eyeColor','browStyle','expression','mouthStyle','faceDetail']},
 {id:'hair',label:'مو',icon:'💇',cats:['hairStyle','hairColor']},
 {id:'style',label:'استایل',icon:'👕',cats:['outfitStyle','outfitColor','accessory','background']}
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
 return cost>=55?{id:'epic',label:'حماسی'}:cost>=40?{id:'rare',label:'کمیاب'}:{id:'common',label:'رایج'};
}
function applyAvatarChoice(cat,val,main){
 const p=state.profile;
 const key=cat+':'+val;
 const item=(avatarChoices[cat]||[]).find(x=>x.value===val);
 if(!item)return;
 if(item.cost&&!p.unlocked.includes(key)){
  const cost=Number(item.cost);
  if(state.gems<cost){showToast('کریستال کافی نداری. با انجام تسک و عادت کریستال جمع کن.');return;}
  state.gems-=cost;
  p.unlocked.push(key);
  showToast('🎉 «'+item.label+'» به کمدت اضافه شد!');
  celebrate();
 }
 p[cat]=val;
 plusSave();
 render();
}
function characterMarkup(p){
 const group=avatarGroups.find(g=>g.cats.includes(activeAvatarCategory))||avatarGroups[0];
 const groups=avatarGroups.map(g=>'<button type="button" class="look-group '+(g.id===group.id?'active':'')+'" data-avatar-group="'+g.id+'"><span>'+g.icon+'</span>'+g.label+'</button>').join('');
 const cats=group.cats.map(id=>{const c=catInfo(id);return '<button type="button" class="look-cat '+(activeAvatarCategory===id?'active':'')+'" data-avatar-tab="'+id+'">'+c.icon+' '+c.label+'</button>';}).join('');
 const choices=(avatarChoices[activeAvatarCategory]||[]).map(item=>{
  const key=activeAvatarCategory+':'+item.value;
  const owned=!item.cost||p.unlocked.includes(key);
  const selected=p[activeAvatarCategory]===item.value;
  const visual=activeAvatarCategory==='gender'
   ? '<span class="look-symbol">'+(item.icon||'✦')+'</span>'
   : avatarMarkup('mini',{[activeAvatarCategory]:item.value});
  return '<button type="button" class="look-choice '+(selected?'selected':'')+(owned?'':' locked')+'" data-avatar-choice="'+activeAvatarCategory+'" data-avatar-value="'+item.value+'" aria-pressed="'+selected+'">'+
   (selected?'<span class="look-check" aria-hidden="true">✓</span>':'')+
   '<span class="look-visual">'+visual+'</span><span class="look-name">'+item.label+'</span>'+
   (owned?'':'<small class="price">💎 '+item.cost+'</small>')+
   '</button>';
 }).join('');
 return '<div class="look-layout">'+
  '<aside class="look-stage-card">'+avatarMarkup('large')+'<div class="look-name-big">'+plusEscape(p.displayName||'شخصیت من')+'</div>'+
   '<form id="simple-avatar-name" class="look-name-form"><input id="simple-avatar-name-input" name="displayName" maxlength="32" value="'+plusEscape(p.displayName||'')+'" placeholder="اسم شخصیتت"><button type="submit">ذخیره</button></form>'+
  '</aside>'+
  '<section class="look-editor">'+
   '<div class="look-groups" role="tablist">'+groups+'</div>'+
   '<div class="look-cats">'+cats+'</div>'+
   '<div class="look-head"><h3>'+catInfo(activeAvatarCategory).icon+' '+catInfo(activeAvatarCategory).label+'</h3><span>'+(avatarChoices[activeAvatarCategory]||[]).length+' گزینه</span></div>'+
   '<div class="look-options">'+(choices||'<p class="simple-avatar-empty">موردی برای نمایش وجود ندارد.</p>')+'</div>'+
  '</section>'+
 '</div>';
}
function shopMarkup(p){
 const premium=[];
 Object.keys(avatarChoices).forEach(cat=>avatarChoices[cat].forEach(item=>{if(item.cost)premium.push({cat,item});}));
 const cats=[...new Set(premium.map(x=>x.cat))];
 const current=activeShopCat==='all'||cats.includes(activeShopCat)?activeShopCat:'all';
 const pills='<button type="button" class="look-cat '+(current==='all'?'active':'')+'" data-shop-cat="all">✨ همه</button>'+cats.map(c=>{const info=catInfo(c);return '<button type="button" class="look-cat '+(c===current?'active':'')+'" data-shop-cat="'+c+'">'+info.icon+' '+info.label+'</button>';}).join('');
 const items=premium.filter(x=>current==='all'||x.cat===current).map(({cat,item})=>{
  const key=cat+':'+item.value;
  const owned=p.unlocked.includes(key);
  const equipped=p[cat]===item.value;
  const r=rarityOf(item.cost);
  const action=equipped
   ? '<span class="shop-badge">✓ در حال استفاده</span>'
   : owned
    ? '<button type="button" class="shop-action equip" data-shop-item="'+cat+'" data-shop-value="'+item.value+'">پوشیدن</button>'
    : '<button type="button" class="shop-action buy '+(state.gems<item.cost?'short':'')+'" data-shop-item="'+cat+'" data-shop-value="'+item.value+'">💎 '+item.cost+' خرید</button>';
  return '<article class="shop-card '+(equipped?'equipped':'')+'"><span class="rarity r-'+r.id+'">'+r.label+'</span><div class="shop-visual">'+avatarMarkup('mini',{[cat]:item.value})+'</div><h4>'+item.label+'</h4><small>'+catInfo(cat).label+(owned&&!equipped?' · در کمدت':'')+'</small>'+action+'</article>';
 }).join('');
 const ownedCount=premium.filter(x=>p.unlocked.includes(x.cat+':'+x.item.value)).length;
 return '<section class="shop-hero"><div><span class="eyebrow">SHOP</span><h3>فروشگاه شخصیت</h3><p>کریستال‌هایت را از تسک‌ها، عادت‌ها و جلسات تمرکز بگیر.</p></div><div class="shop-tally"><strong>'+ownedCount+'/'+premium.length+'</strong><small>در کمدت</small></div></section>'+
  '<div class="shop-cats">'+pills+'</div>'+
  '<div class="look-head shop-head"><h3>همه آیتم‌ها</h3><span>'+(current==='all'?premium.length:premium.filter(x=>x.cat===current).length)+' مورد</span></div>'+
  '<div class="shop-grid">'+items+'</div>';
}
function mountProfile(main) {
 const root=main.querySelector('#profile-experience');
 if(!root)return;
 const p=state.profile;
 const gems='<div class="gem-balance"><span aria-hidden="true">💎</span><strong>'+state.gems.toLocaleString('fa-IR')+'</strong><small>کریستال</small></div>';
 const tabs='<div class="profile-tabs" role="tablist">'+
  '<button type="button" role="tab" aria-selected="'+(activeProfileTab==='character')+'" class="profile-tab '+(activeProfileTab==='character'?'active':'')+'" data-profile-tab="character">🧑 شخصیت من</button>'+
  '<button type="button" role="tab" aria-selected="'+(activeProfileTab==='shop')+'" class="profile-tab '+(activeProfileTab==='shop'?'active':'')+'" data-profile-tab="shop">🛍 فروشگاه</button>'+
  '</div>';
 root.innerHTML = '<div class="profile-bar">'+tabs+gems+'</div>' + (activeProfileTab==='shop' ? shopMarkup(p) : characterMarkup(p));
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
  showToast('اسم شخصیت ذخیره شد.');
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
      '<div class="plus-heading"><div><span class="eyebrow">YOUR BIG PICTURE</span><h2>هدف‌های من</h2><p>هدف‌های مهمت رو ثبت کن و قدم‌به‌قدم جلو برو.</p></div><span class="plus-chip">' + state.goals.filter(g => g.done).length + ' / ' + state.goals.length + ' انجام‌شده</span></div>' +
      '<form id="plus-goal-form" class="plus-form"><input name="title" maxlength="90" placeholder="مثلاً: یادگیری یک مهارت جدید..." required><button>افزودن هدف +</button></form>' +
      '<div class="plus-goal-list">' + (state.goals.length ? state.goals.map(g => '<div class="plus-goal ' + (g.done ? 'done' : '') + '"><button data-plus="goal-toggle" data-id="' + g.id + '">' + (g.done ? '✓' : '○') + '</button><span>' + plusEscape(g.title) + '</span><button class="remove" data-plus="goal-delete" data-id="' + g.id + '">×</button></div>').join('') : '<div class="plus-empty">هنوز هدفی ثبت نکردی؛ اولین هدفت رو اضافه کن.</div>') + '</div>' +
    '</div>' +
    '<div class="panel plus-panel" id="plus-journal">' +
      '<div class="plus-heading"><div><span class="eyebrow">DAILY REFLECTION</span><h2>ژورنال روزانه</h2><p>اتفاق‌ها، ایده‌ها و چیزهایی که یاد گرفتی.</p></div><span class="plus-chip">ذخیره خودکار</span></div>' +
      '<textarea id="plus-journal-input" placeholder="امروز چه چیزی برات ارزشمند بود؟">' + plusEscape(state.journal[state.date] || '') + '</textarea>' +
      '<div class="plus-journal-foot"><span id="plus-journal-status">اطلاعات فقط روی همین دستگاه ذخیره می‌شود.</span><span id="plus-journal-count">' + (state.journal[state.date] || '').length + ' کاراکتر</span></div>' +
    '</div>' +
    '<div class="panel plus-panel plus-backup">' +
      '<div class="plus-heading"><div><span class="eyebrow">YOUR DATA, YOUR CONTROL</span><h2>مدیریت اطلاعات</h2><p>از اطلاعاتت نسخه پشتیبان بگیر یا آن را بازیابی کن.</p></div></div>' +
      '<div class="plus-actions"><button id="plus-export">↓ دریافت نسخه پشتیبان</button><label class="plus-import">↑ بازیابی نسخه پشتیبان<input id="plus-import-file" type="file" accept="application/json"></label></div>' +
      '<small class="plus-note">پیشنهاد: هر چند وقت یک‌بار از اطلاعاتت خروجی بگیر. پاک‌کردن داده‌های مرورگر می‌تواند اطلاعات محلی را حذف کند.</small>' +
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
    '<div class="plus-heading"><div><span class="eyebrow">PAST DAYS</span><h2>روزهای قبل</h2><p>یادداشت‌های گذشته‌ات، از جدید به قدیم.</p></div></div>' +
    (pastEntries.length
      ? pastEntries.map(k => '<div class="plus-entry"><span><strong>' +
          plusEscape(new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(k + 'T00:00:00'))) +
          '</strong><br>' + plusEscape(state.journal[k]) + '</span></div>').join('')
      : '<div class="plus-empty">هنوز یادداشتی برای روزهای قبل نداری.</div>');
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
    plusSave(); plusRender(); showToast('هدف جدید ثبت شد 🎯');
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
    document.getElementById('plus-journal-status').textContent = 'ذخیره شد ✓';
    document.getElementById('plus-journal-count').textContent = journal.value.length + ' کاراکتر';
  });
  document.getElementById('plus-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'my-life-backup-' + state.date + '.json';
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('نسخه پشتیبان آماده شد');
  });
  document.getElementById('plus-import-file').addEventListener('change', event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!imported || !Array.isArray(imported.tasks) || !Array.isArray(imported.habits)) throw new Error('invalid');
        if (!confirm('اطلاعات فعلی با نسخه پشتیبان جایگزین شود؟')) return;
        if (!isRecord(imported) || !Array.isArray(imported.tasks) || !Array.isArray(imported.habits)) throw new Error('invalid');
        state = normalizeState(imported);
        plusSave(); plusRender(); showToast('اطلاعات با موفقیت بازیابی شد');
      } catch { showToast('فایل انتخاب‌شده معتبر نیست'); }
    };
    reader.readAsText(file);
  });
  const settingsWrap = document.createElement('div');
  settingsWrap.className = 'plus-grid';
  settingsWrap.innerHTML =
    '<div class="panel plus-panel" id="plus-settings">' +
      '<div class="plus-heading"><div><span class="eyebrow">PREFERENCES</span><h2>ظاهر و هدف‌ها</h2><p>ظاهر برنامه و هدف آب روزانه‌ات را تنظیم کن.</p></div></div>' +
      '<div class="settings-row"><div><strong>حالت تاریک</strong><small>ظاهر روشن یا تیره برای برنامه</small></div>' +
        '<button id="plus-theme" class="secondary-button">' + (state.settings.theme === 'dark' ? '☀ حالت روشن' : '☾ حالت تاریک') + '</button></div>' +
      '<div class="settings-row"><div><strong>هدف آب روزانه</strong><small>بین ۱ تا ۲۴ لیوان</small></div>' +
        '<form id="plus-water-form" class="settings-inline"><input id="plus-water-target" type="number" min="1" max="24" value="' + waterTarget() + '" aria-label="هدف آب روزانه"><button class="primary-button">ذخیره</button></form></div>' +
    '</div>';
  main.querySelector('[data-page="settings"]').appendChild(settingsWrap);

  document.getElementById('plus-theme').addEventListener('click', () => {
    state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
    plusSave(); plusRender();
  });
  document.getElementById('plus-water-form').addEventListener('submit', e => {
    e.preventDefault();
    const value = Math.round(Number(document.getElementById('plus-water-target').value));
    if (!Number.isFinite(value) || value < 1 || value > 24) {
      showToast('هدف آب باید بین ۱ تا ۲۴ لیوان باشد');
      return;
    }
    state.settings.waterTarget = value;
    plusSave(); plusRender();
    showToast('هدف آب ذخیره شد 💧');
  });
}
render = function() { plusRender(); };
render();
