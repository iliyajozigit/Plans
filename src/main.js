
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
  profile: { displayName: 'ماجراجوی My Life', bio: 'در مسیر نسخه بهتر خودم ✨', skin: '#d99b72', hairColor: '#49312f', hairStyle: 'wave', eyeColor: '#4b8177', outfitStyle: 'hoodie', outfitColor: '#7666df', accessory: 'glasses', background: 'blossom', unlocked: [], questClaims: {} },
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
  { id: 'focus-master', title: 'استاد تمرکز', description: '۵ جلسه تمرکز انجام بده', icon: '🧠', color: 'orange', target: 5, type: 'focus' },
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
          <div class="brand-icon">✦</div>
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
            <h1>${({dashboard:'روزت رو بساز',planner:'برنامه‌ریزی هوشمند',growth:'مسیر رشد تو',profile:'شخصیت و افتخارات من',focus:'فضای تمرکز',journal:'دفتر شخصی',settings:'تنظیمات'})[activeView]} <span class="wave">✦</span></h1>
            <p class="date-text" id="live-date">${formatDate()}</p>
          </div>

          <div class="topbar-right">
            <div class="level-pill">⭐ سطح ${getLevel()}</div><div class="level-pill gem-wallet">💎 ${state.gems.toLocaleString('fa-IR')}</div>
            <button class="avatar profile-shortcut" data-view="profile" aria-label="رفتن به پروفایل">✦</button>
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
            <span class="daily-path-progress">\${Math.round((taskPercent + habitPercent) / 2)}٪</span>
          </div>
          <div class="daily-path-steps">
            <a href="#planner" data-view="planner" class="daily-path-step \${completedTasks > 0 ? 'step-started' : ''}">
              <span class="daily-step-node">✓</span><span><strong>برنامه‌ریزی</strong><small>\${completedTasks} از \${state.tasks.length} وظیفه</small></span><b>←</b>
            </a>
            <a href="#planner" data-view="planner" class="daily-path-step \${completedHabits > 0 ? 'step-started' : ''}">
              <span class="daily-step-node">🌱</span><span><strong>ساخت عادت</strong><small>\${completedHabits} از \${state.habits.length} عادت</small></span><b>←</b>
            </a>
            <a href="#focus" data-view="focus" class="daily-path-step \${state.focusSessions > 0 ? 'step-started' : ''}">
              <span class="daily-step-node">◷</span><span><strong>تمرکز عمیق</strong><small>\${state.focusSessions} جلسه کامل‌شده</small></span><b>←</b>
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
            <div class="badge-trophy" aria-hidden="true"><span>🏆</span><i>✦</i></div>
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
                    <div class="badge-emblem"><span>${badge.icon}</span></div>
                    <span class="badge-emblem-spark">✦</span>
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
          <div class="page-intro"><span class="eyebrow">YOUR PRIVATE SPACE</span><h2>دفتر شخصی</h2><p>فکرها و ایده‌هایت را اینجا ثبت کن؛ فقط برای خودت.</p></div>
        <section class="panel notes-panel" id="notes">
          <div class="section-heading">
            <div>
              <span class="eyebrow">THOUGHTS & IDEAS</span>
              <h2>دفتر یادداشت من</h2>
            </div>
            <span class="notes-icon">✎</span>
          </div>

          <textarea
            id="notes-input"
            placeholder="ایده‌ها، افکار و اتفاقات امروزت رو اینجا بنویس..."
          >${escapeHTML(state.notes)}</textarea>

          <div class="notes-footer">
            <span id="save-status">ذخیره خودکار فعال است</span>
          </div>
        </section>

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
      if (heading) heading.innerHTML = `${titles[activeView]} <span class="wave">✦</span>`;
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

  $('#notes-input').addEventListener('input', e => {
    state.notes = e.target.value;
    save();
    $('#save-status').textContent = 'ذخیره شد ✓';
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

      showToast('جلسه تمرکزت با موفقیت تمام شد! 🧠');
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
state.settings = { ...plusDefaults, ...(state.settings || {}) };

function plusEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function plusSave() {
  localStorage.setItem('myLifeState', JSON.stringify(state));
}

const avatarCategories = [
  {id:'skin',label:'پوست',icon:'◉'},{id:'hairStyle',label:'مدل مو',icon:'✂'},
  {id:'hairColor',label:'رنگ مو',icon:'🎨'},{id:'eyeColor',label:'چشم‌ها',icon:'◉'},
  {id:'outfitStyle',label:'لباس',icon:'👕'},{id:'outfitColor',label:'رنگ لباس',icon:'🧵'},
  {id:'accessory',label:'اکسسوری',icon:'✦'},{id:'background',label:'پس‌زمینه',icon:'🌈'}
];
let activeAvatarCategory = 'skin';
const avatarChoices = {
 skin:[['#f4d0b1','روشن'],['#e8b58d','گندمی روشن'],['#d99b72','گندمی'],['#b97855','کاراملی'],['#8c573f','قهوه‌ای'],['#633e35','تیره']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 hairStyle:[['short','کوتاه','✂️'],['wave','موج‌دار','〰️'],['curly','فر','🌀'],['long','بلند','💇']].map(x=>({value:x[0],label:x[1],icon:x[2]})),
 hairColor:[['#302321','مشکی'],['#49312f','قهوه‌ای'],['#87513a','فندقی'],['#d6a04d','بلوند'],['#a65e91','یاسی'],['#6376c9','آبی']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 eyeColor:[['#4b8177','سبزآبی'],['#5574aa','آبی'],['#694b37','قهوه‌ای'],['#747b8d','خاکستری']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 outfitStyle:[{value:'tee',label:'تی‌شرت',icon:'👕'},{value:'hoodie',label:'هودی',icon:'🧥'},{value:'jacket',label:'کت',icon:'🧥',cost:55},{value:'star',label:'ستاره‌ای',icon:'🌟',cost:85},{value:'galaxy',label:'کهکشانی',icon:'🌌',cost:120}],
 outfitColor:[['#7666df','بنفش'],['#4caa83','سبز'],['#e77d9f','صورتی'],['#4f83bd','آبی'],['#e59b4e','نارنجی'],['#38465d','سرمه‌ای']].map(x=>({value:x[0],label:x[1],swatch:x[0]})),
 accessory:[{value:'none',label:'بدون اکسسوری',icon:'—'},{value:'glasses',label:'عینک کلاسیک',icon:'👓'},{value:'round',label:'عینک گرد',icon:'🕶️'},{value:'headphones',label:'هدفون',icon:'🎧',cost:35},{value:'flower',label:'گل ساکورا',icon:'🌸',cost:45},{value:'crown',label:'تاج افتخار',icon:'👑',cost:90}],
 background:[{value:'blossom',label:'شکوفه',icon:'🌸'},{value:'meadow',label:'چمنزار',icon:'🌿'},{value:'ocean',label:'اقیانوس',icon:'🌊'},{value:'sunset',label:'غروب',icon:'🌅'},{value:'lavender',label:'اسطوخودوس',icon:'💜',cost:40},{value:'galaxy',label:'کهکشان',icon:'🌌',cost:75}]
};
function avatarMarkup(size) {
 const p=state.profile;
 return '<div class="ml-avatar-stage '+(size||'large')+'" data-bg="'+plusEscape(p.background)+'"><span class="ml-avatar-spark spark-a">✦</span><span class="ml-avatar-spark spark-b">✧</span><div class="ml-avatar-person" data-hair="'+plusEscape(p.hairStyle)+'" data-outfit="'+plusEscape(p.outfitStyle)+'" data-accessory="'+plusEscape(p.accessory)+'" style="--skin:'+plusEscape(p.skin)+';--hair:'+plusEscape(p.hairColor)+';--eyes:'+plusEscape(p.eyeColor)+';--shirt:'+plusEscape(p.outfitColor)+'"><div class="ml-avatar-hair"></div><div class="ml-avatar-head"><i class="ml-eye left"></i><i class="ml-eye right"></i><i class="ml-smile"></i><i class="ml-glasses"></i><i class="ml-hair-fringe"></i></div><div class="ml-avatar-neck"></div><div class="ml-avatar-body"><span class="ml-shirt-detail">✦</span></div><i class="ml-avatar-arm arm-left"></i><i class="ml-avatar-arm arm-right"></i><span class="ml-avatar-accessory">'+(p.accessory==='flower'?'🌸':p.accessory==='crown'?'👑':p.accessory==='headphones'?'🎧':'')+'</span></div><span class="ml-avatar-base"></span></div>';
}
function mountProfile(main) {
 const root=main.querySelector('#profile-experience'); if(!root)return;
 const p=state.profile, level=getLevel(), xpInLevel=getLevelProgress();
 const doneTasks=state.tasks.filter(t=>t.done).length, doneHabits=state.habits.filter(h=>h.done).length;
 const todayXP=Number(state.xpByDate[today()]||0), weekXP=getRecentXP(7), earned=state.earned.length;
 const claims=p.questClaims[state.date]||[];
 const quests=[
  {id:'tasks',title:'دو وظیفه را کامل کن',desc:'پیشرفت در برنامه امروز',icon:'✓',progress:doneTasks,target:2,xp:20,gems:10},
  {id:'habits',title:'دو عادت را انجام بده',desc:'برای ساختن استمرار',icon:'🌱',progress:doneHabits,target:2,xp:15,gems:8},
  {id:'water',title:'چهار لیوان آب بنوش',desc:'به یاد مراقبت از خودت',icon:'💧',progress:state.water,target:4,xp:10,gems:5}
 ];
 const questHTML=quests.map(q=>{
  const claimed=claims.includes(q.id),ready=q.progress>=q.target;
  return '<article class="clean-quest '+(claimed?'is-claimed':'')+'"><span class="clean-quest-icon">'+q.icon+'</span><div class="clean-quest-copy"><strong>'+q.title+'</strong><small>'+q.desc+'</small><div class="clean-progress"><i style="width:'+Math.min(100,q.progress/q.target*100)+'%"></i></div><small>'+Math.min(q.progress,q.target)+' از '+q.target+'</small></div><button data-profile-quest="'+q.id+'" '+(!ready||claimed?'disabled':'')+'>'+(claimed?'دریافت شد':ready?'دریافت پاداش':'در حال انجام')+'</button><span class="clean-quest-reward">+'+q.xp+' XP · 💎 '+q.gems+'</span></article>';
 }).join('');
 const featured=[
  {cat:'outfitStyle',value:'jacket'},
  {cat:'accessory',value:'flower'},
  {cat:'accessory',value:'headphones'},
  {cat:'background',value:'lavender'},
  {cat:'accessory',value:'crown'},
  {cat:'background',value:'galaxy'}
 ];
 const shopHTML=featured.map(entry=>{
  const item=(avatarChoices[entry.cat]||[]).find(x=>x.value===entry.value);
  if(!item)return '';
  const key=entry.cat+':'+entry.value,unlocked=p.unlocked.includes(key),selected=p[entry.cat]===entry.value;
  return '<article class="clean-shop-item"><span class="clean-shop-icon">'+(item.icon||'✦')+'</span><div><strong>'+item.label+'</strong><small>'+(unlocked?(selected?'در حال استفاده':'در کمد تو'):'قابل بازکردن')+'</small></div><button data-shop-key="'+key+'" '+(unlocked?'disabled':'')+'>'+(unlocked?'✓':'💎 '+item.cost)+'</button></article>';
 }).join('');
 const tabs=avatarCategories.map(c=>'<button class="avatar-tab '+(activeAvatarCategory===c.id?'active':'')+'" data-avatar-tab="'+c.id+'"><span>'+c.icon+'</span>'+c.label+'</button>').join('');
 const options=(avatarChoices[activeAvatarCategory]||[]).map(item=>{
  const key=activeAvatarCategory+':'+item.value,unlocked=p.unlocked.includes(key),locked=!!item.cost&&!unlocked,selected=p[activeAvatarCategory]===item.value;
  const visual=item.swatch?'<span class="avatar-swatch" style="--swatch:'+item.swatch+'"></span>':'<span class="avatar-option-icon">'+(item.icon||'✦')+'</span>';
  return '<button class="avatar-choice '+(selected?'selected ':'')+(locked?'locked':'')+'" data-avatar-choice="'+activeAvatarCategory+'" data-avatar-value="'+item.value+'" data-avatar-cost="'+(item.cost||0)+'">'+visual+'<span>'+item.label+'</span>'+(locked?'<small>🔒 '+item.cost+' 💎</small>':selected?'<small>انتخاب‌شده ✓</small>':'')+'</button>';
 }).join('');
 const badgeHTML=badges.map(b=>{
  const has=state.earned.includes(b.id);
  return '<div class="profile-badge '+(has?'earned':'locked')+'"><span>'+b.icon+'</span><strong>'+b.title+'</strong><small>'+(has?'دریافت‌شده':b.description)+'</small></div>';
 }).join('');
 root.innerHTML =
 '<section class="clean-profile-hero"><div class="clean-profile-copy"><span class="clean-kicker">MY LIFE PROFILE</span><div class="clean-name-row"><h2>'+plusEscape(p.displayName)+'</h2><span>سطح '+level+'</span></div><p>قدم‌های کوچک تو، مسیر بزرگت را می‌سازند.</p><div class="clean-xp-label"><strong>'+state.xp.toLocaleString('fa-IR')+' XP</strong><small>'+xpInLevel+' از ۱۰۰ تا سطح بعدی</small></div><div class="clean-xp-track"><i style="width:'+xpInLevel+'%"></i></div><div class="clean-wallet-row"><span>💎 '+state.gems.toLocaleString('fa-IR')+' کریستال</span><span>🔥 '+state.streak.toLocaleString('fa-IR')+' روز پیاپی</span></div></div>'+avatarMarkup('large')+'</section>'+
 '<div class="clean-stat-strip"><div><span>⭐</span><strong>'+state.xp.toLocaleString('fa-IR')+'</strong><small>کل XP</small></div><div><span>🔥</span><strong>'+state.longestStreak.toLocaleString('fa-IR')+'</strong><small>بهترین استریک</small></div><div><span>🏅</span><strong>'+earned+' / '+badges.length+'</strong><small>نشان‌ها</small></div><div><span>📆</span><strong>'+todayXP.toLocaleString('fa-IR')+'</strong><small>XP امروز</small></div></div>'+
 '<section class="clean-section"><div class="clean-section-head"><div><span class="clean-kicker">DAILY QUESTS</span><h3>مأموریت‌های امروز</h3><p>با انجام کارهای روزانه، XP و کریستال بگیر.</p></div><span class="clean-section-mark">🎁</span></div><div class="clean-quest-list">'+questHTML+'</div></section>'+
 '<section class="clean-section"><div class="clean-section-head"><div><span class="clean-kicker">CRYSTAL SHOP</span><h3>فروشگاه کریستال</h3><p>با کریستال‌هایی که جمع می‌کنی، ظاهر شخصیتت را باز کن.</p></div><span class="clean-shop-balance">💎 '+state.gems.toLocaleString('fa-IR')+'</span></div><div class="clean-shop-grid">'+shopHTML+'</div></section>'+
 '<details class="clean-details"><summary><span>🎨</span><div><strong>شخصی‌سازی شخصیت</strong><small>رنگ، مدل مو، لباس و اکسسوری</small></div><b>+</b></summary><div class="clean-details-body"><div class="avatar-studio-layout"><div class="avatar-preview-column">'+avatarMarkup('preview')+'<strong>'+plusEscape(p.displayName)+'</strong></div><div class="avatar-editor"><div class="avatar-tabs">'+tabs+'</div><div class="avatar-options">'+options+'</div></div></div><form id="profile-name-form" class="profile-name-form"><label>نام نمایشی</label><input name="displayName" maxlength="32" value="'+plusEscape(p.displayName)+'" placeholder="اسم دلخواهت"><button type="submit">ذخیره</button></form></div></details>'+
 '<details class="clean-details"><summary><span>🏆</span><div><strong>نشان‌های من</strong><small>'+earned+' نشان از '+badges.length+' نشان دریافت شده</small></div><b>+</b></summary><div class="clean-details-body"><div class="profile-badge-grid">'+badgeHTML+'</div></div></details>'+
 '<div class="clean-week-note">این هفته <strong>'+weekXP.toLocaleString('fa-IR')+' XP</strong> جمع کرده‌ای · '+state.totalTasksCompleted.toLocaleString('fa-IR')+' وظیفه و '+state.totalHabitsCompleted.toLocaleString('fa-IR')+' عادت کامل‌شده</div>';
 root.querySelectorAll('[data-avatar-tab]').forEach(btn=>btn.addEventListener('click',()=>{activeAvatarCategory=btn.dataset.avatarTab;mountProfile(main);}));
 root.querySelectorAll('[data-avatar-choice]').forEach(btn=>btn.addEventListener('click',()=>{
  const cat=btn.dataset.avatarChoice,val=btn.dataset.avatarValue,cost=Number(btn.dataset.avatarCost||0),key=cat+':'+val;
  if(cost&&!p.unlocked.includes(key)){showToast('این آیتم را از فروشگاه با کریستال باز کن.');return;}
  p[cat]=val;plusSave();mountProfile(main);
 }));
 root.querySelectorAll('[data-shop-key]').forEach(btn=>btn.addEventListener('click',()=>{
  const key=btn.dataset.shopKey,[cat,val]=key.split(':');
  const item=(avatarChoices[cat]||[]).find(x=>x.value===val);
  if(!item||p.unlocked.includes(key))return;
  const cost=Number(item.cost||0);
  if(state.gems<cost){showToast('کریستال کافی نداری؛ مأموریت‌ها را کامل کن.');return;}
  state.gems-=cost;p.unlocked.push(key);plusSave();mountProfile(main);showToast('آیتم به کمدت اضافه شد!');
 }));
 root.querySelector('#profile-name-form')?.addEventListener('submit',e=>{
  e.preventDefault();const val=new FormData(e.currentTarget).get('displayName').trim();
  if(!val)return;p.displayName=val;plusSave();mountProfile(main);showToast('نام نمایشی ذخیره شد.');
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
      '<div class="plus-heading"><div><span class="eyebrow">YOUR BIG PICTURE</span><h2>🎯 هدف‌های من</h2><p>هدف‌های مهمت رو ثبت کن و قدم‌به‌قدم جلو برو.</p></div><span class="plus-chip">' + state.goals.filter(g => g.done).length + ' / ' + state.goals.length + ' انجام‌شده</span></div>' +
      '<form id="plus-goal-form" class="plus-form"><input name="title" maxlength="90" placeholder="مثلاً: یادگیری یک مهارت جدید..." required><button>افزودن هدف +</button></form>' +
      '<div class="plus-goal-list">' + (state.goals.length ? state.goals.map(g => '<div class="plus-goal ' + (g.done ? 'done' : '') + '"><button data-plus="goal-toggle" data-id="' + g.id + '">' + (g.done ? '✓' : '○') + '</button><span>' + plusEscape(g.title) + '</span><button class="remove" data-plus="goal-delete" data-id="' + g.id + '">×</button></div>').join('') : '<div class="plus-empty">هنوز هدفی ثبت نکردی؛ اولین هدفت رو اضافه کن ✨</div>') + '</div>' +
    '</div>' +
    '<div class="panel plus-panel" id="plus-journal">' +
      '<div class="plus-heading"><div><span class="eyebrow">DAILY REFLECTION</span><h2>📔 ژورنال روزانه</h2><p>اتفاق‌ها، ایده‌ها و چیزهایی که یاد گرفتی.</p></div><span class="plus-chip">ذخیره خودکار</span></div>' +
      '<textarea id="plus-journal-input" placeholder="امروز چه چیزی برات ارزشمند بود؟">' + plusEscape(state.journal[state.date] || '') + '</textarea>' +
      '<div class="plus-journal-foot"><span id="plus-journal-status">اطلاعات فقط روی همین دستگاه ذخیره می‌شود.</span><span id="plus-journal-count">' + (state.journal[state.date] || '').length + ' کاراکتر</span></div>' +
    '</div>' +
    '<div class="panel plus-panel plus-backup">' +
      '<div class="plus-heading"><div><span class="eyebrow">YOUR DATA, YOUR CONTROL</span><h2>🛡️ مدیریت اطلاعات</h2><p>از اطلاعاتت نسخه پشتیبان بگیر یا آن را بازیابی کن.</p></div></div>' +
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
        state = { ...state, ...imported, settings: { ...state.settings, ...(imported.settings || {}) } };
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
