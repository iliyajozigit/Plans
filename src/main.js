
import './style.css';
import './smart.js';

const $ = (selector) => document.querySelector(selector);
const today = () => new Date().toLocaleDateString('en-CA');

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
  profile: { displayName: 'ماجراجوی My Life', gender: 'boy', bio: 'در مسیر نسخه بهتر خودم', skin: '#d99b72', hairColor: '#49312f', hairStyle: 'wave', eyeColor: '#4b8177', outfitStyle: 'hoodie', outfitColor: '#7666df', accessory: 'glasses', background: 'blossom', unlocked: [], questClaims: {} },
  gems: 120, streak: 0, longestStreak: 0, lastActiveDate: null,
  totalTasksCompleted: 0, totalHabitsCompleted: 0, xpByDate: {}, createdAt: today()
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('myLifeState'));
    return saved ? { ...structuredClone(defaultState), ...saved } : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

let state = loadState();
state.profile = { ...defaultState.profile, ...(state.profile || {}) };
if (!['boy','girl','neutral'].includes(state.profile.gender)) state.profile.gender = 'boy';
if (!state.profile.genderInitialized) { state.profile.gender = 'boy'; state.profile.hairStyle = 'short'; state.profile.genderInitialized = true; }
state.profile.unlocked = Array.isArray(state.profile.unlocked) ? state.profile.unlocked : [];
state.profile.questClaims = state.profile.questClaims && typeof state.profile.questClaims === 'object' ? state.profile.questClaims : {};
state.gems = Number.isFinite(Number(state.gems)) ? Number(state.gems) : 120;
state.streak = Number(state.streak || 0); state.longestStreak = Number(state.longestStreak || 0);
state.xpByDate = state.xpByDate && typeof state.xpByDate === 'object' ? state.xpByDate : {};
state.totalTasksCompleted = Number(state.totalTasksCompleted || 0); state.totalHabitsCompleted = Number(state.totalHabitsCompleted || 0);
state.tasks = state.tasks.map(task => ({ ...task, rewardClaimed: task.rewardClaimed ?? !!task.done, countedComplete: task.countedComplete ?? !!task.done }));
state.habits = state.habits.map(habit => ({ ...habit, lastRewardDate: habit.lastRewardDate ?? (habit.done ? state.date : null) }));
state.waterRewardDate = state.waterRewardDate || null;

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

function save() {
  localStorage.setItem('myLifeState', JSON.stringify(state));
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
function addXP(amount) {
  state.xp += amount;
  state.xpByDate[today()] = Number(state.xpByDate[today()] || 0) + amount;
  recordActiveDay();
  checkBadges();
}
function getRecentXP(days = 7) {
  let total = 0;
  for (let offset = 0; offset < days; offset++) {
    const date = new Date(); date.setDate(date.getDate() - offset);
    total += Number(state.xpByDate[date.toLocaleDateString('en-CA')] || 0);
  }
  return total;
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

function render() {
  const completedTasks = state.tasks.filter(t => t.done).length;
  const completedHabits = state.habits.filter(h => h.done).length;
  const taskPercent = getTaskPercent();
  const habitPercent = getHabitPercent();

  $('#app').innerHTML = `
    <div class="app-shell">
      <div class="nature-scene" aria-hidden="true">
        <div class="sakura-petals" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i><i class="petal-extra"></i></div>
        <span class="nature-photo-sakura"></span>
        <span class="nature-photo-leaves"></span>
        <span class="nature-glow glow-one"></span>
        <span class="nature-glow glow-two"></span>
        <span class="nature-glow glow-three"></span>
        <span class="nature-leaf leaf-one"></span><span class="nature-leaf leaf-two"></span>
        <span class="nature-leaf leaf-three"></span><span class="nature-leaf leaf-four"></span>
        <span class="nature-leaf leaf-five"></span><span class="nature-leaf leaf-six"></span>
        <span class="nature-leaf leaf-seven"></span><span class="nature-leaf leaf-eight"></span>
        <span class="nature-leaf leaf-nine"></span><span class="nature-leaf leaf-ten"></span>
        <span class="nature-leaf leaf-eleven"></span><span class="nature-leaf leaf-twelve"></span>
        <span class="sakura-tree sakura-left" aria-hidden="true"></span>
        <span class="sakura-tree sakura-right" aria-hidden="true"></span>
        <span class="sakura-tree sakura-far" aria-hidden="true"></span>
      </div>

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
                    <circle cx="60" cy="60" r="48" class="chart-progress"/>
                  </svg>
                  <div class="growth-percent">
                    <strong>${Math.round((taskPercent + habitPercent) / 2)}%</strong>
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

            <div class="hero-bloom" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><b></b></div>
            <div class="hero-orbit orbit-one" aria-hidden="true"><i></i></div>
            <div class="hero-orbit orbit-two" aria-hidden="true"><i></i></div>
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
            <strong>${state.water}<small> / 8 لیوان</small></strong>
            <div class="stat-progress">
              <div style="width:${Math.min(state.water / 8 * 100, 100)}%"></div>
            </div>
          </div>
        </section>


        <section class="daily-path-panel">
          <div class="daily-path-heading">
            <div><span class="eyebrow">YOUR DAILY JOURNEY</span><h2>مسیر امروزت</h2><p>هر قدم کوچیک، تو رو جلوتر می‌بره.</p></div>
            <span class="daily-path-progress">${Math.round((taskPercent + habitPercent) / 2)}٪</span>
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
                <button
                  class="habit-item ${habit.done ? 'habit-done' : ''}"
                  data-action="habit-toggle"
                  data-id="${habit.id}"
                >
                  <span class="habit-icon">${habit.icon}</span>
                  <span class="habit-title">${habit.title}</span>
                  <span class="habit-status">${habit.done ? '✓' : '+'}</span>
                </button>
              `).join('')}
            </div>

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
              <button id="timer-start" class="primary-button">شروع</button>
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
              ${state.water}<small> / 8</small>
            </div>

            <p>لیوان آب امروز</p>

            <div class="water-glasses">
              ${Array.from({ length: 8 }, (_, i) => `
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

    save();
    render();
    showToast('وظیفه جدید اضافه شد ✨');
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
    if (state.water >= 8) {
      showToast('هدف روزانه آب تکمیل شده است 💧');
      return;
    }

    state.water++;
    addXP(2);
    if (state.water >= 8 && state.waterRewardDate !== today()) {
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

function updateTimerDisplay() {
  const timer = $('#timer');
  if (!timer) return;

  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const seconds = String(timerSeconds % 60).padStart(2, '0');

  timer.textContent = `${minutes}:${seconds}`;
}

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    $('#timer-start').textContent = 'ادامه';
    return;
  }

  timerRunning = true;
  $('#timer-start').textContent = 'توقف';

  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
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
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
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
    save();
    render();
    showToast('روز جدیدی آغاز شد! ✨');
  } else {
    updateClock();
  }
}, 30000);

checkBadges();
save();
render();


// My Life Plus — incremental feature layer (keeps existing data and workflows).
const originalRender = render;
const plusDefaults = { goals: [], journal: {}, theme: 'light', waterTarget: 8 };
state.goals = Array.isArray(state.goals) ? state.goals : [];
state.journal = state.journal && typeof state.journal === 'object' ? state.journal : {};
if (!state.journal[state.date] && state.notes) state.journal[state.date] = state.notes;
state.settings = { ...plusDefaults, ...(state.settings || {}) };

function plusEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function plusSave() {
  localStorage.setItem('myLifeState', JSON.stringify(state));
}

const avatarCategories = [
  {id:'skin',label:'پوست',icon:'◉'},{id:'hairStyle',label:'مدل مو',icon:'⌁'},
  {id:'hairColor',label:'رنگ مو',icon:'●'},{id:'eyeColor',label:'چشم‌ها',icon:'◎'},
  {id:'outfitStyle',label:'لباس',icon:'▱'},{id:'outfitColor',label:'رنگ لباس',icon:'◌'},
  {id:'accessory',label:'اکسسوری',icon:'◇'},{id:'expression',label:'حالت چهره',icon:'☺'},{id:'background',label:'پس‌زمینه',icon:'▧'}
];
let activeAvatarCategory = 'skin';
let activeShopCategory = 'all';
const avatarChoices = {
 skin:[['#f4d0b1','روشن'],['#e8b58d','گندمی روشن'],['#d99b72','گندمی'],['#b97855','کاراملی'],['#8c573f','قهوه‌ای'],['#633e35','تیره']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 hairStyle:[{value:'short',label:'کوتاه',icon:'⌁'},{value:'wave',label:'موج‌دار',icon:'〰'},{value:'curly',label:'فر',icon:'◌'},{value:'long',label:'بلند',icon:'〰'},{value:'bob',label:'مصری',icon:'⌒',cost:50},{value:'ponytail',label:'دم‌اسبی',icon:'↗',cost:65}],
 hairColor:[['#302321','مشکی'],['#49312f','قهوه‌ای'],['#87513a','فندقی'],['#d6a04d','بلوند'],['#a65e91','یاسی'],['#6376c9','آبی']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 eyeColor:[['#4b8177','سبزآبی'],['#5574aa','آبی'],['#694b37','قهوه‌ای'],['#747b8d','خاکستری']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 outfitStyle:[{value:'tee',label:'تی‌شرت',icon:'▱'},{value:'hoodie',label:'هودی',icon:'▰'},{value:'jacket',label:'کت شهری',icon:'▥',cost:55},{value:'star',label:'ستاره‌ای',icon:'✦',cost:85},{value:'galaxy',label:'کهکشانی',icon:'✧',cost:120},{value:'varsity',label:'دانشگاهی',icon:'▤',cost:95},{value:'artist',label:'هنری',icon:'◈',cost:75},{value:'raincoat',label:'بارانی',icon:'▧',cost:65}],
 outfitColor:[['#7666df','بنفش'],['#4caa83','سبز'],['#e77d9f','صورتی'],['#4f83bd','آبی'],['#e59b4e','نارنجی'],['#38465d','سرمه‌ای']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 accessory:[{value:'none',label:'بدون اکسسوری',icon:'—'},{value:'glasses',label:'عینک کلاسیک',icon:'▱'},{value:'round',label:'عینک گرد',icon:'◉'},{value:'headphones',label:'هدفون',icon:'◖',cost:35},{value:'flower',label:'گل ساکورا',icon:'✿',cost:45},{value:'crown',label:'تاج افتخار',icon:'♛',cost:90},{value:'cap',label:'کلاه کپ',icon:'⌂',cost:50},{value:'bow',label:'پاپیون',icon:'⋈',cost:40},{value:'scarf',label:'شال گردن',icon:'∿',cost:55}],
 expression:[{value:'happy',label:'شاد',icon:'☺'},{value:'confident',label:'بااعتمادبه‌نفس',icon:'⌣'},{value:'surprised',label:'متعجب',icon:'◉'},{value:'sleepy',label:'آرام',icon:'ᴗ'},{value:'wink',label:'چشمک',icon:'😉',cost:35}],
 background:[{value:'blossom',label:'شکوفه',icon:'✿'},{value:'meadow',label:'چمنزار',icon:'❧'},{value:'ocean',label:'اقیانوس',icon:'≈'},{value:'sunset',label:'غروب',icon:'◒'},{value:'lavender',label:'اسطوخودوس',icon:'◌',cost:40},{value:'galaxy',label:'کهکشان',icon:'✧',cost:75},{value:'mint',label:'نعنایی',icon:'◉',cost:35},{value:'peach',label:'هلویی',icon:'◒',cost:35},{value:'forest',label:'جنگل',icon:'♧',cost:60}]
};
function avatarMarkup(size) {
 const p=state.profile||{};
 const safe=(key,fallback)=>((avatarChoices[key]||[]).some(x=>x.value===p[key])?p[key]:fallback);
 const skin=safe('skin','#e8b58d'), hair=safe('hairColor','#49312f');
 const eyes=safe('eyeColor','#4b8177'), shirt=safe('outfitColor','#58a6dc');
 const hairStyle=safe('hairStyle','wave'), outfitStyle=safe('outfitStyle','tee');
 const accessory=safe('accessory','none'), background=safe('background','blossom'), expression=safe('expression','happy');
 const hairBack={
  short:'<path d="M47 82 Q40 39 66 25 Q91 10 119 27 Q143 42 134 91 L127 119 L114 110 L110 72 L67 72 L63 113 L49 119Z" fill="var(--hair)"/>',
  wave:'<path d="M45 87 Q34 42 62 24 Q88 7 119 25 Q148 44 135 95 L134 151 Q126 164 113 151 L108 103 L69 103 L64 151 Q51 163 44 150 L47 104Z" fill="var(--hair)"/>',
  long:'<path d="M44 86 Q35 39 63 22 Q89 7 119 24 Q147 42 136 92 L139 171 Q129 181 115 169 L110 105 L68 105 L63 169 Q49 181 40 169 L45 105Z" fill="var(--hair)"/>',
  bob:'<path d="M44 87 Q34 39 63 22 Q90 7 119 25 Q147 43 136 91 L132 137 Q124 151 109 139 L108 104 L69 104 L67 139 Q52 151 45 137Z" fill="var(--hair)"/>',
  ponytail:'<path d="M125 48 Q157 50 153 88 Q150 113 130 119 L119 105Z" fill="var(--hair)"/><path d="M45 86 Q35 40 63 23 Q90 8 119 25 Q147 43 136 89 L131 115 L49 115Z" fill="var(--hair)"/>',
  curly:'<g fill="var(--hair)"><circle cx="51" cy="61" r="17"/><circle cx="61" cy="39" r="19"/><circle cx="83" cy="27" r="20"/><circle cx="106" cy="27" r="20"/><circle cx="126" cy="41" r="19"/><circle cx="136" cy="64" r="17"/><path d="M46 66 Q39 105 48 143 L64 151 L69 88Z M134 67 Q143 107 132 144 L116 151 L111 87Z"/></g>'
 }[hairStyle]||'';
 const fringe={
  short:'<path d="M49 75 Q48 31 89 25 Q128 26 132 72 Q119 61 106 74 Q93 61 80 75 Q64 62 49 75Z" fill="var(--hair)"/>',
  wave:'<path d="M48 75 Q45 34 73 27 Q98 17 119 35 Q134 48 132 75 Q117 62 105 75 Q91 61 79 75 Q64 62 48 75Z" fill="var(--hair)"/>',
  long:'<path d="M48 75 Q45 31 88 24 Q129 25 133 75 Q117 61 104 74 Q91 60 78 75 Q63 61 48 75Z" fill="var(--hair)"/>',
  bob:'<path d="M48 75 Q45 31 88 24 Q129 25 133 75 Q117 62 104 73 Q90 62 78 75 Q63 61 48 75Z" fill="var(--hair)"/>',
  ponytail:'<path d="M48 75 Q45 31 88 24 Q129 25 133 75 Q117 61 104 74 Q91 60 78 75 Q63 61 48 75Z" fill="var(--hair)"/>',
  curly:'<g fill="var(--hair)"><circle cx="55" cy="60" r="14"/><circle cx="74" cy="43" r="16"/><circle cx="91" cy="38" r="17"/><circle cx="109" cy="43" r="16"/><circle cx="126" cy="60" r="14"/></g>'
 }[hairStyle]||'';
 const body='<path d="M59 148 Q70 137 79 137 L90 148 L101 137 Q113 137 122 148 Q141 166 149 220 H31 Q39 166 59 148Z" fill="var(--shirt)"/>';
 const outfitExtra={
  tee:'<path d="M79 140 L90 153 L101 140" fill="none" stroke="#ffffffb8" stroke-width="4" stroke-linecap="round"/>',
  hoodie:'<path d="M72 145 Q90 122 108 145 L104 165 Q90 175 76 165Z" fill="#00000016"/><path d="M90 164 V219" stroke="#ffffff75" stroke-width="2.5"/>',
  jacket:'<path d="M77 140 L90 154 L103 140 L99 220 H81Z" fill="#ffffff2a"/><path d="M90 154 V219" stroke="#ffffffb8" stroke-width="3"/>',
  varsity:'<path d="M77 140 L90 154 L103 140 L99 220 H81Z" fill="#ffffff24"/><path d="M90 154 V219" stroke="#ffffffb8" stroke-width="3"/><path d="M43 165 L59 151 L70 220 H49Z M137 165 L121 151 L110 220 H131Z" fill="#f4d16b"/>',
  star:'<path d="M90 171 L96 184 L110 185 L99 194 L103 208 L90 200 L77 208 L81 194 L70 185 L84 184Z" fill="#ffdf72"/>',
  galaxy:'<g fill="#fff"><circle cx="67" cy="176" r="2.5"/><circle cx="113" cy="168" r="2"/><circle cx="105" cy="203" r="2.5"/><circle cx="77" cy="210" r="1.8"/></g>',
  artist:'<path d="M73 164 L107 164 L111 204 L69 204Z" fill="#f7dfb7"/><path d="M81 176 H99 M81 187 H99" stroke="#c88f57" stroke-width="4" stroke-linecap="round"/>',
  raincoat:'<path d="M73 146 L90 160 L107 146" fill="none" stroke="#ffffffc9" stroke-width="5"/><path d="M90 160 V219" stroke="#ffffff80" stroke-width="2.5"/>'
 }[outfitStyle]||'';
 const accessoryArt={
  glasses:'<g fill="none" stroke="#394b52" stroke-width="3.5"><rect x="54" y="87" width="31" height="22" rx="9"/><rect x="95" y="87" width="31" height="22" rx="9"/><path d="M85 96 H95"/></g>',
  round:'<g fill="none" stroke="#394b52" stroke-width="3.5"><circle cx="70" cy="98" r="15"/><circle cx="110" cy="98" r="15"/><path d="M85 96 H95"/></g>',
  flower:'<g transform="translate(126 43)" fill="#f29cbd"><ellipse cy="-9" rx="5" ry="9"/><ellipse cy="9" rx="5" ry="9"/><ellipse cx="-9" rx="9" ry="5"/><ellipse cx="9" rx="9" ry="5"/><circle r="4.5" fill="#ffd45c"/></g>',
  crown:'<path d="M59 51 L69 30 L88 46 L106 29 L121 51 L127 62 H53Z" fill="#f5c84e" stroke="#d89e28" stroke-width="2.5"/>',
  headphones:'<path d="M43 92 Q40 25 90 24 Q140 25 137 92" fill="none" stroke="#e8a34d" stroke-width="7"/><rect x="37" y="81" width="14" height="31" rx="6" fill="#e8a34d"/><rect x="129" y="81" width="14" height="31" rx="6" fill="#e8a34d"/>',
  cap:'<path d="M48 57 Q55 31 91 31 Q124 31 134 58 L132 68 Q91 58 47 73Z" fill="#4d9366"/><path d="M91 58 Q124 53 145 69 Q120 79 91 68Z" fill="#34764d"/>',
  bow:'<g fill="#e98eae"><path d="M91 49 Q62 24 65 52 Q69 67 91 55Z"/><path d="M91 49 Q120 24 117 52 Q113 67 91 55Z"/><circle cx="91" cy="52" r="5" fill="#f7cd65"/></g>',
  scarf:'<path d="M69 140 Q90 154 111 140 L116 157 Q90 174 64 157Z" fill="#e7a34e"/><path d="M103 151 L118 151 L113 193 L98 193Z" fill="#e7a34e"/>'
 }[accessory]||'';
 const face='<path d="M90 39 C66 39 50 57 49 83 L48 103 C48 128 66 145 90 147 C114 145 132 128 132 103 L131 83 C130 57 114 39 90 39Z" fill="var(--skin)"/>';
 const browArt=expression==='sleepy'?'<path d="M66 94 Q75 98 83 94 M97 94 Q105 98 114 94"':'<path d="M66 91 Q75 85 83 91 M97 91 Q105 85 114 91"';
 const mouthArt=expression==='surprised'?'<ellipse cx="90" cy="127" rx="5" ry="7" fill="#a95d5b"/>':expression==='confident'?'<path d="M82 126 Q92 133 101 124" fill="none" stroke="#a95d5b" stroke-width="2.7" stroke-linecap="round"/>':expression==='sleepy'?'<path d="M83 128 Q90 130 97 128" fill="none" stroke="#a95d5b" stroke-width="2.7" stroke-linecap="round"/>':'<path d="M81 126 Q90 133 99 126" fill="none" stroke="#a95d5b" stroke-width="2.7" stroke-linecap="round"/>';
 return '<div class="ml-avatar-stage '+(size||'large')+'" data-bg="'+background+'"><svg class="ml-avatar-person" viewBox="0 0 180 230" preserveAspectRatio="xMidYMid meet" role="img" aria-label="آواتار شخصی‌سازی‌شده" focusable="false" style="--skin:'+skin+';--hair:'+hair+';--eyes:'+eyes+';--shirt:'+shirt+'">'
  +'<ellipse cx="90" cy="220" rx="48" ry="6" fill="#314b3520"/>'
  +body+outfitExtra
  +'<path d="M77 126 H103 L104 151 Q90 161 76 151Z" fill="var(--skin)"/>'
  +hairBack
  +'<ellipse cx="49" cy="98" rx="8" ry="12" fill="var(--skin)"/><ellipse cx="131" cy="98" rx="8" ry="12" fill="var(--skin)"/>'
  +face
  +'<ellipse cx="69" cy="113" rx="8" ry="4.5" fill="#ed8e91" opacity=".26"/><ellipse cx="111" cy="113" rx="8" ry="4.5" fill="#ed8e91" opacity=".26"/>'
  +fringe
  +browArt.replace('<path','<path fill="none" stroke="var(--hair)" stroke-width="3.2" stroke-linecap="round"')
  +'<ellipse cx="75" cy="101" rx="4.2" ry="6" fill="var(--eyes)"/><ellipse cx="105" cy="101" rx="4.2" ry="6" fill="var(--eyes)"/><circle cx="76.5" cy="99" r="1.5" fill="#fff"/><circle cx="106.5" cy="99" r="1.5" fill="#fff"/>'
  +'<path d="M90 105 Q86 113 90 115" fill="none" stroke="#b97868" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>'
  +mouthArt
  +accessoryArt
  +'</svg><span class="ml-avatar-spark spark-a">✦</span><span class="ml-avatar-spark spark-b">✧</span></div>';
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
let activeProfileTab = 'creator';
function mountProfile(main) {
 const root=main.querySelector('#profile-experience'); if(!root)return;
 const p=state.profile, level=getLevel(), xpInLevel=getLevelProgress();
 const doneTasks=state.tasks.filter(t=>t.done).length, doneHabits=state.habits.filter(h=>h.done).length;
 const todayXP=Number(state.xpByDate[today()]||0), weekXP=getRecentXP(7), earned=state.earned.length;
 const claims=p.questClaims[state.date]||[];
 const quests=[
  {id:'tasks',title:'دو وظیفه را کامل کن',desc:'قدم‌های امروزت را جلو ببر',icon:'✓',progress:doneTasks,target:2,xp:20,gems:10},
  {id:'habits',title:'دو عادت را انجام بده',desc:'برای استمرار خودت وقت بگذار',icon:'🌱',progress:doneHabits,target:2,xp:15,gems:8},
  {id:'water',title:'چهار لیوان آب ثبت کن',desc:'یادت نره به خودت رسیدگی کنی',icon:'💧',progress:state.water,target:4,xp:10,gems:5}
 ];
 const shopItems=Object.entries(avatarChoices).flatMap(([cat,items])=>items.filter(item=>item.cost).map(item=>({cat,item})));
 const visibleShopItems=shopItems.filter(({cat})=>activeShopCategory==='all'||cat===activeShopCategory);
 const shopTabs=[['all','همه'],['outfitStyle','لباس'],['accessory','اکسسوری'],['hairStyle','مو'],['background','پس‌زمینه'],['expression','حالت چهره']];
 const tabs=avatarCategories.map(c=>'<button type="button" class="duo-avatar-tab '+(activeAvatarCategory===c.id?'active':'')+'" data-avatar-tab="'+c.id+'"><span>'+c.icon+'</span><b>'+c.label+'</b></button>').join('');
 const options=(avatarChoices[activeAvatarCategory]||[]).map(item=>{
  const key=activeAvatarCategory+':'+item.value,locked=!!item.cost&&!p.unlocked.includes(key),selected=p[activeAvatarCategory]===item.value;
  const visual=item.swatch?'<span class="duo-swatch" style="--swatch:'+item.swatch+'"></span>':'<span class="duo-option-symbol">'+(item.icon||'✦')+'</span>';
  return '<button type="button" class="duo-option '+(selected?'selected ':'')+(locked?'locked':'')+'" data-avatar-choice="'+activeAvatarCategory+'" data-avatar-value="'+item.value+'" data-avatar-cost="'+(item.cost||0)+'">'+visual+'<strong>'+item.label+'</strong>'+(locked?'<small>🔒 '+item.cost+' 💎</small>':selected?'<small>انتخاب شده</small>':'')+'</button>';
 }).join('');
 const shopTabsHTML=shopTabs.map(([id,label])=>'<button type="button" class="duo-shop-filter '+(activeShopCategory===id?'active':'')+'" data-shop-filter="'+id+'">'+label+'</button>').join('');
 const shopHTML=visibleShopItems.map(({cat,item})=>{
  const key=cat+':'+item.value,unlocked=p.unlocked.includes(key),selected=p[cat]===item.value;
  const visual=item.swatch?'<span class="duo-shop-swatch" style="--swatch:'+item.swatch+'"></span>':'<span class="duo-shop-symbol">'+(item.icon||'✦')+'</span>';
  return '<article class="duo-shop-item '+(unlocked?'owned':'')+' '+(selected?'equipped':'')+'"><div class="duo-shop-art">'+visual+'</div><div class="duo-shop-copy"><strong>'+item.label+'</strong><small>'+(unlocked?(selected?'روی شخصیتت':'در کمد تو'):'یک آیتم تازه')+'</small></div><button type="button" data-shop-key="'+key+'">'+(unlocked?(selected?'✓ فعال':'استفاده'):'💎 '+item.cost)+'</button></article>';
 }).join('');
 const questHTML=quests.map(q=>{
  const claimed=claims.includes(q.id),ready=q.progress>=q.target;
  return '<article class="duo-quest '+(claimed?'claimed':'')+'"><span class="duo-quest-icon">'+q.icon+'</span><div class="duo-quest-main"><strong>'+q.title+'</strong><small>'+q.desc+'</small><div class="duo-quest-track"><i style="width:'+Math.min(100,q.progress/q.target*100)+'%"></i></div><small>'+Math.min(q.progress,q.target)+' از '+q.target+'</small></div><div class="duo-quest-reward"><b>+'+q.xp+' XP</b><small>💎 '+q.gems+'</small><button type="button" data-profile-quest="'+q.id+'" '+(!ready||claimed?'disabled':'')+'>'+(claimed?'گرفته شد':ready?'دریافت':'ادامه بده')+'</button></div></article>';
 }).join('');
 const badgeHTML=badges.map(b=>{
  const has=state.earned.includes(b.id);
  return '<article class="duo-badge '+(has?'earned':'locked')+'"><span class="duo-badge-art">'+badgeArt(b.id)+'</span><strong>'+b.title+'</strong><small>'+(has?'به دست آمده':b.description)+'</small></article>';
 }).join('');
 const tabButton=(id,label,icon)=>'<button type="button" class="duo-profile-nav '+(activeProfileTab===id?'active':'')+'" data-profile-tab="'+id+'"><span>'+icon+'</span>'+label+'</button>';
 let content='';
 if(activeProfileTab==='creator'){
  content='<section class="duo-builder"><div class="duo-builder-top"><div class="duo-preview-copy"><span class="duo-kicker">AVATAR CREATOR</span><h3>شخصیتت رو بساز!</h3><p>ترکیب‌های مختلف رو امتحان کن؛ هر تغییری همون لحظه ذخیره می‌شه.</p><div class="duo-save-state"><i></i> ذخیره خودکار روشنه</div></div><div class="duo-live-preview"><div class="duo-preview-halo"></div>'+avatarMarkup('preview')+'<span class="duo-preview-name">'+plusEscape(p.displayName)+'</span><span class="duo-preview-level">LV. '+level+'</span></div></div><div class="duo-style-picker"><strong>استایل شروع شخصیت</strong><div><button type="button" data-avatar-gender="boy" class="'+(p.gender==='boy'?'active':'')+'">پسر</button><button type="button" data-avatar-gender="girl" class="'+(p.gender==='girl'?'active':'')+'">دختر</button><button type="button" data-avatar-gender="neutral" class="'+(p.gender==='neutral'?'active':'')+'">خنثی</button></div><small>این انتخاب فقط ظاهر اولیه را پیشنهاد می‌دهد؛ همه‌ی مدل موها و آیتم‌ها برای همه آزادند.</small></div><div class="duo-editor"><div class="duo-editor-heading"><div><span class="duo-kicker">PERSONALIZE</span><h4>جزئیات شخصیت</h4></div><span class="duo-editor-hint">یک دسته رو انتخاب کن</span></div><div class="duo-avatar-tabs">'+tabs+'</div><div class="duo-options-grid">'+(options||'<p>گزینه‌ای برای نمایش وجود ندارد.</p>')+'</div></div><form id="profile-name-form" class="duo-name-form"><label for="duo-display-name">اسم شخصیت</label><input id="duo-display-name" name="displayName" maxlength="32" value="'+plusEscape(p.displayName)+'" placeholder="اسم دلخواهت"><button type="submit">ذخیره اسم</button></form></section>';
 }else if(activeProfileTab==='closet'){
  content='<section class="duo-closet"><div class="duo-section-title"><div><span class="duo-kicker">YOUR COLLECTION</span><h3>کمد و فروشگاه</h3><p>آیتم‌های بازشده رو بپوش یا با کریستال‌ها آیتم تازه بگیر.</p></div><span class="duo-gem-total">💎 '+state.gems.toLocaleString('fa-IR')+'</span></div><div class="duo-shop-filters">'+shopTabsHTML+'</div><div class="duo-shop-grid">'+(shopHTML||'<p class="duo-empty">در این دسته آیتم تازه‌ای نیست.</p>')+'</div><div class="duo-closet-note">آیتم‌هایی که باز می‌کنی برای همیشه در کمدت می‌مونن.</div></section>';
 }else{
  content='<section class="duo-missions"><div class="duo-section-title"><div><span class="duo-kicker">DAILY QUESTS</span><h3>مأموریت‌های امروز</h3><p>با کارهای کوچیک، XP و کریستال جمع کن.</p></div><span class="duo-mission-count">'+claims.length+' / '+quests.length+'</span></div><div class="duo-quest-list">'+questHTML+'</div></section><section class="duo-achievements"><div class="duo-section-title"><div><span class="duo-kicker">ACHIEVEMENTS</span><h3>نشان‌های من</h3><p>'+earned+' نشان از '+badges.length+' نشان رو گرفتی.</p></div><span class="duo-mission-count">🏅 '+earned+'</span></div><div class="duo-badge-grid">'+badgeHTML+'</div></section>';
 }
 root.innerHTML='<section class="duo-profile-hero"><div class="duo-profile-intro"><span class="duo-kicker">MY LIFE · YOUR WORLD</span><h2>دنیای شخصیت تو</h2><p>شخصیتت رو بساز، آیتم جمع کن و پیشرفتت رو جشن بگیر.</p><div class="duo-level-line"><strong>سطح '+level+'</strong><span>'+xpInLevel+' / ۱۰۰ XP تا سطح بعدی</span></div><div class="duo-level-track"><i style="width:'+xpInLevel+'%"></i></div><div class="duo-profile-stats"><span>⭐ '+state.xp.toLocaleString('fa-IR')+' XP</span><span>💎 '+state.gems.toLocaleString('fa-IR')+'</span><span>🔥 '+state.streak+' روز</span></div></div><div class="duo-profile-avatar">'+avatarMarkup('large')+'</div></section><nav class="duo-profile-navigation">'+tabButton('creator','شخصیت‌ساز','✦')+tabButton('closet','کمد و فروشگاه','▣')+tabButton('missions','مأموریت‌ها','⚑')+'</nav>'+content+'<div class="duo-profile-footnote"><span>این هفته</span><strong>'+weekXP.toLocaleString('fa-IR')+' XP</strong><span>·</span><span>'+state.totalTasksCompleted.toLocaleString('fa-IR')+' وظیفه و '+state.totalHabitsCompleted.toLocaleString('fa-IR')+' عادت کامل‌شده</span></div>';
 root.querySelectorAll('[data-profile-tab]').forEach(btn=>btn.addEventListener('click',()=>{activeProfileTab=btn.dataset.profileTab;mountProfile(main);}));
 root.querySelectorAll('[data-avatar-tab]').forEach(btn=>btn.addEventListener('click',()=>{activeAvatarCategory=btn.dataset.avatarTab;mountProfile(main);}));
 root.querySelectorAll('[data-avatar-gender]').forEach(btn=>btn.addEventListener('click',()=>{
  const gender=btn.dataset.avatarGender;if(!['boy','girl','neutral'].includes(gender))return;
  p.gender=gender;p.genderInitialized=true;
  if(gender==='boy')p.hairStyle='short';else if(gender==='girl')p.hairStyle='long';else p.hairStyle='wave';
  plusSave();mountProfile(main);
 }));
 root.querySelectorAll('[data-avatar-choice]').forEach(btn=>btn.addEventListener('click',()=>{
  const cat=btn.dataset.avatarChoice,val=btn.dataset.avatarValue,key=cat+':'+val;
  if(btn.dataset.avatarCost&&!p.unlocked.includes(key)){activeProfileTab='closet';activeShopCategory=cat;mountProfile(main);showToast('این آیتم در فروشگاه منتظرته.');return;}
  p[cat]=val;plusSave();mountProfile(main);
 }));
 root.querySelectorAll('[data-shop-filter]').forEach(btn=>btn.addEventListener('click',()=>{activeShopCategory=btn.dataset.shopFilter;mountProfile(main);}));
 root.querySelectorAll('[data-shop-key]').forEach(btn=>btn.addEventListener('click',()=>{
  const key=btn.dataset.shopKey,[cat,val]=key.split(':');
  const item=(avatarChoices[cat]||[]).find(x=>x.value===val);if(!item)return;
  if(p.unlocked.includes(key)){p[cat]=val;plusSave();mountProfile(main);showToast('آیتم روی شخصیتت قرار گرفت.');return;}
  const cost=Number(item.cost||0);if(state.gems<cost){showToast('کریستال کافی نداری؛ مأموریت‌ها رو کامل کن.');return;}
  state.gems-=cost;p.unlocked.push(key);p[cat]=val;plusSave();mountProfile(main);showToast('آیتم باز شد و به کمدت اضافه شد!');
 }));
 root.querySelector('#profile-name-form')?.addEventListener('submit',e=>{
  e.preventDefault();const val=new FormData(e.currentTarget).get('displayName').trim();
  if(!val)return;p.displayName=val;plusSave();mountProfile(main);showToast('اسم شخصیت ذخیره شد.');
 });
 root.querySelectorAll('[data-profile-quest]').forEach(btn=>btn.addEventListener('click',()=>{
  const q=quests.find(x=>x.id===btn.dataset.profileQuest);
  if(!q||q.progress<q.target||claims.includes(q.id))return;
  p.questClaims[state.date]=claims.concat(q.id);state.gems+=q.gems;addXP(q.xp);plusSave();mountProfile(main);showToast('پاداش مأموریت دریافت شد!');
 }));
}
function plusRender() {
  originalRender();
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
      '<div class="plus-actions"><button id="plus-export">↓ دریافت نسخه پشتیبان</button><label class="plus-import">↑ بازیابی نسخه پشتیبان<input id="plus-import-file" type="file" accept="application/json"></label><button id="plus-theme">' + (state.settings.theme === 'dark' ? '☀ حالت روشن' : '☾ حالت تاریک') + '</button></div>' +
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
    link.click(); URL.revokeObjectURL(url);
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
        state = {
          ...structuredClone(defaultState), ...state, ...imported,
          profile: { ...defaultState.profile, ...(state.profile || {}), ...(imported.profile || {}) },
          settings: { ...plusDefaults, ...(state.settings || {}), ...(imported.settings || {}) },
          tasks: Array.isArray(imported.tasks) ? imported.tasks : state.tasks,
          habits: Array.isArray(imported.habits) ? imported.habits : state.habits,
          earned: Array.isArray(imported.earned) ? imported.earned : state.earned,
          journal: { ...(state.journal || {}), ...(imported.journal || {}) },
          xpByDate: { ...(state.xpByDate || {}), ...(imported.xpByDate || {}) }
        };
        state.profile.unlocked = Array.isArray(state.profile.unlocked) ? state.profile.unlocked : [];
        state.profile.questClaims = state.profile.questClaims && typeof state.profile.questClaims === 'object' ? state.profile.questClaims : {};
        plusSave(); plusRender(); showToast('اطلاعات با موفقیت بازیابی شد');
      } catch { showToast('فایل انتخاب‌شده معتبر نیست'); }
    };
    reader.readAsText(file);
  });
  document.getElementById('plus-theme').addEventListener('click', () => {
    state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
    plusSave(); plusRender();
  });
}
render = function() { plusRender(); };
render();
